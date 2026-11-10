#!/usr/bin/env node
// npm run publish: commits a finished update and pushes master to GitHub, which redeploys the site.
// Every gate is here, in code. Nothing is stashed, discarded, amended or forced to get past a gate.
// Prints one line, "WORD: sentence": PUBLISHED, HELD, NOTHING, PAUSED, DRY-RUN (exit 0) or REFUSED (exit 1).
// Every outcome is logged to automation/logs/publish_<date>.log; published, held and refused also write the run
// record (status/last-run.json) and push it to the private repo, whose daily Watch emails a hold or a refusal.
//
//   npm run publish                 the automated path (after /conflict-update reports Update Complete)
//   npm run publish -- --dry-run    every gate, no commit and no push; the record stays local (last-run.dry-run.json)
//   npm run publish -- --release    publish a held update now ("release it")
//   npm run publish -- --check      for a hand commit before it is pushed: folder, tests, size and leak scan only
//
// Gates, in order: 1 lock; 2 pause flag; 3 open hold; 4 folder, branch, identity, remote and tree; 5 complete run;
// 6 tests; 7 page size; 8 holds; 9 allowlist staging; 9b leak scan; 10 commit and push; 11 run record, then the
// private mirror; 12 deploy watch; 13 journal.
"use strict";
const fs = require("fs");
const path = require("path");
const L = require("./lib/publish-lib");

const argv = process.argv.slice(2);
const KNOWN = ["--dry-run", "--release", "--check"];
const bad = argv.filter(a => !KNOWN.includes(a));
if (bad.length) { console.log(`REFUSED: unknown option ${bad.join(" ")} (known: ${KNOWN.join(", ")})`); process.exit(2); }
const MODE = { dry: argv.includes("--dry-run"), release: argv.includes("--release"), check: argv.includes("--check") };

class Done { constructor(word, sentence, code = 0) { this.word = word; this.sentence = sentence; this.code = code; } }
let scanner = null;

function finish(d) {
  console.log(`${d.word}: ${d.sentence}`);
  try { L.log("publish", `${d.word}: ${d.sentence}`); } catch { /* stdout carries it */ }
  return d.code;
}
// A refusal is recorded and pushed (so Watch emails it) unless told otherwise; the journal gets one line.
function refuse(sentence, { record = true } = {}) {
  if (record && !MODE.check) {
    const rec = L.makeRecord({ outcome: MODE.dry ? "dry-run" : "refused", reason: sentence, commit: null, index_size: null });
    L.saveRecord(rec, MODE.dry);
    const pushed = MODE.dry ? "kept local (dry run)" : L.pushRecord(rec, scanner);
    if (!MODE.dry) L.journal(`publish refused: ${sentence} (record ${pushed})`);
    return new Done(MODE.dry ? "DRY-RUN" : "REFUSED", MODE.dry ? `would refuse: ${sentence}` : `${sentence}. Run record ${pushed}.`, MODE.dry ? 0 : 1);
  }
  return new Done(MODE.check ? "CHECK FAILED" : "REFUSED", sentence, 1);
}

function stageAllowlisted(cls) {
  const files = cls.publicChanged;
  if (!files.length) return [];
  L.git(["add", "-A", "--"].concat(files));
  const staged = L.git(["diff", "--cached", "--name-only", "-z"]).split("\0").filter(Boolean);
  const allowed = new Set(files);
  const stray = staged.filter(f => !allowed.has(f));
  if (stray.length) { L.git(["reset", "-q"]); throw new L.Refusal(`staging picked up files outside the allowlist: ${L.listFiles(stray)}`); }
  return staged;
}

async function afterPush(sha, outcome, extra) {
  const meta = L.jsonNow("data/meta.json") || {};
  const size = fs.existsSync(path.join(L.ROOT, L.INDEX)) ? fs.statSync(path.join(L.ROOT, L.INDEX)).size : null;
  let rec = L.makeRecord({ outcome, reason: extra, commit: sha, index_size: size, mirror: "pending", deploy: "pending" });
  L.saveRecord(rec, false);
  const recordPush = L.pushRecord(rec, scanner); // first, so alerts work even if the mirror is refused
  let mirror;
  try { mirror = L.mirrorPrivate(scanner); } catch (e) { mirror = `not mirrored: ${e.message}`; }
  const deploy = await L.watchDeploy(sha, meta.last_built);
  rec = Object.assign({}, rec, { mirror, deploy });
  L.saveRecord(rec, false);
  const finalPush = L.pushRecord(rec, scanner);
  for (const h of L.readHolds().filter(x => x.status === "released")) L.setHold(h, { status: "published", published_commit: sha });
  L.journal(`published ${sha.slice(0, 7)}: ${extra}; deploy ${deploy}; mirror ${mirror}; record ${finalPush === "pushed" ? "pushed" : `${recordPush} / ${finalPush}`}`);
  return new Done("PUBLISHED", `${extra} as ${sha.slice(0, 7)}. Deploy ${deploy}. Mirror ${mirror}. Record ${finalPush}.`);
}

async function check() {
  // For a hand commit (R4, fixes) before it is pushed: gates 4 (folder, branch, remote), 6 (tests), 7 (size) and the
  // leak scan over everything that differs from origin/master. The push guard repeats the scan at push time.
  if (!L.sameDir(process.cwd(), L.P.expectedRoot) || !L.sameDir(L.ROOT, L.P.expectedRoot)) return refuse(`run this in the main checkout (${L.HOME_LABEL}), never a clone or a worktree`);
  if (L.git(["rev-parse", "--abbrev-ref", "HEAD"]).trim() !== "master") return refuse("the checkout is not on master");
  if (L.tryGit(["fetch", "-q", "origin"]).code !== 0) return refuse("cannot reach GitHub to fetch");
  if (L.originCounts().behind > 0) return refuse("GitHub has commits this checkout lacks; pull first");
  const t = L.npmTest();
  L.rawLog("publish", "npm test (--check)", t.out + t.err);
  if (t.code !== 0) return refuse(`npm test failed (exit ${t.code})`);
  const sizeWhy = sizeGate("origin/master");
  if (sizeWhy) return refuse(sizeWhy);
  const diff = L.git(["diff", "origin/master", "--unified=0", "--no-color", "--no-ext-diff", "--text"]);
  const names = L.git(["diff", "origin/master", "--name-only", "-z"]).split("\0").filter(Boolean);
  const msgs = L.git(["log", "--format=%B", "origin/master..HEAD"]);
  const hits = scanner.scanAdded(L.addedLines(diff), names, msgs || null);
  if (hits.length) return refuse(`leak scan: ${L.summariseHits(hits)}`);
  return new Done("CHECK OK", "folder, branch, tests, page size and leak scan all pass; push by hand");
}

function sizeGate(rev) {
  const abs = path.join(L.ROOT, L.INDEX);
  if (!fs.existsSync(abs)) return `${L.INDEX} is missing`;
  const now = fs.statSync(abs).size;
  if (now < L.MB) return `${L.INDEX} is ${(now / L.MB).toFixed(2)} MB, under the 1 MB floor`;
  const r = L.tryGit(["cat-file", "-s", `${rev}:${L.INDEX}`]);
  if (r.code !== 0) return null; // first publish: the floor is the only check
  const before = Number(r.out.trim());
  const pct = Math.round((now / before) * 100);
  if (pct < 80 || pct > 125) return `${L.INDEX} is ${pct} % of the published size (${(now / L.MB).toFixed(2)} MB against ${(before / L.MB).toFixed(2)} MB; allowed 80 to 125 %)`;
  return null;
}

async function main() {
  // 1. Lock: one publish at a time; stale after 30 minutes.
  const lock = L.takeLock();
  if (!lock.ok) return refuse(lock.why, { record: false });
  try {
    const f = L.flags();
    try { scanner = L.loadScanner(); } catch (e) { return refuse(e.sentence || e.message, { record: !!f.jarvis }); }
    if (MODE.check) return await check();
    if (f.rehearsal) MODE.dry = true;

    // 2. Pause flag.
    if (f.pause) return new Done("PAUSED", "the pause flag is set; nothing was published");

    // 3. Open hold.
    let holds = L.readHolds();
    const open = holds.filter(h => h.status === "open");
    if (open.length && MODE.release) {
      for (const h of open) L.setHold(h, { status: "released", released_at: new Date().toISOString(), released_by: "Jake (--release)" });
      holds = L.readHolds();
    } else if (open.length) {
      const h = open[0];
      return new Done("HELD", `the update of ${h.date} is still held (${h.file}); it releases itself after ${L.localStamp(new Date(Date.parse(h.held_at) + L.HOLD_RELEASE_MS))}, or run npm run publish -- --release`);
    }
    const released = holds.filter(h => h.status === "released");

    // 4. Folder, branch, identity, remote, tree.
    if (!L.sameDir(process.cwd(), L.P.expectedRoot) || !L.sameDir(L.ROOT, L.P.expectedRoot)) {
      return refuse(`this is not the main checkout (${L.HOME_LABEL}); never publish from a clone or a worktree`);
    }
    if (L.git(["rev-parse", "--abbrev-ref", "HEAD"]).trim() !== "master") return refuse("the checkout is not on master");
    const email = L.tryGit(["config", "user.email"]).out.trim();
    if (!L.NOREPLY.test(email)) return refuse("the commit identity is not the GitHub noreply address");
    const fetched = L.tryGit(["fetch", "-q", "origin"]);
    if (fetched.code !== 0) { L.rawLog("publish", "fetch", fetched.err); return refuse(`cannot fetch from GitHub (${L.classifyPush(fetched.err)})`); }
    const { behind, ahead } = L.originCounts();
    if (behind > 0) return refuse(`GitHub has ${behind} commit(s) this checkout lacks (a hand push or a merged pull request moved master); pull by hand, then publish`);
    if (ahead > 0) {
      const shas = L.git(["rev-list", "origin/master..HEAD"]).split(/\s+/).filter(Boolean);
      if (!shas.every(L.isPublishCommit)) return refuse("this checkout has local commits the publish did not make; push or remove them by hand");
      const st = L.readState();
      if ((st.pushFailures || 0) >= 2) return refuse(`the push of ${shas[0].slice(0, 7)} failed twice; fix the cause and push by hand`);
      if (MODE.dry) return new Done("DRY-RUN", `would retry the push of ${shas[0].slice(0, 7)} left by a failed run`);
      const p = L.tryGit(["push", "origin", "master"]);
      L.rawLog("publish", "push retry", p.out + p.err);
      if (p.code !== 0) {
        L.writeState({ pushFailures: (st.pushFailures || 0) + 1, failedCommit: shas[0] });
        return refuse(`the retried push failed again (${L.classifyPush(p.err)}); the commit is kept and needs a hand push`);
      }
      L.writeState({ pushFailures: 0, failedCommit: null });
      return await afterPush(shas[0], "published", `pushed the commit a failed run left (${L.git(["log", "-1", "--format=%s", shas[0]]).trim()})`);
    }
    let cls = L.classify(L.treeEntries());
    if (cls.code.length) return refuse(`uncommitted changes outside the publish allowlist: ${L.listFiles(cls.code)}. Commit them by hand (with Jake's OK) or revert them`);
    if (!cls.publicChanged.length && !cls.newData.length) {
      if (MODE.dry) { L.saveRecord(L.makeRecord({ outcome: "dry-run", reason: "nothing to publish", commit: null, index_size: null }), true); }
      return new Done(MODE.dry ? "DRY-RUN" : "NOTHING", "no public file differs from the last publish");
    }

    // 5. Complete run (skipped when a hold was released: that update was verified when it was held).
    let runDate = L.ymd();
    if (!released.length) {
      const r = L.completedRun([L.ymd(), L.yesterday()]);
      if (!r.ok) return refuse(`the pipeline run is not complete: ${r.why}`);
      runDate = r.date;
    } else runDate = released[0].date || runDate;

    // 6. Tests, run here (the pipeline's own claim is not trusted).
    const t = L.npmTest();
    L.rawLog("publish", "npm test", t.out + t.err);
    if (t.code !== 0) return refuse(`npm test failed (exit ${t.code}); the output is in automation/tmp`);
    cls = L.classify(L.treeEntries());
    if (cls.code.length) return refuse(`the test build changed files outside the allowlist: ${L.listFiles(cls.code)}`);

    // 7. Page size: at least 1 MB and 80 to 125 % of the published page.
    const sizeWhy = sizeGate("HEAD");
    if (sizeWhy) return refuse(sizeWhy);

    // 8. Holds (D10). A released hold applies only while the update still matches what was held.
    const fp = L.fingerprint(cls.newData);
    const releasedMatch = released.find(h => h.fingerprint === fp);
    if (!releasedMatch) {
      const reasons = L.holdReasons(cls);
      if (reasons.length) {
        if (released.length) reasons.push("changed after its earlier hold was released, so it was checked again");
        if (MODE.dry) {
          L.saveRecord(L.makeRecord({ outcome: "dry-run", reason: `would hold: ${reasons.join("; ")}`, commit: null, index_size: null }), true);
          return new Done("DRY-RUN", `would hold the update: ${reasons.join("; ")}`);
        }
        for (const h of released) L.setHold(h, { status: "superseded" });
        const file = L.writeHold(runDate, reasons, fp);
        const rec = L.makeRecord({ outcome: "held", reason: `${reasons.join("; ")} (automation/holds/${file})`, commit: null, index_size: null });
        L.saveRecord(rec, false);
        const pushed = L.pushRecord(rec, scanner);
        L.journal(`publish held the update of ${runDate}: ${reasons.join("; ")} (record ${pushed})`);
        return new Done("HELD", `the update of ${runDate} ${reasons.join("; ")}. It releases itself after 24 h unless kept. Run record ${pushed}.`);
      }
    }

    // 9. Allowlist staging: the 14 public data files, dist/ and the outlet registry, by name. Never `git add -A` on
    // the whole tree; new data files are never staged.
    const staged = stageAllowlisted(cls);
    if (!staged.length) return new Done(MODE.dry ? "DRY-RUN" : "NOTHING", "nothing publishable is left once unknown files are set aside");
    const label = String((L.jsonNow("data/meta.json") || {}).ww3_now_label || "board update").replace(/\s+/g, " ").trim();
    const subject = `Update ${runDate}: ${label}`;
    const message = `${subject}\n\n${L.TRAILER}\n`;

    // 9b. Leak scan of the staged diff and the message. A hit refuses (never a hold, so it never releases itself).
    const hits = L.scanStaged(scanner, L.ROOT, message);
    if (hits.length) {
      L.git(["reset", "-q"]);
      L.rawLog("publish", "leak scan", hits.join("\n"));
      return refuse(`leak scan: ${L.summariseHits(hits)}`);
    }
    if (MODE.dry) {
      L.git(["reset", "-q"]);
      L.saveRecord(L.makeRecord({ outcome: "dry-run", reason: `every gate passed; would commit ${staged.length} files as "${subject}"`, commit: null, index_size: fs.statSync(path.join(L.ROOT, L.INDEX)).size }), true);
      return new Done("DRY-RUN", `every gate passed; would commit ${staged.length} files as "${subject}" and push`);
    }

    // 10. Commit and push: noreply identity (checked above), one push per run. A failed push keeps the commit; the
    // next run retries it once, and a second failure stays refused until someone pushes by hand.
    const msgFile = path.join(L.P.tmp, "publish-commit-message.txt");
    fs.mkdirSync(L.P.tmp, { recursive: true });
    fs.writeFileSync(msgFile, message);
    const c = L.tryGit(["commit", "-q", "-F", msgFile]);
    if (c.code !== 0) { L.rawLog("publish", "commit", c.out + c.err); L.git(["reset", "-q"]); return refuse("the commit failed; nothing was pushed"); }
    const sha = L.git(["rev-parse", "HEAD"]).trim();
    const p = L.tryGit(["push", "origin", "master"]);
    L.rawLog("publish", "push", p.out + p.err);
    if (p.code !== 0) {
      L.writeState({ pushFailures: 1, failedCommit: sha });
      return refuse(`the push of ${sha.slice(0, 7)} failed (${L.classifyPush(p.err)}); the commit is kept and the next run retries it once`);
    }
    L.writeState({ pushFailures: 0, failedCommit: null });
    return await afterPush(sha, "published", subject);
  } finally { L.releaseLock(); }
}

main().then(d => process.exit(finish(d)), e => {
  try { L.rawLog("publish", "error", String(e.stack || e) + (e.git ? `\n${e.git.out}\n${e.git.err}` : "")); } catch { /* ignore */ }
  const d = e instanceof L.Refusal ? refuse(e.sentence) : refuse(`publish stopped on an error (${e.message})`);
  process.exit(finish(d));
});
