# Gamification

Rules live in `src/game/` (pure functions) and are applied by `src/store/game.ts`.

## XP

| Source | XP |
| --- | --- |
| Reading | `(minutes × 6 + pages × 4) × streak multiplier` |
| Daily goal met | `50 × streak multiplier` |
| Quest completed | 40–90 depending on the quest |
| All three daily quests | +100 |
| Book finished | `300 + min(700, pages × 1.5)` |
| Achievement unlocked | Defined per achievement |

## Levels

- XP required for level `n`: `round(80 × (n − 1)^1.7)`.
- A new title every three levels (Curious → Ink legend).

## Streaks

- A day counts when the daily minute goal is met.
- Streak multiplier: `1 + 0.02 × min(streak, 25)` (up to ×1.5).
- Freezes cover missed days automatically. You start with one and earn one every 7 streak days (max 3).

## Quests

Three quests per day, picked deterministically from a pool seeded by the date (`src/game/quests.ts`). Targets scale with the daily goal.

## Achievements

32 achievements (`src/game/achievements.ts`) covering books opened and finished, library size, streaks, pages, session length, goals met, quests, levels and reading habits (night owl, early bird, weekend, speed reader). Achievement IDs are persisted — never rename them.

## Yearly challenge

A yearly book target (`yearlyGoal`, 24 by default); the Trophies screen shows progress and whether they are ahead of or behind pace.
