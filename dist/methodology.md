# Global Conflict Monitor: how the risk index is scored

By Jake Percy. Method v3, last reviewed 2026-08-16. Dashboard: https://conflict-monitor.jakepercy.com/

This is the public description of how the dashboard's headline figure and its four sub-axes are produced. The page labels the figure "WW3 Probability"; the data calls it ww3_pct. It is an editorial judgement index. In the page's words it is "not a scientific forecast, a betting-market price, or a statistically scored prediction."

## How updates are made

Updates are produced by an automated, LLM-assisted pipeline and published without pre-publication human review. To report an error, open an issue at https://github.com/jakeperc/conflict-monitor/issues.

## What the figure refers to

From the page: "The chance, within the next 12 months, of a war fought directly between major powers. Specifically: two or more of the five permanent UN Security Council members (the US, Russia, China, the UK and France) fighting each other with their own forces, rather than through allies or proxies. The current US-Israel-Iran war is a regional conflict and does not by itself count - the threshold is crossed only if one of those five powers enters the fighting directly."

## The headline rule

    ww3_pct = round(mean(kinetic, greatpower, wmd, alliance))

- Each of the four sub-axes is its own 0 to 100 scale and is set in 5-point steps.
- The headline is derived from the four sub-axes. It is not chosen separately.
- It is rounded to the nearest whole number; a half rounds up. Before 2026-08-16 it was rounded to the nearest 5, so older values move in steps of 5.
- The project's data check (npm run validate:data, part of npm test) fails if the published ww3_pct does not equal the rounded mean of the four axis scores in escalation.json.

## The ladder

The rung shown beside the headline is the headline rounded down to the nearest ten. Each rung has a trigger pattern.

| Score | Rung | Trigger |
|---|---|---|
| 10 | Diplomatic Tension | Sanctions, rhetoric, proxy skirmishes; HIIK Level 1 dispute; no kinetic between major-power-aligned states. Analog: US-China trade war peak 2018-19. |
| 20 | Limited Strikes | Targeted air/missile exchanges, no ground forces; UCDP minor armed conflict (>=25 KIA/yr). Analog: 2020 Soleimani strike + Iran al-Asad retaliation (de-escalated). |
| 30 | Regional Escalation | Multiple theater activation, proxy war expansion, one cross-border ground operation. Analogs: 2008 Russia-Georgia 5-day war; 2023 Sudan civil war outbreak. |
| 40 | Direct Conventional | State-vs-state ground operations OR naval blockade OR chokepoint disruption affecting global trade. UCDP war threshold (>=1,000 KIA/yr). Analogs: 1990-91 Gulf War; 2003 Iraq invasion; 1999 NATO Kosovo. |
| 50 | Great Power Signaling | Major-power red lines tied to ongoing kinetic, OR summit produces operational economic-architecture commitments, OR cyber op crosses Tallinn-Manual use-of-force. Analogs: 2022 Russia invasion early months; Stuxnet 2010; 2024 Israel-Iran direct exchanges; NotPetya 2017. |
| 60 | Nuclear Posturing | DEFCON 3 OR rival equivalent OR nuclear-armed state crosses enrichment threshold OR leadership invokes nuclear use with operational detail. Analogs: 1973 Yom Kippur DEFCON 3; 2017 'fire and fury'; Sep-Oct 2022 Russia nuclear rhetoric peak (Biden 'Armageddon'). |
| 70 | Alliance Fragmentation | NATO/Gulf/equivalent allied bloc PUBLICLY BREAKING with lead power on an operational commitment - not friction. Analogs: 1966 France leaves NATO integrated command; 2003 Iraq War 'Old vs New Europe' split; 2025 Trump Article-5 ambiguity moments. |
| 80 | Major-Power Nuclear Posturing | DEFCON 2 OR equivalent - nuclear weapons loaded onto delivery systems; max readiness short of launch. Reached publicly only twice. Analogs: Cuban Missile Crisis SAC at DEFCON 2 (Oct 22 - Nov 15 1962); 1991 Gulf War SAC at DEFCON 2; Able Archer 83 Soviet warhead loading. |
| 90 | Nuclear Threshold | Nuclear briefcase activated OR first-use doctrine published OR launch-decision window entered. Analogs: Cuban Missile 'Black Saturday' Oct 27 1962 (sub B-59 nearly fired nuclear torpedo; McNamara post-1990s: 99% if invasion); 1995 Norwegian rocket (only known briefcase activation). |
| 100 | Global Thermonuclear | Multi-party nuclear exchange has begun. NEVER OCCURRED. Doomsday Clock 85 seconds (Jan 2026, closest ever) is the standing macro indicator that systemic risk is elevated but not at this rung. |

How the ladder is read:

1. Strict reading. The scorer places a score on a rung only when that rung's named trigger has actually occurred. "Could plausibly happen" is the next rung down.
2. The ladder anchors the headline, not the individual sub-axes. A sub-axis can sit higher or lower than the headline rung.
3. Standing baseline. Once a fact becomes the standing baseline it holds the level where it is; it does not keep pushing the score up day after day.
4. Latent capability. A capability that is in place but unused, such as pre-positioned cyber access or frozen-but-not-confiscated reserves, adds 5 to the relevant sub-axis while it remains in place. The 5 is removed when the capability is used (the score then moves on the event itself) or verifiably removed.

## The four sub-axes

### Kinetic Intensity

- 0-19: No state-vs-state kinetic; only rhetoric and sanctions.
- 20-39: Limited proxy or state-on-state strikes; no major ground operations; no chokepoint disruption. UCDP "minor armed conflict" >=25 KIA/yr.
- 40-59: Active state-vs-state strikes with ceasefires or framework in place, even with significant violations; OR one chokepoint materially disrupted; OR major-power-allied proxy war with deep-strike tempo. UCDP "war" threshold (>=1,000 KIA/yr) for a sustained conflict.
- 60-79: Sustained state-vs-state operations without ceasefire framework; OR multiple chokepoints disrupted; OR formal blockade in effect; OR cyber operation directly accompanying kinetic strikes.
- 80-100: Multi-theater war between major-power blocs; direct major-power kinetic engagement.

### Great-Power Involvement

- 0-19: Major powers disengaged from regional conflicts; routine diplomacy only.
- 20-39: Diplomatic statements without operational commitments; quiet support.
- 40-59: Active mediation, weapons supply, or summit-level engagement with substantive deliverables. ICB great-power-activity moderate.
- 60-79: Major-power signaling - red-line statements, summit declarations on multipolar architecture, troop posture moves, joint exercises; direct US involvement in a regional war that has not yet drawn another major power kinetically.
- 80-100: Direct major-power kinetic involvement; major-power-vs-major-power threats; alliance kinetic engagement.

### WMD / Nuclear Posture

- 0-19: Standard non-proliferation regime intact.
- 20-39: Specific country crossing watchdog thresholds (increased enrichment, IAEA friction).
- 40-59: Specific country has weapons-grade material; rhetorical nuclear threats; verification regime degraded.
- 60-79: Specific country near breakout; DEFCON 3 declared OR equivalent rival posture move; new first-use rhetoric from a nuclear state with operational detail.
- 80-100: DEFCON 2 OR equivalent (nuclear weapons loaded); first-use doctrine adopted; breakout cleared; WMD employed.

### Alliance Cohesion (inverse)

- 0-19: All major alliances rock-solid; no public daylight.
- 20-39: Routine friction (burden-sharing); public unity intact.
- 40-59: Notable friction but alliances functional; allies publicly disagreeing while still coordinating; ceasefires holding.
- 60-79: Significant fragmentation: allies pulling back from joint operations, blocs forming, public diplomatic ruptures.
- 80-100: Major alliance collapse: NATO Article-5 in dispute; Gulf states formally breaking with US; multipolar bloc consolidation.

## What the method does not use

- DEFCON and other alert levels. No government publishes its current alert status. The method uses DEFCON only as a historical calibration anchor (1962, 1973, 1983, 1991). No live sub-axis is scored on an inferred alert level, and unofficial "DEFCON tracker" sites are not credited. Moving an axis on posture needs a named, dated, published action.
- The Doomsday Clock. It is background context for the nuclear axis and is not an input to the average.

## Frameworks the method draws on

Herman Kahn, On Escalation (1965); Thomas Schelling, Arms and Influence (1966); RAND, Dangerous Thresholds (2008); Libicki, Cyberspace Escalation: Ladders or Lattices?; the UCDP/PRIO Armed Conflict Dataset; the Correlates of War Militarized Interstate Disputes scale; the HIIK Heidelberg Conflict Barometer; the International Crisis Behavior project; the Tallinn Manual 2.0; Healey, Five Futures of Cyber Conflict; the Bulletin of the Atomic Scientists' Doomsday Clock; the CFR Preventive Priorities Survey.

## How much the headline can move

- A move of 5 or less is routine.
- A move of 10 needs new strategic information that moved at least two sub-axes by 5 or more.
- A move of 20 or more is reserved for a recalibration of the method or a genuine inflection event, such as a direct exchange between major powers or a nuclear test.

## Current reading

Stamped at build: data as of 11/12/2026, 06:00 EST; this changes at every update, so after 7 days treat it as history and read meta.json and escalation.json instead.

 Headline index: 66 on the 0-100 judgement scale (the rounded mean of the four axis scores below; an editorial judgement, not a forecast). Ladder rung: 60, labelled "Nuclear Posturing". The label names a band of the scale; the band's trigger is: DEFCON 3 OR rival equivalent OR nuclear-armed state crosses enrichment threshold OR leadership invokes nuclear use with operational detail. Analogs: 1973 Yom Kippur DEFCON 3; 2017 'fire and fury'; Sep-Oct 2022 Russia nuclear rhetoric peak (Biden 'Armageddon'). Axis scores, each 0-100: Kinetic Intensity 75; Great-Power Involvement 70; WMD / Nuclear Posture 60; Alliance Cohesion (inverse) 60. Strait of Hormuz status: CONTESTED (as of 2026-11-10). Events on file: 1581, dated 2026-01-14 to 2026-11-12. Lead headline per arc: Iran and Hormuz: "US charges Iran-backed plotters over British base as strikes pause"; US-BRICS: "US envoys meet Putin as APEC three-leader meeting stays unconfirmed"; Russia-Ukraine: "Abu Dhabi talks end with prisoner swap as US envoys meet Putin".
