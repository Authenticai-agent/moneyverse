# Money Tree: Grow or Bust — Design Spec

**Date:** 2026-07-13
**Status:** Approved (design), pending implementation plan
**Repo:** `financeappforkids` (MoneyVerse) · Next.js 15 · React 19 · react-three-fiber · Tailwind
**Replaces:** the current 2D calculator in `app/components/MoneyTreeGame.tsx`

## 1. Summary

Transform the existing Money Tree compound-growth calculator (a passive 2D tool
where sliders set inputs once and a tree scales up) into a **3D investing
strategy game** for kids aged **9–14**. Each game, the player invests an
allowance across several years, allocating money among risk buckets and riding
real economic ups and downs. Smart, patient, diversified play grows a towering
Money Forest; reckless all-in gambling can lead to bankruptcy. The game is
**explicitly educational**: a coach, event explainers, collectible concept
cards, and an end-of-game report ensure kids understand *what they did, why it
worked or didn't, and how the economy affects their money*.

**Design principle:** simple to start, rewarding to master — appealing to a
9-year-old on the surface, with enough depth that a 14-year-old stays hooked.

## 2. Goals & non-goals

### Goals
- Teach investing, compound growth, risk vs. reward, diversification, and how
  economic events (recession, boom, inflation, scams, surprise expenses,
  interest-rate changes) affect a portfolio.
- Make decisions carry **real consequences** — including the possibility of
  bankruptcy — with a kind, instant, no-shame reset.
- Be genuinely fun and replayable (score to beat, collectibles, personalization).
- Keep it a **free public tool** — no login required for the core experience.

### Non-goals (for this spec)
- No real money, no real investment advice (retain the existing disclaimer).
- No account/backend sync in Phase 1 (progress is local to the device).
- No leaderboards, multiplayer, or multi-world campaign in Phase 1 (see Phase 3).

## 3. Target audience

Kids **9–14**. Because that band is wide, the UI must be immediately playable for
younger kids (big controls, clear feedback, forgiving) while offering depth for
older kids (strategy, collectibles, badges, "beat your best"). The coach is
toggle-off so older kids aren't talked down to.

## 4. Game design

### 4.1 Setup (player-configured)
Before play, the child builds their own plan with real inputs:
- **Starting amount** — free numeric input (any value).
- **Contribution** — a numeric amount input **plus a frequency picker**:
  `weekly` / `monthly` / `yearly` / `one-time lump sum`.
- **Horizon** — number of years, chosen by the child (stepper + input).
- **Mascot / coach** — pick 1 of **6**: 2 animals, 2 boys, 2 girls
  (placeholder set: Penny 🐿️, Prof. Hoot 🦉, Leo, Max, Zoe, Mia). The chosen
  mascot becomes the coach voice for the whole game.

**Teachable moment at setup:** when the child chooses a contribution frequency,
the coach explains **compounding** and **why consistency matters** — adding a
little regularly keeps feeding the snowball; a lump sum gets more time in the
market up front, while regular contributions build the habit and smooth the
bumps. Both are valid and the game lets kids feel the difference.

### 4.2 The turn loop (repeats once per year for the chosen horizon)
1. **Collect** — the year's contribution arrives (per chosen frequency,
   aggregated to the yearly deposit); existing holdings keep riding their buckets.
2. **Allocate** — split available coins across three buckets:

   | Bucket | Yearly return | Character | Teaches |
   |---|---|---|---|
   | 🏦 Safe Seed | +2% to +4%, never negative | Boring, reliable | Savings/bonds, safety |
   | 🌳 Growth Tree | −10% to +20% (avg ≈ +7%) | Bumpy but climbs | Index funds, patience |
   | 🚀 Moonshot | −60% to +150%, rare total crash | Rollercoaster | High risk/reward, don't bet it all |

   *(Exact distributions are tunable constants in `content.ts`; the values above
   are the design intent, not final magic numbers.)*
3. **Market rolls** — each bucket returns its roll from a **seeded RNG**;
   sometimes a **surprise event** modifies the outcome (see 4.4).
4. **Tree reacts** — grows taller and sprouts coins on gains; loses leaves and
   wilts on losses. Advance to the next year.

### 4.3 Compounding & contribution model
- Turns represent **years**; contributions and returns compound **annually**.
- Sub-yearly frequencies (weekly/monthly) aggregate into that year's deposit; a
  small modeling nuance (more frequent = marginally more time in market) may be
  reflected, but clarity for kids takes priority over financial precision.
- The longer the chosen horizon, the more dramatic the compounding — the end
  report makes this explicit (e.g., "at 1 year you'd have had $340; you chose 12
  — time is your superpower").

### 4.4 Economic events (each carries an explanation)
Events are drawn occasionally during market rolls. Each event definition
includes kid-friendly copy: **what happened**, **how it hit each bucket**, and
**what a smart investor does**. Initial set:
- 📉 **Recession** — economy slows; Growth dips, Moonshot crashes hardest, Safe holds.
- 📈 **Boom** — broad gains, Moonshot soars.
- 🌡️ **Inflation** — money buys less; framed as why growth must outpace it.
- 🕵️ **Scam** — drains money sitting in Moonshot (ties into MoneyVerse's existing
  *Scam Shield* theme).
- 💸 **Surprise expense** — an unexpected cost reduces cash.
- 🏦 **Interest-rate change** — nudges Safe returns; light-touch explanation.

### 4.5 Scoring, winning, losing
- **Score** = total portfolio value at the end of the chosen horizon.
- **Stages** (reuse existing thresholds): 🌱 Seed → 🌿 Sapling ($1k) →
  🌳 Tree ($5k) → 🌲 Money Forest ($20k).
- **Bankruptcy** = portfolio hits ≈ $0 (realistically only via all-in Moonshot
  through crashes). Shows a kind "Wiped out — spread your risk next time 🌱"
  screen with one-tap replay. **No shaming, no dead-end.**
- **Best score** persists locally; end screen celebrates a new best and offers
  Share (reusing the existing share implementation).

### 4.6 Education layer (first-class pillar)
- **Coach (mascot)** — teaches before the first turn, nudges risky moves
  ("all your eggs in one basket!"), explains outcomes. Never blocks a choice.
  Toggle-off available.
- **Event explainers** — every event surfaces its real-economics explanation in
  kid language (see 4.4).
- **Money Cards** 🎴 — collectible concept cards (compounding, diversification,
  inflation, bull/bear market, risk, etc.), unlocked through play. Collecting
  hooks the "catch 'em all" instinct while building vocabulary.
- **End-of-game report** — three-part debrief: **What worked ✅ / Watch out ⚠️ /
  Try next time 🎯**, including a horizon comparison and a plain-language summary
  of which bucket drove results.

### 4.7 Progression & replay (light, local, no login)
- Local persistence of **best score, unlocked Money Cards, and badges**
  (in the spirit of the existing `achievements.ts`). Example badges: *First
  Forest* (reach $20k), *Diversified* (never >50% in one bucket for a whole
  game), *Comeback Kid* (recover from <$500 to >$5k).

## 5. UX / screen design

**"Stage" layout (approved).** The 3D world fills the screen; HUD chips float on
top; the allocation controls sit in a bottom action bar. Feels like a console
game and is the most mobile-friendly option.

- **Top-left HUD:** 💰 total value · 📅 Year X / N.
- **Top-right:** 🏆 best score.
- **Center/stage:** the 3D money tree (and forest as it grows).
- **Bottom action bar:** 🏦 Safe / 🌳 Growth / 🚀 Moonshot allocation controls,
  a "coins to place" counter, and a **Grow the year ▶** button.
- **Between turns:** an animated market-result / event card.
- **End:** the report screen with score, stage, badges/cards, Replay + Share.
- **Mobile:** collapses to 3D-on-top, controls-below.
- **Accessibility:** honor `prefers-reduced-motion` (as the current game does),
  keyboard operable, retain the "simulation for learning — no real money, no
  advice" disclaimer.

## 6. Technical architecture

Clean separation between the **game brain** (pure, testable rules) and the
**game face** (3D + UI that render state).

### 6.1 Game engine — `app/lib/moneytree/` (pure TS, no React, unit-tested)
- `types.ts` — shared types (Portfolio, Allocation, Bucket, Event, GameConfig, …).
- `rng.ts` — **seeded** PRNG; enables reproducible games ("share your exact
  market") and deterministic tests.
- `content.ts` — data tables: bucket return profiles, event definitions **with
  their explanatory copy**, Money Card and badge definitions. All educational
  text lives here as data for easy editing/expansion.
- `engine.ts` — pure turn resolution: `(portfolio, allocation, roll) → portfolio`;
  applies contributions, bucket returns, events; computes stage; detects
  bankruptcy.

### 6.2 Game state — `app/lib/moneytree/useMoneyTreeGame.ts`
- State machine: `setup → playing → resolving → report`. Owns portfolio, year,
  allocation, drawn events, unlocked cards. UI reads from it; **no game logic in
  components.**
- `localStorage` wrapper for best score / badges / cards, SSR-guarded. No backend.

### 6.3 3D scene — `app/components/moneytree/TreeScene.tsx`
- `react-three-fiber` `<Canvas>` reusing the existing hero `MoneyTree` patterns
  (LoD meshes, instanced coins/leaves, seasons). Tree height/fullness driven by
  portfolio value; wilts/drops leaves on losses; coins sprout on gains.
  Reduced-motion and mobile fallbacks.

### 6.4 UI components — `app/components/moneytree/`
- `MoneyTreeGame.tsx` — orchestrator (**replaces the current file**).
- `SetupScreen.tsx` — inputs + frequency picker + mascot picker.
- `HUD.tsx` — value and year chips.
- `AllocationBar.tsx` — the three risk buckets.
- `Coach.tsx` — mascot + speech bubble.
- `EventCard.tsx` — economic event explainer.
- `MoneyCard.tsx` — collectible concept card.
- `ReportScreen.tsx` — end-of-game debrief.
- Reuse existing stage thresholds, tree-scale logic, share code, and
  `achievements.ts` style.

### 6.5 Route
- `app/tools/money-tree-calculator/page.tsx` keeps owning `metadata` and renders
  the new `<MoneyTreeGame/>`. No other part of the app changes.

### 6.6 Testing
- `vitest` (already in the repo) covers the engine: return bounds per bucket,
  compounding math, event effects, bankruptcy detection, and seed determinism.

## 7. Phasing

- **Phase 1 — Playable MVP:** engine + setup (inputs, frequency, years, mascot)
  + allocation + events + coach + end report + local best score, with a
  solid-but-simple 3D tree. This is already the full game.
- **Phase 2 — Depth & polish:** richer 3D (wilt/coin animations), Money Card
  collection UI, all 6 mascots with art, shareable game seed.
- **Phase 3 — Optional, later:** account-synced progress, additional
  worlds/difficulty, leaderboards.

## 8. Open items / future
- Final mascot names and art (emoji placeholders for now; art via a later asset
  pass).
- Exact tuning of bucket distributions and event probabilities (playtest to
  balance so patient/diversified reliably beats reckless over long horizons).
- Whether sub-yearly contribution frequency affects returns beyond aggregation.
