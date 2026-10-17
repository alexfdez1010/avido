# Gamification

Rules live in `src/game/` (pure functions) and are applied by `src/store/game.ts`.

## XP

| Source | XP |
| --- | --- |
| Reading | `(minutes × 6 + pages × 4) × streak multiplier` |
| Daily goal met | `50 × streak multiplier` |
| Chapter finished | 15 |
| Quest completed | 40–90 depending on the quest |
| All three daily quests | +100 |
| Book finished | `300 + min(700, round(pages × 1.5))` |
| Achievement unlocked | Defined per achievement |

## Levels

- XP required for level `n`: `round(80 × (n − 1)^1.7)`.
- A new title every three levels (Curious → Ink legend).

## Streaks

- A day counts when the daily minute goal is met.
- Streak multiplier: `1 + 0.02 × min(streak, 25)` (up to ×1.5).
- Freezes cover missed days automatically. You start with one and earn one every 7 streak days (max 3).

## Quests

Three quests per day, picked deterministically from a pool seeded by the date (`src/game/quests.ts`). One is always a reading-time quest whose target scales with the daily goal; the other two come from the remaining pool. These are local rules, not server-assigned challenges or randomized purchases.

## Achievements

32 achievements (`src/game/achievements.ts`) covering books opened and finished, library size, streaks, pages, session length, goals met, quests, levels and reading habits (night owl, early bird, weekend, speed reader). Achievement IDs are persisted — never rename them.

## Yearly challenge

A yearly book target (`yearlyGoal`, 24 by default); the Trophies screen shows progress and whether they are ahead of or behind pace.

## Measurement and limits

The default daily goal is 20 minutes and can be changed in Profile. Time and progress are estimates recorded by the app, not measures of comprehension. Reward time pauses in the background, during loading or reader sheets, and after three minutes without reading interaction. A separately chosen session reminder continues to count foreground reading without requiring gestures. Reflowed page counts are estimates; PDF pages use the document's page count. Finishing a reflowed book estimates its length at 1,500 characters per page (with a fallback when length is unavailable).

The mechanics are designed to make returning to a chosen book rewarding. The repository does not establish a clinical or experimentally proven effect on addiction, attention or habit formation. See [habit-loop.md](habit-loop.md) for the product hypothesis and reader controls.
