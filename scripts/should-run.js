#!/usr/bin/env node
// npm run should-run: the morning decision for the scheduled task. Prints one line, "WORD: sentence", where WORD is
//   PAUSED           the pause flag is set; do nothing
//   PUBLISH_PENDING  run `npm run publish` (a finished update, a released hold, a failed push to retry, or a rehearsal)
//   RUN              run the pipeline (/conflict-update), then `npm run publish`
//   SKIP             nothing to do today, or something needs a person (the sentence says which)
// Every decision is logged to automation/logs/should-run_<date>.log. A refusal also writes and pushes a run record,
// so the private repo's daily Watch emails the failure.
"use strict";
const L = require("./lib/publish-lib");

function say(word, sentence) {
  console.log(`${word}: ${sentence}`);
  try { L.log("should-run", `${word}: ${sentence}`); } catch { /* the line on stdout is what the task reads */ }
  process.exit(0);
}
function refuse(sentence) {
  let scanner = null;
  try { scanner = L.loadScanner(); } catch { /* recorded below without a push */ }
  const rec = L.makeRecord({ outcome: "refused", reason: `should-run: ${sentence}`, commit: null, index_size: null });
  L.saveRecord(rec, false);
  const pushed = L.pushRecord(rec, scanner);
  L.journal(`should-run refused: ${sentence} (record ${pushed})`);
  say("SKIP", `refused: ${sentence}. Run record ${pushed}.`);
}

function main() {
  if (!L.sameDir(process.cwd(), L.P.expectedRoot) || !L.sameDir(L.ROOT, L.P.expectedRoot)) {
    say("SKIP", `this is not the main checkout (${L.HOME_LABEL}); nothing runs from a clone or a worktree`);
  }
  const lock = L.lockInfo();
  if (lock && lock.age < 30 * 60e3) say("SKIP", "a publish is running now");

  const f = L.flags();
  if (!f.jarvis) refuse("the Jarvis folder is not reachable, so the pause flag and the name list cannot be read");
  if (f.pause) say("PAUSED", "the pause flag is set (Domains/Work/GitHub/PAUSE-conflict-monitor in Jarvis)");
  if (f.rehearsal) say("PUBLISH_PENDING", "the rehearsal flag is set, so the publish runs as a dry run and pushes nothing");

  // Holds come before the tree check: a held update is a finished, unpublished update that must stay put.
  const now = Date.now();
  for (const h of L.readHolds().filter(x => x.status === "open")) {
    const heldAt = Date.parse(h.held_at);
    if (L.keepMarker(h)) say("SKIP", `the update of ${h.date} stays held: Jake asked to keep holding it (KEEP-${h.date})`);
    if (now - heldAt < L.HOLD_RELEASE_MS) {
      say("SKIP", `the update of ${h.date} is held (${h.file}); it releases itself after ${L.localStamp(new Date(heldAt + L.HOLD_RELEASE_MS))}`);
    }
    L.setHold(h, { status: "released", released_at: new Date().toISOString(), released_by: "auto (24 h)" });
    L.log("should-run", `released ${h.file} after 24 h`);
    say("PUBLISH_PENDING", `the hold on the update of ${h.date} is older than 24 h and was released`);
  }
  if (L.readHolds().some(x => x.status === "released")) say("PUBLISH_PENDING", "a released hold is waiting to be published");

  const cls = L.classify(L.treeEntries());
  if (cls.code.length) refuse(`uncommitted changes outside the publish allowlist: ${L.listFiles(cls.code)}. Commit them by hand (with Jake's OK) or revert them`);

  // Sync. A hand commit or a merged pull request reaches this checkout before the pipeline touches any file.
  if (L.tryGit(["fetch", "-q", "origin"]).code !== 0) say("SKIP", "cannot reach GitHub to fetch; nothing runs until it can");
  const { behind, ahead } = L.originCounts();
  if (ahead > 0) {
    const own = L.git(["rev-list", "origin/master..HEAD"]).split(/\s+/).filter(Boolean).every(L.isPublishCommit);
    if (!own) refuse("this checkout has local commits that the publish did not make; push or remove them by hand");
    if (behind > 0) refuse("a commit from a failed push is waiting, but GitHub also has commits this checkout lacks; reconcile by hand");
    say("PUBLISH_PENDING", "a commit from a failed push is waiting to be pushed");
  }
  if (behind > 0) {
    const r = L.tryGit(["pull", "-q", "--ff-only", "origin", "master"]);
    L.rawLog("should-run", "pull --ff-only", r.out + r.err);
    if (r.code !== 0) refuse(`GitHub has ${behind} commit(s) this checkout lacks and they cannot be fast-forwarded over the local changes`);
    L.log("should-run", `fast-forwarded ${behind} commit(s) from origin/master`);
  }

  const run = L.completedRun([L.ymd(), L.yesterday()]);
  if (run.ok && (cls.publicChanged.length || cls.newData.length)) {
    say("PUBLISH_PENDING", `the update of ${run.date} completed but is not published`);
  }

  // Cadence: L.CADENCE_MS (40 h) since the last automated publish on origin/master; before the first one, the committed build time.
  const last = L.git(["log", "-1", "--format=%ct", "origin/master", "--grep", `^${L.TRAILER}$`]).trim();
  let lastMs = last ? Number(last) * 1000 : NaN, basis = "the last automated publish";
  if (Number.isNaN(lastMs)) {
    try { lastMs = Date.parse(JSON.parse(L.git(["show", "origin/master:data/meta.json"])).last_built); basis = "the committed build time"; }
    catch { lastMs = NaN; }
  }
  if (Number.isNaN(lastMs)) say("RUN", "no earlier publish was found");
  const age = now - lastMs;
  if (age >= L.CADENCE_MS) say("RUN", `${basis} was ${L.hours(age)} ago (${L.hours(L.CADENCE_MS)} cadence)`);
  say("SKIP", `${basis} was ${L.hours(age)} ago; the next run is due after ${L.localStamp(new Date(lastMs + L.CADENCE_MS))}`);
}

try { main(); } catch (e) {
  const detail = e.git ? `${e.message}` : e.message;
  try { L.rawLog("should-run", "error", String(e.stack || e) + (e.git ? `\n${e.git.out}\n${e.git.err}` : "")); } catch { /* ignore */ }
  try { refuse(`should-run stopped on an error (${detail})`); } catch { console.log(`SKIP: should-run stopped on an error (${detail})`); process.exit(0); }
}
