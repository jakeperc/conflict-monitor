#!/usr/bin/env node
/*
 * Append a manual changelog entry to automation/logs/changelog_<DATE>.md.
 * Usage: node scripts/generate-changelog.js "summary text"
 */
const fs = require('node:fs');
const path = require('node:path');

const summary = process.argv.slice(2).join(' ') || 'manual entry';
const today = new Date().toISOString().slice(0, 10);
const file = path.join(__dirname, '..', 'automation', 'logs', `changelog_${today}.md`);
fs.mkdirSync(path.dirname(file), { recursive: true });
const line = `- ${new Date().toISOString()} — ${summary}\n`;
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, `# Changelog — ${today}\n\n${line}`);
} else {
  fs.appendFileSync(file, line);
}
console.log(`appended to ${file}: ${summary}`);
