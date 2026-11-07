#!/usr/bin/env node
/*
 * Sort data/events.json in place using the same canonical order the validator
 * checks for. Run this if validate-data flags an out-of-order entry.
 */
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'data', 'events.json');
const events = JSON.parse(fs.readFileSync(file, 'utf8'));

function compare(a, b) {
  if (a.event_date !== b.event_date) return a.event_date < b.event_date ? -1 : 1;
  if (a.is_chapter_divider !== b.is_chapter_divider) return a.is_chapter_divider ? -1 : 1;
  if (a.timeline_visibility !== b.timeline_visibility) return a.timeline_visibility ? -1 : 1;
  const ta = a.source_time, tb = b.source_time;
  if (ta == null && tb == null) return 0;
  if (ta == null) return 1;
  if (tb == null) return -1;
  return ta < tb ? -1 : ta > tb ? 1 : 0;
}

events.sort(compare);
fs.writeFileSync(file, JSON.stringify(events, null, 2) + '\n');
console.log(`sorted ${events.length} events in ${file}`);
