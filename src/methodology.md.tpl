# Global Conflict Monitor: how the risk index is scored

By Jake Percy. Method {{methodVersion}}. Dashboard: {{site}}

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

{{ladderTable}}

How the ladder is read:

1. Strict reading. The scorer places a score on a rung only when that rung's named trigger has actually occurred. "Could plausibly happen" is the next rung down.
2. The ladder anchors the headline, not the individual sub-axes. A sub-axis can sit higher or lower than the headline rung.
3. Standing baseline. Once a fact becomes the standing baseline it holds the level where it is; it does not keep pushing the score up day after day.
4. Latent capability. A capability that is in place but unused, such as pre-positioned cyber access or frozen-but-not-confiscated reserves, adds 5 to the relevant sub-axis while it remains in place. The 5 is removed when the capability is used (the score then moves on the event itself) or verifiably removed.

## The four sub-axes

{{axisBands}}

## What the method does not use

- DEFCON and other alert levels. No government publishes its current alert status. The method uses DEFCON only as a historical calibration anchor (1962, 1973, 1983, 1991). No live sub-axis is scored on an inferred alert level, and unofficial "DEFCON tracker" sites are not credited. Moving an axis on posture needs a named, dated, published action.
- The Doomsday Clock. It is background context for the nuclear axis and is not an input to the average.

## Frameworks the method draws on

Herman Kahn, On Escalation (1965); Thomas Schelling, Arms and Influence (1966); RAND, Dangerous Thresholds (2008); Libicki, Cyberspace Escalation: Ladders or Lattices?; the UCDP/PRIO Armed Conflict Dataset; the Correlates of War Militarized Interstate Disputes scale; the HIIK Heidelberg Conflict Barometer; the International Crisis Behavior project; the Tallinn Manual 2.0; Healey, Five Futures of Cyber Conflict; the Bulletin of the Atomic Scientists' Doomsday Clock; the CFR Preventive Priorities Survey.

## How much the headline can move

- A move of 5 or less is routine.
- A move of 10 needs new strategic information that moved at least two sub-axes by 5 or more.
- A move of 20 or more is reserved for a recalibration of the method or a genuine inflection event, such as a direct exchange between major powers or a nuclear test.

{{current}}
