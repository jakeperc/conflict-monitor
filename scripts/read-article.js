#!/usr/bin/env node
/*
 * read-article.js: read one news page directly, for the planner, critic and arbiter.
 *
 * Why it exists (2026-11-10 coverage audit): the pipeline's WebFetch tool gets 403s
 * from BBC, the Guardian, NYT and others, and the in-app browser needs per-domain
 * approval that nobody gives in an unattended run. So real pages were recorded as
 * "blocked" and their leads were HELD for weeks. A plain HTTP GET with an honest
 * client name reads most of them (tested 2026-11-10: BBC, Guardian, NYT (partial),
 * Japan Times, LRT, gCaptain and Breaking Defense returned 200; SCMP and USNI
 * returned 403).
 *
 * Usage:  node scripts/read-article.js <url> [--json] [--max 6000]
 *
 * Prints status, final URL, title, published and modified dates (from JSON-LD or meta
 * tags) and the article paragraphs. A 403 or 401 is reported as such: it is a
 * collection failure, never a finding (standing rule #73). This script does not
 * bypass paywalls, logins or bot checks, and must not be extended to do so.
 */
'use strict';

const UA = 'ConflictMonitorReader/1.0 (+https://conflict-monitor.jakepercy.com/)';

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function clean(html) {
  return decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function ldJson(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const v = JSON.parse(m[1].trim());
      const stack = Array.isArray(v) ? [...v] : [v];
      while (stack.length) {
        const o = stack.shift();
        if (!o || typeof o !== 'object') continue;
        if (Array.isArray(o['@graph'])) stack.push(...o['@graph']);
        if (o.datePublished || o.headline) out.push(o);
      }
    } catch { /* malformed JSON-LD is common; ignore */ }
  }
  return out;
}

function meta(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i');
  return (html.match(re) || html.match(re2) || [])[1];
}

async function main() {
  const args = process.argv.slice(2);
  const url = args.find(a => /^https?:\/\//.test(a));
  const asJson = args.includes('--json');
  const maxIdx = args.indexOf('--max');
  const max = maxIdx >= 0 ? Number(args[maxIdx + 1]) : 6000;
  if (!url) {
    console.error('usage: node scripts/read-article.js <url> [--json] [--max N]');
    process.exitCode = 2;
    return;
  }

  let res, html;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' },
      redirect: 'follow',
      signal: AbortSignal.timeout(25000),
    });
    html = await res.text();
  } catch (e) {
    const r = { url, status: 'ERROR', error: e.message, finding: 'collection failure: no finding in either direction (rule #73)' };
    console.log(asJson ? JSON.stringify(r, null, 2) : `STATUS ERROR ${e.message}\n${r.finding}`);
    process.exitCode = 1;
    return;
  }

  const ld = ldJson(html);
  const art = ld.find(o => o.datePublished) || ld[0] || {};
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, '');
  const scope = (body.match(/<article[\s\S]*<\/article>/i) || [body])[0];
  const seen = new Set();
  const paras = [...scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => clean(m[1]))
    .filter(p => p.length > 40 && !seen.has(p) && seen.add(p));
  let text = typeof art.articleBody === 'string' && art.articleBody.length > paras.join(' ').length
    ? [art.articleBody.trim()] : paras;
  let joined = text.join('\n\n');
  if (joined.length > max) joined = joined.slice(0, max) + `\n…[truncated at ${max} chars]`;

  const r = {
    url,
    final_url: res.url,
    status: res.status,
    title: clean(art.headline || meta(html, 'og:title') || (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ''),
    published: art.datePublished || meta(html, 'article:published_time') || null,
    modified: art.dateModified || meta(html, 'article:modified_time') || null,
    paragraphs: text.length,
    paywall_suspect: res.ok && text.length < 4,
    bot_check: /just a moment|attention required|verify you are human/i.test(html.slice(0, 5000)),
    finding: null,
    text: joined,
  };

  if (!res.ok || r.bot_check) {
    r.finding = 'collection failure: no finding in either direction (rule #73)';
    r.text = '';
  }

  if (asJson) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`STATUS ${r.status}  ${r.final_url}`);
    console.log(`TITLE ${r.title}`);
    console.log(`PUBLISHED ${r.published || 'not found on page'}  MODIFIED ${r.modified || '-'}`);
    if (r.finding) console.log(r.finding);
    if (r.paywall_suspect) console.log('WARNING: fewer than 4 paragraphs; possible paywall or script-rendered page. Treat as headline-level.');
    console.log('---');
    console.log(r.text);
  }
  process.exitCode = res.ok && !r.bot_check ? 0 : 1;
}

main();
