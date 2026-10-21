# TDD Evidence: vs-computer win/loss record

**Source plan:** none — journey written directly during this run.

## User journey

As a player, I want my wins and losses against the computer to persist across
page reloads, so I have a sense of overall track record instead of it
resetting every time I start a new match.

## Task report

| Step | What happened | Command | Result |
|---|---|---|---|
| RED | Added `test/gameStats.test.ts` importing a module that did not yet exist | `npx vitest run gameStats` | FAIL — `Cannot find module '../src/lib/gameStats'` (correct reason: missing implementation, not a typo/setup bug) |
| GREEN | Implemented `src/lib/gameStats.ts` (`getStats`, `recordResult`, `resetStats`, injectable `StatsStorage`) | `npx vitest run gameStats` | PASS — 7/7 |
| Wire-up | Called `recordResult(winnerIsPlayer1)` from `handleAttack.ts` (vs-computer mode only, at the point the winner is decided); displayed the record on `modeSelect.ts` via `getStats()` | manual read-through | n/a |
| Full suite | Re-ran everything after wiring | `npx tsc --noEmit`, `npm run lint`, `npx vitest run --coverage` | tsc clean; lint clean; 37/37 tests pass (30 pre-existing + 7 new) |

## Test specification

| # | What is guaranteed | Test | Type | Result |
|---|---|---|---|---|
| 1 | Fresh/empty storage yields `{wins:0, losses:0, gamesPlayed:0}` | `gameStats.test.ts:getStats returns zeroed defaults` | unit | PASS |
| 2 | A win increments `wins` and `gamesPlayed`, not `losses` | `gameStats.test.ts:recordResult(true) increments wins` | unit | PASS |
| 3 | A loss increments `losses` and `gamesPlayed`, not `wins` | `gameStats.test.ts:recordResult(false) increments losses` | unit | PASS |
| 4 | Results accumulate correctly across repeated calls | `gameStats.test.ts:persists and accumulates across calls` | unit | PASS |
| 5 | `resetStats` zeroes the record and the reset is itself persisted | `gameStats.test.ts:resetStats zeroes everything` | unit | PASS |
| 6 | Corrupted JSON in storage does not throw; falls back to defaults | `gameStats.test.ts:falls back ... corrupted JSON` | unit | PASS |
| 7 | A validly-parsed but wrong-shaped stored value falls back to defaults | `gameStats.test.ts:falls back ... wrong shape` | unit | PASS |

## Coverage and known gaps

`npx vitest run --coverage`: `gameStats.ts` — 90% statements / 94.44% lines / 80% functions / 94.44% branches. The one uncovered line (27) is the `defaultStorage()` branch that reads real `window.localStorage` — intentionally untested here since every test injects a fake in-memory `StatsStorage` instead of touching the DOM/browser API (this repo's Vitest environment is plain Node, no `window`). That branch is exercised at runtime by the actual browser session, not by this unit suite.

Project-wide coverage after this change: 83.12% statements / 72.72% branches / 82.85% functions / 85.23% lines. Branch coverage sits below the 80% target driven by pre-existing gaps in `EventBus.ts` and `Player.ts` (untouched by this task) — not introduced or worsened by this change, and out of scope to fix here without being asked.

## Not covered by an automated test

The actual DOM wiring (`modeSelect.ts` showing the line only once a game has been played, `handleAttack.ts` calling `recordResult` at the right moment for the right side) was verified by reading the code paths, not by a DOM-level test — this repo has no DOM test environment (jsdom/happy-dom) configured, only Node-environment unit tests for pure logic.
