#!/usr/bin/env node
// Fixture tests for scripts/should-run.js and scripts/publish.js (npm run test:publish).
// Each case builds a throwaway world in the OS temp folder: a project checkout with a bare "origin", a private
// checkout with its own bare remote, and a stand-in Jarvis folder holding a synthetic name list and flags. Nothing
// here touches the real checkouts, GitHub or Jarvis. Planted values are assembled at run time, so this file carries
// no path or address that the push guard would stop.
//   node scripts/test/publish-fixtures.js [name-filter]
//   CM_WATCH_CHECKER=<path to check-run-record.mjs>  also runs the private repo's Watch check on each record
//   CM_FIXTURE_REAL_LIST=1  also runs the planted cases against the real name list, when Jarvis is reachable
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync, execFileSync } = require("child_process");

const SCRIPTS = path.resolve(__dirname, "..");
const CHECKER = process.env.CM_WATCH_CHECKER || null;
const FILTER = process.argv[2] || "";
const USERS = "Users";
const CLOUD = "One" + "Drive";
const PLANTED_PATH = ["C:", USERS, "fixture-person", "Documents", "notes.txt"].join("\\");
const PLANTED_EMAIL = ["someone", "example.com"].join("@");
const PLANTED_NAME = ["Planted", "Company"].join(" ");
const NOREPLY = ["1+fixture", "users.noreply.github.com"].join("@");
const MB = 1048576;
const today = (() => { const d = new Date(), p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
const PUBLIC = ["actors", "ai_cards", "breaking", "chart_series", "econ_commentary", "escalation", "events", "glossary",
  "human_cost", "map_overlays", "markets", "meta", "political_calendar", "themes"];
const INTERNAL = ["forecasts", "indicators", "intel_gaps", "event_first_seen", "escalation_history"];

// ---------- plumbing ----------
const ENV = Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: "0" });
function G(cwd, args, env) { return execFileSync("git", args, { cwd, encoding: "utf8", env: Object.assign({}, ENV, env || {}), maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "pipe"] }); }
const write = (f, t) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t); };
const json = (f, v) => write(f, JSON.stringify(v, null, 2) + "\n");
const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
function page(bytes) { const line = "<p>fixture board line</p>\n"; return line.repeat(Math.ceil(bytes / line.length)).slice(0, bytes); }

function world(opts = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cm-fx-"));
  const W = { root, project: path.join(root, "project"), origin: path.join(root, "origin.git"), private: path.join(root, "private"),
    privOrigin: path.join(root, "private-origin.git"), jarvis: path.join(root, "jarvis") };
  // Pin CommonJS for the stand-in Jarvis files: a package.json in a parent of the temp folder could say otherwise.
  json(path.join(root, "package.json"), { type: "commonjs" });
  G(root, ["init", "-q", "--bare", "-b", "master", W.origin]);
  G(root, ["init", "-q", "--bare", "-b", "master", W.privOrigin]);
  const P = W.project;
  fs.mkdirSync(P, { recursive: true });
  G(P, ["init", "-q", "-b", "master"]);
  for (const [k, v] of [["user.name", "Fixture"], ["user.email", NOREPLY], ["core.autocrlf", "false"]]) G(P, ["config", k, v]);
  for (const f of ["should-run.js", "publish.js", "lib/publish-lib.js"]) write(path.join(P, "scripts", f), fs.readFileSync(path.join(SCRIPTS, f)));
  write(path.join(P, "scripts", "fake-test.js"), "process.exit(process.env.CM_FAKE_TEST_FAIL === '1' ? 1 : 0);\n");
  json(path.join(P, "package.json"), { name: "fixture", private: true, scripts: { test: "node scripts/fake-test.js" } });
  write(path.join(P, ".gitignore"), ["/automation/", "/project-memory/", "/.claude/", "/status/",
    ...INTERNAL.map(n => `/data/${n}.json`), "*.log", ""].join("\n"));
  const data = {
    actors: { risk_countries: [{ name: "Alpha" }], chess_players: [{ name: "Beta" }], theaters: [], country_keys: { Alpha: "a" } },
    meta: { dashboard_title: "Fixture", now: new Date().toISOString(), ww3_pct: 60, ww3_now_label: "Fixture day one", last_built: new Date().toISOString() },
    events: Array.from({ length: 100 }, (_, i) => ({ id: `e${i}`, headline: `Event ${i}` })),
  };
  for (const n of PUBLIC) { const v = data[n] || { fixture: n }; json(path.join(P, "data", `${n}.json`), v); json(path.join(P, "dist", "data", `${n}.json`), v); }
  for (const n of INTERNAL) json(path.join(P, "data", `${n}.json`), { internal: n });
  json(path.join(P, "schemas", "known_outlets.json"), { outlets: [{ canonical: "Wire One", tier: "1" }] });
  write(path.join(P, "dist", "index.html"), page(opts.indexBytes || Math.round(1.2 * MB)));
  write(path.join(P, "automation", "plans", "plan-one.md"), "# A private plan\n");
  write(path.join(P, "project-memory", "notes.md"), "# Private memory\n");
  G(P, ["add", "-A"]);
  G(P, ["commit", "-q", "-m", "Initial"]);
  G(P, ["remote", "add", "origin", W.origin]);
  G(P, ["push", "-q", "-u", "origin", "master"]);
  // private checkout
  fs.mkdirSync(W.private, { recursive: true });
  G(W.private, ["init", "-q", "-b", "master"]);
  for (const [k, v] of [["user.name", "Fixture"], ["user.email", NOREPLY], ["core.autocrlf", "false"]]) G(W.private, ["config", k, v]);
  write(path.join(W.private, "README.md"), "# Private\n");
  write(path.join(W.private, ".gitignore"), "node_modules/\n");
  write(path.join(W.private, ".gitattributes"), "* -text\n");
  write(path.join(W.private, ".github", "watch", "check-run-record.mjs"), "// placeholder\n");
  G(W.private, ["add", "-A"]);
  G(W.private, ["commit", "-q", "-m", "Initial"]);
  G(W.private, ["remote", "add", "origin", W.privOrigin]);
  G(W.private, ["push", "-q", "-u", "origin", "master"]);
  // stand-in Jarvis
  const list = opts.realList ? fs.readFileSync(opts.realList.list, "utf8") : [
    "# synthetic fixture list",
    `name\t${PLANTED_NAME}`,
    `machine path\tre:[A-Za-z]:(\\\\|/)+${USERS}|${CLOUD}`,
    `account name\tre:fixture-person`,
    "",
  ].join("\n");
  write(path.join(W.jarvis, "Security", "git-guard", "repo-denylists", "conflict-monitor.txt"), list);
  if (opts.realList) {
    for (const f of ["patterns.js", "denylist.txt"]) write(path.join(W.jarvis, "Security", "git-guard", f), fs.readFileSync(path.join(opts.realList.dir, f)));
  } else {
    write(path.join(W.jarvis, "Security", "git-guard", "patterns.js"),
      "module.exports = { scanText: t => /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(t) ? [{ kind: 'secret', label: 'private key block' }] : [] };\n");
  }
  fs.mkdirSync(path.join(W.jarvis, "Domains", "Work", "GitHub"), { recursive: true });
  fs.mkdirSync(path.join(W.jarvis, "Journal"), { recursive: true });
  return W;
}

// A finished pipeline run: new events, a moved index, a rebuilt page and an executor log that reports PASS.
function update(W, o = {}) {
  const P = W.project, d = n => path.join(P, "data", `${n}.json`);
  const both = (n, v) => { json(d(n), v); json(path.join(P, "dist", "data", `${n}.json`), v); };
  const ev = read(d("events"));
  let events = ev.slice(o.shrinkTo ? ev.length - o.shrinkTo : 0);
  const add = o.addEvents == null ? 3 : o.addEvents;
  const start = Math.max(...ev.map(e => Number(e.id.slice(1)))) + 1;
  for (let i = 0; i < add; i++) events.push({ id: `e${start + i}`, headline: `New event ${start + i}` });
  if (o.plantInEvents) events[events.length - 1].headline = o.plantInEvents;
  both("events", events);
  const meta = read(d("meta"));
  meta.ww3_pct += o.ww3Delta == null ? 1 : o.ww3Delta;
  meta.now = new Date().toISOString();
  meta.ww3_now_label = o.label || `Fixture update ${Date.now()}`;
  both("meta", meta);
  if (o.actor) { const a = read(d("actors")); a.chess_players.push({ name: o.actor }); both("actors", a); }
  if (o.outlet) { const f = path.join(P, "schemas", "known_outlets.json"); const x = read(f); x.outlets.push({ canonical: o.outlet, tier: "3" }); json(f, x); }
  if (o.newDataFile) { json(path.join(P, "data", `${o.newDataFile}.json`), { surprise: true }); json(path.join(P, "dist", "data", `${o.newDataFile}.json`), { surprise: true }); }
  const before = fs.statSync(path.join(P, "dist", "index.html")).size;
  let html = page(Math.round(before * (o.sizeFactor || 1.01)));
  if (o.plantInPage) html = o.plantInPage + "\n" + html;
  write(path.join(P, "dist", "index.html"), html);
  if (!o.noLog) write(path.join(P, "automation", "logs", `execute_${today}.log`),
    `=== Execute log: ${today} ===\narbiter_verdict: ${o.verdict || "edited"}\n\nnpm test: ${o.logResult || "PASS"} (exit 0)\n`);
}

function runScript(W, script, args = [], env = {}, cwd = W.project) {
  const r = spawnSync(process.execPath, [path.join(cwd, "scripts", script)].concat(args), {
    cwd, encoding: "utf8", env: Object.assign({}, ENV, { CM_TEST_ROOT: W.root }, env), maxBuffer: 1 << 28,
  });
  const line = (r.stdout || "").split(/\r?\n/).find(Boolean) || "";
  return { code: r.status, line, out: r.stdout, err: r.stderr };
}
const publish = (W, args, env) => runScript(W, "publish.js", args, env);
const shouldRun = (W, env) => runScript(W, "should-run.js", [], env);
const originHead = W => G(W.root, ["--git-dir", W.origin, "rev-parse", "master"]).trim();
function privateRecord(W) { try { return JSON.parse(G(W.root, ["--git-dir", W.privOrigin, "show", "master:status/last-run.json"])); } catch { return null; } }
const privateHas = (W, rel) => { try { G(W.root, ["--git-dir", W.privOrigin, "cat-file", "-e", `master:${rel}`]); return true; } catch { return false; } };
const privateShow = (W, rel) => G(W.root, ["--git-dir", W.privOrigin, "show", `master:${rel}`]);
const originHas = (W, rel) => { try { G(W.root, ["--git-dir", W.origin, "cat-file", "-e", `master:${rel}`]); return true; } catch { return false; } };
const holdFiles = W => { const d = path.join(W.project, "automation", "holds"); return fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.startsWith("HOLD-")) : []; };
function ageHold(W, hoursAgo) {
  for (const f of holdFiles(W)) {
    const file = path.join(W.project, "automation", "holds", f);
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/^held_at: .*$/m, `held_at: ${new Date(Date.now() - hoursAgo * 3600e3).toISOString()}`));
  }
}
function checker(rec) {
  if (!CHECKER || !rec) return null;
  const f = path.join(os.tmpdir(), `cm-fx-record-${process.pid}.json`);
  fs.writeFileSync(f, JSON.stringify(rec));
  const r = spawnSync(process.execPath, [CHECKER, f], { encoding: "utf8" });
  fs.rmSync(f, { force: true });
  return r.status;
}
function pushFromOtherClone(W, bare, rel, text) {
  const other = path.join(W.root, `other-${Date.now()}`);
  G(W.root, ["clone", "-q", bare, other]);
  for (const [k, v] of [["user.name", "Fixture"], ["user.email", NOREPLY]]) G(other, ["config", k, v]);
  write(path.join(other, rel), text);
  G(other, ["add", "-A"]);
  G(other, ["commit", "-q", "-m", "Bump a workflow action"]);
  G(other, ["push", "-q", "origin", "master"]);
}

// ---------- assertions ----------
function expect(cond, what) { if (!cond) throw new Error(what); }
function word(r, w, code) {
  expect(r.line.startsWith(`${w}:`), `expected ${w}, got "${r.line}"${r.err ? ` (stderr: ${r.err.trim().split("\n").slice(-2).join(" | ")})` : ""}`);
  if (code != null) expect(r.code === code, `expected exit ${code}, got ${r.code}`);
}
const unchanged = (W, head) => expect(originHead(W) === head, "origin moved, but nothing should have been pushed");
function noLeak(r, W, planted) {
  expect(!r.out.includes(planted), "the planted value was echoed on stdout");
  const rec = privateRecord(W);
  expect(!rec || !JSON.stringify(rec).includes(planted), "the planted value reached the run record");
}

// ---------- cases ----------
const CASES = {
  "clean update publishes, records and mirrors"() {
    const W = world(); const head = originHead(W);
    update(W);
    const r = publish(W); word(r, "PUBLISHED", 0);
    expect(originHead(W) !== head, "origin did not move");
    const msg = G(W.project, ["log", "-1", "--format=%B"]);
    expect(msg.startsWith(`Update ${today}: Fixture update`), `bad subject: ${msg.split("\n")[0]}`);
    expect(msg.includes("Published-by: publish.js"), "trailer missing");
    expect(G(W.project, ["log", "-1", "--format=%ae"]).trim() === NOREPLY, "author is not the noreply address");
    const files = G(W.project, ["show", "--name-only", "--format=", "HEAD"]).split(/\r?\n/).filter(Boolean);
    expect(files.every(f => f.startsWith("dist/") || /^data\/[a-z_]+\.json$/.test(f)), `unexpected file in commit: ${files.join(", ")}`);
    expect(!originHas(W, "data/forecasts.json") && !originHas(W, "automation/plans/plan-one.md"), "a private file reached the public origin");
    const rec = privateRecord(W);
    expect(rec && rec.outcome === "published", `private record: ${JSON.stringify(rec)}`);
    expect(/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(rec.date), "record date has no time");
    expect(rec.commit === G(W.project, ["rev-parse", "HEAD"]).trim(), "record commit mismatch");
    expect(/^pushed/.test(rec.mirror), `mirror: ${rec.mirror}`);
    for (const f of ["automation/plans/plan-one.md", "project-memory/notes.md", "data/forecasts.json", "status/last-run.json"]) expect(privateHas(W, f), `mirror lacks ${f}`);
    for (const f of [".github/watch/check-run-record.mjs", "README.md", ".gitignore", ".gitattributes"]) expect(privateHas(W, f), `mirror lost ${f}`);
    expect(!privateHas(W, "automation/publish.lock"), "the lock was mirrored");
    const j = fs.readFileSync(path.join(W.jarvis, "Journal", `${today}.md`), "utf8");
    expect(/Conflict Monitor published/.test(j), "no journal line");
    const c = checker(rec); expect(c === null || c === 0, `Watch check exit ${c} on a published record`);
    return W;
  },
  "dry run commits nothing and keeps its record local"() {
    const W = world(); const head = originHead(W);
    update(W);
    word(publish(W, ["--dry-run"]), "DRY-RUN", 0);
    unchanged(W, head);
    expect(privateRecord(W) === null, "a dry-run record reached the private repo");
    expect(fs.existsSync(path.join(W.project, "status", "last-run.dry-run.json")), "no local dry-run record");
    expect(!fs.existsSync(path.join(W.project, "status", "last-run.json")), "the real record file was written");
    expect(G(W.project, ["diff", "--cached", "--name-only"]).trim() === "", "files left staged");
  },
  "rehearsal flag turns the publish into a dry run"() {
    const W = world(); const head = originHead(W);
    write(path.join(W.jarvis, "Domains", "Work", "GitHub", "REHEARSAL-conflict-monitor"), "");
    word(shouldRun(W), "PUBLISH_PENDING", 0);
    update(W);
    word(publish(W), "DRY-RUN", 0);
    unchanged(W, head);
    expect(privateRecord(W) === null, "rehearsal pushed a record");
  },
  "dirty code tree is refused by both scripts"() {
    const W = world(); const head = originHead(W);
    update(W);
    fs.appendFileSync(path.join(W.project, "scripts", "fake-test.js"), "// hand edit\n");
    const s = shouldRun(W); word(s, "SKIP", 0);
    expect(/refused/.test(s.line) && /scripts\/fake-test\.js/.test(s.line), s.line);
    const r = publish(W); word(r, "REFUSED", 1);
    expect(/scripts\/fake-test\.js/.test(r.line), "the refusal does not name the file");
    unchanged(W, head);
    const rec = privateRecord(W);
    expect(rec && rec.outcome === "refused", "no refused record pushed");
    const c = checker(rec); expect(c === null || c === 1, `Watch check should alert on a refusal (exit ${c})`);
  },
  "failing test refuses"() {
    const W = world(); const head = originHead(W);
    update(W);
    const r = publish(W, [], { CM_FAKE_TEST_FAIL: "1" }); word(r, "REFUSED", 1);
    expect(/npm test failed/.test(r.line), r.line); unchanged(W, head);
  },
  "undersize page refuses"() {
    const W = world({ indexBytes: Math.round(1.1 * MB) }); const head = originHead(W);
    update(W, { sizeFactor: 0.86 });
    const r = publish(W); word(r, "REFUSED", 1); expect(/1 MB floor/.test(r.line), r.line); unchanged(W, head);
  },
  "oversize page refuses"() {
    const W = world({ indexBytes: Math.round(1.1 * MB) }); const head = originHead(W);
    update(W, { sizeFactor: 1.36 });
    const r = publish(W); word(r, "REFUSED", 1); expect(/136 %/.test(r.line), r.line); unchanged(W, head);
  },
  "degraded page (75 %) refuses"() {
    const W = world({ indexBytes: Math.round(1.4 * MB) }); const head = originHead(W);
    update(W, { sizeFactor: 0.75 });
    const r = publish(W); word(r, "REFUSED", 1); expect(/75 %/.test(r.line), r.line); unchanged(W, head);
  },
  "new actor holds"() { holdCase({ actor: "Gamma" }, /adds 1 actor: Gamma/); },
  "index jump of 5 holds"() { holdCase({ ww3Delta: 5 }, /moves the WW3 index by \+5/); },
  "new outlet holds"() { holdCase({ outlet: "New Wire" }, /adds 1 outlet: New Wire/); },
  "events shrinking by more than 5 % holds"() { holdCase({ shrinkTo: 90, addEvents: 0 }, /shrinks events\.json from 100 to 90/); },
  "more than 80 new events holds"() { holdCase({ addEvents: 81 }, /adds 81 events/); },
  "new data file holds, and a release never publishes it"() {
    const W = holdCase({ newDataFile: "surprise" }, /new data file/);
    const r = publish(W, ["--release"]); word(r, "PUBLISHED", 0);
    expect(!originHas(W, "data/surprise.json") && !originHas(W, "dist/data/surprise.json"), "the unknown data file was published");
  },
  "open hold: should-run skips and publish stays held"() {
    const W = holdCase({ actor: "Gamma" }, /actor/); const head = originHead(W);
    const s = shouldRun(W); word(s, "SKIP", 0); expect(/is held/.test(s.line), s.line);
    word(publish(W), "HELD", 0); unchanged(W, head);
  },
  "expired hold is released and published"() {
    const W = holdCase({ actor: "Gamma" }, /actor/);
    ageHold(W, 25);
    const s = shouldRun(W); word(s, "PUBLISH_PENDING", 0); expect(/released/.test(s.line), s.line);
    word(publish(W), "PUBLISHED", 0);
    expect(fs.readFileSync(path.join(W.project, "automation", "holds", holdFiles(W)[0]), "utf8").includes("status: published"), "hold not marked published");
  },
  "KEEP marker keeps an expired hold"() {
    const W = holdCase({ actor: "Gamma" }, /actor/); const head = originHead(W);
    ageHold(W, 30);
    write(path.join(W.project, "automation", "holds", `KEEP-${today}`), "");
    const s = shouldRun(W); word(s, "SKIP", 0); expect(/keep holding/.test(s.line), s.line);
    word(publish(W), "HELD", 0); unchanged(W, head);
  },
  "a released update that changed again is held again"() {
    const W = holdCase({ actor: "Gamma" }, /actor/); const head = originHead(W);
    ageHold(W, 25); word(shouldRun(W), "PUBLISH_PENDING", 0);
    update(W, { actor: "Delta" });
    const r = publish(W); word(r, "HELD", 0); expect(/changed after/.test(r.line), r.line); unchanged(W, head);
  },
  "pause flag stops both scripts"() {
    const W = world(); const head = originHead(W);
    update(W);
    write(path.join(W.jarvis, "Domains", "Work", "GitHub", "PAUSE-conflict-monitor"), "");
    word(shouldRun(W), "PAUSED", 0); word(publish(W), "PAUSED", 0); unchanged(W, head);
  },
  "completed but unpublished update is pending"() {
    const W = world(); update(W);
    const s = shouldRun(W); word(s, "PUBLISH_PENDING", 0); expect(/completed but is not published/.test(s.line), s.line);
  },
  "no executor log refuses"() {
    const W = world(); const head = originHead(W);
    update(W, { noLog: true });
    const r = publish(W); word(r, "REFUSED", 1); expect(/not complete/.test(r.line), r.line); unchanged(W, head);
  },
  "redo request or a failing log refuses"() {
    const W = world(); const head = originHead(W);
    update(W);
    write(path.join(W.project, "automation", "plans", `redo-request-${today}.md`), "redo\n");
    let r = publish(W); word(r, "REFUSED", 1); expect(/redo/.test(r.line), r.line);
    fs.rmSync(path.join(W.project, "automation", "plans", `redo-request-${today}.md`));
    update(W, { logResult: "FAIL" });
    r = publish(W); word(r, "REFUSED", 1); expect(/passing test run/.test(r.line), r.line); unchanged(W, head);
  },
  "failed push is kept, retried once, then left for a hand push"() {
    // Fetch keeps working; only the push fails (a guard block or a refused key looks like this).
    const breakPush = W => G(W.project, ["remote", "set-url", "--push", "origin", path.join(W.root, "missing.git")]);
    const fixPush = W => G(W.project, ["remote", "set-url", "--push", "origin", W.origin]);
    const W = world(); const head = originHead(W);
    update(W);
    breakPush(W);
    let r = publish(W); word(r, "REFUSED", 1); expect(/retries it once/.test(r.line), r.line);
    expect(Number(G(W.project, ["rev-list", "--count", "origin/master..HEAD"]).trim()) === 1, "the commit was not kept");
    const s = shouldRun(W); word(s, "PUBLISH_PENDING", 0); expect(/failed push/.test(s.line), s.line);
    r = publish(W); word(r, "REFUSED", 1); expect(/failed again/.test(r.line), r.line);
    fixPush(W);
    r = publish(W); word(r, "REFUSED", 1); expect(/failed twice/.test(r.line), r.line);
    unchanged(W, head);
    G(W.project, ["push", "-q", "origin", "master"]); // the hand push
    word(publish(W), "NOTHING", 0);
    // The retry path itself: one failure, then a working push.
    const W2 = world(); update(W2);
    breakPush(W2);
    word(publish(W2), "REFUSED", 1);
    fixPush(W2);
    const r2 = publish(W2); word(r2, "PUBLISHED", 0); expect(/failed run left/.test(r2.line), r2.line);
    expect(originHead(W2) === G(W2.project, ["rev-parse", "HEAD"]).trim(), "the retried commit is not on origin");
  },
  "remote moved during the run refuses"() {
    const W = world();
    update(W);
    pushFromOtherClone(W, W.origin, ".github/bump.txt", "bump\n");
    const head = originHead(W);
    const r = publish(W); word(r, "REFUSED", 1); expect(/GitHub has 1 commit/.test(r.line), r.line); unchanged(W, head);
  },
  "should-run fast-forwards a clean checkout"() {
    const W = world();
    pushFromOtherClone(W, W.origin, ".github/bump.txt", "bump\n");
    shouldRun(W);
    expect(G(W.project, ["rev-parse", "HEAD"]).trim() === originHead(W), "should-run did not fast-forward");
  },
  "lock held refuses; a stale lock is taken over"() {
    const W = world(); const head = originHead(W);
    update(W);
    const lock = path.join(W.project, "automation", "publish.lock");
    write(lock, "1 now\n");
    let r = publish(W); word(r, "REFUSED", 1); expect(/lock/.test(r.line), r.line); unchanged(W, head);
    word(shouldRun(W), "SKIP", 0);
    const old = new Date(Date.now() - 31 * 60e3); fs.utimesSync(lock, old, old);
    r = publish(W); word(r, "PUBLISHED", 0);
    expect(!fs.existsSync(lock), "the lock was not released");
  },
  "planted machine path in a public data file is refused"() { plantedCase({ plantInEvents: PLANTED_PATH }, PLANTED_PATH, /machine path in data\/events\.json/); },
  "planted email in a public data file is refused"() { plantedCase({ plantInEvents: `write to ${PLANTED_EMAIL}` }, PLANTED_EMAIL, /email address in data\/events\.json/); },
  "planted name wrapped across lines is refused"() {
    const [a, b] = PLANTED_NAME.split(" ");
    plantedCase({ plantInPage: `${a}\n${b}` }, PLANTED_NAME, /wrapped across lines\) in dist\/index\.html/);
  },
  "planted name behind an escaped line break is refused"() {
    const [a, b] = PLANTED_NAME.split(" ");
    plantedCase({ plantInEvents: `${a}\n${b}` }, PLANTED_NAME, /name in data\/events\.json/); // JSON writes it as \n
  },
  "planted name in the commit message is refused"() { plantedCase({ label: `Talks with ${PLANTED_NAME}` }, PLANTED_NAME, /commit message/); },
  "cadence: 61 h since the last publish runs, 10 h skips"() {
    for (const [h, w] of [[61, "RUN"], [10, "SKIP"]]) {
      const W = world();
      const f = path.join(W.project, "data", "themes.json"); json(f, { fixture: "themes", t: h });
      const when = new Date(Date.now() - h * 3600e3).toISOString();
      G(W.project, ["commit", "-q", "-am", "Update: earlier\n\nPublished-by: publish.js"], { GIT_COMMITTER_DATE: when, GIT_AUTHOR_DATE: when });
      G(W.project, ["push", "-q", "origin", "master"]);
      word(shouldRun(W), w, 0);
    }
  },
  "mirror sanitizes, pulls a moved private remote and refuses a protected name"() {
    const W = world();
    write(path.join(W.project, "automation", "logs", "machine.log"), `opened ${PLANTED_PATH}\n`);
    pushFromOtherClone(W, W.privOrigin, ".github/dependabot.yml", "version: 2\n");
    update(W);
    word(publish(W), "PUBLISHED", 0);
    const mirrored = privateShow(W, "automation/logs/machine.log");
    expect(!mirrored.includes(PLANTED_PATH) && /~\\Documents/.test(mirrored), `not sanitized: ${mirrored.trim()}`);
    expect(privateHas(W, ".github/dependabot.yml"), "the moved private remote was lost");
    const W2 = world();
    write(path.join(W2.project, "automation", "plans", "plan-two.md"), `${PLANTED_NAME} notes\n`);
    update(W2);
    const r = publish(W2); word(r, "PUBLISHED", 0);
    const rec = privateRecord(W2);
    expect(rec && /^refused: leak scan name in automation\/plans\/plan-two\.md/.test(rec.mirror), `mirror: ${rec && rec.mirror}`);
    expect(!privateHas(W2, "automation/plans/plan-two.md"), "the protected name reached the private remote");
    const c = checker(rec); expect(c === null || c === 1, `Watch check should alert on a refused mirror (exit ${c})`);
  },
  "--check passes a clean hand commit and refuses a planted address"() {
    const W = world();
    write(path.join(W.project, "scripts", "extra.js"), "module.exports = 1;\n");
    G(W.project, ["add", "-A"]); G(W.project, ["commit", "-q", "-m", "Add extra"]);
    word(publish(W, ["--check"]), "CHECK OK", 0);
    write(path.join(W.project, "scripts", "extra.js"), `module.exports = "${PLANTED_EMAIL}";\n`);
    const r = publish(W, ["--check"]); word(r, "CHECK FAILED", 1); expect(/email address in scripts\/extra\.js/.test(r.line), r.line);
  },
  "nothing to publish"() { const W = world(); word(publish(W), "NOTHING", 0); },
  "a copy outside the main checkout refuses"() {
    const W = world(); update(W);
    const copy = path.join(W.root, "copy");
    fs.cpSync(W.project, copy, { recursive: true });
    const r = runScript(W, "publish.js", [], {}, copy); word(r, "REFUSED", 1); expect(/not the main checkout/.test(r.line), r.line);
    const s = runScript(W, "should-run.js", [], {}, copy); word(s, "SKIP", 0);
  },
};
function holdCase(o, re) {
  const W = world(); const head = originHead(W);
  update(W, o);
  const r = publish(W); word(r, "HELD", 0);
  expect(re.test(r.line), `hold reason: ${r.line}`);
  unchanged(W, head);
  expect(holdFiles(W).length === 1, "no hold file written");
  const rec = privateRecord(W);
  expect(rec && rec.outcome === "held", "no held record pushed");
  const c = checker(rec); expect(c === null || c === 1, `Watch check should alert on a hold (exit ${c})`);
  return W;
}
function plantedCase(o, planted, re, W = world()) {
  const head = originHead(W);
  update(W, o);
  const r = publish(W); word(r, "REFUSED", 1);
  expect(re.test(r.line), `leak refusal: ${r.line}`);
  unchanged(W, head);
  noLeak(r, W, planted);
  expect(G(W.project, ["diff", "--cached", "--name-only"]).trim() === "", "files left staged after the refusal");
  return W;
}

// ---------- real-list cases ----------
function realList() {
  const cloud = process.env[CLOUD + "Commercial"];
  if (!cloud) return null;
  const dir = path.join(cloud, "Claude" + CLOUD, "Jarvis", "Security", "git-guard");
  const list = path.join(dir, "repo-denylists", "conflict-monitor.txt");
  return fs.existsSync(list) ? { dir, list } : null;
}
if (process.env.CM_FIXTURE_REAL_LIST === "1") {
  const rl = realList();
  if (rl) {
    CASES["real list: clean update publishes"] = () => { const W = world({ realList: rl }); update(W); word(publish(W), "PUBLISHED", 0); };
    CASES["real list: planted machine path is refused"] = () => plantedCase({ plantInEvents: PLANTED_PATH }, PLANTED_PATH, /machine path in data\/events\.json/, world({ realList: rl }));
    CASES["real list: planted email is refused"] = () => plantedCase({ plantInEvents: `write to ${PLANTED_EMAIL}` }, PLANTED_EMAIL, /email address in data\/events\.json/, world({ realList: rl }));
  } else console.log("(real list not reachable: real-list cases skipped)");
}

// ---------- runner ----------
let pass = 0, fail = 0;
const t0 = Date.now();
for (const [name, fn] of Object.entries(CASES)) {
  if (FILTER && !name.includes(FILTER)) continue;
  const before = new Set(fs.readdirSync(os.tmpdir()).filter(f => f.startsWith("cm-fx-")));
  let ok = false;
  try { fn(); ok = true; pass++; console.log(`PASS  ${name}`); }
  catch (e) { fail++; console.log(`FAIL  ${name}\n      ${e.message}`); }
  // A passing case's worlds are removed; a failing case's are kept for inspection.
  const made = fs.readdirSync(os.tmpdir()).filter(x => x.startsWith("cm-fx-") && !before.has(x));
  if (ok) for (const f of made) { try { fs.rmSync(path.join(os.tmpdir(), f), { recursive: true, force: true }); } catch { /* ignore */ } }
  else if (made.length) console.log(`      kept: ${made.map(f => path.join(os.tmpdir(), f)).join(", ")}`);
}
console.log(`\n${pass} passed, ${fail} failed in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
process.exit(fail ? 1 : 0);
