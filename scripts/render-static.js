/*
 * Crawler/LLM-readable static content for dist/index.html.
 *
 * The React app mounts via ReactDOM.createRoot(...).render() (not hydrateRoot),
 * which unconditionally replaces the contents of <div id="root"> on mount.
 * That lets us inject semantic HTML inside #root that:
 *   - is visible to non-JS crawlers (Googlebot, GPTBot, ClaudeBot, …)
 *   - is wiped by React on the first client paint
 *
 * Inputs: the same `payload` object scripts/build.js assembles for
 * window.__DATA__. No DOM, no React, no JSX — plain template strings.
 */

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}
function escapeAttr(s) {
  // attributes are also escaped via the same rules; alias for readability
  return escapeHtml(s);
}

// Strip internal ID codes (FC-/IND-/GAP-/PAT-) from reader-facing prose and
// tidy the residue. Mirrors scrubCodes() in src/js/app.js so the crawler HTML
// and the React render stay in sync — codes are internal tasking IDs the public
// can't resolve. `cleanText` = scrub then HTML-escape (use for prose, not attrs).
function scrubCodes(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/\b(FC|IND|GAP|PAT)-[0-9A-Za-z-]+\b/g, '')
    .replace(/\(\s*[;,]?\s*/g, '(')
    .replace(/\s+([.,;:)])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
function cleanText(s) {
  return escapeHtml(scrubCodes(s));
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------
function renderHeader(meta) {
  const title = escapeHtml(meta.dashboard_title || 'Global Conflict Monitor');
  const built = escapeAttr(meta.last_built || '');
  const updateLabel = escapeHtml(meta.base_last_update || '');
  const pct = Number.isFinite(meta.ww3_pct) ? `${meta.ww3_pct}%` : '';
  return `
    <header class="prerender-header">
      <h1>${title}</h1>
      <p>Updated <time datetime="${built}">${updateLabel}</time>${pct ? ` · WW3 risk index: ${escapeHtml(pct)} (an editorial judgement, not a forecast; see llms.txt)` : ''}</p>
    </header>`;
}

function renderBreaking(breaking) {
  if (!Array.isArray(breaking) || breaking.length === 0) return '';
  const lead = cleanText(breaking[0]);
  return `
    <aside role="alert" class="prerender-breaking">
      <strong>Breaking:</strong> ${lead}
    </aside>`;
}

function renderLatestUpdates(initNews, limit = 20) {
  if (!Array.isArray(initNews) || initNews.length === 0) return '';
  const items = initNews.slice(0, limit);
  const lis = items.map((n) => {
    if (n.t === '--') {
      return `<li class="chapter"><h3>${escapeHtml(n.s || '')}${n.h ? ` — ${escapeHtml(n.h)}` : ''}</h3></li>`;
    }
    const time = n.t ? `<time>${escapeHtml(n.t)}</time> · ` : '';
    const src = n.s ? `<strong>${escapeHtml(n.s)}</strong> — ` : '';
    return `<li>${time}${src}${cleanText(n.h || '')}</li>`;
  }).join('\n        ');
  return `
    <section id="latest-updates">
      <h2>Latest updates</h2>
      <ul>
        ${lis}
      </ul>
    </section>`;
}

function renderTimeline(timeline, chapters) {
  if (!Array.isArray(timeline) || timeline.length === 0) return '';
  const parts = [];
  let lastChapter = null;
  for (const t of timeline) {
    const ch = chapters && chapters[t.isoDate];
    if (ch && ch.label !== lastChapter) {
      parts.push(`<li class="chapter"><h3>${escapeHtml(ch.label)}${ch.kicker ? ` — ${escapeHtml(ch.kicker)}` : ''}</h3></li>`);
      lastChapter = ch.label;
    }
    const sev = t.sev ? ` <span class="sev sev-${escapeAttr(t.sev)}">[${escapeHtml(t.sev)}]</span>` : '';
    parts.push(`<li><time>${escapeHtml(t.date || '')}</time>${sev} ${cleanText(t.desc || '')}</li>`);
  }
  return `
    <section id="timeline">
      <h2>Timeline</h2>
      <ol>
        ${parts.join('\n        ')}
      </ol>
    </section>`;
}

function renderKeyDevelopments(keyDevs) {
  if (!Array.isArray(keyDevs) || keyDevs.length === 0) return '';
  const lis = keyDevs.map((d) => `<li>${cleanText(d)}</li>`).join('\n        ');
  return `
    <section id="key-developments">
      <h2>Key developments</h2>
      <ul>
        ${lis}
      </ul>
    </section>`;
}

function renderPillar(lead, pillarId) {
  if (!lead || typeof lead !== 'object') return '';
  const facts = Array.isArray(lead.facts) && lead.facts.length
    ? `<dl>${lead.facts.map((f) => `<dt>${cleanText(f.l || '')}</dt><dd>${cleanText(f.v || '')}</dd>`).join('')}</dl>`
    : '';
  const bottom = lead.bottom_line ? `<p class="bottom-line"><strong>Bottom line:</strong> ${cleanText(lead.bottom_line)}</p>` : '';
  const changed = lead.changed ? `<h3>What changed</h3><p>${cleanText(lead.changed)}</p>` : '';
  const watch = lead.watch ? `<h3>What to watch</h3><p>${cleanText(lead.watch)}</p>` : '';
  const kicker = lead.kicker ? `<p class="kicker">${escapeHtml(lead.kicker)}</p>` : '';
  return `
    <article id="${escapeAttr(pillarId)}">
      <h2>${cleanText(lead.title || '')}</h2>
      ${kicker}
      ${bottom}
      <p>${cleanText(lead.summary || '')}</p>
      ${facts}
      ${changed}
      ${watch}
    </article>`;
}

function renderEscalation(meta, axes, ladder) {
  if (!Array.isArray(ladder) || ladder.length === 0) return '';
  const pct = Number.isFinite(meta.ww3_pct) ? meta.ww3_pct : null;
  let currentRung = null;
  if (pct !== null) {
    for (const rung of ladder) {
      if (rung.pct <= pct) currentRung = rung;
    }
  }
  const rungHtml = currentRung
    ? `<p>Current rung: <strong>${escapeHtml(currentRung.label)} (${currentRung.pct}%)</strong> — ${cleanText(currentRung.trigger || '')}</p>`
    : '';
  const axesHtml = Array.isArray(axes) && axes.length
    ? `<dl>${axes.map((a) => `<dt>${escapeHtml(a.label || '')} (${Number.isFinite(a.score) ? a.score : '?'})</dt><dd>${cleanText(a.currentLabel || '')}</dd>`).join('')}</dl>`
    : '';
  return `
    <section id="escalation">
      <h2>Escalation status</h2>
      ${rungHtml}
      ${axesHtml}
    </section>`;
}

// Outlook — reader-safe view of the internal forecasting registry. Mirrors the
// __DATA__.outlook projection that scripts/build.js assembles (already
// code-scrubbed there); cleanText() is the belt-and-braces backstop for Rule 8.
function renderOutlook(outlook) {
  if (!outlook || typeof outlook !== 'object') return '';
  const fc = Array.isArray(outlook.forecasts) ? outlook.forecasts : [];
  const open = fc
    .filter((f) => f.status === 'open')
    .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
    .slice(0, 12);
  const cal = outlook.calibration || null;
  const inds = Array.isArray(outlook.indicators) ? outlook.indicators.slice(0, 10) : [];
  const gaps = Array.isArray(outlook.gaps) ? outlook.gaps.slice(0, 8) : [];
  if (!open.length && !inds.length && !gaps.length) return '';

  const fcLis = open.map((f) => {
    const pct = Number.isFinite(f.probability) ? `${Math.round(f.probability * 100)}%` : '';
    const dl = f.deadline ? ` (resolves ${escapeHtml(f.deadline)})` : '';
    return `<li><strong>${escapeHtml(pct)}</strong> — ${cleanText(f.question)}${dl}</li>`;
  }).join('\n        ');

  const calHtml = cal
    ? `<p>Track record: ${escapeHtml(String(cal.total_resolved || 0))} forecasts resolved${
        Number.isFinite(cal.brier) ? `; Brier score ${escapeHtml(cal.brier.toFixed(2))} on the opening call (lower is better; 0.25 = always guessing 50%)` : ''
      }.</p>`
    : '';

  const indLis = inds.map((i) => {
    const sig = Number.isFinite(i.signal) ? ` (signal ${Math.round(i.signal * 100)}%)` : '';
    return `<li>[${escapeHtml(i.type || '')}] ${cleanText(i.indicator)}${sig}</li>`;
  }).join('\n        ');

  const gapLis = gaps.map((g) => `<li>[${escapeHtml(g.priority || '')}] ${cleanText(g.question)}</li>`).join('\n        ');

  return `
    <section id="outlook">
      <h2>Outlook — forecasts &amp; track record</h2>
      ${calHtml}
      ${open.length ? `<h3>Open forecasts</h3>\n      <ul>\n        ${fcLis}\n      </ul>` : ''}
      ${inds.length ? `<h3>Leading indicators</h3>\n      <ul>\n        ${indLis}\n      </ul>` : ''}
      ${gaps.length ? `<h3>Open questions we're still tracking</h3>\n      <ul>\n        ${gapLis}\n      </ul>` : ''}
    </section>`;
}

function renderMarketsSnapshot(payload) {
  const fmtAsOf = (iso) => {
    const dt = new Date(`${iso}T00:00:00Z`);
    return isNaN(dt) ? iso : dt.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };
  const lastRow = (arr) => (Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null);

  // Prefer the dated series the app renders (brent_series / gas_daily /
  // hormuz_series); fall back to the frozen legacy arrays for old payloads.
  const brentTail = lastRow(payload.brent_series);
  const brent = brentTail ? brentTail.v : lastRow(payload.brent_history);
  const gasTail = lastRow(payload.gas_daily);
  const gasNat = gasTail ? gasTail.nat : lastRow(payload.gas_nat_history);
  const hormuzTail = lastRow(payload.hormuz_series);
  const hormuz = hormuzTail ? hormuzTail.v : null;
  const ww3 = lastRow(payload.ww3_history);

  const rows = [];
  if (brent != null) rows.push(`<li>Brent crude: <strong>$${escapeHtml(brent)}/bbl</strong> (latest daily print)</li>`);
  if (gasNat != null) {
    const gasHistTail = lastRow(payload.gas_history);
    const ca = gasTail && gasTail.ca != null ? gasTail.ca : (gasHistTail && gasHistTail.ca);
    const caLabel = ca != null ? ` · California $${escapeHtml(ca)}` : '';
    const asOf = gasTail && gasTail.d ? ` (as of ${escapeHtml(fmtAsOf(gasTail.d))})`
      : (gasHistTail && gasHistTail.week ? ` (${escapeHtml(gasHistTail.week)})` : '');
    rows.push(`<li>US national gasoline: <strong>$${escapeHtml(gasNat)}/gal</strong>${caLabel}${asOf}</li>`);
  }
  // National diesel (AAA) — newest gas_daily row that actually carries a diesel value.
  const dieselTail = (Array.isArray(payload.gas_daily) ? payload.gas_daily : []).filter((r) => r && r.diesel != null).slice(-1)[0];
  if (dieselTail) {
    rows.push(`<li>US national diesel: <strong>$${escapeHtml(dieselTail.diesel)}/gal</strong> (AAA, as of ${escapeHtml(fmtAsOf(dieselTail.d))})</li>`);
  } else {
    // No AAA daily diesel row yet — fall back to the newest EIA weekly reading, labelled as such.
    const eiaTail = lastRow(payload.diesel_history);
    if (eiaTail) rows.push(`<li>US national diesel: <strong>$${escapeHtml(eiaTail.v)}/gal</strong> (EIA weekly average, week ending ${escapeHtml(fmtAsOf(eiaTail.d))})</li>`);
  }
  if (hormuz != null) rows.push(`<li>Strait of Hormuz transit: <strong>${escapeHtml(hormuz)}/138 tankers/day</strong> (as of ${escapeHtml(fmtAsOf(hormuzTail.d))})</li>`);
  if (ww3 != null) rows.push(`<li>WW3 probability tracker: <strong>${escapeHtml(ww3)}%</strong> (an editorial judgement, not a forecast)</li>`);

  if (rows.length === 0) return '';
  return `
    <section id="markets">
      <h2>Markets snapshot</h2>
      <ul>
        ${rows.join('\n        ')}
      </ul>
      <p><small>Live prices (BTC, ETH, S&amp;P 500, gold, WTI, etc.) load client-side and aren't available to non-JS crawlers.</small></p>
    </section>`;
}

// ---------------------------------------------------------------------------
// Top-level static content
// ---------------------------------------------------------------------------
function renderStaticContent(payload) {
  const meta = payload.meta || {};
  const pillars = `
    <section id="pillars">
      <h2>Conflict arcs</h2>
      ${renderPillar(payload.iran_lead, 'pillar-iran')}
      ${renderPillar(payload.brics_lead, 'pillar-brics')}
      ${renderPillar(payload.ukraine_lead, 'pillar-ukraine')}
    </section>`;

  // `hidden` attribute keeps the content in the HTML (so crawlers and LLMs that
  // parse raw HTML can read it) but hides it visually so users never see the
  // pre-render flash before React mounts and replaces the contents.
  return `<div data-prerendered="true" hidden aria-hidden="true">
    <p class="prerender-llms">A plain-text description of this dashboard, what its headline figure means and does not mean, and its data files: <a href="llms.txt">llms.txt</a>. How the index is scored: <a href="methodology.md">methodology.md</a>.</p>
    ${renderHeader(meta)}
    ${renderBreaking(payload.init_breaking)}
    ${renderLatestUpdates(payload.init_news, 20)}
    ${renderTimeline(payload.timeline, payload.timeline_chapters)}
    ${renderKeyDevelopments(payload.key_devs)}
    ${pillars}
    ${renderEscalation(meta, payload.escalation_axes, payload.escalation_ladder)}
    ${renderOutlook(payload.outlook)}
    ${renderMarketsSnapshot(payload)}
    <p class="prerender-footer"><small>This static rendering is generated at build time so search engines and AI crawlers can read the dashboard. Interactive charts, live market prices, and the full event archive load client-side.</small></p>
  </div>`;
}

// ---------------------------------------------------------------------------
// JSON-LD structured data
// ---------------------------------------------------------------------------
function renderJsonLd(payload) {
  const meta = payload.meta || {};
  const events = Array.isArray(payload.events) ? payload.events : [];
  const url = 'https://conflict-monitor.jakepercy.com/';
  const dataset_url = url + 'data/events.json';

  // Top 10 visible events, newest first
  const topEvents = events
    .filter((e) => e.feed_visibility || e.timeline_visibility)
    .filter((e) => !e.is_chapter_divider && e.headline)
    .sort((a, b) => (b.event_date || '').localeCompare(a.event_date || ''))
    .slice(0, 10);

  const newsArticles = topEvents.map((e) => {
    const author = (Array.isArray(e.sources) && e.sources[0] && e.sources[0].name) || 'Global Conflict Monitor';
    const article = {
      '@type': 'NewsArticle',
      headline: e.headline,
      datePublished: e.event_date,
      author: { '@type': 'Organization', name: author },
      mainEntityOfPage: url,
    };
    if (Array.isArray(e.sources) && e.sources[0] && e.sources[0].url) {
      article.url = e.sources[0].url;
    }
    return article;
  });

  const graph = [
    {
      '@type': 'WebSite',
      '@id': url + '#website',
      name: meta.dashboard_title || 'Global Conflict Monitor',
      url,
      description: 'Live global conflict monitoring dashboard — real-time markets, news, and crisis indicators.',
    },
    {
      '@type': 'Dataset',
      '@id': url + '#dataset',
      name: (meta.dashboard_title || 'Global Conflict Monitor') + ' — Event Dataset',
      description: 'Curated dataset of geopolitical events, escalation indicators, conflict pillars, and market signals tracked by the Global Conflict Monitor.',
      url,
      dateModified: meta.last_built || meta.now || undefined,
      version: meta.version || undefined,
      keywords: [
        'geopolitics', 'global conflict', 'Iran', 'China', 'Russia', 'Ukraine',
        'WW3 risk', 'escalation', 'Strait of Hormuz', 'oil markets', 'crisis monitoring',
      ],
      creator: { '@type': 'Organization', name: 'Global Conflict Monitor' },
      distribution: [
        {
          '@type': 'DataDownload',
          encodingFormat: 'application/json',
          contentUrl: dataset_url,
        },
      ],
    },
    ...newsArticles,
  ];

  const ld = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  // Inline JSON-LD — escape any "</script" sequence inside (same guard as the
  // data blob in build.js).
  const json = JSON.stringify(ld).replace(/<\/script/gi, '<\\/script');
  return `<script type="application/ld+json">${json}</script>`;
}

module.exports = {
  renderStaticContent,
  renderJsonLd,
  // exported for unit-testability and reuse
  escapeHtml,
  escapeAttr,
  scrubCodes,
};
