# Current Task

## Goal

Rewrite `/tools/savings-goal-calculator` from a static form into the Goal Jar: a
playable savings simulator with a live answer, a tradeoff mechanic, and a
printable signed plan. Same route, same SEO surface, same brand.

## Status

Implemented and verified, with two checks outstanding that require a human at a
real browser (listed under Remaining).

## Completed work

### Architecture

Mirrors Money Tree: pure engine, content file, `use…Game` hook, thin
orchestrator, phase screens.

- `app/lib/savingsgoal/` — `types.ts`, `engine.ts`, `content.ts`,
  `useSavingsGoalGame.ts`
- `app/components/savingsgoal/` — setup, jar, dial, scrubber, boost cards,
  rolling number, milestone badge, report, certificate, share, intro video,
  shared chrome
- `app/components/SavingsGoalCalculator.tsx` rewritten as an orchestrator
- `app/tools/savings-goal-calculator/page.tsx` untouched: `metadata` and the
  `JsonLd` schema are byte-identical, and the route is unchanged

### Defects fixed from the previous implementation

- Weekly and monthly inputs wrote to each other through 4.33, losing money on
  every round-trip. Weekly is now the single source of truth; months are derived
  for display and never write back.
- Two headline figures were computed from different state and could contradict
  each other.
- All arithmetic lived in the component and was untestable. It is now a pure
  engine with 105 unit tests.

### Engine corrections beyond the written spec

Each recorded in `docs/project/open-questions.md`:

- `needed = max(0, target − (current + oneTime))`. The spec's floored two-step
  form discarded surplus: a $1 goal with $5 saved and a $15 purchase reported 15
  weeks instead of the correct 11.
- A goal already met reports 0 weeks, not `Infinity`.
- No goal set reports no need, rather than a debt against nothing.

### Mechanics

- 26 boost cards in five groups: three tiers of chores, windfalls, and things a
  child might spend on. Spending cards lengthen the plan, which is the lesson;
  they carry no warning styling and no judging copy, per `copy.md`.
- Milestones at 25/50/75/100% with a short badge and a sound, muted by default,
  reusing `app/lib/moneytree/sound.ts`.
- The plan prints as a one-page signed certificate with a week tracker to colour
  in. Verified to fit A4 and US Letter with all 26 cards selected.

### Verification

- `npx tsc --noEmit` clean
- `npm run lint` clean for all files in this change
- `npm run test` — 260 tests across 15 files, including the Postgres-backed
  auth, RLS, ledger and savings-goals suites
- `npm run build` succeeds
- Accessibility swept at 375 / 768 / 1280 / 1440 across setup, jar and report:
  zero contrast failures, zero touch targets under 44px, zero unnamed controls,
  no heading-level skips, no horizontal overflow
- Print output verified as the certificate alone, one page

## Deviations

- **No 3D jar.** `JarScene.tsx` was built to spec with R3F and rapier, then
  removed. The app already opens WebGL contexts in three other components and
  browsers cap live contexts, so the jar's was routinely evicted and it rendered
  the SVG fallback anyway — after downloading 656kB of three and 2.1MB of
  rapier. Full reasoning in `docs/project/open-questions.md`.
- **Parent email remains unwired**, by instruction. The field is present and
  collects nothing; the decision to wire it to `/api/waitlist` or delete it is
  logged as open.
- **Signature names persist in `sessionStorage`**, a deliberate exception to the
  spec's no-persistence rule, so a refresh before printing does not wipe a
  half-signed contract. Scope and bounds logged.

## Remaining

Both need a human at a real browser; neither can be exercised in the automated
harness used here.

- Keyboard-only pass: pick a goal, set an amount, toggle boosts, scrub weeks,
  reach the printable plan. Every control is a native `button`/`input` with no
  div-with-onclick, so activation should be browser-native, but the harness
  dispatches keydown with an empty `key` and could not drive it.
- `prefers-reduced-motion` pass. All four rules are confirmed parsed into the
  CSSOM and the JS path matches Money Tree's, but the harness cannot emulate the
  preference.

## Notes

- `app/components/SavingsGoalPlan.tsx` is now orphaned — nothing imports it since
  the duplicate printable card was removed. Left in place pending a decision.
- Pre-existing and untouched: `InteractiveHero`, `moneytree-world/World` and
  `moneytree/TreeScene` do not dispose their WebGL contexts on unmount, which is
  why `/tools` logs `THREE.WebGLRenderer: Context Lost`. This is the root cause
  behind the 3D jar removal and should be fixed before any new canvas is added
  anywhere in the app.
