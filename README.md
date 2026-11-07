# Global Conflict Monitor

A dashboard by Jake Percy that follows three conflict arcs:
- the US-Israel-Iran war and the Strait of Hormuz;
- the Russia-Ukraine war;
- US-BRICS rivalry, read through four lenses: bilateral US-China, the BRICS bloc, the China-Russia-Iran-North Korea alignment, and allied cohesion.

It has six tabs: Overview, Feed, Actors, Economy, Analysis and Outlook.

**Live:** https://conflict-monitor.jakepercy.com/ · **Author:** [Jake Percy](https://jakepercy.com) · **Method:** [`methodology.md`](https://conflict-monitor.jakepercy.com/methodology.md)

## How it updates

Updates come from an automated, LLM-assisted editorial pipeline, run on the author's machine:
1. It researches recent reporting.
2. It drafts an update plan, then critiques and arbitrates it.
3. It applies the result to `data/*.json` and rebuilds `dist/`.
4. A publish script runs the tests and a set of safety checks in code, then commits the public files to this repository.
5. GitHub Pages serves the committed `dist/`.

> Updates are produced by an automated, LLM-assisted pipeline and published without pre-publication human review.

To report an error, open an issue on this repository. A dedicated issue form will be added.

## Build and test

```
npm ci
npm test         # validate data → build → validate HTML (network-free, a few seconds)
npm run build    # writes dist/ only
```

**A clone builds a reduced board.** Some inputs are private: the forecast and indicator registers, and the editorial plans the dated escalation history is derived from. A build from a fresh clone passes the tests but shows a one-day escalation history and an empty Outlook register. The live site is always served from the committed `dist/`, never rebuilt from a clone.

## Layout

```
src/        index template, stylesheet, React app (src/js/app.js), llms and methodology templates
scripts/    build, validators, sort, market-close update, static prerender
schemas/    JSON schemas and the known-outlets register used by the validators
data/       the editorial source of truth (14 public files; events.json is the largest)
dist/       build output, deployed as-is (never edit by hand)
```

## How the data is held to account

- **Sources:** every event cites its sources; outlet names are checked against `schemas/known_outlets.json`.
- **Separation:** fact, inference and unknown are kept apart, and verification levels are labelled.
- **No fabrication:** nothing is synthetic or extrapolated. Missing data is shown as missing, and timestamps move only when new information is ingested.
- **The headline index:** the "WW3 Probability" figure is an editorial judgement with a published method (`methodology.md`), not a model output.

## License

- Code: MIT ([`LICENSE`](LICENSE)).
- Editorial data and text: CC BY 4.0 ([`LICENSE-DATA`](LICENSE-DATA)).
