# Money Tree World Rebuild — Phase 0 Audit

This is the contract checklist for the rebuild. Every item below must be
surfaced *somewhere* in the new world (a place, a character, a diegetic sign,
or — for the two cases called out — a minimal overlay). Nothing in
`app/lib/moneytree/` changes; this document only describes how the current
presentation layer (`app/components/moneytree/` + `MoneyTreeGame.tsx`)
consumes it, so the new layer can consume it identically.

Read order for future phases: this file, then `useMoneyTreeGame.ts` and
`MoneyTreeGame.tsx` directly if a field's exact update timing matters.

---

## 1. State read from `useMoneyTreeGame()`

| Field | Type | Consumed by | Notes |
|---|---|---|---|
| `phase` | `'setup' \| 'playing' \| 'resolving' \| 'report'` | `MoneyTreeGame.tsx` top-level branch | Drives which of setup/report/stage renders. World rebuild must replace this branch with in-world states, not screen swaps (see master prompt). |
| `config` | `GameConfig \| null` | Everywhere `game.config` is read | `{ startAmount, contributionAmount, frequency, years, mascot, seed }`. Null only during `setup`. |
| `portfolio` | `Portfolio` (`Record<Bucket, number>`) | HUD total, AllocationBar "already invested", CashOutPanel balances, wilting check | Live bucket balances, still invested. |
| `year` | `number` (1-based) | HUD year chip, coach line selection, `isFinalTurn` calc | Current or just-resolved year. |
| `totalYears` | `number` | HUD year chip (`year / totalYears`) | `config.years`, 0 before config exists. |
| `coinsThisYear` | `number` | AllocationBar `coins` prop | This year's deposit in dollars (start amount folded in for year 1). |
| `allocation` | `Allocation` | `normalizeAllocation(game.allocation)` → `weights` used for `allocationCoachLine` | Set via `setAllocation`; MoneyTreeGame derives this from `tossHistory` counts (see §7). |
| `results` | `TurnResult[]` | `coinsForYear` sum for `contributed`, passed to `ReportScreen` | Full turn history. |
| `lastResult` | `TurnResult \| null` | `wilting` calc, HUD yoy calc, `EventCard`, stage-up/bankrupt sfx effect | The most recently resolved turn; null until year 1 resolves. |
| `summary` | `GameSummary \| null` | `ReportScreen` | Only non-null in `'report'` phase. See §5 for shape. |
| `progress` | `MoneyTreeProgress` | HUD "Best" chip (`progress.bestScore`) | `{ bestScore, cardIds, badgeIds, gamesPlayed }`, persisted to localStorage by the frozen layer. |
| `isNewBest` | `boolean` | `ReportScreen`, triggers `sfx.newBest()` | |
| `newCardIds` | `string[]` | `ReportScreen` → `MoneyCard fresh` badge | |
| `newBadgeIds` | `string[]` | `ReportScreen` → badge "· new" label | |
| `cashOut` | `number` | HUD/AllocationBar `cashOut`, CashOutPanel, combined-wealth calcs | Total cashed out so far, no longer invested. |
| `withdrawals` | `Withdrawal[]` | Passed through to `summarizeGame` (inside the frozen hook); not read directly by current UI | Available if the world wants to show a withdrawal history. |
| `lastSellMessage` | `string \| null` | `CashOutPanel` sellMessage | Coach's reaction to the most recent sale; null once superseded. |

## 2. Actions called on `useMoneyTreeGame()`

| Action | Called from | Trigger |
|---|---|---|
| `startGame(config)` | `MoneyTreeGame.startGame` wrapper (bumps local `epoch` first) | `SetupScreen`'s "Plant my tree & play" button |
| `setAllocation(allocation)` | `useEffect` on `tossHistory` change | Fires every time a coin is tossed/undone — see §7 for the exact counts→allocation mapping (no more "unplaced defaults to Safe") |
| `sellShares(bucket, fraction)` | `CashOutPanel.onSell` | Sell 25%/50%/All buttons per bucket |
| `growYear()` | `AllocationBar.onGrow` | "Grow the year" button, gated on all `NUM_COINS` placed |
| `next()` | `EventCard.onContinue` | "Next year ▶" / "See results 🎉" button |
| `replay()` | `ReportScreen.onReplay` (bumps local `epoch` first) | "Play again" button |
| `resetToSetup()` | `ReportScreen.onNewPlan` | "New plan" button |

## 3. Every `sfx.*` call site (from the frozen `app/lib/moneytree/sound.ts`)

| Call | File | Trigger |
|---|---|---|
| `sfx.grow()` | `MoneyTreeGame.tsx` | Immediately on "Grow the year" click, before `growYear()` |
| `sfx.gain()` | `MoneyTreeGame.tsx` (`lastResult` effect) | Year resolved, not bankrupt/stage-up, `outcomeTone === 'good'` |
| `sfx.loss()` | `MoneyTreeGame.tsx` (`lastResult` effect) | Year resolved, not bankrupt/stage-up, `outcomeTone === 'bad'` (also triggers shake) |
| `sfx.stageUp()` | `MoneyTreeGame.tsx` (`lastResult` effect) | Year resolved, `stageRank` increased vs. previous (also triggers 2.2s confetti) |
| `sfx.newBest()` | `MoneyTreeGame.tsx` (phase/isNewBest effect) | 350ms after landing on `'report'` phase with `isNewBest` |
| `sfx.bankrupt()` | `MoneyTreeGame.tsx` (`lastResult` effect) | Year resolved with `result.bankrupt` true (also triggers shake) |
| `sfx.cashOut()` | `MoneyTreeGame.tsx` (`CashOutPanel.onSell` callback) | Right after `sellShares()` on every sale |
| `sfx.click()` | `MoneyTreeGame.tsx` (`toggleMuted`) | Only when *unmuting* (never on mute) |
| `sfx.coinLaunch()` | `CoinToss.tsx` (`FlyingCoin` mount effect) | Every coin flight starts (toss or undo) |
| `sfx.coinLand()` | `CoinToss.tsx` (`handleFlightDone`) | Only on `kind: 'toss'` landing, not on undo |
| `sfx.coinBack()` | `MoneyTreeGame.tsx` (`undoToss`) | "↺ Undo" button press |

Also: `isMuted()` / `setMuted()` — persisted mute flag, read once on mount
(`useEffect(() => setMutedState(isMuted()), [])`) and written by
`toggleMuted`. The new world needs exactly one mute toggle wired the same way.

## 4. Every coach-line trigger (from the frozen `app/lib/moneytree/coach.ts`)

| Function | Called from | Condition |
|---|---|---|
| `compoundingLine(mascot, frequency)` | `SetupScreen.tsx` | Always shown, live-updates as the player changes contribution frequency |
| `introLine(mascot)` | `MoneyTreeGame.tsx` | `phase === 'playing'`, no active risk warning, `year === 1` |
| `allocationCoachLine(mascot, weights)` | `MoneyTreeGame.tsx` | `phase === 'playing'`, evaluated every render from `normalizeAllocation(game.allocation)`; takes priority over intro/tip when non-null (returns `{ text, warn }` or `null`) |
| `playingPhaseLine(mascot, { year, portfolio })` | `MoneyTreeGame.tsx` | `phase === 'playing'`, no risk warning, `year > 1` — internally alternates `cashOutSuggestionLine` (every 3rd year from year 3) and `educationalTipLine` (deterministic by year) |
| `eventReactionLine(mascot, result)` | `EventCard.tsx` | Every resolved year, alongside `yearInsight(result)`'s factual explanation |
| `sendOffLine(mascot, result.year + 1)` | `EventCard.tsx` | Every resolved year *except* the final turn (`isFinal` false) |
| `cashOutGreetingLine(mascot, year)` | `MoneyTreeGame.tsx` → `CashOutPanel.greeting` | Passed every time the Cash Out panel opens; only shown if no `lastSellMessage` yet this visit |
| `sellReactionLine(mascot, {...})` | Inside the frozen `sellShares()` (sets `lastSellMessage`) | Every sale, shown in `CashOutPanel` in place of the greeting |
| `reportLine(mascot, {...})` | `ReportScreen.tsx` | Always, in the "`{coach.name}` says" block |

**Priority order while playing** (`MoneyTreeGame.tsx`, only one shown at a
time): active risk warning → year-1 intro → rotating tip/cash-out nudge. The
world's coach dialogue must preserve this precedence.

## 5. Other `app/lib/moneytree/*` reads (all frozen, consume as-is)

- **`engine.ts`**: `totalOf(portfolio)`, `stageOf(total)`, `normalizeAllocation(allocation)`, `coinsForYear(config, year)`. Also `resolveTurn`/`sellFromBucket`/`applyTurn` etc. are used *inside* the frozen hook only — the presentation layer never calls them directly.
- **`content.ts`**: `BUCKET_PROFILES` (`Record<Bucket, BucketProfile>` — `emoji`, `label`, `blurb`, `realWorld`, `minReturn`, `maxReturn`, `wipeChance`), `STAGE_THRESHOLDS` (`{ stage, min, emoji, label }[]`, 4 stages: seed/sapling/tree/forest), `BANKRUPT_THRESHOLD` (`= 1`), `MONEY_CARDS`, `BADGES`.
- **`mascots.ts`**: `MASCOTS` (4 entries: wizard/Sage-balanced, robot/Bit-cautious, adventurer/Robin-bold, hero/Nova-calm — each `{ id, name, role, persona, personaLabel, tagline, emoji, model }`), `mascotById(id)`, `TREE_MODEL` (`/models/moneytree/pixel-tree-broad-deciduous-3d.glb`).
- **`format.ts`**: `money(n)` (`"$1,234"`), `percent(fraction)` (`"+7%"` / `"-3%"`).
- **`insights.ts`**: `yearInsight(result): YearInsight` — `{ emoji, title, tone: 'good'|'bad'|'mixed', whatHappened, smartMove }`.
- **`summary.ts`**: `GameSummary` — `{ total, score, stage, bankrupt, treeValue, cashOut, shadowTotal, soldAnything, withdrawals, contributed, unlockedCardIds, earnedBadgeIds }`. `shadowTotal` is "what it'd be worth if nothing had ever been sold" — drives `SellComparison`.
- **`storage.ts`**: `MoneyTreeProgress` — `{ bestScore, cardIds, badgeIds, gamesPlayed }`.
- **`types.ts`**: `Bucket` (`'safe'|'growth'|'moonshot'`), `BUCKETS` (ordered array), `GameConfig`, `Portfolio`, `Allocation`, `Stage`, `TurnResult`, `Withdrawal`, `GamePhase`, `BucketProfile`, `MoneyCard`, `Badge`.

## 6. Current presentation-layer file-by-file

- **`MoneyTreeGame.tsx`** — orchestrator. Owns `tossHistory`/`epoch` (coin-toss state, *not* in the frozen hook — this is presentation-layer bookkeeping the world must replicate or replace with its own equivalent), `muted`, `celebrating`, `shaking`, `maximized`. Branches on `game.phase` to render `SetupScreen` / `ReportScreen` / the Stage. Computes derived display values: `wilting`, `yoy`, `totalGrowth`, `contributed`, `isFinalTurn`, coach text/warn per §4's priority order.
- **`SetupScreen.tsx`** — local state only (`startAmount`, `contributionAmount`, `frequency`, `years`, `mascot`), emits one `GameConfig` via `onStart`. Shows bucket explainers (`BUCKET_PROFILES`) and a live `compoundingLine`. Mascot picker over all 4 `MASCOTS`.
- **`HUD.tsx`** — pure display: total, stage, year/totalYears, best score, yoy/totalGrowth (`GrowthStat`), mute toggle, maximize toggle, back link. No state of its own.
- **`TreeScene.tsx`** — R3F `<Canvas>` root (`next/dynamic(ssr:false)` from `MoneyTreeGame.tsx`). Owns `CameraRig` (responsive dolly+FOV by aspect ratio, see constants `REFERENCE_ASPECT`/`MAX_DISTANCE_SCALE`/`MAX_FOV`), `TreeModel` (GLB load + toon re-material + growth/wilt animation, `growthFactor(total)` = `0.55 + sqrt(min(total,50000)/50000)*0.85`, range **0.55–1.4** — this is the exact number the master prompt calls out as too narrow), `GrowthBurst` (particle burst on total increase), `Coins` (5 static tier-gated floating coins at `total > 400/1500/4000/10000/20000`), `<Environment />`, `<CoinToss />`. Falls back to `fallback` prop on `prefers-reduced-motion` or a caught error (`GLBoundary` class component).
- **`Environment.tsx`** — procedural grove: sky color `#CFEEFB` / fog `#E9F3E0` (10–23 fog range), `Ground` (grass-dirt texture, radius 6), 6 procedural `PineTree`s (stacked cones), 2 `Bush` GLBs, 4 `Rock`s (icosahedra), 2 fence runs (3 posts each), 2 flickering `Lantern`s (emissive box + point light), 1 `Pond` (water disc + 3 lily pads), 6 `Flower` clusters, 34-point `AmbientMotes` cloud. All positions hand-placed for a ~6-unit-radius diorama, not a walkable field — will need full respacing for Phase 1's ~60×60 unit world.
- **`CoinToss.tsx`** — R3F physics mini-game: `NUM_COINS = 10`, tight bucket layout (`BUCKET_POS`, spread <4 units), Rapier `<Physics>` + `RigidBody` per landed coin, scripted (non-physics) `FlyingCoin` arc animation, `BucketGlow` pulsing affordance, drei `<Text>` labels using self-hosted `/fonts/inter-bold.woff` (deliberately not an `Html` overlay — see file's own comment on why). Fully controlled by `history: Bucket[]` prop; `settledRef`/`rendered` state lags by one in-flight coin, `busyRef` serializes taps.
- **`Coach.tsx`** — docked avatar (persistent, always clickable) + dismissible speech bubble, sized with `cqw` container-query units off the Stage's `containerType: inline-size`. This is the "coach as a character" pattern the world should extend, not replace.
- **`AllocationBar.tsx`** — 2D bottom panel: progress bar + tossed count + Undo, 3 bucket cards (tap to toss, ⓘ info popover, "tap to add a coin" hint), Cash Out button (only if `canSell`), Grow-the-year button gated on all 10 coins placed (label changes to "Toss N more coins first" when not). This whole panel is the master prompt's target for replacement by garden-plot stations (Phase 4).
- **`CashOutPanel.tsx`** — `createPortal`-to-`document.body` overlay, `z-[60]` (must outrank the Stage's own `z-[50]` when maximized — see §7). Sell 25%/50%/All per bucket, shows `lastSellMessage` or `greeting`. This is the one overlay the master prompt explicitly permits keeping (frosted glass over the world) since fractional selling needs real numbers.
- **`EventCard.tsx`** — same portal/z-index pattern as CashOutPanel. Shows `yearInsight` (title/tone/whatHappened/smartMove), per-bucket returns, `eventReactionLine`, `sendOffLine` (if not final), tree total, continue button. Master prompt's target: becomes weather + coach dialogue, no card.
- **`ReportScreen.tsx`** — end screen. Own `insights()` function (worked/watchOut/tryNext) built from `results`/`summary`/`config` — **not** in the frozen layer, lives in this component; the world must port this logic verbatim (it's presentation-layer, so it's fair game to move, just don't change its logic). Renders `GrowthBreakdown`, `SellComparison` (only if `soldAnything`), badges, `MoneyCard`s, replay/new-plan/share buttons. Share uses `navigator.share` or clipboard fallback.
- **`GrowthBreakdown.tsx`** — pure display, "planted + grew = total" math explainer. Props: `contributed, grew, growthPct, years, total`.
- **`SellComparison.tsx`** — pure display, only rendered if the player ever sold. Props: `treeValue, cashOut, total, shadowTotal`.
- **`MoneyCard.tsx`** — pure display, one collectible card. Props: `card, fresh`.
- **`Confetti.tsx`** — pure CSS-animated 8-piece burst, mounted for 2.2s on stage-up.
- **`PlaceholderTree.tsx`** — 2D fallback tree (CSS divs, radial-gradient coins/leaves). Props: `total, wilting`. **Must be kept** per the master prompt's fallback ladder (Phase 6 explicitly says the old components "earn their keep as the fallback").
- **`toonGradient.ts`** — shared lazy-built 4-step `THREE.DataTexture` gradient map for every `MeshToonMaterial` in the scene. Reusable as-is in the new world.

## 7. Non-obvious behaviors the new world must preserve exactly

1. **Coin-toss → allocation mapping is presentation-layer, not engine.** `MoneyTreeGame.tsx` owns `tossHistory: Bucket[]` (capped at `NUM_COINS = 10`) and converts it to raw bucket *counts* on every change via `setAllocation(counts)` — no bucket defaults to Safe anymore. `normalizeAllocation`'s own all-zero fallback (100% Safe) only matters before the very first coin is placed. **"Grow the year" is presentation-layer-gated** on `history.length >= NUM_COINS`; the frozen engine has no such gate and will happily renormalize a partial allocation to 100% if ever called with one — the world must keep an equivalent gate (a station/bell that won't ring, or similar) or risk silently rescaling a half-finished toss.
2. **`epoch` + `roundKey` reset pattern.** `tossHistory` resets synchronously (during render, not in an effect — React's documented "adjust state during render" pattern) whenever `` `${epoch}-${game.year}` `` changes, so a fresh pile always starts empty even for a same-year replay. `epoch` bumps on both `startGame` and `replay`.
3. **Combined wealth, not tree value, decides bankruptcy/best-score.** `combinedWealth = (lastResult?.total ?? 0) + cashOut`. A deliberate full cash-out must never register as bankruptcy.
4. **Wilting** = `lastResult.total < totalOf(lastResult.before)` — drives tree droop/tint in `TreeModel` and the `PlaceholderTree` fallback identically.
5. **Stage-up detection** compares `stageRank(result.stage)` (index into `STAGE_THRESHOLDS`) against the *previous* result's rank, tracked in a ref — not derivable from `result` alone.
6. **Growth curve is the single biggest visual problem**: `growthFactor(total) = 0.55 + sqrt(min(total,50000)/50000) * 0.85`, i.e. scale range **0.55×–1.4×** regardless of whether total is $500 or $50k+. Phase 3's log-scale 0.3×–6.0× replacement is the core fix.
7. **Fallback ladder**: `prefers-reduced-motion` → immediate `fallback` (skips the Canvas entirely). Otherwise mount `<Canvas>` inside a `GLBoundary` (class component `componentDidCatch`-style) that swaps to `fallback` on any thrown error (GLB load failure, WebGL context loss, etc). `fallback` is always `<PlaceholderTree total wilting />`, optionally paired with the 2D `<Coach>` bubble (`MoneyTreeGame.tsx` renders `Coach` as a sibling regardless of which scene layer is active, so it already works with both paths unchanged).
8. **z-index stack** (all within the Stage div, which itself gets `z-[50]` only when `maximized`): sky decor (no z-index) < TreeScene canvas `z-[3]` < HUD `z-[4]` < AllocationBar `z-[6]` < Coach `z-[7]` < Confetti `z-[8]`. `CashOutPanel`/`EventCard` portal straight to `document.body` and use `z-[60]` specifically to out-rank the Stage's maximized `z-[50]` — **any new full-viewport portal overlay in the world must use z ≥ 60**, or it'll hide behind the world when fullscreen.
9. **Responsive sizing**: the Stage div sets `containerType: 'inline-size'`; `Coach.tsx` sizes itself in `cqw` (container-query width units), not `vw`, specifically because the Stage can be a small card or a full-viewport overlay at very different actual viewport widths for the same *container* width. Any new diegetic UI overlay (dialogue strip, prompts) should follow this pattern rather than reintroducing viewport units.
10. **Maximize/fullscreen**: CSS-driven (`position:fixed`, `inset:0`, `z-[50]`) is the source of truth and works on every device including iOS Safari (no Fullscreen API there); the native Fullscreen API is layered on top opportunistically (`stageRef.current?.requestFullscreen?.()`) for browsers that support it, kept in sync via the `fullscreenchange` event. Escape key and body-scroll-lock are handled alongside.
11. **Mute** persists to `localStorage` via the frozen `sound.ts`'s `isMuted`/`setMuted` — read once on mount, never polled; the world's own mute toggle must call the same two functions to stay compatible with any other Money Tree entry point.
12. **SSR boundary**: `MoneyTreeGameWrapper.tsx` → `dynamic(() => import('./MoneyTreeGame'), { ssr: false })` → `MoneyTreeGame.tsx` → `dynamic(() => import('./moneytree/TreeScene'), { ssr: false, loading: () => null })`. Two separate `ssr:false` boundaries already exist; the new World component needs the same outer one (Phase 6 swaps `MoneyTreeGameWrapper`'s import target, presumably keeping a similar `ssr:false` dynamic import of the new `World`/orchestrator).
13. **`BUCKETS` array order** (`['safe', 'growth', 'moonshot']`) is relied on for stable rendering order and for `splitDollars`'s tie-breaking in `AllocationBar` (largest-remainder round-robin defaults to this order on exact ties) — keep it if porting that math.
14. **Self-hosted font**: `CoinToss.tsx`'s bucket labels use `font="/fonts/inter-bold.woff"` (a real static asset, not a CDN) specifically to avoid `troika-three-text`'s default `unicode-font-resolver` CDN fallback tripping the CSP (`connect-src`) — any new in-world `<Text>` usage should reuse this same font file rather than omitting the `font` prop.
15. **Middleware CSP** (`middleware.ts`, outside `app/lib/moneytree/` so *not* frozen but worth knowing) already allows `worker-src 'self' blob:` and `script-src ... blob:` for Rapier/troika's worker threads — the new world's Rapier character controller should not need further CSP changes, but if a new worker-based library is introduced, check this file first before assuming a CSP gap.

## 8. Swap point (for Phase 6, not now)

`app/components/MoneyTreeGameWrapper.tsx` is the entire public interface: a
client-only dynamic import of `MoneyTreeGame`, no props, no other exports.
Phase 6 repoints this single import at the new World's top-level component
and nothing else needs to change for any page that renders
`<MoneyTreeGameWrapper />`.
