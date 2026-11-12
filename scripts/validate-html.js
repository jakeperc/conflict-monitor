#!/usr/bin/env node
/*
 * Validate dist/index.html. Checks cover the head-plumbing, the injected
 * __DATA__ blob, the JSON-LD structured data, and the prerendered crawler
 * content inside <div id="root">…</div>. Also confirms the SEO sidecars
 * (robots.txt, sitemap.xml) were emitted alongside.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const file = path.join(DIST, 'index.html');

const errors = [];
const err = (m) => errors.push(m);

if (!fs.existsSync(file)) {
  err(`dist/index.html does not exist — run \`npm run build\` first`);
  console.error(errors.join('\n'));
  process.exit(1);
}
const html = fs.readFileSync(file, 'utf8');

// 1. Single root mount point
const rootCount = (html.match(/<div id="root">/g) || []).length;
if (rootCount !== 1) err(`expected exactly one <div id="root"> mount, found ${rootCount}`);

// 1b. Prerendered crawler content must be present inside #root
const rootBlock = html.match(/<div id="root">([\s\S]*?)<script src="js\/app\.js"/);
if (!rootBlock || !rootBlock[1].includes('data-prerendered="true"')) {
  err('prerendered content missing from <div id="root"> — crawlers will not see dashboard content');
}

// 2. Data blob present and parseable
const m = html.match(/<script[^>]*id="app-data"[^>]*>([\s\S]*?)<\/script>/);
if (!m) {
  err('missing <script id="app-data"> data blob');
} else {
  const code = m[1];
  if (!/^\s*window\.__DATA__\s*=/.test(code)) {
    err('app-data <script> does not start with `window.__DATA__ = ...`');
  } else {
    try {
      const json = code.replace(/^\s*window\.__DATA__\s*=\s*/, '').replace(/;\s*$/, '');
      const obj = JSON.parse(json);
      const required = ['events','init_news','init_breaking','init_themes','key_devs','timeline','timeline_chapters','ai_cards','iran_lead','brics_lead','ukraine_lead','risk_countries','chess_players','country_keys','theaters','human_cost','econ_commentary','escalation_ladder','escalation_axes','ww3_history','hormuz_history','brent_history','gas_nat_history','gas_history','ww3_series','brent_series','gas_nat_series','hormuz_series','gas_daily','meta'];
      for (const k of required) {
        if (!(k in obj)) err(`__DATA__ missing required key "${k}"`);
      }
      // Keys the Theater Globe (src/js/globe.js) reads. A rename upstream would otherwise
      // leave the Globe tab quietly drawing less.
      for (const k of ['map_overlays', 'escalation_history']) {
        if (!(k in obj)) err(`__DATA__ missing key "${k}" (read by the Theater Globe)`);
      }
      for (const k of ['ww3_pct', 'now', 'war_start', 'base_last_update']) {
        if (!obj.meta || obj.meta[k] == null) err(`__DATA__.meta.${k} is missing (read by the Theater Globe)`);
      }
      if (obj.map_overlays && !Array.isArray(obj.map_overlays.arcs)) err('__DATA__.map_overlays.arcs is not an array (read by the Theater Globe)');
      if (!Array.isArray(obj.events) || obj.events.length === 0) err('__DATA__.events is empty');
      if (!Array.isArray(obj.timeline) || obj.timeline.length === 0) err('__DATA__.timeline is empty');
      if (!Array.isArray(obj.init_news) || obj.init_news.length === 0) err('__DATA__.init_news is empty');
    } catch (e) {
      err(`failed to parse __DATA__ JSON: ${e.message}`);
    }
  }
}

// 3. Runtime UMD <script src=> tags
for (const lib of ['react.production.min.js', 'react-dom@18', 'topojson-client@3']) {
  if (!html.includes(lib)) err(`missing runtime <script src> referencing ${lib}`);
}

// 4. External CSS link
if (!/<link[^>]+href="css\/styles\.css"/i.test(html)) {
  err('missing <link rel="stylesheet" href="css/styles.css">');
}

// 5. app.js <script src=> tag
if (!/<script[^>]+src="js\/app\.js"/i.test(html)) {
  err('missing <script src="js/app.js"></script>');
}

// 6. Early-theme inline script (regression guard)
if (!html.includes('wargame.theme')) {
  err('missing early-theme inline script (no reference to "wargame.theme")');
}

// 7. Babel-Standalone must NOT be present (regression guard)
if (/babel\/standalone/i.test(html)) {
  err('regression: Babel-Standalone <script> tag found in dist (should be removed; esbuild precompiles JSX)');
}
if (/type="text\/babel"/i.test(html)) {
  err('regression: <script type="text/babel"> found in dist');
}

// 8. Closes with </html>
if (!html.trimEnd().endsWith('</html>')) {
  err('dist/index.html does not close with </html>');
}

// 9. Companion assets exist
for (const p of ['css/styles.css', 'js/app.js', 'js/globe.js', 'vendor/world-atlas-50m.json']) {
  if (!fs.existsSync(path.join(DIST, p))) err(`missing dist/${p}`);
}

// 9b. Theater Globe bundle: exports its mount function, carries no CDN imports
// (three.js is bundled from the pinned npm package), and app.js points at this build of it.
{
  const gp = path.join(DIST, 'js', 'globe.js');
  if (fs.existsSync(gp)) {
    const g = fs.readFileSync(gp, 'utf8');
    if (!/export\s*\{[^}]*\bmountGlobe\b/.test(g)) err('dist/js/globe.js does not export mountGlobe');
    if (/from\s*["']https?:|import\(\s*["']https?:/.test(g)) err('dist/js/globe.js imports from a remote URL (three.js must be bundled)');
    const hash = require('node:crypto').createHash('sha256').update(fs.readFileSync(gp)).digest('hex').slice(0, 12);
    const app = fs.existsSync(path.join(DIST, 'js', 'app.js')) ? fs.readFileSync(path.join(DIST, 'js', 'app.js'), 'utf8') : '';
    if (!app.includes('js/globe.js?v=') || !app.includes(`"${hash}"`)) err(`dist/js/app.js does not carry this globe.js build's version ${hash} (stale bundle pairing)`);
  }
}

// 10. No unreplaced render-target markers (defense in depth)
for (const marker of ['<!-- DATA_INJECT -->', '<!-- JSONLD_INJECT -->', '<!-- PRERENDER_INJECT -->']) {
  if (html.includes(marker)) {
    err(`unreplaced ${marker} marker still in dist/index.html`);
  }
}

// 11. JSON-LD structured data block must be present and parse as valid JSON
const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!ldMatch) {
  err('missing <script type="application/ld+json"> structured data block');
} else {
  try {
    const ld = JSON.parse(ldMatch[1]);
    if (!ld['@context'] || !ld['@graph']) err('JSON-LD missing @context or @graph');
  } catch (e) {
    err(`JSON-LD failed to parse: ${e.message}`);
  }
}

// 12. Canonical link
if (!/<link[^>]+rel="canonical"/i.test(html)) {
  err('missing <link rel="canonical">');
}

// 13. SEO sidecars must exist
for (const p of ['robots.txt', 'sitemap.xml', 'llms.txt', 'methodology.md']) {
  if (!fs.existsSync(path.join(DIST, p))) err(`missing dist/${p}`);
}

if (errors.length) {
  console.error(`validate-html: ${errors.length} error(s)`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log('validate-html: OK');
console.log(`  dist/index.html: ${html.length} bytes`);
console.log(`  dist/js/app.js: ${fs.statSync(path.join(DIST,'js','app.js')).size} bytes`);
console.log(`  dist/css/styles.css: ${fs.statSync(path.join(DIST,'css','styles.css')).size} bytes`);
process.exit(0);
