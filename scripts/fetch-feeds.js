#!/usr/bin/env node
/*
 * fetch-feeds.js — deterministic raw-feed ingestion for the daily pipeline.
 *
 * Pulls the RSS/Atom/GDELT feeds registered in schemas/feeds.json into one
 * local digest so headline DISCOVERY becomes a file read instead of a search
 * budget. The digest is leads-only: nothing in it is a citable source, and
 * event records still need their own primary sourcing (see 2-plan.md step 3c).
 *
 * Outputs (all under automation/):
 *   automation/context/raw-feed-<DATE>.json           — full digest (drill-down)
 *   automation/context/raw-feed-<DATE>-headlines.md   — compact one-line-per-item
 *                                                       view; what the planner /
 *                                                       evening check / /wires
 *                                                       actually read first
 *   automation/research/feed-health-log.jsonl         — one appended line per run
 *                                                       (feed-rot tracking; never
 *                                                       rotated, like the token log)
 *
 * BEST-EFFORT BY DESIGN. Every feed is wrapped; any/all failures still exit 0
 * and still write the digest (feeds_ok: 0 means "ran and got nothing", which
 * is different from "never ran"). It must NEVER break the pipeline.
 * Idempotent: a same-day re-run overwrites the same digest files.
 *
 * Parsing is dependency-free regex (house idiom — see update-markets.js's
 * extractAaa* scrapers): RSS 2.0 <item> and Atom <entry>, CDATA, entities,
 * link-href vs link-text, RFC822/ISO dates. If a feed ever proves IP-blocked,
 * the escalation path is update-markets.js's proxyChain — not a dependency.
 *
 * Kept OUT of `npm test` on purpose so validation/build stay network-free.
 *
 * Run: npm run fetch:feeds   (or: node scripts/fetch-feeds.js)
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG = path.join(ROOT, 'schemas', 'feeds.json');
const OUTLETS = path.join(ROOT, 'schemas', 'known_outlets.json');
const META = path.join(ROOT, 'data', 'meta.json');
const OUT_DIR = path.join(ROOT, 'automation', 'context');
const HEALTH_LOG = path.join(ROOT, 'automation', 'research', 'feed-health-log.jsonl');

const log = (...a) => console.log('[fetch-feeds]', ...a);
const warn = (...a) => console.warn('[fetch-feeds] WARN', ...a);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const ACCEPT = 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7';
const GDELT_SPACING_MS = 1500;
const FUTURE_SLOP_MS = 6 * 3600 * 1000; // dated >6h ahead of now → undated (rule-#9 posture)

const FALLBACK_DEFAULTS = {
  window_hours: 36,
  max_window_hours: 120,
  overlap_hours: 12,
  per_feed_cap: 30,
  global_cap: 400,
  timeout_ms: 12000,
  summary_max_chars: 300,
  flag_terms: [],
  flag_categories: {},
};

// Adaptive lookback (added 2026-10-20, operator-directed). The pipeline runs
// on a ~60h gate, so a fixed 36h window left ~1.5 days of every gap in NO
// digest at all — the espionage, sabotage and posture stories of those days
// were never seen. The window now reaches back to the previous digest's
// generated_at (+ overlap), floored at window_hours and capped at
// max_window_hours. FEED_WINDOW_HOURS overrides it for a manual deep sweep.
function previousDigestAt(now) {
  let best = null;
  try {
    const recent = fs.readdirSync(OUT_DIR)
      .filter((f) => /^raw-feed-\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort().slice(-3); // date-named, so the newest three suffice
    for (const f of recent) {
      try {
        const g = Date.parse(readJson(path.join(OUT_DIR, f)).generated_at);
        // Ignore a same-session re-run (< 1h old) so a retry doesn't shrink the window.
        if (!isNaN(g) && g < now - 3600e3 && (best == null || g > best)) best = g;
      } catch (_) { /* unreadable digest — skip */ }
    }
  } catch (_) { /* no context dir yet */ }
  return best;
}

function resolveWindow(defaults, now) {
  const env = Number(process.env.FEED_WINDOW_HOURS);
  if (env > 0) return { hours: env, reason: 'FEED_WINDOW_HOURS override', since: null };
  const prev = previousDigestAt(now);
  if (prev == null) return { hours: defaults.window_hours, reason: 'no previous digest found', since: null };
  const gapH = (now - prev) / 3600e3 + defaults.overlap_hours;
  const hours = Math.min(defaults.max_window_hours, Math.max(defaults.window_hours, Math.ceil(gapH)));
  return { hours, reason: `since previous digest + ${defaults.overlap_hours}h overlap`, since: new Date(prev).toISOString() };
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// ---------------------------------------------------------------------------
// Text plumbing: CDATA → tags → entities, in that order. Entities run twice
// because feeds routinely double-encode titles (&amp;#8217;) — a second pass
// leaves clean text; a literal "&amp;amp;" in a headline is vanishingly rare.
// ---------------------------------------------------------------------------
const NAMED_ENTITIES = {
  lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’',
  lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—',
  ndash: '–', hellip: '…', middot: '·', amp: '&',
};

function fromCodePointSafe(n) {
  try { return String.fromCodePoint(n); } catch (_) { return ''; }
}

function decodeEntitiesOnce(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => fromCodePointSafe(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => fromCodePointSafe(parseInt(h, 16)))
    .replace(/&(lt|gt|quot|apos|nbsp|rsquo|lsquo|rdquo|ldquo|mdash|ndash|hellip|middot);/g,
      (_, name) => NAMED_ENTITIES[name])
    .replace(/&amp;/g, '&'); // LAST, so &amp;lt; decodes in the second pass, not this one
}

function cleanText(raw) {
  if (!raw) return '';
  let s = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntitiesOnce(decodeEntitiesOnce(s));
  // Strip again: outlets like the Guardian ship entity-encoded HTML
  // (&lt;p&gt;…) that only becomes real tags after the decode above.
  s = s.replace(/<[^>]+>/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

function cleanLink(raw) {
  if (!raw) return '';
  let s = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  return decodeEntitiesOnce(s).replace(/\s+/g, '').trim(); // no tag-strip; URLs keep their &
}

function truncate(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trimEnd() + '…';
}

// ---------------------------------------------------------------------------
// Feed-XML extraction (RSS 2.0 <item>, RSS 1.0/RDF <item>, Atom <entry>).
// ---------------------------------------------------------------------------
function pickTag(xml, names) {
  for (const name of names) {
    const re = new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>', 'i');
    const m = re.exec(xml);
    if (m && m[1] != null && m[1].trim() !== '') return m[1];
  }
  return '';
}

function extractLink(itemXml) {
  // RSS text-content form first. Atom's self-closing <link/> can't match this,
  // so trying it unconditionally is safe.
  const textLink = /<link(?:\s[^>]*)?>\s*([^<\s][\s\S]*?)<\/link>/i.exec(itemXml);
  if (textLink) return cleanLink(textLink[1]);
  // Atom attribute form: prefer rel="alternate", then rel-less (alternate by
  // default per spec), then any href at all.
  let alt = null, norel = null, any = null;
  for (const tag of itemXml.match(/<link\b[^>]*>/gi) || []) {
    const href = /href\s*=\s*(["'])([\s\S]*?)\1/i.exec(tag);
    if (!href) continue;
    if (/rel\s*=\s*(["'])alternate\1/i.test(tag)) alt = alt || href[2];
    else if (!/rel\s*=/i.test(tag)) norel = norel || href[2];
    any = any || href[2];
  }
  if (alt || norel || any) return cleanLink(alt || norel || any);
  const guid = /<guid[^>]*isPermaLink\s*=\s*["']true["'][^>]*>([\s\S]*?)<\/guid>/i.exec(itemXml);
  return guid ? cleanLink(guid[1]) : '';
}

function decodeBody(buf) {
  let text = new TextDecoder('utf-8').decode(buf);
  const enc = /^\s*<\?xml[^>]*encoding=["']([^"']+)["']/i.exec(text);
  if (enc && !/^utf-?8$/i.test(enc[1])) {
    try { text = new TextDecoder(enc[1].toLowerCase()).decode(buf); }
    catch (_) { /* unknown label — keep the UTF-8 decode */ }
  }
  return text.replace(/^﻿/, '');
}

function parseFeedXml(xml, summaryMax) {
  const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi)
    || xml.match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi)
    || [];
  const items = [];
  for (const block of blocks) {
    const title = cleanText(pickTag(block, ['title']));
    if (!title) continue;
    const rawDate = cleanText(pickTag(block, ['pubDate', 'published', 'updated', 'dc:date']));
    const ts = rawDate ? Date.parse(rawDate) : NaN;
    const summarySrc = pickTag(block, ['description', 'summary']) || pickTag(block, ['content:encoded']);
    items.push({
      title,
      link: extractLink(block),
      ts: isNaN(ts) ? null : ts,
      summary: truncate(cleanText(summarySrc), summaryMax),
    });
  }
  return items;
}

// GDELT DOC 2.0 artlist JSON. seendate is compact "YYYYMMDDTHHMMSSZ".
function parseGdeltSeendate(s) {
  const m = /^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})Z?$/.exec(String(s || '').trim());
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

function parseGdeltJson(text) {
  const j = JSON.parse(text);
  if (!Array.isArray(j.articles)) return [];
  return j.articles.map((a) => ({
    title: cleanText(a.title || ''),
    link: a.url || '',
    ts: parseGdeltSeendate(a.seendate),
    summary: '',
    domain: a.domain || '',
  })).filter((it) => it.title);
}

// ---------------------------------------------------------------------------
// Per-feed fetch. Returns { status, items } and never throws.
// ---------------------------------------------------------------------------
async function fetchFeed(feed, defaults) {
  const status = { name: feed.name, outlet: feed.outlet, ok: false };
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), defaults.timeout_ms);
  try {
    const r = await fetch(feed.url, {
      signal: ac.signal,
      headers: { 'User-Agent': UA, 'Accept': feed.type === 'gdelt' ? 'application/json,*/*' : ACCEPT },
    });
    status.http_status = r.status;
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    // Redirect canary: a cross-host 301 (defense.gov→war.gov class) still works
    // today but is how the operator learns the config URL needs updating.
    try {
      const finalHost = new URL(r.url).host;
      const configHost = new URL(feed.url).host;
      if (finalHost !== configHost) {
        status.final_host = finalHost;
        warn(`${feed.name}: redirected ${configHost} -> ${finalHost} — update the URL in schemas/feeds.json`);
      }
    } catch (_) { /* URL parse failure is not worth failing the feed over */ }
    const items = feed.type === 'gdelt'
      ? parseGdeltJson(new TextDecoder('utf-8').decode(await r.arrayBuffer()))
      : parseFeedXml(decodeBody(await r.arrayBuffer()), defaults.summary_max_chars);
    if (items.length === 0) throw new Error('no items parsed (empty or unrecognized feed body)');
    status.ok = true;
    status.items_found = items.length;
    return { status, items };
  } catch (e) {
    status.error = e && e.message ? e.message : String(e);
    warn(`${feed.name} (${feed.outlet}): ${status.error}`);
    return { status, items: [] };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  let config;
  try {
    config = readJson(CONFIG);
  } catch (e) {
    warn(`cannot read schemas/feeds.json (${e.message}) — nothing to do, exiting clean`);
    return;
  }
  const defaults = { ...FALLBACK_DEFAULTS, ...(config.defaults || {}) };

  // Outlet directory: case-insensitive canonical+alias index → {canonical, tier}.
  // Soft check only — an unmatched outlet is a WARN and a flag, never fatal.
  const outletIndex = new Map();
  try {
    for (const o of readJson(OUTLETS).outlets || []) {
      const entry = { canonical: o.canonical, tier: o.tier };
      outletIndex.set(String(o.canonical).trim().toUpperCase(), entry);
      for (const a of o.aliases || []) outletIndex.set(String(a).trim().toUpperCase(), entry);
    }
  } catch (e) {
    warn(`cannot read known_outlets.json (${e.message}) — tier lookup disabled this run`);
  }

  // Day key: SYSTEM DATE (fixed 2026-08-26, operator-approved). Previously read meta.now first
// — at morning-fetch time the executor has not yet bumped it, so preferring it stamped every
// digest with yesterday's date and overwrote the prior day's files (5 days of history lost).
let dateKey = new Date().toISOString().slice(0, 10); // system date is always well-formed

  const now = Date.now();
  const win = resolveWindow(defaults, now);
  const windowMs = win.hours * 3600 * 1000;
  // Caps scale with the window so a 3-day gap isn't truncated to the newest 36h
  // of each high-volume feed.
  const scale = Math.max(1, win.hours / defaults.window_hours);
  const perFeedCap = (f) => Math.min(Math.ceil((f.max_items || defaults.per_feed_cap) * scale), 120);
  const globalCap = Math.min(Math.ceil(defaults.global_cap * scale), 1500);
  const enabled = (config.feeds || []).filter((f) => f.enabled !== false && f.url);
  const rssFeeds = enabled.filter((f) => f.type !== 'gdelt');
  const gdeltFeeds = enabled.filter((f) => f.type === 'gdelt').slice(0, 3) // hard cap 3, throttle-friendly
    .map((f) => ({ ...f, url: f.url.replace(/timespan=\d+h/, `timespan=${win.hours}h`) }));

  log(`${rssFeeds.length} rss + ${gdeltFeeds.length} gdelt feeds enabled; window ${win.hours}h (${win.reason}${win.since ? ', previous ' + win.since : ''})`);

  // RSS concurrently; GDELT sequentially after, spaced (the API 429s readily).
  const results = await Promise.all(rssFeeds.map((f) => fetchFeed(f, defaults)));
  for (const f of gdeltFeeds) {
    results.push(await fetchFeed(f, defaults));
    await new Promise((res) => setTimeout(res, GDELT_SPACING_MS));
  }

  // Window-filter + per-feed cap (newest first; undated kept but flagged),
  // then merge in config order — the config is ordered tier-1-first, so on a
  // dedupe collision the surviving copy carries the best outlet.
  const feedStatuses = [];
  const merged = [];
  const seenTitle = new Set();
  const seenLink = new Set();
  results.forEach((res, i) => {
    const feed = i < rssFeeds.length ? rssFeeds[i] : gdeltFeeds[i - rssFeeds.length];
    const dir = outletIndex.get(String(feed.outlet).trim().toUpperCase());
    let kept = 0;
    if (res.status.ok) {
      if (!dir && feed.type !== 'gdelt') warn(`${feed.name}: outlet "${feed.outlet}" not in known_outlets.json — items stamped directory_match:false`);
      const inWindow = res.items
        .map((it) => {
          const future = it.ts != null && it.ts > now + FUTURE_SLOP_MS;
          return { ...it, undated: it.ts == null || future };
        })
        .filter((it) => (it.undated ? !feed.drop_undated : now - it.ts <= windowMs))
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))
        .slice(0, perFeedCap(feed));
      for (const it of inWindow) {
        const titleKey = it.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        const linkKey = it.link || ` ${feed.name}:${titleKey}`;
        if (seenTitle.has(titleKey) || seenLink.has(linkKey)) continue;
        seenTitle.add(titleKey);
        seenLink.add(linkKey);
        const item = {
          outlet: feed.type === 'gdelt' ? (it.domain || 'unknown-domain') : (dir ? dir.canonical : feed.outlet),
          tier: feed.type === 'gdelt' ? 'unlisted' : (dir ? dir.tier : 'unlisted'),
          title: it.title,
          link: it.link,
          published: it.undated ? null : new Date(it.ts).toISOString(),
          summary: it.summary,
        };
        if (it.undated) item.undated = true;
        if (feed.type === 'gdelt') item.via_gdelt = true;
        if (!dir && feed.type !== 'gdelt') item.directory_match = false;
        merged.push(item);
        kept++;
      }
      res.status.items_kept = kept;
    }
    feedStatuses.push(res.status);
  });

  // Global order: dated newest-first, undated last. Then the global cap.
  merged.sort((a, b) => {
    if (!a.published && !b.published) return 0;
    if (!a.published) return 1;
    if (!b.published) return -1;
    return a.published < b.published ? 1 : a.published > b.published ? -1 : 0;
  });
  const items = merged.slice(0, globalCap);

  // Keyword triage — deterministic substring scan of titles. A triage aid for
  // the reader's eye, never a judgment: unflagged ≠ unimportant.
  // Legacy flag_terms are the KINETIC set; flag_categories (added 2026-10-20)
  // add the gray-zone / posture / strategic / economic / watch-region sets —
  // the tension-precursor stories the kinetic list never caught.
  const categories = { kinetic: defaults.flag_terms || [], ...(defaults.flag_categories || {}) };
  const flagged = [];
  const itemCats = items.map(() => new Set());
  for (const [cat, terms] of Object.entries(categories)) {
    for (const term of terms) {
      const idx = [];
      items.forEach((it, i) => {
        if (it.title.toLowerCase().includes(term.toLowerCase())) { idx.push(i); itemCats[i].add(cat); }
      });
      if (idx.length) flagged.push({ term, category: cat, count: idx.length, item_indexes: idx });
    }
  }
  const flaggedIdx = new Set(flagged.flatMap((f) => f.item_indexes));
  items.forEach((it, i) => { if (itemCats[i].size) it.flag_categories = [...itemCats[i]]; });
  // Tension-precursor leads: anything flagged outside the kinetic set. These are
  // the items 2-plan.md's digest-triage ledger must disposition one by one.
  const precursorIdx = items.map((_, i) => i).filter((i) => [...itemCats[i]].some((c) => c !== 'kinetic'));

  const feedsOk = feedStatuses.filter((s) => s.ok).length;
  const digest = {
    generated_at: new Date(now).toISOString(),
    date: dateKey,
    window_hours: win.hours,
    window_reason: win.reason,
    previous_digest_at: win.since,
    precursor_items: precursorIdx.length,
    feeds_ok: feedsOk,
    feeds_failed: feedStatuses.length - feedsOk,
    items_total: items.length,
    flagged,
    feeds: feedStatuses,
    items,
  };

  // Write everything, even on a total failure — "ran and got nothing" must be
  // distinguishable from "never ran" (generated_at is the tell).
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = path.join(OUT_DIR, `raw-feed-${dateKey}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(digest, null, 2) + '\n');

  // Compact headlines view — what the planner/evening check/wires read FIRST.
  const CAT_CODE = { kinetic: 'K', grayzone: 'G', posture: 'P', strategic: 'S', economic: 'E', regions: 'R' };
  const catMark = (i) => {
    if (!flaggedIdx.has(i)) return '';
    const codes = [...itemCats[i]].map((c) => CAT_CODE[c] || c[0].toUpperCase()).sort().join('');
    return ` ⚑${codes}`;
  };
  const line = (it, i) => it.published
    ? `- ${it.published.slice(5, 10)} ${it.published.slice(11, 16)}Z${catMark(i)} ${it.outlet} — ${it.title}`
    : `- (undated)${catMark(i)} ${it.outlet} — ${it.title}`;
  const mdLines = [
    `# Raw feed headlines — ${dateKey}`,
    '',
    `Generated ${digest.generated_at} · ${feedsOk}/${feedStatuses.length} feeds ok · ` +
      `${items.length} items · ${win.hours}h window (${win.reason}${win.since ? ', previous digest ' + win.since : ''}). ` +
      'Leads only — not citable sources; ⚑ = keyword-flagged (triage aid, not judgment). ' +
      'Codes: K kinetic · G gray-zone/hybrid · P military posture · S strategic/nuclear · E economic coercion · R watch region.',
    flagged.length
      ? `Flags: ${flagged.map((f) => `${f.term} (${f.count})`).join(', ')}`
      : 'Flags: none',
    '',
  ];
  // Tension-precursor block first: these are the non-kinetic leads the daily
  // runs historically skipped. 2-plan.md requires every one to be dispositioned.
  if (precursorIdx.length) {
    mdLines.push(`## Tension-precursor leads (${precursorIdx.length}) — triage every one in the plan's digest ledger`, '');
    for (const i of precursorIdx) mdLines.push(line(items[i], i));
    mdLines.push('', '## All items', '');
  }
  const dated = [];
  const undated = [];
  items.forEach((it, i) => (it.published ? dated : undated).push(line(it, i)));
  mdLines.push(...dated);
  if (undated.length) {
    mdLines.push('', '## Undated items (rule-#9 suspicion by default)', '', ...undated);
  }
  const mdPath = path.join(OUT_DIR, `raw-feed-${dateKey}-headlines.md`);
  fs.writeFileSync(mdPath, mdLines.join('\n') + '\n');

  // Feed-health log: longitudinal rot tracking. Append-only, never rotated.
  try {
    fs.mkdirSync(path.dirname(HEALTH_LOG), { recursive: true });
    fs.appendFileSync(HEALTH_LOG, JSON.stringify({
      date: dateKey,
      generated_at: digest.generated_at,
      feeds_ok: feedsOk,
      feeds_failed: feedStatuses.filter((s) => !s.ok).map((s) => s.name),
      items_total: items.length,
      window_hours: win.hours,
      precursor_items: precursorIdx.length,
    }) + '\n');
  } catch (e) {
    warn(`feed-health-log append failed: ${e.message}`);
  }

  log(`${feedsOk}/${feedStatuses.length} feeds ok, ${items.length} items` +
      ` (${undated.length} undated), ${flagged.length} flag terms hit, ${precursorIdx.length} tension-precursor leads`);
  log(`wrote ${path.relative(ROOT, jsonPath)} + headlines.md + health-log line`);
}

main().catch((e) => {
  // Absolute backstop: even an unexpected throw must not fail the pipeline.
  warn(`unexpected error: ${e && e.message ? e.message : e} — exiting clean`);
  process.exit(0);
});
