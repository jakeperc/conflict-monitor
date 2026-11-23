#!/usr/bin/env node
/*
 * backfill-brent.js — one-time correction of data/markets.json `brent_daily` from
 * Yahoo's dated BZ=F daily history (#16).
 *
 * WHY THIS EXISTS. Before #16, update-markets.js filed the last bar of a 5-day range
 * under the run date. On early-morning weekday runs that bar was the current,
 * unfinished session (an intraday price), and weekend runs filed Friday's close under
 * Saturday or Sunday. The stored series therefore mixed intraday snapshots, settles
 * under the wrong date and provisional values. update-markets.js now records each
 * completed session under its own date; this script rewrites the rows already stored.
 *
 * WHAT IT DOES. For every date from the first stored row to the last completed
 * session, the series becomes exactly Yahoo's completed sessions: values are
 * replaced, missing trading days are added, and weekend-dated rows are removed (their
 * values reappear under the session they belong to). Rows before the window are kept.
 * Dates are read by update-markets.js's own parser (parseYahooSessions), so a
 * backfilled row and a daily row are dated by the same rule. Editorial anchors in
 * chart_series.json are untouched and still win on their dates at build time.
 *
 * CHECKS. No key-free independent source of front-month futures closes remains
 * (Stooq answers 403/404; FRED's Brent series is the physical spot price, which ran
 * up to 25% above futures during the war). So the dry run reports:
 *   1. provenance: weekend rows captured live at the time vs Yahoo's history now
 *      for the session before them (equal means the history was not revised);
 *   2. Brent settle prices quoted in Feed events vs the matching session.
 * It FAILS LOUDLY (non-zero exit, nothing written) if the history is too short, a
 * value is implausible, sessions have a gap of more than 5 calendar days, or fewer
 * than half the weekend rows match (a sign the history was rebased).
 *
 * DRY RUN BY DEFAULT: prints every change and writes nothing. Apply with --write.
 * Run: npm run backfill:brent [-- --write]
 */
const fs = require('node:fs');
const path = require('node:path');
const { parseYahooSessions } = require('./update-markets.js');

const ROOT = path.resolve(__dirname, '..');
const MARKETS = path.join(ROOT, 'data', 'markets.json');
const EVENTS = path.join(ROOT, 'data', 'events.json');
const WRITE = process.argv.includes('--write');
const MIN_SESSIONS = 40;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const URLS = ['query2', 'query1'].map((h) => `https://${h}.finance.yahoo.com/v8/finance/chart/BZ%3DF?range=1y&interval=1d`);

const log = (...a) => console.log('[backfill-brent]', ...a);
const dow = (d) => new Date(`${d}T12:00:00Z`).getUTCDay();
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function fetchSessions() {
  const errs = [];
  for (const url of URLS) {
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 30000);
      const r = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': UA } }).finally(() => clearTimeout(timer));
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return parseYahooSessions(await r.text()).map((s) => ({ d: s.d, v: Number(s.v.toFixed(2)) }));
    } catch (e) { errs.push(`${url}: ${e.message}`); }
  }
  throw new Error(`Yahoo history unavailable — ${errs.join(' | ')}`);
}

function sane(sessions, from) {
  const win = sessions.filter((s) => s.d >= from);
  if (win.length < MIN_SESSIONS) throw new Error(`only ${win.length} sessions since ${from} (need ${MIN_SESSIONS})`);
  for (let i = 0; i < win.length; i++) {
    if (!(win[i].v > 20 && win[i].v < 300)) throw new Error(`implausible value ${win[i].v} on ${win[i].d}`);
    if (i > 0) {
      const gap = (Date.parse(win[i].d) - Date.parse(win[i - 1].d)) / 86400000;
      if (gap > 5) throw new Error(`${win[i - 1].d} → ${win[i].d} is a ${gap}-day gap in the history`);
    }
  }
  return win;
}

async function main() {
  const markets = JSON.parse(fs.readFileSync(MARKETS, 'utf8'));
  const old = Array.isArray(markets.brent_daily) ? markets.brent_daily : [];
  if (!old.length) throw new Error('brent_daily is empty: nothing to correct');
  const from = old.map((r) => r.d).sort()[0];

  const sessions = await fetchSessions();
  const win = sane(sessions, from);
  const y = Object.fromEntries(sessions.map((s) => [s.d, s.v]));
  const keys = sessions.map((s) => s.d);
  const prevSession = (d) => keys.filter((k) => k < d).pop();
  // The window runs to the later of the last completed session and the last stored row:
  // a stored row dated after the last completed session (a weekend or today's run) can only
  // hold a snapshot or a misdated value, so it is replaced too.
  const lastStored = old.map((r) => r.d).sort().pop();
  const to = lastStored > win[win.length - 1].d ? lastStored : win[win.length - 1].d;

  // Check 1: provenance.
  const weekend = old.filter((r) => r.d <= to && [0, 6].includes(dow(r.d)));
  const prov = weekend.map((r) => ({ ...r, s: prevSession(r.d), ok: y[prevSession(r.d)] === r.v }));
  const provOk = prov.filter((p) => p.ok).length;
  log(`check 1, provenance: ${provOk} of ${prov.length} weekend rows equal Yahoo's history for the session before them`);
  for (const p of prov.filter((p) => !p.ok)) log(`  ${p.d}: stored ${p.v}, history ${p.s} = ${y[p.s]} (provisional value at capture)`);
  if (prov.length && provOk * 2 < prov.length) throw new Error('fewer than half the weekend rows match: the history may have been rebased; nothing written');

  // Check 2: settle prices quoted in Feed events.
  let quotes = 0, matched = 0;
  try {
    const evRaw = JSON.parse(fs.readFileSync(EVENTS, 'utf8'));
    const events = Array.isArray(evRaw) ? evRaw : (evRaw.events || []);
    const re = /Brent[^.]{0,80}?(?:settled|closed|ended)[^.$]{0,30}\$(\d{2,3}(?:\.\d{1,2})?)/gi;
    for (const e of events) {
      if (!(e.event_date >= from && e.event_date <= to)) continue;
      const t = `${e.headline} ${e.body || ''}`;
      let m;
      while ((m = re.exec(t))) {
        quotes++;
        const v = Number(m[1]);
        const cands = [e.event_date, prevSession(e.event_date)].filter((k) => y[k] != null);
        const best = Math.min(...cands.map((k) => Math.abs(y[k] - v)));
        if (best <= 0.5) matched++;
        log(`  check 2: ${e.event_date} quotes ${v}; nearest session differs by ${best.toFixed(2)}`);
      }
    }
  } catch (e) { log(`check 2 skipped: ${e.message}`); }
  log(`check 2, Feed quotes: ${matched} of ${quotes} within $0.50`);

  // Proposed series: rows before the window kept; the window replaced by the sessions.
  const kept = old.filter((r) => r.d < from || r.d > to);
  const next = [...kept, ...win].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  const oldBy = new Map(old.map((r) => [r.d, r.v]));
  const newBy = new Map(next.map((r) => [r.d, r.v]));
  const dates = [...new Set([...oldBy.keys(), ...newBy.keys()])].sort();
  const tally = { same: 0, changed: 0, added: 0, removed: 0 };
  for (const d of dates) {
    const o = oldBy.get(d), n = newBy.get(d);
    if (o == null) { tally.added++; log(`  + ${d} ${DAY[dow(d)]} ${n}`); }
    else if (n == null) { tally.removed++; log(`  - ${d} ${DAY[dow(d)]} ${o}`); }
    else if (o !== n) { tally.changed++; log(`  ~ ${d} ${DAY[dow(d)]} ${o} → ${n} (${(n - o).toFixed(2)})`); }
    else tally.same++;
  }
  log(`window ${from} → ${to}: ${old.length} rows → ${next.length}; same ${tally.same}, changed ${tally.changed}, added ${tally.added}, removed ${tally.removed}`);

  if (!WRITE) { log('dry run: nothing written (pass --write to apply)'); return; }
  markets.brent_daily = next;
  fs.writeFileSync(MARKETS, JSON.stringify(markets, null, 2) + '\n');
  log(`wrote ${next.length} rows to data/markets.json`);
}

main().catch((e) => {
  console.error('[backfill-brent] FAILED:', e.message);
  process.exit(1);
});
