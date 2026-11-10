#!/usr/bin/env node
/*
 * Parses the four risk sub-axes out of automation/plans/*-summary.md — the
 * plan-of-record artifact the daily pipeline already writes at the *planning*
 * step (automation/prompts/2-plan.md "Additional outputs"), before critique/
 * arbitration/execute run. These are hand-scored editorial values, not
 * something this file computes — it only recovers what the pipeline already
 * decided, for dates where data/escalation_history.json's build-time snapshot
 * was never taken or was overwritten (see reconcile-escalation-history.js).
 *
 * Cross-checked against every executor.yaml in the June-August 2026 window
 * (see reconcile-escalation-history.js header): the critique/arbitrate steps
 * essentially never change the four sub-axis scores themselves (they revise
 * currentLabel prose, event records, etc.) — "Risk score confirmed" is the
 * standard outcome. Treating the plan summary's axes as the day's axes is
 * therefore a safe recovery source, not a guess.
 */
const fs = require('node:fs');
const path = require('node:path');

// Values are occasionally markdown-bolded when a summary calls out a same-day
// change (e.g. "alliance: **60** (was 55)") — tolerate optional `*`/`_` around
// the digits rather than failing to parse the whole line.
const AXES_LINE_RE = /kinetic:\s*[*_]*(\d+)[*_]*\s*\|\s*greatpower:\s*[*_]*(\d+)[*_]*\s*\|\s*wmd:\s*[*_]*(\d+)[*_]*\s*\|\s*alliance:\s*[*_]*(\d+)[*_]*/i;
const FRONTMATTER_DATE_RE = /^date:\s*(\d{4}-\d{2}-\d{2})\s*$/m;
const FILENAME_DATE_RE = /(\d{4}-\d{2}-\d{2})/;

/**
 * @param {string} plansDir absolute path to automation/plans
 * @returns {{ byDate: Map<string, {kinetic:number, greatpower:number, wmd:number, alliance:number, file:string}>, unparsed: string[] }}
 */
function parsePlanSummaries(plansDir) {
  const byDate = new Map();
  const unparsed = [];
  let files = [];
  try {
    files = fs.readdirSync(plansDir).filter((f) => f.endsWith('-summary.md'));
  } catch (_) {
    return { byDate, unparsed };
  }
  // A `rescore-*-summary.md` file is a sourced, after-the-fact correction of a
  // day's axes (an audit re-score). It must win over that date's original plan
  // or backfill summary regardless of directory order, so process it last. The
  // original summary stays on disk untouched as the record of what was published.
  const isRescore = (f) => f.startsWith('rescore-');
  files.sort((a, b) => (isRescore(a) - isRescore(b)) || a.localeCompare(b));
  for (const f of files) {
    const full = path.join(plansDir, f);
    let text;
    try { text = fs.readFileSync(full, 'utf8'); } catch (_) { unparsed.push(f); continue; }

    const fmDate = FRONTMATTER_DATE_RE.exec(text);
    const fnDate = FILENAME_DATE_RE.exec(f);
    const date = (fmDate && fmDate[1]) || (fnDate && fnDate[1]) || null;
    if (!date) { unparsed.push(f); continue; }

    const m = AXES_LINE_RE.exec(text);
    if (!m) { unparsed.push(f); continue; }

    const axes = {
      kinetic: Number(m[1]),
      greatpower: Number(m[2]),
      wmd: Number(m[3]),
      alliance: Number(m[4]),
    };
    if (Object.values(axes).some((v) => !Number.isFinite(v))) { unparsed.push(f); continue; }

    // Same-day re-runs (e.g. "-run2") or a plan later superseded by a same-date
    // file: last one wins by directory order, which is fine since these are
    // rare and both represent the same editorial day.
    // kind: 'rescore' (audit correction), 'backfill' (a later run scoring a
    // day no run covered, from that later run's evidence) or 'plan' (the day's
    // own run). reconcile-escalation-history.js labels each history row by it.
    // A re-score of a day no run covered stays 'rescore-inferred': it corrects
    // the axes but the day is still scored from a later run's evidence.
    const prior = byDate.get(date);
    const kind = isRescore(f)
      ? ((prior && prior.kind === 'plan') ? 'rescore' : 'rescore-inferred')
      : (/^backfill:\s*true\s*$/m.test(text) || f.startsWith('backfill-')) ? 'backfill' : 'plan';
    byDate.set(date, { ...axes, file: f, kind });
  }
  return { byDate, unparsed };
}

module.exports = { parsePlanSummaries };
