# Global Conflict Monitor

> A global conflict monitoring dashboard: sourced events, an escalation ladder, markets, news and crisis indicators across three active conflict arcs. Its headline escalation figure is an editorial judgement, not a scientific forecast, a betting-market price, or a statistically scored prediction.

**What it is.** A dashboard by Jake Percy that follows three conflict arcs: the US-Israel-Iran war and the Strait of Hormuz; US-BRICS rivalry, read through four lenses (bilateral US-China, the BRICS bloc, the China-Russia-Iran-North Korea alignment, and allied cohesion); and the Russia-Ukraine war. The page has six tabs: Overview, Feed, Actors, Economy, Analysis and Outlook. The tabs have no addresses of their own, so link to the page.

**The headline figure.** The page labels it "WW3 Probability" and the data calls it ww3_pct. The page defines it: "The chance, within the next 12 months, of a war fought directly between major powers. Specifically: two or more of the five permanent UN Security Council members (the US, Russia, China, the UK and France) fighting each other with their own forces, rather than through allies or proxies." It adds: "The current US-Israel-Iran war is a regional conflict and does not by itself count".

**How it is produced.** It is derived, not picked. Four sub-axes are each scored from 0 to 100 in 5-point steps against written bands and historical anchors: {{axisNames}}. The headline is the mean of the four, rounded to the nearest whole number, and the project's data check fails if the published figure does not equal that mean. The rung shown beside it is the headline rounded down to the nearest ten, on this ladder: {{ladder}}. The rung is worked out mechanically from the headline. Separately, the scorer is told to place an axis on a band only when that band's trigger has occurred, not when it could plausibly occur.

**What the figure is not.** The page: "The number is our editorial judgement, drawn from the escalation ladder, what the main actors are doing, and market and conflict data. It is not a scientific forecast, a betting-market price, or a statistically scored prediction." It is not a measured or modelled probability. A rung name is the label of a band on the scale; what it means is the trigger text in escalation.json, not the name read on its own. Military alert levels such as DEFCON are not publicly observable, and no axis is scored on an inferred alert level.

**How events are sourced.** Each event carries its sources, a severity from 1 to 5, a confidence (high, medium or low) and a status (confirmed, reported, developing, disputed or historical). The project's rules: no synthetic data; fact, inference and unknown kept visibly separate; an update time is never advanced without new information. State media such as TASS, Xinhua, Press TV, RT and KCNA is used as a statement of record only and otherwise needs corroboration from a tier-1 source.

**Data and freshness.** Events, scores and analysis are written at each reviewed update and built into the page and the files below. Market prices, fuel prices and headline feeds are fetched live in the visitor's browser and are not in these files. Updates are not on a fixed clock; the time of the last one is base_last_update in meta.json, and that is the authority on how old this file's current reading is.

{{current}}

**Author.** Jake Percy. His contact details are in the file linked under Related.

## Data

{{dataMain}}

## Methodology

- [methodology{{methodExt}}]({{site}}methodology{{methodExt}}): the ladder with every trigger, the four axes with their bands, the headline rule, and what the method does not use

## Related

- [Global Conflict Monitor]({{site}}): the dashboard
- [Jake Percy](https://jakepercy.com/llms.txt): the author and his other dashboards

## Optional

{{dataOptional}}
