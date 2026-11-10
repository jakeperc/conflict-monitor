#!/usr/bin/env node
/*
 * Build pipeline.
 *
 * Inputs:
 *   data/*.json           — editorial source of truth
 *   src/index.template.html — head plumbing + <!-- DATA_INJECT --> marker
 *   src/css/styles.css    — extracted stylesheet
 *   src/js/app.js         — JSX app, reads window.__DATA__
 *
 * Outputs:
 *   dist/index.html       — generated; never edit directly
 *   dist/js/app.js (+ .js.map)
 *   dist/css/styles.css
 *   dist/data/*.json      — copied for runtime introspection
 *
 * Steps:
 *   1. Load every data/*.json.
 *   2. Derive legacy-shape arrays (INIT_NEWS, TIMELINE, TIMELINE_CHAPTERS) from
 *      events.json so app.js can read window.__DATA__.init_news etc. without
 *      knowing about the unified events schema. The legacy shapes are how the
 *      original React code expected its data; deriving here keeps app.js
 *      minimally changed.
 *   3. Inject __DATA__ as a JSON blob at the <!-- DATA_INJECT --> marker.
 *   4. Run esbuild on src/js/app.js, emitting dist/js/app.js with JSX
 *      transpiled and a source map.
 *   5. Copy src/css/styles.css → dist/css/styles.css.
 *   6. Copy data/*.json → dist/data/.
 *   7. Update data/meta.json with last_built timestamp.
 *   8. Append a line to automation/logs/changelog_<DATE>.md.
 */
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const { renderStaticContent, renderJsonLd, scrubCodes } = require('./render-static');
const { renderLlms } = require('./render-llms');
const { reconcileEscalationHistory, buildBackfillQueue } = require('./reconcile-escalation-history');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const AUTOMATION = path.join(ROOT, 'automation');

const log = (...a) => console.log('[build]', ...a);

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------
log('loading data/');
function readJson(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));
  } catch (e) {
    throw new Error(`Failed to parse data/${name}: ${e.message}`);
  }
}
const events     = readJson('events.json');
const breaking   = readJson('breaking.json');
const themes     = readJson('themes.json');
const ai_cards   = readJson('ai_cards.json');
const actors     = readJson('actors.json');
const escalation = readJson('escalation.json');
const markets    = readJson('markets.json');
const meta       = readJson('meta.json');
// Dated, event-anchored chart series (rule #1: real dates + real/editorial values
// only). ww3_milestones are the pre-daily-tracking historical anchors; the recent
// trajectory comes from the dated daily escalation_history. Optional file — absent
// → the charts fall back to the legacy bare *_history arrays in app.js.
const chartSeries = fs.existsSync(path.join(DATA, 'chart_series.json'))
  ? readJson('chart_series.json')
  : { ww3_milestones: [], brent: [], gas_nat: [], hormuz: [] };
// Plain-language glossary (optional file). Drives the render-time jargon
// tooltips in app.js; absent → build stays green and tooltips no-op.
const glossary   = fs.existsSync(path.join(DATA, 'glossary.json')) ? readJson('glossary.json') : { terms: [] };
// Human-cost ledger + market/economic commentary (optional editorial files, same
// pattern as glossary). Absent → the payload keys degrade to null / empty cards;
// app.js reads them additively so a missing file never breaks the build.
const humanCost      = fs.existsSync(path.join(DATA, 'human_cost.json')) ? readJson('human_cost.json') : null;
const econCommentary = fs.existsSync(path.join(DATA, 'econ_commentary.json')) ? readJson('econ_commentary.json') : { cards: [] };
// World-map overlay content (arcs/hotspots/fills/labels) — editorial, added 2026-08-26
// to replace hardcoded overlays in app.js that had rotted. Null-safe: the map falls
// back to a minimal built-in set if the file is absent.
const mapOverlays    = fs.existsSync(path.join(DATA, 'map_overlays.json')) ? readJson('map_overlays.json') : null;
// Allied political calendar + leadership register (optional file, added 2026-09-02).
const politicalCalendar = fs.existsSync(path.join(DATA, 'political_calendar.json')) ? readJson('political_calendar.json') : null;

// Load known_outlets to derive the tier-3 state-media set for runtime badging in the Feed tab.
const knownOutlets = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas', 'known_outlets.json'), 'utf8'));
const tier3StateOutlets = (knownOutlets.outlets || [])
  .filter(o => o.tier === '3-state')
  .flatMap(o => [o.canonical, ...(o.aliases || [])])
  .map(s => s.toUpperCase().trim());

// ---------------------------------------------------------------------------
// Derive legacy-shape arrays from events.json
// ---------------------------------------------------------------------------
const MONTH_LABEL = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun',
                      '07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' };
const SEV_REVERSE = { 1:'low', 2:'moderate', 3:'high', 4:'critical', 5:'extreme' };

function dateLabel(iso) {
  // '2026-05-16' -> 'May 16'
  const [, mm, dd] = iso.split('-');
  return `${MONTH_LABEL[mm]} ${Number(dd)}`;
}

function buildInitNews(events) {
  // Feed view rebuild: per-day reverse order (newest day first), divider first
  // within a day, then news rows in descending source_time order. Matches the
  // exact ordering the original INIT_NEWS array had in the source.
  const feed = events.filter(e => e.feed_visibility);
  const byDate = new Map();
  for (const e of feed) {
    if (!byDate.has(e.event_date)) byDate.set(e.event_date, []);
    byDate.get(e.event_date).push(e);
  }
  const dates = [...byDate.keys()].sort().reverse();
  const out = [];
  for (const d of dates) {
    const items = byDate.get(d);
    const dividers = items.filter(x => x.is_chapter_divider);
    const news = items.filter(x => !x.is_chapter_divider)
      .sort((a, b) => (b.source_time || '').localeCompare(a.source_time || ''));
    for (const div of dividers) {
      out.push({ t: '--', s: div.chapter_label || '', h: div.headline });
    }
    for (const n of news) {
      out.push({
        t: n.source_time || '',
        s: n.sources && n.sources[0] ? n.sources[0].name : '',
        h: n.headline,
        status: n.status || 'confirmed',
        theaters: Array.isArray(n.theaters) ? n.theaters : [],
        lenses: Array.isArray(n.lenses) ? n.lenses : [],
        sources: Array.isArray(n.sources) ? n.sources : [],
      });
    }
  }
  return out;
}

function buildTimeline(events) {
  // Original TIMELINE array order was ascending by event_date. Preserve that.
  return events
    .filter(e => e.timeline_visibility)
    .map(e => ({
      id: e.id,
      date: dateLabel(e.event_date),
      isoDate: e.event_date,
      sev: SEV_REVERSE[e.severity] || 'high',
      desc: e.headline,
      status: e.status || 'confirmed',
      theaters: Array.isArray(e.theaters) ? e.theaters : [],
      lenses: Array.isArray(e.lenses) ? e.lenses : [],
    }));
}

function buildTimelineChapters(events) {
  // Keyed by full ISO event_date (year-safe). Consumers look up by the timeline
  // event's `isoDate`. A year-less key would collide across years (e.g. a re-dated
  // "Jun 18" of a prior year would match a 2026 chapter).
  const out = {};
  for (const e of events) {
    if (e.timeline_visibility && e.chapter_label) {
      out[e.event_date] = {
        label: e.chapter_label,
        kicker: e.chapter_kicker || '',
      };
    }
  }
  return out;
}

const init_news = buildInitNews(events);
const timeline = buildTimeline(events);
const timeline_chapters = buildTimelineChapters(events);

log(`  events: ${events.length} | init_news: ${init_news.length} | timeline: ${timeline.length} | timeline_chapters: ${Object.keys(timeline_chapters).length}`);

// ---------------------------------------------------------------------------
// Outlook projection — reader-safe view of the internal forecasting registry
// (forecasts.json / indicators.json / intel_gaps.json). Those files are INTERNAL
// (never copied to dist/data) and are keyed by operator codes (FC-/IND-/GAP-/PAT-)
// that Standing Rule 8 forbids in reader-facing text. Here we strip the codes
// (scrubCodes, shared with render-static) and keep only reader-meaningful fields.
// Calibration is DERIVED from resolved forecasts using real outcomes only — a
// deterministic computation, not synthetic data (Rule 1).
// ---------------------------------------------------------------------------
function readJsonIf(name) {
  const p = path.join(DATA, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}
function prettyTheater(slug) {
  if (!slug) return '';
  return String(slug)
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
    .replace(/\bUs\b/g, 'US')
    .replace(/Brics/g, 'BRICS')
    .replace(/Crink/g, 'CRINK');
}
function buildOutlook() {
  const fcFile = readJsonIf('forecasts.json');
  const indFile = readJsonIf('indicators.json');
  const gapFile = readJsonIf('intel_gaps.json');

  const forecastsRaw = fcFile && Array.isArray(fcFile.forecasts) ? fcFile.forecasts : [];
  const RESOLVED = new Set(['resolved-yes', 'resolved-no', 'expired']);
  // Base "did it occur?" on the canonical `status` field, not the free-form
  // `outcome` (which drifts between "resolved-yes"/"yes"/null across records and
  // would miscount YES resolutions as non-occurrences). resolved-no and expired
  // both mean "the predicted event did not occur".
  const occurredOf = (f) => (f.status === 'resolved-yes' ? 1 : 0);
  // Coerce to a finite number or undefined. Uses ?? (not ||) so a legitimate 0.0
  // probability is never dropped. Tolerates the legacy {from,to} history shape
  // (a one-off 2026-06-28 executor run): opening prob = probability ?? from ?? to.
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const firstProb = (f) => {
    const h = Array.isArray(f.probability_history) ? f.probability_history : [];
    const h0 = h.length ? h[0] : null;
    return h0
      ? (num(h0.probability) ?? num(h0.from) ?? num(h0.to) ?? num(f.probability))
      : num(f.probability);
  };
  // Settled probability as of a history point (for the sparkline): the post-move
  // value, so prefer `to` over `from` on legacy {from,to} rows.
  const pointProb = (x) => num(x.probability) ?? num(x.to) ?? num(x.from);

  // Settled probability at resolution — the last value the board actually stood
  // behind BEFORE the record was resolved. Used for the updating-skill metric.
  //
  // Why this exists (2026-09-02, operator-approved): calibration was scored only
  // on the OPENING probability, discarding every subsequent update. On 349
  // resolved forecasts that reads skill 0.04; scored on the settled probability
  // the same register reads 0.41. The board updates constantly and well (300 of
  // 327 revised, 211 by >10pts) and none of that was being measured — while the
  // band corrections derived from the opening-only view were being applied to
  // UPDATES, pushing good forecasts the wrong way.
  //
  // The original comment worried the resolution-day probability is "~0/1 and
  // circular". Guarded two ways: (a) any history entry dated on/after the
  // resolution date is excluded, so a run that collapses to 0/1 while resolving
  // cannot flatter itself; (b) both scores are reported, never just this one.
  const finalProb = (f) => {
    const h = Array.isArray(f.probability_history) ? f.probability_history : [];
    const rd = f.resolved_date || f.resolution_date || null;
    const pre = rd ? h.filter((x) => (x.date || '') < rd) : h;
    const src = pre.length ? pre[pre.length - 1] : null;
    return src ? (pointProb(src) ?? num(f.probability)) : num(f.probability);
  };

  const forecasts = forecastsRaw
    // Methodology/tripwire forecasts are internal-only — never project them to the
    // site (defensive; none carry this tag today).
    .filter((f) => !(Array.isArray(f.tags) && f.tags.includes('methodology')))
    .map((f) => {
    const h = Array.isArray(f.probability_history) ? f.probability_history : [];
    return {
      question: scrubCodes(f.question || ''),
      theater: prettyTheater(f.theater),
      deadline: f.deadline || null,
      probability: f.probability,
      first_probability: firstProb(f),
      history: h.map((x) => ({ date: x.date, probability: pointProb(x) })),
      status: f.status || 'open',
      outcome: f.outcome || null,
      resolution_date: f.resolution_date || null,
      resolution_source: scrubCodes(f.resolution_source || ''),
      resolution_criteria: scrubCodes(f.resolution_criteria || ''),
      surprise_if_wrong: scrubCodes(f.surprise_if_wrong || ''),
      latest_reason: h.length ? scrubCodes(h[h.length - 1].reason || '') : '',
      created_date: f.created_date || null,
    };
  });

  // Calibration — scored TWO ways, because they answer different questions:
  //   opening  = quality of the initial prior          (question-setting skill)
  //   settled  = quality of the last pre-resolution value (updating skill)
  // The band corrections the planner applies are applied to UPDATES, so they are
  // derived from the settled view (see `buckets` below). Both are published.
  const resolved = forecastsRaw.filter((f) => RESOLVED.has(f.status));
  const BUCKET_DEFS = [[0, 0.2], [0.2, 0.4], [0.4, 0.6], [0.6, 0.8], [0.8, 1]];
  const buckets = BUCKET_DEFS.map(([lo, hi]) => ({ lo, hi, predicted: 0, occurred: 0 }));
  const bucketsOpening = BUCKET_DEFS.map(([lo, hi]) => ({ lo, hi, predicted: 0, occurred: 0 }));
  const putBucket = (set, p, o) => {
    const b = set.find((bk) => p >= bk.lo && (bk.hi >= 1 ? p <= 1 : p < bk.hi)) || set[set.length - 1];
    b.predicted += 1;
    b.occurred += o;
  };
  let brierSum = 0;
  let brierN = 0;
  let brierOpenSum = 0;
  let brierOpenN = 0;
  let calibrationSkipped = 0;
  const resolvedList = resolved.map((f) => {
    const p = firstProb(f);
    const pf = finalProb(f);
    const o = occurredOf(f);
    // Never let one malformed record (undefined opening prob) poison the whole
    // metric — skip it and count it instead of summing NaN.
    if (!Number.isFinite(p)) {
      calibrationSkipped += 1;
      return {
        question: scrubCodes(f.question || ''),
        theater: prettyTheater(f.theater),
        initial_probability: null,
        final_probability: Number.isFinite(pf) ? pf : null,
        occurred: o === 1,
        hit: null,
        resolution_date: f.resolution_date || null,
      };
    }
    brierOpenSum += (p - o) * (p - o);
    brierOpenN += 1;
    putBucket(bucketsOpening, p, o);
    // Settled view. Falls back to the opening value when a record has no usable
    // pre-resolution update, so the two sets always cover the same population.
    const pu = Number.isFinite(pf) ? pf : p;
    brierSum += (pu - o) * (pu - o);
    brierN += 1;
    putBucket(buckets, pu, o);
    return {
      question: scrubCodes(f.question || ''),
      theater: prettyTheater(f.theater),
      initial_probability: p,
      final_probability: pu,
      occurred: o === 1,
      hit: (pu >= 0.5) === (o === 1),
      resolution_date: f.resolution_date || null,
    };
  });
  if (calibrationSkipped) {
    console.warn(`[build]   calibration: skipped ${calibrationSkipped} resolved forecast(s) with no numeric opening probability`);
  }
  resolvedList.sort((a, b) => (b.resolution_date || '').localeCompare(a.resolution_date || ''));
  // Skill metrics. Raw Brier is uninterpretable on its own: most forecasts are
  // low-probability escalation events that resolve NO, so a naive "always predict
  // the base rate" strategy scores a low Brier with zero skill. The Brier Skill
  // Score measures our Brier AGAINST that base-rate baseline:
  //   base_rate      = share of resolved forecasts that occurred (the climatology)
  //   brier_baseline = base_rate*(1-base_rate) — Brier of always predicting base_rate
  //   skill_score    = 1 - brier/brier_baseline  (>0 = skill, 0 = no better, <0 = worse)
  const n = resolved.length;
  // Brier/base-rate are computed over the SCORED set (brierN = resolved forecasts
  // with a usable numeric opening prob); total_resolved stays n for display.
  const totalOccurred = buckets.reduce((s, b) => s + b.occurred, 0);
  const brier = brierN ? brierSum / brierN : null;
  const baseRate = brierN ? totalOccurred / brierN : null;
  const brierBaseline = brierN ? baseRate * (1 - baseRate) : null;
  const skillScore = brierBaseline ? 1 - brier / brierBaseline : null;
  // Opening-prior view, kept alongside so the two are always read together.
  const brierOpening = brierOpenN ? brierOpenSum / brierOpenN : null;
  const skillOpening = brierBaseline ? 1 - brierOpening / brierBaseline : null;
  const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
  const mkBuckets = (set) => set.map((b) => ({
    label: `${Math.round(b.lo * 100)}–${Math.round(b.hi * 100)}%`,
    midpoint: Math.round((b.lo + b.hi) * 50),
    predicted: b.predicted,
    occurred: b.occurred,
    observed_rate: b.predicted ? r2(b.occurred / b.predicted) : null,
  }));
  const calibration = {
    total_resolved: n,
    brier: r2(brier),
    base_rate: r2(baseRate),
    brier_baseline: r2(brierBaseline),
    skill_score: r2(skillScore),
    brier_opening: r2(brierOpening),
    skill_opening: r2(skillOpening),
    buckets_opening: mkBuckets(bucketsOpening),
    buckets: buckets.map((b) => ({
      label: `${Math.round(b.lo * 100)}–${Math.round(b.hi * 100)}%`,
      midpoint: Math.round((b.lo + b.hi) * 50), // bucket center, in %
      predicted: b.predicted,
      occurred: b.occurred,
      // observed YES-rate in this band; null when too few to read
      observed_rate: b.predicted ? r2(b.occurred / b.predicted) : null,
    })),
    resolved: resolvedList,
  };

  // Internal indicator types are maintained in the file but never shown on the
  // site (user decision). Normalize the legacy 'deescalation' typo defensively so
  // neither the exclusion nor the projected `type` depends on the misspelling.
  const HIDDEN_IND_TYPES = new Set(['epistemic-discipline', 'methodology-tripwire']);
  const normIndType = (t) => (t === 'deescalation' ? 'de-escalation' : (t || 'escalation'));
  const indicators = (indFile && Array.isArray(indFile.indicators) ? indFile.indicators : [])
    .filter((i) => i.status !== 'expired')
    .filter((i) => !HIDDEN_IND_TYPES.has(normIndType(i.type)))
    .map((i) => {
      const sh = Array.isArray(i.signal_history) ? i.signal_history : [];
      return {
        indicator: scrubCodes(i.indicator || ''),
        type: normIndType(i.type),
        theater: prettyTheater(i.theater),
        signal: typeof i.current_signal_strength === 'number' ? i.current_signal_strength : null,
        threshold: typeof i.threshold_for_activation === 'number' ? i.threshold_for_activation : null,
        watch_window_end: i.watch_window_end || null,
        status: i.status || 'watching',
        activated: !!i.activated,
        // Dated fields powering the "Since your last visit" diff (date + strength only;
        // no operator codes). activation_date is null until the indicator fires.
        activation_date: i.activation_date || null,
        created_date: i.created_date || null,
        history: sh.map((x) => ({ date: x.date, strength: x.strength })),
        latest_evidence: sh.length ? scrubCodes(sh[sh.length - 1].evidence || '') : '',
      };
    });

  const gaps = (gapFile && Array.isArray(gapFile.gaps) ? gapFile.gaps : [])
    .filter((g) => g.status !== 'resolved')
    // Pipeline-self-monitoring gaps (category: "methodology") stay internal-only,
    // matching the epistemic-discipline / methodology-tripwire indicator exclusion.
    .filter((g) => g.category !== 'methodology')
    .map((g) => ({
      question: scrubCodes(g.question || ''),
      priority: g.priority || 'monitoring',
      theater: prettyTheater(g.theater),
      why_it_matters: scrubCodes(g.why_it_matters || ''),
      days_open: typeof g.days_open === 'number' ? g.days_open : null,
      status: g.status || 'open',
      collection_status: scrubCodes(g.current_collection_status || ''),
    }));

  return { forecasts, indicators, gaps, calibration };
}
const outlook = buildOutlook();
log(`  outlook: forecasts=${outlook.forecasts.length} indicators=${outlook.indicators.length} gaps=${outlook.gaps.length} resolved=${outlook.calibration.total_resolved} brier=${outlook.calibration.brier} skill=${outlook.calibration.skill_score}`);

// ---------------------------------------------------------------------------
// Calibration feedback snapshot — closes the forecasting loop.
// build.js runs at the END of each daily cycle, so this file always reflects the
// most recently resolved forecasts. The planner (2-plan.md §18) reads it BEFORE
// setting the next round of probabilities, so it can correct its own systematic
// bias instead of forecasting blind to its own track record. Derived only from
// resolved-forecast outcomes (Rule 1: no synthetic data).
// ---------------------------------------------------------------------------
function writeCalibrationSnapshot(cal) {
  const MIN_N = 3; // below this a bucket/theater is too small to read — flag, don't trust
  const buckets = cal.buckets.map((b) => {
    const gap = b.observed_rate == null ? null : Math.round((b.observed_rate * 100 - b.midpoint));
    let note = 'too few resolved to read';
    if (b.predicted >= MIN_N && gap != null) {
      if (gap <= -15) note = `OVERCONFIDENT by ~${-gap}pts — shade probabilities in this band DOWN`;
      else if (gap >= 15) note = `UNDERCONFIDENT by ~${gap}pts — shade probabilities in this band UP`;
      else note = 'well-calibrated';
    }
    return { band: b.label, predicted: b.predicted, observed_rate: b.observed_rate, reliability_gap_pts: gap, note };
  });

  // Per-theater skill — where are we sharp vs. weak? Drives research allocation.
  const byTheaterMap = {};
  for (const r of cal.resolved) {
    const t = r.theater || 'Unknown';
    (byTheaterMap[t] = byTheaterMap[t] || []).push(r);
  }
  const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
  const by_theater = Object.entries(byTheaterMap).map(([theater, rs]) => {
    const n = rs.length;
    // Score only rows with a usable numeric opening prob (mirrors the global guard).
    const scored = rs.filter((r) => Number.isFinite(r.final_probability));
    const sn = scored.length;
    const occ = scored.filter((r) => r.occurred).length;
    const brier = sn ? scored.reduce((s, r) => s + Math.pow(r.final_probability - (r.occurred ? 1 : 0), 2), 0) / sn : null;
    const base = sn ? occ / sn : null;
    const baseline = base == null ? null : base * (1 - base);
    return {
      theater,
      resolved: n,
      brier: r2(brier),
      base_rate: r2(base),
      skill_score: baseline ? r2(1 - brier / baseline) : null,
      reliable: sn >= MIN_N,
    };
  }).sort((a, b) => b.resolved - a.resolved);

  let skillRead = 'insufficient data';
  if (cal.skill_score != null) {
    if (cal.skill_score > 0.1) skillRead = `POSITIVE (${cal.skill_score}) — beating the base-rate baseline; keep current discipline`;
    else if (cal.skill_score < -0.1) skillRead = `NEGATIVE (${cal.skill_score}) — WORSE than just predicting the base rate; probabilities are adding noise, tighten resolution criteria and anchor to base rates`;
    else skillRead = `~0 (${cal.skill_score}) — no better than the base rate; forecasts are not yet adding skill`;
    skillRead += ` [settled view; opening-prior skill = ${cal.skill_opening}]`;
  }

  const snapshot = {
    note: 'Auto-generated by scripts/build.js at the end of each daily cycle. READ-ONLY planner input — do not hand-edit. Reflects all resolved forecasts as of the last build.',
    total_resolved: cal.total_resolved,
    sample_warning: cal.total_resolved < 25 ? `Only ${cal.total_resolved} resolved — per-bucket and per-theater reads are provisional. Treat as directional, not definitive.` : null,
    scoring_note: 'Two scores. skill_score/brier/buckets are the SETTLED view — the last value the board stood behind before resolution — and measure updating skill. skill_opening/brier_opening/buckets_opening score the initial prior only. The band corrections below are applied to UPDATES, so they are derived from the settled view. Read both: a wide gap between them means the evidence work is doing real work.',
    brier: cal.brier,
    base_rate: cal.base_rate,
    brier_baseline: cal.brier_baseline,
    skill_score: cal.skill_score,
    skill_interpretation: skillRead,
    brier_opening: cal.brier_opening,
    skill_opening: cal.skill_opening,
    buckets_opening: cal.buckets_opening,
    buckets,
    by_theater,
    instructions_for_planner: [
      'Before updating any probability, check the bucket that the probability falls into in `buckets` (the SETTLED view). If that band is flagged OVERCONFIDENT/UNDERCONFIDENT (and predicted >= 3), correct in that direction. Do NOT take the correction from `buckets_opening` — that view scores initial priors and applying it to an update is a category error.',
      'If skill_score is ~0 or negative, anchor new forecasts to the relevant base_rate first, then adjust for case-specific evidence — do not start from a gut number.',
      'Compare skill_opening with skill_score. If skill_score is much the higher, the updating process is working and the priors are the weak half — put effort into better opening estimates, not into second-guessing updates.',
      'Prefer deadlines 7-30 days out so forecasts resolve fast and this feedback compounds; reserve 60-90d only for genuinely slow questions.',
      'Use by_theater to steer research: spend more on theaters where skill_score is low or negative.',
    ],
  };

  const dir = path.join(ROOT, 'automation', 'research');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'calibration-latest.json'), JSON.stringify(snapshot, null, 2) + '\n');
  log(`  calibration snapshot -> automation/research/calibration-latest.json (skill=${cal.skill_score}, ${skillRead.split(' ')[0]})`);
}
writeCalibrationSnapshot(outlook.calibration);

// ---------------------------------------------------------------------------
// Reader-orientation state — powers the "Since your last visit" panel.
// Both artifacts are derived from real data only (Rule 1), self-bootstrapping,
// and persisted in data/ so the NEXT build can diff against them. They are
// injected into __DATA__ (see payload) and NOT shipped as standalone files
// (added to INTERNAL_DATA below). A per-event first-seen map makes "new since
// you last looked" accurate instead of guessed from the news date; a date-keyed
// escalation snapshot makes axis / WW3% shifts computable per reader.
// ---------------------------------------------------------------------------
function maintainEventFirstSeen(evts, stamp) {
  const p = path.join(DATA, 'event_first_seen.json');
  let map = {};
  try { if (fs.existsSync(p)) map = JSON.parse(fs.readFileSync(p, 'utf8')) || {}; } catch (_) { map = {}; }
  let added = 0;
  for (const e of evts) {
    // Seed first-seen from the event's own news date (best estimate of when it
    // entered the dashboard); genuinely-new events get ~today since their date is
    // today. Pinned once written, so later re-dating/corrections don't move it.
    if (e && e.id && !map[e.id]) { map[e.id] = e.event_date || stamp; added += 1; }
  }
  if (added) fs.writeFileSync(p, JSON.stringify(map, null, 2) + '\n');
  log(`  event_first_seen: ${Object.keys(map).length} ids (${added} new this build)`);
  return map;
}
const eventFirstSeen = maintainEventFirstSeen(events, meta.now);

// ---------------------------------------------------------------------------
// escalation_history.json is DERIVED every build from the plan-of-record
// (automation/plans/*-summary.md), not written as a single today-only side
// effect. This replaces a mechanism that both silently dropped fully-scored
// days (build didn't run that day) and silently overwrote past days' scores
// with today's (a stale meta.now collided with an old date key) — see
// scripts/reconcile-escalation-history.js for the full incident writeup and
// the recovery logic. Re-running this on every build means a missed day or a
// bad write self-heals on the next build instead of persisting for months.
// ---------------------------------------------------------------------------
const DATE_KEY = (meta.now || '').slice(0, 10);
function maintainEscalationHistory(axes, dateKey) {
  const liveAxes = {};
  for (const a of (axes || [])) if (a && a.key) liveAxes[a.key] = a.score;
  const { list, unscored, repaired, filled, unparsedSummaries } =
    reconcileEscalationHistory({ dataDir: DATA, automationDir: AUTOMATION, dateKey, liveAxes });

  const rows = list.map(({ date, ww3_pct, scores, source, scored }) => ({ date, ww3_pct, scores, source, scored }));
  const p = path.join(DATA, 'escalation_history.json');
  const before = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  const after = JSON.stringify(rows, null, 2) + '\n';
  if (after !== before) fs.writeFileSync(p, after);

  const queue = buildBackfillQueue({ dataDir: DATA, unscoredDates: unscored });
  const qPath = path.join(AUTOMATION, 'backfill-queue.json');
  const qBefore = fs.existsSync(qPath) ? fs.readFileSync(qPath, 'utf8') : '';
  const qAfter = JSON.stringify(queue, null, 2) + '\n';
  if (qAfter !== qBefore) fs.writeFileSync(qPath, qAfter);

  log(`  escalation_history: ${rows.length} days (latest ${dateKey})`);
  if (filled.length) log(`    repaired: filled ${filled.length} previously-missing row(s) (${filled.join(', ')})`);
  if (repaired.length) log(`    repaired: corrected ${repaired.length} row(s) that disagreed with the plan-of-record (${repaired.map(r => r.date).join(', ')})`);
  if (unscored.length) log(`    unscored: ${unscored.length} date(s) carried forward + queued in automation/backfill-queue.json (${unscored.join(', ')})`);
  if (unparsedSummaries.length) log(`    warning: ${unparsedSummaries.length} plan-summary file(s) had no parseable axes line (skipped): ${unparsedSummaries.join(', ')}`);
  return rows;
}
const escalationHistory = maintainEscalationHistory(escalation.axes, DATE_KEY);

// ---------------------------------------------------------------------------
// Advance the WW3 trajectory sparkline so its endpoint is always TODAY.
// Previously markets.ww3_history was hand-edited by the planner and routinely
// went stale (the chart froze days behind the hero gauge). Now the build appends
// today's canonical ww3_pct once per calendar day (idempotent: a same-day rebuild
// overwrites the last point instead of duplicating it). Milestone annotations in
// app.js are keyed to the immutable head indices, so appending never disturbs
// them. No synthetic data — the value is the same ww3_pct the gauge shows.
// ---------------------------------------------------------------------------
function maintainWw3History(mkt, ww3_pct, dateKey) {
  if (!Array.isArray(mkt.ww3_history)) mkt.ww3_history = [];
  const hist = mkt.ww3_history;
  const before = JSON.stringify(mkt);
  if (mkt.ww3_history_last_date === dateKey && hist.length) {
    hist[hist.length - 1] = ww3_pct;           // idempotent same-day rebuild
  } else {
    hist.push(ww3_pct);
    mkt.ww3_history_last_date = dateKey;
  }
  if (JSON.stringify(mkt) !== before) {
    fs.writeFileSync(path.join(DATA, 'markets.json'), JSON.stringify(mkt, null, 2) + '\n');
  }
  return hist;
}
maintainWw3History(markets, meta.ww3_pct, DATE_KEY);

// ---------------------------------------------------------------------------
// Build the dated WW3 trajectory series for the hero chart. Merges two real,
// dated sources so the chart plots on a true time axis (rule #1: no fabricated
// dates or values):
//   1. chart_series.ww3_milestones — pre-daily-tracking historical anchors
//      (each {d,v} is a real reporting date + the editorial WW3% at that date).
//   2. escalation_history — the dated daily record (Jun 24 → today), which the
//      escalation_history value takes precedence for any overlapping date.
// A milestone's marker text (t/s) is layered onto whichever value wins, so an
// annotated day keeps its label. The most recent point is flagged `now` and
// carries meta.ww3_now_label. Dot direction (escalating/de-escalating) is
// derived from the value delta at render time, so this stays label-only.
// ---------------------------------------------------------------------------
function buildWw3Series(milestones, history, nowPct, nowLabel, dateKey) {
  const byDate = new Map();
  // Dated daily record first (authoritative values for its date range).
  // `scored: false` marks a day the pipeline never actually re-scored (carried
  // forward from the last scored day by reconcile-escalation-history.js) — the
  // hero chart renders these as a distinct hollow marker rather than a colored
  // escalating/de-escalating dot, since nothing was actually re-measured.
  for (const e of (history || [])) {
    if (e && e.date) byDate.set(e.date, { d: e.date, v: e.ww3_pct, scored: e.scored !== false });
  }
  // Historical + curated milestones: add missing dates, and attach marker text
  // to any date (existing daily value wins over the milestone's own value).
  // Spread `prev` first so a daily record's `scored` flag survives the merge.
  for (const m of (milestones || [])) {
    if (!m || !m.d) continue;
    const prev = byDate.get(m.d);
    byDate.set(m.d, {
      ...prev,
      d: m.d,
      v: prev && typeof prev.v === 'number' ? prev.v : m.v,
      t: m.t, s: m.s, k: m.k,
    });
  }
  const series = [...byDate.values()].sort((a, b) => String(a.d).localeCompare(String(b.d)));
  // Ensure today's canonical point exists and is the endpoint (matches the hero gauge).
  if (dateKey) {
    const last = series[series.length - 1];
    if (last && last.d === dateKey) { last.v = nowPct; }
    else if (!last || String(last.d) < dateKey) { series.push({ d: dateKey, v: nowPct }); }
  }
  if (series.length) {
    const now = series[series.length - 1];
    now.now = true;
    now.t = now.t || 'Now';
    if (nowLabel) now.s = nowLabel;
  }
  return series;
}
const ww3Series = buildWw3Series(
  chartSeries.ww3_milestones, escalationHistory, meta.ww3_pct, meta.ww3_now_label || null, DATE_KEY
);
log(`  ww3_series: ${ww3Series.length} dated points (${ww3Series.filter(p => p.t).length} annotated)`);

// ---------------------------------------------------------------------------
// Merge hand-pinned editorial anchors (chart_series.json) with the dated daily
// rows update-markets.js maintains in markets.json (brent_daily / gas_daily).
// Daily rows fill the gaps BETWEEN anchors; on a date collision the ANCHOR's
// value and label win — the opposite of buildWw3Series's precedence, on
// purpose: ww3's daily history and milestones share one editorial value, but a
// planner-pinned market print (e.g. "$94.29 — war premium lands") must not be
// silently replaced by a differing exchange close while its label still names
// the pinned number.
// ---------------------------------------------------------------------------
function mergeAnchorsWithDaily(anchors, daily) {
  const byDate = new Map();
  for (const r of (daily || [])) {
    if (r && r.d && typeof r.v === 'number' && isFinite(r.v)) byDate.set(r.d, { d: r.d, v: r.v });
  }
  for (const a of (anchors || [])) {
    if (a && a.d) byDate.set(a.d, a);   // anchor wins: value AND label
  }
  return [...byDate.values()].sort((a, b) => String(a.d).localeCompare(String(b.d)));
}
const brentSeries = mergeAnchorsWithDaily(chartSeries.brent, markets.brent_daily);
const gasNatSeries = mergeAnchorsWithDaily(
  chartSeries.gas_nat,
  (markets.gas_daily || []).map((r) => ({ d: r.d, v: r.nat }))
);
log(`  brent_series: ${brentSeries.length} dated points (${(markets.brent_daily || []).length} daily)`);
log(`  gas_nat_series: ${gasNatSeries.length} dated points (${(markets.gas_daily || []).length} daily)`);

// 24h risk delta — derived from the dated daily escalation_history (yesterday →
// today), NOT from ww3_history[length-2]. The old length-2 read was wrong because
// ww3_history is sparse (milestone-anchored, not strictly daily), so "two points
// back" was often several days, and on a rebuild it silently read 0. Injected into
// meta below and consumed by app.js.
// The comparison point is the previous MEASURED reading — the last row a run
// actually scored on its own day — not yesterday's row. On a multi-day run
// cadence yesterday is a carried-forward or backfill copy of today, which made
// the chip read "0 pts 24h" on every gap run. ww3DeltaDays says how far back
// that reading is, so the chip can say "3d" instead of a false "24h".
const MEASURED_SOURCES = new Set(['plan-of-record', 'audit-rescore', 'escalation.json-live']);
let ww3Delta = 0;
let ww3DeltaDays = 1;
if (escalationHistory.length >= 2) {
  const last = escalationHistory[escalationHistory.length - 1];
  let prev = null;
  for (let i = escalationHistory.length - 2; i >= 0; i--) {
    if (MEASURED_SOURCES.has(escalationHistory[i].source)) { prev = escalationHistory[i]; break; }
  }
  if (!prev) prev = escalationHistory[escalationHistory.length - 2];
  ww3Delta = last.ww3_pct - prev.ww3_pct;
  ww3DeltaDays = Math.max(1, Math.round((Date.parse(last.date) - Date.parse(prev.date)) / 86400000));
}
log(`  ww3: pct=${meta.ww3_pct} delta_${ww3DeltaDays}d=${ww3Delta >= 0 ? '+' : ''}${ww3Delta} (from escalation_history)`);

// Stamp the build time NOW — before the data→dist copy and the sitemap render —
// so dist/data/meta.json and sitemap.xml carry THIS build's timestamp. (It used to
// be written after the copy, leaving the published site one build behind.)
meta.last_built = new Date().toISOString();
fs.writeFileSync(path.join(DATA, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');

// ---------------------------------------------------------------------------
// Assemble window.__DATA__ payload
// ---------------------------------------------------------------------------
const payload = {
  // Editorial source of truth
  events,
  // Legacy-shape derivations the React app expects
  init_news,
  init_breaking: breaking,
  init_themes: themes.sections,
  key_devs: themes.key_developments,
  timeline,
  timeline_chapters,
  ai_cards: ai_cards.cards,
  iran_lead: ai_cards.iran_lead,
  brics_lead: ai_cards.brics_lead,
  ukraine_lead: ai_cards.ukraine_lead,
  glossary: glossary.terms || [],
  tier3_state_outlets: tier3StateOutlets,
  risk_countries: actors.risk_countries,
  chess_players: actors.chess_players,
  country_keys: actors.country_keys,
  theaters: actors.theaters || [],
  human_cost: humanCost,
  econ_commentary: (econCommentary && econCommentary.cards) || [],
  map_overlays: mapOverlays,
  political_calendar: politicalCalendar,
  escalation_ladder: escalation.ladder,
  escalation_axes: escalation.axes,
  outlook,
  ww3_history: markets.ww3_history,
  hormuz_history: markets.hormuz_history,
  brent_history: markets.brent_history,
  gas_nat_history: markets.gas_nat_history,
  gas_history: markets.gas_history,
  // Dated, event-anchored series for the time-scaled EventSeriesChart.
  // ww3/brent/gas are merged above (editorial anchors + dated daily rows); the
  // hormuz series stays anchors-only (no live instrument — verified reporting
  // only). The live tip is still spliced client-side on top.
  ww3_series: ww3Series,
  brent_series: brentSeries,
  gas_nat_series: gasNatSeries,
  hormuz_series: chartSeries.hormuz || [],
  gas_daily: markets.gas_daily || [],
  // National diesel history: EIA weekly retail series (scripts/backfill-diesel.js) — a
  // stopgap under the dashboard's own AAA daily capture (gas_daily.diesel), which wins on
  // any date both cover. The source block carries the citation + derived pre-war baseline.
  diesel_history: markets.diesel_eia_weekly || [],
  diesel_history_source: markets.diesel_eia_weekly_source || null,
  // Reader-orientation inputs for the "Since your last visit" panel.
  escalation_history: escalationHistory,
  event_first_seen: eventFirstSeen,
  since_last_visit_brief: themes.since_last_visit_brief || null,
  meta: {
    ww3_pct: meta.ww3_pct,
    base_last_update: meta.base_last_update,
    war_start: meta.war_start,
    now: meta.now,
    dashboard_title: meta.dashboard_title,
    version: meta.version,
    // 24h risk delta (from escalation_history) and the current-state label for the
    // WW3 chart's "NOW" marker. Both replace hardcoded values in app.js.
    ww3_delta: ww3Delta,
    ww3_delta_days: ww3DeltaDays,
    ww3_now_label: meta.ww3_now_label || null,
    // Hormuz chokepoint status chip (label/note/as_of). Round-trips through
    // data/meta.json; null until authored.
    hormuz_status: meta.hormuz_status || null,
  },
};

// ---------------------------------------------------------------------------
// Read template
// ---------------------------------------------------------------------------
const template = fs.readFileSync(path.join(SRC, 'index.template.html'), 'utf8');
for (const marker of ['<!-- DATA_INJECT -->', '<!-- JSONLD_INJECT -->', '<!-- PRERENDER_INJECT -->']) {
  if (!template.includes(marker)) {
    throw new Error(`src/index.template.html is missing the ${marker} marker`);
  }
}
const dataScript = `<script id="app-data">window.__DATA__ = ${JSON.stringify(payload).replace(/<\/script/gi, '<\\/script')};</script>`;
log('rendering static crawler content');
const prerendered = renderStaticContent(payload);
const jsonLd = renderJsonLd(payload);
const html = template
  .replace('<!-- DATA_INJECT -->', dataScript)
  .replace('<!-- JSONLD_INJECT -->', jsonLd)
  .replace('<!-- PRERENDER_INJECT -->', prerendered);

// ---------------------------------------------------------------------------
// Bundle app.js with esbuild
// ---------------------------------------------------------------------------
log('bundling src/js/app.js with esbuild');
fs.mkdirSync(path.join(DIST, 'js'), { recursive: true });
const result = esbuild.buildSync({
  entryPoints: [path.join(SRC, 'js', 'app.js')],
  bundle: true,
  outfile: path.join(DIST, 'js', 'app.js'),
  loader: { '.js': 'jsx' },
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  target: ['es2020'],
  sourcemap: true,
  minify: false,
  logLevel: 'warning',
  // React + ReactDOM come from UMD globals, not from bundle
  define: {},
});
if (result.errors && result.errors.length) {
  console.error('esbuild errors:', result.errors);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Copy CSS and data
// ---------------------------------------------------------------------------
log('copying styles.css and data/');
fs.mkdirSync(path.join(DIST, 'css'), { recursive: true });
fs.copyFileSync(path.join(SRC, 'css', 'styles.css'), path.join(DIST, 'css', 'styles.css'));
fs.mkdirSync(path.join(DIST, 'data'), { recursive: true });
const INTERNAL_DATA = new Set(['forecasts.json', 'indicators.json', 'intel_gaps.json', 'event_first_seen.json', 'escalation_history.json']);
for (const f of fs.readdirSync(DATA)) {
  if (f.endsWith('.json') && !INTERNAL_DATA.has(f)) {
    fs.copyFileSync(path.join(DATA, f), path.join(DIST, 'data', f));
  }
}

// ---------------------------------------------------------------------------
// Write dist/index.html
// ---------------------------------------------------------------------------
fs.writeFileSync(path.join(DIST, 'index.html'), html);
log(`wrote dist/index.html (${html.length} bytes)`);

// ---------------------------------------------------------------------------
// robots.txt and sitemap.xml (SEO/LLM discoverability)
// ---------------------------------------------------------------------------
const SITE_URL = 'https://conflict-monitor.jakepercy.com/';
const robotsTxt = [
  'User-agent: *',
  'Allow: /',
  '',
  'User-agent: Googlebot',
  'Allow: /',
  '',
  'User-agent: Bingbot',
  'Allow: /',
  '',
  'User-agent: GPTBot',
  'Allow: /',
  '',
  'User-agent: ClaudeBot',
  'Allow: /',
  '',
  'User-agent: Claude-Web',
  'Allow: /',
  '',
  'User-agent: anthropic-ai',
  'Allow: /',
  '',
  'User-agent: PerplexityBot',
  'Allow: /',
  '',
  'User-agent: CCBot',
  'Allow: /',
  '',
  `Sitemap: ${SITE_URL}sitemap.xml`,
  '',
].join('\n');
fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsTxt);
log(`wrote dist/robots.txt (${robotsTxt.length} bytes)`);

const lastmod = meta.last_built || new Date().toISOString();
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml);
log(`wrote dist/sitemap.xml (${sitemapXml.length} bytes)`);

// ---------------------------------------------------------------------------
// llms.txt and methodology.md (plain-text description for AI readers). Prose is
// in src/*.tpl; the stamped current reading comes from the same data as the page.
// ---------------------------------------------------------------------------
const llmsFiles = renderLlms({
  meta,
  escalation,
  events,
  ai_cards,
  dataFiles: fs.readdirSync(path.join(DIST, 'data')).filter((f) => f.endsWith('.json')),
});
for (const [name, text] of Object.entries(llmsFiles)) {
  fs.writeFileSync(path.join(DIST, name), text);
  log(`wrote dist/${name} (${Buffer.byteLength(text)} bytes)`);
}

// ---------------------------------------------------------------------------
// Append changelog. (meta.last_built was already stamped and persisted earlier,
// before the data→dist copy, so dist/data/meta.json and sitemap.xml are current.)
// ---------------------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const changelog = path.join(ROOT, 'automation', 'logs', `changelog_${today}.md`);
fs.mkdirSync(path.dirname(changelog), { recursive: true });
const line = `- ${new Date().toISOString()} — build OK · events=${events.length} init_news=${init_news.length} timeline=${timeline.length}\n`;
if (!fs.existsSync(changelog)) {
  fs.writeFileSync(changelog, `# Changelog — ${today}\n\n${line}`);
} else {
  fs.appendFileSync(changelog, line);
}

log('done.');
