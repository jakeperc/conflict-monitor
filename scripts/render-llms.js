/*
 * llms.txt + methodology.md for dist/.
 *
 * llms.txt is a short plain-text description of the dashboard for AI readers:
 * what it tracks, what the headline figure is and is not, where the data files
 * are. methodology.md is the public version of project-memory/RISK_METHODOLOGY.md.
 *
 * The prose is hand-written in src/llms.txt.tpl and src/methodology.md.tpl.
 * Everything that changes between updates — the headline, the axis scores, the
 * rung, the ladder, the event count, the arc headlines — is filled from the
 * same data build.js publishes, and stamped with base_last_update (the data's
 * own time, per "timestamp follows data"), never with the build time.
 *
 * Two rules shape the code:
 *   1. This must never be the reason the daily build fails. Bad or missing
 *      data drops the "Current reading" block; it does not throw.
 *   2. Output is ASCII only. The host serves .txt with no charset header, so
 *      anything else arrives garbled. Unmappable characters are dropped.
 *
 * The opening blockquote of llms.txt must match this dashboard's row in
 * JakePercy.com/content/llms/sites.json (checked by scripts/check-llms.mjs
 * over there).
 */
const fs = require('node:fs');
const path = require('node:path');
const { scrubCodes } = require('./render-static');

const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://conflict-monitor.jakepercy.com/';
// If the host serves .md without a content type, change this to '.txt'.
const METHOD_EXT = '.md';
// Updates land every few days; past this the stamped block is history.
const STALE_AFTER_DAYS = 7;

// Fold to ASCII. Code points are numbers, never literal symbols or unicode
// escapes: some tools decode an escape into the raw (even invisible) character,
// and a zero-width one inside a regex class would change what it matches.
const cp = (...codes) => String.fromCodePoint(...codes);
const oneOf = (...codes) => new RegExp('[' + cp(...codes) + ']', 'g');
const around = (...codes) => new RegExp('\\s*[' + cp(...codes) + ']\\s*', 'g');

const FOLD = [
  [oneOf(0x2018, 0x2019, 0x2032), "'"],
  [oneOf(0x201C, 0x201D, 0x2033), '"'],
  [around(0x2014), ' - '],
  [oneOf(0x2010, 0x2011, 0x2012, 0x2013, 0x2212), '-'],
  [oneOf(0x2026), '...'],
  [around(0x00B7), ', '],
  [oneOf(0x2192), '->'],
  [oneOf(0x2265), '>='],
  [oneOf(0x2264), '<='],
  [oneOf(0x00D7), 'x'],
  [oneOf(0x20AC), 'EUR '],
  [oneOf(0x00A3), 'GBP '],
  [oneOf(0x00A0, 0x2009, 0x202F), ' '],
];

function ascii(s) {
  let out = String(s == null ? '' : s);
  for (const [re, to] of FOLD) out = out.replace(re, to);
  return out.normalize('NFKD').replace(/[^\x00-\x7F]/g, '');
}

// One line of reader-facing prose: internal codes stripped, bounded length.
function line(s, max = 220) {
  const t = ascii(scrubCodes(s)).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '') + '...';
}

const DATA_NOTES = {
  'meta.json': ['main', 'the headline index (ww3_pct), the time of the last update (base_last_update), the Strait of Hormuz status and the war start date'],
  'escalation.json': ['main', 'the ladder rungs with their trigger text, and the four axes with a score and a one-line reason each'],
  'events.json': ['main', 'every event on file: id, event_date, headline, body, sources, severity 1-5, confidence, status, theaters, tags'],
  'ai_cards.json': ['main', 'the analysis cards and the three arc leads (title, summary, facts, what changed, what to watch)'],
  'themes.json': ['main', 'key developments and the since-your-last-visit brief'],
  'actors.json': ['main', 'risk countries, the main actors and the theaters'],
  'markets.json': ['main', 'dated history for oil, fuel prices, Hormuz transits and the headline index'],
  'glossary.json': ['main', 'the glossary: term, expansion and definition'],
  'breaking.json': ['optional', 'the lines in the breaking ticker'],
  'human_cost.json': ['optional', 'human-cost figures by group, with a scope note'],
  'political_calendar.json': ['optional', 'elections, leaders and a watchlist'],
  'econ_commentary.json': ['optional', 'economy commentary cards'],
  'map_overlays.json': ['optional', 'map arcs, hotspots and labels'],
  'chart_series.json': ['optional', 'dated anchor points for the charts'],
};

function dataLinks(files, group) {
  return files
    .filter((f) => (DATA_NOTES[f] ? DATA_NOTES[f][0] : 'optional') === group)
    .map((f) => `- [${f}](${SITE_URL}data/${f}): ${DATA_NOTES[f] ? DATA_NOTES[f][1] : 'published data file'}`)
    .join('\n');
}

// The stamped block. Returns '' rather than throwing if the data is not as
// expected, so a surprise in data/ cannot break the build.
function currentReading({ meta, escalation, events, leads }, heading) {
  try {
    const pct = meta.ww3_pct;
    const axes = escalation.axes;
    if (!Number.isFinite(pct) || !Array.isArray(axes) || !axes.length || !meta.base_last_update) return '';
    const rungPct = Math.floor(pct / 10) * 10;
    const rung = (escalation.ladder || []).find((r) => r.pct === rungPct);
    const dates = events.map((e) => e.event_date).filter(Boolean).sort();
    const parts = [
      `Headline index: ${pct} on the 0-100 judgement scale (the rounded mean of the four axis scores below; an editorial judgement, not a forecast).`,
      rung ? `Ladder rung: ${rungPct}, labelled "${ascii(rung.label)}". The label names a band of the scale; the band's trigger is: ${line(rung.trigger, 420)}` : '',
      `Axis scores, each 0-100: ${axes.map((a) => `${ascii(a.label)} ${a.score}`).join('; ')}.`,
      meta.hormuz_status && meta.hormuz_status.label
        ? `Strait of Hormuz status: ${ascii(meta.hormuz_status.label)}${meta.hormuz_status.as_of ? ` (as of ${meta.hormuz_status.as_of})` : ''}.`
        : '',
      dates.length ? `Events on file: ${events.length}, dated ${dates[0].slice(0, 10)} to ${dates[dates.length - 1].slice(0, 10)}.` : '',
      leads.length ? `Lead headline per arc: ${leads.map(([name, l]) => `${name}: "${line(l.title, 160)}"`).join('; ')}.` : '',
    ].filter(Boolean);
    return `${heading(`data as of ${ascii(meta.base_last_update)}; this changes at every update, so after ${STALE_AFTER_DAYS} days treat it as history and read meta.json and escalation.json instead`)} ${parts.join(' ')}`;
  } catch (e) {
    console.warn('[build] llms: current reading skipped -', e.message);
    return '';
  }
}

// "### kinetic — Kinetic Intensity" + its band table, lifted from the internal
// methodology so the public page cannot drift from it. First two columns only.
function axisBands(escalation) {
  let src = '';
  try {
    src = fs.readFileSync(path.join(ROOT, 'project-memory', 'RISK_METHODOLOGY.md'), 'utf8');
  } catch (_) { /* described without bands below */ }
  return (escalation.axes || []).map((a) => {
    const out = [`### ${ascii(a.label)}`, ''];
    const sec = src.match(new RegExp(`^### ${a.key} [^\\n]*\\n([\\s\\S]*?)(?=^### |^---|^## )`, 'm'));
    const rows = sec
      ? [...sec[1].matchAll(/^\|\s*(\d+-\d+)\s*\|\s*([^|]+?)\s*\|/gm)].map((m) => `- ${m[1]}: ${line(m[2].replace(/\*/g, ''), 400)}`)
      : [];
    out.push(rows.length ? rows.join('\n') : 'Scored 0 to 100 in 5-point steps.');
    return out.join('\n');
  }).join('\n\n');
}

function methodVersion() {
  try {
    const src = fs.readFileSync(path.join(ROOT, 'project-memory', 'RISK_METHODOLOGY.md'), 'utf8');
    const m = src.match(/^Last reviewed:\s*(\d{4}-\d{2}-\d{2})\s*\((v\d+)/m);
    if (m) return `${m[2]}, last reviewed ${m[1]}`;
  } catch (_) { /* fall through */ }
  return 'version not recorded';
}

function fillTemplate(name, fill) {
  const tpl = fs.readFileSync(path.join(ROOT, 'src', name), 'utf8');
  return ascii(tpl.replace(/\{\{(\w+)\}\}/g, (all, k) => (k in fill ? fill[k] : all)))
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

/*
 * ctx: { meta, escalation, events, ai_cards, dataFiles }
 * Returns { 'llms.txt': string, 'methodology.md': string }.
 */
function renderLlms(ctx) {
  const { meta, escalation, events, ai_cards, dataFiles } = ctx;
  const leads = [
    ['Iran and Hormuz', ai_cards.iran_lead],
    ['US-BRICS', ai_cards.brics_lead],
    ['Russia-Ukraine', ai_cards.ukraine_lead],
  ].filter(([, l]) => l && l.title);
  const reading = { meta, escalation, events, leads };

  const llms = fillTemplate('llms.txt.tpl', {
    site: SITE_URL,
    methodExt: METHOD_EXT,
    axisNames: (escalation.axes || []).map((a) => ascii(a.label)).join('; '),
    ladder: (escalation.ladder || []).map((r) => `${r.pct} ${ascii(r.label)}`).join('; '),
    current: currentReading(reading, (stamp) => `**Current reading (${stamp}).**`),
    dataMain: dataLinks(dataFiles, 'main'),
    dataOptional: dataLinks(dataFiles, 'optional'),
  });

  const methodology = fillTemplate('methodology.md.tpl', {
    site: SITE_URL,
    methodVersion: methodVersion(),
    ladderTable: [
      '| Score | Rung | Trigger |',
      '|---|---|---|',
      ...(escalation.ladder || []).map((r) => `| ${r.pct} | ${ascii(r.label)} | ${line(r.trigger, 600).replace(/\|/g, '/')} |`),
    ].join('\n'),
    axisBands: axisBands(escalation),
    current: currentReading(reading, (stamp) => `## Current reading\n\nStamped at build: ${stamp}.\n\n`),
  });

  const leftover = (llms + methodology).match(/\{\{\w+\}\}/);
  if (leftover) console.warn(`[build] llms: unresolved placeholder ${leftover[0]}`);

  // The headline's definition is quoted from the on-page tooltip. Warn (never
  // throw: this must not break a daily build) if the tooltip has been reworded.
  try {
    const app = ascii(fs.readFileSync(path.join(ROOT, 'src', 'js', 'app.js'), 'utf8')).replace(/\s+/g, ' ');
    // Hand-written templates only: stamped data (arc headlines) is not on the page's source.
    for (const name of ['llms.txt.tpl', 'methodology.md.tpl']) {
      const tpl = ascii(fs.readFileSync(path.join(ROOT, 'src', name), 'utf8'));
      // Sequential pairs, so an opening quote is never matched against the next closing one.
      for (const [, q] of tpl.matchAll(/"([^"\n]*)"/g)) {
        if (q.length >= 40 && !app.includes(q.replace(/\s+/g, ' '))) {
          console.warn(`[build] llms: src/${name} quotes a sentence that is no longer in src/js/app.js:\n  "${q.slice(0, 120)}"`);
        }
      }
    }
  } catch (e) {
    console.warn('[build] llms: quote check skipped -', e.message);
  }
  return { 'llms.txt': llms, [`methodology${METHOD_EXT}`]: methodology };
}

module.exports = { renderLlms, SITE_URL, METHOD_EXT };

// `node scripts/render-llms.js` prints llms.txt from data/ without building.
if (require.main === module) {
  const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
  const INTERNAL = new Set(['forecasts.json', 'indicators.json', 'intel_gaps.json', 'event_first_seen.json', 'escalation_history.json']);
  const out = renderLlms({
    meta: read('meta.json'),
    escalation: read('escalation.json'),
    events: read('events.json'),
    ai_cards: read('ai_cards.json'),
    dataFiles: fs.readdirSync(path.join(ROOT, 'data')).filter((f) => f.endsWith('.json') && !INTERNAL.has(f)),
  });
  process.stdout.write(out[process.argv.includes('--methodology') ? `methodology${METHOD_EXT}` : 'llms.txt']);
}
