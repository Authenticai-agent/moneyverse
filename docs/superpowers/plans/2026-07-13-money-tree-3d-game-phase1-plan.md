# Money Tree 3D Game — Phase 1 Implementation Plan

**Spec:** `docs/superpowers/specs/2026-07-13-money-tree-3d-strategy-game-design.md`
**Branch:** `money-tree-3d-game`
**Goal of Phase 1:** a fully playable, educational MVP — setup → allocation over
a chosen horizon → economic events with explanations → coach → end report →
local best score, with a solid-but-simple 3D tree.

Each step is small, independently verifiable, and leaves the app in a working
state. Build order goes **engine first (pure, tested) → state → UI → 3D**, so the
rules are proven before anything renders.

## Status — Phase 1 COMPLETE ✅ (2026-07-13)

All nine steps landed on `money-tree-3d-game`. 47 unit tests pass (`npm run
test:unit`), type-check and lint are clean, the production build succeeds, and
the game was playtested end-to-end in the browser (setup → 3D stage → allocate →
grow → event explainers with correct math → report with badges/cards → persisted
best score).

**⚠️ One deployment gap:** the raw GLB models (64 MB) are gitignored, so they
exist locally but are NOT committed. On a deployed build the tree model will
404 and the game falls back to the 2D tree. Before deploy: compress the GLBs
(Draco / meshopt via gltf-transform — should cut them ~5-10×) and commit the
compressed versions, or host them on a CDN. Local dev already works because the
files are present on disk.

---

## Step 1 — Engine types & seeded RNG
**Files:** `app/lib/moneytree/types.ts`, `app/lib/moneytree/rng.ts`
- Define `Bucket` (`safe|growth|moonshot`), `Portfolio`, `Allocation`,
  `GameConfig` (start, contribution, frequency, years, mascot, seed),
  `MarketEvent`, `TurnResult`, `GameState` phases.
- Implement a small seeded PRNG (e.g. mulberry32) with a `nextFloat`/`nextRange`
  API. Deterministic given a seed.
- **Verify:** `vitest` — same seed produces the same sequence; different seeds differ.

## Step 2 — Content tables
**File:** `app/lib/moneytree/content.ts`
- Bucket return profiles (min/max/mean per bucket, from spec §4.2).
- Event definitions: id, emoji, title, per-bucket modifiers, and the
  kid-friendly copy (`whatHappened`, `perBucket`, `smartMove`).
- Money Card definitions (id, concept, blurb) and badge definitions.
- Reuse existing stage thresholds ($1k/$5k/$20k) — import or mirror the current
  `stageOf` logic; do not duplicate magic numbers loosely.
- **Verify:** `vitest` — every event's per-bucket modifier is within sane bounds;
  every card/badge has required fields (a simple shape test).

## Step 3 — Core engine (turn resolution)
**File:** `app/lib/moneytree/engine.ts`
- `resolveTurn(portfolio, allocation, config, rng) → TurnResult` — apply the
  year's contribution, roll each bucket, maybe draw & apply an event, compute new
  totals, stage, and bankruptcy flag.
- `computeContributionForYear(config)` — aggregate weekly/monthly/yearly/lump-sum
  to a yearly deposit (lump sum only in year 1).
- Pure functions only; no React, no `Date.now`/`Math.random` (RNG is injected).
- **Verify:** `vitest` — Safe never goes negative; compounding over N years with
  zero volatility matches the closed-form formula; an all-in-Moonshot crash path
  can reach bankruptcy; contribution aggregation is correct per frequency.

## Step 4 — Game state hook
**File:** `app/lib/moneytree/useMoneyTreeGame.ts`
- State machine `setup → playing → resolving → report`; actions:
  `startGame(config)`, `setAllocation`, `growYear()`, `replay()`.
- Tracks portfolio, current year, drawn events, unlocked cards, badges.
- `localStorage` wrapper (SSR-guarded) for best score / cards / badges.
- **Verify:** a small `vitest` (or a temporary debug harness) drives a full 12-year
  game headlessly and asserts it ends in `report` with a score.

## Step 5 — Setup screen
**File:** `app/components/moneytree/SetupScreen.tsx`
- Numeric inputs: starting amount, contribution amount; frequency picker
  (weekly/monthly/yearly/one-time); years stepper+input; 6-mascot picker.
- Coach explains compounding when a frequency is chosen (copy from `content.ts`).
- Calls `startGame(config)`.
- **Verify:** run the app; enter values, pick a mascot, start — state advances to
  `playing`. (Playtest per `playtesting-a-feature`.)

## Step 6 — Stage HUD + allocation bar (2D shell first)
**Files:** `app/components/moneytree/HUD.tsx`, `AllocationBar.tsx`,
`MoneyTreeGame.tsx` (orchestrator, replaces current file)
- HUD chips (value, Year X/N, best score); bottom allocation bar with the three
  buckets and **Grow the year ▶**.
- Use a simple placeholder tree (reuse current CSS tree) so the loop is playable
  before wiring 3D.
- **Verify:** play a full game end-to-end in the browser; values change per turn;
  reaching year N shows the report.

## Step 7 — Coach, event card, report, Money Cards
**Files:** `Coach.tsx`, `EventCard.tsx`, `ReportScreen.tsx`, `MoneyCard.tsx`
- Coach speech (nudges on risky all-in), animated event explainer between turns,
  end report (What worked / Watch out / Try next time + horizon comparison),
  card unlock toasts, Replay + Share (reuse existing share code).
- **Verify:** trigger a recession and an all-in Moonshot bust in play; confirm the
  explainer and the kind bankruptcy reset both appear and read correctly.

## Step 8 — 3D tree scene
**File:** `app/components/moneytree/TreeScene.tsx`
- `react-three-fiber` `<Canvas>` reusing the hero `MoneyTree` patterns; tree
  height/fullness bound to portfolio value; wilts on loss, coins on gain.
  Reduced-motion + mobile fallback to the 2D tree.
- Swap it into the Stage in place of the placeholder tree.
- **Verify:** playtest on desktop and a mobile viewport; confirm 60fps-ish, no
  console errors, graceful reduced-motion.

## Step 9 — Wire route, polish, full verification
**File:** `app/tools/money-tree-calculator/page.tsx`
- Ensure the page renders the new `<MoneyTreeGame/>`, `metadata` intact.
- Retain the "no real money, no advice" disclaimer and accessibility.
- **Verify:** `npm run type-check`, `npm run test`, `npm run lint`, and a final
  end-to-end playtest of a full game (win path + bankruptcy path).

---

## Sequencing notes
- Steps 1–4 have no UI and are guarded by unit tests — highest confidence first.
- The app stays runnable from Step 6 onward (placeholder tree), so 3D (Step 8)
  is a swap, not a blocker.
- Commit after each step on `money-tree-3d-game`.
- Phase 2/3 items (rich 3D animation, full card-collection UI, all mascot art,
  shareable-seed UX, account sync) are intentionally out of this plan.
