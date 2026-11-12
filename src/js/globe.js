/* ============================================================================
   Theater Globe — the Globe tab of the Global Conflict Monitor.

   Built by scripts/build.js as its own bundle (dist/js/globe.js, ES module, three.js
   bundled from the pinned npm package) and loaded by app.js only when the Globe tab
   is first opened. Everything it draws comes from window.__DATA__, the same object
   the rest of the dashboard reads. Nothing is estimated or filled in.

   mountGlobe(root, DATA, opts) → { setActive(bool), destroy() }
     opts.atlasUrl     world-atlas 50m topology, served from dist/vendor/
     opts.openCountry  (key) => void, opens the dashboard's country drawer

   The renderer checks its own output. Some GPU/driver pairs (seen on Intel UHD 770
   under ANGLE/D3D11) resolve a half-float multisampled render target to an all-black
   frame without raising any error. So after the first frames the globe compares the
   post-processed frame against a direct render and steps down a ladder of render
   setups until the picture survives, falling back to the 2D panels if even a direct
   render draws nothing.
   ============================================================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import CSS_TEXT from '../css/globe.css';
import { ARC_FILTERS, MAP_LEGEND, toAtlasName, atlasToKey, chessMatches } from './board-shared.mjs';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const D2R = Math.PI / 180;
const COMPACT_W = 999;               // matches the @container query in src/css/globe.css
const WIN = 30;                      // trailing window (days) for event tempo
const IDLE_FPS = 30, IDLE_STOP_MS = 60000, WAKE_MS = 2500;

const MARKUP = `
<div id="g-app">
  <canvas id="g-gl" tabindex="0" aria-label="3D globe of the conflict board. Drag to rotate, scroll or pinch to zoom, select a country for its dossier."></canvas>
  <div id="g-vig"></div>
  <div id="g-labels" aria-hidden="true"></div>
  <div id="g-boot">Building the globe</div>
  <div id="g-left" class="rail">
    <header id="g-brand" class="card">
      <div><div class="eyebrow">Global Conflict Monitor</div><h2>Theater Globe</h2></div>
      <button id="g-chip" type="button" aria-label="Open the index panel"><b id="g-chipNum">–</b><span id="g-chipRung"></span></button>
      <button id="g-methodBtn" type="button" aria-haspopup="dialog">Method</button>
      <div id="g-stampRow"><i></i><span id="g-stamp"></span></div>
    </header>
    <section id="g-p-index" class="card panel" aria-label="Index, escalation ladder and axes">
      <div class="idx-h"><span class="eyebrow">WW3 risk index</span><span class="eyebrow" id="g-idxWhen"></span></div>
      <div class="idx-n"><span id="g-idxNum">–</span><span class="pct" id="g-idxPct">%</span></div>
      <div id="g-idxRung"></div>
      <p class="fine" style="margin-top:8px">An editorial judgement, not a forecast: the rounded mean of the four axes below.</p>
      <div class="sec"><span class="eyebrow">Escalation ladder</span>
        <div id="g-ladderWrap"><ol id="g-ladder"></ol><div id="g-ladderFill"></div><div id="g-ladderMark"></div></div>
        <p class="fine" id="g-trg"></p></div>
      <div class="sec"><span class="eyebrow" id="g-axesTitle">Four axes</span><div id="g-axes"></div></div>
    </section>
  </div>
  <div id="g-right" class="rail closed">
    <nav id="g-tabs" class="card" role="tablist" aria-label="Globe panels">
      <button type="button" role="tab" data-tab="index" class="only-m" aria-selected="false">Index</button>
      <button type="button" role="tab" data-tab="board" aria-selected="true">Board</button>
      <button type="button" role="tab" data-tab="events" aria-selected="false">Events</button>
      <button type="button" role="tab" data-tab="country" aria-selected="false">Countries</button>
    </nav>
    <div id="g-panels" class="card">
      <section id="g-p-board" class="panel on" role="tabpanel"></section>
      <section id="g-p-events" class="panel" role="tabpanel"></section>
      <section id="g-p-country" class="panel" role="tabpanel"></section>
    </div>
  </div>
  <footer id="g-dock" class="card">
    <div class="dock-row">
      <div class="dock-a">
        <button id="g-play" type="button" aria-label="Replay the year"></button>
        <div id="g-when"><span id="g-whenDate"></span><span id="g-whenSub"></span></div>
        <button id="g-speed" type="button" aria-label="Replay speed"></button>
        <button id="g-nowBtn" type="button" aria-pressed="true">Now</button>
      </div>
      <div class="dock-b">
        <span class="seg-l">Height</span>
        <div class="seg" role="group" aria-label="What country height shows">
          <button type="button" id="g-mRisk" aria-pressed="true">Risk score</button>
          <button type="button" id="g-mTempo" aria-pressed="false">Event tempo</button>
        </div>
        <div class="chips" id="g-chips" role="group" aria-label="Filter events by arc"></div>
      </div>
    </div>
    <canvas id="g-tl" tabindex="0" role="slider" aria-label="Timeline cursor"></canvas>
  </footer>
  <div id="g-tip" role="status"></div>
  <div id="g-method" class="card" role="dialog" aria-modal="false" aria-labelledby="g-methodT" hidden></div>
  <div id="g-glfail" class="card" hidden></div>
</div>`;

let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  const s = document.createElement('style'); s.id = 'globe-styles'; s.textContent = CSS_TEXT;
  document.head.appendChild(s); styleInjected = true;
}

export function mountGlobe(root, DATA, opts = {}) {
  injectStyle();
  root.classList.add('globe-root');
  root.setAttribute('data-theme', 'dark');          // dark tokens inside the globe in either theme
  root.innerHTML = MARKUP;
  const $ = (s, r = root) => r.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const isCompact = () => root.clientWidth <= COMPACT_W;
  const cleanups = [];
  const on = (target, type, fn, o) => { target.addEventListener(type, fn, o); cleanups.push(() => target.removeEventListener(type, fn, o)); };
  let active = false, destroyed = false, G = null, rafId = 0;

  // ---- tokens: resolve the dashboard's CSS variables instead of keeping hex copies
  const tokCache = new Map();
  const tok = (v) => {
    if (!v) return null;
    const m = /^var\((--[\w-]+)\)$/.exec(String(v).trim());
    if (!m) return v;
    if (!tokCache.has(m[1])) tokCache.set(m[1], getComputedStyle(root).getPropertyValue(m[1]).trim() || null);
    return tokCache.get(m[1]);
  };
  const NO_COLOR = '#9aa3b5';                       // an arc with no colour draws neutral, not invisible
  const cssColor = (c, fb) => tok(c) || fb;

  // ---------------------------------------------------------------- data
  const META = DATA.meta || {}, MO = DATA.map_overlays || {};
  const EV = (DATA.events || []).filter(e => e && e.event_date && !e.is_chapter_divider).map(e => ({ ...e }));
  const parseDay = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  let DAY0 = Infinity, LAST = parseDay(META.now);
  for (const e of EV) { const d = parseDay(e.event_date); if (d < DAY0) DAY0 = d; if (d > LAST) LAST = d; }
  if (!Number.isFinite(DAY0)) DAY0 = LAST;
  const N = LAST - DAY0 + 1;
  const WAR = parseDay(META.war_start) - DAY0;
  const fmtFull = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const fmtShort = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const fmtMon = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
  const dateOf = d => new Date((DAY0 + d) * 864e5);
  const fmtDay = d => fmtFull.format(dateOf(d));

  // Arc filter chips: the dashboard's own Feed vocabulary (board-shared.mjs).
  const ARCS = ARC_FILTERS.map(a => ({ key: a.key, label: a.label, color: tok(a.textColor || a.color) || NO_COLOR, match: a.match }));
  const parseRGBA = s => { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const rgbKey = s => { const c = parseRGBA(s); return c ? `${c.r},${c.g},${c.b}` : ''; };
  const LEGEND = MAP_LEGEND.map(l => [rgbKey(l.color), l.label]);

  // ---- countries: every country with a risk row, an alias list or a map fill
  const TOPO = opts.topology;
  const feats = TOPO && window.topojson ? window.topojson.feature(TOPO, TOPO.objects.countries).features : [];
  // The 50m atlas leaves some outlines unsplit at 180° (Russia, Fiji). Make each ring continuous in
  // longitude so planar work (triangulation, point-in-polygon, the land mask) is correct.
  for (const f of feats) {
    const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const poly of polys) for (let k = 0; k < poly.length; k++) {
      const ring = poly[k]; let off = 0, crossed = false; const out = [[ring[0][0], ring[0][1]]];
      for (let i = 1; i < ring.length; i++) { const d = ring[i][0] - ring[i - 1][0]; if (d > 180) { off -= 360; crossed = true; } else if (d < -180) { off += 360; crossed = true; } out.push([ring[i][0] + off, ring[i][1]]); }
      if (crossed && off === 0) poly[k] = out;
    }
  }
  const featByName = new Map(feats.map(f => [f.properties.name, f]));
  const C = [], cByKey = new Map();
  function country(name) {
    const atlas = toAtlasName(name), key = atlasToKey(atlas);
    let c = cByKey.get(key);
    if (!c) { c = { key, slot: C.length, atlas, aliases: [key], risk: null, chess: null, theater: null, fill: null, val: null }; C.push(c); cByKey.set(key, c); }
    return c;
  }
  for (const r of DATA.risk_countries || []) country(r.name).risk = r;
  for (const [k, v] of Object.entries(DATA.country_keys || {})) country(k).aliases = (v && v.aliases) || [k];
  for (const [k, v] of Object.entries(MO.fills || {})) country(k).fill = v;
  for (const t of DATA.theaters || []) { const c = cByKey.get(atlasToKey(toAtlasName(t.name))); if (c) c.theater = t; }
  for (const p of DATA.chess_players || []) { const c = C.find(x => chessMatches(x.key, p.name)); if (c && !c.chess) c.chess = p; }
  const ringArea = r => { let a = 0; for (let i = 0, n = r.length - 1; i < n; i++) a += (r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]); return a / 2; };
  for (const c of C) {
    const f = featByName.get(c.atlas);
    const rgba = parseRGBA(c.fill) || { r: 122, g: 132, b: 160, a: 0.2 };
    c.rgb = rgba; c.css = `rgb(${rgba.r},${rgba.g},${rgba.b})`;
    if (!f) continue;
    const g = f.geometry;
    c.polys = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map(rings => {
      let x0 = 999, x1 = -999, y0 = 90, y1 = -90;
      for (const p of rings[0]) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
      return { rings, bbox: [x0, y0, x1, y1], area: Math.abs(ringArea(rings[0])) };
    });
    c.bbox = c.polys.reduce((a, p) => [Math.min(a[0], p.bbox[0]), Math.min(a[1], p.bbox[1]), Math.max(a[2], p.bbox[2]), Math.max(a[3], p.bbox[3])], [999, 90, -999, -90]);
    const big = c.polys.reduce((a, b) => (b.area > a.area ? b : a));
    const r = big.rings[0]; let cx = 0, cy = 0, A = 0;
    for (let i = 0, n = r.length - 1; i < n; i++) { const k = r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; A += k; cx += (r[i][0] + r[i + 1][0]) * k; cy += (r[i][1] + r[i + 1][1]) * k; }
    c.center = A ? [cx / (3 * A), cy / (3 * A)] : [r[0][0], r[0][1]];   // label point: placement only, not data
    c.span = Math.max(big.bbox[2] - big.bbox[0], big.bbox[3] - big.bbox[1]);
  }
  const pip = (ring, x, y) => { let inside = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; };
  function countryAt(lng, lat) {
    for (const c of C) {
      if (!c.polys) continue;
      const B = c.bbox; if (lat < B[1] || lat > B[3]) continue;
      for (const p of c.polys) {
        const b = p.bbox; if (lat < b[1] || lat > b[3]) continue;
        const x = lng < b[0] && lng + 360 <= b[2] ? lng + 360 : lng > b[2] && lng - 360 >= b[0] ? lng - 360 : lng;
        if (x < b[0] || x > b[2] || !pip(p.rings[0], x, lat)) continue;
        let hole = false; for (let h = 1; h < p.rings.length; h++) if (pip(p.rings[h], x, lat)) { hole = true; break; }
        if (!hole) return c;
      }
    }
    return null;
  }

  // ---- events: which countries a headline names (the dashboard's makeAliasMatcher rule)
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const c of C) c.re = new RegExp(c.aliases.map(a => `\\b${escRe(a)}\\b`).join('|'), 'i');
  const byDay = Array.from({ length: N }, () => []);
  for (const e of EV) {
    e.day = parseDay(e.event_date) - DAY0;
    e.c = []; for (const c of C) if (c.re.test(e.headline || '')) e.c.push(c.slot);
    e.arcs = ARCS.filter(a => (e.theaters || []).some(t => a.match.has(t))).map(a => a.key);
    byDay[e.day].push(e);
  }
  for (const d of byDay) d.sort((a, b) => (b.severity || 0) - (a.severity || 0));
  let DENSE = 0, SPARSE_N = 0;
  { const p = [0]; for (let d = 0; d < N; d++) p.push(p[d] + byDay[d].length); for (let d = 0; d + 14 <= N; d++) if (p[d + 14] - p[d] >= 14) { DENSE = d; SPARSE_N = p[d]; break; } }
  const nf = new Intl.NumberFormat('en-US');

  // ---- dated index and axis history
  const idxByDay = new Float32Array(N).fill(NaN);
  const SERIES = (DATA.ww3_series || []).map(w => ({ ...w, day: parseDay(w.d) - DAY0 })).filter(w => w.day >= 0 && w.day < N).sort((a, b) => a.day - b.day);
  SERIES.forEach((w, i) => { const end = i + 1 < SERIES.length ? SERIES[i + 1].day : N; for (let d = w.day; d < end; d++) idxByDay[d] = w.v; });
  const axesByDay = new Array(N).fill(null);
  const HIST = (DATA.escalation_history || []).map(h => ({ ...h, day: parseDay(h.date) - DAY0 })).filter(h => h.day >= 0 && h.day < N).sort((a, b) => a.day - b.day);
  HIST.forEach((h, i) => { const end = i + 1 < HIST.length ? HIST[i + 1].day : N; for (let d = h.day; d < end; d++) axesByDay[d] = h.scores; });
  const AXES_FROM = HIST.length ? HIST[0].date : null;
  const CHAPTERS = Object.entries(DATA.timeline_chapters || {}).map(([d, v]) => ({ day: parseDay(d) - DAY0, ...v })).filter(c => c.day >= 0 && c.day < N && c.label !== 'NOW');
  const LADDER = [...(DATA.escalation_ladder || [])].sort((a, b) => b.pct - a.pct);
  const rungOf = v => LADDER.find(r => r.pct === Math.floor(v / 10) * 10) || null;

  // ---------------------------------------------------------------- state
  const S = { day: N - 1, playing: false, speed: 12, relief: 'risk', arcs: new Set(), sel: -1, tab: 'board', pickedRung: null };
  const SPEEDS = [4, 12, 30];
  const dayInt = () => clamp(Math.round(S.day), 0, N - 1);
  const isNow = () => dayInt() >= N - 1 && !S.playing;
  const mode = () => (isNow() ? S.relief : 'tempo');
  const passes = e => S.arcs.size === 0 || e.arcs.some(k => S.arcs.has(k));

  let perTot, perHot, per, pre, maxTempo = 1, maxWho = null, maxWhen = 0;
  const tempo = (s, d) => pre[s][d + 1] - pre[s][Math.max(0, d + 1 - WIN)];
  function recount() {
    perTot = new Uint16Array(N); perHot = new Uint16Array(N);
    per = C.map(() => new Uint16Array(N));
    for (const e of EV) { if (!passes(e)) continue; perTot[e.day]++; if (e.severity >= 4) perHot[e.day]++; for (const s of e.c) per[s][e.day]++; }
    pre = per.map(a => { const p = new Uint32Array(N + 1); for (let i = 0; i < N; i++) p[i + 1] = p[i] + a[i]; return p; });
    maxTempo = 0; maxWho = null;
    for (const c of C) for (let d = 0; d < N; d++) { const v = tempo(c.slot, d); if (v > maxTempo) { maxTempo = v; maxWho = c; maxWhen = d; } }
  }
  recount();

  // ---------------------------------------------------------------- render scheduling
  // Full rate while anything moves; IDLE_FPS while idle; nothing after IDLE_STOP_MS of no input
  // (auto-rotate stops too); nothing at all while the tab is hidden.
  let lastWake = performance.now(), lastRender = 0, prevT = performance.now();
  const wake = () => { lastWake = performance.now(); schedule(); };
  function schedule() { if (!rafId && active && !destroyed && document.visibilityState === 'visible') rafId = requestAnimationFrame(frame); }

  // ---------------------------------------------------------------- HUD: index, ladder, axes
  const ROW = 20;
  function buildIndexPanel() {
    $('#g-ladder').innerHTML = LADDER.map(r => `<li data-p="${r.pct}"><button type="button" title="Show this rung's trigger"><span class="p">${r.pct}</span><span class="l">${esc(r.label)}</span></button></li>`).join('');
    on($('#g-ladder'), 'click', e => { const li = e.target.closest('li'); if (!li) return; S.pickedRung = S.pickedRung === +li.dataset.p ? null : +li.dataset.p; renderIndex(); });
    $('#g-axes').innerHTML = (DATA.escalation_axes || []).map(a => `<div class="axis" data-k="${esc(a.key)}"><button type="button" aria-expanded="false"><span class="lab">${esc(a.label)}</span><span class="bar"><i></i></span><b>–</b></button><p class="fine why"></p></div>`).join('');
    on($('#g-axes'), 'click', e => { const row = e.target.closest('.axis'); if (!row) return; const open = !row.classList.contains('open'); for (const r of $('#g-axes').children) { r.classList.toggle('open', r === row && open); $('button', r).setAttribute('aria-expanded', String(r === row && open)); } });
  }
  function renderIndex() {
    const d = dayInt(), now = isNow();
    const v = now ? META.ww3_pct : idxByDay[d];
    const has = Number.isFinite(v);
    $('#g-idxWhen').textContent = now ? 'Now' : fmtShort.format(dateOf(d));
    $('#g-idxNum').textContent = has ? Math.round(v) : '–';
    $('#g-idxPct').style.visibility = has ? 'visible' : 'hidden';
    const rung = has ? rungOf(v) : null;
    const pill = $('#g-idxRung');
    pill.classList.toggle('na', !rung);
    pill.textContent = rung ? `Rung ${rung.pct} · ${rung.label}` : has ? 'Below the first rung' : `Index starts ${fmtShort.format(dateOf(SERIES[0]?.day ?? 0))}`;
    $('#g-chipNum').textContent = has ? Math.round(v) + '%' : '–';
    $('#g-chipRung').textContent = rung ? 'RUNG ' + rung.pct : '';
    for (const li of $('#g-ladder').children) {
      const p = +li.dataset.p;
      li.classList.toggle('at', !!rung && p === rung.pct);
      li.classList.toggle('below', has && p < v);
      li.classList.toggle('pick', S.pickedRung === p);
    }
    const top = has ? ((100 - clamp(v, 5, 100)) / 10 + 0.5) * ROW : 0;
    $('#g-ladderMark').style.top = top + 'px';
    $('#g-ladderMark').style.opacity = has ? 1 : 0;
    $('#g-ladderFill').style.height = has ? Math.max(0, LADDER.length * ROW - top - 2) + 'px' : '0px';
    const show = LADDER.find(r => r.pct === S.pickedRung);
    $('#g-trg').innerHTML = show ? `<b>Rung ${show.pct} trigger.</b> ${esc(show.trigger)}` : '';
    const scores = now ? Object.fromEntries((DATA.escalation_axes || []).map(a => [a.key, a.score])) : axesByDay[d];
    $('#g-axesTitle').textContent = scores ? 'Four axes' : `Four axes · from ${AXES_FROM || 'a later date'}`;
    for (const a of DATA.escalation_axes || []) {
      const row = $(`.axis[data-k="${CSS.escape(a.key)}"]`); if (!row) continue;
      const sc = scores ? scores[a.key] : null;
      $('b', row).textContent = sc == null ? '–' : sc;
      $('.bar i', row).style.width = (sc == null ? 0 : sc) + '%';
      $('.why', row).textContent = now ? (a.currentLabel || '') : 'The reason on file is for the current score only.';
    }
  }

  // ---------------------------------------------------------------- HUD: board
  function buildBoard() {
    const arcs = MO.arcs || [], hot = MO.hotspots || [];
    const arcRow = (a, i) => {
      const col = a.colorLit || cssColor(a.color, NO_COLOR);
      const title = String(a.id || '').replace(/-/g, ' '), body = a.note || '';
      return `<li><button type="button" class="row" data-arc="${i}" style="--c:${esc(col)}"><span class="sw"></span><span><span class="t">${esc(title)}<span class="kind">${esc(a.kind || 'strike')}</span></span><span class="d">${esc(body)}</span></span></button></li>`;
    };
    const hotRow = (h, i) => `<li><button type="button" class="row" data-hot="${i}" style="--c:${esc(cssColor(h.color, NO_COLOR))}"><span class="sw dot"></span><span><span class="t">${esc(h.name)}</span><span class="d">${esc(h.sub || '')}</span></span></button></li>`;
    const used = new Set(C.filter(c => c.fill).map(c => `${c.rgb.r},${c.rgb.g},${c.rgb.b}`));
    $('#g-p-board').innerHTML = `
      <div class="ph"><h3>The board now</h3><span class="eyebrow">as of ${esc(MO.as_of || '')}</span></div>
      <p class="muted-note" id="g-boardNote" style="margin:0 0 12px" hidden>You are replaying an earlier date. Arcs and hotspots describe the board as of ${esc(MO.as_of || 'the last update')}, so the globe hides them until you return to now.</p>
      <div class="views">
        <button type="button" class="pill" data-view="home">Whole board</button>
        <button type="button" class="pill" data-view="gulf">Gulf</button>
        <button type="button" class="pill" data-view="ukraine">Ukraine</button>
        <button type="button" class="pill" data-view="redsea">Red Sea</button>
        <button type="button" class="pill" data-view="pacific">Pacific</button>
      </div>
      <span class="eyebrow">Kinetic arcs · ${arcs.length}</span>
      <ul class="rows" style="margin-top:6px;margin-bottom:14px">${arcs.map(arcRow).join('')}</ul>
      <span class="eyebrow">Hotspots · ${hot.length}</span>
      <ul class="rows" style="margin-top:6px;margin-bottom:14px">${hot.map(hotRow).join('')}</ul>
      <span class="eyebrow">Country colour</span>
      <div class="legend">${LEGEND.filter(l => used.has(l[0])).map(l => `<span><i style="--c:rgb(${l[0]})"></i>${esc(l[1])}</span>`).join('')}<span><i style="--c:rgb(122,132,160)"></i>Risk score only</span></div>`;
    on($('#g-p-board'), 'click', e => {
      const b = e.target.closest('button'); if (!b || !G) return;
      if (b.dataset.view) return G.view(b.dataset.view);
      if (b.dataset.arc != null) { const a = arcs[+b.dataset.arc]; goNow(); G.flyArc(a.from, a.to); closeSheetOnCompact(); }
      if (b.dataset.hot != null) { const h = hot[+b.dataset.hot]; goNow(); G.flyTo(h.pos[0], h.pos[1], 1.2); closeSheetOnCompact(); }
    });
  }

  // ---------------------------------------------------------------- HUD: events
  const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : null);
  function eventHTML(e, withDate) {
    const src = (e.sources || []).map(s => { const u = safeUrl(s.url); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a>` : esc(s.name); }).join(', ');
    const sev = clamp(Math.round(e.severity || 1), 1, 5);
    return `<li class="ev"><div class="sev s${sev}" title="Severity ${sev} of 5"><b>S${sev}</b><u><i></i><i></i><i></i><i></i><i></i></u></div>
      <p class="h">${esc(e.headline)}</p>
      <div class="m">${withDate ? `<span class="when">${esc(fmtShort.format(dateOf(e.day)))}</span> · ` : ''}${esc(e.status)} · ${esc(e.confidence)} confidence${src ? ' · ' + src : ''}</div></li>`;
  }
  let evKey = '';
  function renderEvents(force) {
    const d = dayInt(), key = d + '|' + [...S.arcs].join(',');
    if (!force && key === evKey) return; evKey = key;
    const list = byDay[d].filter(passes);
    const filt = S.arcs.size ? ` · ${ARCS.filter(a => S.arcs.has(a.key)).map(a => a.label).join(' + ')}` : '';
    $('#g-p-events').innerHTML = `<div class="ph"><h3>${esc(fmtDay(d))}</h3><span class="eyebrow">${list.length} event${list.length === 1 ? '' : 's'}${esc(filt)}</span></div>` +
      (list.length ? `<ul class="rows" style="margin:0;gap:0">${list.map(e => eventHTML(e)).join('')}</ul>` : `<p class="fine">No events on file for this date${S.arcs.size ? ' in the selected arcs' : ''}.</p>`);
  }
  on(root, 'click', e => { const h = e.target.closest('.ev .h'); if (h) h.classList.toggle('open'); });

  // ---------------------------------------------------------------- HUD: countries
  const hasDrawer = c => typeof opts.openCountry === 'function' && !!(c.risk || (DATA.country_keys || {})[c.key]);
  function renderCountry(force) {
    const box = $('#g-p-country'), d = dayInt();
    if (S.sel < 0) {
      if (!force && box.dataset.mode === 'list') return; box.dataset.mode = 'list';
      const scored = C.filter(c => c.risk).sort((a, b) => b.risk.risk - a.risk.risk);
      const rest = C.filter(c => !c.risk);
      box.innerHTML = `<div class="ph"><h3>Risk scores</h3><span class="eyebrow">${scored.length} countries</span></div>
        <ul class="rows" style="gap:0">${scored.map(c => `<li><button type="button" class="crow" data-slot="${c.slot}" style="--c:${c.css}"><span class="n">${esc(c.key)}<small>${esc(c.risk.level)}</small></span><span class="bar"><i style="width:${clamp(+c.risk.risk || 0, 0, 100)}%"></i></span><b>${esc(c.risk.risk)}</b></button></li>`).join('')}</ul>
        ${rest.length ? `<p class="fine" style="margin:12px 0 4px">On the map with no risk score on file:</p><ul class="rows" style="gap:0">${rest.map(c => `<li><button type="button" class="crow" data-slot="${c.slot}" style="--c:${c.css}"><span class="n">${esc(c.key)}</span><span></span><b>–</b></button></li>`).join('')}</ul>` : ''}`;
      return;
    }
    const c = C[S.sel]; box.dataset.mode = 'c';
    const n = tempo(c.slot, d);
    const recent = []; for (let k = d; k >= 0 && recent.length < 6; k--) for (const e of byDay[k]) if (e.c.includes(c.slot) && passes(e) && recent.length < 6) recent.push(e);
    box.innerHTML = `<button type="button" class="back" data-back="1">← All countries</button>
      <div class="dos">
        <h3>${esc(c.key)}</h3>
        <div class="tags">${c.risk ? `<span class="tag" style="color:${c.css};border-color:${c.css}">${esc(c.risk.level)}</span><span class="tag">${esc(c.risk.alignment)}</span>` : '<span class="tag">No risk score on file</span>'}${c.polys || !feats.length ? '' : '<span class="tag">Not on the atlas</span>'}</div>
        ${c.risk ? `<div class="big"><b>${esc(c.risk.risk)}</b><span>risk score of 100 · as of ${esc(c.risk.as_of || '')}</span></div><p class="note">${esc(c.risk.note || '')}</p>` : ''}
        ${hasDrawer(c) ? `<button type="button" class="open-dossier" data-drawer="1">Open full dossier →</button>` : ''}
        ${c.theater ? `<div class="sec"><div class="kv"><b>Theater threat ${esc(c.theater.threat)} · as of ${esc(c.theater.as_of || '')}</b>${esc(c.theater.status || '')}</div></div>` : ''}
        ${c.chess ? `<div class="sec"><div class="kv"><b>Goal</b>${esc(c.chess.goal || '')}</div><div class="kv"><b>Latest move · ${esc(c.chess.as_of || '')}</b>${esc(c.chess.move || '')}</div></div>` : ''}
        <div class="sec"><span class="eyebrow">Headlines naming ${esc(c.key)}</span>
          <div class="big" style="margin-top:2px"><b style="font-size:30px">${n}</b><span>in the ${WIN} days to ${esc(fmtShort.format(dateOf(d)))}</span></div>
          <canvas id="g-spark" aria-label="Daily count of headlines naming ${esc(c.key)}"></canvas>
          <p class="fine">Matched on the headline with the dashboard's alias list (${esc(c.aliases.slice(0, 4).join(', '))}${c.aliases.length > 4 ? ', …' : ''}). A headline can name a country without the event happening there.</p>
          <ul class="rows" style="margin:10px 0 0;gap:0">${recent.map(e => eventHTML(e, true)).join('')}</ul>
        </div>
      </div>`;
    drawSpark(c);
  }
  function drawSpark(c) {
    const cv = $('#g-spark'); if (!cv) return;
    const { ctx, W, H } = fit(cv); const a = per[c.slot]; let m = 1; for (const v of a) if (v > m) m = v;
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(0, H - 1, W, 1);
    const d = dayInt();
    for (let i = 0; i < N; i++) { if (!a[i]) continue; const x = i / N * W, h = Math.max(1.5, a[i] / m * (H - 6)); ctx.fillStyle = i <= d ? c.css : 'rgba(168,172,180,.28)'; ctx.fillRect(x, H - 1 - h, Math.max(1, W / N - .4), h); }
    ctx.fillStyle = '#ecedf0'; ctx.fillRect((d + .5) / N * W, 0, 1, H);
  }
  on($('#g-p-country'), 'click', e => {
    if (e.target.closest('[data-back]')) return select(-1);
    if (e.target.closest('[data-drawer]')) { const c = C[S.sel]; if (c) opts.openCountry(c.key); return; }
    const b = e.target.closest('.crow'); if (b) select(+b.dataset.slot, true);
  });
  function select(slot, fly) {
    S.sel = slot; G?.select(slot);
    renderCountry(true);
    if (slot >= 0) { setTab('country', true); const c = C[slot]; if (fly && G && c.center) G.flyTo(c.center[0], c.center[1], clamp(0.75 + c.span * 0.024, 0.8, 2.4)); }
    wake();
  }

  // ---------------------------------------------------------------- tabs, sheet
  function setTab(tab, open) {
    if (!isCompact() && tab === 'index') tab = 'board';
    const same = S.tab === tab; S.tab = tab;
    const right = $('#g-right');
    if (isCompact()) right.classList.toggle('closed', open ? false : same ? !right.classList.contains('closed') : false);
    for (const b of $('#g-tabs').children) b.setAttribute('aria-selected', String(b.dataset.tab === tab && !(isCompact() && right.classList.contains('closed'))));
    for (const p of ['index', 'board', 'events', 'country']) $('#g-p-' + p).classList.toggle('on', p === tab);
    if (tab === 'events') renderEvents(true);
    if (tab === 'country') renderCountry(true);
    G?.layout(); wake();
  }
  function closeSheetOnCompact() { if (isCompact()) { $('#g-right').classList.add('closed'); for (const b of $('#g-tabs').children) b.setAttribute('aria-selected', 'false'); G?.layout(); } }
  let compactNow = null;
  function placeIndexPanel() {
    const c = isCompact(); if (c === compactNow) return; compactNow = c;
    const p = $('#g-p-index');
    if (c) { $('#g-panels').prepend(p); p.classList.remove('card'); p.classList.toggle('on', S.tab === 'index'); $('#g-right').classList.add('closed'); for (const b of $('#g-tabs').children) b.setAttribute('aria-selected', 'false'); }
    else { $('#g-left').append(p); p.classList.add('card'); $('#g-right').classList.remove('closed'); if (S.tab === 'index') S.tab = 'board'; setTab(S.tab, true); }
    G?.layout();
  }
  on($('#g-tabs'), 'click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.tab); });
  on($('#g-chip'), 'click', () => setTab('index', true));

  // ---------------------------------------------------------------- dock + timeline
  const ICON = { play: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>', pause: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 1.5h3.2v11H2.5zM8.3 1.5h3.2v11H8.3z" fill="currentColor"/></svg>' };
  function buildDock() {
    $('#g-chips').innerHTML = ARCS.map(a => `<button type="button" class="chip" data-k="${a.key}" aria-pressed="false" style="--c:${esc(a.color)}"><i></i>${esc(a.label)}</button>`).join('');
    on($('#g-chips'), 'click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      const k = b.dataset.k; S.arcs.has(k) ? S.arcs.delete(k) : S.arcs.add(k);
      b.setAttribute('aria-pressed', String(S.arcs.has(k)));
      recount(); refresh(true);
    });
    on($('#g-mRisk'), 'click', () => { if (!isNow()) return; S.relief = 'risk'; refresh(true); });
    on($('#g-mTempo'), 'click', () => { S.relief = 'tempo'; refresh(true); });
    on($('#g-play'), 'click', togglePlay);
    on($('#g-nowBtn'), 'click', goNow);
    on($('#g-speed'), 'click', () => { S.speed = SPEEDS[(SPEEDS.indexOf(S.speed) + 1) % SPEEDS.length]; renderDock(); });
  }
  let lastTick = -1;
  function togglePlay() {
    if (S.playing) { S.playing = false; }
    else { if (dayInt() >= N - 1) S.day = Math.max(0, WAR); S.playing = true; lastTick = dayInt() - 1; }
    refresh(true);
  }
  function goNow() { if (isNow()) return; S.playing = false; S.day = N - 1; refresh(true); }
  function renderDock() {
    const d = dayInt(), now = isNow();
    $('#g-play').innerHTML = S.playing ? ICON.pause : ICON.play;
    $('#g-play').setAttribute('aria-label', S.playing ? 'Pause the replay' : now ? 'Replay from ' + fmtShort.format(dateOf(Math.max(0, WAR))) : 'Resume the replay');
    $('#g-whenDate').textContent = fmtDay(d);
    const warDay = d - WAR;
    $('#g-whenSub').textContent = now ? `Now · day ${warDay} of the war · ${perTot[d]} event${perTot[d] === 1 ? '' : 's'} today` : (warDay >= 0 ? `Day ${warDay} of the war` : `${-warDay} day${warDay === -1 ? '' : 's'} before the war`) + ` · ${perTot[d]} event${perTot[d] === 1 ? '' : 's'}` + (d < DENSE ? ' · sparse file' : '');
    $('#g-nowBtn').setAttribute('aria-pressed', String(now));
    $('#g-speed').textContent = S.speed + ' days/s';
    const m = mode();
    $('#g-mRisk').setAttribute('aria-pressed', String(m === 'risk')); $('#g-mTempo').setAttribute('aria-pressed', String(m === 'tempo'));
    $('#g-mRisk').disabled = !now; $('#g-mRisk').title = now ? '' : 'Risk scores have no dated history in the published files';
    const tl = $('#g-tl'); tl.setAttribute('aria-valuemin', 0); tl.setAttribute('aria-valuemax', N - 1); tl.setAttribute('aria-valuenow', d); tl.setAttribute('aria-valuetext', fmtDay(d));
    const note = $('#g-boardNote'); if (note) note.hidden = now;
  }
  function fit(cv) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    return { ctx, W, H };
  }
  // The index lane uses the homepage chart's fixed scale (0 to 70, gridlines every 20; it only
  // grows if the index passes 70) so a move looks the same size here as on Overview.
  const IDX_LO = 0, IDX_HI = Math.max(70, Math.ceil(Math.max(0, ...SERIES.map(s => s.v)) / 10) * 10);
  const TL = { padL: 34, padR: 12, pw: 1, hover: -1 };
  function drawTimeline() {
    const cv = $('#g-tl'); const { ctx, W, H } = fit(cv); if (W < 40 || H < 30) return;
    const padL = TL.padL, padR = TL.padR, axisH = 14, gap = H < 100 ? 7 : 9, pw = W - padL - padR; TL.pw = pw;
    const hA = Math.round((H - axisH - gap) * 0.5), yA = 1, yB = yA + hA + gap, hB = H - axisH - yB;
    const X = d => padL + (d + 0.5) / N * pw;
    const cur = S.day, xc = X(cur);
    const mono = (px, w = 500) => `${w} ${px}px "JetBrains Mono", ui-monospace, monospace`;
    const bin = Math.max(1, Math.ceil(3 * N / pw)), nb = Math.ceil(N / bin);
    const tot = new Float32Array(nb), hot = new Float32Array(nb); let mx = 1;
    for (let d = 0; d < N; d++) { const b = Math.floor(d / bin); tot[b] += perTot[d]; hot[b] += perHot[d]; }
    for (let b = 0; b < nb; b++) if (tot[b] > mx) mx = tot[b];
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(padL, yA + hA, pw, 1);
    ctx.font = mono(9); ctx.textBaseline = 'middle'; ctx.fillStyle = '#7d818a';
    ctx.textAlign = 'right'; ctx.fillText(String(mx), padL - 6, yA + 9); ctx.fillText('0', padL - 6, yA + hA - 2);
    ctx.textAlign = 'left'; ctx.fillText(bin === 1 ? 'EVENTS PER DAY' : `EVENTS PER ${bin} DAYS`, padL + 2, yA + 5);
    if (DENSE > N * 0.06) {
      const x0 = padL + 2, x1 = padL + DENSE / N * pw - 4, ym = yA + Math.round(hA * 0.62);
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, ym + .5); ctx.lineTo(x1, ym + .5); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x1 + .5, ym - 4); ctx.lineTo(x1 + .5, ym + 5); ctx.stroke(); ctx.restore();
      const long = `SPARSE FILE · ${SPARSE_N} EVENTS BEFORE ${fmtShort.format(dateOf(DENSE)).toUpperCase()}`, short = `SPARSE · ${SPARSE_N} EVENTS`;
      const fits = t => ctx.measureText(t).width < x1 - x0 - 6; const txt = fits(long) ? long : fits(short) ? short : fits('SPARSE FILE') ? 'SPARSE FILE' : '';
      if (txt) { ctx.fillStyle = '#7d818a'; ctx.fillText(txt, x0 + 2, ym - 8); }
    }
    const bw = pw / nb, w = Math.max(1, bw - (bw >= 3 ? 1 : 0)), usable = hA - 13;
    for (let b = 0; b < nb; b++) {
      if (!tot[b]) continue;
      const x = padL + b * bw, past = (b * bin) <= cur;
      const hT = Math.max(1, tot[b] / mx * usable), hH = hot[b] / mx * usable;
      ctx.fillStyle = past ? 'rgba(168,172,180,.62)' : 'rgba(168,172,180,.2)'; ctx.fillRect(x, yA + hA - hT, w, hT - hH);
      if (hH > 0) { ctx.fillStyle = past ? '#fb7185' : 'rgba(251,113,133,.3)'; ctx.fillRect(x, yA + hA - hH, w, hH); }
    }
    // lane B: the index step line on the homepage's fixed scale
    const lo = IDX_LO, hi = IDX_HI;
    const Y = v => yB + hB - (v - lo) / (hi - lo) * (hB - 4) - 1;
    ctx.textAlign = 'right';
    for (let v = lo; v <= hi; v += 20) { ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(padL, Math.round(Y(v)), pw, 1); if ((hB - 4) / ((hi - lo) / 20) < 11 && v !== lo && v + 20 <= hi) continue; ctx.fillStyle = '#7d818a'; ctx.fillText(String(v), padL - 6, Y(v)); }
    ctx.textAlign = 'left'; ctx.fillStyle = '#7d818a';
    if (SERIES.length) ctx.fillText('INDEX', padL + 2, Y(hi) + 8);
    const trace = () => { ctx.beginPath(); let started = false, lastV = 0; for (let d = 0; d < N; d++) { const v = idxByDay[d]; if (!Number.isFinite(v)) continue; const x0 = padL + d / N * pw, x1 = padL + (d + 1) / N * pw; if (!started) { ctx.moveTo(x0, Y(v)); started = true; } else if (v !== lastV) ctx.lineTo(x0, Y(v)); ctx.lineTo(x1, Y(v)); lastV = v; } return started; };
    const dc = dayInt();
    ctx.lineJoin = 'round'; ctx.lineWidth = 1.25; ctx.strokeStyle = 'rgba(244,63,94,.32)'; if (trace()) ctx.stroke();
    if (SERIES.length && dc >= SERIES[0].day) {
      ctx.save(); ctx.beginPath(); ctx.rect(padL, yB - 2, xc - padL, hB + 4); ctx.clip();
      if (trace()) { ctx.lineWidth = 2; ctx.strokeStyle = '#f43f5e'; ctx.stroke(); ctx.lineTo(padL + pw, yB + hB); ctx.lineTo(X(SERIES[0].day), yB + hB); ctx.closePath(); const g = ctx.createLinearGradient(0, yB, 0, yB + hB); g.addColorStop(0, 'rgba(244,63,94,.22)'); g.addColorStop(1, 'rgba(244,63,94,0)'); ctx.fillStyle = g; ctx.fill(); }
      ctx.restore();
    }
    if (pw > 520) for (const s of SERIES) { if (!s.t || s.t === 'Now') continue; ctx.beginPath(); ctx.arc(X(s.day), Y(s.v), 2.3, 0, 7); ctx.fillStyle = s.day <= cur ? '#f43f5e' : 'rgba(244,63,94,.4)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#0a0c14'; ctx.stroke(); }
    ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1;
    for (const c of CHAPTERS) { const x = Math.round(X(c.day)) + .5; ctx.beginPath(); ctx.moveTo(x, yA + 12); ctx.lineTo(x, yB + hB); ctx.stroke(); }
    ctx.restore();
    ctx.textAlign = 'left'; ctx.fillStyle = '#7d818a'; ctx.font = mono(9);
    for (let d = 0; d < N; d++) { const dt = dateOf(d); if (dt.getUTCDate() !== 1) continue; const x = padL + d / N * pw; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(Math.round(x), yB + hB, 1, 4); ctx.fillStyle = '#7d818a'; if (x + 22 < W) ctx.fillText(fmtMon.format(dt).toUpperCase(), x + 3, H - 5); }
    if (TL.hover >= 0) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(Math.round(X(TL.hover)), yA, 1, yB + hB - yA); }
    ctx.fillStyle = '#ecedf0'; ctx.fillRect(Math.round(xc) - .5, yA, 1.5, yB + hB - yA);
    ctx.beginPath(); ctx.arc(xc, yA + 3, 4, 0, 7); ctx.fill();
    const v = idxByDay[dc]; if (Number.isFinite(v) && xc >= padL) { ctx.beginPath(); ctx.arc(xc, Y(v), 4, 0, 7); ctx.fillStyle = '#f43f5e'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#ecedf0'; ctx.stroke(); }
  }
  function wireTimeline() {
    const cv = $('#g-tl'); let drag = false;
    const dayAt = e => { const r = cv.getBoundingClientRect(); return clamp(Math.floor((e.clientX - r.left - TL.padL) / TL.pw * N), 0, N - 1); };
    const scrub = e => { S.playing = false; S.day = dayAt(e); flashDay(dayInt()); refresh(); };
    on(cv, 'pointerdown', e => { drag = true; cv.setPointerCapture(e.pointerId); scrub(e); });
    on(cv, 'pointermove', e => {
      if (drag) return scrub(e);
      const d = dayAt(e); TL.hover = d; drawTimeline();
      const ms = SERIES.find(s => s.t && s.t !== 'Now' && Math.abs(s.day - d) <= 1), ch = CHAPTERS.find(c => Math.abs(c.day - d) <= 1);
      const v = idxByDay[d];
      tip(e, `<b>${esc(fmtDay(d))}</b><br><span class="num">${perTot[d]}</span> event${perTot[d] === 1 ? '' : 's'}${perHot[d] ? ` · <span class="num">${perHot[d]}</span> at severity 4–5` : ''}<br>Index ${Number.isFinite(v) ? `<span class="num">${v}%</span>` : 'not tracked yet'}${ms ? `<br><b>${esc(ms.t)}</b>${ms.s ? ' · ' + esc(ms.s) : ''}` : ''}${ch ? `<br><b>${esc(ch.label)}</b>` : ''}`);
    });
    const end = () => { drag = false; };
    on(cv, 'pointerup', end); on(cv, 'pointercancel', end);
    on(cv, 'pointerleave', () => { TL.hover = -1; drawTimeline(); tip(null); });
    on(cv, 'keydown', e => {
      const step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : e.key === 'PageDown' ? -7 : e.key === 'PageUp' ? 7 : e.key === 'Home' ? -N : e.key === 'End' ? N : 0;
      if (!step) return; e.preventDefault(); e.stopPropagation(); S.playing = false; S.day = clamp(dayInt() + step, 0, N - 1); flashDay(dayInt()); refresh();
    });
  }
  function tip(e, html) {
    const t = $('#g-tip'); if (!e) return t.classList.remove('on');
    t.innerHTML = html; t.classList.add('on');
    const r = root.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
    let x = e.clientX - r.left + 14, y = e.clientY - r.top - h - 12;
    if (x + w > r.width - 8) x = e.clientX - r.left - w - 14; if (y < 8) y = e.clientY - r.top + 16;
    t.style.transform = `translate(${Math.round(clamp(x, 8, r.width - w - 8))}px,${Math.round(y)}px)`;
  }

  function buildMethod() {
    $('#g-stamp').textContent = `Data as of ${META.base_last_update || ''}`;
    $('#g-method').innerHTML = `<button type="button" class="x" aria-label="Close">×</button>
      <div class="eyebrow">How to read it</div><h3 id="g-methodT">What the globe draws, and where it comes from</h3>
      <dl>
        <dt>Height · risk</dt><dd>A country rises by its risk score, 0 to 100, from the dashboard's risk register (${(DATA.risk_countries || []).length} countries). Each score carries its own as-of date, shown in the dossier.</dd>
        <dt>Height · tempo</dt><dd>The number of events whose headline names the country in the ${WIN} days up to the cursor, on a linear scale. The tallest country-month sets the top (${maxTempo} headlines: ${esc(maxWho ? maxWho.key : '')}, to ${esc(fmtShort.format(dateOf(maxWhen)))}). Names are matched with the dashboard's own alias list and rule. Naming a country is not the same as the event happening there, so this is attention, not location. The event file is sparse before ${esc(fmtDay(DENSE))} (${SPARSE_N} events), so flat ground there is a gap in the file, not a quiet front.</dd>
        <dt>Colour</dt><dd>The map fill each country has in the dashboard's map overlay file. Countries with a risk score but no fill are slate.</dd>
        <dt>Arcs, hotspots</dt><dd>${(MO.arcs || []).length} arcs and ${(MO.hotspots || []).length} hotspots from the map overlay file, as of ${esc(MO.as_of || '')}. Endpoints are the file's coordinates. Arc height is styling, not a trajectory. They are hidden during replay because the published files hold no dated history for them.</dd>
        <dt>Index</dt><dd>${SERIES.length} dated points from ${esc(SERIES[0]?.d || '')}, drawn on the same fixed 0 to ${IDX_HI} scale as the Overview chart. By the dashboard's audit note, values before ${esc(AXES_FROM || '')} are reconstructions. The four axes have a daily record from that date; the history file marks some of those days as carried forward or re-scored in audit.</dd>
        <dt>Events</dt><dd>${nf.format(EV.length)} events, ${esc(fmtDay(0))} to ${esc(fmtDay(N - 1))}, each with its severity, status, confidence and sources as filed.</dd>
        <dt>Source</dt><dd>The same published files as every other tab of this dashboard, data as of ${esc(META.base_last_update || '')}. Nothing here is estimated or filled in. Country outlines: Natural Earth via world-atlas 2.0.2 (50m).</dd>
      </dl>`;
    const m = $('#g-method');
    on($('#g-methodBtn'), 'click', () => { m.hidden = !m.hidden; if (!m.hidden) $('.x', m).focus(); });
    on(m, 'click', e => { if (e.target.closest('.x')) { m.hidden = true; $('#g-methodBtn').focus(); } });
  }
  // Page-level keys only while the Globe tab is showing (the module stays mounted when hidden).
  on(document, 'keydown', e => {
    if (!active) return;
    const m = $('#g-method');
    if (e.key === 'Escape' && !m.hidden) { m.hidden = true; $('#g-methodBtn').focus(); return; }
    if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const el = document.activeElement;
      if (/^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(el?.tagName || '') || el?.isContentEditable) return;
      if (el && el !== document.body && !root.contains(el)) return;
      e.preventDefault(); togglePlay();
    }
  });

  // ---------------------------------------------------------------- refresh + frame
  function reliefTargets() {
    const m = mode(), d = dayInt(), out = new Float32Array(C.length);
    for (const c of C) {
      if (m === 'risk') { c.val = c.risk ? c.risk.risk : null; out[c.slot] = c.risk ? clamp(c.risk.risk / 100, 0, 1) : 0; }
      else { const n = tempo(c.slot, d); c.val = n; out[c.slot] = maxTempo ? n / maxTempo : 0; }
    }
    return out;
  }
  function flashDay(d) { if (!G) return; for (const e of byDay[d]) { if (!passes(e)) continue; for (const s of e.c) G.flash(s, 0.16 + 0.07 * (e.severity || 1)); } }
  let lastPanel = 0;
  function refresh(force) {
    renderDock(); renderIndex(); drawTimeline();
    if (G) { G.relief(reliefTargets(), mode()); G.overlay(isNow()); }
    const t = performance.now();
    if (force || !S.playing || t - lastPanel > 260) { lastPanel = t; if (S.tab === 'events') renderEvents(force); if (S.tab === 'country') renderCountry(S.sel >= 0); }
    wake();
  }
  function frame(t) {
    // rafId stays non-zero (-1) for the whole frame, so a wake() fired from inside it (camera
    // 'change', a refresh) cannot start a second loop; the frame decides at its end.
    rafId = -1;
    const keep = frameBody(t);
    rafId = keep && active && !destroyed ? requestAnimationFrame(frame) : 0;
  }
  function frameBody(t) {
    if (!active || destroyed || document.visibilityState !== 'visible') return false;
    const dt = Math.min(0.1, (t - prevT) / 1000); prevT = t;
    if (S.playing) {
      lastWake = t;
      S.day += dt * S.speed;
      if (S.day >= N - 1) { S.day = N - 1; S.playing = false; refresh(true); }
      else { const d = dayInt(); if (d !== lastTick) { for (let k = Math.max(lastTick + 1, d - 3); k <= d; k++) flashDay(k); lastTick = d; refresh(); } else drawTimeline(); }
    }
    if (!G) return S.playing;                     // 2D panels only: frames just drive the replay
    const idleFor = t - lastWake, busy = S.playing || idleFor < WAKE_MS || G.busy();
    if (busy) { G.render(dt, t / 1000); lastRender = t; return true; }
    if (reduced || idleFor > IDLE_STOP_MS) { G.stopAutoRotate(); G.render(dt, t / 1000); return false; }   // a last frame, then sleep until input
    if (t - lastRender >= 1000 / IDLE_FPS - 1) { G.render(dt, t / 1000); lastRender = t; }
    return true;
  }
  on(document, 'visibilitychange', () => { if (document.visibilityState === 'visible') { prevT = performance.now(); wake(); } });

  // ---------------------------------------------------------------- the globe
  function initGlobe() {
    if (!feats.length) throw new Error('the country atlas did not load');
    const canvas = $('#g-gl');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    const PR = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    renderer.setPixelRatio(PR);
    renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#04060c');
    const FOV = 36 * D2R;
    const camera = new THREE.PerspectiveCamera(36, 1, 0.12, 160);

    // ---- post-processing, with a self-check ladder (see the header comment)
    const TIERS = [
      { name: 'half-float + MSAA', type: THREE.HalfFloatType, samples: coarse ? 2 : 4 },
      { name: 'half-float', type: THREE.HalfFloatType, samples: 0 },
      { name: '8-bit + MSAA', type: THREE.UnsignedByteType, samples: coarse ? 2 : 4 },
      { name: 'direct', direct: true },
    ];
    let tier = 0, composer = null, bloom = null, probe = { frames: 0, fails: 0, done: false, log: [] };
    function makeComposer() {
      if (composer) { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); composer.passes.forEach(p => p.dispose && p.dispose()); composer = null; bloom = null; }
      const T = TIERS[tier]; if (T.direct) return;
      const rt = new THREE.WebGLRenderTarget(4, 4, { type: T.type, samples: T.samples });
      composer = new EffectComposer(renderer, rt);
      composer.addPass(new RenderPass(scene, camera));
      bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.62, 0.55, 0.72); composer.addPass(bloom);
      composer.addPass(new OutputPass());
      composer.setPixelRatio(PR); composer.setSize(CW, CH);
    }
    const gl = renderer.getContext();
    function litPixels() {
      // a box around the globe's on-screen centre, in drawing-buffer pixels
      const bw = gl.drawingBufferWidth, bh = gl.drawingBufferHeight, s = bw / CW;
      const cx = (CW / 2 - (vo ? vo[0] : 0)) * s, cy = bh - (CH / 2 - (vo ? vo[1] : 0)) * s;
      const w = Math.min(bw, Math.round(320 * s)), h = Math.min(bh, Math.round(320 * s));
      const x = clamp(Math.round(cx - w / 2), 0, bw - w), y = clamp(Math.round(cy - h / 2), 0, bh - h);
      const px = new Uint8Array(w * h * 4); gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let n = 0; for (let i = 0; i < px.length; i += 16) if (px[i] + px[i + 1] + px[i + 2] > 24) n++;
      return n;
    }
    function checkOutput() {
      // compare a direct render with the post-processed one, at the same camera
      renderer.setRenderTarget(null); renderer.render(scene, camera);
      const ref = litPixels();
      if (ref === 0) return { res: 'blank', ref, got: 0 };
      if (!composer) return { res: 'ok', ref, got: ref };
      composer.render(0);
      const got = litPixels();
      return { res: got >= ref * 0.3 ? 'ok' : 'bad', ref, got };
    }

    const BASE = 1.003, HMAX = 0.115;
    const ll2v = (lng, lat, r = 1, out = new THREE.Vector3()) => { const p = lat * D2R, l = lng * D2R, c = Math.cos(p); return out.set(r * c * Math.sin(l), r * Math.sin(p), r * c * Math.cos(l)); };
    const sColor = (css) => new THREE.Color(css);
    const U = { uTime: { value: 0 }, uOv: { value: 1 }, uPx: { value: 0.002 }, uData: { value: null }, uN: { value: 64 }, uHmax: { value: HMAX }, uBase: { value: BASE } };

    // ---- per-country data texture: row 0 = height, flash, highlight, alpha; row 1 = colour, intensity.
    // Sized from the data (a fixed 64 would silently corrupt heights past the 64th country).
    const NS = Math.max(64, 1 << Math.ceil(Math.log2(C.length + 1))); U.uN.value = NS;
    const tex = new Float32Array(NS * 2 * 4);
    const dataTex = new THREE.DataTexture(tex, NS, 2, THREE.RGBAFormat, THREE.FloatType);
    dataTex.minFilter = dataTex.magFilter = THREE.NearestFilter; dataTex.needsUpdate = true; U.uData.value = dataTex;
    const curH = new Float32Array(NS), tgtH = new Float32Array(NS), flash = new Float32Array(NS), hi = new Float32Array(NS), tgtHi = new Float32Array(NS);
    for (const c of C) {
      const col = new THREE.Color().setRGB(c.rgb.r / 255, c.rgb.g / 255, c.rgb.b / 255, THREE.SRGBColorSpace);
      const o = (NS + c.slot) * 4; tex[o] = col.r; tex[o + 1] = col.g; tex[o + 2] = col.b; tex[o + 3] = clamp(c.rgb.a, 0.08, 0.7);
      tex[c.slot * 4 + 3] = 1;
    }
    const DATA_GLSL = `
      uniform sampler2D uData; uniform float uN, uHmax, uBase;
      attribute float aC;
      vec4 dyn(){ return texture2D(uData, vec2((aC + .5) / uN, .25)); }
      vec4 sta(){ return texture2D(uData, vec2((aC + .5) / uN, .75)); }`;

    // ---- stars, ocean, graticule, atmosphere (star positions are decoration, not data)
    {
      const n = 1600, p = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.2832, s = Math.sqrt(1 - u * u), r = 70; p[i * 3] = r * s * Math.cos(a); p[i * 3 + 1] = r * u; p[i * 3 + 2] = r * s * Math.sin(a); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x8f9bc4, size: 1.3 * PR, sizeAttenuation: false, transparent: true, opacity: 0.5, depthWrite: false })));
    }
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - max(dot(normalize(vN), normalize(vV)), 0.), 3.2); vec3 c = vec3(.0065,.0095,.021) + vec3(.035,.05,.16) * f; gl_FragColor = vec4(c, 1.); }`,
    })));
    {
      const p = [];
      const seg = (a, b) => { const A = ll2v(a[0], a[1], 1.0006), B = ll2v(b[0], b[1], 1.0006); p.push(A.x, A.y, A.z, B.x, B.y, B.z); };
      for (let lng = -180; lng < 180; lng += 30) for (let lat = -84; lat < 84; lat += 3) seg([lng, lat], [lng, lat + 3]);
      for (let lat = -60; lat <= 60; lat += 30) for (let lng = -180; lng < 180; lng += 3) seg([lng, lat], [lng + 3, lat]);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x5f6f9f, transparent: true, opacity: 0.085, depthWrite: false })));
    }
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.16, 96, 64), new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `varying vec3 vN; void main(){ float i = pow(clamp(.6 - dot(normalize(vN), vec3(0.,0.,1.)), 0., 1.), 5.); gl_FragColor = vec4(vec3(.16,.24,.8) * i, i * .85); }`,
    })));

    // ---- borders (50m atlas)
    {
      const coast = [], inner = [];
      const add = (arr, line) => {
        for (let i = 0; i < line.length - 1; i++) {
          const a = line[i], b = line[i + 1];
          if (Math.abs(a[0]) > 179.98 && Math.abs(b[0]) > 179.98) continue;       // antimeridian seam
          if (Math.abs(a[0] - b[0]) > 180) continue;
          const n = Math.max(1, Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / 1.5));
          for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n; const A = ll2v(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, 1.0014), B = ll2v(a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, 1.0014); arr.push(A.x, A.y, A.z, B.x, B.y, B.z); }
        }
      };
      for (const l of window.topojson.mesh(TOPO, TOPO.objects.countries, (a, b) => a === b).coordinates) add(coast, l);
      for (const l of window.topojson.mesh(TOPO, TOPO.objects.countries, (a, b) => a !== b).coordinates) add(inner, l);
      const mk = (arr, color, opacity) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })); m.renderOrder = 3; scene.add(m); };
      mk(coast, 0x7f93d6, 0.5); mk(inner, 0x6676ad, 0.26);
    }

    // ---- land dots from a rasterised land mask
    let dotsMat;
    {
      const MW = 2048, MH = 1024, cv = document.createElement('canvas'); cv.width = MW; cv.height = MH;
      const cx = cv.getContext('2d', { willReadFrequently: true }); cx.fillStyle = '#fff';
      for (const f of feats) { const g = f.geometry; for (const poly of (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)) {
        let lo = 999, hi2 = -999; for (const p of poly[0]) { if (p[0] < lo) lo = p[0]; if (p[0] > hi2) hi2 = p[0]; }
        for (const sh of (hi2 > 180 ? [0, -MW] : lo < -180 ? [0, MW] : [0])) { cx.beginPath(); for (const ring of poly) { for (let i = 0; i < ring.length; i++) { const x = (ring[i][0] + 180) / 360 * MW + sh, y = (90 - ring[i][1]) / 180 * MH; i ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.closePath(); } cx.fill('evenodd'); }
      } }
      const img = cx.getImageData(0, 0, MW, MH).data, pos = [], seed = [], slot = [], step = 0.74;
      let row = 0;
      for (let lat = -84; lat < 84; lat += step, row++) {
        const n = Math.max(1, Math.round(360 * Math.cos(lat * D2R) / step)), off = (row % 2) * 0.5;
        for (let i = 0; i < n; i++) {
          const lng = -180 + (i + off) / n * 360;
          const px = Math.min(MW - 1, Math.floor((lng + 180) / 360 * MW)), py = Math.min(MH - 1, Math.floor((90 - lat) / 180 * MH));
          if (img[(py * MW + px) * 4 + 3] > 120) { const v = ll2v(lng, lat, 1); pos.push(v.x, v.y, v.z); seed.push(Math.random()); const c = countryAt(lng, lat); slot.push(c ? c.slot : -1); }
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1)); g.setAttribute('aC', new THREE.Float32BufferAttribute(slot, 1));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.2);
      dotsMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, uniforms: { uSize: { value: 8 }, uTime: U.uTime, uData: U.uData, uN: U.uN, uHmax: U.uHmax, uBase: U.uBase },
        vertexShader: `attribute float aSeed, aC; uniform float uSize, uTime, uN, uHmax, uBase; uniform sampler2D uData; varying float vA; varying vec3 vCol;
          void main(){ float has = step(0., aC); float u = (max(aC, 0.) + .5) / uN; vec4 d = texture2D(uData, vec2(u, .25)); vec4 s = texture2D(uData, vec2(u, .75));
            vec3 dir = normalize(position); vec4 mv = modelViewMatrix * vec4(dir * mix(1.0011, uBase + d.r * uHmax + .0009, has), 1.);
            gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uSize / -mv.z, 1.2, 9.) * mix(1., .8, has);
            float facing = dot(normalize(normalMatrix * dir), normalize(-mv.xyz));
            vA = smoothstep(-.02, .4, facing) * (.72 + .28 * sin(aSeed * 40. + uTime * .7)) * mix(.85, .26 + .35 * d.g, has);
            vCol = mix(vec3(.17,.23,.46), s.rgb * (.5 + 1.1 * s.a) + .04, has); }`,
        fragmentShader: `varying float vA; varying vec3 vCol; void main(){ float r = length(gl_PointCoord - .5); float a = smoothstep(.5, .3, r) * vA; if (a < .01) discard; gl_FragColor = vec4(vCol, a); }`,
      });
      const pts = new THREE.Points(g, dotsMat); pts.renderOrder = 2; pts.frustumCulled = false; scene.add(pts);
    }

    // ---- extruded countries
    {
      const MAXLEN = 3.0;
      const elen = (a, b) => { const c = Math.cos((a[1] + b[1]) * 0.5 * D2R); return Math.hypot((a[0] - b[0]) * c, a[1] - b[1]); };
      const densify = ring => { const out = []; for (let i = 0; i < ring.length - 1; i++) { const a = ring[i], b = ring[i + 1]; out.push(a); const n = Math.ceil(elen(a, b) / MAXLEN); for (let k = 1; k < n; k++) { const t = k / n; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } } return out; };
      const capP = [], capC = [], wallP = [], wallC = [], wallT = [], lineP = [], lineC = [];
      const v3 = new THREE.Vector3();
      for (const c of C) {
        if (!c.polys) continue;
        for (const poly of c.polys) {
          const rings = poly.rings.map(densify).filter(r => r.length >= 3);
          if (!rings.length) continue;
          const pts = rings.flat();
          let tris = THREE.ShapeUtils.triangulateShape(rings[0].map(p => new THREE.Vector2(p[0], p[1])), rings.slice(1).map(r => r.map(p => new THREE.Vector2(p[0], p[1]))));
          for (let guard = 0, changed = true; changed && guard < 10; guard++) {
            changed = false; const mid = new Map(), out = [];
            const need = (i, j) => elen(pts[i], pts[j]) > MAXLEN;
            const gm = (i, j) => { const k = i < j ? i * 4194304 + j : j * 4194304 + i; let m = mid.get(k); if (m === undefined) { m = pts.length; pts.push([(pts[i][0] + pts[j][0]) / 2, (pts[i][1] + pts[j][1]) / 2]); mid.set(k, m); } return m; };
            for (const [a, b, d] of tris) {
              const sab = need(a, b), sbd = need(b, d), sda = need(d, a), n = sab + sbd + sda;
              if (!n) { out.push([a, b, d]); continue; } changed = true;
              if (n === 3) { const ab = gm(a, b), bd = gm(b, d), da = gm(d, a); out.push([a, ab, da], [ab, b, bd], [da, bd, d], [ab, bd, da]); }
              else if (n === 1) { if (sab) { const m = gm(a, b); out.push([a, m, d], [m, b, d]); } else if (sbd) { const m = gm(b, d); out.push([a, b, m], [a, m, d]); } else { const m = gm(d, a); out.push([a, b, m], [m, b, d]); } }
              else if (!sab) { const mbd = gm(b, d), mda = gm(d, a); out.push([d, mda, mbd], [a, b, mbd], [a, mbd, mda]); }
              else if (!sbd) { const mab = gm(a, b), mda = gm(d, a); out.push([a, mab, mda], [mab, b, d], [mab, d, mda]); }
              else { const mab = gm(a, b), mbd = gm(b, d); out.push([b, mbd, mab], [a, mab, mbd], [a, mbd, d]); }
            }
            tris = out;
          }
          const dirs = new Float32Array(pts.length * 3);
          for (let i = 0; i < pts.length; i++) { ll2v(pts[i][0], pts[i][1], 1, v3); dirs[i * 3] = v3.x; dirs[i * 3 + 1] = v3.y; dirs[i * 3 + 2] = v3.z; }
          for (const t of tris) for (const i of t) { capP.push(dirs[i * 3], dirs[i * 3 + 1], dirs[i * 3 + 2]); capC.push(c.slot); }
          let base = 0;
          for (const ring of rings) {
            for (let i = 0; i < ring.length; i++) {
              const a = (base + i) * 3, b = (base + (i + 1) % ring.length) * 3;
              const ax = dirs[a], ay = dirs[a + 1], az = dirs[a + 2], bx = dirs[b], by = dirs[b + 1], bz = dirs[b + 2];
              wallP.push(ax, ay, az, bx, by, bz, bx, by, bz, ax, ay, az, bx, by, bz, ax, ay, az); wallT.push(0, 0, 1, 0, 1, 1);
              for (let k = 0; k < 6; k++) wallC.push(c.slot);
              lineP.push(ax, ay, az, bx, by, bz); lineC.push(c.slot, c.slot);
            }
            base += ring.length;
          }
        }
      }
      const geo = (p, cArr, t) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(cArr, 1)); if (t) g.setAttribute('aTop', new THREE.Float32BufferAttribute(t, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.2); return g; };
      const shared = { uData: U.uData, uN: U.uN, uHmax: U.uHmax, uBase: U.uBase };
      const caps = new THREE.Mesh(geo(capP, capC), new THREE.ShaderMaterial({
        uniforms: shared, transparent: true, depthWrite: true, side: THREE.DoubleSide,
        vertexShader: `${DATA_GLSL} varying vec3 vCol; varying vec4 vD; varying vec3 vN; varying vec3 vV; varying float vI;
          void main(){ vD = dyn(); vec4 s = sta(); vCol = s.rgb; vI = s.a; vec3 dir = normalize(position); vec4 mv = modelViewMatrix * vec4(dir * (uBase + vD.r * uHmax), 1.);
            vN = normalize(normalMatrix * dir); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying vec3 vCol; varying vec4 vD; varying vec3 vN; varying vec3 vV; varying float vI;
          void main(){ float fr = pow(1. - max(dot(normalize(vN), normalize(vV)), 0.), 2.2);
            vec3 c = vCol * (.035 + .33 * vI) + vCol * fr * .05 + vCol * vD.g * .4 + vCol * vD.b * .22 + vec3(.004,.006,.012);
            gl_FragColor = vec4(c, .93 * vD.a); }`,
      }));
      caps.renderOrder = 1; caps.frustumCulled = false; scene.add(caps);
      const walls = new THREE.Mesh(geo(wallP, wallC, wallT), new THREE.ShaderMaterial({
        uniforms: shared, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        vertexShader: `${DATA_GLSL} attribute float aTop; varying vec3 vCol; varying vec4 vD; varying float vT; varying float vI; varying float vH; varying float vF;
          void main(){ vD = dyn(); vec4 s = sta(); vCol = s.rgb; vI = s.a; vT = aTop; vH = vD.r * uHmax; vec3 dir = normalize(position);
            vec4 mv = modelViewMatrix * vec4(dir * mix(1.0005, uBase + vH, aTop), 1.); vF = smoothstep(.02, .34, dot(normalize(normalMatrix * dir), normalize(-mv.xyz)));
            gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying vec3 vCol; varying vec4 vD; varying float vT; varying float vI; varying float vH; varying float vF;
          void main(){ float g = pow(vT, 1.7); float a = (.05 + .6 * g) * vD.a * vF * smoothstep(.0, .006, vH);
            gl_FragColor = vec4(vCol * (.25 + .85 * g) * (.4 + 1.3 * vI) * (1. + 1.1 * vD.g + .7 * vD.b), a); }`,
      }));
      walls.renderOrder = 4; walls.frustumCulled = false; scene.add(walls);
      const rims = new THREE.LineSegments(geo(lineP, lineC), new THREE.ShaderMaterial({
        uniforms: shared, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `${DATA_GLSL} varying vec3 vCol; varying vec4 vD; varying float vI; varying float vF;
          void main(){ vD = dyn(); vec4 s = sta(); vCol = s.rgb; vI = s.a; vec3 dir = normalize(position); vec4 mv = modelViewMatrix * vec4(dir * (uBase + vD.r * uHmax + .0006), 1.);
            vF = smoothstep(.0, .3, dot(normalize(normalMatrix * dir), normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying vec3 vCol; varying vec4 vD; varying float vI; varying float vF;
          void main(){ gl_FragColor = vec4(vCol * (.4 + 1.9 * vI + 1.5 * vD.g + 1.6 * vD.b), vD.a * (.25 + .75 * vF)); }`,
      }));
      rims.renderOrder = 5; rims.frustumCulled = false; scene.add(rims);
    }

    // ---- arcs + hotspots (map_overlays), rebuilt when country heights change
    const overlay = new THREE.Group(); overlay.renderOrder = 6; scene.add(overlay);
    const rings = [];
    const TUBE_R = 0.002;
    const KIND = { war: { n: 3, speed: 0.2, tail: 4.5, base: 0.5, px: 4.2 }, strike: { n: 1, speed: 0.3, tail: 7, base: 0.34, px: 3.0 }, tension: { n: 1, speed: 0.13, tail: 4, base: 0.24, px: 2.2, dash: 26 } };
    const surfR = (lng, lat) => { const c = countryAt(lng, lat); return c ? BASE + tgtH[c.slot] * HMAX + 0.0015 : 1.003; };
    const overlayLabels = [];
    function ringMesh(dir, r, color, speed, phase, twin, px) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uTime: U.uTime, uOv: U.uOv, uColor: { value: color }, uSpeed: { value: speed }, uPhase: { value: phase }, uTwin: { value: twin } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
        fragmentShader: `uniform vec3 uColor; uniform float uTime, uSpeed, uPhase, uOv, uTwin; varying vec2 vUv;
          void main(){ float r = length(vUv - .5) * 2.; if (r > 1.) discard; float t = fract(uTime * uSpeed + uPhase); float t2 = fract(t + .5);
            float a = smoothstep(.08, 0., abs(r - t)) * (1. - t) * .9 + smoothstep(.08, 0., abs(r - t2)) * (1. - t2) * .7 * uTwin + smoothstep(.2, .05, r) + (1. - r) * (1. - r) * .16;
            gl_FragColor = vec4(uColor * (1. + smoothstep(.2, .0, r) * 1.6), a * uOv); }`,
      }));
      m.position.copy(dir).multiplyScalar(r); m.lookAt(dir.clone().multiplyScalar(3)); m.userData.px = px; m.renderOrder = 6;
      overlay.add(m); rings.push(m); return m;
    }
    function buildOverlay() {
      for (const o of [...overlay.children]) { o.geometry.dispose(); o.material.dispose(); overlay.remove(o); }
      rings.length = 0; overlayLabels.length = 0;
      for (const a of MO.arcs || []) {
        if (!Array.isArray(a.from) || !Array.isArray(a.to)) continue;
        const color = sColor(a.colorLit || cssColor(a.color, NO_COLOR)), k = KIND[a.kind] || KIND.strike;
        const A = ll2v(a.from[0], a.from[1]), B = ll2v(a.to[0], a.to[1]), ang = A.angleTo(B), rA = surfR(a.from[0], a.from[1]), rB = surfR(a.to[0], a.to[1]);
        const peak = 0.028 + 0.4 * ang, pts = [], sn = Math.sin(ang) || 1;
        for (let i = 0; i <= 40; i++) { const t = i / 40; const v = ang < 1e-4 ? A.clone().lerp(B, t) : A.clone().multiplyScalar(Math.sin((1 - t) * ang) / sn).add(B.clone().multiplyScalar(Math.sin(t * ang) / sn)); pts.push(v.normalize().multiplyScalar(rA + (rB - rA) * t + peak * 4 * t * (1 - t))); }
        const phase = (a.delay || 0) * 0.137;
        const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, TUBE_R, 6, false), new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uTime: U.uTime, uOv: U.uOv, uPx: U.uPx, uColor: { value: color }, uN2: { value: k.n }, uSpeed: { value: k.speed }, uTail: { value: k.tail }, uB: { value: k.base }, uW: { value: k.px }, uDash: { value: k.dash || 0 }, uPhase: { value: phase } },
          vertexShader: `uniform float uPx, uW; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position + normal * (max(uPx * uW * .5, .0007) - ${TUBE_R.toFixed(4)}); gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.); }`,
          fragmentShader: `uniform vec3 uColor; uniform float uTime, uOv, uN2, uSpeed, uTail, uB, uDash, uPhase; varying vec2 vUv;
            void main(){ float x = vUv.x; float s = fract((uTime * uSpeed + uPhase - x) * uN2); float comet = exp(-s * uTail); float head = smoothstep(.05, 0., s);
              float dash = uDash > 0. ? step(.45, fract(x * uDash)) : 1.; float a = (uB + comet * .9) * dash;
              gl_FragColor = vec4(uColor * (1.05 + comet * 1.5) + vec3(head * .45), a * uOv); }`,
        }));
        tube.renderOrder = 6; tube.frustumCulled = false; overlay.add(tube);
        ringMesh(B, rB + 0.001, color, k.speed * k.n, phase * k.n, 0, 36);
        ringMesh(A, rA + 0.001, color, 0, 0.999, 0, 12);
        if (a.endLabel) overlayLabels.push({ text: a.endLabel, dir: B.clone(), r: rB + 0.012, color: a.colorLit || cssColor(a.color, NO_COLOR), cls: 'end', prio: 55 });
      }
      for (const h of MO.hotspots || []) {
        if (!Array.isArray(h.pos)) continue;
        const color = sColor(cssColor(h.color, NO_COLOR)), dir = ll2v(h.pos[0], h.pos[1]), r = surfR(h.pos[0], h.pos[1]);
        ringMesh(dir, r + 0.001, color, 0.35, (h.delay || 0) * 0.21, 1, 46);
        const g = new THREE.BufferGeometry(); const top = dir.clone().multiplyScalar(r + 0.075), bot = dir.clone().multiplyScalar(r);
        g.setAttribute('position', new THREE.Float32BufferAttribute([bot.x, bot.y, bot.z, top.x, top.y, top.z], 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute([color.r * 1.6, color.g * 1.6, color.b * 1.6, 0, 0, 0], 3));
        const beam = new THREE.Line(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uOv: U.uOv }, vertexColors: true,
          vertexShader: `varying vec3 vC; void main(){ vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`, fragmentShader: `uniform float uOv; varying vec3 vC; void main(){ gl_FragColor = vec4(vC, uOv); }` }));
        beam.renderOrder = 6; overlay.add(beam);
        overlayLabels.push({ text: h.name, dir: dir.clone(), r: r + 0.082, color: cssColor(h.color, NO_COLOR), cls: 'hot', prio: 90 });
      }
      syncOverlayLabels();
    }

    // ---- labels (DOM, decluttered every frame)
    const labelBox = $('#g-labels'), labels = [];
    const namedColor = new Map((MO.labels || []).map(l => [String(l.name || '').toUpperCase(), cssColor(l.color, null)]));
    for (const c of C) {
      if (!c.center) continue;
      const named = namedColor.has(c.key.toUpperCase());
      const el = document.createElement('button'); el.type = 'button'; el.tabIndex = -1;
      el.className = 'lbl' + (named ? '' : ' minor');
      if (named && namedColor.get(c.key.toUpperCase())) el.style.setProperty('--c', namedColor.get(c.key.toUpperCase()));
      el.innerHTML = `<span>${esc(c.key.toUpperCase())}</span><span class="v"></span>`;
      el.addEventListener('click', () => select(c.slot, isCompact()));
      labelBox.append(el);
      labels.push({ el, v: el.lastChild, dir: ll2v(c.center[0], c.center[1]), slot: c.slot, c, prio: named ? 80 : 20, w: 0, h: 0, on: false, val: undefined });
    }
    let ovLabelEls = [];
    function syncOverlayLabels() {
      for (const l of ovLabelEls) { l.el.remove(); labels.splice(labels.indexOf(l), 1); }
      ovLabelEls = overlayLabels.map(o => { const el = document.createElement('span'); el.className = 'lbl ' + o.cls; el.style.setProperty('--c', o.color); el.textContent = o.text; el.style.pointerEvents = 'none'; labelBox.append(el); const l = { el, dir: o.dir, slot: -1, r: o.r, prio: o.prio, w: 0, h: 0, on: false, ov: true, left: o.cls === 'hot' }; labels.push(l); return l; });
      measure();
    }
    function measure() { for (const l of labels) { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; } }
    const lv = new THREE.Vector3();
    let CW = 1, CH = 1, SAFE = [0, 0, 1e5, 1e5];
    function updateLabels() {
      camera.updateMatrixWorld();
      const cam = camera.position, camLen = cam.length(), cand = [];
      for (const l of labels) {
        let ok = !(l.ov && U.uOv.value < 0.5);
        if (ok) {
          const r = l.slot >= 0 ? BASE + curH[l.slot] * HMAX + 0.014 : l.r;
          lv.copy(l.dir).multiplyScalar(r);
          ok = lv.dot(cam) > 1.0 + 0.035 * camLen;
          if (ok) { lv.project(camera); l.x = (lv.x * 0.5 + 0.5) * CW; l.y = (-lv.y * 0.5 + 0.5) * CH; ok = lv.z < 1 && (l.left ? l.x - 4 : l.x - l.w / 2) > SAFE[0] && (l.left ? l.x + l.w : l.x + l.w / 2) < SAFE[2] && l.y - l.h - 8 > SAFE[1] && l.y < SAFE[3] - 4; }
        }
        if (!ok) { if (l.on) { l.on = false; l.el.classList.remove('on'); } continue; }
        l.p = l.prio + (l.slot >= 0 ? (l.slot === S.sel ? 1000 : l.slot === hover ? 500 : (l.c.val || 0) * 0.3) : 0) + (l.on ? 6 : 0);
        cand.push(l);
      }
      cand.sort((a, b) => b.p - a.p);
      const placed = [];
      for (const l of cand) {
        const x0 = l.left ? l.x - 6 : l.x - l.w / 2 - 5, x1 = l.left ? l.x + l.w + 5 : l.x + l.w / 2 + 5, y1 = l.left ? l.y + l.h / 2 + 3 : l.y - 5, y0 = l.left ? l.y - l.h / 2 - 3 : y1 - l.h - 5;
        let free = true; for (const q of placed) if (x0 < q[2] && x1 > q[0] && y0 < q[3] && y1 > q[1]) { free = false; break; }
        if (free) { placed.push([x0, y0, x1, y1 + 3]); l.el.style.transform = `translate3d(${l.x.toFixed(1)}px,${l.y.toFixed(1)}px,0) ` + (l.left ? 'translate(-3px,-50%)' : 'translate(-50%,calc(-100% - 7px))'); if (!l.on) { l.on = true; l.el.classList.add('on'); } }
        else if (l.on) { l.on = false; l.el.classList.remove('on'); }
      }
    }

    // ---- camera, controls, layout
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.085; controls.minDistance = 1.42; controls.zoomSpeed = 0.8;
    controls.autoRotate = false; controls.autoRotateSpeed = 0.1;
    let homeDist = 4.4, fly = null, hover = -1, aspectK = 1, touched = false, vo = null, voT = [0, 0];
    controls.addEventListener('start', () => { touched = true; controls.autoRotate = false; fly = null; wake(); });
    controls.addEventListener('change', wake);
    const VIEWS = { home: [50, 27, null], gulf: [50, 26, 1.3], ukraine: [38, 50.5, 1.25], redsea: [42, 17.5, 1.1], pacific: [121, 26, 1.5] };
    function layout() {
      const r = canvas.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;   // hidden: keep the last size
      CW = r.width; CH = r.height;
      renderer.setSize(CW, CH, false); if (composer) { composer.setPixelRatio(PR); composer.setSize(CW, CH); }
      let sx0 = 0, sx1 = CW, sy0 = 0, sy1 = CH;
      const rel = el => { const b = el.getBoundingClientRect(); return { l: b.left - r.left, r: b.right - r.left, t: b.top - r.top, b: b.bottom - r.top }; };
      const dock = rel($('#g-dock'));
      let syOpen = null;
      if (isCompact()) { sy0 = rel($('#g-brand')).b; sy1 = Math.min(dock.t, rel($('#g-tabs')).t); if (!$('#g-right').classList.contains('closed')) syOpen = Math.max(sy0 + 90, rel($('#g-panels')).t); }
      else { sx0 = rel($('#g-left')).r; sx1 = rel($('#g-right')).l; sy1 = dock.t; }
      const sw = Math.max(80, sx1 - sx0), sh = Math.max(80, sy1 - sy0), cx = (sx0 + sx1) / 2, cy = (sy0 + (syOpen ?? sy1)) / 2;
      SAFE = [sx0, sy0, sx1, syOpen ?? sy1];
      voT = [CW / 2 - cx, CH / 2 - cy]; if (!vo || reduced) vo = voT.slice();
      camera.aspect = CW / CH; camera.setViewOffset(CW, CH, vo[0], vo[1], CW, CH); camera.updateProjectionMatrix();
      const tanT = Math.min(sw, sh) * 0.405 / (CH / 2) * Math.tan(FOV / 2);
      homeDist = clamp(1 / Math.sin(Math.atan(tanT)), 2.4, 12);
      aspectK = clamp(Math.min(sw, sh) / sh > 0.8 ? 1 : (sh / sw) * 0.8, 1, 1.9);
      controls.maxDistance = homeDist * 1.4;
      dotsMat.uniforms.uSize.value = 0.0098 * CH * PR;
      wake();
    }
    function flyTo(lng, lat, alt, ms = 1500) {
      const p = camera.position, d0 = p.length();
      const from = { lng: Math.atan2(p.x, p.z) / D2R, lat: Math.asin(clamp(p.y / d0, -1, 1)) / D2R, d: d0 };
      const dl = ((lng - from.lng + 540) % 360) - 180;
      const to = { dl, lat: clamp(lat, -80, 80), d: alt == null ? homeDist : clamp(1 + alt * aspectK, controls.minDistance, controls.maxDistance) };
      controls.autoRotate = false;
      if (reduced) { ll2v(from.lng + dl, to.lat, to.d, camera.position); controls.update(); wake(); return null; }
      fly = { from, to, t: 0, ms, hop: Math.min(0.9, (Math.abs(dl) + Math.abs(to.lat - from.lat)) / 140) };
      wake();
      return fly;
    }

    // ---- picking: march the view ray down through the raised countries
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), pv = new THREE.Vector3();
    const hitSphere = (o, d, R) => { const b = o.dot(d), c = o.dot(o) - R * R, h = b * b - c; return h < 0 ? null : [-b - Math.sqrt(h), -b + Math.sqrt(h)]; };
    function pick(clientX, clientY) {
      const r = canvas.getBoundingClientRect(); ndc.set((clientX - r.left) / r.width * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera); const o = ray.ray.origin, d = ray.ray.direction;
      const outer = hitSphere(o, d, BASE + HMAX + 0.002); if (!outer || outer[1] < 0) return null;
      const inner = hitSphere(o, d, 1.0); const t0 = Math.max(0, outer[0]), t1 = inner ? inner[0] : outer[1];
      for (let i = 0; i <= 30; i++) {
        pv.copy(d).multiplyScalar(t0 + (t1 - t0) * i / 30).add(o); const rr = pv.length();
        const c = countryAt(Math.atan2(pv.x, pv.z) / D2R, Math.asin(clamp(pv.y / rr, -1, 1)) / D2R);
        if (c && rr <= BASE + curH[c.slot] * HMAX + 0.002) return c;
      }
      return null;
    }
    let down = null, moved = false, hoverXY = null;
    on(canvas, 'pointerdown', e => { down = [e.clientX, e.clientY]; moved = false; tip(null); wake(); });
    on(canvas, 'pointermove', e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) moved = true; hoverXY = e.pointerType === 'mouse' && !down ? e : null; if (!hoverXY) tip(null); else wake(); });
    on(canvas, 'pointerup', e => { if (down && !moved) { const c = pick(e.clientX, e.clientY); select(c ? c.slot : -1, isCompact()); } down = null; });
    on(canvas, 'pointercancel', () => { down = null; });
    on(canvas, 'pointerleave', () => { hoverXY = null; setHover(-1); tip(null); });
    on(canvas, 'wheel', wake, { passive: true });
    function setHover(s) { if (s === hover) return; hover = s; canvas.style.cursor = s >= 0 ? 'pointer' : ''; }

    // ---- context loss: stop drawing and say so; the 2D panels keep working
    on(canvas, 'webglcontextlost', e => { e.preventDefault(); failed('The graphics context was lost (the GPU reset or the browser reclaimed it). Reload the page to restart the 3D view.'); });

    // ---- public surface
    let ovTarget = 1, reliefMode = 'risk', first = true;
    const api = {
      layout,
      relief(t, m) {
        let changed = m !== reliefMode; reliefMode = m;
        for (const c of C) { if (Math.abs(tgtH[c.slot] - t[c.slot]) > 1e-4) { tgtH[c.slot] = t[c.slot]; changed = true; if (first && reduced) curH[c.slot] = t[c.slot]; } }
        for (const l of labels) { if (l.slot < 0) continue; const v = l.c.val; if (v !== l.val) { l.val = v; l.v.textContent = v == null ? '' : v; l.dirty = true; } }
        if ((changed || first) && ovTarget > 0) buildOverlay();
        first = false;
      },
      overlay(on_) { const t = on_ ? 1 : 0; if (t === ovTarget) return; ovTarget = t; if (on_) buildOverlay(); },
      flash(s, a) { flash[s] = Math.min(1, flash[s] + a); },
      select(s) { for (let i = 0; i < NS; i++) tgtHi[i] = i === s ? 1 : 0; for (const l of labels) if (l.slot >= 0) l.el.classList.toggle('sel', l.slot === s); },
      flyTo,
      flyArc(a, b) { const A = ll2v(a[0], a[1]), B = ll2v(b[0], b[1]), m = A.clone().add(B).normalize(); flyTo(Math.atan2(m.x, m.z) / D2R, Math.asin(m.y) / D2R, clamp(0.8 + A.angleTo(B) * 2.6, 0.85, 2.4)); },
      view(k) { const v = VIEWS[k]; if (v) flyTo(v[0], v[1], v[2]); },
      // anything still moving that needs full-rate frames
      busy() {
        if (fly || hoverXY || !probe.done) return true;
        if (vo && Math.abs(vo[0] - voT[0]) + Math.abs(vo[1] - voT[1]) > 0.5) return true;
        if (Math.abs(ovTarget - U.uOv.value) > 0.01) return true;
        for (const c of C) { const s = c.slot; if (Math.abs(tgtH[s] - curH[s]) > 1e-3 || flash[s] > 0.01 || Math.abs(tgtHi[s] - hi[s]) > 0.01) return true; }
        return false;
      },
      stopAutoRotate() { controls.autoRotate = false; },
      // read-only state for diagnosing layout and camera issues (root.__globeDebug())
      debugInfo() {
        const r = canvas.getBoundingClientRect();
        return { canvas: [Math.round(r.width), Math.round(r.height)], CW, CH, homeDist: +homeDist.toFixed(3), dist: +camera.position.length().toFixed(3),
          maxDistance: +controls.maxDistance.toFixed(3), vo: vo && vo.map(v => Math.round(v)), voT: voT.map(v => Math.round(v)), SAFE: SAFE.map(v => Math.round(v)),
          autoRotate: controls.autoRotate, flying: !!fly, tier: TIERS[tier].name, probe: probe.log.join(' ') };
      },
      render(dt, t) {
        if (lostCtx) return;
        U.uTime.value = reduced ? 0 : t;
        const k = 1 - Math.exp(-dt * 5.5), kf = Math.exp(-dt / 0.55), kh = 1 - Math.exp(-dt * 10);
        let dirtyLabels = false;
        for (const c of C) {
          const s = c.slot; curH[s] += (tgtH[s] - curH[s]) * k; flash[s] *= kf;
          const want = Math.max(tgtHi[s], s === hover ? 0.55 : 0); hi[s] += (want - hi[s]) * kh;
          const o = s * 4; tex[o] = curH[s]; tex[o + 1] = flash[s]; tex[o + 2] = hi[s];
        }
        for (const l of labels) if (l.dirty) { l.dirty = false; dirtyLabels = true; }
        if (dirtyLabels) measure();
        dataTex.needsUpdate = true;
        U.uOv.value += (ovTarget - U.uOv.value) * (1 - Math.exp(-dt * 7)); overlay.visible = U.uOv.value > 0.01;
        if (fly) {
          fly.t = Math.min(1, fly.t + dt * 1000 / fly.ms); const e = fly.t < 0.5 ? 4 * fly.t ** 3 : 1 - ((-2 * fly.t + 2) ** 3) / 2;
          const d = fly.from.d + (fly.to.d - fly.from.d) * e + Math.sin(Math.PI * e) * fly.hop;
          ll2v(fly.from.lng + fly.to.dl * e, fly.from.lat + (fly.to.lat - fly.from.lat) * e, Math.min(d, controls.maxDistance), camera.position);
          if (fly.t >= 1) { if (fly.intro && !touched) controls.autoRotate = true; fly = null; }
        }
        if (!vo) return;                                          // not laid out yet (mounted while hidden)
        if (Math.abs(vo[0] - voT[0]) + Math.abs(vo[1] - voT[1]) > 0.5) { const kv = 1 - Math.exp(-dt * 9); vo[0] += (voT[0] - vo[0]) * kv; vo[1] += (voT[1] - vo[1]) * kv; camera.setViewOffset(CW, CH, vo[0], vo[1], CW, CH); camera.updateProjectionMatrix(); }
        const dist = camera.position.length();
        controls.rotateSpeed = clamp((dist - 1) / 3.4, 0.07, 1) * 0.9;
        controls.update(dt);
        const px = 2 * Math.max(0.25, dist - 1) * Math.tan(FOV / 2) / CH; U.uPx.value = px;
        for (const m of rings) m.scale.setScalar(clamp(px * m.userData.px, 0.004, 0.09));
        if (hoverXY) { const c = pick(hoverXY.clientX, hoverXY.clientY); setHover(c ? c.slot : -1); if (c) tip(hoverXY, `<b>${esc(c.key)}</b>${c.risk ? ` · risk <span class="num">${esc(c.risk.risk)}</span> · ${esc(c.risk.level)}` : ''}<br><span class="num">${tempo(c.slot, dayInt())}</span> headlines in ${WIN} days`); else tip(null); hoverXY = null; }
        updateLabels();
        // Self-check: on the third frame (layout settled, globe in view), and again after each
        // step down. A setup is abandoned only after two failed checks in a row, 8 frames
        // apart, so a one-frame glitch (a resize clearing the buffer mid-check) cannot
        // permanently cost a device its best render path.
        if (!probe.done && ++probe.frames >= 3) {
          const r = checkOutput();
          probe.log.push(`${TIERS[tier].name}:${r.res}(${r.got}/${r.ref})`);
          root.dataset.renderLog = probe.log.join(' ');
          if (r.res === 'ok') { probe.done = true; root.dataset.render = TIERS[tier].name; }
          else if (++probe.fails < 2) { probe.frames = -5; }
          else if (r.res === 'blank') { probe.done = true; failed('This device drew a blank frame even without post-processing, so the 3D view is off. The index, board, events and timeline still work.'); return; }
          else if (tier < TIERS.length - 1) { tier++; makeComposer(); probe.frames = 0; probe.fails = 0; console.warn(`[globe] render check failed twice; stepping down to "${TIERS[tier].name}"`); }
          else { probe.done = true; root.dataset.render = TIERS[tier].name; }
          return;
        }
        if (composer) composer.render(dt); else { renderer.setRenderTarget(null); renderer.render(scene, camera); }
      },
      dispose() {
        controls.dispose();
        scene.traverse(o => { o.geometry?.dispose?.(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
        dataTex.dispose();
        if (composer) { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); composer.passes.forEach(p => p.dispose && p.dispose()); }
        renderer.dispose(); renderer.forceContextLoss?.();
      },
    };
    let lostCtx = false;
    function failed(msg) {
      lostCtx = true; canvas.style.visibility = 'hidden';
      const f = $('#g-glfail'); f.hidden = false;
      f.innerHTML = `<b style="color:var(--ink)">The 3D globe is unavailable.</b><br>${esc(msg)}`;
      root.dataset.render = 'failed';
    }
    makeComposer();
    layout();
    if (reduced) ll2v(VIEWS.home[0], VIEWS.home[1], homeDist, camera.position);
    else { ll2v(VIEWS.home[0] + 70, VIEWS.home[1] - 10, homeDist * 1.25, camera.position); const f = flyTo(VIEWS.home[0], VIEWS.home[1], null, 2600); if (f) { f.intro = true; f.hop = 0; } }
    controls.update();
    const ro = new ResizeObserver(() => { placeIndexPanel(); layout(); drawTimeline(); }); ro.observe(root); cleanups.push(() => ro.disconnect());
    if (document.fonts?.ready) document.fonts.ready.then(() => { if (!destroyed) { measure(); drawTimeline(); } });
    return api;
  }

  // ---------------------------------------------------------------- boot
  buildIndexPanel(); buildBoard(); buildDock(); buildMethod(); wireTimeline();
  placeIndexPanel();
  refresh(true); renderCountry(true);
  const tlRo = new ResizeObserver(() => drawTimeline()); tlRo.observe($('#g-tl')); cleanups.push(() => tlRo.disconnect());
  try { G = initGlobe(); G.relief(reliefTargets(), mode()); G.overlay(isNow()); }
  catch (err) {
    console.error('[globe]', err);
    const f = $('#g-glfail'); f.hidden = false;
    f.innerHTML = `<b style="color:var(--ink)">The 3D globe could not start.</b><br>This view needs WebGL. The index, board, events and timeline still work.`;
    root.dataset.render = 'failed';
  }
  $('#g-boot')?.remove();
  root.__globeDebug = () => ({ active, compact: isCompact(), root: [root.clientWidth, root.clientHeight], ...(G ? G.debugInfo() : { globe: 'not running' }) });

  return {
    setActive(v) {
      active = !!v;
      if (active) { placeIndexPanel(); G?.layout(); drawTimeline(); prevT = performance.now(); wake(); }
      else { S.playing = false; if (rafId > 0) cancelAnimationFrame(rafId); rafId = 0; tip(null); }
    },
    destroy() {
      destroyed = true; active = false;
      if (rafId > 0) cancelAnimationFrame(rafId);
      rafId = 0;
      cleanups.forEach(f => f()); cleanups.length = 0;
      try { G?.dispose(); } catch (_) {}
      G = null; root.innerHTML = '';
    },
  };
}
