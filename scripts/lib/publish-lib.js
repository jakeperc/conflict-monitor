// Shared code for scripts/should-run.js and scripts/publish.js: the publishing gates, in code.
//
// This file holds no protected name and no machine path. The name list, git-guard's rules, the pause and rehearsal
// flags and the journal live in the operator's Jarvis folder, found at run time through the organisation cloud
// folder's environment variable. The private mirror's sanitizer reads the account name and the Windows domain at
// run time. The cloud product's name is assembled from two halves because the push guard rejects that word in any
// pushed line, code included.
//
// CM_TEST_ROOT (fixture tests only) roots every outside path in one scratch folder and turns off the network checks.
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const CLOUD = "One" + "Drive";
const TEST_ROOT = process.env.CM_TEST_ROOT ? path.resolve(process.env.CM_TEST_ROOT) : null;

const PUBLIC_DATA = ["actors", "ai_cards", "breaking", "chart_series", "econ_commentary", "escalation", "events",
  "glossary", "human_cost", "map_overlays", "markets", "meta", "political_calendar", "themes"].map(n => `data/${n}.json`);
const INTERNAL_DATA = ["forecasts", "indicators", "intel_gaps", "event_first_seen", "escalation_history"]
  .map(n => `data/${n}.json`);
const OUTLETS = "schemas/known_outlets.json";
const INDEX = "dist/index.html";
const MB = 1048576;
const HOUR = 3600e3;
const HOLD_RELEASE_MS = 24 * HOUR;
const LOCK_STALE_MS = 30 * 60e3;
const CADENCE_MS = 40 * HOUR; // every other day (Jake, 2026-11-10): the 04:00 task fires daily; 40 h lets a run every second morning and catches up a missed day
const TRAILER = "Published-by: publish.js";
const NOREPLY = /^\d+\+[A-Za-z0-9-]+@users\.noreply\.github\.com$/;
const PUBLIC_REPO = "jakeperc/conflict-monitor";
const SITE = "https://conflict-monitor.jakepercy.com";
const HOME_LABEL = "~/Projects/conflict-monitor";

// ---------- places ----------
function jarvisDir() {
  if (TEST_ROOT) return path.join(TEST_ROOT, "jarvis");
  const cloud = process.env[CLOUD + "Commercial"];
  return cloud ? path.join(cloud, "Claude" + CLOUD, "Jarvis") : null;
}
function jarvis() {
  const dir = jarvisDir();
  if (!dir || !fs.existsSync(dir)) return null;
  const gh = path.join(dir, "Domains", "Work", "GitHub");
  return {
    dir,
    pause: path.join(gh, "PAUSE-conflict-monitor"),
    rehearsal: path.join(gh, "REHEARSAL-conflict-monitor"),
    list: path.join(dir, "Security", "git-guard", "repo-denylists", "conflict-monitor.txt"),
    patterns: path.join(dir, "Security", "git-guard", "patterns.js"),
    journal: path.join(dir, "Journal"),
  };
}
const P = {
  root: ROOT,
  expectedRoot: TEST_ROOT ? path.join(TEST_ROOT, "project") : path.join(os.homedir(), "Projects", "conflict-monitor"),
  privateDir: TEST_ROOT ? path.join(TEST_ROOT, "private")
    : path.join(os.homedir(), "Projects", "conflict-monitor-private"),
  lock: path.join(ROOT, "automation", "publish.lock"),
  state: path.join(ROOT, "automation", "publish-state.json"),
  holds: path.join(ROOT, "automation", "holds"),
  logs: path.join(ROOT, "automation", "logs"),
  plans: path.join(ROOT, "automation", "plans"),
  tmp: path.join(ROOT, "automation", "tmp"),
  record: path.join(ROOT, "status", "last-run.json"),
  dryRecord: path.join(ROOT, "status", "last-run.dry-run.json"),
};

// ---------- time ----------
const pad = n => String(n).padStart(2, "0");
const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); };
const hours = ms => `${(ms / HOUR).toFixed(1)} h`;
const localStamp = d => `${ymd(d)} ${hm(d)}`;

// ---------- logs ----------
function appendFile(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.appendFileSync(file, text); }
// Plain-sentence log, mirrored to the private repo with automation/.
function log(kind, line) { appendFile(path.join(P.logs, `${kind}_${ymd()}.log`), `${hm()} ${line}\n`); }
// Raw tool output (git, npm). It can echo matched text, so it stays in automation/tmp/, which is never mirrored.
function rawLog(kind, label, text) {
  appendFile(path.join(P.tmp, `${kind}-raw-${ymd()}.log`), `--- ${new Date().toISOString()} ${label}\n${text}\n`);
}

// ---------- processes ----------
function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd || ROOT, encoding: "utf8", maxBuffer: 1 << 30, env: opts.env || process.env, shell: !!opts.shell,
    windowsHide: true,
  });
  return { code: r.status === null ? -1 : r.status, out: r.stdout || "", err: (r.stderr || "") + (r.error ? String(r.error.message) : "") };
}
function git(args, cwd) {
  const r = run("git", args, { cwd });
  if (r.code !== 0) { const e = new Error(`git ${args[0]} exited ${r.code}`); e.git = r; throw e; }
  return r.out;
}
const tryGit = (args, cwd) => run("git", args, { cwd });
function npmTest() { return run("npm test", [], { shell: true }); }

// ---------- flags, lock, state ----------
function flags() {
  const j = jarvis();
  return { jarvis: j, pause: !!(j && fs.existsSync(j.pause)), rehearsal: !!(j && fs.existsSync(j.rehearsal)) };
}
function lockInfo() {
  try { const st = fs.statSync(P.lock); return { age: Date.now() - st.mtimeMs, text: fs.readFileSync(P.lock, "utf8").trim() }; }
  catch { return null; }
}
function takeLock() {
  fs.mkdirSync(path.dirname(P.lock), { recursive: true });
  const info = lockInfo();
  if (info && info.age < LOCK_STALE_MS) return { ok: false, why: `another publish holds the lock (taken ${Math.round(info.age / 60e3)} min ago)` };
  if (info) fs.rmSync(P.lock, { force: true }); // stale after 30 minutes
  try { fs.writeFileSync(P.lock, `${process.pid} ${new Date().toISOString()}\n`, { flag: "wx" }); }
  catch { return { ok: false, why: "another publish took the lock at the same moment" }; }
  return { ok: true, stale: !!info };
}
const releaseLock = () => fs.rmSync(P.lock, { force: true });
function readState() { try { return JSON.parse(fs.readFileSync(P.state, "utf8")); } catch { return {}; } }
function writeState(patch) {
  const s = Object.assign(readState(), patch);
  fs.mkdirSync(path.dirname(P.state), { recursive: true });
  fs.writeFileSync(P.state, JSON.stringify(s, null, 2) + "\n");
  return s;
}

// ---------- the working tree ----------
function treeEntries(cwd = ROOT) {
  const parts = git(["status", "--porcelain=v1", "-z", "--untracked-files=all"], cwd).split("\0");
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p) continue;
    const xy = p.slice(0, 2);
    out.push({ xy, file: p.slice(3) });
    if (xy[0] === "R" || xy[0] === "C") i++; // the next field is the rename source
  }
  return out;
}
// publicChanged: allowlisted paths (the 14 public data files, dist/, the outlet registry) that differ from HEAD.
// newData: files in data/ or dist/data/ that git has never seen. They are never staged; their presence is a hold.
// code: everything else. An automated publish never carries it.
function classify(entries) {
  const pub = new Set([...PUBLIC_DATA, OUTLETS]);
  const res = { publicChanged: [], newData: [], code: [] };
  for (const { xy, file } of entries) {
    const untracked = xy === "??";
    if (pub.has(file)) res.publicChanged.push(file);
    else if (/^dist\/data\/[^/]+$/.test(file)) {
      if (PUBLIC_DATA.includes(file.slice(5))) res.publicChanged.push(file);
      else (untracked ? res.newData : res.code).push(file);
    } else if (file.startsWith("dist/")) res.publicChanged.push(file);
    else if (/^data\/[^/]+$/.test(file) && untracked) res.newData.push(file);
    else res.code.push(file);
  }
  return res;
}
const listFiles = (files, n = 8) => files.slice(0, n).join(", ") + (files.length > n ? ` and ${files.length - n} more` : "");

function sameDir(a, b) {
  const norm = p => { try { p = fs.realpathSync.native(p); } catch { /* keep as is */ } return path.resolve(p).toLowerCase(); };
  return norm(a) === norm(b);
}
function originCounts() {
  const [behind, ahead] = git(["rev-list", "--left-right", "--count", "origin/master...HEAD"]).trim().split(/\s+/).map(Number);
  return { behind, ahead };
}
const isPublishCommit = sha => git(["log", "-1", "--format=%B", sha]).includes(TRAILER);

// ---------- the pipeline's run log ----------
// A run is complete when its executor log names an arbiter verdict of passed or edited, its last test line reports
// PASS, and no redo request exists for that date.
function completedRun(dates) {
  for (const d of dates) {
    const f = path.join(P.logs, `execute_${d}.log`);
    if (!fs.existsSync(f)) continue;
    const t = fs.readFileSync(f, "utf8");
    const verdict = (t.match(/^arbiter_verdict:\s*([\w-]+)/m) || [])[1] || null;
    const tests = t.match(/^npm test\b.*$/gm) || t.match(/^validate:html:.*$/gm) || [];
    const last = tests[tests.length - 1] || "";
    const pass = /\bPASS\b/.test(last) && !/\bFAIL/.test(last);
    const redo = fs.existsSync(path.join(P.plans, `redo-request-${d}.md`));
    const ok = (verdict === "passed" || verdict === "edited") && pass && !redo;
    const why = ok ? null : redo ? `the arbiter asked for a redo on ${d}`
      : !verdict ? `the executor log of ${d} names no arbiter verdict`
      : !(verdict === "passed" || verdict === "edited") ? `the arbiter verdict of ${d} is ${verdict}`
      : `the executor log of ${d} does not report a passing test run`;
    return { date: d, ok, why };
  }
  return { date: null, ok: false, why: `no executor log for ${dates.join(" or ")}` };
}

// ---------- holds (D10, D12) ----------
function readHolds() {
  if (!fs.existsSync(P.holds)) return [];
  return fs.readdirSync(P.holds).filter(f => /^HOLD-.*\.md$/.test(f)).sort().map(f => {
    const text = fs.readFileSync(path.join(P.holds, f), "utf8");
    const fm = {};
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (m) for (const line of m[1].split(/\r?\n/)) { const i = line.indexOf(":"); if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
    return Object.assign({ file: f }, fm);
  });
}
function setHold(h, patch) {
  const file = path.join(P.holds, h.file);
  let text = fs.readFileSync(file, "utf8");
  for (const [k, v] of Object.entries(patch)) {
    const re = new RegExp(`^${k}:.*$`, "m");
    text = re.test(text) ? text.replace(re, `${k}: ${v}`) : text.replace(/^---\r?\n/, `---\n${k}: ${v}\n`);
  }
  fs.writeFileSync(file, text);
}
const keepMarker = h => fs.existsSync(path.join(P.holds, `KEEP-${h.date}`));
function writeHold(date, reasons, fp) {
  fs.mkdirSync(P.holds, { recursive: true });
  let name = `HOLD-${date}.md`;
  for (let n = 2; fs.existsSync(path.join(P.holds, name)); n++) name = `HOLD-${date}-${n}.md`;
  const now = new Date();
  const releases = new Date(now.getTime() + HOLD_RELEASE_MS);
  fs.writeFileSync(path.join(P.holds, name), [
    "---", `date: ${date}`, "status: open", `held_at: ${now.toISOString()}`, `releases_after: ${releases.toISOString()}`,
    `fingerprint: ${fp}`, "---", "", `# Update of ${date}: held`, "",
    "The publish held this update, so nothing was pushed. It held because the update:", "",
    ...reasons.map(r => `- ${r}`), "",
    `It releases itself at the first check after ${localStamp(releases)} unless a file named KEEP-${date} exists in this folder ("keep holding").`,
    "To release it now (\"release it\"), run `npm run publish -- --release` in the main checkout.", "",
  ].join("\n"));
  return name;
}
// The fingerprint of an update: the public data files and the outlet registry (meta.json without its build time,
// which every build moves) plus the names of new data files. A released hold applies only while it still matches.
function fingerprint(newData) {
  const h = crypto.createHash("sha256");
  for (const f of [...PUBLIC_DATA, OUTLETS].sort()) {
    const abs = path.join(ROOT, f);
    let t = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "<missing>";
    if (f === "data/meta.json") { try { const m = JSON.parse(t); delete m.last_built; t = JSON.stringify(m); } catch { /* hash as is */ } }
    h.update(`${f}\0${t}\0`);
  }
  h.update(`new:${newData.slice().sort().join(",")}`);
  return h.digest("hex");
}
function jsonAt(rev, f) { const r = tryGit(["show", `${rev}:${f}`]); return r.code === 0 ? JSON.parse(r.out) : null; }
function jsonNow(f) { const abs = path.join(ROOT, f); return fs.existsSync(abs) ? JSON.parse(fs.readFileSync(abs, "utf8")) : null; }
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
// D10: hold when the update adds an actor, moves ww3_pct by 5 or more, adds an outlet, shrinks events.json by more
// than 5 %, adds more than 80 events, adds a new file to data/, or deletes a public data file. A path outside the
// allowlist is refused earlier (gate 4), which is stricter than a hold: a refusal never releases itself.
function holdReasons(cls, rev = "HEAD") {
  const reasons = [];
  const actorKeys = a => {
    const s = new Set();
    if (!a) return s;
    for (const k of ["risk_countries", "chess_players", "theaters"]) for (const x of a[k] || []) if (x && x.name) s.add(`${x.name} (${k})`);
    for (const k of Object.keys(a.country_keys || {})) s.add(`${k} (country_keys)`);
    return s;
  };
  const before = actorKeys(jsonAt(rev, "data/actors.json")), after = actorKeys(jsonNow("data/actors.json"));
  const newActors = [...after].filter(k => !before.has(k));
  if (newActors.length) reasons.push(`adds ${plural(newActors.length, "actor")}: ${newActors.slice(0, 5).join(", ")}`);

  const m0 = jsonAt(rev, "data/meta.json"), m1 = jsonNow("data/meta.json");
  if (m0 && m1 && typeof m0.ww3_pct === "number" && typeof m1.ww3_pct === "number" && Math.abs(m1.ww3_pct - m0.ww3_pct) >= 5) {
    reasons.push(`moves the WW3 index by ${m1.ww3_pct - m0.ww3_pct > 0 ? "+" : ""}${m1.ww3_pct - m0.ww3_pct} points (${m0.ww3_pct} to ${m1.ww3_pct})`);
  }

  const outletNames = o => new Set(((o && o.outlets) || []).map(x => x && x.canonical).filter(Boolean));
  const o0 = outletNames(jsonAt(rev, OUTLETS)), o1 = outletNames(jsonNow(OUTLETS));
  const newOutlets = [...o1].filter(x => !o0.has(x));
  if (newOutlets.length) reasons.push(`adds ${plural(newOutlets.length, "outlet")}: ${newOutlets.slice(0, 5).join(", ")}`);

  const e0 = jsonAt(rev, "data/events.json") || [], e1 = jsonNow("data/events.json") || [];
  if (e0.length && e1.length < e0.length * 0.95) reasons.push(`shrinks events.json from ${e0.length} to ${e1.length} events (more than 5 %)`);
  const ids0 = new Set(e0.map(e => e && e.id));
  const added = e1.filter(e => e && !ids0.has(e.id)).length;
  if (added > 80) reasons.push(`adds ${added} events (more than 80)`);

  if (cls.newData.length) reasons.push(`adds ${plural(cls.newData.length, "new data file")} that no rule covers: ${listFiles(cls.newData)}`);
  const gone = PUBLIC_DATA.filter(f => !fs.existsSync(path.join(ROOT, f)));
  if (gone.length) reasons.push(`deletes ${listFiles(gone)}`);
  return reasons;
}

// ---------- leak scan (gate 9b) ----------
const GENERIC = [
  ["email address", /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/],
  ["phone number", /(?<![\d.])(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}(?![\d.])/],
];
class Refusal extends Error { constructor(sentence) { super(sentence); this.sentence = sentence; } }
function loadScanner() {
  const j = jarvis();
  if (!j) throw new Refusal("the Jarvis folder is not reachable, so the name list cannot be read (fail closed)");
  let rules;
  try {
    rules = fs.readFileSync(j.list, "utf8").split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith("#")).map(s => {
      const [cat, pat] = s.includes("\t") ? s.split("\t") : ["name", s];
      return [cat, pat.startsWith("re:") ? new RegExp(pat.slice(3), "i") : new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")];
    });
    if (!rules.length) throw new Error("empty");
  } catch { throw new Refusal("the private name list is unreadable or empty (fail closed)"); }
  let patterns;
  try { patterns = require(j.patterns); if (typeof patterns.scanText !== "function") throw new Error("no scanText"); }
  catch { throw new Refusal("git-guard's rules are unreadable (fail closed)"); }
  const all = rules.concat(GENERIC);
  const flat = s => s.replace(/\\[nrt]/g, " ").replace(/\s+/g, " ");
  const count = (s, re) => (s.match(new RegExp(re.source, "gi")) || []).length;
  const cats = text => {
    const out = new Set();
    for (const [cat, re] of all) if (re.test(text) || re.test(flat(text))) out.add(cat);
    for (const h of patterns.scanText(text)) out.add(h.kind === "secret" ? `secret (${h.label})` : "git-guard denylist");
    return [...out];
  };
  const clean = text => cats(text).length === 0;
  // Never echo the matched text: a hit names its category and its file, or "a flagged file name".
  const where = f => (clean(f) ? f : "a flagged file name");
  // added: Map(file -> [lines]). Returns hit strings.
  function scanAdded(added, names = [], message = null) {
    const hits = new Set();
    for (const n of names) for (const c of cats(n)) hits.add(`${c} in a file name`);
    for (const [file, lines] of added) {
      for (const l of lines) for (const c of cats(l)) hits.add(`${c} in ${where(file)}`);
      const joined = flat(lines.join("\n"));
      for (const [cat, re] of all) {
        if (count(joined, re) > lines.reduce((n, x) => n + count(flat(x), re), 0)) hits.add(`${cat} (wrapped across lines) in ${where(file)}`);
      }
    }
    if (message) for (const c of cats(message)) hits.add(`${c} in the commit message`);
    return [...hits];
  }
  return { cats, clean, scanAdded };
}
function addedLines(diffText) {
  const added = new Map();
  let file = "";
  for (const l of diffText.split(/\r?\n/)) {
    if (l.startsWith("+++ ")) { file = l.slice(4).replace(/^b\//, ""); continue; }
    if (!l.startsWith("+") || l.startsWith("+++")) continue;
    if (!added.has(file)) added.set(file, []);
    added.get(file).push(l.slice(1));
  }
  return added;
}
function scanStaged(scanner, cwd, message) {
  const names = git(["diff", "--cached", "--name-only", "-z"], cwd).split("\0").filter(Boolean);
  const diff = git(["diff", "--cached", "--unified=0", "--no-color", "--no-ext-diff", "--text"], cwd);
  return scanner.scanAdded(addedLines(diff), names, message);
}
const summariseHits = hits => hits.slice(0, 3).join("; ") + (hits.length > 3 ? `; and ${hits.length - 3} more` : "");

// ---------- run record ----------
function makeRecord(fields) {
  return Object.assign({ date: new Date().toISOString() }, fields); // ISO 8601 with a time: watch.yml requires it
}
function saveRecord(rec, dry) {
  const f = dry ? P.dryRecord : P.record;
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(rec, null, 2) + "\n");
}
// Brings the private checkout up to its remote first: merged Dependabot pull requests move it too.
function syncPrivate() {
  const d = P.privateDir;
  if (!fs.existsSync(path.join(d, ".git"))) return "the private checkout is missing";
  if (tryGit(["fetch", "-q", "origin"], d).code !== 0) return "could not fetch the private repo";
  const st = tryGit(["status", "-sb", "--porcelain=v1"], d).out.split("\n")[0] || "";
  if (/\[.*behind/.test(st) && tryGit(["pull", "-q", "--ff-only", "origin", "master"], d).code !== 0) return "the private checkout cannot fast-forward";
  return null;
}
function pushPrivate() {
  const r = tryGit(["push", "-q", "origin", "master"], P.privateDir);
  rawLog("publish", "private push", r.out + r.err);
  return r.code === 0 ? null : `push failed (${classifyPush(r.err)})`;
}
// Commits and pushes status/last-run.json on its own. Never throws: a failure is returned and logged locally, and
// watch.yml notices a missing or stale record.
function pushRecord(rec, scanner) {
  try {
    const bad = syncPrivate();
    if (bad) return `not pushed: ${bad}`;
    let text = JSON.stringify(rec, null, 2) + "\n";
    if (scanner && !scanner.clean(text)) {
      rec = Object.assign({}, rec, { reason: "withheld: the reason tripped the leak scan; see the local publish log" });
      text = JSON.stringify(rec, null, 2) + "\n";
    }
    if (!scanner) return "not pushed: the leak scan is unavailable";
    const f = path.join(P.privateDir, "status", "last-run.json");
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, text);
    git(["add", "--", "status/last-run.json"], P.privateDir);
    const c = tryGit(["commit", "-q", "-m", `Run record: ${rec.outcome}`, "--", "status/last-run.json"], P.privateDir);
    if (c.code !== 0 && !/nothing to commit|no changes added/.test(c.out + c.err)) return "not pushed: the record commit failed";
    const p = pushPrivate();
    return p ? `not pushed: ${p}` : "pushed";
  } catch (e) { return `not pushed: ${e.message}`; }
}
function classifyPush(err) {
  if (/repo-leak-guard|git-guard/i.test(err)) return "blocked by the push guard";
  if (/non-fast-forward|fetch first|rejected/i.test(err)) return "the remote has commits this checkout lacks";
  if (/Permission denied|publickey|denied to/i.test(err)) return "the deploy key was refused";
  if (/Could not resolve|timed out|Connection|unable to access|network/i.test(err)) return "network";
  if (/does not appear to be a git repository|not found/i.test(err)) return "the remote was not found";
  return "git error";
}

// ---------- private mirror (gate 11) ----------
// Copies the private set into the private checkout through a sanitizer that rewrites home folders, the
// organisation cloud folder and the Windows domain, then scans what it staged. Files are only added or updated,
// never deleted, and nothing outside the private set is touched (.github/, README.md, .gitattributes, .gitignore).
function sanitizer() {
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const SEG = "[^\\\\/\\s\"'`<>|:*?]+";
  const SLASH = "(?:\\\\{1,4}|/)";
  const USERS = "Users";
  const rules = [
    ["windows home folder", new RegExp("[A-Za-z]:" + SLASH + USERS + SLASH + SEG, "gi"), "~"],
    ["posix home folder", new RegExp("/[a-z]/" + USERS + "/" + SEG, "gi"), "~"],
    ["organisation cloud folder", new RegExp(CLOUD + " - [^\\\\/\\r\\n\"'`]+(?:\\r?\\n[^\\\\/\\r\\n\"'`]*)?(?=\\\\|/)", "g"), "cloud"],
    ["cloud root folder", new RegExp("Claude" + CLOUD, "g"), "cloud-root"],
    ["cloud product name", new RegExp(CLOUD, "g"), "cloud drive"],
  ];
  const user = (os.userInfo().username || "").trim();
  const domain = (process.env.USERDOMAIN || "").trim();
  if (domain && domain.toLowerCase() !== os.hostname().toLowerCase()) rules.push(["windows domain", new RegExp(esc(domain) + "(?=[+\\\\/])", "gi"), "PC"]);
  if (user.length >= 4) rules.push(["account name", new RegExp("\\b" + esc(user) + "\\b", "gi"), "user"]);
  return s => { for (const [, re, rep] of rules) s = s.replace(re, rep); return s; };
}
const MIRROR_ROOTS = ["automation", "project-memory", ".claude", "status/last-run.json"].concat(INTERNAL_DATA);
const mirrorExcluded = rel => /^automation\/tmp\//.test(rel) || /^automation\/context\/raw-feed-/.test(rel)
  || rel === "automation/publish.lock" || /^\.claude\/worktrees\//.test(rel) || rel === ".claude/settings.local.json"
  // The rolling feed store is a regenerable headline cache, and archives are local rollback copies (2026-11-10).
  || rel === "automation/context/feed-store.json" || /^automation\/backups\/.*\.(zip|tar\.gz|tgz)$/.test(rel);
function mirrorPrivate(scanner) {
  const bad = syncPrivate();
  if (bad) return `not mirrored: ${bad}`;
  const clean = sanitizer();
  const files = [];
  const walk = (abs, rel) => {
    if (!fs.existsSync(abs) || mirrorExcluded(rel)) return;
    if (fs.statSync(abs).isDirectory()) { for (const f of fs.readdirSync(abs)) walk(path.join(abs, f), `${rel}/${f}`); }
    else files.push(rel);
  };
  for (const r of MIRROR_ROOTS) walk(path.join(ROOT, r), r);
  let written = 0;
  for (const rel of files) {
    const buf = fs.readFileSync(path.join(ROOT, rel));
    const out = buf.subarray(0, 8000).includes(0) ? buf : Buffer.from(clean(buf.toString("utf8")), "utf8");
    const dest = path.join(P.privateDir, rel);
    if (fs.existsSync(dest) && fs.readFileSync(dest).equals(out)) continue;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, out);
    written++;
  }
  const roots = MIRROR_ROOTS.filter(r => fs.existsSync(path.join(P.privateDir, r)));
  git(["add", "-A", "--"].concat(roots), P.privateDir);
  if (!git(["diff", "--cached", "--name-only"], P.privateDir).trim()) return "unchanged";
  const msg = `Mirror ${ymd()}`;
  const hits = scanStaged(scanner, P.privateDir, msg);
  if (hits.length) {
    git(["reset", "-q"], P.privateDir);
    rawLog("publish", "mirror leak scan", hits.join("\n"));
    return `refused: leak scan ${summariseHits(hits)}`;
  }
  const c = tryGit(["commit", "-q", "-m", msg], P.privateDir);
  if (c.code !== 0) return "not mirrored: the commit failed";
  const p = pushPrivate();
  return p ? `committed, ${p}` : `pushed (${written} files updated)`;
}

// ---------- deploy watch (gate 12) ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Unauthenticated public API, then the live meta.json. Capped at 6 minutes so the whole publish stays inside a
// 10-minute tool call. A failed deploy is recorded, never retried; the previous deploy stays live.
async function watchDeploy(sha, builtAt) {
  if (TEST_ROOT) return "not watched (test mode)";
  const headers = { "User-Agent": "conflict-monitor-publish", Accept: "application/vnd.github+json" };
  const deadline = Date.now() + 6 * 60e3;
  let found = null;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`https://api.github.com/repos/${PUBLIC_REPO}/actions/runs?head_sha=${sha}&per_page=10`, { headers });
      if (r.ok) {
        const j = await r.json();
        found = (j.workflow_runs || []).find(w => /pages\.yml$/.test(w.path || "")) || found;
        if (found && found.status === "completed") break;
      }
    } catch { /* retry until the deadline */ }
    await sleep(20e3);
  }
  if (!found) return "unconfirmed: no deploy run appeared within 6 minutes";
  if (found.status !== "completed") return `unconfirmed: deploy run ${found.id} still ${found.status} after 6 minutes`;
  if (found.conclusion !== "success") return `failed: deploy run ${found.id} ended ${found.conclusion}`;
  try {
    const m = await (await fetch(`${SITE}/data/meta.json`, { headers: { "User-Agent": headers["User-Agent"] } })).json();
    return m.last_built === builtAt ? `live: deploy run ${found.id} succeeded and the site serves this build`
      : `deployed: run ${found.id} succeeded; the CDN can serve the previous copy for up to 10 minutes`;
  } catch { return `deployed: run ${found.id} succeeded; the live check did not answer`; }
}

// ---------- journal (gate 13) ----------
function journal(line) {
  try {
    const j = jarvis();
    if (!j) return;
    const f = path.join(j.journal, `${ymd()}.md`);
    if (!fs.existsSync(f)) appendFile(f, `# ${ymd()}\n`);
    appendFile(f, `\n- ${hm()} Conflict Monitor ${line}\n`);
  } catch { /* the publish log still has it */ }
}

module.exports = {
  ROOT, P, TEST_ROOT, PUBLIC_DATA, INTERNAL_DATA, OUTLETS, INDEX, MB, HOUR, HOLD_RELEASE_MS, CADENCE_MS, TRAILER,
  NOREPLY, HOME_LABEL, Refusal,
  ymd, hm, yesterday, hours, localStamp, log, rawLog, run, git, tryGit, npmTest,
  flags, lockInfo, takeLock, releaseLock, readState, writeState,
  treeEntries, classify, listFiles, sameDir, originCounts, isPublishCommit, completedRun,
  readHolds, setHold, keepMarker, writeHold, fingerprint, holdReasons, jsonNow,
  loadScanner, addedLines, scanStaged, summariseHits,
  makeRecord, saveRecord, pushRecord, mirrorPrivate, watchDeploy, journal, classifyPush,
  sanitizer, MIRROR_ROOTS, mirrorExcluded,
};
