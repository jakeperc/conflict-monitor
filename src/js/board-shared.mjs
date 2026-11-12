// Board vocabulary shared by the dashboard (app.js) and the Theater Globe (globe.js).
// One definition each, so the two views cannot drift apart. Colours are CSS tokens
// (src/css/styles.css); a consumer that needs a literal colour resolves the token at
// runtime with getComputedStyle instead of keeping its own copy of the hex value.

// Per-arc filter chips (added 2026-05-23 with the BRICS reframe). Each chip matches one
// or more historical/current theater tag values to handle the May-23 vocabulary shift.
export const ARC_FILTERS = [
  { key: "iran",           label: "Iran",           color: "var(--c-iran)",        match: new Set(["iran-hormuz"]) },
  { key: "us-brics",       label: "US-BRICS",       color: "var(--c-brics)",       textColor: "var(--c-brics-text)", match: new Set(["us-brics-rivalry", "us-china", "us-china-cold-war"]) },
  { key: "russia-ukraine", label: "Russia-Ukraine", color: "var(--c-ukraine-war)", match: new Set(["russia-ukraine-war", "russia-ukraine"]) },
  { key: "cyber",          label: "Cyber",          color: "var(--c-blue)",        match: new Set(["cyber-infrastructure"]) },
  { key: "sanctions",      label: "Sanctions",      color: "var(--c-amber)",       match: new Set(["sanctions-financial-warfare"]) },
  { key: "markets",        label: "Markets",        color: "var(--c-green)",       match: new Set(["markets-risk-transmission", "markets"]) },
];

// The map legend: the fill colours data/map_overlays.json uses, and what each means.
export const MAP_LEGEND = [
  { color: "rgba(244,63,94,.55)",  label: "Active War" },
  { color: "rgba(251,146,60,.6)",  label: "Critical" },
  { color: "rgba(234,179,8,.55)",  label: "High" },
  { color: "rgba(99,102,241,.55)", label: "Secondary" },
  { color: "rgba(245,158,11,.18)", label: "Aligned / At-Risk" },
  { color: "rgba(148,148,148,.45)", label: "Monitoring" },
];

// world-atlas 2.0.2 `properties.name` → the board's country key (data/actors.json
// country_keys / risk_countries). Names not listed are identical in both.
export const ATLAS_TO_KEY = {
  "United States of America": "USA",
  "United Arab Emirates": "UAE",
};
export const atlasToKey = (name) => ATLAS_TO_KEY[name] || name;

// Any name the data files use (a board key, or a legacy name such as the
// map_overlays.json fill key "Dem. Rep. Korea") → the world-atlas 2.0.2 name.
// Both the 110m and 50m atlases call it "North Korea"; without this alias that fill
// never matched a shape. scripts/validate-data.js fails the build on any data name
// that still resolves to no shape.
const NAME_TO_ATLAS = {
  "USA": "United States of America",
  "UAE": "United Arab Emirates",
  "Dem. Rep. Korea": "North Korea",
  "Korea, Democratic People's Republic of": "North Korea",
};
export const toAtlasName = (name) => NAME_TO_ATLAS[name] || name;

// Whether a chess_players row belongs to a board country (the getCountryDossier rule).
export const chessMatches = (country, playerName) =>
  playerName === country ||
  (country === "USA" && playerName === "United States") ||
  (country === "Lebanon" && playerName.includes("Lebanon"));
