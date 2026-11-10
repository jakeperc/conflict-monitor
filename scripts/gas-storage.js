#!/usr/bin/env node
/*
 * gas-storage.js: EU aggregate gas storage from GIE AGSI+, the operators' own
 * transparency platform (https://agsi.gie.eu). Read-only; prints, writes nothing.
 *
 * Why it exists (2026-11-10 coverage audit): the board had no European winter-gas
 * line, and the September audit withheld a storage figure because the planner's
 * fetch tools could not reach AGSI. A plain HTTP GET can: on 10 Nov it returned
 * gas day 2026-11-08 at 72.38% full. A secondary tracker had given 72.65% for the
 * same day, which is why the planner cites this primary instead.
 *
 * Usage: node scripts/gas-storage.js [--days 14] [--json]
 * Cite as "GIE AGSI+" with the gas day, never the run date (the timestamp follows the data).
 */
'use strict';

const UA = 'ConflictMonitorReader/1.0 (+https://conflict-monitor.jakepercy.com/)';

async function main() {
  const args = process.argv.slice(2);
  const di = args.indexOf('--days');
  const days = di >= 0 ? Number(args[di + 1]) : 14;
  let rows;
  try {
    const r = await fetch('https://agsi.gie.eu/api?type=eu', {
      headers: { 'User-Agent': UA, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    rows = (await r.json()).data || [];
  } catch (e) {
    console.log(`AGSI unreachable (${e.message}): collection failure, no finding in either direction (rule #73). Do not estimate.`);
    process.exitCode = 1;
    return;
  }
  const out = rows.slice(0, days).map((d) => ({
    gas_day: d.gasDayStart,
    full_pct: Number(d.full),
    trend_pts_per_day: Number(d.trend),
    in_storage_twh: Number(d.gasInStorage),
    injection_gwh: Number(d.injection),
    withdrawal_gwh: Number(d.withdrawal),
    status: d.status,
  }));
  if (args.includes('--json')) {
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  if (!out.length) {
    console.log('AGSI returned no rows: collection failure, not a finding.');
    process.exitCode = 1;
    return;
  }
  const [a] = out;
  const wk = out.find((x) => x.gas_day <= new Date(Date.parse(a.gas_day) - 7 * 86400e3).toISOString().slice(0, 10));
  console.log(`EU gas storage (GIE AGSI+): ${a.full_pct.toFixed(2)}% full on gas day ${a.gas_day}` +
    ` (${a.in_storage_twh.toFixed(1)} TWh; trend ${a.trend_pts_per_day >= 0 ? '+' : ''}${a.trend_pts_per_day} pts/day` +
    (wk ? `; ${(a.full_pct - wk.full_pct).toFixed(2)} pts vs ${wk.gas_day}` : '') + `; status ${a.status})`);
  for (const x of out) console.log(`  ${x.gas_day}  ${x.full_pct.toFixed(2)}%  inj ${x.injection_gwh}  wd ${x.withdrawal_gwh}`);
}

main();
