#!/usr/bin/env node
/*
 * Hand-rolled JSON-schema-ish validator + cross-field guard for data/*.json.
 *
 * Supports the subset of JSON Schema used in schemas/*.json:
 *   type: string | integer | number | boolean | array | object | null  (and arrays of these)
 *   required, properties, items, enum, minimum, maximum, minLength, maxLength,
 *   minItems, maxItems, pattern, additionalProperties
 *
 * Cross-field rules for events.json:
 *   - Unique id across the array
 *   - No duplicate source URLs within a single event
 *   - Every sources[].name matches an outlet (or alias) in schemas/known_outlets.json
 *   - At least one of feed_visibility / timeline_visibility is true (unless divider)
 *   - File is sorted by (event_date asc, is_chapter_divider first within day,
 *     timeline_visibility next, then source_time asc with null last)
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const SCHEMAS = path.join(ROOT, 'schemas');

const errors = [];
function err(file, msg) { errors.push(`${file}: ${msg}`); }

// ---------------------------------------------------------------------------
// Schema validator (mini)
// ---------------------------------------------------------------------------
function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  if (typeof v === 'number') return 'number';
  return typeof v;
}
function typeMatches(v, t) {
  const got = typeOf(v);
  if (Array.isArray(t)) return t.some(x => typeMatches(v, x));
  if (t === 'number') return got === 'number' || got === 'integer';
  return got === t;
}

function validate(value, schema, file, p = '$') {
  if (schema.type !== undefined && !typeMatches(value, schema.type)) {
    err(file, `${p}: expected type ${JSON.stringify(schema.type)}, got ${typeOf(value)}`);
    return;
  }
  if (schema.enum && !schema.enum.includes(value)) {
    err(file, `${p}: value ${JSON.stringify(value)} not in enum ${JSON.stringify(schema.enum)}`);
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      err(file, `${p}: string length ${value.length} < minLength ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      err(file, `${p}: string length ${value.length} > maxLength ${schema.maxLength}`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      err(file, `${p}: string ${JSON.stringify(value)} does not match pattern ${schema.pattern}`);
    }
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      err(file, `${p}: ${value} < minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      err(file, `${p}: ${value} > maximum ${schema.maximum}`);
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      err(file, `${p}: array length ${value.length} < minItems ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      err(file, `${p}: array length ${value.length} > maxItems ${schema.maxItems}`);
    }
    if (schema.items) {
      value.forEach((item, i) => validate(item, schema.items, file, `${p}[${i}]`));
    }
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    if (schema.required) {
      for (const k of schema.required) {
        if (!(k in value)) err(file, `${p}.${k}: required field missing`);
      }
    }
    if (schema.properties) {
      for (const [k, subSchema] of Object.entries(schema.properties)) {
        if (k in value) validate(value[k], subSchema, file, `${p}.${k}`);
      }
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      const known = new Set(Object.keys(schema.properties || {}));
      for (const k of Object.keys(value)) {
        if (!known.has(k)) validate(value[k], schema.additionalProperties, file, `${p}.${k}`);
      }
    }
  }
}

function loadJson(name) {
  const file = path.join(DATA, name);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    err(name, `failed to parse JSON: ${e.message}`);
    return null;
  }
}
function loadSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(SCHEMAS, name), 'utf8'));
}

function loadOutletAliasIndex() {
  let outlets;
  try {
    outlets = JSON.parse(fs.readFileSync(path.join(SCHEMAS, 'known_outlets.json'), 'utf8'));
  } catch (e) {
    err('known_outlets.json', `failed to load outlet directory: ${e.message}`);
    return null;
  }
  const index = new Map();
  for (const o of outlets.outlets || []) {
    index.set(o.canonical.toUpperCase().trim(), o.canonical);
    for (const a of o.aliases || []) {
      index.set(a.toUpperCase().trim(), o.canonical);
    }
  }
  return index;
}

// ---------------------------------------------------------------------------
// Validate each data file
// ---------------------------------------------------------------------------
const checks = [
  ['events.json',     'event.schema.json',     { array: true }],
  ['breaking.json',   'breaking.schema.json',  { array: false }],  // schema is itself an array
  ['ai_cards.json',   'ai_card.schema.json',   { array: false }],
  ['actors.json',     'actor.schema.json',     { array: false }],
  ['escalation.json', 'escalation.schema.json',{ array: false }],
  ['markets.json',    'markets.schema.json',   { array: false }],
  ['meta.json',       'meta.schema.json',      { array: false }],
  ['themes.json',     'themes.schema.json',    { array: false }],
  ['human_cost.json',      'human_cost.schema.json',      { array: false }],
  ['econ_commentary.json', 'econ_commentary.schema.json', { array: false }],
];

for (const [dataFile, schemaFile, opts] of checks) {
  const data = loadJson(dataFile);
  if (data === null) continue;
  const schema = loadSchema(schemaFile);
  if (opts.array) {
    // events.json: validate each entry against the schema
    data.forEach((entry, i) => validate(entry, schema, dataFile, `[${i}]`));
  } else {
    validate(data, schema, dataFile);
  }
}

// Glossary is an optional file (drives the plain-language tooltips). Validate
// it when present; its absence must not break the build.
if (fs.existsSync(path.join(DATA, 'glossary.json'))) {
  const glossary = loadJson('glossary.json');
  if (glossary !== null) validate(glossary, loadSchema('glossary.schema.json'), 'glossary.json');
}

// ---------------------------------------------------------------------------
// Cross-field rules: events.json
// ---------------------------------------------------------------------------
const events = loadJson('events.json');
const outletIndex = loadOutletAliasIndex();
if (events && Array.isArray(events)) {
  const ids = new Set();
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (ids.has(e.id)) err('events.json', `[${i}]: duplicate id "${e.id}"`);
    ids.add(e.id);

    // Valid calendar date
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e.event_date || '');
    if (m) {
      const d = new Date(`${e.event_date}T00:00:00Z`);
      if (isNaN(d) || d.getUTCFullYear() !== Number(m[1]) || (d.getUTCMonth() + 1) !== Number(m[2]) || d.getUTCDate() !== Number(m[3])) {
        err('events.json', `[${i}]: event_date "${e.event_date}" is not a valid calendar date`);
      }
    }

    // No duplicate source URLs within one event
    const seen = new Set();
    for (const s of e.sources || []) {
      if (s.url) {
        if (seen.has(s.url)) err('events.json', `[${i}]: duplicate source url "${s.url}"`);
        seen.add(s.url);
      }
    }

    // Outlet name check against schemas/known_outlets.json
    if (outletIndex) {
      (e.sources || []).forEach((s, si) => {
        if (s.name && !outletIndex.has(s.name.toUpperCase().trim())) {
          err('events.json', `[${i}].sources[${si}].name: outlet "${s.name}" not in schemas/known_outlets.json`);
        }
      });
    }

    // At least one visibility flag true (except for chapter dividers which are fine either way)
    if (!e.is_chapter_divider && !e.feed_visibility && !e.timeline_visibility) {
      err('events.json', `[${i}]: must have feed_visibility or timeline_visibility (or be a chapter divider)`);
    }
  }

  // Canonical sort: event_date asc, is_chapter_divider first within day, then
  // timeline_visibility before feed-only, then source_time asc with null last.
  function compare(a, b) {
    if (a.event_date !== b.event_date) return a.event_date < b.event_date ? -1 : 1;
    if (a.is_chapter_divider !== b.is_chapter_divider) return a.is_chapter_divider ? -1 : 1;
    if (a.timeline_visibility !== b.timeline_visibility) return a.timeline_visibility ? -1 : 1;
    const ta = a.source_time, tb = b.source_time;
    if (ta == null && tb == null) return 0;
    if (ta == null) return 1;
    if (tb == null) return -1;
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  }
  for (let i = 1; i < events.length; i++) {
    if (compare(events[i - 1], events[i]) > 0) {
      err('events.json', `out of order at [${i}]: "${events[i].id}" should come before "${events[i - 1].id}". Run \`npm run sort:events\` to fix.`);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Cross-field rules: the WW3% headline is DERIVED, not picked (see
// project-memory/RISK_METHODOLOGY.md "The headline rule"). meta.ww3_pct is
// still hand-set by the planner each day rather than computed by the build —
// this catches the planner's own arithmetic before it ships, the same check
// the critic step is supposed to make manually every day. Hard-fails because
// nothing downstream (build.js, reconcile-escalation-history.js) recomputes
// it for you; a wrong meta.ww3_pct here means every derived artifact (the
// hero gauge, the RUNG chip, the trajectory chart's "Now" point) is wrong.
//
// Rounds to the NEAREST INTEGER, not nearest-5 — round-to-5 was found (2026-
// 08-16 audit) to swallow most real sub-axis movement: a full 5-point axis
// move only shifts the four-axis mean by 1.25, which a 5-wide bucket usually
// absorbs. This does NOT touch how the planner scores each sub-axis (still
// 5-point editorial increments) — only the final rounding step.
// ---------------------------------------------------------------------------
{
  const metaData = loadJson('meta.json');
  const escData = loadJson('escalation.json');
  if (metaData && escData && Array.isArray(escData.axes) && Number.isInteger(metaData.ww3_pct)) {
    const axisScores = {};
    let allNumeric = true;
    for (const a of escData.axes) {
      if (a && a.key) axisScores[a.key] = a.score;
      if (typeof (a && a.score) !== 'number' || !isFinite(a.score)) allNumeric = false;
    }
    const keys = Object.keys(axisScores);
    if (allNumeric && keys.length) {
      const mean = keys.reduce((sum, k) => sum + axisScores[k], 0) / keys.length;
      const expected = Math.floor(mean + 0.5);
      if (metaData.ww3_pct !== expected) {
        err('meta.json', `ww3_pct (${metaData.ww3_pct}) does not equal round(mean(escalation.json axes)) = round(${mean}) = ${expected}. The headline is derived from the four sub-axes, not picked — fix meta.ww3_pct or the axis scores.`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Cross-field rules: data/escalation_history.json structural integrity. This
// file is DERIVED every build by scripts/reconcile-escalation-history.js from
// automation/plans/*-summary.md — see that script's header for the incident
// this replaced (silently dropped days, silently overwritten days). These
// checks catch drift a hand-edit or a future code change could reintroduce:
// a hole in the calendar, a corrupted row, or a ww3_pct that no longer
// matches its own row's axes. Hard-fails — this file only has one writer
// (the reconcile step, run unconditionally by `npm run build`), so if it's
// wrong here, something bypassed that writer.
// ---------------------------------------------------------------------------
{
  const histPath = path.join(DATA, 'escalation_history.json');
  if (fs.existsSync(histPath)) {
    let hist = null;
    try { hist = JSON.parse(fs.readFileSync(histPath, 'utf8')); } catch (e) {
      err('escalation_history.json', `failed to parse JSON: ${e.message}`);
    }
    if (Array.isArray(hist)) {
      const AXIS_KEYS = ['kinetic', 'greatpower', 'wmd', 'alliance'];
      let prevDate = null;
      hist.forEach((row, i) => {
        if (!row || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
          err('escalation_history.json', `[${i}]: missing or invalid date`);
          return;
        }
        if (prevDate !== null) {
          if (row.date === prevDate) err('escalation_history.json', `[${i}]: duplicate date "${row.date}"`);
          else if (row.date < prevDate) err('escalation_history.json', `[${i}]: dates out of order at "${row.date}" (after "${prevDate}")`);
          else {
            const expectedNext = new Date(`${prevDate}T00:00:00Z`);
            expectedNext.setUTCDate(expectedNext.getUTCDate() + 1);
            if (row.date !== expectedNext.toISOString().slice(0, 10)) {
              err('escalation_history.json', `[${i}]: calendar gap — "${row.date}" does not follow "${prevDate}" (run \`node scripts/reconcile-escalation-history.js\` to backfill or carry-forward the missing date)`);
            }
          }
        }
        prevDate = row.date;
        const scores = row.scores || {};
        const missing = AXIS_KEYS.filter((k) => typeof scores[k] !== 'number' || !isFinite(scores[k]));
        if (missing.length) {
          err('escalation_history.json', `[${i}] (${row.date}): missing/non-numeric axis score(s): ${missing.join(', ')}`);
          return;
        }
        const mean = AXIS_KEYS.reduce((sum, k) => sum + scores[k], 0) / AXIS_KEYS.length;
        const expected = Math.floor(mean + 0.5);
        if (row.ww3_pct !== expected) {
          err('escalation_history.json', `[${i}] (${row.date}): ww3_pct (${row.ww3_pct}) does not equal round(mean(scores)) = ${expected}`);
        }
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Soft-validate intelligence tasking files (warnings only, never block build)
// ---------------------------------------------------------------------------
const warnings = [];
function warn(file, msg) { warnings.push(`${file}: ${msg}`); }

// Machine-readable staleness-escalation record (2026-08-26). A routine warn()
// that fires every build for weeks is noise nobody acts on — this happened to
// hormuz_series for 31 straight days and human_cost rows for 100+. An item
// lands here once it is stale at 3x its own routine threshold, written to
// automation/logs/stale-watch.json so 2-plan.md / 6-memory.md can act on it
// programmatically instead of re-reading console output every day.
const staleWatch = [];
let staleWatchAsOf = null;

const softChecks = [
  ['forecasts.json',  'forecast.schema.json',  'forecasts'],
  ['indicators.json', 'indicator.schema.json', 'indicators'],
  ['intel_gaps.json', 'intel_gap.schema.json', 'gaps'],
];

for (const [dataFile, schemaFile, arrayKey] of softChecks) {
  const filePath = path.join(DATA, dataFile);
  if (!fs.existsSync(filePath)) continue;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    warn(dataFile, `failed to parse JSON: ${e.message}`);
    continue;
  }
  let schema;
  try {
    schema = loadSchema(schemaFile);
  } catch (e) {
    warn(dataFile, `schema ${schemaFile} not found, skipping validation`);
    continue;
  }
  const items = data[arrayKey];
  if (!Array.isArray(items)) {
    warn(dataFile, `expected "${arrayKey}" to be an array`);
    continue;
  }
  const softErrs = [];
  const origErr = err;
  const origErrors = [...errors];
  for (let i = 0; i < items.length; i++) {
    validate(items[i], schema, dataFile, `${arrayKey}[${i}]`);
  }
  const newErrs = errors.splice(origErrors.length);
  for (const e of newErrs) warn(dataFile, e.replace(`${dataFile}: `, ''));
  console.log(`  ${dataFile}: ${items.length} entries (soft-validated)`);
}

// ---------------------------------------------------------------------------
// Soft lint: internal ID codes (FC-/IND-/GAP-/PAT-) must not leak into the
// scannable summary layer. Depth fields (body/full/changed/facts) legitimately
// carry these codes in source and are stripped at render time, so they are NOT
// linted here. This is an authoring nudge for the plain layer only; it never
// blocks the build.
// ---------------------------------------------------------------------------
const CODE_RE = /\b(FC|IND|GAP|PAT)-[0-9A-Za-z-]+\b/;
function lintCodes(file, label, text) {
  if (typeof text === 'string' && CODE_RE.test(text)) {
    warn(file, `${label} contains an internal ID code (FC-/IND-/GAP-/PAT-) that would reach readers — strip from the plain-language layer`);
  }
}
{
  const cards = loadJson('ai_cards.json');
  if (cards && typeof cards === 'object') {
    (cards.cards || []).forEach((c, i) => {
      lintCodes('ai_cards.json', `cards[${i}].summary`, c.summary);
      lintCodes('ai_cards.json', `cards[${i}].bottom_line`, c.bottom_line);
    });
    for (const k of ['iran_lead', 'brics_lead', 'ukraine_lead']) {
      const lead = cards[k];
      if (!lead) continue;
      lintCodes('ai_cards.json', `${k}.summary`, lead.summary);
      lintCodes('ai_cards.json', `${k}.bottom_line`, lead.bottom_line);
      // The three-tier lead model (2026-06-24) retired the ~600w `full` arc essay —
      // Tier-3 depth lives only in the Analysis cards[].body. Flag stragglers so a
      // pipeline run that re-introduces `full` gets noticed (soft warn, not fatal).
      if (Object.prototype.hasOwnProperty.call(lead, 'full')) {
        warn('ai_cards.json', `${k}.full is a retired field (three-tier lead model) — drop it; per-arc depth belongs in cards[].body`);
      }
    }
  }
}

{
  // Market/economic commentary cards — plain reader layer, same nudge.
  const econ = fs.existsSync(path.join(DATA, 'econ_commentary.json')) ? loadJson('econ_commentary.json') : null;
  if (econ && typeof econ === 'object') {
    (econ.cards || []).forEach((c, i) => {
      lintCodes('econ_commentary.json', `cards[${i}].title`, c.title);
      lintCodes('econ_commentary.json', `cards[${i}].body`, c.body);
    });
  }
}
{
  // Human-cost ledger — footnote + per-row notes are reader-facing.
  const hc = fs.existsSync(path.join(DATA, 'human_cost.json')) ? loadJson('human_cost.json') : null;
  if (hc && typeof hc === 'object') {
    lintCodes('human_cost.json', 'footnote', hc.footnote);
    (hc.groups || []).forEach((g, gi) => {
      (g.rows || []).forEach((r, ri) => {
        lintCodes('human_cost.json', `groups[${gi}].rows[${ri}].note`, r.note);
      });
    });
  }
}
{
  // Actors — the country card and country drawer are read by end users, so the
  // same plain-layer nudge applies. This surface was unlinted until 2026-07-26,
  // which let May-era operator codes sit in chess_players[].details for months
  // (the pipeline refreshes move/as_of but never touched details).
  const act = fs.existsSync(path.join(DATA, 'actors.json')) ? loadJson('actors.json') : null;
  if (act && typeof act === 'object') {
    (act.risk_countries || []).forEach((c, i) => {
      const who = c.name || i;
      lintCodes('actors.json', `risk_countries[${i}] (${who}).note`, c.note);
      lintCodes('actors.json', `risk_countries[${i}] (${who}).details`, c.details);
    });
    (act.chess_players || []).forEach((p, i) => {
      const who = p.name || i;
      lintCodes('actors.json', `chess_players[${i}] (${who}).move`, p.move);
      lintCodes('actors.json', `chess_players[${i}] (${who}).details`, p.details);
    });
  }
}

// ---------------------------------------------------------------------------
// Hard lint: breaking.json items must use plain reader language.
// Forecast-bookkeeping jargon fails the build so tomorrow's pipeline run
// cannot accidentally ship operator-internal language in the ticker.
// Banned patterns (standing rule #10):
//   closes NO / closes YES      — forecast resolution language
//   tier-1 / tier-2             — source-tier operator labels
//   Rung N                      — escalation-ladder rung numbers
//   Brier                       — calibration score term
//   pending tier-               — source-tier reference
//   durable-sub-                — compound jargon shorthand
// ---------------------------------------------------------------------------
{
  const BREAKING_JARGON = [
    { re: /closes (NO|YES)\b/i,   label: '"closes NO/YES" (forecast resolution language — rewrite as the underlying fact)' },
    { re: /\btier-[12]\b/i,       label: '"tier-1/tier-2" (source-tier operator label — say "Western wire" or "official" instead)' },
    { re: /\bRung \d+\b/i,        label: '"Rung N" (escalation-ladder reference — not reader-facing)' },
    { re: /\bBrier\b/i,           label: '"Brier" (calibration score term — not reader-facing)' },
    { re: /pending tier-/i,       label: '"pending tier-" (source-tier jargon — say "confirmation pending" instead)' },
    { re: /durable-sub-/i,        label: '"durable-sub-" (compound jargon shorthand — rewrite in plain words)' },
  ];
  const breakingPath = path.join(DATA, 'breaking.json');
  if (fs.existsSync(breakingPath)) {
    let items;
    try { items = JSON.parse(fs.readFileSync(breakingPath, 'utf8')); } catch (e) { items = null; }
    if (Array.isArray(items)) {
      items.forEach((item, i) => {
        if (typeof item !== 'string') return;
        for (const { re, label } of BREAKING_JARGON) {
          if (re.test(item)) {
            err('breaking.json', `items[${i}] contains ${label}: ${JSON.stringify(item.slice(0, 80))}`);
          }
        }
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Soft staleness gate: freshness is DERIVED from the dated series the charts
// actually render, never from side-channel stamps. (The gas sparkline once
// rotted for ten weeks while a *_last_date stamp kept advancing — a script was
// appending the wrong instrument to an unrendered legacy array and the stamp
// check reported green. Deriving from the rendered data makes that false-green
// failure class impossible.) Non-blocking on purpose — an offline day must not
// fail the build.
// ---------------------------------------------------------------------------
{
  const marketsPath = path.join(DATA, 'markets.json');
  const chartPath = path.join(DATA, 'chart_series.json');
  const metaPath = path.join(DATA, 'meta.json');
  let mkt = null, cs = null, mnow = '';
  try { mkt = JSON.parse(fs.readFileSync(marketsPath, 'utf8')); } catch (_) {}
  try { cs = JSON.parse(fs.readFileSync(chartPath, 'utf8')); } catch (_) {}
  try { mnow = (JSON.parse(fs.readFileSync(metaPath, 'utf8')).now || '').slice(0, 10); } catch (_) {}
  const nowMs = /^\d{4}-\d{2}-\d{2}$/.test(mnow) ? Date.parse(`${mnow}T00:00:00Z`) : NaN;
  const isIso = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
  const lastDate = (rows) => {
    let max = null;
    for (const r of (Array.isArray(rows) ? rows : [])) {
      if (r && isIso(r.d) && (max === null || r.d > max)) max = r.d;
    }
    return max;
  };

  if (mkt && cs && !isNaN(nowMs)) {
    // [rendered series label, freshest date across its sources, warn threshold, fix hint]
    const CHECKS = [
      ['brent_series (Brent sparkline)',
        lastDate([...(cs.brent || []), ...(mkt.brent_daily || [])]), 3,
        'run `npm run update:markets`, or append a dated row/anchor with today\'s live Brent close'],
      ['gas_nat_series (US gasoline avg — AAA national)',
        lastDate([...(cs.gas_nat || []), ...(mkt.gas_daily || [])]), 3,
        'run `npm run update:markets`, or append a dated row with today\'s live AAA national price'],
      // bootstrap=true: a series with NO diesel rows yet (before its first daily
      // update:markets capture) only warns — it must not write a null-age entry into
      // stale-watch.json, which would become mandatory planner tasking (rule #70).
      // Once a diesel row exists the normal staleness + 3x escalation path applies.
      // Freshest of the AAA daily rows and the EIA weekly stopgap (scripts/backfill-diesel.js).
      ['diesel series (US diesel avg — AAA national daily, EIA weekly history)',
        lastDate([...(mkt.gas_daily || []).filter((r) => r && typeof r.diesel === 'number'), ...(mkt.diesel_eia_weekly || [])]), 3,
        'run `npm run update:markets` (AAA national diesel rides the same page as national regular)', true],
      ['hormuz_series (tankers/day)',
        lastDate(cs.hormuz), 7,
        'no live instrument — append a dated anchor only from verified reporting (2-plan.md §9); never estimate'],
    ];
    staleWatchAsOf = mnow;
    for (const [label, last, maxDays, fix, bootstrap] of CHECKS) {
      if (!last) {
        warn('markets.json', `${label} has no dated points at all — ${fix}`);
        if (!bootstrap) staleWatch.push({ source: 'markets.json', series: label, days_stale: null, last_dated_point: null, fix });
        continue;
      }
      const daysBehind = Math.round((nowMs - Date.parse(`${last}T00:00:00Z`)) / 86400000);
      if (daysBehind > maxDays) {
        warn('markets.json', `${label} is ${daysBehind} days stale (last dated point ${last} vs now ${mnow}) — ${fix}`);
      }
      if (daysBehind > maxDays * 3) {
        staleWatch.push({ source: 'markets.json', series: label, days_stale: daysBehind, last_dated_point: last, fix });
      }
    }
    // ww3_history is build-maintained; its stamp is still the right signal.
    const stamp = mkt.ww3_history_last_date;
    if (!stamp || !isIso(stamp)) {
      warn('markets.json', `ww3_history has no valid ww3_history_last_date stamp — built each run by scripts/build.js`);
    } else {
      const daysBehind = Math.round((nowMs - Date.parse(`${stamp}T00:00:00Z`)) / 86400000);
      if (daysBehind > 3) {
        warn('markets.json', `ww3_history (risk trajectory chart) is ${daysBehind} days stale (last ${stamp} vs now ${mnow}) — built each run by scripts/build.js`);
      }
    }
  }

  // Shape checks on the dated chart sources (soft): a malformed date or value
  // would silently drop from the merge, so surface it here instead.
  if (cs) {
    for (const key of ['ww3_milestones', 'brent', 'gas_nat', 'hormuz']) {
      const rows = cs[key];
      if (!Array.isArray(rows)) continue;
      rows.forEach((r, i) => {
        if (!r || !isIso(r.d) || isNaN(Date.parse(`${r.d}T00:00:00Z`))) {
          warn('chart_series.json', `${key}[${i}] has an invalid date "${r && r.d}"`);
        } else if (typeof r.v !== 'number' || !isFinite(r.v)) {
          warn('chart_series.json', `${key}[${i}] (${r.d}) has a non-numeric value`);
        } else if (key === 'ww3_milestones' && !r.k) {
          warn('chart_series.json', `${key}[${i}] (${r.d} "${r.t || ''}") is missing its k field (start|esc|deesc|info)`);
        }
      });
    }
  }
  if (mkt) {
    for (const key of ['brent_daily', 'gas_daily', 'diesel_eia_weekly']) {
      const rows = mkt[key];
      if (!Array.isArray(rows)) continue;
      rows.forEach((r, i) => {
        if (!r || !isIso(r.d)) warn('markets.json', `${key}[${i}] has an invalid date "${r && r.d}"`);
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Soft staleness gate: editorial as_of / updated_at dates on the commentary and
// chess cards. Warn (never block) when a card's own date has drifted >7 days
// behind meta `now` (or today if unavailable), so a stale narrative gets noticed.
// Entries deliberately frozen mark `stale_ok` and are skipped. Mirrors the dated-
// series gate above; an offline day or an intentional carryover must not fail.
// ---------------------------------------------------------------------------
{
  let mnow = '';
  try { mnow = (JSON.parse(fs.readFileSync(path.join(DATA, 'meta.json'), 'utf8')).now || '').slice(0, 10); } catch (_) {}
  const hasNow = /^\d{4}-\d{2}-\d{2}$/.test(mnow);
  const nowMs = hasNow ? Date.parse(`${mnow}T00:00:00Z`) : Date.now();
  const refLabel = hasNow ? mnow : new Date().toISOString().slice(0, 10);
  const isIso = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
  const daysBehind = (d) => Math.round((nowMs - Date.parse(`${d}T00:00:00Z`)) / 86400000);

  const econ = fs.existsSync(path.join(DATA, 'econ_commentary.json')) ? loadJson('econ_commentary.json') : null;
  if (econ && Array.isArray(econ.cards)) {
    econ.cards.forEach((c, i) => {
      const who = c.key || i;
      if (!isIso(c.updated_at)) { warn('econ_commentary.json', `cards[${i}] (${who}) has no valid updated_at date`); return; }
      const db = daysBehind(c.updated_at);
      if (db > 7) warn('econ_commentary.json', `cards[${i}] (${who}) is ${db} days stale (updated_at ${c.updated_at} vs ${refLabel}) — refresh the narrative or re-date it`);
    });
  }

  const actorsData = fs.existsSync(path.join(DATA, 'actors.json')) ? loadJson('actors.json') : null;
  if (actorsData && Array.isArray(actorsData.chess_players)) {
    actorsData.chess_players.forEach((p, i) => {
      if (p.stale_ok === true) return;
      const who = p.name || i;
      if (!isIso(p.as_of)) { warn('actors.json', `chess_players[${i}] (${who}) has no valid as_of date (set as_of, or stale_ok to freeze)`); return; }
      const db = daysBehind(p.as_of);
      if (db > 7) warn('actors.json', `chess_players[${i}] (${who}) is ${db} days stale (as_of ${p.as_of} vs ${refLabel}) — refresh the card or set stale_ok`);
    });
  }

  // risk_countries carried NO date field at all until 2026-07-26, so a country
  // card could contradict the rest of the dashboard indefinitely with nothing to
  // catch it (Taiwan sat on a July-6 read while the theater strip had July 23/24).
  // Same 7-day floor as the chess cards; stale_ok freezes deliberately-evergreen entries.
  if (actorsData && Array.isArray(actorsData.risk_countries)) {
    actorsData.risk_countries.forEach((c, i) => {
      if (c.stale_ok === true) return;
      const who = c.name || i;
      if (!isIso(c.as_of)) { warn('actors.json', `risk_countries[${i}] (${who}) has no valid as_of date (set as_of, or stale_ok to freeze)`); return; }
      const db = daysBehind(c.as_of);
      if (db > 7) warn('actors.json', `risk_countries[${i}] (${who}) is ${db} days stale (as_of ${c.as_of} vs ${refLabel}) — refresh the card or set stale_ok`);
    });
  }

  // Human-cost rows: casualty aggregates legitimately move slower than daily news,
  // so this uses a 30-day floor rather than 7. It is meant to keep firing until a
  // verified re-tally lands — never satisfy it by bumping as_of (standing rule #3)
  // or by estimating a new value (rule #1).
  const hcData = fs.existsSync(path.join(DATA, 'human_cost.json')) ? loadJson('human_cost.json') : null;
  if (hcData && Array.isArray(hcData.groups)) {
    hcData.groups.forEach((g) => {
      (g.rows || []).forEach((r, ri) => {
        if (r.stale_ok === true) return;
        const who = `${g.label || g.key}/${r.k || ri}`;
        if (!isIso(r.as_of)) return; // shape is schema-checked elsewhere
        const db = daysBehind(r.as_of);
        if (db > 30) warn('human_cost.json', `${who} figure is ${db} days stale (as_of ${r.as_of} vs ${refLabel}) — needs a verified re-tally; do NOT bump as_of or estimate a new value`);
        if (db > 90) staleWatch.push({ source: 'human_cost.json', series: who, days_stale: db, last_dated_point: r.as_of, fix: 'needs a verified re-tally from an institutional or press source — never estimate, never bump as_of without new evidence (rule #1/#3)' });
        if (!staleWatchAsOf) staleWatchAsOf = refLabel;
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Stale-watch sidecar (2026-08-26) — machine-readable escalation record.
// Written every run (even when empty). An item here has survived 3x its own
// routine staleness threshold — i.e. weeks of ordinary warnings without being
// resolved — and needs a forced action, not another silent log line.
// ---------------------------------------------------------------------------
try {
  const STALE_WATCH_PATH = path.join(__dirname, '..', 'automation', 'logs', 'stale-watch.json');
  fs.mkdirSync(path.dirname(STALE_WATCH_PATH), { recursive: true });
  const staleWatchOut = {
    generated_at: new Date().toISOString(),
    as_of: staleWatchAsOf,
    escalations: staleWatch,
  };
  fs.writeFileSync(STALE_WATCH_PATH, JSON.stringify(staleWatchOut, null, 2) + '\n', 'utf8');
  if (staleWatchOut.escalations.length) {
    console.warn('');
    console.warn(`\u2757 STALE-WATCH ESCALATION: ${staleWatchOut.escalations.length} item(s) past 3x their staleness threshold — see automation/logs/stale-watch.json`);
    for (const e of staleWatchOut.escalations) {
      console.warn(`   - [${e.source}] ${e.series}: ${e.days_stale === null ? 'no dated points at all' : e.days_stale + 'd stale'} — ${e.fix}`);
    }
    console.warn('   2-plan.md prep requires a DEDICATED search for each of these; 6-memory.md requires surfacing them in the operator digest.');
    console.warn('');
  }
} catch (e) {
  console.warn(`stale-watch sidecar write failed (non-fatal): ${e.message}`);
}

// ---------------------------------------------------------------------------
// Map names must resolve to a world-atlas shape (Theater Globe + 2D map)
// ---------------------------------------------------------------------------
// A name the atlas does not know is drawn nowhere, silently: the "Dem. Rep. Korea"
// fill went unpainted on the 2D map for months that way. Fills exist only to paint
// a shape, so an unresolved fill is an error; risk rows and alias keys can name an
// entity that has no shape, so those only warn.
try {
  const { toAtlasName } = require('../src/js/board-shared.mjs');
  const atlas = require('world-atlas/countries-50m.json');
  const shapes = new Set(atlas.objects.countries.geometries.map(g => g.properties.name));
  const ov = fs.existsSync(path.join(DATA, 'map_overlays.json')) ? loadJson('map_overlays.json') : null;
  for (const k of Object.keys((ov && ov.fills) || {})) {
    if (!shapes.has(toAtlasName(k))) err('map_overlays.json', `fills["${k}"] matches no world-atlas country, so no map draws it. Use the atlas name, or add an alias in src/js/board-shared.mjs`);
  }
  const act = fs.existsSync(path.join(DATA, 'actors.json')) ? loadJson('actors.json') : null;
  const names = new Set([...((act && act.risk_countries) || []).map(r => r.name), ...Object.keys((act && act.country_keys) || {})]);
  for (const n of names) {
    if (!shapes.has(toAtlasName(n))) warn('actors.json', `"${n}" matches no world-atlas country, so the globe cannot place it (add an alias in src/js/board-shared.mjs if it is a country)`);
  }
} catch (e) {
  err('map-names', `could not check map names against world-atlas: ${e.message}`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
if (warnings.length) {
  console.warn(`validate-data: ${warnings.length} warning(s) in intelligence tasking files (non-blocking):`);
  for (const w of warnings) console.warn('  ⚠ ' + w);
}
if (errors.length) {
  console.error(`validate-data: ${errors.length} error(s) found:`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log('validate-data: OK');
console.log(`  events.json: ${events ? events.length : 0} entries`);
process.exit(0);
