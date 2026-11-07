(() => {
  // src/js/app.js
  if (typeof window === "undefined" || !window.__DATA__) {
    throw new Error("app.js requires window.__DATA__ \u2014 load the page through dist/index.html, not the source file.");
  }
  var { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, useReducer } = React;
  var AMBER = "var(--c-amber)";
  var DANGER = "var(--c-danger)";
  var IRAN = "var(--c-iran)";
  var BLUE = "var(--c-blue)";
  var BRICS = "var(--c-brics)";
  var BRICS_TEXT = "var(--c-brics-text)";
  var UKRAINE_WAR = "var(--c-ukraine-war)";
  var VIOLET = "var(--c-violet)";
  var CYAN = "var(--c-cyan)";
  var GREEN = "var(--c-green)";
  var CRITICAL = "var(--c-critical)";
  var ELEVATED = "var(--c-elevated)";
  var alpha = (color, a) => `color-mix(in srgb, ${color} ${Math.round(a * 100)}%, transparent)`;
  var TEXT_HI = "var(--text-hi)";
  var TEXT_BODY = "var(--text-body)";
  var TEXT_MID = "var(--text-mid)";
  var TEXT_DIM = "var(--text-dim)";
  var BG = "var(--bg)";
  var SURFACE = "var(--surface)";
  var BORDER = "var(--border)";
  var RAISE_1 = "var(--raise-1)";
  var RAISE_2 = "var(--raise-2)";
  var RAISE_3 = "var(--raise-3)";
  var RAISE_4 = "var(--raise-4)";
  var SCRIM = "var(--scrim)";
  var MONO = "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace";
  var SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
  var FS = { xs: 11, sm: 12, md: 13, base: 14, lg: 16, xl: 20 };
  var WAR_START = new Date(window.__DATA__.meta.war_start);
  var NOW = new Date(window.__DATA__.meta.now);
  var MKT = {
    BTC: { price: null, chg: null },
    ETH: { price: null, chg: null },
    SPX: { price: null, chg: null },
    DOW: { price: null, chg: null },
    NDX: { price: null, chg: null },
    GOLD: { price: null, chg: null },
    WTI: { price: null, chg: null },
    BRENT: { price: null, chg: null }
  };
  var GAS = { national: null, california: null, ohio: null, cincinnati: null, diesel: null, dieselLadder: null };
  var WW3_PCT = window.__DATA__.meta.ww3_pct;
  var BASE_LAST_UPDATE = window.__DATA__.meta.base_last_update;
  var LIVE_REQUIRED = /* @__PURE__ */ new Set(["BTC", "ETH", "SPX", "DOW", "NDX", "GOLD", "WTI", "BRENT"]);
  var isLive = (mkt, symbol) => !LIVE_REQUIRED.has(symbol) || !!mkt?.[symbol]?.loaded;
  function PriceSkeleton({ w = 56, h = 14, radius = 4 }) {
    return /* @__PURE__ */ React.createElement("span", { className: "skeleton", "aria-label": "Awaiting live price", style: {
      display: "inline-block",
      width: w,
      height: h,
      borderRadius: radius,
      verticalAlign: "middle",
      opacity: 0.7
    } });
  }
  var INIT_BREAKING = window.__DATA__.init_breaking;
  var INIT_NEWS = window.__DATA__.init_news;
  var TIER3_STATE_OUTLETS = new Set(window.__DATA__.tier3_state_outlets || []);
  var isTier3State = (name) => TIER3_STATE_OUTLETS.has(String(name || "").toUpperCase().trim());
  var INIT_THEMES = window.__DATA__.init_themes;
  var KEY_DEVS = window.__DATA__.key_devs;
  var ESCALATION_LADDER = window.__DATA__.escalation_ladder;
  var ESCALATION_AXES = window.__DATA__.escalation_axes;
  var GAS_HISTORY = window.__DATA__.gas_history;
  var GAS_DAILY = window.__DATA__.gas_daily || [];
  var DIESEL_HISTORY = window.__DATA__.diesel_history || [];
  var DIESEL_SOURCE = window.__DATA__.diesel_history_source || null;
  var DIESEL_PREWAR = DIESEL_SOURCE && DIESEL_SOURCE.prewar_baseline && DIESEL_SOURCE.prewar_baseline.v > 0 ? DIESEL_SOURCE.prewar_baseline : null;
  var RISK_COUNTRIES = window.__DATA__.risk_countries;
  var CHESS_PLAYERS = window.__DATA__.chess_players;
  var TIMELINE = window.__DATA__.timeline;
  var AI_CARDS = window.__DATA__.ai_cards;
  var WW3_HISTORY = window.__DATA__.ww3_history;
  var HORMUZ_HISTORY = window.__DATA__.hormuz_history;
  var BRENT_HISTORY = window.__DATA__.brent_history;
  var GAS_NAT_HISTORY = window.__DATA__.gas_nat_history;
  var WW3_SERIES = window.__DATA__.ww3_series || [];
  var BRENT_SERIES = window.__DATA__.brent_series || [];
  var GAS_NAT_SERIES = window.__DATA__.gas_nat_series || [];
  var HORMUZ_SERIES = window.__DATA__.hormuz_series || [];
  var MAP_OVERLAYS = window.__DATA__.map_overlays || null;
  var HORMUZ_NOW = HORMUZ_SERIES.length ? HORMUZ_SERIES[HORMUZ_SERIES.length - 1] : null;
  var WW3_DELTA = window.__DATA__.meta && typeof window.__DATA__.meta.ww3_delta === "number" ? window.__DATA__.meta.ww3_delta : null;
  var WW3_NOW_LABEL = window.__DATA__.meta && window.__DATA__.meta.ww3_now_label || null;
  var IRAN_LEAD = window.__DATA__.iran_lead;
  var BRICS_LEAD = window.__DATA__.brics_lead;
  var UKRAINE_LEAD = window.__DATA__.ukraine_lead;
  var LEAD_TLDR = IRAN_LEAD;
  var COUNTRY_KEYS = window.__DATA__.country_keys;
  var OUTLOOK = window.__DATA__.outlook || { forecasts: [], indicators: [], gaps: [], calibration: null };
  var EVENT_FIRST_SEEN = window.__DATA__.event_first_seen || {};
  var HUMAN_COST = window.__DATA__.human_cost || null;
  var ECON_COMMENTARY = window.__DATA__.econ_commentary || [];
  var HORMUZ_STATUS = window.__DATA__.meta && window.__DATA__.meta.hormuz_status || null;
  var THEATERS_DATA = window.__DATA__.theaters || [];
  var M = ({ children, style, ...p }) => /* @__PURE__ */ React.createElement("span", { style: { fontFamily: SANS, fontVariantNumeric: "tabular-nums", ...style }, ...p }, children);
  var Card = ({ children, style, danger, amber, info, className = "", ...p }) => /* @__PURE__ */ React.createElement("div", { className: `card ${className}`.trim(), style: {
    // For default cards, leave bg undefined so the .card CSS rule picks up `background: var(--card-bg)`
    // (CSS class rules re-resolve var() on theme change; inline var() refs do not in Chrome).
    background: danger ? alpha(DANGER, 0.055) : amber ? alpha(AMBER, 0.05) : info ? alpha(BLUE, 0.05) : void 0,
    border: `1px solid ${danger ? alpha(DANGER, 0.22) : amber ? alpha(AMBER, 0.22) : info ? alpha(BLUE, 0.22) : BORDER}`,
    borderRadius: 12,
    padding: 20,
    ...style
  }, ...p }, children);
  var _nfCompact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
  var _nfFull = new Intl.NumberFormat("en-US");
  var fmt = {
    num: (n) => n == null ? "\u2014" : _nfFull.format(n),
    compact: (n) => n == null ? "\u2014" : _nfCompact.format(n),
    pct: (n, d = 1) => n == null ? "\u2014" : `${n.toFixed(d)}%`,
    signedPct: (n, d = 2) => n == null ? "\u2014" : `${n >= 0 ? "+" : ""}${n.toFixed(d)}%`,
    signedNum: (n) => n == null ? "\u2014" : `${n >= 0 ? "+" : ""}${_nfFull.format(n)}`,
    abs: (n) => Math.abs(n),
    arrow: (n) => n > 0 ? "\u2191" : n < 0 ? "\u2193" : "\u2192",
    money: (n, d = 2) => n == null ? "\u2014" : `$${n.toFixed(d)}`,
    moneyK: (n) => n == null ? "\u2014" : `$${_nfCompact.format(n)}`
  };
  var Eyebrow = ({ children, color = TEXT_DIM, mb = 8, style }) => /* @__PURE__ */ React.createElement("div", { style: { fontSize: FS.xs, color, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, marginBottom: mb, ...style } }, children);
  var SeverityInline = ({ level, size = 10 }) => {
    const c = SEV_COLOR[level] || TEXT_MID;
    return /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: size, fontWeight: 600, letterSpacing: ".14em", color: c, textTransform: "uppercase" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${alpha(c, 0.4)}` } }), level);
  };
  var StatusBadge = ({ status }) => {
    if (!status || status === "confirmed") return null;
    const disputed = status === "disputed" || status === "unknown";
    return /* @__PURE__ */ React.createElement("span", { title: disputed ? "Disputed \u2014 credible sources materially disagree" : "Reported \u2014 single credible source, not independently confirmed", style: {
      display: "inline-block",
      marginRight: 6,
      verticalAlign: "middle",
      fontSize: FS.xs,
      fontWeight: 700,
      color: disputed ? DANGER : AMBER,
      background: disputed ? "transparent" : alpha(AMBER, 0.14),
      border: `1px solid ${disputed ? alpha(DANGER, 0.45) : alpha(AMBER, 0.35)}`,
      padding: "1px 5px",
      borderRadius: 4,
      letterSpacing: ".08em",
      lineHeight: 1.3,
      cursor: "help"
    } }, disputed ? "DISPUTED" : "REPORTED");
  };
  function KpiCell({ label, badge, info, value, valueColor = TEXT_HI, subDisplay, footer, border, small, loading }) {
    return /* @__PURE__ */ React.createElement("div", { className: "kpi-cell", style: { padding: "24px 22px", borderRight: border ? `1px solid ${BORDER}` : "none", display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0, color: TEXT_MID }, label), badge, info && /* @__PURE__ */ React.createElement(InfoTip, null, info)), loading ? /* @__PURE__ */ React.createElement(PriceSkeleton, { w: small ? 100 : 130, h: small ? 22 : 28, radius: 6 }) : /* @__PURE__ */ React.createElement("div", { className: "display", style: {
      fontSize: small ? 22 : 30,
      fontWeight: 600,
      color: valueColor,
      letterSpacing: small ? "-.01em" : "-.025em",
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums",
      fontVariationSettings: small ? "'opsz' 22" : "'opsz' 30"
    } }, value), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 2 } }, subDisplay), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: TEXT_BODY, fontVariantNumeric: "tabular-nums", fontFamily: SANS, marginTop: 2, minHeight: 14 } }, loading ? /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM, fontStyle: "italic", fontSize: 11 } }, "awaiting live feed\u2026") : footer));
  }
  function AxisBar({ axis }) {
    const scoreColor = axis.score >= 60 ? DANGER : axis.score >= 40 ? AMBER : BLUE;
    return /* @__PURE__ */ React.createElement("div", { className: "axis-row", style: { display: "flex", flexDirection: "column", gap: 8, fontFamily: SANS } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "axis-label", style: { fontSize: 13, fontWeight: 600, color: TEXT_BODY, letterSpacing: "-.005em", minWidth: 170, flexShrink: 0, display: "inline-flex", alignItems: "center" } }, axis.label, AXIS_HELP[axis.key] && /* @__PURE__ */ React.createElement(InfoTip, null, AXIS_HELP[axis.key])), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 60, maxWidth: 180, height: 5, background: BORDER, borderRadius: 999, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: `${axis.score}%`,
      height: "100%",
      background: `linear-gradient(90deg, ${BLUE}, ${AMBER} 50%, ${DANGER})`,
      borderRadius: 999,
      transition: "width .6s cubic-bezier(.2,.8,.2,1)"
    } })), /* @__PURE__ */ React.createElement("div", { style: { width: 30, textAlign: "right", fontSize: 14, fontWeight: 600, color: scoreColor, fontVariantNumeric: "tabular-nums", flexShrink: 0 } }, axis.score)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: TEXT_DIM, lineHeight: 1.55 } }, axis.currentLabel));
  }
  function EventSeriesChart({
    series,
    // [{d:"YYYY-MM-DD", v, t?, s?, k?, now?}]
    start = WAR_START,
    // x-domain start (Date)
    end = NOW,
    // x-domain end (Date)
    color = AMBER,
    // line + area color
    height = 200,
    variant = "hero",
    // "hero" | "mini"
    yMin,
    yMax,
    // optional fixed y-domain; else auto with headroom
    gridYs = null,
    // optional explicit y gridlines (hero only)
    escalationUp = true,
    // rising value == escalation (red)? false for Hormuz
    format = (v) => String(v),
    // value formatter for labels/tooltip
    unit = "",
    // value unit suffix (e.g. "%")
    live = null,
    // { v, label } spliced as the endpoint if present
    emptyLabel = "no data yet"
  }) {
    const mini = variant === "mini";
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const [svgW, setSvgW] = useState(mini ? 150 : 760);
    const [hover, setHover] = useState(null);
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(([e]) => {
        const cw = Math.round(e.contentRect.width);
        if (cw > 0) setSvgW(cw);
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);
    const parseD = (d) => (/* @__PURE__ */ new Date(`${d}T00:00:00`)).getTime();
    const fmtDate = (iso) => (/* @__PURE__ */ new Date(`${iso}T00:00:00`)).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    let pts = (Array.isArray(series) ? series : []).filter((p) => p && p.d != null && Number.isFinite(p.v)).map((p) => ({ ...p, ms: parseD(p.d) })).sort((a, b) => a.ms - b.ms);
    if (live && Number.isFinite(live.v)) {
      const endMs2 = end.getTime();
      const last = pts[pts.length - 1];
      if (last && (last.now || last.ms >= endMs2)) {
        pts[pts.length - 1] = { ...last, v: live.v, now: true, s: live.label || last.s };
      } else {
        pts.push({ d: new Date(endMs2).toISOString().slice(0, 10), ms: endMs2, v: live.v, t: last ? "Now" : void 0, s: live.label, now: true });
      }
    }
    if (pts.length < 2) {
      return /* @__PURE__ */ React.createElement("div", { ref: containerRef, style: { width: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: { height, display: "flex", alignItems: "center", justifyContent: "center", fontSize: mini ? 10 : 12, color: TEXT_DIM, fontFamily: SANS, fontStyle: "italic", textAlign: "center", lineHeight: 1.4 } }, emptyLabel));
    }
    const w = svgW, h = height;
    const startMs = start.getTime();
    const endMs = Math.max(end.getTime(), pts[pts.length - 1].ms);
    const span = Math.max(1, endMs - startMs);
    const padL = mini ? 4 : 34, padR = mini ? 6 : 16, padT = mini ? 8 : 16, padB = mini ? 12 : 26;
    const innerW = Math.max(1, w - padL - padR), innerH = Math.max(1, h - padT - padB);
    const vals = pts.map((p) => p.v);
    let lo = yMin, hi = yMax;
    if (lo == null || hi == null) {
      const dMin = Math.min(...vals), dMax = Math.max(...vals);
      const pad = (dMax - dMin) * 0.14 || Math.abs(dMax) * 0.1 || 1;
      if (lo == null) lo = dMin - pad;
      if (hi == null) hi = dMax + pad;
    }
    const yRange = hi - lo || 1;
    const xOf = (ms) => padL + (ms - startMs) / span * innerW;
    const yOf = (v) => padT + (1 - (v - lo) / yRange) * innerH;
    const xy = pts.map((p) => [xOf(p.ms), yOf(p.v)]);
    const linePath = xy.reduce((acc, [x, y], i) => {
      if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      const [px, py] = xy[i - 1];
      const dx = (x - px) * 0.5;
      return `${acc} C ${(px + dx).toFixed(1)} ${py.toFixed(1)}, ${(x - dx).toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, "");
    const baseY = padT + innerH;
    const areaPath = `${linePath} L ${xy[xy.length - 1][0].toFixed(1)} ${baseY} L ${xy[0][0].toFixed(1)} ${baseY} Z`;
    const fillId = `es-fill-${mini ? "m" : "h"}-${Math.round(startMs / 1e7)}-${pts.length}`;
    const dots = pts.map((p, i) => {
      const prev = i > 0 ? pts[i - 1] : null;
      const moved = prev ? p.v !== prev.v : false;
      const unscored = p.scored === false;
      if (!(p.t || moved || p.now || i === 0 || unscored)) return null;
      let clr = TEXT_MID;
      if (unscored) {
      } else if (p.now) clr = color;
      else if (!prev) clr = color;
      else {
        let dir = Math.sign(p.v - prev.v);
        if (!escalationUp) dir = -dir;
        if (dir > 0) clr = DANGER;
        else if (dir < 0) clr = GREEN;
        else if (!p.t) return null;
      }
      return { p, i, x: xy[i][0], y: xy[i][1], clr, labeled: !!p.t, now: !!p.now, hollow: unscored };
    }).filter(Boolean);
    const onMove = (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const r = svg.getBoundingClientRect();
      const scaleX = w / r.width;
      const px = (clientX - r.left) * scaleX;
      if (px < padL - 6 || px > w - padR + 6) {
        setHover(null);
        return;
      }
      let best = 0, bestDist = Infinity;
      for (let i = 0; i < xy.length; i++) {
        const d = Math.abs(xy[i][0] - px);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      setHover({ i: best, x: xy[best][0], y: xy[best][1], p: pts[best], pxX: clientX - r.left, pxW: r.width });
    };
    const onLeave = () => setHover(null);
    const dayN = (ms) => Math.max(0, Math.floor((ms - WAR_START) / 864e5));
    const hoverClr = (() => {
      if (!hover) return color;
      const d = dots.find((x) => x.i === hover.i);
      return d ? d.clr : color;
    })();
    return /* @__PURE__ */ React.createElement("div", { ref: containerRef, style: { width: "100%", position: "relative" } }, /* @__PURE__ */ React.createElement(
      "svg",
      {
        ref: svgRef,
        viewBox: `0 0 ${w} ${h}`,
        width: "100%",
        height: h,
        style: { display: "block", overflow: "visible", cursor: "crosshair" },
        role: "img",
        "aria-label": "Event-anchored trajectory since Feb 28",
        onMouseMove: onMove,
        onMouseLeave: onLeave,
        onTouchMove: onMove,
        onTouchEnd: onLeave
      },
      /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: fillId, x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: color, stopOpacity: mini ? ".18" : ".22" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: color, stopOpacity: "0" }))),
      !mini && Array.isArray(gridYs) && gridYs.map((v) => /* @__PURE__ */ React.createElement("g", { key: v }, /* @__PURE__ */ React.createElement(
        "line",
        {
          x1: padL,
          x2: padL + innerW,
          y1: yOf(v),
          y2: yOf(v),
          stroke: BORDER,
          strokeWidth: ".5",
          strokeDasharray: "2 3",
          opacity: ".55"
        }
      ), /* @__PURE__ */ React.createElement(
        "text",
        {
          x: padL - 8,
          y: yOf(v) + 3.5,
          fontSize: "11",
          fill: TEXT_DIM,
          textAnchor: "end",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          letterSpacing: ".04em"
        },
        format(v),
        unit
      ))),
      /* @__PURE__ */ React.createElement("path", { d: areaPath, fill: `url(#${fillId})` }),
      /* @__PURE__ */ React.createElement("path", { d: linePath, fill: "none", stroke: color, strokeWidth: mini ? "1.75" : "2.25", strokeLinejoin: "round", strokeLinecap: "round" }),
      dots.map((d) => /* @__PURE__ */ React.createElement("g", { key: d.i }, d.now && /* @__PURE__ */ React.createElement("circle", { cx: d.x, cy: d.y, r: mini ? "6" : "9", fill: "none", stroke: d.clr, strokeWidth: "1.5", opacity: ".55" }, /* @__PURE__ */ React.createElement("animate", { attributeName: "r", values: mini ? "3.5;7.5;3.5" : "5;11;5", dur: "2.4s", repeatCount: "indefinite" }), /* @__PURE__ */ React.createElement("animate", { attributeName: "opacity", values: "0.6;0;0.6", dur: "2.4s", repeatCount: "indefinite" })), hover && hover.i === d.i && !d.now && /* @__PURE__ */ React.createElement("circle", { cx: d.x, cy: d.y, r: mini ? "5" : "8", fill: d.clr, fillOpacity: ".18", stroke: d.clr, strokeOpacity: ".5", strokeWidth: ".8" }), /* @__PURE__ */ React.createElement(
        "circle",
        {
          cx: d.x,
          cy: d.y,
          r: d.now ? mini ? 3.4 : 4.5 : mini ? d.labeled ? 2.6 : 2 : d.labeled ? 3 : 2.4,
          fill: d.hollow ? "var(--bg)" : d.clr,
          fillOpacity: d.hollow ? 1 : d.now || d.labeled ? 1 : 0.9,
          stroke: d.hollow ? d.clr : "var(--bg)",
          strokeWidth: d.hollow ? mini ? "1.25" : "1.5" : mini ? "1" : "1.5",
          strokeDasharray: d.hollow ? "1.5 1.5" : void 0
        }
      ))),
      hover && /* @__PURE__ */ React.createElement("g", { pointerEvents: "none" }, /* @__PURE__ */ React.createElement("line", { x1: hover.x, x2: hover.x, y1: padT, y2: baseY, stroke: hoverClr, strokeWidth: ".8", strokeDasharray: "3 3", opacity: ".5" }), /* @__PURE__ */ React.createElement("circle", { cx: hover.x, cy: hover.y, r: mini ? "4" : "6", fill: hoverClr, stroke: "var(--bg)", strokeWidth: "2" })),
      !mini && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        "text",
        {
          x: xOf(WAR_START.getTime()),
          y: baseY + 17,
          fontSize: "11",
          fill: TEXT_DIM,
          textAnchor: "start",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          letterSpacing: ".04em"
        },
        "Feb 28 \xB7 Day 0"
      ), /* @__PURE__ */ React.createElement(
        "text",
        {
          x: padL + innerW,
          y: baseY + 17,
          fontSize: "11",
          fill: TEXT_DIM,
          textAnchor: "end",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          letterSpacing: ".04em"
        },
        NOW.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        " \xB7 Day ",
        dayN(NOW.getTime())
      ))
    ), hover && (() => {
      const p = hover.p;
      const unscored = p.scored === false;
      const tipW = p.t || unscored ? mini ? 168 : 210 : 128;
      const left = Math.max(4, Math.min(hover.pxX + 14, hover.pxW - tipW - 4));
      return /* @__PURE__ */ React.createElement("div", { style: {
        position: "absolute",
        left,
        top: mini ? -4 : 6,
        zIndex: 6,
        width: tipW,
        background: "var(--header-bg)",
        backdropFilter: "blur(16px) saturate(140%)",
        WebkitBackdropFilter: "blur(16px) saturate(140%)",
        border: `1px solid ${BORDER}`,
        borderRadius: 9,
        overflow: "hidden",
        fontFamily: SANS,
        fontSize: 11.5,
        lineHeight: 1.5,
        boxShadow: "0 10px 30px -8px rgba(0,0,0,.45), 0 2px 6px -2px rgba(0,0,0,.25)",
        pointerEvents: "none"
      } }, /* @__PURE__ */ React.createElement("div", { style: { height: 2, background: `linear-gradient(90deg, ${hoverClr}, ${alpha(hoverClr, 0.25)})` } }), /* @__PURE__ */ React.createElement("div", { style: { padding: "9px 11px 10px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18, fontWeight: 700, color, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 } }, format(p.v), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: TEXT_DIM, marginLeft: 1 } }, unit)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.xs, color: TEXT_DIM, fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: ".04em", whiteSpace: "nowrap" } }, fmtDate(p.d), " \xB7 D", dayN(p.ms))), p.t && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 9, paddingTop: 9, borderTop: `1px solid ${alpha(hoverClr, 0.25)}`, display: "flex", alignItems: "flex-start", gap: 7 } }, /* @__PURE__ */ React.createElement("span", { style: { flexShrink: 0, marginTop: 3, width: 7, height: 7, borderRadius: "50%", background: hoverClr, boxShadow: `0 0 0 3px ${alpha(hoverClr, 0.18)}` } }), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0, flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: FS.xs, fontWeight: 700, color: hoverClr, letterSpacing: ".06em", textTransform: "uppercase", lineHeight: 1.25 } }, p.t), p.s && /* @__PURE__ */ React.createElement("div", { style: { fontSize: FS.xs, color: TEXT_MID, marginTop: 3, lineHeight: 1.35 } }, p.s))), unscored && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 9, paddingTop: 9, borderTop: `1px dashed ${alpha(hoverClr, 0.3)}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: FS.xs, color: TEXT_DIM, fontStyle: "italic", lineHeight: 1.35 } }, "Not independently scored this day \u2014 value carried forward from the last scored date."))));
    })());
  }
  var prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function useReducedMotion() {
    const [r, setR] = useState(prefersReducedMotion);
    useEffect(() => {
      if (!window.matchMedia) return;
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const fn = () => setR(mq.matches);
      mq.addEventListener?.("change", fn);
      return () => mq.removeEventListener?.("change", fn);
    }, []);
    return r;
  }
  function useIsMobile(bp = 900) {
    const [m, setM] = useState(
      () => typeof window !== "undefined" && window.matchMedia ? window.matchMedia(`(max-width: ${bp}px)`).matches : false
    );
    useEffect(() => {
      if (!window.matchMedia) return;
      const mq = window.matchMedia(`(max-width: ${bp}px)`);
      const fn = (e) => setM(e.matches);
      mq.addEventListener?.("change", fn);
      return () => mq.removeEventListener?.("change", fn);
    }, [bp]);
    return m;
  }
  function usePullToRefresh(onRefresh, enabled = true) {
    const [state, setState] = useState("idle");
    const [pullY, setPullY] = useState(0);
    const startY = useRef(0);
    const pulling = useRef(false);
    useEffect(() => {
      if (!enabled) return;
      const THRESHOLD = 80;
      const onStart = (e) => {
        if (window.scrollY > 5 || document.documentElement.scrollTop > 5) return;
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      };
      const onMove = (e) => {
        if (!pulling.current) return;
        const dy = e.touches[0].clientY - startY.current;
        if (dy < 0) {
          pulling.current = false;
          setPullY(0);
          setState("idle");
          return;
        }
        const damped = Math.min(dy * 0.45, 120);
        setPullY(damped);
        setState(damped >= THRESHOLD ? "triggered" : "pulling");
      };
      const onEnd = () => {
        if (!pulling.current) return;
        pulling.current = false;
        if (state === "triggered") {
          setState("refreshing");
          setPullY(0);
          onRefresh();
          setTimeout(() => setState("idle"), 1200);
        } else {
          setPullY(0);
          setState("idle");
        }
      };
      document.addEventListener("touchstart", onStart, { passive: true });
      document.addEventListener("touchmove", onMove, { passive: true });
      document.addEventListener("touchend", onEnd);
      return () => {
        document.removeEventListener("touchstart", onStart);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onEnd);
      };
    }, [enabled, onRefresh, state]);
    return { state, pullY };
  }
  function PullToRefreshIndicator({ state, pullY }) {
    if (state === "idle" && pullY === 0) return null;
    const visible = state === "pulling" || state === "triggered" || state === "refreshing";
    const cn = `ptr-indicator${visible ? " ptr-visible" : ""}${state === "refreshing" ? " ptr-triggered" : ""}`;
    const rotation = state === "refreshing" ? 0 : Math.min(pullY * 3, 360);
    return /* @__PURE__ */ React.createElement("div", { className: cn, style: state === "pulling" ? { transform: `translateX(-50%) translateY(${Math.max(-10, pullY - 50)}px)` } : void 0 }, /* @__PURE__ */ React.createElement(
      "svg",
      {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: state === "triggered" ? "var(--c-amber)" : "var(--text-mid)",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: state !== "refreshing" ? { transform: `rotate(${rotation}deg)` } : void 0
      },
      /* @__PURE__ */ React.createElement("path", { d: "M3 12a9 9 0 0 1 15.5-6.36L21 8" }),
      /* @__PURE__ */ React.createElement("path", { d: "M21 3v5h-5" }),
      /* @__PURE__ */ React.createElement("path", { d: "M21 12a9 9 0 0 1-15.5 6.36L3 16" }),
      /* @__PURE__ */ React.createElement("path", { d: "M3 21v-5h5" })
    ));
  }
  function useSwipeTabs(tab, setTab, tabs, enabled = true) {
    const [offsetX, setOffsetX] = useState(0);
    const [swiping, setSwiping] = useState(false);
    const startRef = useRef({ x: 0, y: 0, locked: false, dir: null });
    useEffect(() => {
      if (!enabled) return;
      const SWIPE_THRESHOLD = 60;
      const onStart = (e) => {
        startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, locked: false, dir: null };
      };
      const onMove = (e) => {
        const dx = e.touches[0].clientX - startRef.current.x;
        const dy = e.touches[0].clientY - startRef.current.y;
        if (!startRef.current.locked) {
          if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
          startRef.current.dir = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
          startRef.current.locked = true;
        }
        if (startRef.current.dir !== "h") return;
        setSwiping(true);
        setOffsetX(dx * 0.35);
      };
      const onEnd = () => {
        if (!swiping) return;
        const dx = offsetX / 0.35;
        const idx = tabs.indexOf(tab);
        if (dx < -SWIPE_THRESHOLD && idx < tabs.length - 1) {
          setTab(tabs[idx + 1]);
        } else if (dx > SWIPE_THRESHOLD && idx > 0) {
          setTab(tabs[idx - 1]);
        }
        setOffsetX(0);
        setSwiping(false);
        startRef.current = { x: 0, y: 0, locked: false, dir: null };
      };
      document.addEventListener("touchstart", onStart, { passive: true });
      document.addEventListener("touchmove", onMove, { passive: true });
      document.addEventListener("touchend", onEnd);
      return () => {
        document.removeEventListener("touchstart", onStart);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onEnd);
      };
    }, [enabled, tab, setTab, tabs, swiping, offsetX]);
    return { offsetX: swiping ? offsetX : 0, swiping };
  }
  function SectionHeader({ children, style }) {
    const ref = useRef(null);
    const [stuck, setStuck] = useState(false);
    useEffect(() => {
      if (!ref.current) return;
      const el = ref.current;
      const io = new IntersectionObserver(
        ([entry]) => setStuck(!entry.isIntersecting),
        { threshold: 1, rootMargin: "-61px 0px 0px 0px" }
      );
      io.observe(el);
      return () => io.disconnect();
    }, []);
    return /* @__PURE__ */ React.createElement("div", { ref, className: `section-sticky-header${stuck ? " stuck" : ""}`, style }, children);
  }
  function GlanceMode({ active, onClose, ww3, mkt, gas, conflictDay, latestHeadline }) {
    if (!active) return null;
    const ww3Color = ww3 > 60 ? DANGER : ww3 > 40 ? AMBER : GREEN;
    const ww3Delta = WW3_DELTA != null ? WW3_DELTA : ww3 - WW3_HISTORY[WW3_HISTORY.length - 2];
    return /* @__PURE__ */ React.createElement("div", { className: "glance-overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("button", { className: "glance-close", onClick: onClose, "aria-label": "Close glance view" }, /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "glance-card", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 6, color: TEXT_MID, style: { textAlign: "center" } }, "Day ", conflictDay, " \xB7 WW3 Probability"), /* @__PURE__ */ React.createElement("div", { className: "display", style: {
      fontSize: 96,
      fontWeight: 600,
      color: ww3Color,
      lineHeight: 0.9,
      letterSpacing: "-.05em",
      fontVariantNumeric: "tabular-nums",
      fontVariationSettings: "'opsz' 96",
      textAlign: "center"
    } }, ww3, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 40, opacity: 0.55 } }, "%")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, display: "flex", justifyContent: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 12,
      fontWeight: 600,
      color: ww3Delta >= 0 ? IRAN : GREEN,
      background: ww3Delta >= 0 ? alpha(IRAN, 0.1) : alpha(GREEN, 0.1),
      padding: "3px 10px",
      borderRadius: 999,
      border: `1px solid ${ww3Delta >= 0 ? alpha(IRAN, 0.25) : alpha(GREEN, 0.22)}`
    } }, fmt.arrow(ww3Delta), " ", fmt.abs(ww3Delta), " pts 24h"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 } }, [
      { l: "BRENT", v: mkt.BRENT.price != null ? fmt.money(mkt.BRENT.price) : "\u2014", c: AMBER },
      { l: "S&P", v: mkt.SPX.price != null ? fmt.num(Math.round(mkt.SPX.price)) : "\u2014", c: TEXT_HI },
      { l: "GAS", v: gas?.national != null ? fmt.money(gas.national, 3) : "\u2014", c: AMBER },
      { l: "DIESEL", v: gas?.diesel != null ? fmt.money(gas.diesel, 3) : "\u2014", c: AMBER }
    ].map((kpi) => /* @__PURE__ */ React.createElement("div", { key: kpi.l, style: {
      background: "var(--card-bg)",
      border: `1px solid ${BORDER}`,
      borderRadius: 10,
      padding: "12px 8px",
      textAlign: "center"
    } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 4, style: { textAlign: "center", fontSize: FS.xs } }, kpi.l), /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 20, fontWeight: 600, color: kpi.c, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" } }, kpi.v)))), latestHeadline && /* @__PURE__ */ React.createElement("div", { style: {
      background: alpha(DANGER, 0.08),
      border: `1px solid ${alpha(DANGER, 0.22)}`,
      borderRadius: 10,
      padding: "12px 16px",
      textAlign: "left"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: DANGER, animation: "ping 1.4s ease infinite" } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.xs, fontWeight: 700, color: DANGER, letterSpacing: ".12em" } }, "LATEST")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_HI, lineHeight: 1.5, fontWeight: 500 } }, latestHeadline)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".04em" } }, "Tap anywhere to dismiss")));
  }
  function CountryBottomSheet({ country, onClose, onNavigate }) {
    const [expanded, setExpanded] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dragRef = useRef({ startY: 0, dragging: false });
    const sheetRef = useRef(null);
    useEffect(() => {
      function onKey(e) {
        if (e.key === "Escape") onClose();
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);
    if (!country) return null;
    const d = getCountryDossier(country);
    if (!d) return null;
    const riskCol = d.risk ? SEV_COLOR[d.risk.level] || TEXT_MID : TEXT_MID;
    const onHandleTouchStart = (e) => {
      dragRef.current = { startY: e.touches[0].clientY, dragging: true };
    };
    const onHandleTouchMove = (e) => {
      if (!dragRef.current.dragging) return;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      if (dy > 80) {
        onClose();
        dragRef.current.dragging = false;
      } else if (dy < -40 && !expanded) {
        setExpanded(true);
        dragRef.current.dragging = false;
      }
    };
    const onHandleTouchEnd = () => {
      dragRef.current.dragging = false;
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "drawer-overlay",
        onClick: onClose,
        style: { position: "fixed", inset: 0, background: SCRIM, zIndex: 200, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }
      }
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: sheetRef,
        className: `bottom-sheet${expanded ? " sheet-expanded" : ""}`,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": `${country} dossier`
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "bottom-sheet-handle",
          onTouchStart: onHandleTouchStart,
          onTouchMove: onHandleTouchMove,
          onTouchEnd: onHandleTouchEnd,
          style: { cursor: "grab" }
        }
      ),
      /* @__PURE__ */ React.createElement("header", { style: {
        padding: "8px 20px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: scrolled ? `1px solid ${BORDER}` : "1px solid transparent",
        flexShrink: 0
      } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 28, lineHeight: 1 } }, d.risk?.flag || "\u{1F310}"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 20, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.015em", lineHeight: 1.1 } }, country), d.risk && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", marginTop: 4 } }, /* @__PURE__ */ React.createElement(SeverityInline, { level: d.risk.level, size: 9 }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, fontWeight: 600, color: riskCol } }, barLabel(d.risk), " ", d.risk.risk))), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          "aria-label": "Close",
          className: "pressable",
          style: {
            width: 36,
            height: 36,
            borderRadius: 8,
            background: RAISE_1,
            border: `1px solid ${BORDER}`,
            color: TEXT_MID,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 16 })
      )),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          onScroll: (e) => setScrolled(e.currentTarget.scrollTop > 4),
          style: { flex: 1, overflowY: "auto", padding: "14px 20px 24px", display: "flex", flexDirection: "column", gap: 18, WebkitOverflowScrolling: "touch" }
        },
        d.risk && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 6 }, "Snapshot"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, lineHeight: 1.6 } }, d.risk.details || d.risk.note)),
        d.chess && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 6, color: d.chess.color }, "Current Move"), /* @__PURE__ */ React.createElement(Card, { style: { borderLeft: `3px solid ${d.chess.color}`, padding: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: TEXT_BODY, lineHeight: 1.6 } }, d.chess.details || d.chess.move))),
        d.newsHits.length > 0 && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0 }, "News ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_MID } }, d.newsHits.length)), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => onNavigate("feed", { country }),
            style: { background: "none", border: "none", color: BLUE, fontSize: 11, cursor: "pointer", fontWeight: 600 }
          },
          "See all \u2192"
        )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, d.newsHits.slice(0, 4).map((n, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 8, alignItems: "baseline", paddingBottom: 8, borderBottom: i < 3 ? `1px solid ${BORDER}` : "none" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: AMBER, fontWeight: 600, flexShrink: 0, width: 38 } }, n.t), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: TEXT_HI, lineHeight: 1.5 } }, n.h))))),
        d.timelineHits.length > 0 && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 6 }, "Timeline ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_MID } }, d.timelineHits.length)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, d.timelineHits.slice(0, 5).map((t, i) => {
          const col = { extreme: DANGER, critical: CRITICAL, high: AMBER }[t.sev] || TEXT_MID;
          return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 8, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM, fontWeight: 500, flexShrink: 0, width: 42, paddingTop: 4 } }, t.date), /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: col, flexShrink: 0, marginTop: 6 } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: TEXT_BODY, lineHeight: 1.5 } }, t.desc));
        }))),
        !d.risk && !d.chess && d.newsHits.length === 0 && d.timelineHits.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_MID, padding: 24, textAlign: "center" } }, "No data on file for ", country, ".")
      )
    ));
  }
  function TickingNumber({ value, duration = 900, decimals = 0, prefix = "", suffix = "", from }) {
    const reduce = useReducedMotion();
    const initial = reduce ? value : from != null ? from : 0;
    const [shown, setShown] = useState(initial);
    const fromRef = useRef(initial);
    const rafRef = useRef(0);
    useEffect(() => {
      if (reduce) {
        setShown(value);
        fromRef.current = value;
        return;
      }
      cancelAnimationFrame(rafRef.current);
      const start = performance.now();
      const a = fromRef.current;
      const b = value;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const e = 1 - Math.pow(1 - t, 3);
        const v = a + (b - a) * e;
        setShown(v);
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
        else fromRef.current = b;
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }, [value, duration, reduce]);
    const out = decimals > 0 ? Number(shown).toFixed(decimals) : Math.round(shown);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, prefix, out, suffix);
  }
  function RevealOnView({ children, delay = 0, threshold = 0.15, as: As = "div", style, ...p }) {
    const reduce = useReducedMotion();
    const ref = useRef(null);
    const [seen, setSeen] = useState(false);
    useEffect(() => {
      if (reduce) {
        setSeen(true);
        return;
      }
      if (!ref.current || seen) return;
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
            break;
          }
        }
      }, { threshold });
      io.observe(ref.current);
      return () => io.disconnect();
    }, [reduce, seen, threshold]);
    return /* @__PURE__ */ React.createElement(
      As,
      {
        ref,
        className: seen ? "choreographed" : "",
        style: { animationDelay: seen ? `${delay}ms` : void 0, opacity: seen ? void 0 : 0, ...style },
        ...p
      },
      children
    );
  }
  function greatCircle(a, b, n = 64) {
    const toR = (d) => d * Math.PI / 180;
    const toD = (r) => r * 180 / Math.PI;
    const lng1 = toR(a[0]), lat1 = toR(a[1]);
    const lng2 = toR(b[0]), lat2 = toR(b[1]);
    const cosOm = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
    const om = Math.acos(Math.max(-1, Math.min(1, cosOm)));
    if (Math.abs(om) < 1e-6) return [[a[0], a[1]], [b[0], b[1]]];
    const sinOm = Math.sin(om);
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const A = Math.sin((1 - t) * om) / sinOm;
      const B = Math.sin(t * om) / sinOm;
      const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
      const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
      const z = A * Math.sin(lat1) + B * Math.sin(lat2);
      const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
      const lng = Math.atan2(y, x);
      out.push([toD(lng), toD(lat)]);
    }
    return out;
  }
  var SourceBadge = ({ kind, label }) => {
    const live = kind === "live";
    return /* @__PURE__ */ React.createElement("span", { style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontFamily: SANS,
      fontSize: FS.xs,
      fontWeight: 600,
      letterSpacing: ".1em",
      textTransform: "uppercase",
      color: live ? GREEN : VIOLET,
      background: live ? alpha(GREEN, 0.1) : alpha(VIOLET, 0.12),
      border: `1px solid ${live ? alpha(GREEN, 0.32) : alpha(VIOLET, 0.32)}`,
      padding: "2px 7px",
      borderRadius: 999,
      lineHeight: 1.2
    } }, /* @__PURE__ */ React.createElement("span", { style: { width: 5, height: 5, borderRadius: "50%", background: live ? GREEN : VIOLET } }), label || (live ? "Live" : "Scenario"));
  };
  var SEV_GLYPH = { EXTREME: "\u25B2", CRITICAL: "\u25C6", HIGH: "\u25A0", ELEVATED: "\u25CF", MODERATE: "\u25CB", LOW: "\xB7" };
  var SEV_COLOR = { EXTREME: DANGER, CRITICAL, HIGH: AMBER, ELEVATED, MODERATE: BLUE, LOW: GREEN };
  var ALIGNMENT_LABEL = { adversary: "Threat", ally: "Exposure", partner: "Exposure", neutral: "Posture" };
  var ALIGNMENT_COLOR = { adversary: DANGER, ally: BLUE, partner: AMBER, neutral: TEXT_MID };
  var barLabel = (c) => ALIGNMENT_LABEL[c?.alignment] || "Risk";
  var barLabelColor = (c) => ALIGNMENT_COLOR[c?.alignment] || TEXT_MID;
  var SeverityPill = ({ level, size = 11 }) => {
    const c = SEV_COLOR[level] || TEXT_MID;
    return /* @__PURE__ */ React.createElement("span", { style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontFamily: SANS,
      fontSize: size,
      fontWeight: 600,
      letterSpacing: ".06em",
      color: c,
      background: alpha(c, 0.1),
      border: `1px solid ${alpha(c, 0.23)}`,
      padding: "2px 8px",
      borderRadius: 999,
      lineHeight: 1.2
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: size - 1 } }, SEV_GLYPH[level] || "\xB7"), level);
  };
  function daysSince(dateStr) {
    return Math.floor((NOW - new Date(dateStr)) / 864e5) + 1;
  }
  function daysBehind(iso) {
    if (!iso) return null;
    const then = new Date(iso);
    if (isNaN(then.getTime())) return null;
    return Math.floor((NOW - then) / 864e5);
  }
  function StaleChip({ asOf, floor = 7 }) {
    const n = daysBehind(asOf);
    if (n == null || n <= floor) return null;
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        title: `Last verified update ${asOf} \u2014 shown honestly rather than silently carried forward.`,
        style: {
          display: "inline-block",
          marginLeft: 6,
          verticalAlign: "middle",
          fontSize: FS.xs,
          fontWeight: 700,
          color: TEXT_DIM,
          background: "transparent",
          border: `1px solid ${BORDER}`,
          padding: "1px 5px",
          borderRadius: 4,
          letterSpacing: ".08em",
          lineHeight: 1.3,
          cursor: "help"
        }
      },
      "STALE \xB7 ",
      n,
      "d"
    );
  }
  function BasisChip({ basis }) {
    if (!basis) return null;
    const FAMILY = {
      "identified": { color: GREEN, bg: alpha(GREEN, 0.14), bd: alpha(GREEN, 0.35) },
      "confirmed": { color: GREEN, bg: alpha(GREEN, 0.14), bd: alpha(GREEN, 0.35) },
      "reported-aggregate": { color: AMBER, bg: alpha(AMBER, 0.14), bd: alpha(AMBER, 0.35) },
      "disputed": { color: DANGER, bg: "transparent", bd: alpha(DANGER, 0.45) },
      "editorial-estimate": { color: TEXT_DIM, bg: "transparent", bd: BORDER }
    };
    const s = FAMILY[basis] || { color: TEXT_DIM, bg: "transparent", bd: BORDER };
    return /* @__PURE__ */ React.createElement("span", { style: {
      display: "inline-block",
      marginLeft: 6,
      verticalAlign: "middle",
      fontSize: FS.xs,
      fontWeight: 700,
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.bd}`,
      padding: "1px 5px",
      borderRadius: 4,
      letterSpacing: ".08em",
      lineHeight: 1.3,
      textTransform: "uppercase",
      whiteSpace: "nowrap"
    } }, String(basis).replace(/-/g, " "));
  }
  function makeAliasMatcher(aliases) {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const res = aliases.map((a) => new RegExp(`\\b${esc(a)}\\b`, "i"));
    return (text) => !!text && res.some((re) => re.test(text));
  }
  function getCountryDossier(country) {
    if (!country) return null;
    const aliases = COUNTRY_KEYS[country]?.aliases || [country];
    const matchAny = makeAliasMatcher(aliases);
    const risk = RISK_COUNTRIES.find((r) => r.name === country);
    const chess = CHESS_PLAYERS.find((p) => p.name === country || country === "USA" && p.name === "United States" || country === "Lebanon" && p.name.includes("Lebanon"));
    const newsHits = INIT_NEWS.filter((n) => matchAny(n.h)).slice(0, 6);
    const timelineHits = [...TIMELINE].reverse().filter((t) => matchAny(t.desc)).slice(0, 8);
    return { country, aliases, risk, chess, newsHits, timelineHits };
  }
  function CountryDrawer({ country, onClose, onNavigate }) {
    const scrollRef = useRef(null);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
      function onKey(e) {
        if (e.key === "Escape") onClose();
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);
    if (!country) return null;
    const d = getCountryDossier(country);
    if (!d) return null;
    const sevColor = (s) => ({ extreme: DANGER, critical: CRITICAL, high: AMBER })[s] || TEXT_MID;
    const sevLabel = (s) => ({ extreme: "EXTREME", critical: "CRITICAL", high: "HIGH" })[s] || s.toUpperCase();
    const riskCol = d.risk ? SEV_COLOR[d.risk.level] || TEXT_MID : TEXT_MID;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "drawer-overlay",
        onClick: onClose,
        style: { position: "fixed", inset: 0, background: SCRIM, zIndex: 200, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }
      }
    ), /* @__PURE__ */ React.createElement(
      "aside",
      {
        className: "drawer-panel",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": `${country} dossier`,
        style: {
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(560px, 92vw)",
          zIndex: 201,
          background: BG,
          borderLeft: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "var(--shadow-drawer)"
        }
      },
      /* @__PURE__ */ React.createElement("header", { style: {
        padding: "20px 24px",
        borderBottom: scrolled ? `1px solid ${BORDER}` : `1px solid transparent`,
        background: scrolled ? "var(--header-bg)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
        transition: "background-color .2s ease, border-color .2s ease",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexShrink: 0
      } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 32, lineHeight: 1 } }, d.risk?.flag || "\u{1F310}"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 22, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.015em", lineHeight: 1.1, fontVariationSettings: "'opsz' 22" } }, country), d.risk && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", marginTop: 6 } }, /* @__PURE__ */ React.createElement(SeverityInline, { level: d.risk.level, size: 9.5 }), /* @__PURE__ */ React.createElement("span", { style: { width: 3, height: 3, borderRadius: "50%", background: TEXT_DIM } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, fontWeight: 600, color: riskCol, fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" } }, barLabel(d.risk), " ", d.risk.risk))), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          "aria-label": "Close dossier",
          className: "pressable",
          style: {
            width: 36,
            height: 36,
            borderRadius: 8,
            background: RAISE_1,
            border: `1px solid ${BORDER}`,
            color: TEXT_MID,
            fontSize: 14,
            lineHeight: 1,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background .15s ease, color .15s ease, border-color .15s ease"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = RAISE_2;
            e.currentTarget.style.color = TEXT_HI;
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = RAISE_1;
            e.currentTarget.style.color = TEXT_MID;
          }
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 16 })
      )),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          ref: scrollRef,
          onScroll: (e) => setScrolled(e.currentTarget.scrollTop > 4),
          style: { flex: 1, overflowY: "auto", padding: "20px 24px 32px", display: "flex", flexDirection: "column", gap: 22 }
        },
        d.risk && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 8 }, "Snapshot"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: TEXT_BODY, lineHeight: 1.65, whiteSpace: "pre-wrap" } }, d.risk.details || d.risk.note)),
        country === "India" && (() => {
          const indiaAliases = COUNTRY_KEYS["India"]?.aliases || ["India"];
          const matchIndia = makeAliasMatcher(indiaAliases);
          const eventsRaw = window.__DATA__.events || [];
          const fourteenDaysAgo = new Date(NOW.getTime() - 14 * 864e5).toISOString().slice(0, 10);
          const relevant = eventsRaw.filter((e) => e.event_date >= fourteenDaysAgo && matchIndia(e.headline));
          let bricsCount = 0, alliesCount = 0;
          for (const e of relevant) {
            const lenses = Array.isArray(e.lenses) ? e.lenses : [];
            if (lenses.includes("brics-bloc") || lenses.includes("crink")) bricsCount++;
            if (lenses.includes("allies-cohesion")) alliesCount++;
          }
          const hasLensData = bricsCount + alliesCount > 0;
          return /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 8, color: DANGER }, "India ambivalence \u2014 BRICS+ \u2227 Quad"), /* @__PURE__ */ React.createElement(Card, { style: { padding: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: TEXT_BODY, lineHeight: 1.55, marginBottom: hasLensData ? 12 : 0 } }, "India sits in both BRICS+ (since founding) and the Quad (US-Japan-India-Australia). The dashboard tracks BRICS-aligned and Quad/US-aligned activity in separate lenses; when both occur in the same window, the event is tagged ", /* @__PURE__ */ React.createElement("code", { style: { background: RAISE_2, padding: "1px 5px", borderRadius: 3, fontSize: 11 } }, "signal:india-ambivalence"), "."), hasLensData ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(140px, 160px) 1fr 32px", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, fontWeight: 600, color: TEXT_BODY, letterSpacing: ".04em", textTransform: "uppercase" } }, "BRICS-aligned (14d)"), /* @__PURE__ */ React.createElement("div", { style: { height: 6, background: BORDER, borderRadius: 999, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${Math.min(100, bricsCount * 20)}%`, height: "100%", background: "var(--c-brics)", borderRadius: 999 } })), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, fontWeight: 600, color: BRICS_TEXT, fontVariantNumeric: "tabular-nums", textAlign: "right" } }, bricsCount)), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "minmax(140px, 160px) 1fr 32px", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, fontWeight: 600, color: TEXT_BODY, letterSpacing: ".04em", textTransform: "uppercase" } }, "Quad/US-aligned (14d)"), /* @__PURE__ */ React.createElement("div", { style: { height: 6, background: BORDER, borderRadius: 999, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${Math.min(100, alliesCount * 20)}%`, height: "100%", background: BLUE, borderRadius: 999 } })), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, fontWeight: 600, color: BLUE, fontVariantNumeric: "tabular-nums", textAlign: "right" } }, alliesCount))) : /* @__PURE__ */ React.createElement("span", { style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 6,
            fontSize: FS.xs,
            fontWeight: 700,
            color: DANGER,
            background: alpha(DANGER, 0.1),
            border: `1px solid ${alpha(DANGER, 0.25)}`,
            padding: "3px 8px",
            borderRadius: 999,
            letterSpacing: ".10em",
            textTransform: "uppercase"
          } }, "AMBIVALENT \u2014 awaiting lens-tagged events")));
        })(),
        d.chess && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 8, color: d.chess.color }, "Current Move"), /* @__PURE__ */ React.createElement(Card, { style: { borderLeft: `3px solid ${d.chess.color}`, padding: 16 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 4 }, "Objective"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, lineHeight: 1.6, marginBottom: 12 } }, d.chess.goal), /* @__PURE__ */ React.createElement(Eyebrow, { mb: 4, color: d.chess.color }, "Move"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, lineHeight: 1.6, whiteSpace: "pre-wrap" } }, d.chess.details || d.chess.move))),
        d.newsHits.length > 0 && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0 }, "Today's news ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_MID, marginLeft: 4 } }, d.newsHits.length)), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => onNavigate("feed", { country }),
            style: { background: "none", border: "none", color: BLUE, fontSize: 11, cursor: "pointer", fontWeight: 600, letterSpacing: ".04em" }
          },
          "See all in Feed \u2192"
        )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, d.newsHits.map((n, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 12, alignItems: "baseline", paddingBottom: 10, borderBottom: i < d.newsHits.length - 1 ? `1px solid ${BORDER}` : "none" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: AMBER, fontWeight: 600, fontVariantNumeric: "tabular-nums", flexShrink: 0, width: 42 } }, n.t), /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.xs, color: TEXT_DIM, fontWeight: 700, letterSpacing: ".10em", flexShrink: 0, width: 62, textTransform: "uppercase" } }, n.s), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_HI, lineHeight: 1.55 } }, n.h))))),
        d.timelineHits.length > 0 && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0 }, "Recent timeline ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_MID, marginLeft: 4 } }, d.timelineHits.length)), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => onNavigate("feed", { country, view: "timeline" }),
            style: { background: "none", border: "none", color: BLUE, fontSize: 11, cursor: "pointer", fontWeight: 600, letterSpacing: ".04em" }
          },
          "Full timeline \u2192"
        )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, d.timelineHits.map((t, i) => {
          const col = sevColor(t.sev);
          return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 12, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, fontWeight: 500, fontVariantNumeric: "tabular-nums", flexShrink: 0, width: 46, paddingTop: 5, letterSpacing: ".02em" } }, t.date), /* @__PURE__ */ React.createElement("span", { style: { width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0, marginTop: 7, boxShadow: `0 0 0 3px var(--bg), 0 0 0 4px ${alpha(col, 0.27)}` } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, lineHeight: 1.6 } }, t.desc));
        }))),
        !d.risk && !d.chess && d.newsHits.length === 0 && d.timelineHits.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_MID, padding: 32, textAlign: "center" } }, "No structured data on file for ", country, ".")
      )
    ));
  }
  function RelativeTime({ since, style }) {
    const [, setTick] = useState(0);
    useEffect(() => {
      const id = setInterval(() => setTick((t2) => t2 + 1), 3e4);
      return () => clearInterval(id);
    }, []);
    if (!since) return null;
    const t = since instanceof Date ? since : new Date(since);
    const diff = Math.max(0, Date.now() - t.getTime());
    const sec = Math.floor(diff / 1e3);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    let label;
    if (sec < 30) label = "just now";
    else if (min < 1) label = `${sec}s ago`;
    else if (min < 60) label = `${min}m ago`;
    else if (hr < 24) label = `${hr}h ago`;
    else if (day < 2) label = "yesterday";
    else label = `${day}d ago`;
    return /* @__PURE__ */ React.createElement("span", { style }, label);
  }
  function Tooltip({ trigger, children, label, side = "bottom", wrapStyle, wrapClassName }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ dx: 0, side });
    const wrapRef = useRef(null);
    const popRef = useRef(null);
    useLayoutEffect(() => {
      if (!open) return;
      const place = () => {
        const pop = popRef.current, wrap = wrapRef.current;
        if (!pop || !wrap) return;
        const gutter = 12;
        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;
        pop.style.transform = "translateX(-50%)";
        const r = pop.getBoundingClientRect();
        let dx = 0;
        if (r.right > vw - gutter) dx -= r.right - (vw - gutter);
        if (r.left + dx < gutter) dx += gutter - (r.left + dx);
        const w = wrap.getBoundingClientRect();
        const need = r.height + 16;
        let s = side;
        if (side === "bottom" && vh - w.bottom < need && w.top > need) s = "top";
        if (side === "top" && w.top < need && vh - w.bottom > need) s = "bottom";
        setPos({ dx, side: s });
      };
      place();
      window.addEventListener("resize", place);
      return () => window.removeEventListener("resize", place);
    }, [open, side]);
    useEffect(() => {
      if (!open) return;
      const onDown = (e) => {
        if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
      };
      const onKey = (e) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("pointerdown", onDown);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("pointerdown", onDown);
        document.removeEventListener("keydown", onKey);
      };
    }, [open]);
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        ref: wrapRef,
        className: wrapClassName,
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
        onClick: (e) => {
          e.stopPropagation();
          setOpen(true);
        },
        tabIndex: 0,
        "aria-label": label,
        style: { position: "relative", ...wrapStyle }
      },
      trigger,
      open && /* @__PURE__ */ React.createElement(
        "span",
        {
          ref: popRef,
          role: "tooltip",
          style: {
            position: "absolute",
            top: pos.side === "bottom" ? "calc(100% + 8px)" : "auto",
            bottom: pos.side === "top" ? "calc(100% + 8px)" : "auto",
            left: "50%",
            transform: `translateX(-50%) translateX(${pos.dx}px)`,
            zIndex: 300,
            padding: "8px 11px",
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            boxShadow: "var(--shadow-card)",
            fontSize: 11,
            fontWeight: 450,
            color: TEXT_BODY,
            lineHeight: 1.5,
            width: "max-content",
            maxWidth: "min(260px, calc(100vw - 24px))",
            boxSizing: "border-box",
            textAlign: "left",
            letterSpacing: 0,
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            cursor: "auto"
          }
        },
        children
      )
    );
  }
  function InfoTip({ children, label, side = "bottom" }) {
    return /* @__PURE__ */ React.createElement(
      Tooltip,
      {
        side,
        label: typeof children === "string" ? children : label || "More info",
        wrapStyle: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: `1px solid ${BORDER}`,
          color: TEXT_DIM,
          fontSize: FS.xs,
          fontWeight: 700,
          fontFamily: SANS,
          lineHeight: 1,
          cursor: "help",
          marginLeft: 6,
          verticalAlign: "middle"
        },
        trigger: "i"
      },
      children
    );
  }
  function CommandPalette({ open, onClose, setTab, setThemePref, themePref, doRefresh, openCountry, openBriefing }) {
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const items = useMemo(() => {
      const out = [];
      for (const t of TABS) {
        out.push({ kind: "tab", id: `tab-${t}`, label: TAB_LABELS[t], hint: TAB_HINTS[t], action: () => setTab(t), accent: BLUE });
      }
      for (const c of RISK_COUNTRIES) {
        out.push({ kind: "country", id: `country-${c.name}`, label: c.name, hint: `${barLabel(c)} ${c.risk} \xB7 ${c.level}`, flag: c.flag, action: () => openCountry(c.name), accent: SEV_COLOR[c.level] });
      }
      out.push({ kind: "action", id: "action-briefing", label: "Briefing Mode", hint: "Full-bleed presenter view (press B)", action: () => openBriefing && openBriefing(), accent: DANGER });
      out.push({ kind: "action", id: "action-refresh", label: "Refresh data", hint: "Fetch live markets and news", action: doRefresh, accent: AMBER });
      out.push({ kind: "action", id: "action-theme-dark", label: "Theme: Dark", hint: "Set dark mode", action: () => setThemePref("dark"), accent: VIOLET });
      out.push({ kind: "action", id: "action-theme-light", label: "Theme: Light", hint: "Set light mode", action: () => setThemePref("light"), accent: VIOLET });
      return out;
    }, [setTab, setThemePref, doRefresh, openCountry, openBriefing]);
    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return items.slice(0, 16);
      const scored = [];
      for (const it of items) {
        const haystack = (it.label + " " + (it.hint || "")).toLowerCase();
        const idx = haystack.indexOf(q);
        if (idx === -1) continue;
        let score = 100 - idx;
        if (it.label.toLowerCase().startsWith(q)) score += 80;
        if (it.label.toLowerCase().includes(" " + q)) score += 40;
        scored.push({ ...it, score });
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 16);
    }, [items, query]);
    useEffect(() => {
      if (open) {
        setQuery("");
        setActive(0);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }, [open]);
    useEffect(() => {
      if (!open) return;
      const onKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActive((a) => Math.min(filtered.length - 1, a + 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActive((a) => Math.max(0, a - 1));
        } else if (e.key === "Enter") {
          e.preventDefault();
          const it = filtered[active];
          if (it) {
            it.action();
            onClose();
          }
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [open, filtered, active, onClose]);
    useEffect(() => {
      if (!open) return;
      const el = listRef.current?.querySelector(`[data-cmd-idx="${active}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }, [active, open]);
    if (!open) return null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "drawer-overlay",
        onClick: onClose,
        style: { position: "fixed", inset: 0, background: SCRIM, zIndex: 300, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }
      }
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "drawer-panel",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Command palette",
        style: {
          position: "fixed",
          top: "14vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(560px, 92vw)",
          maxHeight: "68vh",
          zIndex: 301,
          background: SURFACE,
          border: `1px solid var(--border-strong)`,
          borderRadius: 14,
          boxShadow: "var(--shadow-card-hover)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${BORDER}` } }, /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_MID } }, /* @__PURE__ */ React.createElement(Icon, { name: "search", size: 16 })), /* @__PURE__ */ React.createElement(
        "input",
        {
          ref: inputRef,
          type: "text",
          value: query,
          onChange: (e) => {
            setQuery(e.target.value);
            setActive(0);
          },
          placeholder: "Search countries, tabs, actions\u2026",
          "aria-autocomplete": "list",
          "aria-controls": "cmd-list",
          style: {
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: SANS,
            fontSize: 15,
            color: TEXT_HI,
            fontWeight: 450
          }
        }
      ), /* @__PURE__ */ React.createElement("kbd", { style: { fontFamily: MONO, fontSize: FS.xs, color: TEXT_DIM, padding: "2px 6px", borderRadius: 4, background: RAISE_2, border: `1px solid ${BORDER}` } }, "Esc")),
      /* @__PURE__ */ React.createElement("div", { ref: listRef, id: "cmd-list", role: "listbox", style: { flex: 1, overflowY: "auto", padding: 6 } }, filtered.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "24px 16px", textAlign: "center", color: TEXT_MID, fontSize: 13 } }, "No matches."), filtered.map((it, i) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: it.id,
          "data-cmd-idx": i,
          role: "option",
          "aria-selected": i === active,
          onMouseEnter: () => setActive(i),
          onClick: () => {
            it.action();
            onClose();
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 8,
            background: i === active ? alpha(BLUE, 0.11) : "transparent",
            cursor: "pointer",
            fontFamily: SANS
          }
        },
        /* @__PURE__ */ React.createElement("span", { style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          fontSize: 14,
          flexShrink: 0,
          color: it.accent || TEXT_MID,
          background: i === active ? alpha(it.accent || BLUE, 0.13) : RAISE_1,
          borderRadius: 6,
          border: `1px solid ${BORDER}`
        } }, it.flag ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, it.flag) : it.kind === "tab" ? /* @__PURE__ */ React.createElement(Icon, { name: it.id.replace("tab-", ""), size: 13 }) : it.kind === "action" && it.id.includes("refresh") ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13 } }, "\u27F3") : it.kind === "action" && it.id.includes("theme") ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13 } }, "\u25D0") : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11 } }, "\u2022")),
        /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, fontWeight: 500, color: TEXT_HI, letterSpacing: "-.005em" } }, it.label), it.hint && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_MID, marginTop: 1 } }, it.hint)),
        /* @__PURE__ */ React.createElement("span", { style: {
          fontSize: FS.xs,
          fontWeight: 600,
          letterSpacing: ".10em",
          textTransform: "uppercase",
          color: TEXT_DIM,
          padding: "1px 6px",
          borderRadius: 4,
          background: RAISE_1,
          border: `1px solid ${BORDER}`
        } }, it.kind)
      ))),
      /* @__PURE__ */ React.createElement("div", { style: { borderTop: `1px solid ${BORDER}`, padding: "8px 14px", display: "flex", gap: 14, alignItems: "center", fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".02em", fontFamily: SANS } }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("kbd", { style: { fontFamily: MONO, fontSize: FS.xs, padding: "1px 5px", borderRadius: 3, background: RAISE_2, border: `1px solid ${BORDER}` } }, "\u2191\u2193"), " navigate"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("kbd", { style: { fontFamily: MONO, fontSize: FS.xs, padding: "1px 5px", borderRadius: 3, background: RAISE_2, border: `1px solid ${BORDER}` } }, "\u21B5"), " select"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("kbd", { style: { fontFamily: MONO, fontSize: FS.xs, padding: "1px 5px", borderRadius: 3, background: RAISE_2, border: `1px solid ${BORDER}` } }, "esc"), " close"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_MID } }, filtered.length, " ", filtered.length === 1 ? "match" : "matches"))
    ));
  }
  function resolveTheme(pref) {
    return pref === "light" ? "light" : "dark";
  }
  function applyTheme(pref) {
    document.documentElement.setAttribute("data-theme", resolveTheme(pref));
  }
  function ThemeToggle({ pref, onChange }) {
    const resolved = resolveTheme(pref);
    const next = resolved === "dark" ? "light" : "dark";
    const label = resolved === "dark" ? "Dark" : "Light";
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onChange(next),
        title: `Theme: ${label} \u2014 click for ${next}`,
        "aria-label": `Toggle theme. Current: ${label}`,
        className: "theme-toggle-btn",
        style: {
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".02em",
          color: TEXT_BODY,
          background: RAISE_1,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: "7px 10px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          transition: "background .15s ease, color .15s ease, border-color .15s ease"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = RAISE_2;
          e.currentTarget.style.color = TEXT_HI;
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = RAISE_1;
          e.currentTarget.style.color = TEXT_BODY;
        }
      },
      /* @__PURE__ */ React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, resolved === "dark" ? /* @__PURE__ */ React.createElement("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "4" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" }))),
      /* @__PURE__ */ React.createElement("span", { className: "btn-label-desktop", style: { minWidth: 48, textAlign: "left" } }, label)
    );
  }
  function FilterChip({ active, onClick, color = BLUE, children }) {
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick,
        className: "filter-chip",
        style: {
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: ".06em",
          color: active ? "#fff" : TEXT_BODY,
          background: active ? color : RAISE_1,
          border: `1px solid ${active ? color : RAISE_4}`,
          padding: "5px 11px",
          borderRadius: 999,
          lineHeight: 1.2,
          textTransform: "uppercase"
        }
      },
      children
    );
  }
  function MarketBar({ mkt, ww3, tick = 0 }) {
    const lvBTC = isLive(mkt, "BTC");
    const lvETH = isLive(mkt, "ETH");
    const lvSPX = isLive(mkt, "SPX");
    const lvDOW = isLive(mkt, "DOW");
    const lvNDX = isLive(mkt, "NDX");
    const lvGOLD = isLive(mkt, "GOLD");
    const lvWTI = isLive(mkt, "WTI");
    const lvBRENT = isLive(mkt, "BRENT");
    const chips = [
      { l: "BTC", v: lvBTC ? `$${fmt.compact(Math.round(mkt.BTC.price))}` : null, c: lvBTC ? mkt.BTC.chg : null, sym: "BTC" },
      { l: "ETH", v: lvETH ? `$${fmt.compact(Math.round(mkt.ETH.price))}` : null, c: lvETH ? mkt.ETH.chg : null, sym: "ETH" },
      { l: "S&P 500", v: lvSPX ? fmt.num(Math.round(mkt.SPX.price)) : null, c: lvSPX ? mkt.SPX.chg : null, sym: "SPX" },
      { l: "DOW", v: lvDOW ? fmt.compact(Math.round(mkt.DOW.price)) : null, c: lvDOW ? mkt.DOW.chg : null, sym: "DOW" },
      { l: "NASDAQ", v: lvNDX ? fmt.num(Math.round(mkt.NDX.price)) : null, c: lvNDX ? mkt.NDX.chg : null, sym: "NDX" },
      { l: "GOLD", v: lvGOLD ? `$${fmt.compact(Math.round(mkt.GOLD.price))}` : null, c: lvGOLD ? mkt.GOLD.chg : null, sym: "GOLD" },
      { l: "WTI", v: lvWTI ? fmt.money(mkt.WTI.price) : null, c: lvWTI ? mkt.WTI.chg : null, sym: "WTI" },
      { l: "BRENT", v: lvBRENT ? fmt.money(mkt.BRENT.price) : null, c: lvBRENT ? mkt.BRENT.chg : null, sym: "BRENT" },
      { l: "HORMUZ", v: HORMUZ_STATUS ? HORMUZ_STATUS.label : "\u2014", c: null, hi: AMBER },
      { l: "WW3%", v: `${ww3}%`, c: null, hi: ww3 > 60 ? DANGER : ww3 > 40 ? AMBER : GREEN }
    ];
    const prevRef = useRef({});
    const pulseSet = useRef({});
    for (const ch of chips) {
      if (prevRef.current[ch.l] !== void 0 && prevRef.current[ch.l] !== ch.v) {
        pulseSet.current[ch.l] = Date.now();
      }
      prevRef.current[ch.l] = ch.v;
    }
    const isMobile = useIsMobile(900);
    const isTablet = useIsMobile(1280) && !isMobile;
    const rotate = isMobile || isTablet;
    const reduce = useReducedMotion();
    const GROUP_SIZE = isMobile ? 3 : isTablet ? 7 : chips.length;
    const start = rotate ? tick * GROUP_SIZE % chips.length : 0;
    const tickKey = tick;
    const visibleChips = rotate ? Array.from({ length: GROUP_SIZE }, (_, i) => chips[(start + i) % chips.length]) : chips;
    return /* @__PURE__ */ React.createElement("div", { style: { position: "relative", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "ticker-fade-l", style: { display: "none" } }), /* @__PURE__ */ React.createElement("span", { className: "ticker-fade-r", style: { display: "none" } }), /* @__PURE__ */ React.createElement("div", { style: { height: 52, background: SURFACE, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", overflowX: "hidden", overflowY: "hidden", padding: "0 18px", whiteSpace: "nowrap", justifyContent: rotate ? "space-around" : "space-between" } }, visibleChips.map((ch, i) => {
      const recent = pulseSet.current[ch.l] && Date.now() - pulseSet.current[ch.l] < 1500;
      const isLoading = ch.v == null;
      const rotateClass = rotate && !reduce ? "brkr" : "choreographed";
      const animDelay = rotate ? "0ms" : `${280 + i * 45}ms`;
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: rotate ? `${tickKey}-${ch.l}` : ch.l }, /* @__PURE__ */ React.createElement("div", { className: rotateClass, style: { animationDelay: animDelay, display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "0 18px" : isTablet ? "0 12px" : "0 10px", flexShrink: rotate ? 0 : 1, minWidth: isMobile ? 80 : isTablet ? 70 : 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: SANS, fontSize: FS.xs, fontWeight: 600, color: TEXT_DIM, letterSpacing: ".10em", marginBottom: 3, textTransform: "uppercase" } }, ch.l), /* @__PURE__ */ React.createElement("div", { className: recent ? "value-pulse" : "", style: { display: "flex", alignItems: "baseline", gap: 6, padding: "1px 4px", margin: "-1px -4px", minHeight: 18 } }, isLoading ? /* @__PURE__ */ React.createElement(PriceSkeleton, { w: 58, h: 14 }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 14, fontWeight: 600, color: ch.hi || TEXT_HI, letterSpacing: "-.005em" } }, ch.v), ch.c !== null && /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, fontWeight: 500, color: ch.c >= 0 ? GREEN : DANGER } }, fmt.signedPct(ch.c))))), i < visibleChips.length - 1 && /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 24, background: RAISE_2, flexShrink: 0 } }));
    })));
  }
  function BreakingTicker({ headlines, tick = 0, onClick }) {
    const idx = headlines.length ? tick % headlines.length : 0;
    const key = tick;
    return /* @__PURE__ */ React.createElement("button", { type: "button", onClick, className: "choreographed", style: { animationDelay: "480ms", height: 38, background: alpha(DANGER, 0.08), border: "none", borderBottom: `1px solid ${alpha(DANGER, 0.22)}`, display: "flex", alignItems: "center", padding: "0 18px", gap: 14, overflow: "hidden", flexShrink: 0, width: "100%", textAlign: "left", font: "inherit", color: "inherit", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: DANGER, animation: "ping 1.4s ease infinite" } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, fontWeight: 600, color: DANGER, letterSpacing: ".12em" } }, "BREAKING")), /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 18, background: alpha(DANGER, 0.25) } }), /* @__PURE__ */ React.createElement("div", { key, className: "brkr", style: { fontSize: 13, color: TEXT_HI, fontFamily: SANS, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, headlines[idx]), /* @__PURE__ */ React.createElement("div", { style: { flexShrink: 0, fontFamily: SANS, fontSize: 11, color: TEXT_DIM, fontVariantNumeric: "tabular-nums" } }, idx + 1, "/", headlines.length));
  }
  var TABS = ["overview", "feed", "actors", "economy", "analysis", "outlook"];
  var TAB_LABELS = { overview: "Overview", feed: "Feed", actors: "Actors", economy: "Economy", analysis: "Analysis", outlook: "Outlook" };
  var TAB_HINTS = { overview: "Situation report", feed: "News + timeline", actors: "Players, theaters & moves", economy: "Markets + gas", analysis: "AI strategy", outlook: "Forecasts + track record" };
  var Icon = ({ name, size = 16, color = "currentColor" }) => {
    const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };
    switch (name) {
      case "overview":
        return /* @__PURE__ */ React.createElement("svg", { ...props }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "7", height: "9", rx: "1.5" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "3", width: "7", height: "5", rx: "1.5" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "12", width: "7", height: "9", rx: "1.5" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "16", width: "7", height: "5", rx: "1.5" }));
      case "theater":
        return /* @__PURE__ */ React.createElement("svg", { ...props }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ React.createElement("path", { d: "M3 12h18" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" }));
      case "feed":
        return /* @__PURE__ */ React.createElement("svg", { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M4 4h12a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V4z" }), /* @__PURE__ */ React.createElement("path", { d: "M8 8h6M8 12h6M8 16h4" }));
      case "actors":
        return /* @__PURE__ */ React.createElement("svg", { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M8 22h8M9 22v-4h6v4M12 4v3M9 7h6M7 18l1-7h8l1 7M11 11l-1-4M13 11l1-4" }));
      case "economy":
        return /* @__PURE__ */ React.createElement("svg", { ...props }, /* @__PURE__ */ React.createElement("polyline", { points: "3 17 9 11 13 15 21 7" }), /* @__PURE__ */ React.createElement("polyline", { points: "14 7 21 7 21 14" }));
      case "analysis":
        return /* @__PURE__ */ React.createElement("svg", { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M12 3 13.5 8.5 19 10 13.5 11.5 12 17 10.5 11.5 5 10 10.5 8.5z" }), /* @__PURE__ */ React.createElement("path", { d: "M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z", opacity: ".7" }));
      case "outlook":
        return /* @__PURE__ */ React.createElement("svg", { ...props }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3.5" }), /* @__PURE__ */ React.createElement("path", { d: "M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" }));
      case "filter":
        return /* @__PURE__ */ React.createElement("svg", { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M3 5h18M6 12h12M10 19h4" }));
      case "search":
        return /* @__PURE__ */ React.createElement("svg", { ...props }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "7" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.3-4.3" }));
      case "close":
        return /* @__PURE__ */ React.createElement("svg", { ...props }, /* @__PURE__ */ React.createElement("path", { d: "M18 6 6 18M6 6l12 12" }));
      default:
        return null;
    }
  };
  function sourceColor(state) {
    if (state === "ok") return GREEN;
    if (state === "fail") return DANGER;
    if (state === "loading") return AMBER;
    return TEXT_DIM;
  }
  function sourceLabel(state) {
    if (state === "ok") return "live";
    if (state === "fail") return "failed";
    if (state === "loading") return "loading\u2026";
    return "idle";
  }
  var FRESHNESS_SOURCES = [
    { l: "CoinGecko", k: "crypto" },
    { l: "Yahoo Finance", k: "markets" },
    { l: "AAA Fuel", k: "gas" },
    { l: "GDELT News", k: "news" }
  ];
  function FreshnessIndicator({ sources, lastRefreshAt, refreshErr }) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (!open) return;
      function onDown(e) {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      }
      document.addEventListener("mousedown", onDown);
      return () => document.removeEventListener("mousedown", onDown);
    }, [open]);
    const statuses = FRESHNESS_SOURCES.map((s) => sources && sources[s.k] || "idle");
    const anyFail = statuses.some((s) => s === "fail");
    const allFail = statuses.every((s) => s === "fail" || s === "idle");
    const minsAgo = lastRefreshAt ? Math.floor((Date.now() - lastRefreshAt.getTime()) / 6e4) : 999;
    const isStale = minsAgo > 15;
    const aggColor = allFail || isStale ? DANGER : anyFail ? AMBER : GREEN;
    const ageText = minsAgo > 998 ? "\u2014" : minsAgo < 1 ? "just now" : `${minsAgo}m ago`;
    return React.createElement(
      "div",
      { ref, style: { position: "relative" } },
      React.createElement(
        "button",
        {
          onClick: () => setOpen((v) => !v),
          title: "Data freshness \u2014 click for source details",
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            background: open ? RAISE_2 : RAISE_1,
            border: `1px solid ${open ? alpha(aggColor, 0.5) : BORDER}`,
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: SANS
          }
        },
        React.createElement("span", { style: {
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: aggColor,
          flexShrink: 0,
          boxShadow: `0 0 0 2px ${alpha(aggColor, 0.13)}, 0 0 8px ${alpha(aggColor, 0.4)}`,
          animation: aggColor !== GREEN ? "ping 1.6s ease infinite" : "none"
        } }),
        React.createElement(
          M,
          { style: { fontSize: FS.xs, color: TEXT_BODY, fontWeight: 500, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" } },
          "Updated ",
          ageText
        ),
        refreshErr && React.createElement(M, { style: { fontSize: FS.xs, color: AMBER } }, "\u26A0")
      ),
      open && React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: "12px 14px",
            zIndex: 200,
            minWidth: 220,
            boxShadow: `0 8px 24px rgba(0,0,0,.45)`
          }
        },
        React.createElement(Eyebrow, { mb: 8 }, "Live Sources"),
        React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 8 } },
          FRESHNESS_SOURCES.map((s) => {
            const st = sources && sources[s.k] || "idle";
            const col = sourceColor(st);
            return React.createElement(
              "div",
              { key: s.k, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: TEXT_BODY } },
              React.createElement("span", { style: {
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: col,
                flexShrink: 0,
                boxShadow: st === "idle" ? "none" : `0 0 0 2px ${alpha(col, 0.13)}, 0 0 8px ${alpha(col, 0.4)}`,
                animation: st === "loading" ? "ping 1.6s ease infinite" : "none"
              } }),
              React.createElement("span", { style: { flex: 1, fontFamily: SANS, fontWeight: 500 } }, s.l),
              st === "fail" ? React.createElement("span", { style: {
                fontSize: FS.xs,
                fontWeight: 600,
                letterSpacing: ".10em",
                textTransform: "uppercase",
                color: DANGER,
                padding: "1px 6px",
                borderRadius: 4,
                background: alpha(DANGER, 0.1),
                border: `1px solid ${alpha(DANGER, 0.28)}`
              } }, "stale") : React.createElement("span", { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".04em" } }, sourceLabel(st))
            );
          })
        ),
        refreshErr && React.createElement("div", { style: {
          marginTop: 10,
          paddingTop: 9,
          borderTop: `1px solid ${BORDER}`,
          fontSize: FS.xs,
          color: AMBER,
          lineHeight: 1.5
        } }, refreshErr),
        React.createElement(
          "div",
          { style: {
            marginTop: 10,
            paddingTop: 9,
            borderTop: `1px solid ${BORDER}`,
            fontSize: FS.xs,
            color: TEXT_DIM,
            fontVariantNumeric: "tabular-nums"
          } },
          "Last refresh: ",
          React.createElement(RelativeTime, { since: lastRefreshAt })
        )
      )
    );
  }
  function SideNav({ tab, setTab, sources }) {
    const tablistRef = useRef(null);
    const onKeyDown = (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      const idx = TABS.indexOf(tab);
      let next = idx;
      if (e.key === "ArrowDown") next = (idx + 1) % TABS.length;
      if (e.key === "ArrowUp") next = (idx - 1 + TABS.length) % TABS.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = TABS.length - 1;
      setTab(TABS[next]);
      requestAnimationFrame(() => {
        const btn = tablistRef.current?.querySelector(`button[data-tabkey="${TABS[next]}"]`);
        btn?.focus();
      });
    };
    return /* @__PURE__ */ React.createElement("aside", { className: "sidenav-desktop", style: {
      width: 232,
      flexShrink: 0,
      borderRight: `1px solid ${BORDER}`,
      background: BG,
      padding: "20px 14px",
      position: "sticky",
      top: 0,
      alignSelf: "flex-start",
      maxHeight: "calc(100vh)",
      overflowY: "auto",
      flexDirection: "column"
    } }, /* @__PURE__ */ React.createElement("div", { className: "choreographed", style: { animationDelay: "520ms", padding: "4px 12px 14px", fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600 } }, "Briefing"), /* @__PURE__ */ React.createElement(
      "nav",
      {
        ref: tablistRef,
        role: "tablist",
        "aria-orientation": "vertical",
        "aria-label": "Dashboard sections",
        onKeyDown,
        style: { display: "flex", flexDirection: "column", gap: 2 }
      },
      TABS.map((t, i) => {
        const active = t === tab;
        const isAnalysis = t === "analysis";
        const accent = isAnalysis ? VIOLET : BLUE;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: t,
            "data-tabkey": t,
            role: "tab",
            id: `tab-${t}`,
            "aria-selected": active,
            "aria-controls": `panel-${t}`,
            tabIndex: active ? 0 : -1,
            onClick: () => setTab(t),
            className: "navbtn choreographed",
            style: {
              animationDelay: `${580 + i * 50}ms`,
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "9px 12px",
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: active ? 600 : 500,
              color: active ? TEXT_HI : TEXT_BODY,
              background: active ? alpha(accent, 0.13) : "transparent",
              border: `1px solid ${active ? alpha(accent, 0.25) : "transparent"}`,
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              whiteSpace: "nowrap"
            }
          },
          /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", color: active ? accent : TEXT_MID } }, /* @__PURE__ */ React.createElement(Icon, { name: t, size: 17 })),
          /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, TAB_LABELS[t]),
          /* @__PURE__ */ React.createElement("kbd", { style: {
            fontFamily: MONO,
            fontSize: FS.xs,
            color: TEXT_DIM,
            padding: "1px 5px",
            borderRadius: 4,
            background: RAISE_2,
            border: `1px solid ${BORDER}`,
            opacity: active ? 1 : 0.55
          } }, i + 1)
        );
      })
    ), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, padding: "8px 12px", fontSize: FS.xs, color: TEXT_DIM, lineHeight: 1.5, letterSpacing: ".02em" } }, "\u2191/\u2193 or 1\u20136 to switch \xB7 Esc closes panels"));
  }
  function StatusBar({ sources, lastRefreshAt, ww3, tab, theme, onPaletteOpen, onBriefingOpen }) {
    const liveCount = Object.values(sources || {}).filter((v) => v === "ok").length;
    const totalCount = Object.keys(sources || {}).length || 3;
    const anyFail = Object.values(sources || {}).some((v) => v === "fail");
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        "aria-label": "Status bar",
        style: {
          position: "sticky",
          bottom: 0,
          zIndex: 90,
          height: 30,
          display: "flex",
          alignItems: "center",
          background: "var(--header-bg)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderTop: `1px solid ${BORDER}`,
          padding: "0 14px",
          gap: 14,
          fontFamily: SANS,
          fontSize: 11,
          color: TEXT_MID,
          letterSpacing: ".02em"
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 7 } }, /* @__PURE__ */ React.createElement("span", { style: {
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: anyFail ? AMBER : liveCount > 0 ? GREEN : TEXT_DIM,
        boxShadow: anyFail ? `0 0 6px ${alpha(AMBER, 0.53)}` : liveCount > 0 ? `0 0 6px ${alpha(GREEN, 0.53)}` : "none",
        animation: anyFail ? "none" : liveCount > 0 ? "ping 2.4s ease infinite" : "none"
      } }), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500 } }, liveCount, "/", totalCount, " live")),
      /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "\xB7"),
      /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(RelativeTime, { since: lastRefreshAt })),
      /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "\xB7"),
      /* @__PURE__ */ React.createElement("span", null, "WW3 ", /* @__PURE__ */ React.createElement(M, { style: { color: ww3 > 60 ? DANGER : ww3 > 40 ? AMBER : GREEN, fontWeight: 600 } }, ww3, "%")),
      /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "\xB7"),
      /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, TAB_LABELS[tab], " \xB7 ", theme),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onBriefingOpen,
          className: "pressable",
          title: "Enter Briefing Mode",
          style: {
            background: alpha(DANGER, 0.08),
            border: `1px solid ${alpha(DANGER, 0.32)}`,
            borderRadius: 6,
            cursor: "pointer",
            padding: "1px 8px",
            color: DANGER,
            fontFamily: SANS,
            fontSize: FS.xs,
            fontWeight: 600,
            letterSpacing: ".06em",
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = alpha(DANGER, 0.16);
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = alpha(DANGER, 0.08);
          }
        },
        /* @__PURE__ */ React.createElement("span", null, "BRIEFING"),
        /* @__PURE__ */ React.createElement("kbd", { style: { fontFamily: MONO, fontSize: FS.xs, color: "inherit", padding: "1px 4px", borderRadius: 3, background: alpha(DANGER, 0.12), border: `1px solid ${alpha(DANGER, 0.32)}` } }, "B")
      ),
      /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "\xB7"),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onPaletteOpen,
          className: "pressable",
          style: {
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: TEXT_MID,
            fontFamily: SANS,
            fontSize: 11,
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          },
          onMouseEnter: (e) => e.currentTarget.style.color = TEXT_HI,
          onMouseLeave: (e) => e.currentTarget.style.color = TEXT_MID
        },
        /* @__PURE__ */ React.createElement("kbd", { style: { fontFamily: MONO, fontSize: FS.xs, color: "inherit", padding: "1px 5px", borderRadius: 3, background: RAISE_2, border: `1px solid ${BORDER}` } }, "\u2318K"),
        /* @__PURE__ */ React.createElement("span", null, "command")
      ),
      /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "\xB7"),
      /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("kbd", { style: { fontFamily: MONO, fontSize: FS.xs, color: "inherit", padding: "1px 5px", borderRadius: 3, background: RAISE_2, border: `1px solid ${BORDER}` } }, "1\u20136"), " tabs")
    );
  }
  function BottomTabBar({ tab, setTab }) {
    return /* @__PURE__ */ React.createElement(
      "nav",
      {
        className: "tabbar-mobile",
        role: "tablist",
        "aria-label": "Dashboard sections (mobile)",
        style: {
          display: "none",
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          background: "var(--header-bg)",
          borderTop: `1px solid ${BORDER}`,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          padding: "6px 4px env(safe-area-inset-bottom, 8px)",
          justifyContent: "space-between"
        }
      },
      TABS.map((t) => {
        const active = t === tab;
        const isAnalysis = t === "analysis";
        const accent = isAnalysis ? VIOLET : BLUE;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: t,
            role: "tab",
            "aria-selected": active,
            "aria-controls": `panel-${t}`,
            onClick: () => setTab(t),
            style: {
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 2px",
              background: active ? alpha(accent, 0.12) : "transparent",
              borderRadius: 10,
              border: "none",
              color: active ? accent : TEXT_MID,
              boxShadow: active ? `0 0 16px ${alpha(accent, 0.55)}, inset 0 0 10px ${alpha(accent, 0.08)}` : "none",
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: FS.xs,
              fontWeight: 600,
              letterSpacing: ".04em",
              transition: "color .15s ease, background .15s ease, box-shadow .15s ease"
            }
          },
          /* @__PURE__ */ React.createElement(Icon, { name: t, size: 18 }),
          /* @__PURE__ */ React.createElement("span", null, TAB_LABELS[t])
        );
      })
    );
  }
  function linkifyCountries(text, openCountry) {
    if (!text || !openCountry) return text;
    const allAliases = [];
    for (const [country, def] of Object.entries(COUNTRY_KEYS)) {
      for (const a of def.aliases) allAliases.push({ country, alias: a });
    }
    allAliases.sort((a, b) => b.alias.length - a.alias.length);
    const escaped = allAliases.map((a) => a.alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
    const out = [];
    let last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) out.push(text.slice(last, m.index));
      const matched = m[0];
      const found = allAliases.find((a) => a.alias.toLowerCase() === matched.toLowerCase());
      if (found) {
        out.push(
          /* @__PURE__ */ React.createElement(
            "span",
            {
              key: `c-${m.index}`,
              className: "country-link",
              onClick: (e) => {
                e.stopPropagation();
                openCountry(found.country);
              },
              style: { color: "#c7d0ff", fontWeight: 500 }
            },
            matched
          )
        );
      } else {
        out.push(matched);
      }
      last = m.index + matched.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }
  var GLOSSARY = window.__DATA__ && window.__DATA__.glossary || [];
  function scrubCodes(s) {
    if (s === null || s === void 0) return "";
    return String(s).replace(/\b(FC|IND|GAP|PAT)-[0-9A-Za-z-]+\b/g, "").replace(/\(\s*[;,]?\s*/g, "(").replace(/\s+([.,;:)])/g, "$1").replace(/\(\s+/g, "(").replace(/\s{2,}/g, " ").trim();
  }
  var COUNTRY_MATCHER = (() => {
    const aliases = [];
    for (const [country, def] of Object.entries(COUNTRY_KEYS || {})) {
      for (const a of def.aliases || []) aliases.push({ country, alias: a });
    }
    if (!aliases.length) return null;
    aliases.sort((a, b) => b.alias.length - a.alias.length);
    const escaped = aliases.map((a) => a.alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
    const byAlias = /* @__PURE__ */ new Map();
    for (const a of aliases) {
      const k = a.alias.toLowerCase();
      if (!byAlias.has(k)) byAlias.set(k, a.country);
    }
    return { re, byAlias };
  })();
  var GLOSSARY_MATCHER = (() => {
    if (!GLOSSARY.length) return null;
    const entries = [];
    for (const g of GLOSSARY) {
      const aliases = g.aliases && g.aliases.length ? g.aliases : [g.term];
      for (const a of aliases) entries.push({ alias: a, entry: g });
    }
    entries.sort((a, b) => b.alias.length - a.alias.length);
    const escaped = entries.map((e) => e.alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "g");
    const byTerm = /* @__PURE__ */ new Map();
    for (const e of entries) {
      if (!byTerm.has(e.alias)) byTerm.set(e.alias, e.entry);
    }
    return { re, byTerm };
  })();
  function GlossaryTerm({ word, entry }) {
    return /* @__PURE__ */ React.createElement(
      Tooltip,
      {
        side: "bottom",
        wrapClassName: "glossary-term",
        label: `${entry.term}: ${entry.definition}`,
        trigger: word
      },
      entry.expansion && /* @__PURE__ */ React.createElement("span", { style: { display: "block", fontWeight: 700, color: TEXT_HI, marginBottom: 3 } }, entry.expansion),
      /* @__PURE__ */ React.createElement("span", { style: { display: "block" } }, entry.definition)
    );
  }
  function linkifyText(text, openCountry) {
    const scrubbed = scrubCodes(text);
    if (!scrubbed) return scrubbed;
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    let keyi = 0;
    const pushGlossary = (str) => {
      if (!GLOSSARY_MATCHER || !str) {
        if (str) out.push(str);
        return;
      }
      const { re: re2, byTerm } = GLOSSARY_MATCHER;
      re2.lastIndex = 0;
      let last2 = 0, m2;
      while ((m2 = re2.exec(str)) !== null) {
        const matched = m2[0];
        const entry = byTerm.get(matched);
        if (m2.index > last2) out.push(str.slice(last2, m2.index));
        if (entry && !seen.has(entry.term)) {
          seen.add(entry.term);
          out.push(/* @__PURE__ */ React.createElement(GlossaryTerm, { key: `g-${keyi++}`, word: matched, entry }));
        } else {
          out.push(matched);
        }
        last2 = m2.index + matched.length;
      }
      if (last2 < str.length) out.push(str.slice(last2));
    };
    if (!COUNTRY_MATCHER || !openCountry) {
      pushGlossary(scrubbed);
      return out;
    }
    const { re, byAlias } = COUNTRY_MATCHER;
    re.lastIndex = 0;
    let last = 0, m;
    while ((m = re.exec(scrubbed)) !== null) {
      const matched = m[0];
      const country = byAlias.get(matched.toLowerCase());
      if (m.index > last) pushGlossary(scrubbed.slice(last, m.index));
      if (country) {
        out.push(
          /* @__PURE__ */ React.createElement(
            "span",
            {
              key: `c-${keyi++}`,
              className: "country-link",
              onClick: (e) => {
                e.stopPropagation();
                openCountry(country);
              },
              style: { color: "#c7d0ff", fontWeight: 500 }
            },
            matched
          )
        );
      } else {
        pushGlossary(matched);
      }
      last = m.index + matched.length;
    }
    if (last < scrubbed.length) pushGlossary(scrubbed.slice(last));
    return out;
  }
  var AXIS_HELP = {
    kinetic: "How much actual fighting is happening right now \u2014 strikes, ground operations, blockades. Higher = more active combat.",
    greatpower: "How directly the major powers (US, China, Russia) are involved, rather than acting through proxies. Higher = more direct great-power entanglement.",
    wmd: "How elevated the nuclear / weapons-of-mass-destruction risk is \u2014 enrichment levels, posturing, doctrine. Higher = closer to WMD use.",
    alliance: "How fragmented the Western alliances are. This score is inverted: HIGHER means alliances are MORE divided and less unified (worse); lower means they're holding together."
  };
  function LeadCard({ lead, accent, accentText, arc, openCountry, showFull, setShowFull, setTab, dominant = false, delay = 950 }) {
    const at = accentText || accent;
    return /* @__PURE__ */ React.createElement(Card, { className: "choreographed lead-card", style: { animationDelay: `${delay}ms`, borderLeft: `3px solid ${accent}`, padding: "22px 26px", display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 7, height: 7, borderRadius: "50%", background: accent, animation: "ping 1.6s ease infinite", boxShadow: `0 0 0 2px ${alpha(accent, 0.13)}, 0 0 8px ${alpha(accent, 0.53)}` } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: at, letterSpacing: ".18em", fontWeight: 700, textTransform: "uppercase" } }, lead.kicker), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "scenario" }), dominant && /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.xs, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: at, background: alpha(accent, 0.12), border: `1px solid ${alpha(accent, 0.3)}`, padding: "2px 8px", borderRadius: 999, lineHeight: 1.2 } }, "Today's lead")), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".06em", fontVariantNumeric: "tabular-nums" } }, lead.updated_at || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 22, fontWeight: 600, color: TEXT_HI, lineHeight: 1.2, letterSpacing: "-.018em", marginBottom: 14, fontVariationSettings: "'opsz' 22" } }, lead.title), /* @__PURE__ */ React.createElement("div", { className: "lead-card-summary", style: { fontSize: 14.5, color: TEXT_HI, lineHeight: 1.6, marginBottom: 14, fontWeight: 450 } }, linkifyText(lead.summary, openCountry)), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowFull((v) => !v),
        className: "pressable",
        style: {
          background: "none",
          border: "none",
          padding: 0,
          color: at,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".04em",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start"
        }
      },
      showFull ? "\u2212 Hide full briefing" : "+ Read full briefing"
    ), showFull && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` } }, Array.isArray(lead.lenses) && lead.lenses.length > 0 && (() => {
      const gpAxis = (ESCALATION_AXES || []).find((a) => a.key === "greatpower");
      const allAxis = (ESCALATION_AXES || []).find((a) => a.key === "alliance");
      const bricsCoh = gpAxis ? Math.min(100, Math.max(0, gpAxis.score)) : 0;
      const alliedCoh = allAxis ? Math.min(100, Math.max(0, 100 - allAxis.score)) : 0;
      return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, paddingBottom: 14, borderBottom: `1px dashed ${BORDER}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0, color: at }, "Coalition cohesion \xB7 BRICS vs Allies"), /* @__PURE__ */ React.createElement(InfoTip, null, "BRICS-side derived from the greatpower sub-axis (active bloc behavior). Allies-side derived from the inverse of the alliance_cohesion_inverse sub-axis (low fragmentation = high cohesion). Both reflect today's escalation scoring.")), [
        { label: "BRICS cohesion", pct: bricsCoh, color: accent },
        { label: "Allied cohesion", pct: alliedCoh, color: BLUE }
      ].map((row) => /* @__PURE__ */ React.createElement("div", { key: row.label, style: { display: "grid", gridTemplateColumns: "minmax(110px, 130px) 1fr 32px", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, fontWeight: 600, color: TEXT_BODY, letterSpacing: ".04em", textTransform: "uppercase" } }, row.label), /* @__PURE__ */ React.createElement("div", { style: { height: 6, background: BORDER, borderRadius: 999, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${row.pct}%`, height: "100%", background: row.color, borderRadius: 999, transition: "width .6s cubic-bezier(.2,.8,.2,1)" } })), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, fontWeight: 600, color: row.color, fontVariantNumeric: "tabular-nums", textAlign: "right" } }, row.pct))));
    })(), Array.isArray(lead.lenses) && lead.lenses.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, paddingBottom: 14, borderBottom: `1px dashed ${BORDER}` } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 4, color: at }, "Four lenses"), lead.lenses.map((lens, i) => {
      const stateColor = lens.state_label === "cooling" ? GREEN : lens.state_label === "hardening" ? DANGER : lens.state_label === "firming" ? AMBER : TEXT_MID;
      return /* @__PURE__ */ React.createElement("div", { key: i, className: "lens-row", style: { display: "grid", gridTemplateColumns: "minmax(110px, 130px) auto 1fr", gap: 10, alignItems: "baseline", padding: "6px 0", borderBottom: i < lead.lenses.length - 1 ? `1px solid ${BORDER}` : "none" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, fontWeight: 600, color: TEXT_HI, letterSpacing: ".02em" } }, lens.name), /* @__PURE__ */ React.createElement("span", { className: "lens-badge", style: {
        fontSize: FS.xs,
        fontWeight: 700,
        color: stateColor,
        background: alpha(stateColor, 0.12),
        border: `1px solid ${alpha(stateColor, 0.28)}`,
        padding: "2px 7px",
        borderRadius: 999,
        letterSpacing: ".10em",
        textTransform: "uppercase",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        textAlign: "center"
      } }, lens.state_label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, color: TEXT_BODY, lineHeight: 1.5, fontWeight: 450 } }, lens.oneline));
    })), /* @__PURE__ */ React.createElement("div", { className: "lead-facts-row", style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 18 } }, lead.facts.map((f, i) => {
      const isPrimary = i === 0;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: f.l,
          style: {
            padding: "12px 14px",
            background: isPrimary ? `linear-gradient(135deg, ${alpha(accent, 0.06)}, transparent 80%)` : RAISE_1,
            border: `1px solid ${isPrimary ? alpha(accent, 0.22) : BORDER}`,
            borderRadius: 10,
            position: "relative"
          }
        },
        /* @__PURE__ */ React.createElement(Eyebrow, { mb: 6, color: isPrimary ? at : TEXT_DIM }, scrubCodes(f.l)),
        /* @__PURE__ */ React.createElement(M, { style: { fontSize: 13.5, color: isPrimary ? at : TEXT_HI, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-.005em" } }, scrubCodes(f.v))
      );
    })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("span", { style: { flexShrink: 0, marginTop: 4, fontSize: FS.xs, fontWeight: 700, color: AMBER, letterSpacing: ".14em", width: 92, textTransform: "uppercase" } }, "Changed 24h"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, lineHeight: 1.6, fontWeight: 450 } }, linkifyText(lead.changed, openCountry))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("span", { style: { flexShrink: 0, marginTop: 4, fontSize: FS.xs, fontWeight: 700, color: at, letterSpacing: ".14em", width: 92, textTransform: "uppercase" } }, "Watch"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, lineHeight: 1.6, fontWeight: 450 } }, linkifyText(lead.watch, openCountry)))), setTab && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setTab("analysis", arc),
        className: "pressable",
        style: {
          marginTop: 2,
          alignSelf: "flex-start",
          background: alpha(VIOLET, 0.08),
          border: `1px solid ${alpha(VIOLET, 0.28)}`,
          color: VIOLET,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".04em",
          padding: "7px 12px",
          borderRadius: 999,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6
        }
      },
      "See full strategic analysis \u2192"
    )));
  }
  function Next7Strip({ setTab }) {
    const all = (OUTLOOK.forecasts || []).filter((f) => f.status === "open");
    const rows = [...all].sort((a, b) => (a.deadline || "9999-12-31").localeCompare(b.deadline || "9999-12-31")).slice(0, 5);
    if (!rows.length) return null;
    const probColor = (p) => p >= 0.6 ? DANGER : p >= 0.3 ? AMBER : TEXT_MID;
    return /* @__PURE__ */ React.createElement(RevealOnView, { delay: 130 }, /* @__PURE__ */ React.createElement(Card, { style: { padding: "18px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0, color: BLUE }, "Next 7 Days \xB7 Catalysts"), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "scenario" })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column" } }, rows.map((f, i) => {
      const dl = fmtResolve(f.deadline);
      const p = typeof f.probability === "number" ? f.probability : 0;
      const pc = probColor(p);
      return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderTop: i > 0 ? `1px solid ${BORDER}` : "none" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, color: AMBER, fontWeight: 600, fontVariantNumeric: "tabular-nums", width: 46, flexShrink: 0 } }, dl ? dl.label : "\u2014"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0, fontSize: 13, color: TEXT_HI, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, f.question), /* @__PURE__ */ React.createElement("span", { style: {
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 700,
        color: pc,
        background: alpha(pc, 0.12),
        border: `1px solid ${alpha(pc, 0.3)}`,
        padding: "2px 8px",
        borderRadius: 999,
        fontVariantNumeric: "tabular-nums"
      } }, Math.round(p * 100), "%"), /* @__PURE__ */ React.createElement(OutTheaterChip, { name: f.theater }));
    })), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setTab && setTab("outlook"),
        className: "pressable",
        style: {
          marginTop: 12,
          background: "none",
          border: "none",
          padding: 0,
          color: BLUE,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".04em",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6
        }
      },
      "See all ",
      all.length,
      " open forecasts \u2192"
    )));
  }
  function OverviewTab({ mkt, gas, ww3, themes, openCountry, setTab }) {
    const conflictDay = Math.floor((NOW - WAR_START) / 864e5);
    const [expanded, setExpanded] = useState({});
    const [openLead, setOpenLead] = useState({});
    const setLeadOpen = (id) => (v) => setOpenLead((o) => ({ ...o, [id]: typeof v === "function" ? v(!!o[id]) : v }));
    const LEADS_RAW = [
      { id: "iran", lead: IRAN_LEAD, accent: IRAN, arc: "iran-hormuz" },
      { id: "brics", lead: BRICS_LEAD, accent: BRICS, accentText: BRICS_TEXT, arc: "us-brics-rivalry" },
      { id: "ukraine", lead: UKRAINE_LEAD, accent: UKRAINE_WAR, arc: "russia-ukraine-war" }
    ];
    const EDITORIAL_FALLBACK = { iran: 1, brics: 2, ukraine: 3 };
    const salienceOf = (it) => it.lead && it.lead.salience != null ? it.lead.salience : EDITORIAL_FALLBACK[it.id];
    const orderedLeads = [...LEADS_RAW].sort((a, b) => salienceOf(a) - salienceOf(b));
    const dominantLead = orderedLeads[0];
    const compactLeads = orderedLeads.slice(1);
    const isMobileOv = useIsMobile(640);
    const ww3Delta = WW3_DELTA != null ? WW3_DELTA : ww3 - WW3_HISTORY[WW3_HISTORY.length - 2];
    const hormuzCurrent = HORMUZ_NOW ? HORMUZ_NOW.v : HORMUZ_HISTORY[HORMUZ_HISTORY.length - 1];
    const hormuzAsOf = HORMUZ_NOW && HORMUZ_NOW.d ? (/* @__PURE__ */ new Date(`${HORMUZ_NOW.d}T00:00:00`)).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
    const ww3Color = ww3 > 60 ? DANGER : ww3 > 40 ? AMBER : GREEN;
    const cinSeries = (() => {
      try {
        return gasSeries.read().filter((r) => r && r.cin != null && r.date).map((r) => ({ d: r.date, v: r.cin }));
      } catch {
        return [];
      }
    })();
    const dieselSeries = buildDieselSeries();
    const dieselMonth = dieselChange(gas, "monthAgo");
    const dieselPre = gas?.diesel != null && DIESEL_PREWAR ? (gas.diesel - DIESEL_PREWAR.v) / DIESEL_PREWAR.v * 100 : null;
    const currentRung = ESCALATION_LADDER.find((r) => r.pct === Math.floor(ww3 / 10) * 10) || ESCALATION_LADDER[ESCALATION_LADDER.length - 1];
    const axesForDriver = (ESCALATION_AXES || []).map((a) => ({ ...a, driverLabel: a.key === "alliance" ? "Alliance Fragmentation" : a.label.replace(/\s*\(inverse\)\s*/i, "") }));
    const dominantAxis = axesForDriver.length ? axesForDriver.reduce((m, a) => a.score > m.score ? a : m, axesForDriver[0]) : null;
    const [showLadder, setShowLadder] = useState(false);
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 18 } }, /* @__PURE__ */ React.createElement(Card, { className: "choreographed", style: {
      animationDelay: "700ms",
      padding: 0,
      overflow: "hidden",
      position: "relative",
      background: `
            radial-gradient(60% 80% at 100% 0%, ${alpha(ww3Color, 0.1)}, transparent 60%),
            radial-gradient(80% 90% at 0% 100%, ${alpha(BLUE, 0.06)}, transparent 55%),
            radial-gradient(50% 50% at 30% 30%, ${alpha(ww3Color, 0.08)}, transparent 50%),
            var(--card-bg)
          `
    } }, /* @__PURE__ */ React.createElement("div", { "aria-hidden": "true", style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: `conic-gradient(from 220deg at 80% 20%, transparent 0deg, ${alpha(ww3Color, 0.03)} 80deg, transparent 160deg)`,
      opacity: 0.7,
      mixBlendMode: "screen"
    } }), /* @__PURE__ */ React.createElement("div", { style: {
      padding: "22px 20px 16px",
      position: "relative"
    } }, /* @__PURE__ */ React.createElement("div", { className: "ww3-hero-row", style: { display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 14, position: "relative", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0, color: TEXT_MID }, "WW3 Probability"), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "scenario" }), /* @__PURE__ */ React.createElement(InfoTip, null, "The chance, within the next 12 months, of a war fought directly between major powers. Specifically: two or more of the five permanent UN Security Council members (the US, Russia, China, the UK and France) fighting each other with their own forces, rather than through allies or proxies. The current US-Israel-Iran war is a regional conflict and does not by itself count \u2014 the threshold is crossed only if one of those five powers enters the fighting directly. The number is our editorial judgement, drawn from the escalation ladder, what the main actors are doing, and market and conflict data. It is not a scientific forecast, a betting-market price, or a statistically scored prediction.")), /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 72, fontWeight: 600, color: ww3Color, lineHeight: 0.95, letterSpacing: "-.045em", fontVariantNumeric: "tabular-nums", fontVariationSettings: "'opsz' 72" } }, /* @__PURE__ */ React.createElement(TickingNumber, { value: ww3, duration: 1100 }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 32, color: ww3Color, opacity: 0.55, marginLeft: 2, letterSpacing: "-.02em" } }, "%"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, paddingBottom: 14, fontFamily: SANS, fontVariantNumeric: "tabular-nums" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: ".02em",
      color: ww3Delta >= 0 ? IRAN : GREEN,
      background: ww3Delta >= 0 ? alpha(IRAN, 0.1) : alpha(GREEN, 0.1),
      padding: "3px 9px",
      borderRadius: 999,
      border: `1px solid ${ww3Delta >= 0 ? alpha(IRAN, 0.25) : alpha(GREEN, 0.22)}`
    } }, fmt.arrow(ww3Delta), " ", fmt.abs(ww3Delta), " pts ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM, fontWeight: 500, marginLeft: 3 } }, "24h")), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: TEXT_DIM } }, "peak ", Math.max(...WW3_HISTORY), "% \xB7 floor ", Math.min(...WW3_HISTORY), "%")), /* @__PURE__ */ React.createElement(
      "span",
      {
        title: `${currentRung.label} \u2014 ${currentRung.trigger}`,
        style: {
          fontFamily: SANS,
          fontSize: FS.xs,
          fontWeight: 600,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: ww3Color,
          padding: "4px 10px",
          borderRadius: 999,
          background: alpha(ww3Color, 0.08),
          border: `1px solid ${alpha(ww3Color, 0.2)}`,
          whiteSpace: "nowrap",
          alignSelf: "flex-start",
          cursor: "help"
        }
      },
      dominantAxis ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Rung ", currentRung.pct, " \xB7 driven by ", dominantAxis.driverLabel, " ", dominantAxis.score) : /* @__PURE__ */ React.createElement(React.Fragment, null, "Rung ", currentRung.pct, " \xB7 ", currentRung.label)
    ))), /* @__PURE__ */ React.createElement("div", { style: { margin: "6px 0 0", position: "relative" } }, /* @__PURE__ */ React.createElement(
      EventSeriesChart,
      {
        series: WW3_SERIES,
        color: ww3Color,
        height: 200,
        yMin: 0,
        yMax: 70,
        gridYs: [0, 20, 40, 60],
        unit: "%"
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: TEXT_DIM, marginTop: 6, lineHeight: 1.4, fontFamily: SANS } }, /* @__PURE__ */ React.createElement("span", null, "Day ", conflictDay, " \xB7 Operation Epic Fury"), /* @__PURE__ */ React.createElement("span", { style: { fontVariantNumeric: "tabular-nums" } }, "since 2026-02-28 \xB7 ", WW3_SERIES.filter((p) => p.t).length, " milestones"))), /* @__PURE__ */ React.createElement("div", { className: "kpi-grid-secondary", style: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderTop: `1px solid ${BORDER}` } }, /* @__PURE__ */ React.createElement(
      KpiCell,
      {
        label: "Hormuz",
        badge: /* @__PURE__ */ React.createElement(SourceBadge, { kind: "scenario" }),
        info: "Daily tanker throughput through the Strait of Hormuz under coalition escort. Pre-war baseline: 138 ships/day. Sourced from Lloyd's hull-coverage reports + coalition escort logs." + (HORMUZ_STATUS && HORMUZ_STATUS.note ? ` ${HORMUZ_STATUS.note}${HORMUZ_STATUS.as_of ? ` (as of ${HORMUZ_STATUS.as_of})` : ""}` : ""),
        value: HORMUZ_STATUS ? HORMUZ_STATUS.label : "\u2014",
        valueColor: AMBER,
        subDisplay: /* @__PURE__ */ React.createElement("div", { style: { width: "100%", marginTop: 2 } }, /* @__PURE__ */ React.createElement(
          EventSeriesChart,
          {
            series: HORMUZ_SERIES,
            variant: "mini",
            height: 34,
            color: AMBER,
            escalationUp: false,
            format: (v) => `${Math.round(v)}`,
            unit: " ships"
          }
        )),
        footer: /* @__PURE__ */ React.createElement(React.Fragment, null, hormuzCurrent, /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "/138 ships"), hormuzAsOf && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "as of ", hormuzAsOf)), /* @__PURE__ */ React.createElement(StaleChip, { asOf: HORMUZ_NOW && HORMUZ_NOW.d })),
        small: true,
        border: true
      }
    ), /* @__PURE__ */ React.createElement(
      KpiCell,
      {
        label: "Brent",
        badge: /* @__PURE__ */ React.createElement(SourceBadge, { kind: mkt.BRENT.fromCache ? "scenario" : "live" }),
        info: "Brent crude oil front-month futures. Primary: Yahoo Finance (BZ=F). Fallback: Stooq daily close. Pre-war baseline: $74.21. Bid-ask reflects geopolitical risk premium + Saudi surge capacity. If both fail, the last-known-good cached price is shown with a freshness label.",
        value: fmt.money(mkt.BRENT.price),
        valueColor: AMBER,
        loading: !isLive(mkt, "BRENT"),
        subDisplay: /* @__PURE__ */ React.createElement("div", { style: { width: "100%", marginTop: 2 } }, /* @__PURE__ */ React.createElement(
          EventSeriesChart,
          {
            series: BRENT_SERIES,
            variant: "mini",
            height: 34,
            color: AMBER,
            format: (v) => `$${(+v).toFixed(0)}`,
            live: mkt.BRENT.price != null ? { v: mkt.BRENT.price, label: mkt.BRENT.asOf ? staleness(mkt.BRENT.asOf).label : "live" } : null
          }
        )),
        footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { color: mkt.BRENT.chg != null && mkt.BRENT.chg >= 0 ? AMBER : GREEN, fontWeight: 600 } }, fmt.arrow(mkt.BRENT.chg), " ", fmt.signedPct(mkt.BRENT.chg)), " ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "\xB7 pre-war $74", mkt.BRENT.asOf ? ` \xB7 ${staleness(mkt.BRENT.asOf).label}` : "")),
        small: true,
        border: true
      }
    ), /* @__PURE__ */ React.createElement(
      KpiCell,
      {
        label: "US Gas Avg",
        badge: /* @__PURE__ */ React.createElement(SourceBadge, { kind: gas?.fromCache ? "scenario" : "live" }),
        info: "US national average for regular unleaded. Source: AAA national average (live via CORS proxy). Pre-war baseline: $3.42. \u0394 reflects refined product passthrough from Brent/WTI.",
        value: gas?.national != null ? fmt.money(gas.national, 3) : null,
        loading: gas?.national == null,
        valueColor: AMBER,
        subDisplay: /* @__PURE__ */ React.createElement("div", { style: { width: "100%", marginTop: 2 } }, /* @__PURE__ */ React.createElement(
          EventSeriesChart,
          {
            series: GAS_NAT_SERIES,
            variant: "mini",
            height: 34,
            color: AMBER,
            format: (v) => `$${(+v).toFixed(2)}`,
            live: gas?.national != null ? { v: gas.national, label: gas?.asOf ? staleness(gas.asOf).label : "live" } : null
          }
        )),
        footer: gas?.national != null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { color: AMBER, fontWeight: 600 } }, "+", ((gas.national - 3.42) / 3.42 * 100).toFixed(0), "%"), " ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "since Feb 28", gas?.asOf ? ` \xB7 ${staleness(gas.asOf).label}` : "")) : /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "awaiting AAA\u2026"),
        small: true,
        border: true
      }
    ), /* @__PURE__ */ React.createElement(
      KpiCell,
      {
        label: "US Diesel",
        badge: /* @__PURE__ */ React.createElement(SourceBadge, { kind: gas?.fromCache ? "scenario" : "live" }),
        info: `US national average for diesel. Current: AAA national average (live via CORS proxy) \u2014 the Diesel column of the same AAA table as regular gas. History behind the chart: EIA weekly U.S. retail diesel average${DIESEL_SOURCE && DIESEL_SOURCE.through ? ` through ${DIESEL_SOURCE.through}` : ""}, replaced by AAA daily captures as they accumulate.${DIESEL_PREWAR ? ` Pre-war baseline: $${DIESEL_PREWAR.v.toFixed(2)} (EIA, week ending ${DIESEL_PREWAR.d}) \u2014 a different survey from AAA, typically within a few cents.` : ""}`,
        value: gas?.diesel != null ? fmt.money(gas.diesel, 3) : null,
        loading: gas?.diesel == null,
        valueColor: AMBER,
        subDisplay: dieselSeries.length + (gas?.diesel != null ? 1 : 0) >= 2 && dieselSeries.length >= 1 ? /* @__PURE__ */ React.createElement("div", { style: { width: "100%", marginTop: 2 } }, /* @__PURE__ */ React.createElement(
          EventSeriesChart,
          {
            series: dieselSeries,
            variant: "mini",
            height: 34,
            color: AMBER,
            start: /* @__PURE__ */ new Date(`${dieselSeries[0].d}T00:00:00`),
            format: (v) => `$${(+v).toFixed(2)}`,
            live: gas?.diesel != null ? { v: gas.diesel, label: gas?.asOf ? staleness(gas.asOf).label : "live" } : null
          }
        )) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10.5, color: TEXT_DIM, fontFamily: SANS, fontStyle: "italic", display: "block", marginTop: 4, lineHeight: 1.4 } }, dieselSeries.length === 1 ? `tracking since ${(/* @__PURE__ */ new Date(`${dieselSeries[0].d}T00:00:00`)).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "building history \u2014 trend starts with the next daily AAA capture"),
        footer: gas?.diesel != null ? dieselPre != null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { color: dieselPre >= 0 ? AMBER : GREEN, fontWeight: 600 } }, dieselPre >= 0 ? "+" : "", dieselPre.toFixed(0), "%"), " ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "since pre-war", gas?.asOf ? ` \xB7 ${staleness(gas.asOf).label}` : "")) : dieselMonth ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { color: dieselMonth.pct >= 0 ? AMBER : GREEN, fontWeight: 600 } }, dieselMonth.pct >= 0 ? "+" : "", dieselMonth.pct.toFixed(0), "%"), " ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "vs month ago", gas?.asOf ? ` \xB7 ${staleness(gas.asOf).label}` : "")) : /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "national avg", gas?.asOf ? ` \xB7 ${staleness(gas.asOf).label}` : "") : /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "awaiting AAA\u2026"),
        small: true,
        border: true
      }
    ), /* @__PURE__ */ React.createElement(
      KpiCell,
      {
        label: "Cincinnati",
        badge: /* @__PURE__ */ React.createElement(SourceBadge, { kind: gas?.fromCache ? "scenario" : "live" }),
        info: "Cincinnati metro average for regular unleaded. Source: AAA metro page (live via CORS proxy), with a fallback to the Cincinnati row on the AAA Ohio state page. Pre-war Cincinnati baseline ~$3.10.",
        value: gas?.cincinnati != null ? fmt.money(gas.cincinnati, 3) : null,
        loading: gas?.cincinnati == null,
        valueColor: AMBER,
        subDisplay: cinSeries.length + (gas?.cincinnati != null ? 1 : 0) >= 2 ? /* @__PURE__ */ React.createElement("div", { style: { width: "100%", marginTop: 2 } }, /* @__PURE__ */ React.createElement(
          EventSeriesChart,
          {
            series: cinSeries,
            variant: "mini",
            height: 34,
            color: AMBER,
            start: /* @__PURE__ */ new Date(`${cinSeries[0].d}T00:00:00`),
            format: (v) => `$${(+v).toFixed(2)}`,
            live: gas?.cincinnati != null ? { v: gas.cincinnati, label: gas?.asOf ? staleness(gas.asOf).label : "live" } : null
          }
        )) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10.5, color: TEXT_DIM, fontFamily: SANS, fontStyle: "italic", display: "block", marginTop: 4, lineHeight: 1.4 } }, cinSeries.length === 1 ? `tracking since ${(/* @__PURE__ */ new Date(`${cinSeries[0].d}T00:00:00`)).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "building history \u2014 AAA has no back-data"),
        footer: gas?.cincinnati != null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { color: AMBER, fontWeight: 600 } }, gas?.national != null ? `${gas.cincinnati < gas.national ? "\u2212" : "+"}$${Math.abs(gas.cincinnati - gas.national).toFixed(3)}` : "\u2014"), " ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "vs national", gas?.asOf ? ` \xB7 ${staleness(gas.asOf).label}` : "")) : /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "awaiting AAA metro\u2026"),
        small: true
      }
    ))), /* @__PURE__ */ React.createElement(RevealOnView, { delay: 80 }, /* @__PURE__ */ React.createElement(Card, { style: { padding: "18px 20px" } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 10, color: AMBER }, "Today \xB7 What Changed"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 9 } }, KEY_DEVS.map((d, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 12, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("span", { style: { flexShrink: 0, marginTop: 7, width: 5, height: 5, borderRadius: "50%", background: AMBER } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: TEXT_BODY, lineHeight: 1.55 } }, linkifyCountries(d, openCountry))))))), /* @__PURE__ */ React.createElement(Next7Strip, { setTab }), /* @__PURE__ */ React.createElement(SectionHeader, null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0, color: TEXT_MID }, "Lead Developments")), /* @__PURE__ */ React.createElement(
      LeadCard,
      {
        lead: dominantLead.lead,
        accent: dominantLead.accent,
        accentText: dominantLead.accentText,
        arc: dominantLead.arc,
        dominant: true,
        delay: 180,
        openCountry,
        showFull: !!openLead[dominantLead.id],
        setShowFull: setLeadOpen(dominantLead.id),
        setTab
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "lead-cards-compact", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, compactLeads.map((it, i) => /* @__PURE__ */ React.createElement(
      LeadCard,
      {
        key: it.id,
        lead: it.lead,
        accent: it.accent,
        accentText: it.accentText,
        arc: it.arc,
        delay: 240 + i * 60,
        openCountry,
        showFull: !!openLead[it.id],
        setShowFull: setLeadOpen(it.id),
        setTab
      }
    ))), /* @__PURE__ */ React.createElement(SectionHeader, null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0, color: TEXT_DIM }, "Escalation Ladder")), /* @__PURE__ */ React.createElement(RevealOnView, { delay: 240 }, /* @__PURE__ */ React.createElement(Card, { id: "ov-escalation" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", fontWeight: 600, textTransform: "uppercase", marginBottom: 14 } }, "Escalation Ladder \xB7 WW3 Probability Thresholds"), (() => {
      const curPct = Math.floor(ww3 / 10) * 10;
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 3, alignItems: "flex-end" } }, ESCALATION_LADDER.map((rung) => {
        const current = rung.pct === curPct;
        const passed = rung.pct < curPct;
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: rung.pct,
            title: `${rung.pct}% \xB7 ${rung.label}`,
            style: {
              flex: 1,
              height: current ? 16 : 9,
              borderRadius: 3,
              background: current ? AMBER : passed ? alpha(DANGER, 0.25) : RAISE_2,
              border: `1px solid ${current ? alpha(AMBER, 0.55) : passed ? alpha(DANGER, 0.18) : BORDER}`,
              boxShadow: current ? `0 0 10px ${alpha(AMBER, 0.45)}` : "none",
              cursor: "help",
              transition: "background .25s ease, height .25s ease"
            }
          }
        );
      })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 12, color: TEXT_MID, fontFamily: SANS, fontVariantNumeric: "tabular-nums" } }, /* @__PURE__ */ React.createElement("span", { style: { color: AMBER, fontWeight: 600 } }, currentRung.pct, "%"), " \xB7 ", currentRung.label));
    })(), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 22, paddingTop: 18, borderTop: `1px solid ${BORDER}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: FS.xs, color: TEXT_MID, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 } }, "Composite of four orthogonal axes"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, ESCALATION_AXES.map((axis) => /* @__PURE__ */ React.createElement(AxisBar, { key: axis.key, axis }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 16, fontSize: 11.5, color: TEXT_DIM, lineHeight: 1.55 } }, /* @__PURE__ */ React.createElement("span", { style: { flexShrink: 0, color: TEXT_MID } }, "\u24D8"), /* @__PURE__ */ React.createElement("span", null, "The axes are not points on the same line \u2014 alliance cohesion can degrade without WMD posture moving, and vice versa. WW3% weights Great-Power Involvement most heavily (matches the \u22652 P5 in direct kinetic conflict definition on the hero tooltip). The 10-rung ladder above is a composite descriptor of the joint state, not a single dimension."))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowLadder((v) => !v),
        className: "pressable",
        style: {
          marginTop: 16,
          background: "none",
          border: "none",
          padding: 0,
          color: AMBER,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".04em",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start"
        }
      },
      showLadder ? "\u2212 Hide full ladder" : "+ Show full 10-rung ladder"
    ), showLadder && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, display: "flex", flexDirection: "column", gap: 3 } }, ESCALATION_LADDER.map((rung) => {
      const current = rung.pct === Math.floor(ww3 / 10) * 10;
      const passed = rung.pct < Math.floor(ww3 / 10) * 10;
      const labelColor = passed ? DANGER : current ? AMBER : TEXT_MID;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: rung.pct,
          className: current ? "glow-rung" : "",
          style: {
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "9px 12px",
            borderRadius: 8,
            background: current ? alpha(AMBER, 0.1) : passed ? alpha(DANGER, 0.04) : "transparent",
            border: `1px solid ${current ? alpha(AMBER, 0.32) : passed ? alpha(DANGER, 0.1) : "transparent"}`,
            position: "relative",
            transition: "background .25s ease, border-color .25s ease"
          }
        },
        /* @__PURE__ */ React.createElement(M, { style: { fontSize: 13, fontWeight: 600, color: labelColor, width: 42, flexShrink: 0, fontVariantNumeric: "tabular-nums" } }, rung.pct, "%"),
        /* @__PURE__ */ React.createElement("div", { style: { width: 1, height: 20, background: BORDER, flexShrink: 0 } }),
        /* @__PURE__ */ React.createElement("span", { className: "ladder-label", style: { fontSize: 13, fontWeight: 600, color: labelColor, width: 180, flexShrink: 0 } }, rung.label),
        /* @__PURE__ */ React.createElement("span", { className: "ladder-trigger", style: { fontSize: 13, color: passed ? TEXT_DIM : current ? TEXT_BODY : TEXT_DIM, lineHeight: 1.4 } }, rung.trigger),
        current && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", flexShrink: 0, fontSize: FS.xs, fontWeight: 600, color: AMBER, letterSpacing: ".1em", padding: "3px 9px", borderRadius: 999, background: alpha(AMBER, 0.18), border: `1px solid ${alpha(AMBER, 0.45)}`, boxShadow: `0 0 12px ${alpha(AMBER, 0.35)}` } }, "CURRENT")
      );
    })))), /* @__PURE__ */ React.createElement(RevealOnView, { delay: 320 }, /* @__PURE__ */ React.createElement(MapTab, { openCountry })), /* @__PURE__ */ React.createElement(RevealOnView, { delay: 400 }, /* @__PURE__ */ React.createElement("div", { className: "stat-grid-4", style: { display: "grid", gridTemplateColumns: "3fr 2fr", gap: 12 } }, HUMAN_COST && /* @__PURE__ */ React.createElement(Card, { style: { padding: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0 }, HUMAN_COST.title), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "scenario" }), /* @__PURE__ */ React.createElement(InfoTip, null, "Disaggregation per ACLED / AOAV / Airwars convention. Combatant = uniformed military, IRGC, Hezbollah fighters, etc. Civilian = non-combatants per IHL. Fog-of-war figures are contested; ranges shown where attribution is in dispute.")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column" } }, (HUMAN_COST.groups || []).map((g, gi) => /* @__PURE__ */ React.createElement("div", { key: g.key || g.label, style: { paddingTop: gi > 0 ? 13 : 0, paddingBottom: 13, borderBottom: `1px solid ${BORDER}` } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 9 }, g.label), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" } }, (g.rows || []).map((row) => /* @__PURE__ */ React.createElement("div", { key: row.k }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, marginBottom: 3 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".07em", textTransform: "uppercase", fontWeight: 600 } }, row.k), /* @__PURE__ */ React.createElement(BasisChip, { basis: row.basis })), /* @__PURE__ */ React.createElement("div", { className: "display", title: row.note || void 0, style: { fontSize: 22, fontWeight: 600, color: DANGER, letterSpacing: "-.015em", fontVariantNumeric: "tabular-nums", lineHeight: 1, fontVariationSettings: "'opsz' 22", cursor: row.note ? "help" : "default" } }, row.value), row.secondary && /* @__PURE__ */ React.createElement("div", { style: { fontSize: FS.xs, color: TEXT_DIM, marginTop: 4, lineHeight: 1.4 } }, row.secondary), row.as_of && /* @__PURE__ */ React.createElement("div", { style: { fontSize: FS.xs, color: TEXT_DIM, marginTop: 3 } }, "as of ", row.as_of))))))), HUMAN_COST.footnote && /* @__PURE__ */ React.createElement("div", { style: { fontSize: FS.xs, color: TEXT_DIM, marginTop: 18, lineHeight: 1.5, letterSpacing: ".02em" } }, HUMAN_COST.footnote)), /* @__PURE__ */ React.createElement(Card, { style: { padding: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 18 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0 }, "Market Impact"), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "live" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, [
      { l: "S&P 500", sym: "SPX", v: mkt.SPX.price != null ? fmt.num(Math.round(mkt.SPX.price)) : null, c: mkt.SPX.chg },
      { l: "BRENT", sym: "BRENT", v: mkt.BRENT.price != null ? fmt.money(mkt.BRENT.price) : null, c: mkt.BRENT.chg },
      { l: "GOLD", sym: "GOLD", v: mkt.GOLD.price != null ? `$${fmt.compact(Math.round(mkt.GOLD.price))}` : null, c: mkt.GOLD.chg },
      { l: "BTC", sym: "BTC", v: mkt.BTC.price != null ? `$${fmt.compact(Math.round(mkt.BTC.price))}` : null, c: mkt.BTC.chg }
    ].map((s) => {
      const live = isLive(mkt, s.sym);
      return /* @__PURE__ */ React.createElement("div", { key: s.l, style: { padding: "12px 14px", background: RAISE_1, border: `1px solid ${BORDER}`, borderRadius: 10 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 8 }, s.l), live ? /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 22, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", fontVariationSettings: "'opsz' 22", lineHeight: 1 } }, s.v) : /* @__PURE__ */ React.createElement(PriceSkeleton, { w: 80, h: 20, radius: 6 }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, marginTop: 6, fontWeight: 500, fontVariantNumeric: "tabular-nums", fontFamily: SANS, minHeight: 14 } }, live ? /* @__PURE__ */ React.createElement("span", { style: { color: s.c >= 0 ? GREEN : DANGER } }, fmt.arrow(s.c), " ", fmt.signedPct(s.c)) : /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM, fontStyle: "italic", fontSize: 11 } }, "awaiting live feed\u2026")));
    })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: FS.xs, color: TEXT_DIM, marginTop: 18, lineHeight: 1.5, letterSpacing: ".02em" } }, "Live \xB7 Yahoo Finance (equities, oil, gold) \xB7 CoinGecko (BTC)")))), /* @__PURE__ */ React.createElement(RevealOnView, { delay: 480 }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", fontWeight: 600, textTransform: "uppercase", marginBottom: 12, paddingLeft: 2 } }, "Developing Themes"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, themes.map((th, i) => /* @__PURE__ */ React.createElement(Card, { key: i, className: "card-hover", style: { cursor: "pointer", padding: "16px 20px" }, onClick: () => setExpanded((e) => ({ ...e, [i]: !e[i] })) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.005em" } }, th.title), /* @__PURE__ */ React.createElement("span", { style: {
      width: 24,
      height: 24,
      borderRadius: 6,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: RAISE_2,
      border: `1px solid ${BORDER}`,
      fontSize: 14,
      color: TEXT_MID,
      lineHeight: 1,
      flexShrink: 0
    } }, expanded[i] ? "\u2212" : "+")), expanded[i] && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: TEXT_BODY, lineHeight: 1.65, marginTop: 12 } }, linkifyCountries(th.body, openCountry))))))));
  }
  function buildSparsePath(points, fieldKey, xOf, yOf) {
    let d = "";
    let first = true;
    for (let i = 0; i < points.length; i++) {
      const v = points[i][fieldKey];
      if (v == null || !isFinite(v)) continue;
      d += `${first ? "M" : "L"} ${xOf(i)} ${yOf(v)} `;
      first = false;
    }
    return d.trim();
  }
  function buildGasSeries() {
    const ANCHORED_DATES = {
      "Feb 28": "2026-02-28",
      "Mar 14": "2026-03-14",
      "Mar 28": "2026-03-28",
      "Apr 8": "2026-04-08",
      "Apr 21": "2026-04-21",
      "May 1": "2026-05-01",
      "May 7": "2026-05-07",
      "May 13": "2026-05-13",
      "May 14": "2026-05-14"
    };
    const map = /* @__PURE__ */ new Map();
    for (const w of GAS_HISTORY) {
      const date = ANCHORED_DATES[w.week];
      if (!date) continue;
      map.set(date, { date, week: w.week, nat: w.nat, ca: w.ca, oh: null, cin: null, dsl: null });
    }
    const CHART_START = "2026-02-28";
    for (const r of DIESEL_HISTORY) {
      if (!r || !r.d || r.v == null || r.d < CHART_START) continue;
      const existing = map.get(r.d);
      if (existing) {
        map.set(r.d, { ...existing, dsl: r.v });
      } else {
        const dt = /* @__PURE__ */ new Date(r.d + "T00:00:00Z");
        const week = dt.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
        map.set(r.d, { date: r.d, week, nat: null, ca: null, oh: null, cin: null, dsl: r.v });
      }
    }
    for (const r of GAS_DAILY) {
      if (!r || !r.d || r.d < CHART_START) continue;
      const existing = map.get(r.d);
      if (existing) {
        map.set(r.d, {
          ...existing,
          nat: r.nat ?? existing.nat,
          ca: r.ca ?? existing.ca,
          dsl: r.diesel ?? existing.dsl
        });
      } else {
        const dt = /* @__PURE__ */ new Date(r.d + "T00:00:00Z");
        const week = dt.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
        map.set(r.d, { date: r.d, week, nat: r.nat ?? null, ca: r.ca ?? null, oh: null, cin: null, dsl: r.diesel ?? null });
      }
    }
    for (const r of gasSeries.read()) {
      if (r.date < CHART_START) continue;
      const existing = map.get(r.date);
      if (existing) {
        map.set(r.date, {
          ...existing,
          nat: r.nat ?? existing.nat,
          ca: r.ca ?? existing.ca,
          oh: r.oh ?? existing.oh,
          cin: r.cin ?? existing.cin,
          dsl: r.dsl ?? existing.dsl
        });
      } else {
        const dt = /* @__PURE__ */ new Date(r.date + "T00:00:00Z");
        const week = dt.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
        map.set(r.date, { date: r.date, week, nat: r.nat ?? null, ca: r.ca ?? null, oh: r.oh ?? null, cin: r.cin ?? null, dsl: r.dsl ?? null });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
  function buildDieselSeries() {
    const CHART_START = "2026-02-28";
    const byDate = /* @__PURE__ */ new Map();
    for (const r of DIESEL_HISTORY) {
      if (r && r.d && r.v != null && r.d >= CHART_START) byDate.set(r.d, r.v);
    }
    for (const r of GAS_DAILY) {
      if (r && r.d && r.diesel != null && r.d >= CHART_START) byDate.set(r.d, r.diesel);
    }
    try {
      for (const r of gasSeries.read()) {
        if (r && r.date && r.dsl != null && r.date >= CHART_START) byDate.set(r.date, r.dsl);
      }
    } catch (_) {
    }
    return Array.from(byDate, ([d, v]) => ({ d, v })).sort((a, b) => a.d.localeCompare(b.d));
  }
  function dieselChange(gas, refKey) {
    const ref = gas?.dieselLadder?.[refKey];
    if (gas?.diesel == null || ref == null || !isFinite(ref) || ref <= 0) return null;
    return { pct: (gas.diesel - ref) / ref * 100, ref };
  }
  function GasChart() {
    const [hover, setHover] = useState(null);
    const svgRef = useRef(null);
    const series = buildGasSeries();
    const W = 600, H = 220, padL = 42, padR = 12, padT = 14, padB = 32;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const yMin = 3;
    const hasDsl = series.some((r) => r.dsl != null);
    const maxSeen = series.reduce((m, r) => Math.max(m, r.nat ?? 0, r.ca ?? 0, r.oh ?? 0, r.cin ?? 0, r.dsl ?? 0), 0);
    const yMax = Math.max(6.5, Math.ceil((maxSeen + (hasDsl ? 0.25 : 0)) * 2) / 2);
    const xOf = (i) => padL + i / Math.max(1, series.length - 1) * innerW;
    const yOf = (v) => padT + (yMax - v) / (yMax - yMin) * innerH;
    const ticks = [];
    for (let t = yMin; t <= yMax + 1e-9; t += 0.5) ticks.push(+t.toFixed(1));
    const natPath = buildSparsePath(series, "nat", xOf, yOf);
    const caPath = buildSparsePath(series, "ca", xOf, yOf);
    const ohPath = buildSparsePath(series, "oh", xOf, yOf);
    const cinPath = buildSparsePath(series, "cin", xOf, yOf);
    const dslPath = buildSparsePath(series, "dsl", xOf, yOf);
    const natIdx = [];
    series.forEach((r, i) => {
      if (r.nat != null) natIdx.push(i);
    });
    const natAreaPath = natIdx.length >= 2 ? `${natPath} L ${xOf(natIdx[natIdx.length - 1])} ${yOf(yMin)} L ${xOf(natIdx[0])} ${yOf(yMin)} Z` : "";
    const onMove = (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      const scaleX = W / r.width;
      const x = (e.clientX - r.left) * scaleX;
      if (x < padL || x > W - padR) {
        setHover(null);
        return;
      }
      const frac = (x - padL) / innerW;
      const idx = Math.max(0, Math.min(series.length - 1, Math.round(frac * (series.length - 1))));
      const w = series[idx];
      setHover({ idx, x: xOf(idx), w, pxX: e.clientX - r.left, pxW: r.width });
    };
    const onLeave = () => setHover(null);
    const labelStride = Math.max(1, Math.ceil(series.length / 10));
    return /* @__PURE__ */ React.createElement("div", { style: { position: "relative", width: "100%" } }, /* @__PURE__ */ React.createElement(
      "svg",
      {
        ref: svgRef,
        viewBox: `0 0 ${W} ${H}`,
        style: { width: "100%", height: "auto", display: "block", cursor: "crosshair" },
        onMouseMove: onMove,
        onMouseLeave: onLeave
      },
      /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "natFill", x1: "0", x2: "0", y1: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: AMBER, stopOpacity: "0.18" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: AMBER, stopOpacity: "0" }))),
      ticks.map((t) => /* @__PURE__ */ React.createElement("g", { key: t }, /* @__PURE__ */ React.createElement("line", { x1: padL, x2: W - padR, y1: yOf(t), y2: yOf(t), style: { stroke: RAISE_2 }, strokeDasharray: t === 3.42 ? "4 3" : "0" }), /* @__PURE__ */ React.createElement("text", { x: padL - 6, y: yOf(t) + 3, fill: TEXT_DIM, fontSize: "11", fontFamily: "monospace", textAnchor: "end" }, "$", t.toFixed(2)))),
      /* @__PURE__ */ React.createElement("line", { x1: padL, x2: W - padR, y1: yOf(3.42), y2: yOf(3.42), stroke: TEXT_DIM, strokeDasharray: "3 3", strokeWidth: ".7", opacity: ".6" }),
      /* @__PURE__ */ React.createElement("text", { x: W - padR - 4, y: yOf(3.42) - 4, fill: TEXT_DIM, fontSize: "11", fontFamily: "monospace", textAnchor: "end" }, DIESEL_PREWAR ? "GAS " : "", "PRE-WAR $3.42"),
      DIESEL_PREWAR && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("line", { x1: padL, x2: W - padR, y1: yOf(DIESEL_PREWAR.v), y2: yOf(DIESEL_PREWAR.v), stroke: CYAN, strokeDasharray: "3 3", strokeWidth: ".7", opacity: ".6" }), /* @__PURE__ */ React.createElement("text", { x: W - padR - 4, y: yOf(DIESEL_PREWAR.v) - 4, fill: CYAN, fontSize: "11", fontFamily: "monospace", textAnchor: "end", opacity: ".85" }, "DIESEL PRE-WAR $", DIESEL_PREWAR.v.toFixed(2))),
      natAreaPath && /* @__PURE__ */ React.createElement("path", { d: natAreaPath, fill: "url(#natFill)" }),
      /* @__PURE__ */ React.createElement("path", { d: caPath, fill: "none", stroke: DANGER, strokeWidth: "2", strokeLinejoin: "round" }),
      /* @__PURE__ */ React.createElement("path", { d: natPath, fill: "none", stroke: AMBER, strokeWidth: "2", strokeLinejoin: "round" }),
      ohPath && /* @__PURE__ */ React.createElement("path", { d: ohPath, fill: "none", stroke: BLUE, strokeWidth: "2", strokeLinejoin: "round" }),
      cinPath && /* @__PURE__ */ React.createElement("path", { d: cinPath, fill: "none", stroke: GREEN, strokeWidth: "2", strokeLinejoin: "round" }),
      dslPath && /* @__PURE__ */ React.createElement("path", { d: dslPath, fill: "none", stroke: CYAN, strokeWidth: "2", strokeLinejoin: "round" }),
      series.map((w, i) => /* @__PURE__ */ React.createElement("g", { key: i }, w.nat != null && /* @__PURE__ */ React.createElement("circle", { cx: xOf(i), cy: yOf(w.nat), r: "3", fill: AMBER, style: { stroke: BG }, strokeWidth: "1.5" }), w.ca != null && /* @__PURE__ */ React.createElement("circle", { cx: xOf(i), cy: yOf(w.ca), r: "3", fill: DANGER, style: { stroke: BG }, strokeWidth: "1.5" }), w.oh != null && /* @__PURE__ */ React.createElement("circle", { cx: xOf(i), cy: yOf(w.oh), r: "3", fill: BLUE, style: { stroke: BG }, strokeWidth: "1.5" }), w.cin != null && /* @__PURE__ */ React.createElement("circle", { cx: xOf(i), cy: yOf(w.cin), r: "3", fill: GREEN, style: { stroke: BG }, strokeWidth: "1.5" }), w.dsl != null && /* @__PURE__ */ React.createElement("circle", { cx: xOf(i), cy: yOf(w.dsl), r: "3", fill: CYAN, style: { stroke: BG }, strokeWidth: "1.5" }))),
      (() => {
        const last = series.length - 1;
        const w = series[last];
        return /* @__PURE__ */ React.createElement("g", { opacity: hover ? 0.25 : 1, style: { transition: "opacity .15s ease" } }, w.nat != null && /* @__PURE__ */ React.createElement("text", { x: xOf(last) - 6, y: yOf(w.nat) - 8, fill: AMBER, fontSize: "11", fontFamily: "monospace", textAnchor: "end", fontWeight: "700" }, "$", w.nat.toFixed(2)), w.ca != null && /* @__PURE__ */ React.createElement("text", { x: xOf(last) - 6, y: yOf(w.ca) - 8, fill: DANGER, fontSize: "11", fontFamily: "monospace", textAnchor: "end", fontWeight: "700" }, "$", w.ca.toFixed(2)), w.oh != null && /* @__PURE__ */ React.createElement("text", { x: xOf(last) - 6, y: yOf(w.oh) + 14, fill: BLUE, fontSize: "11", fontFamily: "monospace", textAnchor: "end", fontWeight: "700" }, "$", w.oh.toFixed(2)), w.cin != null && /* @__PURE__ */ React.createElement("text", { x: xOf(last) - 6, y: yOf(w.cin) + 26, fill: GREEN, fontSize: "11", fontFamily: "monospace", textAnchor: "end", fontWeight: "700" }, "$", w.cin.toFixed(2)), w.dsl != null && /* @__PURE__ */ React.createElement("text", { x: xOf(last) - 6, y: yOf(w.dsl) - 20, fill: CYAN, fontSize: "11", fontFamily: "monospace", textAnchor: "end", fontWeight: "700" }, "$", w.dsl.toFixed(2)));
      })(),
      series.map((w, i) => {
        const isHovered = hover && hover.idx === i;
        const showLabel = isHovered || i === 0 || i === series.length - 1 || i % labelStride === 0;
        if (!showLabel) return null;
        return /* @__PURE__ */ React.createElement("text", { key: i, x: xOf(i), y: H - padB + 14, fill: isHovered ? TEXT_HI : TEXT_DIM, fontSize: "11", fontWeight: isHovered ? 600 : 400, fontFamily: "monospace", textAnchor: "middle", style: { transition: "fill .15s" } }, w.week);
      }),
      /* @__PURE__ */ React.createElement("line", { x1: padL, x2: padL, y1: padT, y2: H - padB, style: { stroke: RAISE_4 } }),
      /* @__PURE__ */ React.createElement("line", { x1: padL, x2: W - padR, y1: H - padB, y2: H - padB, style: { stroke: RAISE_4 } }),
      hover && /* @__PURE__ */ React.createElement("g", { pointerEvents: "none" }, /* @__PURE__ */ React.createElement("line", { x1: hover.x, x2: hover.x, y1: padT, y2: H - padB, style: { stroke: TEXT_MID }, strokeWidth: ".8", strokeDasharray: "3 3", opacity: ".6" }), hover.w.nat != null && /* @__PURE__ */ React.createElement("circle", { cx: hover.x, cy: yOf(hover.w.nat), r: "5", fill: AMBER, style: { stroke: BG }, strokeWidth: "2" }), hover.w.ca != null && /* @__PURE__ */ React.createElement("circle", { cx: hover.x, cy: yOf(hover.w.ca), r: "5", fill: DANGER, style: { stroke: BG }, strokeWidth: "2" }), hover.w.oh != null && /* @__PURE__ */ React.createElement("circle", { cx: hover.x, cy: yOf(hover.w.oh), r: "5", fill: BLUE, style: { stroke: BG }, strokeWidth: "2" }), hover.w.cin != null && /* @__PURE__ */ React.createElement("circle", { cx: hover.x, cy: yOf(hover.w.cin), r: "5", fill: GREEN, style: { stroke: BG }, strokeWidth: "2" }), hover.w.dsl != null && /* @__PURE__ */ React.createElement("circle", { cx: hover.x, cy: yOf(hover.w.dsl), r: "5", fill: CYAN, style: { stroke: BG }, strokeWidth: "2" }))
    ), hover && /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: Math.min(hover.pxW - 180, Math.max(8, hover.pxX + 14)),
      top: 8,
      zIndex: 4,
      background: "var(--header-bg)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: `1px solid ${BORDER}`,
      borderRadius: 8,
      padding: "10px 12px",
      fontFamily: SANS,
      fontSize: 11.5,
      lineHeight: 1.55,
      minWidth: 160,
      boxShadow: "var(--shadow-card)",
      pointerEvents: "none"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".10em", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 } }, hover.w.week), hover.w.nat != null && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 7, color: TEXT_BODY } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 2, background: AMBER, borderRadius: 1 } }), "National"), /* @__PURE__ */ React.createElement(M, { style: { color: AMBER, fontWeight: 600, fontVariantNumeric: "tabular-nums" } }, "$", hover.w.nat.toFixed(2))), hover.w.ca != null && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 7, color: TEXT_BODY } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 2, background: DANGER, borderRadius: 1 } }), "California"), /* @__PURE__ */ React.createElement(M, { style: { color: DANGER, fontWeight: 600, fontVariantNumeric: "tabular-nums" } }, "$", hover.w.ca.toFixed(2))), hover.w.oh != null && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 7, color: TEXT_BODY } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 2, background: BLUE, borderRadius: 1 } }), "Ohio"), /* @__PURE__ */ React.createElement(M, { style: { color: BLUE, fontWeight: 600, fontVariantNumeric: "tabular-nums" } }, "$", hover.w.oh.toFixed(2))), hover.w.cin != null && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 14, marginBottom: hover.w.dsl != null ? 4 : 0 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 7, color: TEXT_BODY } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 2, background: GREEN, borderRadius: 1 } }), "Cincinnati"), /* @__PURE__ */ React.createElement(M, { style: { color: GREEN, fontWeight: 600, fontVariantNumeric: "tabular-nums" } }, "$", hover.w.cin.toFixed(2))), hover.w.dsl != null && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 14 } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 7, color: TEXT_BODY } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 2, background: CYAN, borderRadius: 1 } }), "Diesel (natl)"), /* @__PURE__ */ React.createElement(M, { style: { color: CYAN, fontWeight: 600, fontVariantNumeric: "tabular-nums" } }, "$", hover.w.dsl.toFixed(2)))));
  }
  function GasTab({ gas }) {
    const natLoaded = gas?.national != null;
    const increase = natLoaded ? ((gas.national - 3.42) / 3.42 * 100).toFixed(1) : null;
    const dslLoaded = gas?.diesel != null;
    const dslMonth = dieselChange(gas, "monthAgo");
    const dslWeek = dieselChange(gas, "weekAgo");
    const dslPre = dslLoaded && DIESEL_PREWAR ? (gas.diesel - DIESEL_PREWAR.v) / DIESEL_PREWAR.v * 100 : null;
    const fmtShort = (iso) => (/* @__PURE__ */ new Date(`${iso}T00:00:00Z`)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    const bars = [
      { label: "National Avg", val: gas?.national, max: 6.5, color: AMBER },
      { label: "California", val: gas?.california, max: 6.5, color: DANGER },
      { label: "Ohio", val: gas?.ohio, max: 6.5, color: BLUE },
      { label: "Cincinnati", val: gas?.cincinnati, max: 6.5, color: GREEN }
    ];
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 18 } }, /* @__PURE__ */ React.createElement(Card, { style: { textAlign: "center", padding: 36 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 } }, "US National Average \xB7 Regular Unleaded"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 84, fontWeight: 600, color: AMBER, lineHeight: 1, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" } }, natLoaded ? `$${gas.national.toFixed(3)}` : /* @__PURE__ */ React.createElement(PriceSkeleton, { w: 180, h: 70, radius: 8 })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: DANGER, marginTop: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" } }, natLoaded ? `\u2191 +${increase}% since Feb 28 baseline ($3.42)` : "Awaiting live AAA data\u2026"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: TEXT_DIM, marginTop: 10 } }, "Source: AAA \xB7 Live")), /* @__PURE__ */ React.createElement(Card, { style: { textAlign: "center", padding: 36 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 } }, "US National Average \xB7 Diesel"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 84, fontWeight: 600, color: CYAN, lineHeight: 1, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" } }, dslLoaded ? `$${gas.diesel.toFixed(3)}` : /* @__PURE__ */ React.createElement(PriceSkeleton, { w: 180, h: 70, radius: 8 })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, marginTop: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums", display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" } }, !dslLoaded ? /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM } }, "Awaiting live AAA data\u2026") : /* @__PURE__ */ React.createElement(React.Fragment, null, dslPre != null && /* @__PURE__ */ React.createElement("span", { style: { color: dslPre >= 0 ? DANGER : GREEN } }, dslPre >= 0 ? "\u2191 +" : "\u2193 ", dslPre.toFixed(1), "% ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM, fontWeight: 400 } }, "since pre-war ($", DIESEL_PREWAR.v.toFixed(2), " \xB7 EIA, week of ", fmtShort(DIESEL_PREWAR.d), ")")), [["month ago", dslMonth], ["week ago", dslWeek]].map(([lbl, ch]) => ch && /* @__PURE__ */ React.createElement("span", { key: lbl, style: { color: ch.pct >= 0 ? DANGER : GREEN } }, ch.pct >= 0 ? "\u2191 +" : "\u2193 ", ch.pct.toFixed(1), "% ", /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM, fontWeight: 400 } }, "vs ", lbl, " ($", ch.ref.toFixed(2), ")"))), dslPre == null && !dslMonth && !dslWeek && /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM, fontWeight: 400 } }, "AAA reference prices unavailable"))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: TEXT_DIM, marginTop: 10 } }, "Source: AAA \xB7 Live \xB7 national average, diesel grade", DIESEL_SOURCE && DIESEL_SOURCE.through ? ` \xB7 chart history: EIA weekly national retail average through ${fmtShort(DIESEL_SOURCE.through)} (AAA replaces it as daily captures accumulate)` : "")), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 } }, "State Comparison"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, bars.map((b) => {
      const loaded = b.val != null;
      return /* @__PURE__ */ React.createElement("div", { key: b.label }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: TEXT_HI, fontWeight: 500 } }, b.label), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 14, fontWeight: 600, color: b.color } }, loaded ? `$${b.val.toFixed(3)}` : /* @__PURE__ */ React.createElement(PriceSkeleton, { w: 56, h: 14 }))), /* @__PURE__ */ React.createElement("div", { style: { height: 8, background: RAISE_2, borderRadius: 999, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: loaded ? `${b.val / b.max * 100}%` : "0%", height: "100%", background: b.color, borderRadius: 999, transition: "width .4s ease" } })));
    }))), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, textAlign: "center" } }, "Price History Since Feb 28 (War Start)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 14, height: 2, background: AMBER, borderRadius: 2 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: TEXT_BODY } }, "National")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 14, height: 2, background: DANGER, borderRadius: 2 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: TEXT_BODY } }, "California")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 14, height: 2, background: BLUE, borderRadius: 2 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: TEXT_BODY } }, "Ohio")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 14, height: 2, background: GREEN, borderRadius: 2 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: TEXT_BODY } }, "Cincinnati")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 14, height: 2, background: CYAN, borderRadius: 2 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: TEXT_BODY } }, "Diesel (national)")))), /* @__PURE__ */ React.createElement(GasChart, null)));
  }
  var ECON_COLOR = { blue: BLUE, amber: AMBER, violet: VIOLET, danger: DANGER, green: GREEN };
  function interpolatePrices(body, mkt) {
    if (!body) return body;
    const FMT = {
      SPX: (v) => fmt.num(Math.round(v)),
      DOW: (v) => fmt.num(Math.round(v)),
      NDX: (v) => fmt.num(Math.round(v)),
      BRENT: (v) => fmt.money(v),
      WTI: (v) => fmt.money(v),
      GOLD: (v) => `$${fmt.compact(Math.round(v))}`,
      BTC: (v) => `$${fmt.compact(Math.round(v))}`,
      ETH: (v) => `$${fmt.compact(Math.round(v))}`
    };
    return body.replace(/\{(SPX|DOW|NDX|BRENT|WTI|GOLD|BTC|ETH)\}/g, (_, sym) => {
      const price = mkt && mkt[sym] ? mkt[sym].price : null;
      return price != null && FMT[sym] ? FMT[sym](price) : "\u2014";
    });
  }
  function MarketsTab({ mkt }) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "markets-grid-4", style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 } }, [
      { l: "S&P 500", sym: "SPX", v: mkt.SPX.price != null ? fmt.num(Math.round(mkt.SPX.price)) : null, c: mkt.SPX.chg },
      { l: "BRENT", sym: "BRENT", v: mkt.BRENT.price != null ? fmt.money(mkt.BRENT.price) : null, c: mkt.BRENT.chg },
      { l: "GOLD", sym: "GOLD", v: mkt.GOLD.price != null ? `$${fmt.compact(Math.round(mkt.GOLD.price))}` : null, c: mkt.GOLD.chg },
      { l: "BTC", sym: "BTC", v: mkt.BTC.price != null ? `$${fmt.compact(Math.round(mkt.BTC.price))}` : null, c: mkt.BTC.chg }
    ].map((s) => {
      const live = isLive(mkt, s.sym);
      return /* @__PURE__ */ React.createElement(Card, { key: s.l, style: { padding: 18 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 10 }, s.l), live ? /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 24, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", fontVariationSettings: "'opsz' 24", lineHeight: 1 } }, s.v) : /* @__PURE__ */ React.createElement(PriceSkeleton, { w: 100, h: 22, radius: 6 }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, marginTop: 8, fontWeight: 500, fontVariantNumeric: "tabular-nums", fontFamily: SANS, minHeight: 14 } }, live ? /* @__PURE__ */ React.createElement("span", { style: { color: s.c >= 0 ? GREEN : DANGER } }, fmt.arrow(s.c), " ", fmt.signedPct(s.c)) : /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM, fontStyle: "italic", fontSize: 11 } }, "awaiting live feed\u2026")));
    })), ECON_COMMENTARY.map((c) => /* @__PURE__ */ React.createElement(Card, { key: c.key || c.title, style: { borderLeft: `3px solid ${ECON_COLOR[c.color] || BLUE}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 600, color: ECON_COLOR[c.color] || TEXT_HI, letterSpacing: "-.005em" } }, c.title), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4, flexShrink: 0 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM } }, c.updated_at), /* @__PURE__ */ React.createElement(StaleChip, { asOf: c.updated_at }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: TEXT_BODY, lineHeight: 1.7 } }, interpolatePrices(c.body, mkt)))));
  }
  var THEATERS = THEATERS_DATA;
  var THEATER_BY_ACTOR = {
    "China": "China",
    "Taiwan": "Taiwan",
    "Iran": "Iran",
    "Hezbollah / Lebanon": "Lebanon"
  };
  var COALITION_BRICS_PLUS = /* @__PURE__ */ new Set([
    "Brazil",
    "Russia",
    "India",
    "China",
    "South Africa",
    "Iran",
    "United Arab Emirates",
    "Egypt",
    "Ethiopia"
  ]);
  var COALITION_CRINK_EXTRA = /* @__PURE__ */ new Set([
    "Dem. Rep. Korea",
    "Korea, Democratic People's Republic of",
    "North Korea"
  ]);
  var COALITION_ALLIES = /* @__PURE__ */ new Set([
    "United States of America",
    "United Kingdom",
    "France",
    "Germany",
    "Italy",
    "Spain",
    "Poland",
    "Canada",
    "Netherlands",
    "Belgium",
    "Norway",
    "Denmark",
    "Sweden",
    "Finland",
    "Czechia",
    "Estonia",
    "Latvia",
    "Lithuania",
    "Australia",
    "Japan",
    "South Korea",
    "Korea",
    "Philippines",
    "New Zealand",
    "Turkey",
    "Greece",
    "Portugal",
    "Iceland"
  ]);
  var COALITION_AMBIVALENT = /* @__PURE__ */ new Set(["India"]);
  function MapTab({ openCountry }) {
    const [atlas, setAtlas] = useState(null);
    const [atlasErr, setAtlasErr] = useState(null);
    const [hover, setHover] = useState(null);
    const [mapZoom, setMapZoom] = useState({ scale: 1, x: 0, y: 0 });
    const [hintVisible, setHintVisible] = useState(true);
    const [showCoalitions, setShowCoalitions] = useState(false);
    const mapWrapRef = useRef(null);
    const svgRef = useRef(null);
    const isMobileMap = useIsMobile(900);
    useEffect(() => {
      if (!isMobileMap) return;
      const t = setTimeout(() => setHintVisible(false), 5e3);
      return () => clearTimeout(t);
    }, [isMobileMap]);
    const MAP_MAX_SCALE = 8;
    const zoomRef = useRef(mapZoom);
    zoomRef.current = mapZoom;
    const dragMoved = useRef(false);
    const [dragging, setDragging] = useState(false);
    const clampZoom = useCallback((z) => {
      const wrap = mapWrapRef.current;
      if (!wrap) return z;
      const r = wrap.getBoundingClientRect();
      if (z.scale <= 1.001) return { scale: 1, x: 0, y: 0 };
      return {
        scale: z.scale,
        x: Math.min(0, Math.max(r.width * (1 - z.scale), z.x)),
        y: Math.min(0, Math.max(r.height * (1 - z.scale), z.y))
      };
    }, []);
    const zoomAt = useCallback((px, py, factor) => {
      setMapZoom((z) => {
        const ns = Math.min(MAP_MAX_SCALE, Math.max(1, z.scale * factor));
        const k = ns / z.scale;
        return clampZoom({ scale: ns, x: px - (px - z.x) * k, y: py - (py - z.y) * k });
      });
    }, [clampZoom]);
    const zoomAtCenter = useCallback((factor) => {
      const wrap = mapWrapRef.current;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      zoomAt(r.width / 2, r.height / 2, factor);
    }, [zoomAt]);
    const resetMapZoom = useCallback(() => setMapZoom({ scale: 1, x: 0, y: 0 }), []);
    useEffect(() => {
      const wrap = mapWrapRef.current;
      if (!wrap) return;
      const onWheel = (e) => {
        e.preventDefault();
        const r = wrap.getBoundingClientRect();
        zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.25 : 0.8);
      };
      let panning = false, lastX = 0, lastY = 0;
      const onDown = (e) => {
        if (e.button !== 0 || zoomRef.current.scale <= 1.001) return;
        panning = true;
        dragMoved.current = false;
        lastX = e.clientX;
        lastY = e.clientY;
        setDragging(true);
      };
      const onMove = (e) => {
        if (!panning) return;
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved.current = true;
        lastX = e.clientX;
        lastY = e.clientY;
        setMapZoom((z) => clampZoom({ ...z, x: z.x + dx, y: z.y + dy }));
      };
      const onUp = () => {
        if (panning) {
          panning = false;
          setDragging(false);
        }
      };
      wrap.addEventListener("wheel", onWheel, { passive: false });
      wrap.addEventListener("mousedown", onDown);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      return () => {
        wrap.removeEventListener("wheel", onWheel);
        wrap.removeEventListener("mousedown", onDown);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
    }, [zoomAt, clampZoom]);
    useEffect(() => {
      const wrap = mapWrapRef.current;
      if (!wrap) return;
      let lastDist = 0, lastX = 0, lastY = 0, panning = false;
      const onStart = (e) => {
        if (e.touches.length === 2) {
          setHintVisible(false);
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastDist = Math.hypot(dx, dy);
        } else if (e.touches.length === 1 && zoomRef.current.scale > 1.05) {
          panning = true;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        }
      };
      const onMove = (e) => {
        if (e.touches.length === 2 && lastDist > 0) {
          e.preventDefault();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const r = wrap.getBoundingClientRect();
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
          zoomAt(midX, midY, dist / lastDist);
          lastDist = dist;
        } else if (e.touches.length === 1 && panning) {
          e.preventDefault();
          const dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY;
          if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved.current = true;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
          setMapZoom((z) => clampZoom({ ...z, x: z.x + dx, y: z.y + dy }));
        }
      };
      const onEnd = () => {
        lastDist = 0;
        panning = false;
      };
      wrap.addEventListener("touchstart", onStart, { passive: true });
      wrap.addEventListener("touchmove", onMove, { passive: false });
      wrap.addEventListener("touchend", onEnd);
      return () => {
        wrap.removeEventListener("touchstart", onStart);
        wrap.removeEventListener("touchmove", onMove);
        wrap.removeEventListener("touchend", onEnd);
      };
    }, [zoomAt, clampZoom]);
    useEffect(() => {
      const wrap = mapWrapRef.current;
      const svg = svgRef.current;
      if (!wrap || !svg) return;
      const mql = window.matchMedia ? window.matchMedia("(max-width: 768px)") : null;
      let mobile = !!(mql && mql.matches);
      function applyState(visible) {
        const active = visible && !mobile;
        if (active) {
          svg.classList.remove("map-paused");
          try {
            svg.unpauseAnimations && svg.unpauseAnimations();
          } catch (e) {
          }
        } else {
          svg.classList.add("map-paused");
          try {
            svg.pauseAnimations && svg.pauseAnimations();
          } catch (e) {
          }
        }
      }
      if (mobile) applyState(false);
      let io = null;
      if (typeof IntersectionObserver !== "undefined") {
        io = new IntersectionObserver((entries) => {
          for (const e of entries) applyState(e.isIntersecting);
        }, { rootMargin: "100px" });
        io.observe(wrap);
      }
      const onMqChange = (e) => {
        mobile = e.matches;
        const rect = wrap.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < (window.innerHeight || 800);
        applyState(visible);
      };
      mql && mql.addEventListener && mql.addEventListener("change", onMqChange);
      return () => {
        if (io) io.disconnect();
        mql && mql.removeEventListener && mql.removeEventListener("change", onMqChange);
      };
    }, []);
    useEffect(() => {
      let cancelled = false;
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json").then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)).then((topo) => {
        if (cancelled) return;
        if (!window.topojson) throw new Error("topojson-client not loaded");
        setAtlas(window.topojson.feature(topo, topo.objects.countries));
      }).catch((e) => {
        if (!cancelled) setAtlasErr(String(e));
      });
      return () => {
        cancelled = true;
      };
    }, []);
    const COUNTRY_FILL = MAP_OVERLAYS && MAP_OVERLAYS.fills || {
      "Iran": "rgba(244,63,94,.55)",
      "Israel": "rgba(244,63,94,.45)",
      "Lebanon": "rgba(251,146,60,.6)",
      "Yemen": "rgba(234,179,8,.55)",
      "Ukraine": "rgba(251,146,60,.55)",
      "Sudan": "rgba(148,148,148,.45)",
      "Russia": "rgba(244,63,94,.16)",
      "China": "rgba(245,158,11,.22)",
      "Pakistan": "rgba(245,158,11,.18)",
      "Saudi Arabia": "rgba(245,158,11,.16)",
      "Iraq": "rgba(245,158,11,.20)",
      "United States of America": "rgba(99,102,241,.18)"
    };
    const NORMALIZE_NAME = {
      "United States of America": "USA",
      "United Arab Emirates": "UAE",
      "Dem. Rep. Korea": "North Korea",
      "Korea, Democratic People's Republic of": "North Korea"
    };
    const drawerKey = (raw) => NORMALIZE_NAME[raw] || raw;
    const isClickable = (raw) => !!COUNTRY_KEYS[drawerKey(raw)];
    const W = 1e3, H = 440;
    const LAT_MAX = 78, LAT_MIN = -58;
    const project = (lng, lat) => [
      (lng + 180) / 360 * W,
      (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * H
    ];
    function geoPath(geo) {
      const polys = geo.type === "Polygon" ? [geo.coordinates] : geo.coordinates;
      let d = "";
      for (const poly of polys) {
        for (const ring of poly) {
          let prevX = null;
          let subpathOpen = false;
          for (let i = 0; i < ring.length; i++) {
            const [x, y] = project(ring[i][0], ring[i][1]);
            const jump = prevX !== null && Math.abs(x - prevX) > W / 2;
            if (i === 0 || jump) {
              if (subpathOpen) d += "Z ";
              d += "M" + x.toFixed(1) + "," + y.toFixed(1) + " ";
              subpathOpen = true;
            } else {
              d += "L" + x.toFixed(1) + "," + y.toFixed(1) + " ";
            }
            prevX = x;
          }
          if (subpathOpen) d += "Z ";
        }
      }
      return d;
    }
    const labels = MAP_OVERLAYS && MAP_OVERLAYS.labels || [
      { name: "IRAN", pos: [53.5, 32], color: IRAN, size: 11 },
      { name: "ISRAEL", pos: [35, 31.5], color: "#f87171", size: 11, anchor: "end", dx: -3 },
      { name: "LEBANON", pos: [35.7, 35], color: "#fb923c", size: 11, anchor: "start", dx: 3 },
      { name: "YEMEN", pos: [47.5, 15.5], color: "#eab308", size: 11 },
      { name: "UKRAINE", pos: [31.5, 49], color: "#fb923c", size: 11 },
      { name: "SUDAN", pos: [30, 14], color: TEXT_BODY, size: 11 },
      { name: "USA", pos: [-98, 39], color: "#a5b4fc", size: 11 },
      { name: "RUSSIA", pos: [95, 62], color: "#fb7185", size: 11 },
      { name: "CHINA", pos: [103, 35], color: "#e8a542", size: 11 }
    ];
    const [hormuzX, hormuzY] = project(56.25, 26.57);
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { style: { padding: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 22px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600 } }, "Global Conflict Zones \xB7 Operation Epic Fury + US-BRICS Rivalry + Russia-Ukraine + Active Theaters"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowCoalitions((v) => !v),
        className: "filter-chip pressable",
        style: {
          fontFamily: SANS,
          fontSize: FS.xs,
          fontWeight: 600,
          letterSpacing: ".08em",
          color: showCoalitions ? "#fff" : TEXT_BODY,
          background: showCoalitions ? "var(--c-brics)" : RAISE_1,
          border: `1px solid ${showCoalitions ? "var(--c-brics)" : RAISE_4}`,
          padding: "4px 10px",
          borderRadius: 999,
          cursor: "pointer",
          textTransform: "uppercase"
        }
      },
      showCoalitions ? "\u2713 Coalitions" : "Show Coalitions"
    ), /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".06em" } }, `Equirectangular \xB7 Natural Earth 1:110m${MAP_OVERLAYS && MAP_OVERLAYS.as_of ? ` \xB7 Overlays as of ${MAP_OVERLAYS.as_of}` : ""}`))), showCoalitions && /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 22px", borderBottom: `1px solid ${BORDER}`, background: RAISE_1, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".10em", textTransform: "uppercase", fontWeight: 600 } }, "Legend"), /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: FS.xs, color: TEXT_BODY } }, /* @__PURE__ */ React.createElement("span", { style: { width: 14, height: 10, background: "rgba(185,28,60,.40)", border: "1px solid rgba(127,127,127,.55)", borderRadius: 2 } }), " BRICS+"), /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: FS.xs, color: TEXT_BODY } }, /* @__PURE__ */ React.createElement("span", { style: { width: 14, height: 10, background: "rgba(155,20,50,.55)", border: "1px solid rgba(127,127,127,.55)", borderRadius: 2 } }), " CRINK extra (NK)"), /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: FS.xs, color: TEXT_BODY } }, /* @__PURE__ */ React.createElement("span", { style: { width: 14, height: 10, background: "rgba(99,102,241,.32)", border: "1px solid rgba(127,127,127,.55)", borderRadius: 2 } }), " US Allies (NATO + Quad + JK-PH)"), /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: FS.xs, color: TEXT_BODY } }, /* @__PURE__ */ React.createElement("span", { style: { width: 14, height: 10, background: "linear-gradient(45deg, rgba(99,102,241,.32) 50%, rgba(185,28,60,.30) 50%)", border: "1px solid rgba(127,127,127,.55)", borderRadius: 2 } }), " Ambivalent (India: BRICS+ \u2227 Quad)")), /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: mapWrapRef,
        style: {
          position: "relative",
          width: "100%",
          paddingBottom: `${H / W * 100}%`,
          background: "var(--map-bg)",
          overflow: "hidden",
          touchAction: mapZoom.scale > 1.05 ? "none" : "pan-y",
          cursor: mapZoom.scale > 1.05 ? dragging ? "grabbing" : "grab" : "default"
        },
        onClickCapture: (e) => {
          if (dragMoved.current) {
            e.stopPropagation();
            dragMoved.current = false;
          }
        }
      },
      hover && /* @__PURE__ */ React.createElement("div", { style: {
        position: "absolute",
        left: hover.x + 14,
        top: hover.y + 12,
        zIndex: 5,
        pointerEvents: "none",
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "var(--shadow-card)",
        whiteSpace: "nowrap",
        transform: "translate3d(0,0,0)"
      } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, hover.flag), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.005em" } }, hover.name), hover.level && /* @__PURE__ */ React.createElement(SeverityPill, { level: hover.level, size: 10 }), hover.score != null && /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, fontWeight: 600, color: SEV_COLOR[hover.level] || TEXT_HI, fontVariantNumeric: "tabular-nums" } }, hover.score)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: FS.xs, color: TEXT_DIM, marginTop: 4, letterSpacing: ".06em" } }, "Click to open dossier")),
      isMobileMap && /* @__PURE__ */ React.createElement("div", { className: `map-zoom-hint${hintVisible ? "" : " hidden"}` }, "Pinch to zoom"),
      /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: 10, right: 10, zIndex: 6, display: "flex", flexDirection: "column", gap: 6 } }, [
        { label: "+", title: "Zoom in", onClick: () => zoomAtCenter(1.5) },
        { label: "\u2212", title: "Zoom out", onClick: () => zoomAtCenter(1 / 1.5) }
      ].map((b) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: b.label,
          onClick: b.onClick,
          "aria-label": b.title,
          title: b.title,
          className: "pressable",
          style: {
            width: 30,
            height: 30,
            borderRadius: 8,
            cursor: "pointer",
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            color: TEXT_HI,
            fontSize: 17,
            fontWeight: 600,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-card)"
          }
        },
        b.label
      )), mapZoom.scale > 1.05 && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: resetMapZoom,
          "aria-label": "Reset zoom",
          title: "Reset zoom",
          className: "pressable",
          style: {
            width: 30,
            height: 30,
            borderRadius: 8,
            cursor: "pointer",
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            color: TEXT_BODY,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-card)"
          }
        },
        /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("line", { x1: "22", y1: "12", x2: "18", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "12", x2: "2", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "6", x2: "12", y2: "2" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "22", x2: "12", y2: "18" }))
      )),
      mapZoom.scale > 1.05 && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", bottom: 8, right: 10, zIndex: 6, pointerEvents: "none", fontSize: 10, color: TEXT_DIM, background: "var(--map-bg)", padding: "2px 7px", borderRadius: 6, opacity: 0.85, fontFamily: SANS } }, mapZoom.scale.toFixed(1), "\xD7 \xB7 drag to pan"),
      /* @__PURE__ */ React.createElement("svg", { ref: svgRef, viewBox: `0 0 ${W} ${H}`, style: { position: "absolute", inset: 0, width: "100%", height: "100%", transform: mapZoom.scale > 1 ? `translate(${mapZoom.x}px, ${mapZoom.y}px) scale(${mapZoom.scale})` : void 0, transformOrigin: "0 0", transition: dragging ? "none" : "transform .18s ease" }, shapeRendering: "geometricPrecision" }, /* @__PURE__ */ React.createElement("g", { style: { stroke: RAISE_1 }, strokeWidth: ".5", fill: "none" }, [-60, -30, 0, 30, 60].map((lat) => {
        const [, y] = project(0, lat);
        return /* @__PURE__ */ React.createElement("line", { key: `lat${lat}`, x1: "0", y1: y, x2: W, y2: y });
      }), [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lng) => {
        const [x] = project(lng, 0);
        return /* @__PURE__ */ React.createElement("line", { key: `lng${lng}`, x1: x, y1: "0", x2: x, y2: H });
      })), /* @__PURE__ */ React.createElement("line", { x1: "0", y1: project(0, 0)[1], x2: W, y2: project(0, 0)[1], style: { stroke: RAISE_2 }, strokeWidth: ".5", strokeDasharray: "2 4" }), showCoalitions && /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("pattern", { id: "coalition-stripe-india", patternUnits: "userSpaceOnUse", width: "6", height: "6", patternTransform: "rotate(45)" }, /* @__PURE__ */ React.createElement("rect", { width: "6", height: "6", fill: "rgba(185,28,60,.30)" }), /* @__PURE__ */ React.createElement("rect", { x: "0", y: "0", width: "3", height: "6", fill: "rgba(99,102,241,.32)" }))), atlas && atlas.features.map((f) => {
        const name = f.properties && f.properties.name;
        let fill, isFilled;
        if (showCoalitions) {
          if (COALITION_AMBIVALENT.has(name)) {
            fill = "url(#coalition-stripe-india)";
            isFilled = true;
          } else if (COALITION_BRICS_PLUS.has(name)) {
            fill = "rgba(185,28,60,.40)";
            isFilled = true;
          } else if (COALITION_CRINK_EXTRA.has(name)) {
            fill = "rgba(155,20,50,.55)";
            isFilled = true;
          } else if (COALITION_ALLIES.has(name)) {
            fill = "rgba(99,102,241,.32)";
            isFilled = true;
          } else {
            fill = "rgba(127,127,127,.06)";
            isFilled = false;
          }
        } else {
          fill = COUNTRY_FILL[name] || "rgba(127,127,127,.10)";
          isFilled = !!COUNTRY_FILL[name];
        }
        const clickable = isClickable(name);
        return /* @__PURE__ */ React.createElement(
          "path",
          {
            key: f.id || name,
            className: "geo-path",
            "data-active": clickable,
            d: geoPath(f.geometry),
            fill,
            style: { stroke: isFilled ? "rgba(127,127,127,.55)" : "rgba(127,127,127,.22)" },
            strokeWidth: isFilled ? 0.6 : 0.4,
            strokeLinejoin: "round",
            onMouseEnter: clickable ? (e) => {
              const svg = e.currentTarget.ownerSVGElement;
              const r = svg.getBoundingClientRect();
              const k = drawerKey(name);
              const risk = RISK_COUNTRIES.find((rc) => rc.name === k);
              setHover({
                name: k,
                flag: risk?.flag || "\u{1F310}",
                level: risk?.level || null,
                score: risk?.risk || null,
                x: e.clientX - r.left,
                y: e.clientY - r.top
              });
            } : void 0,
            onMouseMove: clickable ? (e) => {
              const svg = e.currentTarget.ownerSVGElement;
              const r = svg.getBoundingClientRect();
              setHover((h) => h ? { ...h, x: e.clientX - r.left, y: e.clientY - r.top } : h);
            } : void 0,
            onMouseLeave: clickable ? () => setHover(null) : void 0,
            onClick: clickable ? () => openCountry && openCountry(drawerKey(name)) : void 0
          }
        );
      }), !atlas && !atlasErr && /* @__PURE__ */ React.createElement("text", { x: W / 2, y: H / 2, fill: TEXT_DIM, fontSize: "12", fontFamily: SANS, textAnchor: "middle" }, "Loading world atlas\u2026"), atlasErr && /* @__PURE__ */ React.createElement("text", { x: W / 2, y: H / 2, fill: DANGER, fontSize: "11", fontFamily: SANS, textAnchor: "middle" }, "Atlas load failed: ", atlasErr), atlas && (() => {
        const MO = MAP_OVERLAYS || { arcs: [], hotspots: [] };
        const bloomIds = {};
        const bloomList = [];
        const bloomFor = (color) => {
          if (!(color in bloomIds)) {
            bloomIds[color] = `mapbloom-${bloomList.length}`;
            bloomList.push(color);
          }
          return bloomIds[color];
        };
        const KIND = {
          war: { draw: 1.9, glow: 5, glowOp: 0.1, baseOp: 0.2, dur: 5.5, comet: 2.3 },
          strike: { draw: 1.5, glow: 4, glowOp: 0.08, baseOp: 0.16, dur: 6.5, comet: 2 },
          tension: { draw: 1.1, glow: 3.2, glowOp: 0.05, baseOp: 0.12, dur: 9, comet: 1.6 }
        };
        const arcs = (MO.arcs || []).map((a) => {
          const pts = greatCircle(a.from, a.to, 64).map((p) => project(p[0], p[1]));
          let pathLen = 0;
          for (let i = 1; i < pts.length; i++) pathLen += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
          return { ...a, d, pts, pathLen, k: KIND[a.kind] || KIND.strike, bloom: bloomFor(a.color) };
        });
        const hotspots = (MO.hotspots || []).map((h) => ({ ...h, bloom: bloomFor(h.color) }));
        const hormuzBloom = bloomFor("var(--c-danger)");
        return /* @__PURE__ */ React.createElement("g", { "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("defs", null, bloomList.map((color, i) => /* @__PURE__ */ React.createElement("radialGradient", { key: `mapbloom-${i}`, id: `mapbloom-${i}` }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: color, stopOpacity: ".38" }), /* @__PURE__ */ React.createElement("stop", { offset: "55%", stopColor: color, stopOpacity: ".12" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: color, stopOpacity: "0" })))), arcs.map((arc) => {
          const end = arc.pts[arc.pts.length - 1];
          return /* @__PURE__ */ React.createElement("g", { key: `arc-${arc.id}` }, arc.note && /* @__PURE__ */ React.createElement("title", null, arc.note), /* @__PURE__ */ React.createElement("path", { d: arc.d, fill: "none", stroke: arc.color, strokeWidth: arc.k.glow, strokeLinecap: "round", opacity: arc.k.glowOp }), /* @__PURE__ */ React.createElement("path", { d: arc.d, fill: "none", stroke: arc.color, strokeWidth: "0.6", strokeLinecap: "round", strokeDasharray: "2 5", opacity: arc.k.baseOp }), /* @__PURE__ */ React.createElement(
            "path",
            {
              d: arc.d,
              fill: "none",
              stroke: arc.color,
              strokeWidth: arc.k.draw,
              strokeLinecap: "round",
              className: "living-arc",
              style: {
                strokeDasharray: `${arc.pathLen}`,
                "--arc-len": `${arc.pathLen}`,
                animationDelay: `${arc.delay}s`,
                animationDuration: `${arc.k.dur}s`
              }
            }
          ), [
            { r: arc.k.comet, lag: 0, peak: 1 },
            { r: arc.k.comet * 0.62, lag: 0.14, peak: 0.45 },
            { r: arc.k.comet * 0.38, lag: 0.28, peak: 0.22 }
          ].map((t, i) => /* @__PURE__ */ React.createElement("circle", { key: i, r: t.r, fill: arc.color }, /* @__PURE__ */ React.createElement("animateMotion", { dur: `${arc.k.dur}s`, repeatCount: "indefinite", begin: `${arc.delay + t.lag}s`, path: arc.d, keyTimes: "0;0.14;0.72;1", keySplines: "0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1", calcMode: "spline" }), /* @__PURE__ */ React.createElement("animate", { attributeName: "opacity", values: `0;${t.peak};${t.peak};0`, keyTimes: "0;0.14;0.72;1", dur: `${arc.k.dur}s`, repeatCount: "indefinite", begin: `${arc.delay + t.lag}s` }))), /* @__PURE__ */ React.createElement("circle", { cx: end[0], cy: end[1], r: "8.5", fill: `url(#${arc.bloom})`, className: "living-halo", style: { animationDelay: `${arc.delay * 0.7}s`, animationDuration: "5.2s" } }), /* @__PURE__ */ React.createElement("circle", { cx: end[0], cy: end[1], r: "4", fill: "none", stroke: arc.color, strokeWidth: "0.9", opacity: ".55" }), /* @__PURE__ */ React.createElement("circle", { cx: end[0], cy: end[1], r: "1.9", fill: arc.color, opacity: ".95" }), /* @__PURE__ */ React.createElement("circle", { cx: end[0] - 0.5, cy: end[1] - 0.5, r: "0.65", fill: "rgba(255,255,255,.9)" }), arc.endLabel && /* @__PURE__ */ React.createElement("text", { x: end[0] + 7, y: end[1] + 3, fill: arc.color, fontSize: "9", fontFamily: SANS, fontWeight: "600", letterSpacing: ".08em", style: { paintOrder: "stroke", stroke: "var(--map-bg)", strokeWidth: 2 } }, arc.endLabel));
        }), hotspots.map((h) => {
          const [x, y] = project(h.pos[0], h.pos[1]);
          const tx = h.labelSide === "start" ? x - 8 : x + 8;
          const anchor = h.labelSide === "start" ? "end" : "start";
          return /* @__PURE__ */ React.createElement("g", { key: `hotspot-${h.id}` }, /* @__PURE__ */ React.createElement("circle", { cx: x, cy: y, r: "12", fill: `url(#${h.bloom})`, className: "living-halo", style: { animationDelay: `${h.delay}s`, animationDuration: "6.4s" } }), /* @__PURE__ */ React.createElement("circle", { cx: x, cy: y, r: "5", fill: "none", stroke: h.color, strokeWidth: "1.0", className: "living-ring", style: { animationDelay: `${h.delay}s`, animationDuration: "3.2s" } }), /* @__PURE__ */ React.createElement("circle", { cx: x, cy: y, r: "3", fill: "none", stroke: h.color, strokeWidth: "1.2", opacity: ".85" }), /* @__PURE__ */ React.createElement("circle", { cx: x, cy: y, r: "1.4", fill: h.color }), /* @__PURE__ */ React.createElement("circle", { cx: x - 0.4, cy: y - 0.4, r: "0.5", fill: "rgba(255,255,255,.9)" }), /* @__PURE__ */ React.createElement("text", { x: tx, y: y - 4, fill: h.color, fontSize: "11", fontFamily: SANS, fontWeight: "600", letterSpacing: ".06em", textAnchor: anchor, style: { paintOrder: "stroke", stroke: "var(--map-bg)", strokeWidth: 2 } }, h.name), h.sub && /* @__PURE__ */ React.createElement("text", { x: tx, y: y + 7, fill: h.color, fontSize: "8", fontFamily: SANS, fontWeight: "500", opacity: ".8", textAnchor: anchor, style: { paintOrder: "stroke", stroke: "var(--map-bg)", strokeWidth: 2 } }, h.sub));
        }), /* @__PURE__ */ React.createElement("circle", { cx: hormuzX, cy: hormuzY, r: "15", fill: `url(#${hormuzBloom})`, className: "living-halo", style: { animationDuration: "4.6s" } }));
      })(), /* @__PURE__ */ React.createElement("g", { style: { cursor: "pointer" }, onClick: () => openCountry && openCountry("Iran") }, /* @__PURE__ */ React.createElement("circle", { cx: hormuzX, cy: hormuzY, r: "9", fill: "none", stroke: DANGER, strokeWidth: "1", opacity: ".5" }, /* @__PURE__ */ React.createElement("animate", { attributeName: "r", values: "5.5;14;5.5", dur: "3.2s", repeatCount: "indefinite", calcMode: "spline", keyTimes: "0;0.5;1", keySplines: "0.4 0 0.2 1;0.4 0 0.2 1" }), /* @__PURE__ */ React.createElement("animate", { attributeName: "opacity", values: ".65;0;.65", dur: "3.2s", repeatCount: "indefinite", calcMode: "spline", keyTimes: "0;0.5;1", keySplines: "0.4 0 0.2 1;0.4 0 0.2 1" })), /* @__PURE__ */ React.createElement("circle", { cx: hormuzX, cy: hormuzY, r: "9", fill: "none", stroke: DANGER, strokeWidth: "0.8", opacity: ".35" }, /* @__PURE__ */ React.createElement("animate", { attributeName: "r", values: "5.5;14;5.5", dur: "3.2s", begin: "1.6s", repeatCount: "indefinite", calcMode: "spline", keyTimes: "0;0.5;1", keySplines: "0.4 0 0.2 1;0.4 0 0.2 1" }), /* @__PURE__ */ React.createElement("animate", { attributeName: "opacity", values: ".5;0;.5", dur: "3.2s", begin: "1.6s", repeatCount: "indefinite", calcMode: "spline", keyTimes: "0;0.5;1", keySplines: "0.4 0 0.2 1;0.4 0 0.2 1" })), /* @__PURE__ */ React.createElement("circle", { cx: hormuzX, cy: hormuzY, r: "4.5", fill: "none", stroke: DANGER, strokeWidth: "1.4" }), /* @__PURE__ */ React.createElement("circle", { cx: hormuzX, cy: hormuzY, r: "1.8", fill: DANGER }), /* @__PURE__ */ React.createElement("circle", { cx: hormuzX - 0.5, cy: hormuzY - 0.5, r: "0.6", fill: "rgba(255,255,255,.9)" }), /* @__PURE__ */ React.createElement("line", { x1: hormuzX + 5, y1: hormuzY, x2: hormuzX + 22, y2: hormuzY, stroke: DANGER, strokeWidth: ".7" }), /* @__PURE__ */ React.createElement("text", { x: hormuzX + 25, y: hormuzY - 1, fill: DANGER, fontSize: "11", fontFamily: SANS, fontWeight: "600", style: { paintOrder: "stroke", stroke: "var(--map-bg)", strokeWidth: 2 } }, "HORMUZ"), /* @__PURE__ */ React.createElement("text", { x: hormuzX + 25, y: hormuzY + 9, fill: DANGER, fontSize: "11", fontFamily: SANS, fontWeight: "500", style: { paintOrder: "stroke", stroke: "var(--map-bg)", strokeWidth: 2 } }, [HORMUZ_STATUS ? HORMUZ_STATUS.label : null, HORMUZ_NOW ? `${Math.round(HORMUZ_NOW.v)}/day` : null].filter(Boolean).join(" \xB7 ") || "\u2014"), /* @__PURE__ */ React.createElement("circle", { cx: hormuzX, cy: hormuzY, r: "14", fill: "transparent" })), labels.map((l) => {
        const [x, y] = project(l.pos[0], l.pos[1]);
        return /* @__PURE__ */ React.createElement(
          "text",
          {
            key: l.name,
            x: x + (l.dx || 0),
            y,
            fill: l.color,
            fontSize: l.size,
            fontFamily: SANS,
            fontWeight: "600",
            textAnchor: l.anchor || "middle",
            letterSpacing: ".06em",
            style: { paintOrder: "stroke", stroke: "var(--map-bg)", strokeWidth: 2.5, strokeLinejoin: "round" }
          },
          l.name
        );
      }), /* @__PURE__ */ React.createElement("g", { transform: `translate(16, ${H - 26})` }, [
        { color: "rgba(244,63,94,.55)", label: "Active War" },
        { color: "rgba(251,146,60,.6)", label: "Critical" },
        { color: "rgba(234,179,8,.55)", label: "High" },
        { color: "rgba(99,102,241,.55)", label: "Secondary" },
        { color: "rgba(245,158,11,.18)", label: "Aligned / At-Risk" },
        { color: "rgba(148,148,148,.45)", label: "Monitoring" }
      ].map((l, i) => /* @__PURE__ */ React.createElement("g", { key: l.label, transform: `translate(${i * 118}, 0)` }, /* @__PURE__ */ React.createElement("rect", { width: "11", height: "11", rx: "2", fill: l.color, style: { stroke: RAISE_4 }, strokeWidth: ".5" }), /* @__PURE__ */ React.createElement("text", { x: "17", y: "9", fill: TEXT_BODY, fontSize: "11", fontFamily: SANS, fontWeight: "500" }, l.label)))))
    )));
  }
  var STATUS_FILTERS = [
    { key: "confirmed", label: "Confirmed", match: ["confirmed", "historical"], color: GREEN },
    { key: "reported", label: "Reported", match: ["reported", "developing"], color: AMBER },
    { key: "disputed", label: "Disputed", match: ["disputed"], color: DANGER }
  ];
  function statusMatches(itemStatus, selected) {
    if (!selected || selected.length === 0) return true;
    const st = itemStatus ? String(itemStatus).toLowerCase() : "reported";
    return selected.some((key) => {
      const f = STATUS_FILTERS.find((x) => x.key === key);
      return f && f.match.includes(st);
    });
  }
  function NewsList({ news, query, source, arcs, statuses, openCountry }) {
    const filtered = news.filter((n) => {
      if (source && source !== "ALL" && (n.s || "").toUpperCase() !== source) return false;
      if (query && !n.h.toLowerCase().includes(query.toLowerCase()) && !(n.s || "").toLowerCase().includes(query.toLowerCase())) return false;
      if (arcs && arcs.length > 0 && !arcMatches(n.theaters, arcs)) return false;
      if (!statusMatches(n.status, statuses)) return false;
      return true;
    });
    return /* @__PURE__ */ React.createElement(Card, { style: { padding: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 22px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600 } }, "Intelligence Feed \xB7 Most Recent First"), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "live", label: "GDELT" })), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, fontVariantNumeric: "tabular-nums" } }, filtered.length, " of ", news.length)), filtered.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "32px 22px", textAlign: "center", fontSize: 13, color: TEXT_MID } }, "No items match the current filters."), filtered.map((item, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        className: `news-row${item.u ? " news-row-clickable" : ""}`,
        style: { display: "flex", gap: 16, padding: "14px 22px", borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none", alignItems: "baseline" },
        onClick: item.u ? () => window.open(item.u, "_blank", "noopener,noreferrer") : void 0
      },
      /* @__PURE__ */ React.createElement(M, { className: "news-time", style: { fontSize: 12, color: AMBER, flexShrink: 0, fontWeight: 600, fontVariantNumeric: "tabular-nums", width: 50 } }, item.t),
      /* @__PURE__ */ React.createElement("span", { className: "news-source", style: { fontSize: FS.xs, color: TEXT_DIM, flexShrink: 0, width: 90, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 } }, item.s, isTier3State(item.s) && /* @__PURE__ */ React.createElement(
        "span",
        {
          title: "Tier-3 state-media source. Cannot solely substantiate 'confirmed' status; requires tier-1 corroboration for factual claims (statements-of-record exempt).",
          style: {
            fontSize: FS.xs,
            fontWeight: 700,
            color: AMBER,
            background: alpha(AMBER, 0.14),
            border: `1px solid ${alpha(AMBER, 0.35)}`,
            padding: "1px 5px",
            borderRadius: 4,
            letterSpacing: ".08em",
            lineHeight: 1.3,
            cursor: "help"
          }
        },
        "T3"
      )),
      /* @__PURE__ */ React.createElement("div", { className: "news-headline", style: { fontSize: 14, color: TEXT_HI, lineHeight: 1.5, fontWeight: 400 } }, /* @__PURE__ */ React.createElement(StatusBadge, { status: item.status }), item.u ? /* @__PURE__ */ React.createElement("a", { href: item.u, target: "_blank", rel: "noopener noreferrer", className: "news-headline-link", onClick: (e) => e.stopPropagation() }, linkifyCountries(item.h, openCountry)) : linkifyCountries(item.h, openCountry))
    )));
  }
  var TIMELINE_CHAPTERS = window.__DATA__.timeline_chapters;
  function eventMonthLabel(iso) {
    const [y, mm] = String(iso || "").split("-");
    const months = { "01": "January", "02": "February", "03": "March", "04": "April", "05": "May", "06": "June", "07": "July", "08": "August", "09": "September", "10": "October", "11": "November", "12": "December" };
    return `${months[mm] || mm || "\u2014"} ${y || ""}`.trim();
  }
  function TimelineList({ severities, country, arcs, statuses, openCountry, priorVisit }) {
    const reduce = useReducedMotion();
    const isMobile = useIsMobile(768);
    const sevColor = (s) => ({ extreme: DANGER, critical: CRITICAL, high: AMBER })[s] || TEXT_MID;
    const sevLabel = (s) => ({ extreme: "EXTREME", critical: "CRITICAL", high: "HIGH" })[s] || s.toUpperCase();
    const aliases = country ? COUNTRY_KEYS[country]?.aliases || [country] : null;
    const matchCountry = aliases ? makeAliasMatcher(aliases) : null;
    const filtered = [...TIMELINE].reverse().filter((ev) => {
      if (severities && severities.length > 0 && !severities.includes(ev.sev)) return false;
      if (matchCountry && !matchCountry(ev.desc)) return false;
      if (arcs && arcs.length > 0 && !arcMatches(ev.theaters, arcs)) return false;
      if (!statusMatches(ev.status, statuses)) return false;
      return true;
    });
    const TL_PAGE = 30;
    const [tlShown, setTlShown] = useState(TL_PAGE);
    const filtersActive = severities && severities.length > 0 || !!country || arcs && arcs.length > 0 || statuses && statuses.length > 0;
    const renderItems = filtersActive ? filtered : filtered.slice(0, Math.min(tlShown, filtered.length));
    const tlHidden = filtersActive ? 0 : Math.max(0, filtered.length - tlShown);
    const _visitDayKey = (s) => String(s || "").slice(0, 10);
    const priorKey = priorVisit ? _visitDayKey(priorVisit) : null;
    const isNewSinceVisit = (ev) => {
      if (!priorKey) return false;
      const seen = EVENT_FIRST_SEEN[ev.id] || ev.isoDate;
      return _visitDayKey(seen) > priorKey;
    };
    let newCount = 0;
    if (priorKey && !filtersActive) {
      while (newCount < renderItems.length && isNewSinceVisit(renderItems[newCount])) newCount++;
    }
    const showNewBanner = !!priorKey && !filtersActive && newCount > 0;
    const showSeenLine = showNewBanner && newCount < renderItems.length;
    const WORD_ANIM_MS = 150;
    const revealReducer = (state, action) => {
      switch (action.type) {
        case "START_NEXT": {
          if (state.revealing !== null) return state;
          const nextIdx = state.pending.find((i) => !state.completed.has(i));
          if (nextIdx === void 0) return state;
          const wordDelay = action.wordDelay;
          return {
            ...state,
            pending: state.pending.filter((i) => i !== nextIdx),
            revealing: nextIdx,
            wordDelay
          };
        }
        case "COMPLETE": {
          if (state.revealing === null) return state;
          const c = new Set(state.completed);
          c.add(state.revealing);
          return { ...state, completed: c, revealing: null };
        }
        case "RESET_ALL":
          return { pending: action.initialPending || [], revealing: null, completed: action.completed || /* @__PURE__ */ new Set(), wordDelay: 4 };
        default:
          return state;
      }
    };
    const [revealState, dispatchReveal] = useReducer(revealReducer, { pending: [], revealing: null, completed: /* @__PURE__ */ new Set(), wordDelay: 4 });
    const timerRef = useRef(null);
    useEffect(() => {
      const n = renderItems.length;
      if (reduce) {
        dispatchReveal({ type: "RESET_ALL", completed: new Set(Array.from({ length: n }, (_, i) => i)) });
        return;
      }
      dispatchReveal({ type: "RESET_ALL", initialPending: Array.from({ length: n }, (_, i) => i) });
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [filtered.length, filtersActive, reduce]);
    useEffect(() => {
      if (reduce) return;
      if (revealState.revealing !== null) return;
      if (revealState.pending.length === 0) return;
      const nextIdx = revealState.pending.find((i) => !revealState.completed.has(i));
      if (nextIdx === void 0) return;
      const ev = renderItems[nextIdx];
      if (!ev) return;
      const queueLength = revealState.pending.length;
      const wordDelay = queueLength <= 2 ? 8 : queueLength <= 5 ? 5 : 3;
      const wordCount = ev.desc.split(/\s+/).filter(Boolean).length;
      const duration = Math.min(60, Math.max(0, wordCount - 1)) * wordDelay + WORD_ANIM_MS;
      if (timerRef.current) clearTimeout(timerRef.current);
      dispatchReveal({ type: "START_NEXT", wordDelay });
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        dispatchReveal({ type: "COMPLETE" });
      }, duration);
    }, [revealState.revealing, revealState.pending, revealState.completed, filtered, reduce]);
    const railRef = useRef(null);
    const fillRef = useRef(null);
    useEffect(() => {
      let rafId = 0;
      function compute() {
        rafId = 0;
        const el = railRef.current;
        const fill = fillRef.current;
        if (!el || !fill) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const total = r.height - vh * 0.5;
        const passed = -r.top + vh * 0.25;
        const p = Math.max(0, Math.min(1, total > 0 ? passed / total : 0));
        fill.style.height = Math.max(2, p * 100) + "%";
      }
      function onScroll() {
        if (rafId) return;
        rafId = requestAnimationFrame(compute);
      }
      compute();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }, [filtered.length]);
    const grouped = [];
    if (showNewBanner) grouped.push({ kind: "newbanner", count: newCount, key: "nb" });
    let lastMonth = null;
    const renderedChapters = /* @__PURE__ */ new Set();
    for (let i = 0; i < renderItems.length; i++) {
      const ev = renderItems[i];
      if (showSeenLine && i === newCount) grouped.push({ kind: "seenline", key: "sl" });
      const month = eventMonthLabel(ev.isoDate);
      if (month !== lastMonth) {
        grouped.push({ kind: "month", label: month, key: `m-${month}-${i}` });
        lastMonth = month;
      }
      if (TIMELINE_CHAPTERS[ev.isoDate] && !renderedChapters.has(ev.isoDate)) {
        renderedChapters.add(ev.isoDate);
        grouped.push({ kind: "chapter", ev, idx: i, key: `c-${ev.isoDate}-${i}` });
      }
      grouped.push({ kind: "event", ev, idx: i, key: `e-${i}` });
    }
    return /* @__PURE__ */ React.createElement("div", { ref: railRef, className: "tl-rail", style: { position: "relative", paddingRight: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "tl-spine", style: { position: "absolute", left: 108, top: 6, bottom: 6, width: 1, background: `linear-gradient(180deg, ${alpha(DANGER, 0.4)} 0%, ${alpha(AMBER, 0.33)} 35%, ${BORDER} 90%)` } }), /* @__PURE__ */ React.createElement("div", { "aria-hidden": "true", style: { position: "absolute", right: 0, top: 6, bottom: 6, width: 3, borderRadius: 3, background: RAISE_1, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { ref: fillRef, style: { position: "absolute", left: 0, right: 0, top: 0, height: "2%", background: `linear-gradient(180deg, ${DANGER} 0%, ${AMBER} 60%, ${GREEN} 100%)`, borderRadius: 3 } }), renderItems.slice(0, 60).map((ev, i) => {
      const top = i / Math.max(1, renderItems.length - 1) * 100;
      return /* @__PURE__ */ React.createElement("span", { key: i, style: { position: "absolute", right: -2, top: `${top}%`, width: 7, height: 1.5, background: sevColor(ev.sev), opacity: 0.7, borderRadius: 1 } });
    })), filtered.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "32px 22px", textAlign: "center", fontSize: 13, color: TEXT_MID } }, "No events match the current filters."), grouped.map((item) => {
      if (item.kind === "newbanner") {
        return /* @__PURE__ */ React.createElement("div", { key: item.key, style: { position: "relative", margin: "2px 0 18px", paddingLeft: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": true, style: { color: BLUE, fontSize: 13, fontWeight: 700, lineHeight: 1 } }, "\u2193"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.md, fontWeight: 700, color: BLUE, letterSpacing: ".01em" } }, item.count, " new since your last visit"), priorVisit ? /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM } }, "\xB7 ", /* @__PURE__ */ React.createElement(RelativeTime, { since: priorVisit })) : null), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 1, background: `linear-gradient(90deg, ${alpha(BLUE, 0.45)}, transparent)` } })));
      }
      if (item.kind === "seenline") {
        return /* @__PURE__ */ React.createElement("div", { key: item.key, style: { display: "flex", alignItems: "center", gap: 12, margin: "26px 0 14px", paddingLeft: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${BORDER})` } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap" } }, "Seen before this visit"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 1, background: `linear-gradient(90deg, ${BORDER}, transparent)` } }));
      }
      if (item.kind === "month") {
        return /* @__PURE__ */ React.createElement("div", { key: item.key, className: "tl-month-row", style: { position: "sticky", top: 64, zIndex: 3, padding: "6px 0", marginTop: 14, marginBottom: 6, background: "linear-gradient(180deg, var(--bg) 50%, transparent)", display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement(M, { className: "tl-month-label", style: { fontSize: FS.xs, color: TEXT_MID, letterSpacing: ".18em", fontWeight: 700, textTransform: "uppercase", width: 96, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" } }, item.label), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 1, background: `linear-gradient(90deg, ${BORDER}, transparent)` } }));
      }
      if (item.kind === "chapter") {
        const ch = TIMELINE_CHAPTERS[item.ev.isoDate];
        const col2 = sevColor(item.ev.sev);
        return /* @__PURE__ */ React.createElement("div", { key: item.key, className: "tl-chapter", style: { position: "relative", margin: "24px 0 16px", padding: "18px 22px 18px 122px", borderRadius: 14, overflow: "hidden", background: `linear-gradient(115deg, ${alpha(col2, 0.13)} 0%, transparent 60%), conic-gradient(from 200deg at 0% 50%, ${alpha(col2, 0.1)}, transparent 120deg)`, border: `1px solid ${alpha(col2, 0.23)}` } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${col2}, ${alpha(col2, 0.33)})` } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: col2, letterSpacing: ".22em", fontWeight: 700, textTransform: "uppercase" } }, ch.label), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".06em", fontVariantNumeric: "tabular-nums" } }, item.ev.date, ", ", String(item.ev.isoDate || "").slice(0, 4))), /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 18, fontWeight: 600, color: TEXT_HI, marginTop: 6, letterSpacing: "-.012em", lineHeight: 1.35, fontVariationSettings: "'opsz' 18" } }, ch.kicker));
      }
      const ev = item.ev;
      const col = sevColor(ev.sev);
      const idx = item.idx;
      const isCompleted = reduce || revealState.completed.has(idx);
      const isRevealing = revealState.revealing === idx;
      const isChapter = !!TIMELINE_CHAPTERS[ev.isoDate];
      const showInstant = isCompleted || isMobile;
      const words = showInstant ? null : ev.desc.split(/(\s+)/);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: item.key,
          className: "tl-event-row",
          style: { display: "flex", gap: 18, padding: "10px 0", alignItems: "flex-start", position: "relative" }
        },
        /* @__PURE__ */ React.createElement(M, { className: "tl-date", style: { fontSize: 12, color: TEXT_DIM, width: 90, flexShrink: 0, paddingTop: 6, textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" } }, ev.date),
        /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "tl-dot",
            style: {
              width: isChapter ? 12 : 9,
              height: isChapter ? 12 : 9,
              borderRadius: "50%",
              background: col,
              flexShrink: 0,
              marginTop: isChapter ? 7 : 9,
              marginLeft: isChapter ? -1 : 1,
              zIndex: 1,
              boxShadow: `0 0 0 3px var(--bg), 0 0 0 4px ${alpha(col, 0.33)}, 0 0 14px ${alpha(col, 0.53)}`,
              animation: (isRevealing || isCompleted) && !reduce ? "ping 1.2s ease 1" : "none"
            }
          }
        ),
        /* @__PURE__ */ React.createElement("div", { className: "tl-content", style: { flex: 1, paddingBottom: 10, paddingRight: 24 } }, /* @__PURE__ */ React.createElement(SeverityInline, { level: sevLabel(ev.sev), size: 9.5 }), ev.status && ev.status !== "confirmed" && /* @__PURE__ */ React.createElement(React.Fragment, null, " ", /* @__PURE__ */ React.createElement(StatusBadge, { status: ev.status })), /* @__PURE__ */ React.createElement("div", { "aria-label": ev.desc, style: { fontSize: 14, color: TEXT_BODY, lineHeight: 1.65, marginTop: 6 } }, showInstant ? /* @__PURE__ */ React.createElement("span", null, linkifyCountries(ev.desc, openCountry)) : words.map((w, wi) => /\s+/.test(w) ? /* @__PURE__ */ React.createElement("span", { key: wi }, w) : /* @__PURE__ */ React.createElement(
          "span",
          {
            key: wi,
            className: "word-in",
            "aria-hidden": "true",
            style: {
              animationDelay: isRevealing ? `${Math.min(60, wi) * revealState.wordDelay}ms` : "0ms",
              animationDuration: `${WORD_ANIM_MS}ms`,
              animationPlayState: isRevealing ? "running" : "paused"
            }
          },
          linkifyCountries(w, openCountry)
        ))))
      );
    }), tlHidden > 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 0 8px", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          const newShown = Math.min(filtered.length, tlShown + TL_PAGE);
          const newlyAdded = new Set(Array.from({ length: newShown - tlShown }, (_, i) => tlShown + i));
          const c = /* @__PURE__ */ new Set([...revealState.completed, ...newlyAdded]);
          setTlShown(newShown);
          dispatchReveal({ type: "RESET_ALL", completed: c, initialPending: [] });
        },
        style: {
          fontFamily: SANS,
          fontSize: FS.sm,
          fontWeight: 600,
          letterSpacing: ".04em",
          color: TEXT_BODY,
          background: RAISE_1,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: "8px 16px",
          cursor: "pointer"
        }
      },
      "Show ",
      Math.min(TL_PAGE, tlHidden),
      " earlier events",
      /* @__PURE__ */ React.createElement(M, { style: { marginLeft: 8, fontSize: FS.xs, color: TEXT_DIM, fontWeight: 400 } }, "(", tlHidden, " remaining)")
    ), /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM, lineHeight: 1.5 } }, "Search and filters cover all ", filtered.length, " events \u2014 browser Ctrl+F only reaches visible rows")));
  }
  var ARC_FILTERS = [
    { key: "iran", label: "Iran", color: "var(--c-iran)", match: /* @__PURE__ */ new Set(["iran-hormuz"]) },
    { key: "us-brics", label: "US-BRICS", color: "var(--c-brics)", match: /* @__PURE__ */ new Set(["us-brics-rivalry", "us-china", "us-china-cold-war"]) },
    { key: "russia-ukraine", label: "Russia-Ukraine", color: "var(--c-ukraine-war)", match: /* @__PURE__ */ new Set(["russia-ukraine-war", "russia-ukraine"]) },
    { key: "cyber", label: "Cyber", color: BLUE, match: /* @__PURE__ */ new Set(["cyber-infrastructure"]) },
    { key: "sanctions", label: "Sanctions", color: AMBER, match: /* @__PURE__ */ new Set(["sanctions-financial-warfare"]) },
    { key: "markets", label: "Markets", color: GREEN, match: /* @__PURE__ */ new Set(["markets-risk-transmission", "markets"]) }
  ];
  var arcMatches = (itemTheaters, activeArcKeys) => {
    if (!activeArcKeys || activeArcKeys.length === 0) return true;
    if (!Array.isArray(itemTheaters) || itemTheaters.length === 0) return false;
    return activeArcKeys.some((k) => {
      const set = ARC_FILTERS.find((a) => a.key === k)?.match;
      return set && itemTheaters.some((t) => set.has(t));
    });
  };
  function FeedTab({ news, openCountry, initialView, initialCountry, priorVisit }) {
    const [view, setView] = useState(initialView || "timeline");
    const [query, setQuery] = useState("");
    const [source, setSource] = useState("ALL");
    const [severities, setSeverities] = useState([]);
    const [country, setCountry] = useState(initialCountry || null);
    const [arcs, setArcs] = useState([]);
    const toggleArc = (k) => setArcs((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);
    const [statuses, setStatuses] = useState([]);
    const toggleStatus = (k) => setStatuses((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);
    useEffect(() => {
      if (initialCountry !== void 0) setCountry(initialCountry || null);
      if (initialView) setView(initialView);
    }, [initialView, initialCountry]);
    const sources = Array.from(new Set(news.map((n) => (n.s || "").toUpperCase()))).filter(Boolean).sort();
    const SEV_OPTIONS = ["extreme", "critical", "high"];
    const toggleSev = (s) => setSeverities((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { style: { padding: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(FilterChip, { active: view === "news", onClick: () => setView("news"), color: BLUE }, "News (24h) \xB7 ", newsCountForSeverity(WW3_PCT)), /* @__PURE__ */ React.createElement(FilterChip, { active: view === "timeline", onClick: () => setView("timeline"), color: BLUE }, "Full Timeline"), /* @__PURE__ */ React.createElement("span", { style: { width: 1, height: 18, background: BORDER, margin: "0 4px" } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, marginRight: 2 } }, "Arc"), ARC_FILTERS.map((a) => /* @__PURE__ */ React.createElement(FilterChip, { key: a.key, active: arcs.includes(a.key), onClick: () => toggleArc(a.key), color: a.color }, a.label)), arcs.length > 0 && /* @__PURE__ */ React.createElement("button", { onClick: () => setArcs([]), style: { background: "none", border: "none", color: TEXT_MID, fontSize: 11, cursor: "pointer", marginLeft: 4 } }, "clear"), /* @__PURE__ */ React.createElement("span", { style: { width: 1, height: 18, background: BORDER, margin: "0 4px" } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, marginRight: 2 } }, "Status"), STATUS_FILTERS.map((sf) => /* @__PURE__ */ React.createElement(FilterChip, { key: sf.key, active: statuses.includes(sf.key), onClick: () => toggleStatus(sf.key), color: sf.color }, sf.label)), statuses.length > 0 && /* @__PURE__ */ React.createElement("button", { onClick: () => setStatuses([]), style: { background: "none", border: "none", color: TEXT_MID, fontSize: 11, cursor: "pointer", marginLeft: 4 } }, "clear"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), country && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setCountry(null),
        className: "filter-chip",
        style: {
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: ".06em",
          color: "#fff",
          background: DANGER,
          border: `1px solid ${DANGER}`,
          padding: "5px 11px",
          borderRadius: 999,
          cursor: "pointer",
          textTransform: "uppercase"
        }
      },
      "Country: ",
      country,
      " \xD7"
    )), view === "news" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "search",
        value: query,
        onChange: (e) => setQuery(e.target.value),
        placeholder: "Search headlines or sources\u2026",
        style: {
          flex: 1,
          minWidth: 180,
          fontFamily: SANS,
          fontSize: 13,
          color: TEXT_HI,
          background: RAISE_1,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: "8px 12px",
          outline: "none"
        }
      }
    ), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: source,
        onChange: (e) => setSource(e.target.value),
        style: {
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".04em",
          color: TEXT_BODY,
          background: RAISE_1,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: "7px 10px",
          cursor: "pointer",
          outline: "none"
        }
      },
      /* @__PURE__ */ React.createElement("option", { value: "ALL" }, "All sources"),
      sources.map((s) => /* @__PURE__ */ React.createElement("option", { key: s, value: s }, s))
    ))), view === "timeline" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, marginRight: 4 } }, "Severity"), SEV_OPTIONS.map((s) => /* @__PURE__ */ React.createElement(
      FilterChip,
      {
        key: s,
        active: severities.includes(s),
        onClick: () => toggleSev(s),
        color: { extreme: DANGER, critical: CRITICAL, high: AMBER }[s]
      },
      s
    )), severities.length > 0 && /* @__PURE__ */ React.createElement("button", { onClick: () => setSeverities([]), style: { background: "none", border: "none", color: TEXT_MID, fontSize: 11, cursor: "pointer", marginLeft: 6 } }, "clear"))), view === "news" && /* @__PURE__ */ React.createElement(NewsList, { news, query, source, arcs, statuses, openCountry }), view === "timeline" && /* @__PURE__ */ React.createElement(Card, { style: { padding: "18px 22px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", fontWeight: 600, textTransform: "uppercase", marginBottom: 14 } }, "Conflict Timeline \xB7 Feb 28 \u2013 Present \xB7 Most Recent First"), /* @__PURE__ */ React.createElement(TimelineList, { severities, country, arcs, statuses, openCountry, priorVisit })));
  }
  function RiskList({ openCountry, sortBy }) {
    const sorted = [...RISK_COUNTRIES].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.risk - a.risk;
    });
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, sorted.map((c) => {
      const col = SEV_COLOR[c.level] || TEXT_MID;
      const alignCol = barLabelColor(c);
      const clickable = !!COUNTRY_KEYS[c.name];
      return /* @__PURE__ */ React.createElement(
        Card,
        {
          key: c.name,
          className: "card-hover",
          style: { padding: 18, cursor: clickable ? "pointer" : "default", borderLeft: `3px solid ${alignCol}` },
          onClick: clickable ? () => openCountry && openCountry(c.name) : void 0
        },
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 28, lineHeight: 1, flexShrink: 0 } }, c.flag), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { className: "display", style: { fontSize: 17, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.012em", fontVariationSettings: "'opsz' 17" } }, c.name), /* @__PURE__ */ React.createElement(SeverityInline, { level: c.level, size: 9.5 }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, fontWeight: 600, color: alignCol, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 2 } }, barLabel(c)), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 22, fontWeight: 600, color: col, letterSpacing: "-.025em", fontVariantNumeric: "tabular-nums", fontVariationSettings: "'opsz' 22" }, className: "display" }, c.risk))), /* @__PURE__ */ React.createElement("div", { style: { height: 5, background: RAISE_2, borderRadius: 999, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${c.risk}%`, height: "100%", background: col, borderRadius: 999, transition: "width .6s cubic-bezier(.2,.8,.2,1)" } })))),
        /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, lineHeight: 1.6, paddingLeft: 44, fontWeight: 450 } }, c.note)
      );
    }));
  }
  function ActorsTab({ openCountry }) {
    const [sortBy, setSortBy] = useState("risk");
    const theaterOnly = THEATERS.filter((t) => !Object.values(THEATER_BY_ACTOR).includes(t.name));
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, paddingLeft: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", fontWeight: 600, textTransform: "uppercase" } }, "Geopolitical Actors \xB7 Theaters & Players"), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "scenario" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 12 } }, CHESS_PLAYERS.map((p) => {
      const key = p.name === "United States" ? "USA" : p.name.includes("Hezbollah") ? "Lebanon" : p.name.includes("Houthis") ? null : p.name;
      const clickable = key && !!COUNTRY_KEYS[key];
      const theaterName = THEATER_BY_ACTOR[p.name];
      const theater = theaterName ? THEATERS.find((t) => t.name === theaterName) : null;
      return /* @__PURE__ */ React.createElement(
        Card,
        {
          key: p.name,
          className: "card-hover",
          style: { borderLeft: `3px solid ${p.color}`, cursor: clickable ? "pointer" : "default", padding: "18px 20px" },
          onClick: clickable ? () => openCountry && openCountry(key) : void 0
        },
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24, lineHeight: 1, flexShrink: 0 } }, p.flag), /* @__PURE__ */ React.createElement("span", { className: "display", style: { fontSize: 16, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.012em", fontVariationSettings: "'opsz' 16", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.name)), theater ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".06em", fontWeight: 500 } }, "DAY ", daysSince(theater.start)), theater.as_of && /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM } }, "as of ", theater.as_of), /* @__PURE__ */ React.createElement(StaleChip, { asOf: theater.as_of })) : p.as_of ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM } }, "as of ", p.as_of), !p.stale_ok && /* @__PURE__ */ React.createElement(StaleChip, { asOf: p.as_of })) : null),
        theater && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, marginBottom: 10, lineHeight: 1.55 } }, theater.status), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: p.color, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" } }, "Threat"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 5, background: BORDER, borderRadius: 999, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${theater.threat}%`, height: "100%", background: p.color, borderRadius: 999 } })), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, color: p.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" } }, theater.threat, "%"))),
        /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 6 }, "Objective"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, lineHeight: 1.6, fontWeight: 450 } }, linkifyCountries(p.goal, openCountry))),
        /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 6, color: p.color }, "Current Move"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, lineHeight: 1.6, fontWeight: 450 } }, linkifyCountries(p.move, openCountry)))
      );
    }), theaterOnly.map((t) => {
      const clickable = !!COUNTRY_KEYS[t.name];
      return /* @__PURE__ */ React.createElement(
        Card,
        {
          key: t.name,
          className: "card-hover",
          style: { borderLeft: `3px solid ${t.color}`, cursor: clickable ? "pointer" : "default", padding: "18px 20px" },
          onClick: clickable ? () => openCountry && openCountry(t.name) : void 0
        },
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24, lineHeight: 1, flexShrink: 0 } }, t.flag), /* @__PURE__ */ React.createElement("span", { className: "display", style: { fontSize: 16, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.012em", fontVariationSettings: "'opsz' 16" } }, t.name)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".06em", fontWeight: 500 } }, "DAY ", daysSince(t.start)), t.as_of && /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM } }, "as of ", t.as_of), /* @__PURE__ */ React.createElement(StaleChip, { asOf: t.as_of }))),
        /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, marginBottom: 10, lineHeight: 1.55 } }, t.status),
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: t.color, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" } }, "Threat"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 5, background: BORDER, borderRadius: 999, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${t.threat}%`, height: "100%", background: t.color, borderRadius: 999 } })), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, color: t.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" } }, t.threat, "%"))
      );
    })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingLeft: 2, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", fontWeight: 600, textTransform: "uppercase" } }, "Per-Country Risk Index"), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "scenario" }), /* @__PURE__ */ React.createElement(InfoTip, null, 'A 0-100 rating of how deeply each country is caught up in the current conflicts \u2014 how much of a threat it poses, or how exposed it is. This is a comparative rating, not a probability: a country at 70 is not "70% likely" to do anything. It is a different measure from the WW3 percentage at the top of the Overview page, which is a genuine probability estimate.'), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600 } }, "Sort"), /* @__PURE__ */ React.createElement(FilterChip, { active: sortBy === "risk", onClick: () => setSortBy("risk"), color: BLUE }, "Risk score"), /* @__PURE__ */ React.createElement(FilterChip, { active: sortBy === "name", onClick: () => setSortBy("name"), color: BLUE }, "Name")), /* @__PURE__ */ React.createElement(RiskList, { openCountry, sortBy })));
  }
  function EconomyTab({ mkt, gas, openCountry }) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, paddingLeft: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", fontWeight: 600, textTransform: "uppercase" } }, "Gas & Diesel Prices"), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "scenario", label: "AAA \xB7 scenario" })), /* @__PURE__ */ React.createElement(GasTab, { gas }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, paddingLeft: 2, marginTop: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", fontWeight: 600, textTransform: "uppercase" } }, "Markets"), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "live" })), /* @__PURE__ */ React.createElement(MarketsTab, { mkt }));
  }
  function AITab({ targetArc = null, onConsumeTarget } = {}) {
    const parseUpdatedAt = (s) => {
      if (!s) return -1;
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (!m) return -1;
      return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])).getTime();
    };
    const latest = AI_CARDS.reduce((acc, c) => {
      const t = parseUpdatedAt(c.updated_at);
      return t > acc.t ? { t, label: c.updated_at } : acc;
    }, { t: -1, label: "\u2014" });
    const cardRefs = useRef({});
    useEffect(() => {
      if (!targetArc) return;
      const hit = AI_CARDS.find((c) => c.arc === targetArc);
      if (!hit) {
        if (onConsumeTarget) onConsumeTarget();
        return;
      }
      const t = setTimeout(() => {
        const el = cardRefs.current[hit.lens];
        if (el) {
          if (el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
          el.style.boxShadow = `0 0 0 2px ${hit.color}, 0 0 22px ${alpha(hit.color, 0.35)}`;
          setTimeout(() => {
            if (cardRefs.current[hit.lens]) cardRefs.current[hit.lens].style.boxShadow = "";
          }, 2400);
        }
        if (onConsumeTarget) onConsumeTarget();
      }, 70);
      return () => clearTimeout(t);
    }, [targetArc]);
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: alpha(VIOLET, 0.08), border: `1px solid ${alpha(VIOLET, 0.22)}`, borderRadius: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: VIOLET, animation: "ping 1.5s ease infinite", flexShrink: 0 } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, color: VIOLET, letterSpacing: ".06em", fontWeight: 600 } }, "AI Strategic Analysis \xB7 Claude Opus 4.7"), /* @__PURE__ */ React.createElement("span", { style: { width: 1, height: 14, background: alpha(VIOLET, 0.25) } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, color: TEXT_BODY, fontWeight: 500 } }, "Epic Fury \xB7 US-BRICS Rivalry \xB7 Russia-Ukraine"), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, marginLeft: "auto", fontVariantNumeric: "tabular-nums" } }, "Latest card: ", latest.label)), AI_CARDS.map((c) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: c.lens,
        ref: (el) => {
          cardRefs.current[c.lens] = el;
        },
        style: { borderRadius: 14, scrollMarginTop: 80, transition: "box-shadow .35s ease" }
      },
      /* @__PURE__ */ React.createElement(AICard, { c })
    )));
  }
  function AICard({ c }) {
    const [expanded, setExpanded] = useState(false);
    const confColor = c.confidence === "HIGH" ? GREEN : c.confidence === "MODERATE" ? AMBER : DANGER;
    const hasBody = !!(c.body && c.body.trim());
    const hasSummary = !!(c.summary && c.summary.trim());
    const showBody = expanded || !hasSummary;
    return /* @__PURE__ */ React.createElement(Card, { style: { borderLeft: `3px solid ${c.color}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, c.icon), /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: c.color, letterSpacing: ".14em", fontWeight: 600, textTransform: "uppercase" } }, c.lens), c.updated_at && /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM, fontVariantNumeric: "tabular-nums" } }, c.updated_at), c.confidence && /* @__PURE__ */ React.createElement("span", { style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: FS.xs,
      fontWeight: 600,
      letterSpacing: ".12em",
      textTransform: "uppercase",
      color: confColor,
      padding: "2px 9px",
      borderRadius: 999,
      background: alpha(confColor, 0.1),
      border: `1px solid ${alpha(confColor, 0.28)}`,
      marginLeft: "auto"
    } }, /* @__PURE__ */ React.createElement("span", { style: { width: 5, height: 5, borderRadius: "50%", background: confColor } }), c.confidence, " confidence", c.confidenceNote && /* @__PURE__ */ React.createElement(InfoTip, null, c.confidenceNote))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 600, color: TEXT_HI, marginBottom: 14, letterSpacing: "-.01em", lineHeight: 1.3 } }, c.title), hasSummary && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14.5, color: TEXT_HI, lineHeight: 1.65, fontWeight: 450 } }, linkifyText(c.summary)), hasBody && hasSummary && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setExpanded((v) => !v),
        className: "pressable",
        style: {
          background: "none",
          border: "none",
          padding: 0,
          marginTop: 12,
          color: c.color,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".04em",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start"
        }
      },
      expanded ? "\u2212 Hide full analysis" : "+ Read full analysis"
    ), hasBody && showBody && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14, marginTop: hasSummary ? 14 : 0, paddingTop: hasSummary ? 14 : 0, borderTop: hasSummary ? `1px solid ${BORDER}` : "none" } }, c.body.split("\n\n").map((para, i) => {
      const [head, ...rest] = para.split(": ");
      if (rest.length && head === head.toUpperCase() && head.length < 30) {
        return /* @__PURE__ */ React.createElement("div", { key: i }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: c.color, fontWeight: 600, letterSpacing: ".12em", display: "block", marginBottom: 6, textTransform: "uppercase" } }, head), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: TEXT_BODY, lineHeight: 1.7 } }, linkifyText(rest.join(": "))));
      }
      return /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 14, color: TEXT_BODY, lineHeight: 1.7 } }, linkifyText(para));
    })));
  }
  var OUT_PROB_COLOR = (p) => p >= 0.66 ? DANGER : p >= 0.34 ? AMBER : GREEN;
  function fmtResolve(dateStr) {
    if (!dateStr) return null;
    const d = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    const days = Math.ceil((d - NOW) / 864e5);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (days < 0) return { label, sub: "closed", over: true };
    if (days === 0) return { label, sub: "today", soon: true };
    if (days === 1) return { label, sub: "1 day", soon: true };
    return { label, sub: `${days} days`, soon: days <= 7 };
  }
  var OutTheaterChip = ({ name }) => name ? /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, background: RAISE_2, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" } }, name) : null;
  function ForecastRow({ f, openCountry }) {
    const [open, setOpen] = useState(false);
    const p = f.probability;
    const pc = OUT_PROB_COLOR(p);
    const dl = fmtResolve(f.deadline);
    const hasDetail = !!(f.resolution_criteria || f.surprise_if_wrong || f.latest_reason);
    return /* @__PURE__ */ React.createElement(Card, { className: "card-hover", style: { padding: 16 } }, /* @__PURE__ */ React.createElement("div", { onClick: hasDetail ? () => setOpen((v) => !v) : void 0, style: { display: "flex", gap: 14, alignItems: "flex-start", cursor: hasDetail ? "pointer" : "default" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 34, flexShrink: 0, textAlign: "right", paddingTop: 1 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 15, fontWeight: 600, color: pc, fontVariantNumeric: "tabular-nums", lineHeight: 1 } }, Math.round(p * 100), /* @__PURE__ */ React.createElement("span", { style: { fontSize: FS.xs, color: TEXT_DIM, fontWeight: 600 } }, "%"))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: TEXT_HI, lineHeight: 1.5, fontWeight: 500 } }, linkifyText(f.question, openCountry)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(OutTheaterChip, { name: f.theater }), dl && /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_MID, fontVariantNumeric: "tabular-nums" } }, "resolves ", dl.label, " \xB7 ", /* @__PURE__ */ React.createElement("span", { style: { color: dl.over ? TEXT_DIM : dl.soon ? AMBER : TEXT_MID } }, dl.sub)), hasDetail && /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: pc, fontWeight: 600 } }, open ? "\u2212 less" : "details +")))), open && hasDetail && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 11 } }, f.resolution_criteria && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 5, color: BLUE }, "How it resolves"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: TEXT_BODY, lineHeight: 1.6 } }, linkifyText(f.resolution_criteria, openCountry))), f.latest_reason && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 5 }, "Latest read"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: TEXT_BODY, lineHeight: 1.6 } }, linkifyText(f.latest_reason, openCountry))), f.surprise_if_wrong && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 5, color: AMBER }, "What it would mean if wrong"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: TEXT_BODY, lineHeight: 1.6 } }, linkifyText(f.surprise_if_wrong, openCountry)))));
  }
  function CalibrationPanel({ cal }) {
    const [showResolved, setShowResolved] = useState(false);
    if (!cal || !cal.total_resolved) return null;
    const brier = cal.brier;
    const brierColor = brier == null ? TEXT_MID : brier <= 0.18 ? GREEN : brier <= 0.25 ? AMBER : DANGER;
    const liveBuckets = (cal.buckets || []).filter((b) => b.predicted > 0);
    const resolved = cal.resolved || [];
    const hits = resolved.filter((r) => r.hit).length;
    return /* @__PURE__ */ React.createElement(Card, { style: { padding: 22 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", fontWeight: 600, textTransform: "uppercase" } }, "Track Record \xB7 Calibration"), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "scenario" })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 30, flexWrap: "wrap", marginBottom: liveBuckets.length ? 20 : 4 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(M, { className: "display", style: { fontSize: 30, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.025em", lineHeight: 1 } }, cal.total_resolved), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, marginTop: 5 } }, "forecasts resolved")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(M, { className: "display", style: { fontSize: 30, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.025em", lineHeight: 1 } }, hits, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, color: TEXT_DIM, fontWeight: 500 } }, "/", cal.total_resolved)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, marginTop: 5 } }, "called correctly")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(M, { className: "display", style: { fontSize: 30, fontWeight: 600, color: brierColor, letterSpacing: "-.025em", lineHeight: 1 } }, brier == null ? "\u2014" : brier.toFixed(2)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, marginTop: 5, display: "inline-flex", alignItems: "center" } }, "Brier score", /* @__PURE__ */ React.createElement(InfoTip, null, "Mean squared error of each forecast's opening probability against what actually happened. Lower is better; 0.25 is what you'd score always guessing 50%.")))), liveBuckets.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 9 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 2 }, "Reliability \u2014 of the calls we rated\u2026"), liveBuckets.map((b) => {
      const rate = b.predicted ? b.occurred / b.predicted : 0;
      return /* @__PURE__ */ React.createElement("div", { key: b.label, style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement(M, { style: { width: 64, fontSize: 11.5, color: TEXT_MID, fontVariantNumeric: "tabular-nums", flexShrink: 0 } }, b.label), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 6, background: RAISE_2, borderRadius: 999, overflow: "hidden", minWidth: 60 } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${Math.round(rate * 100)}%`, height: "100%", background: BLUE, borderRadius: 999, transition: "width .6s cubic-bezier(.2,.8,.2,1)" } })), /* @__PURE__ */ React.createElement(M, { style: { width: 126, fontSize: 11, color: TEXT_DIM, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" } }, b.occurred, " of ", b.predicted, " happened"));
    })), resolved.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowResolved((v) => !v), className: "pressable", style: { background: "none", border: "none", padding: 0, marginTop: 16, color: BLUE, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignSelf: "flex-start" } }, showResolved ? "\u2212 Hide resolved forecasts" : `+ Show all ${resolved.length} resolved forecasts`), showResolved && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 13, display: "flex", flexDirection: "column", gap: 9 } }, resolved.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12.5, lineHeight: 1.55 } }, /* @__PURE__ */ React.createElement("span", { style: { flexShrink: 0, color: r.hit ? GREEN : DANGER, fontWeight: 700, width: 13 } }, r.hit ? "\u2713" : "\u2717"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0, color: TEXT_BODY } }, scrubCodes(r.question), /* @__PURE__ */ React.createElement(M, { style: { color: TEXT_DIM, marginLeft: 6, fontSize: 11, whiteSpace: "nowrap" } }, "called ", Math.round(r.initial_probability * 100), "% \xB7 ", r.occurred ? "happened" : "did not")))))));
  }
  function IndicatorRow({ ind, openCountry }) {
    const [open, setOpen] = useState(false);
    const esc = ind.type !== "de-escalation";
    const col = esc ? DANGER : GREEN;
    const sig = typeof ind.signal === "number" ? ind.signal : 0;
    const thr = typeof ind.threshold === "number" ? ind.threshold : null;
    const hasDetail = !!(thr != null || ind.watch_window_end || ind.latest_evidence || ind.theater);
    return /* @__PURE__ */ React.createElement(Card, { className: hasDetail ? "card-hover" : void 0, style: { padding: "10px 14px", borderLeft: `3px solid ${alpha(col, 0.55)}` } }, /* @__PURE__ */ React.createElement("div", { onClick: hasDetail ? () => setOpen((v) => !v) : void 0, style: { display: "flex", alignItems: "center", gap: 10, cursor: hasDetail ? "pointer" : "default" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: col, flexShrink: 0, minWidth: 46 } }, esc ? "Esc" : "De-esc"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0, fontSize: 12.5, color: TEXT_HI, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, linkifyText(ind.indicator, openCountry)), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: col, fontWeight: 600, fontVariantNumeric: "tabular-nums", flexShrink: 0 } }, Math.round(sig * 100), "%"), hasDetail && /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, flexShrink: 0, width: 9, textAlign: "center" } }, open ? "\u2212" : "+")), open && hasDetail && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 9 } }, ind.theater && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(OutTheaterChip, { name: ind.theater })), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: 6, background: RAISE_2, borderRadius: 999 } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${Math.round(sig * 100)}%`, height: "100%", background: col, borderRadius: 999, transition: "width .6s cubic-bezier(.2,.8,.2,1)" } }), thr != null && /* @__PURE__ */ React.createElement("div", { title: `Activates at ${Math.round(thr * 100)}%`, style: { position: "absolute", left: `${Math.round(thr * 100)}%`, top: -3, width: 2, height: 12, background: TEXT_HI, opacity: 0.45, borderRadius: 2 } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: col, fontWeight: 600, fontVariantNumeric: "tabular-nums" } }, "signal ", Math.round(sig * 100), "%", thr != null && /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_DIM, fontWeight: 500 } }, " \xB7 fires at ", Math.round(thr * 100), "%")), ind.watch_window_end && /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM, fontVariantNumeric: "tabular-nums" } }, "watch thru ", (/* @__PURE__ */ new Date(ind.watch_window_end + "T00:00:00")).toLocaleDateString("en-US", { month: "short", day: "numeric" }))), ind.latest_evidence && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: TEXT_BODY, lineHeight: 1.55 } }, linkifyText(ind.latest_evidence, openCountry))));
  }
  var GAP_PRI = { critical: { c: DANGER, label: "Critical" }, important: { c: AMBER, label: "Important" }, monitoring: { c: BLUE, label: "Monitoring" } };
  function GapRow({ g, openCountry }) {
    const [open, setOpen] = useState(false);
    const pri = GAP_PRI[g.priority] || { c: TEXT_MID, label: g.priority };
    const hasDetail = !!(g.why_it_matters || g.collection_status || g.theater);
    return /* @__PURE__ */ React.createElement(Card, { className: hasDetail ? "card-hover" : void 0, style: { padding: "10px 14px", borderLeft: `3px solid ${alpha(pri.c, 0.55)}` } }, /* @__PURE__ */ React.createElement("div", { onClick: hasDetail ? () => setOpen((v) => !v) : void 0, style: { display: "flex", alignItems: "center", gap: 10, cursor: hasDetail ? "pointer" : "default" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: pri.c, flexShrink: 0, minWidth: 64 } }, pri.label), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0, fontSize: 12.5, color: TEXT_HI, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, linkifyText(g.question, openCountry)), g.days_open != null && /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM, flexShrink: 0, fontVariantNumeric: "tabular-nums" } }, "open ", g.days_open, "d"), hasDetail && /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, flexShrink: 0, width: 9, textAlign: "center" } }, open ? "\u2212" : "+")), open && hasDetail && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 8 } }, g.theater && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(OutTheaterChip, { name: g.theater })), g.why_it_matters && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, color: TEXT_BODY, lineHeight: 1.6 } }, linkifyText(g.why_it_matters, openCountry)), g.collection_status && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: TEXT_DIM, lineHeight: 1.55, fontStyle: "italic" } }, linkifyText(g.collection_status, openCountry))));
  }
  function OutlookTab({ openCountry }) {
    const data = OUTLOOK || {};
    const [showAllFc, setShowAllFc] = useState(false);
    const FC_CAP = 6;
    const forecasts = Array.isArray(data.forecasts) ? data.forecasts : [];
    const openForecasts = forecasts.filter((f) => f.status === "open").sort((a, b) => (a.deadline || "9999-12-31").localeCompare(b.deadline || "9999-12-31"));
    const indicators = Array.isArray(data.indicators) ? data.indicators : [];
    const escalators = indicators.filter((i) => i.type !== "de-escalation").sort((a, b) => (b.signal || 0) - (a.signal || 0));
    const deescalators = indicators.filter((i) => i.type === "de-escalation").sort((a, b) => (b.signal || 0) - (a.signal || 0));
    const gaps = Array.isArray(data.gaps) ? data.gaps : [];
    const PRI_ORDER = { critical: 0, important: 1, monitoring: 2 };
    const sortedGaps = [...gaps].sort((a, b) => (PRI_ORDER[a.priority] ?? 3) - (PRI_ORDER[b.priority] ?? 3) || (b.days_open || 0) - (a.days_open || 0));
    const SectionHead = ({ children, count }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, paddingLeft: 2, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".12em", fontWeight: 600, textTransform: "uppercase" } }, children), count != null && /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, fontVariantNumeric: "tabular-nums" } }, count), /* @__PURE__ */ React.createElement(SourceBadge, { kind: "scenario" }));
    const empty = openForecasts.length === 0 && indicators.length === 0 && sortedGaps.length === 0 && !(data.calibration && data.calibration.total_resolved);
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: alpha(BLUE, 0.07), border: `1px solid ${alpha(BLUE, 0.22)}`, borderRadius: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", color: BLUE } }, /* @__PURE__ */ React.createElement(Icon, { name: "outlook", size: 18 })), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, color: BLUE, letterSpacing: ".06em", fontWeight: 600 } }, "Outlook \xB7 Forecasts & Track Record"), /* @__PURE__ */ React.createElement("span", { style: { width: 1, height: 14, background: alpha(BLUE, 0.25) } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, color: TEXT_BODY, fontWeight: 500 } }, "Named, dated, falsifiable calls \u2014 scored against what actually happened.")), /* @__PURE__ */ React.createElement(CalibrationPanel, { cal: data.calibration }), openForecasts.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement(SectionHead, { count: openForecasts.length }, "Open Forecasts \xB7 Soonest First"), (showAllFc ? openForecasts : openForecasts.slice(0, FC_CAP)).map((f, i) => /* @__PURE__ */ React.createElement(ForecastRow, { key: i, f, openCountry })), openForecasts.length > FC_CAP && /* @__PURE__ */ React.createElement("button", { onClick: () => setShowAllFc((v) => !v), className: "pressable", style: { background: "none", border: "none", padding: 0, marginTop: 2, color: BLUE, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignSelf: "flex-start" } }, showAllFc ? "\u2212 Show fewer" : `+ Show all ${openForecasts.length} forecasts`)), (escalators.length > 0 || deescalators.length > 0) && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement(SectionHead, { count: indicators.length }, "Leading Indicators \xB7 Escalation & De-escalation"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, escalators.map((ind, i) => /* @__PURE__ */ React.createElement(IndicatorRow, { key: `e${i}`, ind, openCountry })), deescalators.map((ind, i) => /* @__PURE__ */ React.createElement(IndicatorRow, { key: `d${i}`, ind, openCountry })))), sortedGaps.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement(SectionHead, { count: sortedGaps.length }, "Open Questions \xB7 What We're Still Confirming"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, sortedGaps.map((g, i) => /* @__PURE__ */ React.createElement(GapRow, { key: i, g, openCountry })))), empty && /* @__PURE__ */ React.createElement(Card, { style: { padding: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_DIM } }, "No forecasts, indicators, or intelligence gaps are currently being tracked.")));
  }
  var FETCH_TIMEOUT_MS = 8e3;
  async function fetchWithTimeout(url, ms = FETCH_TIMEOUT_MS, opts = {}) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), ms);
    try {
      return await fetch(url, { ...opts, signal: ac.signal });
    } finally {
      clearTimeout(t);
    }
  }
  var PRICE_CACHE_KEY = "ww3dash.priceCache.v1";
  var priceCache = {
    read() {
      try {
        return JSON.parse(localStorage.getItem(PRICE_CACHE_KEY) || "{}") || {};
      } catch {
        return {};
      }
    },
    write(patch) {
      try {
        const cur = priceCache.read();
        const next = { ...cur, ...patch, _ts: Date.now() };
        localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(next));
      } catch (_) {
      }
    }
  };
  var VISIT_KEY = "ww3dash.lastVisit.v1";
  var visitStore = {
    read() {
      try {
        return localStorage.getItem(VISIT_KEY) || null;
      } catch {
        return null;
      }
    },
    write() {
      try {
        localStorage.setItem(VISIT_KEY, (/* @__PURE__ */ new Date()).toISOString());
      } catch (_) {
      }
    }
  };
  var GAS_SERIES_KEY = "ww3dash.gasSeries.v1";
  var gasSeries = {
    read() {
      try {
        const v = JSON.parse(localStorage.getItem(GAS_SERIES_KEY) || "[]");
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    },
    // Upsert one or more dated rows in a single pass. Each row may set any
    // subset of {nat, ca, oh, cin}; existing fields on the same date are
    // preserved when not overridden.
    upsertRows(rows) {
      if (!Array.isArray(rows) || rows.length === 0) return;
      try {
        const cur = gasSeries.read();
        const byDate = new Map(cur.map((r) => [r.date, r]));
        for (const r of rows) {
          if (!r || !r.date) continue;
          const prev = byDate.get(r.date) || { date: r.date };
          byDate.set(r.date, { ...prev, ...r });
        }
        const next = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
        const trimmed = next.length > 400 ? next.slice(next.length - 400) : next;
        localStorage.setItem(GAS_SERIES_KEY, JSON.stringify(trimmed));
      } catch (_) {
      }
    },
    upsertToday(values) {
      gasSeries.upsertRows([{ date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), ...values }]);
    }
  };
  function dateOffsetISO(daysAgo) {
    const d = /* @__PURE__ */ new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }
  var numOrNull = (x) => Number.isFinite(x) ? +(+x).toFixed(2) : null;
  function staleness(asOf) {
    if (!asOf) return { live: false, label: "\u2014", stale: true };
    const ms = Date.now() - asOf;
    if (ms < 6e4) return { live: true, label: "live", stale: false };
    if (ms < 3e5) return { live: false, label: `${Math.round(ms / 6e4)}m ago`, stale: false };
    if (ms < 18e5) return { live: false, label: `${Math.round(ms / 6e4)}m ago`, stale: false };
    if (ms < 864e5) return { live: false, label: `${Math.round(ms / 36e5)}h ago`, stale: true };
    return { live: false, label: "stale", stale: true };
  }
  var YF_SYMBOLS = ["^GSPC", "^DJI", "^IXIC", "GC=F", "CL=F", "BZ=F"];
  var YF_TILE = { "^GSPC": "SPX", "^DJI": "DOW", "^IXIC": "NDX", "GC=F": "GOLD", "CL=F": "WTI", "BZ=F": "BRENT" };
  var STOOQ_MAP = { "^GSPC": "^spx", "^DJI": "^dji", "^IXIC": "^ndq", "GC=F": "gc.f", "CL=F": "cl.f", "BZ=F": "cb.f" };
  var YF_CHART = (s) => `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}`;
  var YF_SPARK = (syms) => `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${syms.map(encodeURIComponent).join(",")}&range=1d&interval=5m`;
  var YF_PROXIES = [
    (url) => "https://corsproxy.io/?" + encodeURIComponent(url),
    (url) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(url),
    (url) => "https://api.codetabs.com/v1/proxy/?quest=" + encodeURIComponent(url)
  ];
  async function mapLimit(items, limit, fn) {
    const results = new Array(items.length);
    let next = 0;
    async function worker() {
      while (next < items.length) {
        const i = next++;
        try {
          results[i] = await fn(items[i], i);
        } catch (_) {
          results[i] = null;
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
  }
  async function tryProxies(buildUrl, parse, timeout = FETCH_TIMEOUT_MS, startAt = 0) {
    let lastErr;
    const n = YF_PROXIES.length;
    for (let k = 0; k < n; k++) {
      const proxyMaker = YF_PROXIES[(startAt + k) % n];
      try {
        const r = await fetchWithTimeout(proxyMaker(buildUrl), timeout);
        if (!r.ok) {
          lastErr = new Error("status " + r.status);
          continue;
        }
        const parsed = await parse(r);
        if (parsed != null) return parsed;
        lastErr = new Error("parse returned null");
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("all proxies failed");
  }
  async function fetchYahooSpark() {
    return tryProxies(YF_SPARK(YF_SYMBOLS), async (r) => {
      const json = await r.json();
      const out = [];
      const add = (sym, price, prev) => {
        if (!sym || !(price > 0)) return;
        const chgPct = prev > 0 ? (price - prev) / prev * 100 : 0;
        out.push({ symbol: sym, regularMarketPrice: price, regularMarketChangePercent: chgPct });
      };
      if (json && json.spark && Array.isArray(json.spark.result)) {
        for (const res of json.spark.result) {
          const meta = res?.response?.[0]?.meta;
          if (meta) add(res.symbol, meta.regularMarketPrice, meta.chartPreviousClose ?? meta.previousClose);
        }
      } else if (json && typeof json === "object") {
        for (const sym of YF_SYMBOLS) {
          const res = json[sym];
          if (!res) continue;
          const closes = Array.isArray(res.close) ? res.close.filter((x) => x != null) : [];
          const price = res.regularMarketPrice != null ? res.regularMarketPrice : closes.length ? closes[closes.length - 1] : null;
          add(sym, price, res.chartPreviousClose ?? res.previousClose);
        }
      }
      return out.length ? out : null;
    });
  }
  async function fetchYahooSymbol(sym, startAt = 0) {
    return tryProxies(YF_CHART(sym), async (r) => {
      const json = await r.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta || !(meta.regularMarketPrice > 0)) return null;
      const prev = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
      const chgPct = prev > 0 ? (meta.regularMarketPrice - prev) / prev * 100 : 0;
      return {
        symbol: sym,
        regularMarketPrice: meta.regularMarketPrice,
        regularMarketChangePercent: chgPct
      };
    }, FETCH_TIMEOUT_MS, startAt);
  }
  async function fetchStooq(sym) {
    const ss = STOOQ_MAP[sym];
    if (!ss) throw new Error("stooq: no mapping for " + sym);
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(ss)}&f=sd2t2ohlcv&h&e=csv`;
    const r = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!r.ok) throw new Error("stooq " + r.status);
    const text = await r.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error("stooq no data");
    const cols = lines[1].split(",");
    const open = parseFloat(cols[3]);
    const close = parseFloat(cols[6]);
    if (!(close > 0)) throw new Error("stooq invalid close");
    const chgPct = open > 0 ? (close - open) / open * 100 : 0;
    return { symbol: sym, regularMarketPrice: close, regularMarketChangePercent: chgPct };
  }
  async function fetchSymbolResilient(sym, startAt = 0) {
    try {
      return await fetchYahooSymbol(sym, startAt);
    } catch (_) {
    }
    try {
      return await fetchStooq(sym);
    } catch (_) {
    }
    const tile = YF_TILE[sym];
    const c = tile ? priceCache.read()[tile] : null;
    if (c && c.price != null) {
      return { symbol: sym, regularMarketPrice: c.price, regularMarketChangePercent: c.chg ?? 0, _fromCache: true, _asOf: c.asOf };
    }
    throw new Error(sym + ": all sources failed (Yahoo+Stooq+cache empty)");
  }
  async function fetchYahooMarkets() {
    const collected = /* @__PURE__ */ new Map();
    try {
      for (const q of await fetchYahooSpark()) collected.set(q.symbol, q);
    } catch (_) {
    }
    const missing = YF_SYMBOLS.filter((s) => !collected.has(s));
    if (missing.length) {
      const filled = await mapLimit(missing, 2, (s, i) => fetchSymbolResilient(s, i));
      for (const q of filled) if (q) collected.set(q.symbol, q);
    }
    const ok = Array.from(collected.values());
    if (ok.length === 0) throw new Error("All market symbols failed");
    return { quoteResponse: { result: ok } };
  }
  var AAA_HOST = "https://gasprices.aaa.com";
  function extractAaaPrice(html) {
    const m = html.match(/Today['’]?s\s+AAA[^$]*\$([1-9]\.\d{2,4})/i);
    if (m) return parseFloat(m[1]);
    const all = html.match(/\$([1-9]\.\d{2,3})\b/g);
    if (all && all.length > 0) return parseFloat(all[0].slice(1));
    return null;
  }
  function extractAaaLadderAfter(html, anchorRegex) {
    const m = anchorRegex.exec(html);
    if (!m) return null;
    const start = m.index + m[0].length;
    const slice = html.slice(start, start + 6e3);
    const re = /Avg\.<\/td>\s*<td>\s*\$([1-9]\.\d{2,3})/gi;
    const labels = ["current", "yesterday", "weekAgo", "monthAgo", "yearAgo"];
    const out = {};
    let mm, i = 0;
    while ((mm = re.exec(slice)) !== null && i < labels.length) {
      out[labels[i++]] = parseFloat(mm[1]);
    }
    return Object.keys(out).length > 0 ? out : null;
  }
  function extractAaaNationalLadder(html) {
    return extractAaaLadderAfter(html, /(?=Current Avg)/);
  }
  function extractAaaNationalDiesel(html) {
    const m = /(?=Current Avg)/.exec(html);
    if (!m) return null;
    const tableStart = html.lastIndexOf("<table", m.index);
    if (tableStart < 0) return null;
    const heads = [...html.slice(tableStart, m.index).matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((h) => h[1].replace(/<[^>]*>/g, "").trim());
    const col = heads.findIndex((t) => /^diesel$/i.test(t)) - 1;
    if (col < 0) return null;
    const keys = { "current": "current", "yesterday": "yesterday", "week ago": "weekAgo", "month ago": "monthAgo", "year ago": "yearAgo" };
    const rowRe = /<td>\s*(Current|Yesterday|Week Ago|Month Ago|Year Ago)\s+Avg\.\s*<\/td>([\s\S]*?)<\/tr>/gi;
    const slice = html.slice(tableStart, tableStart + 8e3);
    const out = {};
    let rm;
    while ((rm = rowRe.exec(slice)) !== null) {
      const prices = [...rm[2].matchAll(/\$(\d{1,2}\.\d{2,4})/g)].map((p) => parseFloat(p[1]));
      if (prices.length !== heads.length - 1) continue;
      const v = prices[col];
      if (v > 1 && v < 20) out[keys[rm[1].toLowerCase()]] = +v.toFixed(3);
    }
    return Object.keys(out).length > 0 ? out : null;
  }
  function extractAaaStateLadder(html, stateName) {
    return extractAaaLadderAfter(html, new RegExp(stateName + "[\\s\\S]{0,80}average gas prices", "i"));
  }
  function extractAaaMetroLadder(html, metro) {
    return extractAaaLadderAfter(html, new RegExp(metro, "i"));
  }
  async function fetchAaaRegion(path, parseLadder, parseDiesel) {
    return tryProxies(AAA_HOST + path, async (r) => {
      const html = await r.text();
      const ladder = parseLadder ? parseLadder(html) : null;
      const price = ladder && ladder.current != null ? ladder.current : extractAaaPrice(html);
      if (price == null) return null;
      let diesel = null;
      try {
        diesel = parseDiesel ? parseDiesel(html) : null;
      } catch (_) {
      }
      return { price, ladder, diesel };
    });
  }
  async function fetchAaaCincinnatiRegion() {
    try {
      return await tryProxies(AAA_HOST + "/?state=OH", async (r) => {
        const html = await r.text();
        const ladder = extractAaaMetroLadder(html, "Cincinnati");
        const price = ladder?.current ?? null;
        if (price == null) return null;
        return { price, ladder };
      });
    } catch (_) {
    }
    return null;
  }
  async function fetchAaaGas() {
    const [nat, ca, oh, cin] = await Promise.allSettled([
      fetchAaaRegion("/", (html) => extractAaaNationalLadder(html), (html) => extractAaaNationalDiesel(html)),
      fetchAaaRegion("/?state=CA", (html) => extractAaaStateLadder(html, "California")),
      fetchAaaRegion("/?state=OH", (html) => extractAaaStateLadder(html, "Ohio")),
      fetchAaaCincinnatiRegion()
    ]);
    const unpack = (r) => r.status === "fulfilled" && r.value ? r.value : null;
    const out = {
      national: unpack(nat),
      california: unpack(ca),
      ohio: unpack(oh),
      cincinnati: unpack(cin)
    };
    if (!out.national && !out.california && !out.ohio && !out.cincinnati) {
      throw new Error("All AAA regions failed");
    }
    return out;
  }
  function aaaLadderToRows(ladder, fieldName) {
    if (!ladder) return [];
    const offsets = { current: 0, yesterday: 1, weekAgo: 7, monthAgo: 30, yearAgo: 365 };
    const rows = [];
    for (const [k, v] of Object.entries(ladder)) {
      if (v == null || !isFinite(v)) continue;
      const off = offsets[k];
      if (off == null) continue;
      rows.push({ date: dateOffsetISO(off), [fieldName]: v });
    }
    return rows;
  }
  var GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc?query=%28Iran+OR+Hormuz+OR+nuclear+OR+ceasefire+OR+Tehran+OR+sanctions%29&mode=artlist&maxrecords=25&timespan=24h&format=json";
  function newsCountForSeverity(ww3pct) {
    if (ww3pct >= 65) return 18;
    if (ww3pct >= 50) return 15;
    if (ww3pct >= 35) return 12;
    return 10;
  }
  function dedupeByTitle(articles) {
    const seen = /* @__PURE__ */ new Set();
    return articles.filter((a) => {
      if (!a.title) return false;
      const key = a.title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 7).join(" ");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  async function fetchGdeltNews() {
    const delays = [0, 800, 2e3];
    let lastReason = { kind: "network" };
    for (const delay of delays) {
      if (delay) await new Promise((r) => setTimeout(r, delay));
      let resp;
      try {
        resp = await fetch(GDELT_URL);
      } catch (_) {
        lastReason = { kind: "network" };
        continue;
      }
      if (resp.ok) {
        try {
          return await resp.json();
        } catch (_) {
          throw { kind: "parse" };
        }
      }
      if (resp.status === 429 || resp.status >= 500) {
        lastReason = resp.status === 429 ? { kind: "ratelimit", status: 429 } : { kind: "http", status: resp.status };
        continue;
      }
      throw { kind: "http", status: resp.status };
    }
    throw lastReason;
  }
  async function fetchUpdate(setMkt, setGas, setWw3, setThemes, setBreaking, setNews, setRefreshing, setRefreshCount, setRefreshErr, setLastUpdate, setSourceStatus) {
    setRefreshing(true);
    setRefreshErr(null);
    if (setSourceStatus) setSourceStatus((s) => ({ ...s, crypto: "loading", markets: "loading", news: "loading", gas: "loading" }));
    const [cgRes, yfRes, aaaRes, gdRes] = await Promise.allSettled([
      // 1. CoinGecko — BTC + ETH (free, no key, CORS enabled). Timeout via AbortController
      //    so a stalled CoinGecko request can't hold the whole pipeline open.
      fetchWithTimeout("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true").then((r) => r.ok ? r.json() : Promise.reject("CoinGecko " + r.status)),
      // 2. Yahoo Finance via proxy chain — SPX, DOW, NASDAQ, GOLD, WTI, BRENT
      fetchYahooMarkets(),
      // 3. AAA via proxy chain — national + CA + OH gas averages
      fetchAaaGas(),
      // 4. GDELT — Iran/Middle East news (free, no key, CORS enabled). Retries on 429/5xx.
      fetchGdeltNews()
    ]);
    let updateCount = 0;
    const errors = [];
    let cryptoOK = false;
    if (cgRes.status === "fulfilled") {
      const cg = cgRes.value;
      const btc = cg?.bitcoin?.usd, eth = cg?.ethereum?.usd;
      if (Number.isFinite(btc) && Number.isFinite(eth)) {
        setMkt((prev) => ({
          ...prev,
          BTC: { price: btc, chg: numOrNull(cg.bitcoin.usd_24h_change), loaded: true },
          ETH: { price: eth, chg: numOrNull(cg.ethereum.usd_24h_change), loaded: true }
        }));
        updateCount++;
        cryptoOK = true;
      }
    }
    if (!cryptoOK) errors.push("Crypto");
    let marketsOK = false;
    if (yfRes.status === "fulfilled") {
      const quotes = yfRes.value?.quoteResponse?.result || [];
      const valid = quotes.filter((q) => YF_TILE[q.symbol] && q.regularMarketPrice > 0);
      if (valid.length > 0) {
        const now = Date.now();
        const cachePatch = {};
        for (const q of valid) {
          if (q._fromCache) continue;
          cachePatch[YF_TILE[q.symbol]] = {
            price: q.regularMarketPrice,
            chg: numOrNull(q.regularMarketChangePercent),
            asOf: now
          };
        }
        if (Object.keys(cachePatch).length) priceCache.write(cachePatch);
        setMkt((prev) => {
          const n = { ...prev };
          for (const q of valid) {
            n[YF_TILE[q.symbol]] = {
              price: q.regularMarketPrice,
              chg: numOrNull(q.regularMarketChangePercent),
              loaded: true,
              asOf: q._fromCache ? q._asOf ?? now : now,
              fromCache: !!q._fromCache
            };
          }
          return n;
        });
        updateCount++;
        marketsOK = true;
      }
    }
    if (!marketsOK) errors.push("Markets");
    let gasOK = false;
    if (aaaRes.status === "fulfilled" && aaaRes.value) {
      const a = aaaRes.value;
      const now = Date.now();
      const price = (region) => region?.price ?? null;
      const dieselLadder = a.national?.diesel ?? null;
      const prices = {
        national: price(a.national),
        california: price(a.california),
        ohio: price(a.ohio),
        cincinnati: price(a.cincinnati),
        diesel: dieselLadder?.current ?? null
      };
      setGas((prev) => ({
        ...prev,
        national: prices.national ?? prev.national,
        california: prices.california ?? prev.california,
        ohio: prices.ohio ?? prev.ohio,
        cincinnati: prices.cincinnati ?? prev.cincinnati,
        diesel: prices.diesel ?? prev.diesel,
        dieselLadder: dieselLadder ?? prev.dieselLadder,
        asOf: now,
        loaded: true,
        fromCache: false
        // a live fetch just landed — clear the cache-hydrate flag
      }));
      priceCache.write({ gas: { ...prices, dieselLadder, asOf: now } });
      const rows = [];
      const today = dateOffsetISO(0);
      const todayRow = { date: today };
      if (prices.national != null) todayRow.nat = prices.national;
      if (prices.california != null) todayRow.ca = prices.california;
      if (prices.ohio != null) todayRow.oh = prices.ohio;
      if (prices.cincinnati != null) todayRow.cin = prices.cincinnati;
      if (prices.diesel != null) todayRow.dsl = prices.diesel;
      if (Object.keys(todayRow).length > 1) rows.push(todayRow);
      rows.push(...aaaLadderToRows(a.national?.ladder, "nat"));
      rows.push(...aaaLadderToRows(dieselLadder, "dsl"));
      rows.push(...aaaLadderToRows(a.california?.ladder, "ca"));
      rows.push(...aaaLadderToRows(a.ohio?.ladder, "oh"));
      rows.push(...aaaLadderToRows(a.cincinnati?.ladder, "cin"));
      if (rows.length > 0) gasSeries.upsertRows(rows);
      if (prices.national != null) {
        updateCount++;
        gasOK = true;
      }
    }
    if (!gasOK) errors.push("Gas");
    let newsOK = false;
    let newsErrReason = null;
    if (gdRes.status === "fulfilled") {
      const articles = (gdRes.value?.articles || []).filter((a) => a.title && (!a.language || a.language.toLowerCase().startsWith("en")));
      if (articles.length > 0) {
        const unique = dedupeByTitle(articles);
        const newsItems = unique.slice(0, newsCountForSeverity(WW3_PCT)).map((a) => {
          let timeStr = "--:--";
          try {
            const d = String(a.seendate || "");
            const iso = d.length >= 15 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(9, 11)}:${d.slice(11, 13)}:00Z` : `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
            const dt = new Date(iso);
            if (!isNaN(dt)) timeStr = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
          } catch (_) {
          }
          return {
            t: timeStr,
            s: (a.domain || "NEWS").replace(/^www\./, "").split(".")[0].toUpperCase().slice(0, 10),
            h: a.title,
            u: a.url || null
          };
        });
        setNews(newsItems);
        setBreaking(newsItems.slice(0, 4).map((n) => n.h.toUpperCase()));
        updateCount++;
        newsOK = true;
      } else {
        newsErrReason = "no articles";
      }
    } else {
      const reason = gdRes.reason || {};
      if (reason.kind === "ratelimit") newsErrReason = "rate-limited";
      else if (reason.kind === "http") newsErrReason = `API ${reason.status || "error"}`;
      else if (reason.kind === "parse") newsErrReason = "parse error";
      else newsErrReason = "network";
    }
    if (!newsOK) errors.push(newsErrReason ? `News (${newsErrReason})` : "News");
    if (setSourceStatus) {
      setSourceStatus({
        crypto: cryptoOK ? "ok" : "fail",
        markets: marketsOK ? "ok" : "fail",
        gas: gasOK ? "ok" : "fail",
        news: newsOK ? "ok" : "fail"
      });
    }
    const sources = [];
    if (cryptoOK) sources.push("Crypto");
    if (marketsOK) sources.push("Markets");
    if (gasOK) sources.push("Gas");
    if (newsOK) sources.push("News");
    if (sources.length > 0) {
      setRefreshCount((c) => c + 1);
      setLastUpdate(
        (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) + " \xB7 " + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })
      );
      setRefreshErr(
        errors.length > 0 ? `Updated: ${sources.join(", ")} \xB7 Failed: ${errors.join(", ")}` : null
      );
    } else {
      setRefreshErr("All sources failed \u2014 check internet connection");
    }
    setRefreshing(false);
  }
  function BriefingMode({ active, onClose, ww3, mkt, gas, conflictDay }) {
    const [slide, setSlide] = useState(0);
    const dlgRef = useRef(null);
    const lastFocus = useRef(null);
    const ww3Color = ww3 > 60 ? DANGER : ww3 > 40 ? AMBER : GREEN;
    const currentRung = ESCALATION_LADDER.find((r) => r.pct === Math.floor(ww3 / 10) * 10) || ESCALATION_LADDER[ESCALATION_LADDER.length - 1];
    const theaters = THEATERS_DATA.filter((t) => ["China", "Taiwan", "Iran", "Lebanon", "Ukraine"].includes(t.name)).map((t) => ({ flag: t.flag, name: t.name, threat: t.threat, color: t.color || TEXT_MID, note: t.status }));
    const recentEvents = [...TIMELINE].slice(-14).reverse();
    const topPlayers = CHESS_PLAYERS.slice(0, 6);
    const scenarioCard = AI_CARDS[3];
    useEffect(() => {
      if (active) {
        lastFocus.current = document.activeElement;
        setSlide(0);
        requestAnimationFrame(() => dlgRef.current?.focus());
      } else if (lastFocus.current) {
        try {
          lastFocus.current.focus();
        } catch (_) {
        }
      }
    }, [active]);
    useEffect(() => {
      if (!active) return;
      const onKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
          return;
        }
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
          e.preventDefault();
          setSlide((s) => Math.min(7, s + 1));
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault();
          setSlide((s) => Math.max(0, s - 1));
        } else if (e.key === "Home") {
          e.preventDefault();
          setSlide(0);
        } else if (e.key === "End") {
          e.preventDefault();
          setSlide(7);
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [active, onClose]);
    if (!active) return null;
    const slides = [
      // 1. Lead
      () => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 920, width: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 9, height: 9, borderRadius: "50%", background: IRAN, animation: "ping 1.6s ease infinite" } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, color: IRAN, letterSpacing: ".22em", fontWeight: 700, textTransform: "uppercase" } }, "Lead Development"), /* @__PURE__ */ React.createElement("span", { style: { width: 1, height: 14, background: RAISE_3 } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, color: TEXT_DIM, letterSpacing: ".06em", fontVariantNumeric: "tabular-nums" } }, BASE_LAST_UPDATE, " \xB7 Day ", conflictDay)), /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 46, fontWeight: 600, color: TEXT_HI, lineHeight: 1.12, letterSpacing: "-.022em", marginBottom: 24, fontVariationSettings: "'opsz' 46" } }, LEAD_TLDR.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, color: TEXT_BODY, lineHeight: 1.6, marginBottom: 32, fontWeight: 450 } }, LEAD_TLDR.summary), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 } }, LEAD_TLDR.facts.map((f, i) => {
        const isPrimary = i === 0;
        return /* @__PURE__ */ React.createElement("div", { key: f.l, style: { padding: "18px 20px", background: isPrimary ? `linear-gradient(135deg, ${alpha(DANGER, 0.08)}, transparent 70%)` : RAISE_1, border: `1px solid ${isPrimary ? alpha(DANGER, 0.32) : BORDER}`, borderRadius: 14 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 8, color: isPrimary ? DANGER : TEXT_DIM }, f.l), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 14.5, color: isPrimary ? DANGER : TEXT_HI, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-.01em", lineHeight: 1.5 } }, f.v));
      }))),
      // 2. WW3 + Ladder
      () => {
        const currentIdx = ESCALATION_LADDER.findIndex((r) => r.pct === Math.floor(ww3 / 10) * 10);
        const ci = currentIdx < 0 ? ESCALATION_LADDER.length - 1 : currentIdx;
        const lo = Math.max(0, ci - 2);
        const hi = Math.min(ESCALATION_LADDER.length - 1, lo + 4);
        const visibleRungs = ESCALATION_LADDER.slice(lo, hi + 1);
        return /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1040, width: "100%" } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 12, color: TEXT_MID }, "WW3 Probability \xB7 Escalation Ladder"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "auto 1fr", gap: 36, alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 180, fontWeight: 600, color: ww3Color, lineHeight: 0.9, letterSpacing: "-.05em", fontVariantNumeric: "tabular-nums", fontVariationSettings: "'opsz' 96" } }, /* @__PURE__ */ React.createElement(TickingNumber, { value: ww3, duration: 1100 }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 64, opacity: 0.55 } }, "%")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: ".10em", color: ww3Color, padding: "4px 11px", borderRadius: 999, background: alpha(ww3Color, 0.09), border: `1px solid ${alpha(ww3Color, 0.23)}` } }, "Rung ", currentRung.pct, " \xB7 ", currentRung.label)), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 340 } }, /* @__PURE__ */ React.createElement(
          EventSeriesChart,
          {
            series: WW3_SERIES,
            variant: "mini",
            height: 64,
            color: ww3Color,
            yMin: 0,
            yMax: 70,
            format: (v) => `${Math.round(v)}`,
            unit: "%"
          }
        )))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, lo > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, padding: "2px 12px", letterSpacing: ".06em" } }, "\u25B2 ", lo, " rung", lo > 1 ? "s" : "", " above"), visibleRungs.map((rung) => {
          const current = rung.pct === Math.floor(ww3 / 10) * 10;
          const passed = rung.pct < Math.floor(ww3 / 10) * 10;
          const labelColor = passed ? DANGER : current ? AMBER : TEXT_MID;
          return /* @__PURE__ */ React.createElement("div", { key: rung.pct, className: current ? "glow-rung" : "", style: { display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", borderRadius: 8, background: current ? alpha(AMBER, 0.12) : passed ? alpha(DANGER, 0.04) : "transparent", border: `1px solid ${current ? alpha(AMBER, 0.36) : passed ? alpha(DANGER, 0.1) : "transparent"}` } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 14, fontWeight: 700, color: labelColor, width: 44, flexShrink: 0, fontVariantNumeric: "tabular-nums" } }, rung.pct, "%"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: labelColor, flex: 1 } }, rung.label), current && /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, fontWeight: 600, color: AMBER, letterSpacing: ".12em", padding: "2px 8px", borderRadius: 999, background: alpha(AMBER, 0.18), border: `1px solid ${alpha(AMBER, 0.4)}`, flexShrink: 0 } }, "NOW"));
        }), hi < ESCALATION_LADDER.length - 1 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: TEXT_DIM, padding: "2px 12px", letterSpacing: ".06em" } }, "\u25BC ", ESCALATION_LADDER.length - 1 - hi, " rung", ESCALATION_LADDER.length - 1 - hi > 1 ? "s" : "", " below"))));
      },
      // 3. Active theaters
      () => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1040, width: "100%" } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 14, color: TEXT_MID }, "Active Theaters \xB7 Day ", conflictDay), /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 30, fontWeight: 600, color: TEXT_HI, marginBottom: 24, letterSpacing: "-.015em", fontVariationSettings: "'opsz' 30" } }, theaters.length, " active theaters \xB7 WW3 at ", /* @__PURE__ */ React.createElement("span", { style: { color: ww3Color } }, ww3, "%")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, theaters.map((t) => /* @__PURE__ */ React.createElement("div", { key: t.name, style: { padding: "18px 22px", borderRadius: 14, background: RAISE_1, borderLeft: `4px solid ${t.color}`, border: `1px solid ${BORDER}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 32, lineHeight: 1 } }, t.flag), /* @__PURE__ */ React.createElement("span", { className: "display", style: { fontSize: 22, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.01em" } }, t.name), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 18, fontWeight: 600, color: t.color, fontVariantNumeric: "tabular-nums" } }, t.threat, "%")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: TEXT_BODY, lineHeight: 1.55 } }, t.note))))),
      // 4. Key Developments
      () => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 980, width: "100%" } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 14, color: AMBER }, "Key Developments \xB7 Today"), /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 26, fontWeight: 600, color: TEXT_HI, marginBottom: 24, letterSpacing: "-.012em", fontVariationSettings: "'opsz' 26" } }, "What changed in the last 24 hours"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, KEY_DEVS.slice(0, 6).map((d, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 18, padding: "14px 20px", background: alpha(AMBER, 0.05), border: `1px solid ${alpha(AMBER, 0.18)}`, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, fontWeight: 700, color: AMBER, letterSpacing: ".10em", flexShrink: 0, width: 22, paddingTop: 2 } }, String(i + 1).padStart(2, "0")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15.5, color: TEXT_HI, lineHeight: 1.55, fontWeight: 450 } }, d))))),
      // 5. Timeline — last 14 days
      () => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1020, width: "100%" } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 14, color: TEXT_MID }, "Timeline \xB7 Last 14 Days"), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", maxHeight: "66vh", overflowY: "auto", paddingRight: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: 74, top: 6, bottom: 6, width: 1, background: `linear-gradient(180deg, ${alpha(DANGER, 0.33)}, ${alpha(AMBER, 0.33)}, ${BORDER})` } }), recentEvents.map((ev, i) => {
        const col = { extreme: DANGER, critical: CRITICAL, high: AMBER }[ev.sev] || TEXT_MID;
        return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 16, padding: "10px 0", alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 12, color: TEXT_DIM, width: 62, flexShrink: 0, paddingTop: 4, textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums" } }, ev.date), /* @__PURE__ */ React.createElement("div", { style: { width: 10, height: 10, borderRadius: "50%", background: col, flexShrink: 0, marginTop: 7, boxShadow: `0 0 0 3px var(--bg), 0 0 12px ${alpha(col, 0.53)}` } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, fontSize: 14, color: TEXT_BODY, lineHeight: 1.6 } }, ev.desc));
      }))),
      // 6. Chessboard
      () => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1020, width: "100%" } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 14, color: TEXT_MID }, "Geopolitical Chessboard \xB7 Top 6 Players"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, topPlayers.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.name, style: { padding: "16px 20px", borderRadius: 14, background: RAISE_1, borderLeft: `4px solid ${p.color}`, border: `1px solid ${BORDER}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24, lineHeight: 1 } }, p.flag), /* @__PURE__ */ React.createElement("span", { className: "display", style: { fontSize: 17, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.01em" } }, p.name)), /* @__PURE__ */ React.createElement(Eyebrow, { mb: 4, color: p.color }, "Move"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, lineHeight: 1.55 } }, p.move))))),
      // 7. Markets
      () => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 960, width: "100%" } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 14, color: TEXT_MID }, "Markets \xB7 Live Snapshot"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 } }, [
        { l: "S&P 500", v: mkt.SPX.price != null ? fmt.num(Math.round(mkt.SPX.price)) : null, c: mkt.SPX.chg },
        { l: "BRENT", v: mkt.BRENT.price != null ? fmt.money(mkt.BRENT.price) : null, c: mkt.BRENT.chg },
        { l: "GOLD", v: mkt.GOLD.price != null ? `$${fmt.compact(Math.round(mkt.GOLD.price))}` : null, c: mkt.GOLD.chg },
        { l: "BTC", v: mkt.BTC.price != null ? `$${fmt.compact(Math.round(mkt.BTC.price))}` : null, c: mkt.BTC.chg }
      ].map((s) => /* @__PURE__ */ React.createElement("div", { key: s.l, style: { padding: "22px 22px", background: RAISE_1, border: `1px solid ${BORDER}`, borderRadius: 14 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 10 }, s.l), s.v != null ? /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 30, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.025em", fontVariantNumeric: "tabular-nums", fontVariationSettings: "'opsz' 30", lineHeight: 1 } }, s.v) : /* @__PURE__ */ React.createElement(PriceSkeleton, { w: 120, h: 28, radius: 6 }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginTop: 8, fontWeight: 600, color: (s.c ?? 0) >= 0 ? GREEN : DANGER } }, s.c != null ? `${fmt.arrow(s.c)} ${fmt.signedPct(s.c)}` : "awaiting live\u2026")))), /* @__PURE__ */ React.createElement("div", { style: { padding: "22px 26px", background: `linear-gradient(135deg, ${alpha(AMBER, 0.06)}, transparent 60%)`, border: `1px solid ${alpha(AMBER, 0.28)}`, borderRadius: 14 } }, /* @__PURE__ */ React.createElement(Eyebrow, { mb: 10, color: AMBER }, "US National Gas Avg"), gas?.national != null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 46, fontWeight: 600, color: AMBER, lineHeight: 1, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" } }, "$", gas.national.toFixed(3)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: DANGER, marginTop: 8, fontWeight: 500 } }, "\u2191 +", ((gas.national - 3.42) / 3.42 * 100).toFixed(0), "% since Feb 28 baseline ($3.42)"), gas?.diesel != null && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_BODY, marginTop: 10, fontVariantNumeric: "tabular-nums" } }, "Diesel (national avg) ", /* @__PURE__ */ React.createElement("span", { style: { color: AMBER, fontWeight: 600 } }, "$", gas.diesel.toFixed(3)))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(PriceSkeleton, { w: 180, h: 42, radius: 6 }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: TEXT_DIM, marginTop: 8 } }, "awaiting AAA live feed\u2026")))),
      // 8. Scenario Matrix
      () => /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 1020, width: "100%" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, scenarioCard.icon), /* @__PURE__ */ React.createElement(Eyebrow, { mb: 0, color: scenarioCard.color }, scenarioCard.lens)), /* @__PURE__ */ React.createElement("div", { className: "display", style: { fontSize: 28, fontWeight: 600, color: TEXT_HI, marginBottom: 22, letterSpacing: "-.015em", fontVariationSettings: "'opsz' 28", lineHeight: 1.25 } }, scenarioCard.title), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14, maxHeight: "58vh", overflowY: "auto", paddingRight: 8 } }, scenarioCard.body.split("\n\n").map((para, i) => {
        const [head, ...rest] = para.split(": ");
        if (rest.length && head === head.toUpperCase() && head.length < 90) {
          return /* @__PURE__ */ React.createElement("div", { key: i, style: { padding: "14px 18px", background: RAISE_1, border: `1px solid ${BORDER}`, borderRadius: 10 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: scenarioCard.color, fontWeight: 700, letterSpacing: ".14em", display: "block", marginBottom: 6, textTransform: "uppercase" } }, head), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13.5, color: TEXT_BODY, lineHeight: 1.65 } }, rest.join(": ")));
        }
        return /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 13.5, color: TEXT_BODY, lineHeight: 1.65 } }, para);
      })))
    ];
    const slideTitles = [
      "Lead Development",
      "WW3 + Escalation",
      "Active Theaters",
      "Key Developments",
      "Last 14 Days",
      "Chessboard",
      "Markets",
      "Scenario Matrix"
    ];
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "drawer-overlay", style: { position: "fixed", inset: 0, background: "var(--bg)", zIndex: 400 } }), /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: dlgRef,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Briefing Mode",
        tabIndex: -1,
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 401,
          background: `radial-gradient(80% 90% at 50% 0%, ${alpha(ww3Color, 0.06)}, transparent 60%), var(--bg)`,
          padding: "7vh 8vw",
          display: "flex",
          flexDirection: "column",
          fontFamily: SANS,
          outline: "none"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 999, background: alpha(DANGER, 0.1), border: `1px solid ${alpha(DANGER, 0.28)}` } }, /* @__PURE__ */ React.createElement("span", { style: { width: 7, height: 7, borderRadius: "50%", background: DANGER, animation: "ping 1.4s ease infinite" } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: DANGER, fontWeight: 700, letterSpacing: ".18em" } }, "BRIEFING")), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: TEXT_HI } }, "Global Conflict Monitor"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: TEXT_DIM } }, "\xB7 ", slideTitles[slide]), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: 11, color: TEXT_DIM, fontVariantNumeric: "tabular-nums", letterSpacing: ".10em" } }, /* @__PURE__ */ React.createElement("span", { style: { color: TEXT_HI, fontWeight: 600 } }, slide + 1), " / 8"), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          className: "pressable",
          "aria-label": "Exit briefing",
          style: {
            width: 36,
            height: 36,
            borderRadius: 8,
            background: RAISE_1,
            border: `1px solid ${BORDER}`,
            color: TEXT_MID,
            fontSize: 14,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = RAISE_2;
            e.currentTarget.style.color = TEXT_HI;
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = RAISE_1;
            e.currentTarget.style.color = TEXT_MID;
          }
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 16 })
      )),
      /* @__PURE__ */ React.createElement("div", { key: slide, className: "brief-slide", style: { flex: 1, overflowY: "auto", minHeight: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 0", boxSizing: "border-box" } }, slides[slide]())),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, marginTop: 18 } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setSlide((s) => Math.max(0, s - 1)),
          disabled: slide === 0,
          className: "pressable",
          "aria-label": "Previous slide",
          style: {
            width: 38,
            height: 38,
            borderRadius: 10,
            background: slide === 0 ? "transparent" : RAISE_1,
            border: `1px solid ${slide === 0 ? "transparent" : BORDER}`,
            color: slide === 0 ? TEXT_DIM : TEXT_BODY,
            cursor: slide === 0 ? "not-allowed" : "pointer",
            opacity: slide === 0 ? 0.35 : 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SANS,
            fontSize: 18
          }
        },
        "\u2039"
      ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, slides.map((_, i) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: i,
          onClick: () => setSlide(i),
          "aria-label": `Slide ${i + 1}: ${slideTitles[i]}`,
          style: {
            width: i === slide ? 26 : 8,
            height: 8,
            borderRadius: 999,
            background: i === slide ? ww3Color : RAISE_3,
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "width .2s cubic-bezier(.2,.8,.2,1), background .2s ease"
          }
        }
      ))), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setSlide((s) => Math.min(7, s + 1)),
          disabled: slide === 7,
          className: "pressable",
          "aria-label": "Next slide",
          style: {
            width: 38,
            height: 38,
            borderRadius: 10,
            background: slide === 7 ? "transparent" : RAISE_1,
            border: `1px solid ${slide === 7 ? "transparent" : BORDER}`,
            color: slide === 7 ? TEXT_DIM : TEXT_BODY,
            cursor: slide === 7 ? "not-allowed" : "pointer",
            opacity: slide === 7 ? 0.35 : 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SANS,
            fontSize: 18
          }
        },
        "\u203A"
      ), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".06em" } }, /* @__PURE__ */ React.createElement("kbd", { style: { fontFamily: MONO, fontSize: FS.xs, color: "inherit", padding: "1px 6px", borderRadius: 3, background: RAISE_2, border: `1px solid ${BORDER}`, marginRight: 6 } }, "\u2190"), /* @__PURE__ */ React.createElement("kbd", { style: { fontFamily: MONO, fontSize: FS.xs, color: "inherit", padding: "1px 6px", borderRadius: 3, background: RAISE_2, border: `1px solid ${BORDER}` } }, "\u2192"), /* @__PURE__ */ React.createElement("span", { style: { margin: "0 8px" } }, "navigate"), /* @__PURE__ */ React.createElement("kbd", { style: { fontFamily: MONO, fontSize: FS.xs, color: "inherit", padding: "1px 6px", borderRadius: 3, background: RAISE_2, border: `1px solid ${BORDER}` } }, "Esc"), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 6 } }, "exit")))
    ));
  }
  function App() {
    const [mktLive, setMktLive] = useState(() => {
      const c = priceCache.read();
      const seed = { ...MKT };
      for (const tile of ["SPX", "DOW", "NDX", "GOLD", "WTI", "BRENT"]) {
        const e = c?.[tile];
        if (e && e.price != null) {
          seed[tile] = { price: e.price, chg: e.chg ?? 0, loaded: true, asOf: e.asOf, fromCache: true };
        }
      }
      return seed;
    });
    const [gasLive, setGasLive] = useState(() => {
      const c = priceCache.read().gas;
      if (!c) return GAS;
      return {
        national: c.national ?? null,
        california: c.california ?? null,
        ohio: c.ohio ?? null,
        cincinnati: c.cincinnati ?? null,
        diesel: c.diesel ?? null,
        dieselLadder: c.dieselLadder ?? null,
        asOf: c.asOf,
        loaded: c.national != null,
        fromCache: true
      };
    });
    const [ww3Live, setWw3Live] = useState(WW3_PCT);
    const [themesLive, setThemesLive] = useState(INIT_THEMES);
    const [breaking, setBreaking] = useState(INIT_BREAKING);
    const [news, setNews] = useState(INIT_NEWS);
    const [tab, setTabRaw] = useState("overview");
    const [refreshing, setRefreshing] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);
    const [refreshErr, setRefreshErr] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(BASE_LAST_UPDATE);
    const [sourceStatus, setSourceStatus] = useState({ crypto: "idle", markets: "idle", gas: "idle", news: "idle" });
    const [drawerCountry, setDrawerCountry] = useState(null);
    const [feedNav, setFeedNav] = useState({ country: null, view: null });
    const [analysisTarget, setAnalysisTarget] = useState(null);
    const [themePref, setThemePref] = useState("dark");
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [briefingOpen, setBriefingOpen] = useState(false);
    const [glanceOpen, setGlanceOpen] = useState(false);
    const [kpiExpanded, setKpiExpanded] = useState(false);
    const [lastRefreshAt, setLastRefreshAt] = useState(() => /* @__PURE__ */ new Date());
    const [headerTick, setHeaderTick] = useState(0);
    useEffect(() => {
      const t = setInterval(() => setHeaderTick((k) => k + 1), 4200);
      return () => clearInterval(t);
    }, []);
    useEffect(() => {
      try {
        localStorage.removeItem("wargame.strikeWindowExpiry");
      } catch (_) {
      }
    }, []);
    const priorVisitRef = useRef(visitStore.read());
    const priorVisit = priorVisitRef.current;
    useEffect(() => {
      visitStore.write();
    }, []);
    useEffect(() => {
      applyTheme(themePref);
    }, [themePref]);
    const conflictDay = Math.floor((NOW - WAR_START) / 864e5);
    const ww3Color = ww3Live > 60 ? DANGER : ww3Live > 40 ? AMBER : GREEN;
    const ww3Delta = ww3Live - WW3_HISTORY[WW3_HISTORY.length - 2];
    const scrollMemory = useRef({});
    const isMobileScroll = () => window.innerWidth < 768;
    const getScroll = () => document.body.scrollTop || document.documentElement.scrollTop;
    const setScroll = (top) => {
      document.body.scrollTop = top;
      document.documentElement.scrollTop = top;
    };
    const setTab = useCallback((next, arcTarget = null) => {
      if (!isMobileScroll()) scrollMemory.current[tab] = getScroll();
      setAnalysisTarget(arcTarget);
      setTabRaw(next);
      if (arcTarget) return;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (isMobileScroll()) {
          setScroll(0);
        } else {
          setScroll(scrollMemory.current[next] || 0);
        }
      }));
    }, [tab]);
    const openCountry = useCallback((c) => setDrawerCountry(c), []);
    const closeDrawer = useCallback(() => setDrawerCountry(null), []);
    const onDrawerNavigate = useCallback((toTab, opts = {}) => {
      if (toTab === "feed") {
        setFeedNav({ country: opts.country || null, view: opts.view || "news" });
        setTab("feed");
        setDrawerCountry(null);
      }
    }, [setTab]);
    const doRefresh = useCallback(() => {
      setLastRefreshAt(/* @__PURE__ */ new Date());
      fetchUpdate(setMktLive, setGasLive, setWw3Live, setThemesLive, setBreaking, setNews, setRefreshing, setRefreshCount, setRefreshErr, setLastUpdate, setSourceStatus);
    }, []);
    const isMobile = useIsMobile(900);
    const ptr = usePullToRefresh(doRefresh, isMobile);
    const swipe = useSwipeTabs(tab, setTab, TABS, isMobile);
    useEffect(() => {
      doRefresh();
      const REFRESH_MS = 5 * 60 * 1e3;
      const intervalId = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
        doRefresh();
      }, REFRESH_MS);
      const onVis = () => {
        if (document.visibilityState === "visible") doRefresh();
      };
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", onVis);
      }
      return () => {
        clearInterval(intervalId);
        if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVis);
      };
    }, [doRefresh]);
    useEffect(() => {
      function onKey(e) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          setPaletteOpen((o) => !o);
          return;
        }
        if (e.key === "Escape" && drawerCountry) {
          setDrawerCountry(null);
          return;
        }
        const tag = (e.target?.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key.toLowerCase() === "b") {
          e.preventDefault();
          setBriefingOpen((o) => !o);
          return;
        }
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= TABS.length) {
          e.preventDefault();
          setTab(TABS[n - 1]);
        }
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [drawerCountry, setTab]);
    const renderTab = () => {
      switch (tab) {
        case "overview":
          return /* @__PURE__ */ React.createElement(OverviewTab, { mkt: mktLive, gas: gasLive, ww3: ww3Live, themes: themesLive, openCountry, setTab });
        case "feed":
          return /* @__PURE__ */ React.createElement(FeedTab, { news, openCountry, initialCountry: feedNav.country, initialView: feedNav.view, priorVisit });
        case "actors":
          return /* @__PURE__ */ React.createElement(ActorsTab, { openCountry });
        case "economy":
          return /* @__PURE__ */ React.createElement(EconomyTab, { mkt: mktLive, gas: gasLive, openCountry });
        case "analysis":
          return /* @__PURE__ */ React.createElement(AITab, { targetArc: analysisTarget, onConsumeTarget: () => setAnalysisTarget(null) });
        case "outlook":
          return /* @__PURE__ */ React.createElement(OutlookTab, { openCountry });
        default:
          return null;
      }
    };
    const latestHeadline = breaking.length > 0 ? breaking[0] : news.length > 0 ? news[0].h : null;
    return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: SANS, background: BG, minHeight: "100vh", color: TEXT_BODY } }, isMobile && /* @__PURE__ */ React.createElement(PullToRefreshIndicator, { state: ptr.state, pullY: ptr.pullY }), /* @__PURE__ */ React.createElement("header", { className: "header-row", style: { position: "sticky", top: 0, zIndex: 100, minHeight: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", background: "var(--header-bg)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: `1px solid ${BORDER}`, gap: 14, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "choreographed", style: { animationDelay: "0ms", display: "flex", alignItems: "center", gap: 14, minHeight: 60, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7, background: alpha(DANGER, 0.12), border: `1px solid ${alpha(DANGER, 0.28)}`, borderRadius: 999, padding: "3px 10px" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: DANGER, animation: "ping 1s ease infinite" } }), /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: DANGER, fontWeight: 600, letterSpacing: ".12em" } }, "LIVE")), /* @__PURE__ */ React.createElement("div", { className: "header-title-stack", style: { display: "flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "header-title", style: { fontSize: 14, fontWeight: 600, color: TEXT_HI, letterSpacing: "-.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, "Global Conflict Monitor"), /* @__PURE__ */ React.createElement("span", { className: "header-subtitle", style: { fontSize: 11, color: TEXT_DIM, letterSpacing: ".04em" } }, "Operation Epic Fury \xB7 US-BRICS Rivalry \xB7 Russia-Ukraine"))), /* @__PURE__ */ React.createElement("div", { className: "header-context-mobile-hide choreographed", style: { animationDelay: "160ms", display: "flex", alignItems: "center", gap: 0, flex: 1, justifyContent: "center", minWidth: 0, maxWidth: 760 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setTab("overview"),
        title: "Go to Overview",
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 1,
          padding: "6px 14px",
          background: RAISE_1,
          border: `1px solid ${BORDER}`,
          borderRight: "none",
          borderRadius: "8px 0 0 8px",
          cursor: "pointer",
          color: TEXT_BODY,
          fontFamily: SANS,
          textAlign: "left"
        }
      },
      /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".1em", fontWeight: 600, textTransform: "uppercase" } }, "Day"),
      /* @__PURE__ */ React.createElement(M, { style: { fontSize: 14, color: TEXT_HI, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-.01em" } }, conflictDay)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setTab("overview");
          requestAnimationFrame(() => window.scrollTo({ top: 9999, behavior: "smooth" }));
        },
        title: "Go to escalation ladder",
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 1,
          padding: "6px 14px",
          background: `linear-gradient(135deg, ${alpha(ww3Color, 0.08)}, transparent 60%)`,
          border: `1px solid ${BORDER}`,
          borderRadius: "0 8px 8px 0",
          cursor: "pointer",
          color: TEXT_BODY,
          fontFamily: SANS,
          textAlign: "left"
        }
      },
      /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: TEXT_DIM, letterSpacing: ".1em", fontWeight: 600, textTransform: "uppercase" } }, "WW3"),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 6 } }, /* @__PURE__ */ React.createElement(M, { style: { fontSize: 14, color: ww3Color, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-.01em" } }, ww3Live, "%"), /* @__PURE__ */ React.createElement(M, { style: { fontSize: FS.xs, color: ww3Delta >= 0 ? DANGER : GREEN, fontWeight: 500 } }, ww3Delta >= 0 ? "\u2191+" : "\u2193", Math.abs(ww3Delta)))
    )), /* @__PURE__ */ React.createElement("div", { className: "choreographed header-actions", style: { animationDelay: "280ms", display: "flex", alignItems: "center", gap: 10, minHeight: 60, flexShrink: 0 } }, /* @__PURE__ */ React.createElement(FreshnessIndicator, { sources: sourceStatus, lastRefreshAt, refreshErr }), /* @__PURE__ */ React.createElement(ThemeToggle, { pref: themePref, onChange: setThemePref }), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: doRefresh,
        disabled: refreshing,
        className: "iconbtn pressable refresh-btn",
        "aria-label": refreshing ? "Refreshing" : "Refresh data",
        title: refreshing ? "Fetching live sources\u2026" : `Refresh data (last refreshed ${Math.round((Date.now() - lastRefreshAt.getTime()) / 6e4)}m ago)`,
        style: {
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".02em",
          color: refreshing ? TEXT_DIM : AMBER,
          background: refreshing ? RAISE_1 : alpha(AMBER, 0.08),
          border: `1px solid ${refreshing ? RAISE_3 : alpha(AMBER, 0.32)}`,
          borderRadius: 8,
          padding: "7px 14px",
          cursor: refreshing ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          position: "relative",
          overflow: "hidden"
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 14,
        height: 14,
        position: "relative"
      } }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: refreshing ? "spin" : "" }, /* @__PURE__ */ React.createElement("path", { d: "M3 12a9 9 0 0 1 15.5-6.36L21 8" }), /* @__PURE__ */ React.createElement("path", { d: "M21 3v5h-5" }), /* @__PURE__ */ React.createElement("path", { d: "M21 12a9 9 0 0 1-15.5 6.36L3 16" }), /* @__PURE__ */ React.createElement("path", { d: "M3 21v-5h5" }))),
      /* @__PURE__ */ React.createElement("span", { className: "btn-label-desktop" }, refreshing ? "Refreshing\u2026" : "Refresh")
    ))), /* @__PURE__ */ React.createElement(MarketBar, { mkt: mktLive, ww3: ww3Live, tick: headerTick }), /* @__PURE__ */ React.createElement(BreakingTicker, { headlines: breaking, tick: headerTick, onClick: () => {
      setFeedNav({ country: null, view: "news" });
      setTab("feed");
    } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement(SideNav, { tab, setTab, sources: sourceStatus }), /* @__PURE__ */ React.createElement(
      "main",
      {
        key: tab,
        id: `panel-${tab}`,
        role: "tabpanel",
        "aria-labelledby": `tab-${tab}`,
        className: "tab-content main-pad",
        style: {
          flex: 1,
          minWidth: 0,
          maxWidth: 1240,
          margin: "0 auto",
          padding: "28px 36px 80px",
          transform: isMobile && swipe.swiping ? `translateX(${swipe.offsetX}px)` : void 0,
          transition: isMobile && swipe.swiping ? "none" : "transform .3s cubic-bezier(.2,.8,.2,1)",
          willChange: isMobile ? "transform" : void 0
        }
      },
      renderTab()
    )), /* @__PURE__ */ React.createElement(
      StatusBar,
      {
        sources: sourceStatus,
        lastRefreshAt,
        ww3: ww3Live,
        tab,
        theme: resolveTheme(themePref),
        onPaletteOpen: () => setPaletteOpen(true),
        onBriefingOpen: () => setBriefingOpen(true)
      }
    ), /* @__PURE__ */ React.createElement(BottomTabBar, { tab, setTab }), isMobile && !glanceOpen && !briefingOpen && /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "glance-fab",
        onClick: () => setGlanceOpen(true),
        "aria-label": "Quick glance",
        title: "Quick glance view"
      },
      /* @__PURE__ */ React.createElement("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("path", { d: "M12 6v6l4 2" }))
    ), drawerCountry && isMobile && /* @__PURE__ */ React.createElement(CountryBottomSheet, { country: drawerCountry, onClose: closeDrawer, onNavigate: onDrawerNavigate }), drawerCountry && !isMobile && /* @__PURE__ */ React.createElement(CountryDrawer, { country: drawerCountry, onClose: closeDrawer, onNavigate: onDrawerNavigate }), /* @__PURE__ */ React.createElement(
      CommandPalette,
      {
        open: paletteOpen,
        onClose: () => setPaletteOpen(false),
        setTab,
        setThemePref,
        themePref,
        doRefresh,
        openCountry,
        openBriefing: () => setBriefingOpen(true)
      }
    ), /* @__PURE__ */ React.createElement(
      GlanceMode,
      {
        active: glanceOpen,
        onClose: () => setGlanceOpen(false),
        ww3: ww3Live,
        mkt: mktLive,
        gas: gasLive,
        conflictDay,
        latestHeadline
      }
    ), /* @__PURE__ */ React.createElement(
      BriefingMode,
      {
        active: briefingOpen,
        onClose: () => setBriefingOpen(false),
        ww3: ww3Live,
        mkt: mktLive,
        gas: gasLive,
        conflictDay
      }
    ));
  }
  var root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(/* @__PURE__ */ React.createElement(App, null));
})();
//# sourceMappingURL=app.js.map
