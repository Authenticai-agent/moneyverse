# Open Questions

- Can a child belong to more than one family?
- How is guardian access removed in custody disputes?
- Is child PIN access device-bound?
- How are school retention duties reconciled with family deletion?
- Will teacher-created content be permitted?
- What curriculum standards should classroom reporting map to?
- Which countries are in the first launch?
- Will currencies other than USD be supported?
- Which exact analytics events are essential?
- What adult verification method is appropriate before Plaid?
- Which monetization model avoids child-directed pressure?

The agent must not silently answer these questions through irreversible implementation.

---

## Resolved design conflicts — Goal Jar (`/tools/savings-goal-calculator`)

Recorded per `AGENTS.md` ("Do not silently resolve a material conflict"). The `ui-ux-pro-max`
skill was run against this page and returned generic recommendations that conflict with
`design.md` and the 3a handoff. `design.md` outranks the skill (`AGENTS.md` instruction
priority 7; decision `D-015`). Full reasoning lives in
`design-system/moneyverse-savings-goal/pages/savings-goal-calculator.md`.

| # | Skill recommended | Repo requires | Resolution |
|---|---|---|---|
| 1 | Palette: operation orange `#EA580C` on dark `#1C1917` | `mv` tokens in `design.md` / `tailwind.config.ts` | Keep `mv`. Page background `#FBFBFE` per 3a. `mv-yellow` / `mv-teal` never carry body text (fail 4.5:1). |
| 2 | Typography: Baloo 2 / Comic Neue | Fredoka + Inter, already wired via `next/font` | Keep Fredoka + Inter. No new font packages. |
| 3 | Claymorphism tokens (`#7C3AED`, Nunito Black, `radiusOuter: 50`) | 3a: radius 22px, `1px #ECE7FB`, `0 18px 40px -24px rgba(80,60,150,.35)` | Adopt claymorphism's shape language (chunky, stacked shadows, squish-on-press) in `mv` colors at 3a radii. Controls 14–22px; jar/coin/preset surfaces may reach 28–32px. |
| 4 | "No emojis as icons — use Heroicons/Lucide" | 3a uses emoji as icons deliberately, to avoid an icon dependency | Split. Functional controls get hand-written inline SVG (no package). Emoji reserved for goal art and mascot, always `aria-hidden="true"` beside a real text label. |
| 5 | GSAP motion presets (incl. paid SplitText plugin) | GSAP is not a dependency; `windsurfrules.md` #22 | Do not install. Translate to CSS keyframes on the existing 3a curves: rise `600ms cubic-bezier(.2,.9,.3,1)`, pop `500ms cubic-bezier(.2,1.3,.4,1)`, hover `250ms`. Physical motion uses `@react-three/rapier` (already installed). |
| 6 | Landing pattern "Social Proof-Focused + Trust" | `D-008`, `D-010`, `design.md` "no public popularity metrics" | Rejected outright. No social proof on a child surface. |

### Approved deviation — signature names in `sessionStorage`

The Goal Jar build spec states: *"Client-only. No fetch, no persistence, no
analytics on child input. The kid's numbers never leave the browser."*

The plan certificate deviates from the persistence clause, on explicit request,
so that refreshing the page before printing does not wipe a half-signed
contract. Recorded here rather than resolved silently.

**What is stored:** two names and a free-text date, as one JSON object under
`moneyverse:savingsgoal:signatures`. Nothing else — no goal, no amounts, no
boosts, no dates computed by the engine.

**Bounds on it:**

- `sessionStorage`, not `localStorage`, so it is scoped to the tab and dies when
  the tab closes. A shared family computer does not retain a child's name.
- Each field is capped at 40 characters, on input and again on read.
- Reads are fully defensive: storage disabled, quota exceeded, or a malformed
  value all return empty rather than throwing.
- It is never transmitted, never logged, and never included in the share text —
  ADR-007 is unaffected, because the share card still describes the tool and
  never the child.

**Unchanged:** the goal, the amounts, and every number the child enters remain
un-persisted and still never leave the browser.

**Revisit if** the certificate ever gains a server-side render, an export, or an
email path — at that point the names stop being purely local and the decision
needs retaking.

### Planned, not built — the fridge poster as a deliverable

Two intents recorded so the current stubs are not mistaken for finished work.

**1. Parent email should deliver the poster.** When the email field on the report
is wired, the thing sent to the parent is the fridge certificate — goal, tracker
circles, jobs, promises, signature lines — not a link back to the tool. A parent
who asked for it by email wants something they can print at work.

Open questions before that can be built:

- Rendering path. The certificate is a React component; an email needs HTML or a
  PDF. Neither exists yet, and an email-safe HTML rebuild is a second copy of the
  layout that will drift from the first.
- The signature names are currently local to the tab and deliberately never
  transmitted (see the deviation logged above). Emailing a poster that carries a
  child's name changes that decision and needs retaking, not assuming.
- `POST /api/waitlist` is a waitlist signup, not a transactional mail path. It
  stores an address; it sends nothing. Delivery infrastructure does not exist.

**2. Share should reach real destinations.** WhatsApp, other messengers, and
social, rather than clipboard only.

Worth knowing: on mobile this is already partly true. `SavingsGoalShareCard`
calls the Web Share API when available, which opens the OS share sheet — so
WhatsApp, Messages, and Mail already appear there today on iOS and Android. The
clipboard path is the desktop fallback, where no share sheet exists.

What a fuller version would need, and the constraint on it: whatever is shared
must keep describing the tool rather than the child. ADR-007 rules out a share
artefact carrying a child's name, goal, or amounts, so per-network share targets
would carry the same tool-level text, not a picture of the plan.

### Reversed decision — the Goal Jar has no 3D scene

The build spec required `app/components/savingsgoal/JarScene.tsx`: an R3F canvas
with a glass jar and `@react-three/rapier` coins that fall and settle, lazily
loaded via `dynamic(..., { ssr: false })`, with `PlaceholderJar` as the fallback.

It was built to that spec and then **removed**, on review of how it behaved in a
real browser.

**Why.** The app opens WebGL contexts in three other components already —
`InteractiveHero`, `moneytree-world/World`, and `moneytree/TreeScene`. Browsers
cap how many live contexts exist and evict the oldest past that cap. The jar's
context was routinely evicted, its `webglcontextlost` handler fired, and it fell
back to the SVG jar — which is what a reviewer actually saw on screen. The net
effect was 656kB of three plus 2.1MB of rapier downloaded in order to display
the same SVG that ships anyway.

Note this is a pre-existing condition, not something the jar caused: the console
on `/tools` logs `THREE.WebGLRenderer: Context Lost` repeatedly without the
savings calculator being involved at all.

**What was kept.** `PlaceholderJar` is now simply the jar. It already carried the
fill level, the etched rings at 25/50/75, the lid line, the ghost line for
today's savings, and the reduced-motion behaviour, so nothing was lost with the
canvas. The `% full` readout lives in the orchestrator so it renders once
regardless.

**Revisit if** the WebGL contexts in Money Tree and the hero are ever disposed
properly on unmount. That is the root cause, and until it is fixed any new
canvas anywhere in this app is competing for a resource that is already
oversubscribed.

### Still open

- **Parent email capture on this tool.** The current page collects an address and renders
  "not sent in this preview" — a dead field. The sanctioned path is `POST /api/waitlist`,
  which requires a Turnstile token and honeypot. Decision needed: wire it to the waitlist
  (adds a bot-verification widget to a child-facing page) or delete the field entirely.
  Not to be resolved silently — see the Goal Jar task in `tasks.md`.
- **Engine money units.** The Money Tree engine uses dollars-as-`number`; `D-003` and
  `windsurfrules.md` #12 mandate integer minor units. The Goal Jar engine will use minor
  units. Whether Money Tree should be migrated is a separate question, not in this scope.
