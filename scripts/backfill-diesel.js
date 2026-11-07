#!/usr/bin/env node
/*
 * backfill-diesel.js — fetch the EIA weekly U.S. retail diesel price history and
 * store it in data/markets.json as `diesel_eia_weekly` [{d, v}], plus a
 * `diesel_eia_weekly_source` citation block (incl. the derived pre-war baseline).
 *
 * WHY THIS EXISTS. AAA publishes only a 5-point history ladder (today / yesterday /
 * week / month / year ago), so the dashboard's own daily diesel capture
 * (update-markets.js → gas_daily.diesel) starts from the day it was switched on.
 * This fills the war-era past with real, published, dated figures until our own
 * series has accumulated. It is a stopgap, not a replacement: wherever the AAA
 * daily series (server rows or the reader's cache) has a value for a date, that
 * value WINS over the EIA weekly one (see buildDieselSeries/buildGasSeries in
 * src/js/app.js).
 *
 * SOURCE. U.S. Energy Information Administration, "U.S. No 2 Diesel Retail Prices"
 * (Diesel On-Highway, All Types, all areas; dollars/gal incl. taxes), weekly, series
 * EMD_EPD2D_PTE_NUS_DPG. Primary: the EIA history page (slow — often 60-100 s, and
 * one URL casing sometimes stalls, so both are tried). Fallback: FRED's relay of the
 * same series (GASDESW), recorded as such in the citation block. EIA and AAA are
 * different surveys — they agree within a few cents (31 Aug: EIA 5.599 vs AAA 5.604)
 * but are not identical, so the UI labels the history as EIA.
 *
 * SAFE TO RUN ANY TIME. Unlike update-markets.js this does NOT date anything from
 * meta.now: every row carries EIA's own week-ending date, so a lagging meta.now
 * cannot mislabel data. Idempotent (upserts by date). Unlike update-markets.js it is
 * a manual tool and FAILS LOUDLY (non-zero exit, nothing written) if no source
 * yields a sane series. Not wired into the daily pipeline.
 *
 * Run: npm run backfill:diesel
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MARKETS = path.join(ROOT, 'data', 'markets.json');

const WAR_START = '2026-02-28';
const KEEP_FROM = '2026-02-01';           // keeps the last pre-war reading + the whole war period
const MIN_ROWS = 20;                      // a sane series since KEEP_FROM has ~30+ weekly rows
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const EIA_URLS = [
  'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=pet&s=emd_epd2d_pte_nus_dpg&f=w',
  'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EMD_EPD2D_PTE_NUS_DPG&f=W',
];
const FRED_URL = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=GASDESW&cosd=${KEEP_FROM}`;

const log = (...a) => console.log('[backfill-diesel]', ...a);

async function get(url, timeoutMs) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(timer);
  }
}

// EIA history page → "2026-Mar 03/02 3.897 03/09 4.859 ..." once tags are stripped:
// a year-month cell followed by (week-ending MM/DD, value) pairs.
function parseEiaHistory(html) {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
  const rows = [];
  const blockRe = /(\d{4})-([A-Z][a-z]{2})((?:\s+\d{2}\/\d{2}\s+\d+\.\d+)+)/g;
  let b;
  while ((b = blockRe.exec(text)) !== null) {
    const [, year, mon, body] = b;
    for (const w of body.matchAll(/(\d{2})\/(\d{2})\s+(\d+\.\d+)/g)) {
      if (w[1] !== MONTHS[mon]) continue;            // week-ending month must match its block — else skip, never guess
      rows.push({ d: `${year}-${w[1]}-${w[2]}`, v: parseFloat(w[3]) });
    }
  }
  return rows;
}

function parseFredCsv(csv) {
  const rows = [];
  for (const line of csv.trim().split(/\r?\n/).slice(1)) {
    const [d, v] = line.split(',');
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && v && v !== '.') rows.push({ d, v: parseFloat(v) });
  }
  return rows;
}

// Reject anything that isn't a clean, ascending, plausible weekly series.
function assertSane(rows, label) {
  const recent = rows.filter((r) => r.d >= KEEP_FROM);
  if (recent.length < MIN_ROWS) throw new Error(`${label}: only ${recent.length} rows since ${KEEP_FROM} (need ${MIN_ROWS})`);
  for (let i = 0; i < recent.length; i++) {
    const r = recent[i];
    if (!(r.v > 1 && r.v < 20)) throw new Error(`${label}: implausible value ${r.v} on ${r.d}`);
    if (i > 0) {
      const gap = (Date.parse(recent[i].d) - Date.parse(recent[i - 1].d)) / 86400000;
      if (gap < 5 || gap > 9) throw new Error(`${label}: ${recent[i - 1].d} → ${recent[i].d} is not a weekly step`);
    }
  }
  return recent;
}

async function fetchSeries() {
  const errs = [];
  for (const url of EIA_URLS) {
    try {
      log(`trying EIA (slow — up to 2 min): ${url}`);
      const rows = assertSane(parseEiaHistory(await get(url, 120000)), 'EIA');
      return { rows, origin: 'EIA', url };
    } catch (e) { errs.push(`EIA: ${e.message}`); log(`  failed: ${e.message}`); }
  }
  try {
    log(`falling back to FRED relay of the same EIA series: ${FRED_URL}`);
    const rows = assertSane(parseFredCsv(await get(FRED_URL, 30000)), 'FRED');
    return { rows, origin: 'FRED', url: FRED_URL };
  } catch (e) { errs.push(`FRED: ${e.message}`); }
  throw new Error(`no source produced a sane series — ${errs.join(' | ')}`);
}

async function main() {
  const markets = JSON.parse(fs.readFileSync(MARKETS, 'utf8'));
  const { rows, origin, url } = await fetchSeries();

  const byDate = new Map((Array.isArray(markets.diesel_eia_weekly) ? markets.diesel_eia_weekly : []).map((r) => [r.d, r.v]));
  let added = 0, changed = 0;
  for (const r of rows) {
    if (!byDate.has(r.d)) added++;
    else if (byDate.get(r.d) !== r.v) changed++;
    byDate.set(r.d, r.v);
  }
  const series = [...byDate].map(([d, v]) => ({ d, v })).sort((a, b) => a.d.localeCompare(b.d));
  const prewar = [...series].reverse().find((r) => r.d < WAR_START) || null;   // last reading before the war began

  markets.diesel_eia_weekly = series;
  markets.diesel_eia_weekly_source = {
    source: 'U.S. Energy Information Administration — U.S. No 2 Diesel Retail Prices (On-Highway, All Types), weekly',
    series_id: 'EMD_EPD2D_PTE_NUS_DPG',
    unit: 'USD per gallon, including taxes',
    url: EIA_URLS[1],
    retrieved_via: origin === 'EIA' ? 'EIA history page' : 'FRED relay of the same EIA series (GASDESW)',
    retrieved: new Date().toISOString().slice(0, 10),
    through: series[series.length - 1].d,
    prewar_baseline: prewar ? { d: prewar.d, v: prewar.v, note: 'last EIA weekly reading before the 2026-02-28 war start' } : null,
  };
  fs.writeFileSync(MARKETS, JSON.stringify(markets, null, 2) + '\n');
  log(`${origin}: ${rows.length} rows fetched, ${added} added, ${changed} revised; stored ${series.length} weekly rows ${series[0].d} → ${series[series.length - 1].d}`);
  log(`pre-war baseline: ${prewar ? `${prewar.v} (week ending ${prewar.d})` : 'none found'}`);
}

main().catch((e) => {
  console.error('[backfill-diesel] FAILED — nothing written:', e.message);
  process.exit(1);
});
