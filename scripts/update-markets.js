#!/usr/bin/env node
/*
 * update-markets.js — deterministic daily refresh of the DATED market series
 * that feed the bottom-KPI charts:
 *
 *   brent_daily [{d, v}]        — Brent crude daily close (Yahoo BZ=F, same feed
 *                                 the app's live tile uses)
 *   gas_daily   [{d, nat, ca?, diesel?}] — AAA US national (+ California) average
 *                                 regular gasoline, plus the US national diesel
 *                                 average, $/gal (same pages the app scrapes
 *                                 client-side for the live tiles)
 *
 * scripts/build.js merges these dated rows with the hand-pinned editorial
 * anchors in data/chart_series.json (anchors WIN on a date collision) to build
 * the gas_nat_series / brent_series the charts render, so the sparklines
 * densify daily instead of rotting between milestone pins.
 *
 * HISTORY NOTE — why the legacy arrays are frozen. markets.json also carries
 * undated legacy arrays (brent_history, gas_nat_history, gas_history). An
 * earlier version of this script misread gas_nat_history ("gas, national
 * average" — AAA gasoline in $/gal) as NATURAL GAS and appended NG=F Henry Hub
 * futures ($/MMBtu) to it for two weeks; no tile ever rendered Henry Hub. The
 * contaminated tail was excised 2026-07-22 and the legacy arrays are now
 * FROZEN historical records: this script never writes them, and staleness is
 * validated from the dated series the UI actually renders (validate-data.js),
 * not from side-channel stamps.
 *
 * AAA ladder backfill: each AAA page publishes Current / Yesterday / Week Ago /
 * Month Ago ladders — real AAA historical snapshots. Missing dates are
 * back-filled from the ladder (never overwriting an already-recorded value, and
 * never before the 2026-02-28 war start). No synthesis, no extrapolation —
 * standing rules honoured: live-fetched values only; a series that can't be
 * refreshed simply doesn't advance.
 *
 * BEST-EFFORT BY DESIGN. Every fetch is wrapped; on any failure the affected
 * series is left exactly as-is and the script still exits 0 — it must NEVER
 * break the pipeline. The planner's §9 fallback (automation/prompts/2-plan.md)
 * can append a live-fetched dated row when this script comes up empty; both
 * paths write the same row shapes, so they compose safely. Idempotent: a
 * same-day re-run overwrites today's row instead of duplicating it.
 *
 * Wiring: run BEFORE `npm run build` (see automation/prompts/5-execute.md).
 * Kept OUT of `npm test` on purpose so validation/build stay network-free.
 *
 * Run: npm run update:markets   (or: node scripts/update-markets.js)
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const MARKETS = path.join(DATA, 'markets.json');
const META = path.join(DATA, 'meta.json');

const log = (...a) => console.log('[update-markets]', ...a);
const warn = (...a) => console.warn('[update-markets] WARN', ...a);

const FETCH_TIMEOUT_MS = 12000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const WAR_START = '2026-02-28';   // never back-fill before the chart's origin
const DAILY_CAP = 400;            // mirrors escalation_history's cap

// ---------------------------------------------------------------------------
// Fetch plumbing — direct URL first, then the same CORS proxies src/js/app.js
// rotates through (harmless server-side, and they dodge per-IP throttles).
// ---------------------------------------------------------------------------
function proxyChain(url) {
  const enc = encodeURIComponent(url);
  return [
    url,
    `https://api.codetabs.com/v1/proxy/?quest=${enc}`,
    `https://api.allorigins.win/raw?url=${enc}`,
    `https://corsproxy.io/?url=${enc}`,
  ];
}

// Fetch each URL in turn and run `parse` on the body; a response that is HTTP
// 200 but unparseable (e.g. a bot-challenge page through a proxy) counts as a
// failure and the NEXT source is tried — same contract as the client's
// tryProxies, which is what makes the proxy rotation actually useful.
async function fetchParsed(urls, accept, parse) {
  const errs = [];
  for (const url of urls) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    try {
      const r = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': UA, 'Accept': accept } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = parse(await r.text());
      if (out == null) throw new Error('unparseable body');
      return out;
    } catch (e) {
      errs.push(`${url.slice(0, 42)}… ${e.message}`);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`all sources failed [${errs.join(' | ')}]`);
}

// ---------------------------------------------------------------------------
// Brent — Yahoo chart API (BZ=F), query2 then query1 then proxies.
// ---------------------------------------------------------------------------
function yahooChain(sym) {
  const y2 = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d`;
  return [y2, y2.replace('query2', 'query1'), ...proxyChain(y2).slice(1)];
}

function parseYahooClose(text) {
  const j = JSON.parse(text);
  const res = j && j.chart && j.chart.result && j.chart.result[0];
  const closes = res && res.indicators && res.indicators.quote && res.indicators.quote[0]
    ? res.indicators.quote[0].close : null;
  if (!Array.isArray(closes)) throw new Error('no close series');
  for (let i = closes.length - 1; i >= 0; i--) {          // last non-null close
    if (typeof closes[i] === 'number' && closes[i] > 0) return closes[i];
  }
  throw new Error('no valid close');
}

// ---------------------------------------------------------------------------
// AAA gasoline — parsers ported verbatim from src/js/app.js (the client's
// battle-tested scrapers; a format break there would surface the same day).
// ---------------------------------------------------------------------------
const AAA_HOST = 'https://gasprices.aaa.com';

function extractAaaPrice(html) {
  // AAA renders a curly apostrophe ("Today’s AAA National Average $4.0600")
  // and up to 4 decimals — tolerate both or the headline never matches.
  const m = html.match(/Today['’]?s\s+AAA[^$]*\$([1-9]\.\d{2,4})/i);
  if (m) return parseFloat(m[1]);
  const all = html.match(/\$([1-9]\.\d{2,3})\b/g);
  if (all && all.length > 0) return parseFloat(all[0].slice(1));
  return null;
}

function extractAaaLadderAfter(html, anchorRegex) {
  const m = anchorRegex.exec(html);
  if (!m) return null;
  const start = m.index + m[0].length;
  const slice = html.slice(start, start + 6000);
  const re = /Avg\.<\/td>\s*<td>\s*\$([1-9]\.\d{2,3})/gi;
  const labels = ['current', 'yesterday', 'weekAgo', 'monthAgo', 'yearAgo'];
  const out = {};
  let mm, i = 0;
  while ((mm = re.exec(slice)) !== null && i < labels.length) {
    out[labels[i++]] = parseFloat(mm[1]);
  }
  return Object.keys(out).length > 0 ? out : null;
}

// Diesel shares the regular-grade ladder table (columns: Regular / Mid-Grade /
// Premium / Diesel [/ E85]). The Diesel column is located by its <th> header,
// not a hardcoded position, so a column reorder can never silently turn E85 or
// Premium into "diesel". Any row whose cell count doesn't match the header
// count (an empty or merged cell would shift the columns) is skipped rather
// than misread. Returns the same {current, yesterday, weekAgo, ...} shape as
// extractAaaLadderAfter, or null. Mirrored in src/js/app.js.
function extractAaaDieselLadder(html, anchorRegex) {
  const m = anchorRegex.exec(html);
  if (!m) return null;
  const tableStart = html.lastIndexOf('<table', m.index);
  if (tableStart < 0) return null;
  const heads = [...html.slice(tableStart, m.index).matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)]
    .map((h) => h[1].replace(/<[^>]*>/g, '').trim());
  const col = heads.findIndex((t) => /^diesel$/i.test(t)) - 1;   // heads[0] is the blank row-label column
  if (col < 0) return null;
  const keys = { 'current': 'current', 'yesterday': 'yesterday', 'week ago': 'weekAgo', 'month ago': 'monthAgo', 'year ago': 'yearAgo' };
  const rowRe = /<td>\s*(Current|Yesterday|Week Ago|Month Ago|Year Ago)\s+Avg\.\s*<\/td>([\s\S]*?)<\/tr>/gi;
  const slice = html.slice(tableStart, tableStart + 8000);
  const out = {};
  let rm;
  while ((rm = rowRe.exec(slice)) !== null) {
    const prices = [...rm[2].matchAll(/\$(\d{1,2}\.\d{2,4})/g)].map((p) => parseFloat(p[1]));
    if (prices.length !== heads.length - 1) continue;
    const v = prices[col];
    if (v > 1 && v < 20) out[keys[rm[1].toLowerCase()]] = Number(v.toFixed(3));   // 3dp, same as the rest of gas_daily
  }
  return Object.keys(out).length > 0 ? out : null;
}

async function fetchAaaRegion(pagePath, parseLadder) {
  return fetchParsed(proxyChain(AAA_HOST + pagePath), 'text/html,application/xhtml+xml,*/*', (html) => {
    // Prefer the region's anchored ladder "Current Avg." — the loose headline
    // regex can catch the NATIONAL banner that AAA puts on every page (state
    // pages included), which is the wrong number for a state fetch.
    const ladder = parseLadder ? parseLadder(html) : null;
    const price = (ladder && ladder.current != null) ? ladder.current : extractAaaPrice(html);
    if (price == null) return null;   // unparseable page → try the next source
    return { price, ladder, html };
  });
}

// ---------------------------------------------------------------------------
// Dated-row helpers. Rows self-date, so idempotency needs no stamps.
// ---------------------------------------------------------------------------
function isoOffset(dateKey, daysAgo) {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) - daysAgo * 86400000).toISOString().slice(0, 10);
}

// Overwriting upsert — used for TODAY's row (same-day re-runs refresh it).
function upsertToday(arr, row) {
  const i = arr.findIndex((r) => r && r.d === row.d);
  if (i >= 0) arr[i] = { ...arr[i], ...row };
  else arr.push(row);
}

// Non-overwriting field fill — used for ladder BACKFILL. A value recorded on
// an earlier run was captured closer to the fact; never replace it.
function fillField(arr, d, field, value) {
  if (value == null || !isFinite(value) || d < WAR_START) return false;
  const i = arr.findIndex((r) => r && r.d === d);
  if (i >= 0) {
    if (arr[i][field] != null) return false;
    arr[i] = { ...arr[i], [field]: value };
    return true;
  }
  arr.push({ d, [field]: value });
  return true;
}

function finalizeDaily(arr) {
  arr.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return arr.slice(-DAILY_CAP);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function main() {
  let markets;
  try {
    markets = readJson(MARKETS);
  } catch (e) {
    warn(`cannot read markets.json (${e.message}) — nothing to do, exiting clean`);
    return; // exit 0; never block the pipeline
  }

  // Day key from meta.now (the pipeline's canonical "today"); fall back to system date.
  let dateKey;
  try { dateKey = (readJson(META).now || '').slice(0, 10); } catch (_) { dateKey = ''; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) dateKey = new Date().toISOString().slice(0, 10);

  let changed = false;

  // --- Brent daily close --------------------------------------------------
  try {
    const close = await fetchParsed(yahooChain('BZ=F'), 'application/json,text/plain,*/*', parseYahooClose);
    const v = Number(close.toFixed(2));
    if (!Array.isArray(markets.brent_daily)) markets.brent_daily = [];
    upsertToday(markets.brent_daily, { d: dateKey, v });
    markets.brent_daily = finalizeDaily(markets.brent_daily);
    changed = true;
    log(`Brent: ${v} (${markets.brent_daily.length} dated points, as of ${dateKey})`);
  } catch (e) {
    warn(`Brent (BZ=F) fetch failed: ${e.message} — leaving brent_daily unchanged`);
  }

  // --- AAA gasoline: national + California --------------------------------
  let nat = null, ca = null;
  try {
    nat = await fetchAaaRegion('/', (html) => extractAaaLadderAfter(html, /(?=Current Avg)/));
  } catch (e) {
    warn(`AAA national fetch failed: ${e.message}`);
  }
  try {
    ca = await fetchAaaRegion('/?state=CA', (html) => extractAaaLadderAfter(html, /California[\s\S]{0,80}average gas prices/i));
  } catch (e) {
    warn(`AAA California fetch failed: ${e.message} — degrading to national-only`);
  }
  // The AAA homepage often serves a JS/bot shell server-side while the state
  // pages stay server-rendered — but every gasprices.aaa.com page carries the
  // "Today’s AAA National Average $X.XXXX" banner. Harvest national from the
  // already-fetched CA page when the homepage came up empty (real AAA data,
  // same page, no extra fetch). Banner only — no ladder, so no nat backfill.
  if (!nat && ca && ca.html) {
    const m = ca.html.match(/Today['’]?s\s+AAA[\s\S]{0,200}?National\s+Average[\s\S]{0,200}?\$([1-9]\.\d{2,4})/i);
    if (m) {
      nat = { price: parseFloat(m[1]), ladder: null };
      log(`AAA national recovered from the state page's national banner ($${m[1]})`);
    }
  }

  // National diesel rides the same homepage table as national regular — parse it
  // from the already-fetched page (no extra request). Absent when the national
  // figure came from the state-page banner fallback (that page has no national
  // ladder), in which case diesel simply doesn't advance that day.
  let diesel = null;
  if (nat && nat.html) {
    try { diesel = extractAaaDieselLadder(nat.html, /(?=Current Avg)/); }
    catch (e) { warn(`AAA diesel parse failed: ${e.message}`); }
    if (!diesel) warn('AAA diesel: no Diesel column found on the national page — leaving diesel unchanged');
  }

  if (nat || ca || diesel) {
    if (!Array.isArray(markets.gas_daily)) markets.gas_daily = [];
    const today = { d: dateKey };
    if (nat) today.nat = Number(nat.price.toFixed(3));
    if (ca) today.ca = Number(ca.price.toFixed(3));
    if (diesel && diesel.current != null) today.diesel = Number(diesel.current.toFixed(3));
    upsertToday(markets.gas_daily, today);

    // Ladder backfill: real AAA-published snapshots for -1/-7/-30 days.
    // yearAgo is skipped (pre-war baseline is pinned editorially).
    const offsets = { yesterday: 1, weekAgo: 7, monthAgo: 30 };
    let filled = 0;
    for (const [key, off] of Object.entries(offsets)) {
      const d = isoOffset(dateKey, off);
      if (nat && nat.ladder) filled += fillField(markets.gas_daily, d, 'nat', nat.ladder[key]) ? 1 : 0;
      if (ca && ca.ladder) filled += fillField(markets.gas_daily, d, 'ca', ca.ladder[key]) ? 1 : 0;
      if (diesel) filled += fillField(markets.gas_daily, d, 'diesel', diesel[key]) ? 1 : 0;
    }
    markets.gas_daily = finalizeDaily(markets.gas_daily);
    changed = true;
    log(`AAA gasoline: nat ${today.nat ?? '—'} / CA ${today.ca ?? '—'} / diesel ${today.diesel ?? '—'} $/gal` +
        ` (${markets.gas_daily.length} dated points, ${filled} ladder back-fills, as of ${dateKey})`);
  } else {
    warn('AAA gasoline: all regions failed — leaving gas_daily unchanged');
  }

  if (changed) {
    fs.writeFileSync(MARKETS, JSON.stringify(markets, null, 2) + '\n');
    log('markets.json updated');
  } else {
    log('no changes (all fetches failed)');
  }
}

main().catch((e) => {
  // Absolute backstop: even an unexpected throw must not fail the pipeline.
  warn(`unexpected error: ${e && e.message ? e.message : e} — exiting clean`);
  process.exit(0);
});
