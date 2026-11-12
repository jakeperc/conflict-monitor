# Global Conflict Monitor

Static, data-first dashboard: `npm run build` turns `data/*.json` and `src/` into `dist/` (`index.html` + `js/` + `css/` + `data/`). Windows / PowerShell environment.

## Publishing: one live version only
- **`dist/` is the only live artifact.** GitHub Pages serves the committed `dist/` at https://conflict-monitor.jakepercy.com/.
- **`npm run publish` is the only way an update reaches GitHub.** It runs the tests and every safety gate, then commits and pushes only the allowlisted public files. Never run `git push`, `git add -A` or `git commit --amend` by hand during a pipeline run.
- **Preview `dist/`, never the repo-root `index.html`.** That root file is a frozen pre-rebuild reference: local only, not live. Never preview, edit or publish it.

## Rules for every session in this folder
- **Work in this checkout only.** Never use a worktree or a clone for code changes. A build there lacks the private inputs and produces a reduced board.
- **Land code before you end the session.** If you changed `src/`, `scripts/` or `schemas/`, run `npm run publish -- --check`, then push a branch and open a pull request (`ci.yml` tests it). Once the maintainer merges it, pull `master` and leave this checkout on `master`, clean. The automated publish refuses a checkout that is on another branch, holds uncommitted code, or is behind a merged pull request.
- **Keep machine paths out of repo files.** Never write a local machine path into any file in this repo. A push guard on this machine blocks protected names and machine paths; never bypass it (`--no-verify` is forbidden).
- **Every commit uses the noreply identity.**

## Memory: local only, absent in a clone
Project memory lives in `project-memory/`. It is private, not in this repo, and backed up to a private mirror. At the start of any session in this folder:
1. Read `project-memory/theaters-registry.md`, the load-order dispatcher (ACTIVE / MONITORING / COLD per arc and theater).
2. Read `project-memory/conflict-memory-index.md`, the master index and latest daily status.
3. Load a full arc or theater file (`arc-*.md`, `theater-*.md`) only when it is ACTIVE or a trigger fires. Skip COLD.
4. Read `project-memory/standing-rules.md` in full.

## Daily update pipeline
The full daily update is `/conflict-update` (local only): backup → plan → critique → arbitrate → execute → memory, then `npm run publish`. This file is for ad-hoc sessions; it complements the pipeline and does not replace it.

## Standing rules (canonical list in `project-memory/standing-rules.md`)
- **No synthetic data:** live-fetched, user-provided or absent. Never fabricate or extrapolate.
- **Asset prices are live-fetched or shown as a dated close.** Never a hardcoded constant.
- **The timestamp follows the data:** never bump `updated_at` or "as of" without ingesting new information.
- **Fact, inference and unknown stay visibly separate.** Label the verification level and cite sources.
- **Overview is the summary, Analysis is the depth.** Overview stays scannable; long-form lives on Analysis.
- **Arc framing follows the live `theaters-registry.md` set:** three arcs, Iran/Epic Fury, US-BRICS and Russia-Ukraine. Do not revert to the obsolete two-pillar framing.

## Fixes: issue first, then a pull request
- When you find a problem in this repo (something wrong, broken, missing or misleading), open a GitHub issue before fixing it: what is wrong, how it shows up, the likely cause.
- Fix it on a short branch and open a pull request whose description says `Fixes #<issue>`. The maintainer approves the merge; merging closes the issue.
- New features may skip the issue. Automated data publishes and scheduled runs never open one.
- Issue and pull request text is public. Run it through the local text guard before posting; it follows the same rules as files in this repo (no machine paths, no protected names).
- After the merge, pull the default branch and leave this checkout on it, clean, before the session ends.
