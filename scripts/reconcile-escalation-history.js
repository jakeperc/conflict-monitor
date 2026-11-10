#!/usr/bin/env node
/*
 * Rebuilds data/escalation_history.json — the dated daily record that feeds
 * the hero WW3% trajectory chart (via buildWw3Series in build.js) — from the
 * durable plan-of-record artifacts, instead of trusting whatever the file
 * currently holds on disk.
 *
 * Why this exists (2026-08-16 audit): the old mechanism (build.js writing a
 * single row for meta.now on every run, keyed by date) had two live bugs:
 *   1. A stale meta.now caused `findIndex(date === dateKey)` to silently
 *      overwrite an EARLIER day's row with today's axes (confirmed on
 *      2026-06-24, 06-28, 07-08, 07-09 — the recorded axes contradicted the
 *      same day's own plan-of-record and critique).
 *   2. Any day the build step didn't run (or didn't reach that line) got no
 *      row at all, even though the planner/critic fully scored it (confirmed
 *      missing for 06-29, 06-30, 07-10 through 07-14 — seven fully-scored
 *      days silently absent from the chart).
 * Net effect: the chart read as flat for weeks at a time while the
 * underlying sub-axis scores were actually moving several times a week.
 *
 * The fix: escalation_history.json is no longer a build side-effect. It is
 * DERIVED, every run, from:
 *   1. automation/plans/*-summary.md  — the planner's scored axes for that
 *      date (see scripts/lib/plan-summaries.js). This is authoritative.
 *   2. data/escalation.json           — today's live axes, used only for
 *      meta.now's date when no summary file exists yet for today.
 *   3. The existing history file      — fallback only, for a date covered by
 *      neither of the above (defensive; should not occur in the reconciled
 *      window in practice).
 *   4. Carry-forward                  — a date with NO source anywhere gets
 *      the last known scored axes, tagged `scored: false`, so the calendar
 *      has no silent holes and the chart can render it as "not scored" rather
 *      than pretending it was a measured, unchanged day. These dates are
 *      also written to automation/backfill-queue.json for the next planning
 *      run to actually score.
 *
 * ww3_pct per row is round(mean(axes)) to the NEAREST INTEGER (not the old
 * round-to-5), per the 2026-08-16 methodology update — see
 * project-memory/RISK_METHODOLOGY.md "The headline rule". Rounding to 5 was
 * silently absorbing genuine sub-axis movement: a single axis moving a full
 * 5-point band only shifts the four-axis mean by 1.25, which a 5-wide rounding
 * bucket swallows more often than not.
 *
 * Reused by scripts/build.js (in-process, every `npm run build`) and runnable
 * standalone: `node scripts/reconcile-escalation-history.js`.
 */
const fs = require('node:fs');
const path = require('node:path');
const { parsePlanSummaries } = require('./lib/plan-summaries');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const AUTOMATION = path.join(ROOT, 'automation');

const AXIS_KEYS = ['kinetic', 'greatpower', 'wmd', 'alliance'];
const DAILY_RECORD_START = '2026-05-19';

function round1(mean) {
  // Standard round-half-up, matching the sign-agnostic convention already
  // used for positive 0-100 scores elsewhere in this pipeline.
  return Math.floor(mean + 0.5);
}

function meanOfAxes(axes) {
  return AXIS_KEYS.reduce((sum, k) => sum + axes[k], 0) / AXIS_KEYS.length;
}

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function isIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * Pure computation — no file I/O — so it's independently testable and usable
 * from both build.js (in-process) and the CLI below.
 *
 * @param {object} opts
 * @param {Map<string,{kinetic,greatpower,wmd,alliance,file}>} opts.planByDate
 * @param {Array<{date,ww3_pct,scores}>} opts.existingHistory
 * @param {string} opts.dateKey            today, "YYYY-MM-DD" (meta.now)
 * @param {{kinetic,greatpower,wmd,alliance}|null} opts.liveAxes  today's data/escalation.json axes
 * @param {string|null} [opts.minDate]     floor override; see call-site comment
 * @returns {{ list: Array, unscored: string[], repaired: Array, filled: string[] }}
 */
function computeReconciledHistory({ planByDate, existingHistory, dateKey, liveAxes, minDate: minDateOverride }) {
  const existingByDate = new Map();
  for (const row of (existingHistory || [])) {
    if (row && isIsoDate(row.date)) existingByDate.set(row.date, row);
  }

  // The floor is the EXISTING history file's own earliest date, not the
  // earliest plan-summary on disk. Plan summaries go back to 2026-05-19, but
  // data/chart_series.json.ww3_milestones already covers Feb 28 - Jun 24 with
  // deliberately hand-curated single-point historical anchors (buildWw3Series
  // gives a daily-history value precedence over a milestone's own value on a
  // date collision) — reconciling that far back would silently overwrite
  // editorial milestone values with a recomputed axis mean. This mechanism's
  // domain is, and stays, the daily record it already owns (2026-06-24-).
  let minDate = minDateOverride;
  if (!minDate) {
    const existingDates = [...existingByDate.keys()];
    minDate = existingDates.length
      ? existingDates.reduce((a, b) => (a < b ? a : b))
      : dateKey; // bootstrap: no prior file at all — start from today only.
  }
  if (dateKey && dateKey < minDate) minDate = dateKey;

  const list = [];
  const unscored = [];
  const repaired = [];
  const filled = [];
  let lastScoredAxes = null;
  let lastScoredDate = null;

  for (let d = minDate; d <= dateKey; d = addDays(d, 1)) {
    const plan = planByDate.get(d);
    const existing = existingByDate.get(d);
    let axes, source, scored;

    if (plan) {
      axes = { kinetic: plan.kinetic, greatpower: plan.greatpower, wmd: plan.wmd, alliance: plan.alliance };
      source = plan.kind === 'rescore' ? 'audit-rescore'
        : plan.kind === 'rescore-inferred' ? 'audit-rescore-inferred'
        : plan.kind === 'backfill' ? 'backfill-inferred'
        : 'plan-of-record';
      scored = true;
      if (!existing) filled.push(d);
      else if (AXIS_KEYS.some((k) => existing.scores?.[k] !== axes[k])) {
        repaired.push({ date: d, from: existing.scores, to: axes });
      }
    } else if (d === dateKey && liveAxes) {
      axes = { ...liveAxes };
      source = 'escalation.json-live';
      scored = true;
      if (!existing) filled.push(d);
    } else if (existing && existing.scored !== false && existing.scores && AXIS_KEYS.every((k) => Number.isFinite(existing.scores[k]))) {
      // An on-disk row that was itself only carried forward is not kept: it
      // would freeze a stale value (e.g. one superseded by an audit re-score)
      // instead of carrying forward the latest scored day below.
      // Defensive fallback only — a date covered by neither the plan-of-record
      // nor today's live axes, but already present on disk. Keep it rather
      // than discard information, but don't claim it's freshly verified.
      axes = { ...existing.scores };
      source = existing.source || 'history-carryover';
      scored = existing.scored !== false;
    } else if (lastScoredAxes) {
      axes = { ...lastScoredAxes };
      source = 'carried-forward-unscored';
      scored = false;
      unscored.push(d);
    } else {
      // No source at all and nothing to carry forward (only possible at the
      // very start of the window) — skip; there is nothing honest to write.
      continue;
    }

    const ww3_pct = round1(meanOfAxes(axes));
    list.push({ date: d, ww3_pct, scores: axes, source, scored });

    if (scored) { lastScoredAxes = axes; lastScoredDate = d; }
  }

  return { list, unscored, repaired, filled, minDate };
}

function readJsonSafe(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
}

function reconcileEscalationHistory({ dataDir = DATA, automationDir = AUTOMATION, dateKey, liveAxes } = {}) {
  const plansDir = path.join(automationDir, 'plans');
  const { byDate: planByDate, unparsed } = parsePlanSummaries(plansDir);
  const existingHistory = readJsonSafe(path.join(dataDir, 'escalation_history.json')) || [];
  // The daily record starts on DAILY_RECORD_START (2026-05-19), the first day the four sub-axes
  // were scored (methodology v2, 2026-05-19). Before 2026-11-07 it started on
  // 06-24 to protect hand-set milestone values, but the 05-19..06-23 plan
  // summaries hold real scored axes, and an axis-derived value is more accurate
  // than a single editorial number. Milestones before 05-19 still stand alone.
  const existingDates = (Array.isArray(existingHistory) ? existingHistory : []).map((r) => r && r.date).filter(isIsoDate);
  const earliestExisting = existingDates.length ? existingDates.reduce((x, y) => (x < y ? x : y)) : null;
  const minDate = earliestExisting && earliestExisting < DAILY_RECORD_START ? earliestExisting : DAILY_RECORD_START;
  const result = computeReconciledHistory({ planByDate, existingHistory: Array.isArray(existingHistory) ? existingHistory : [], dateKey, liveAxes, minDate });
  return { ...result, unparsedSummaries: unparsed };
}

// ---------------------------------------------------------------------------
// Backfill queue — dates with no plan-of-record and nothing to inherit from
// (or, more commonly, an unscored carried-forward day) get logged so the next
// planning run scores them explicitly instead of the gap persisting forever.
// Cross-references data/events.json for severity>=4 records on that date so
// the queue entry says WHY the day matters, not just that it's missing.
// ---------------------------------------------------------------------------
function buildBackfillQueue({ dataDir, unscoredDates }) {
  if (!unscoredDates.length) return [];
  const events = readJsonSafe(path.join(dataDir, 'events.json')) || [];
  const byDate = new Map();
  for (const e of (Array.isArray(events) ? events : [])) {
    if (!e || !e.event_date) continue;
    if (!byDate.has(e.event_date)) byDate.set(e.event_date, []);
    byDate.get(e.event_date).push(e);
  }
  return unscoredDates.map((date) => {
    const dayEvents = byDate.get(date) || [];
    const notable = dayEvents.filter((e) => (e.severity || 0) >= 4);
    return {
      date,
      reason: notable.length
        ? `${notable.length} severity>=4 event(s) recorded this date with no risk-axis score`
        : dayEvents.length
          ? `${dayEvents.length} event(s) recorded this date with no risk-axis score`
          : 'no plan-of-record and no events recorded for this date',
      headlines: notable.slice(0, 5).map((e) => e.headline),
    };
  });
}

function writeIfChanged(file, obj) {
  const next = JSON.stringify(obj, null, 2) + '\n';
  let prev = null;
  try { prev = fs.readFileSync(file, 'utf8'); } catch (_) {}
  if (prev !== next) { fs.writeFileSync(file, next); return true; }
  return false;
}

function main() {
  const meta = readJsonSafe(path.join(DATA, 'meta.json'));
  const dateKey = (meta && meta.now || '').slice(0, 10);
  if (!isIsoDate(dateKey)) {
    console.error('reconcile-escalation-history: data/meta.json has no valid `now` date — aborting.');
    process.exit(1);
  }
  const escalation = readJsonSafe(path.join(DATA, 'escalation.json'));
  let liveAxes = null;
  if (escalation && Array.isArray(escalation.axes)) {
    liveAxes = {};
    for (const a of escalation.axes) if (a && a.key) liveAxes[a.key] = a.score;
    if (!AXIS_KEYS.every((k) => Number.isFinite(liveAxes[k]))) liveAxes = null;
  }

  const { list, unscored, repaired, filled, unparsedSummaries } = reconcileEscalationHistory({ dateKey, liveAxes });

  const historyChanged = writeIfChanged(
    path.join(DATA, 'escalation_history.json'),
    list.map(({ date, ww3_pct, scores, source, scored }) => ({ date, ww3_pct, scores, source, scored }))
  );

  const queue = buildBackfillQueue({ dataDir: DATA, unscoredDates: unscored });
  const queueChanged = writeIfChanged(path.join(AUTOMATION, 'backfill-queue.json'), queue);

  console.log(`reconcile-escalation-history: ${list.length} days (${dateKey.length ? 'through ' + dateKey : ''})`);
  if (filled.length) console.log(`  filled ${filled.length} previously-missing row(s): ${filled.join(', ')}`);
  if (repaired.length) {
    console.log(`  repaired ${repaired.length} corrupted row(s):`);
    for (const r of repaired) console.log(`    ${r.date}: ${JSON.stringify(r.from)} -> ${JSON.stringify(r.to)}`);
  }
  if (unscored.length) console.log(`  ${unscored.length} date(s) have no score anywhere, carried forward + queued for backfill: ${unscored.join(', ')}`);
  if (unparsedSummaries.length) console.log(`  ${unparsedSummaries.length} plan-summary file(s) could not be parsed for axes (skipped): ${unparsedSummaries.join(', ')}`);
  if (!historyChanged && !queueChanged) console.log('  no changes — already reconciled.');

  return { list, unscored, repaired, filled };
}

if (require.main === module) {
  main();
}

module.exports = { reconcileEscalationHistory, computeReconciledHistory, buildBackfillQueue, round1, meanOfAxes, main };
