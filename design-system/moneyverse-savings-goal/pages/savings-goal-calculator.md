# Savings Goal Calculator Page Overrides — the Goal Jar

> **PROJECT:** MoneyVerse Savings Goal
> **Page:** `/tools/savings-goal-calculator`
> **Generated:** 2026-07-18 (ui-ux-pro-max `--design-system --variance 6 --motion 7 --density 4`)

> ⚠️ **These rules override `../MASTER.md` in full.**
> MASTER.md carries the raw generic output of the skill search. This repo has a governing
> design system (`MoneyVerse_Documentation/design.md`) and a high-fidelity visual handoff
> (`MoneyVerse_Documentation/design_handoff_tools_3a/README.md`). Per `AGENTS.md` instruction
> priority 7 and decision `D-015` ("Design values come only from `design.md`"), the repo wins
> on every axis where the two disagree. The resolutions are recorded below and mirrored in
> `MoneyVerse_Documentation/docs/project/open-questions.md`.

---

## What the skill got right (adopt)

The product-domain search matched **"Kids Learning (ABC & Math)"** and **"Educational App"**, both of
which recommend **Claymorphism + Vibrant & Block-based** as the primary style, with
Micro-interactions secondary. That is a genuine signal and we adopt the *shape language*:

- Chunky, soft, tactile, toy-like surfaces
- Stacked/double shadows to simulate depth
- Squish-on-press (scale 0.92) as the universal press affordance
- Spring/bounce easing on interactions
- Progress indicators and reward states as first-class components
- Never pure white as the page background

The skill's own pre-delivery checklist items are adopted verbatim: cursor-pointer on
clickables, 150–300ms hover transitions, 4.5:1 light-mode text contrast, visible focus states,
`prefers-reduced-motion` respected, responsive at 375/768/1024/1440.

---

## Conflict resolutions (repo wins)

### 1. Palette — REJECT the skill's colors

Skill returned "Operation orange on dark": primary `#EA580C`, background `#1C1917`, accent
`#2563EB`. This is a dark, high-energy tactical palette. It is wrong for a child-facing
savings tool and it violates `D-015`.

**Use the `mv` tokens from `design.md` / `tailwind.config.ts`:**

| Token | Hex |
|---|---|
| `mv-primary` (Primary Purple) | `#6B4EFF` |
| `mv-yellow` (Solar Yellow) | `#FFD84D` |
| `mv-teal` (Aqua Teal) | `#5CE1E6` |
| `mv-lavender` (Lavender Mist) | `#D9CFFF` |
| `mv-green` (Emerald Green) | `#5FD38D` |
| `mv-dark` (Dark Base) | `#1C1F2E` |
| `mv-light` (Light Base) | `#F8F8FF` |

Page background is `#FBFBFE` per the 3a handoff — which independently satisfies
claymorphism's "never pure white" rule.

**Contrast law:** `mv-primary` on white passes 4.5:1 and may carry body text.
`mv-yellow` and `mv-teal` **do not** and are restricted to fills, strokes, and large
display shapes — never body copy. Text on tinted surfaces uses the 3a text ramp
(`#4A4560`, `#413B5A`, `#6E6A85`).

### 2. Typography — REJECT Baloo 2 / Comic Neue

Skill returned Baloo 2 + Comic Neue. The repo already wires **Fredoka** (`font-display`) and
**Inter** (`font-sans`) via `next/font` in `app/layout.tsx`. Adding fonts means adding
network cost and a dependency-shaped change for zero benefit — both are already
playful-but-legible and already brand.

**Use Fredoka + Inter. No new font packages.** The answer readout is Fredoka 600 at 44px+.

### 3. Claymorphism variables — TAKE THE SHAPE, DROP THE VALUES

Skill's clay tokens (`#7C3AED`, Nunito Black, DM Sans, `radiusOuter: 50`, `radiusCard: 32`)
conflict with the 3a handoff's measured spec.

**Radii — two scales, deliberately:**
- **Controls** (buttons, steppers, inputs, boost cards, tiles): 3a scale, **14–22px**.
  Card shell radius is 22px.
- **The toy** (jar chrome, coin surfaces, preset tiles): may go rounder, **28–32px**,
  because these are the play objects and clay wants mass there.

**Surfaces** follow 3a exactly: background `rgba(255,255,255,.94)`, border `1px #ECE7FB`,
shadow `0 18px 40px -24px rgba(80,60,150,.35)`, hover shadow
`0 32px 60px -26px rgba(80,60,150,.55)` with `translateY(-6px)`.

Claymorphism's contribution is the **second shadow layer** and the **press squish**, expressed
in `mv` colors at 3a's radii.

### 4. Emoji as icons — SPLIT THE RULE

Skill says "no emojis as icons (use SVG: Heroicons/Lucide)". The 3a handoff uses emoji as
icons *deliberately*, to avoid an icon dependency (`Assets: None. Emoji as icons (no icon
dependency)`). Both are right about different things.

**Resolution:**
- **Functional controls** — play, reset, mute, print, share, plus/minus, close — get
  hand-written inline SVG paths. No icon package. This satisfies the skill's real concern
  (font-dependence, no theming, inconsistent cross-platform rendering) without violating
  the repo's no-new-dependency rule.
- **Goal art and mascot** — bike, skateboard, headphones, video game — stay emoji, matching
  the 3a card treatment. Always `aria-hidden="true"` with a real adjacent text label.

Rule of thumb: **if tapping it does something, it's SVG. If it's decoration, it can be emoji.**

### 5. GSAP — DO NOT INSTALL

Skill returned GSAP presets (Stagger List, `back.out(1.4)`, SplitText). GSAP is not a
dependency here, `windsurfrules.md` #22 forbids casual installs, and SplitText is a paid
Club plugin the skill's own notes flag as license-gated.

**Translate to CSS keyframes using the repo's existing 3a curves:**

| Motion | Spec |
|---|---|
| rise (entrance) | `600ms cubic-bezier(.2,.9,.3,1)`, stagger `0.1s + i×0.07s` |
| pop (celebration, number roll) | `500ms cubic-bezier(.2,1.3,.4,1)` |
| hover | `250ms` |
| press squish | `scale(0.92)`, within the 150–300ms band |

`back.out(1.4)` maps to the **pop** curve. Physical motion in the 3D scene is done with
`@react-three/rapier`, which is already installed — that is where the "spring physics"
recommendation is honoured, not in a JS tween library.

---

## Motion budget

`--motion 7` resolved to the **Standard** tier. Applied as: entrance stagger on mount,
number odometer roll on change, coin physics settle, boost-card squish/flip, 700ms milestone
badge. No continuous/idle animation — the skill's own UX search flagged
*"Continuous Animation — infinite animations are distracting; use for loading indicators only"*
(Medium severity), which is also why the `<Canvas>` runs `frameloop="demand"`.

Under `prefers-reduced-motion: reduce`, every animation pins to its final state, physics drops
are replaced by an instant level change, and the number renders without the roll. Per
`design.md`: motion is never the only indicator of success — every celebration has a text
equivalent.

---

## Density

`--density 4` → **Standard**, 16–64px spacing scale. Child-facing rules from `design.md`
raise the floor: large touch targets (44×44 minimum, 8px apart), minimal dense text,
clear progress. Progressive disclosure is the organizing principle — setup shows presets
only; the dial, scrubber, and boost cards appear on the jar screen.

---

## Rejected outright

- **Landing pattern "Social Proof-Focused + Trust"** — this is a tool page, not a landing
  page. It has no hero/features/CTA section structure to apply, and `D-008`/`D-010`
  (no public child profiles, no targeted child advertising) plus `design.md`
  ("no public popularity metrics") rule out social proof on a child surface entirely.
- **Dark mode** — the page is light-only, per 3a. No dark variant is in scope.
- **Haptics** (`navigator.vibrate`) — the skill's Touch/Haptic Feedback result is
  mobile-native guidance; not applied on web here.
