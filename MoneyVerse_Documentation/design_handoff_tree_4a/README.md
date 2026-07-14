# Handoff: Money Tree Simulator — game page (design "4a")

## ⤵ Paste this into Windsurf (Cascade) to implement

> **Task: redesign `/tools/money-tree-calculator` as the playable "Money Tree" game page (design "4a").**
>
> Stack is already Next 15 (App Router) · React 19 · Tailwind 3.4 · `next/font`. Do NOT introduce new dependencies.
>
> 1. Add `app/components/MoneyTreeGame.tsx` (provided in this bundle — copy it in verbatim). It is a self-contained `'use client'` component whose only imports are `react` and `next/link`.
> 2. Rewrite `app/tools/money-tree-calculator/page.tsx` to keep its existing `metadata` export exactly as-is (title, description, openGraph) and replace the rendered body with the new component:
>
>    ```tsx
>    import { Metadata } from 'next';
>    import MoneyTreeGame from '../../components/MoneyTreeGame';
>
>    export const metadata: Metadata = { /* keep the existing metadata object unchanged */ };
>
>    export default function MoneyTreePage() {
>      return <MoneyTreeGame />;
>    }
>    ```
>
>    The old `MoneyTreeForm` (and any chart/table it rendered) is replaced by this component. If other pages import `MoneyTreeForm`, leave that file in place; just stop rendering it here.
> 3. **The math must not change.** The component reproduces the existing weekly-compounding formula exactly: `FV = P(1+r/52)^w + c·((1+r/52)^w − 1)/(r/52)`, with `r = max(0, rate − (inflation ? 2.5 : 0))/100` and the `r === 0` fallback `P + c·w`. If the repo's `MoneyTreeForm` math differs from this in any way, tell me instead of silently changing either side.
> 4. The page renders below the app's existing global nav/layout; the component does not include a nav. The "← Free Tools" link goes to `/tools` with `<Link prefetch={false}>`.
> 5. Verify: `npm run dev` → `/tools/money-tree-calculator`.
>    - Both columns rise in on load (scene delayed .12s).
>    - Dragging any slider updates the tree value, tree scale, stage chip, and goal badges instantly.
>    - "▶ Watch it grow" runs a ~4.5s time-lapse from Week 0 to the end (label flips to "🌱 Growing…"), coins pop onto the canopy as value crosses $400/$1.2K/$2.5K/$6K/$12K, side trees pop in at Money Forest stage ($20K+), and confetti rains for ~3.4s at the end.
>    - Clicking ▶ repeatedly does NOT stack loops; scrubbing the timeline or pressing ↺ cancels playback cleanly.
>    - The bottom scrubber moves during playback and stays draggable; ↺ resets all inputs to defaults.
>    - "Share my tree 🔗" opens the native share sheet (or copies text and flips to "Copied! 🎉" for 2s).
>    - Keyboard focus shows a purple outline on sliders, toggle, and buttons.
>    Then run `npm run lint` and `npm run type-check` and fix anything flagged.
> 6. Respect `prefers-reduced-motion` — the component already disables ambient motion (bob, float, clouds, confetti, entrance) while keeping the game fully functional; don't remove that block.
> 7. If the tools index from the previous handoff (`ToolsIndex.tsx`) is installed, its Money Tree card already links here — no extra wiring needed.
>
> This is a pixel-spec recreation. Match spacing, radii, colors, and copy exactly as written in the component.

---

## Overview
The Money Tree Simulator rebuilt as a **playable game page**: a 400px control column (sliders, inflation toggle, goal badges, play/replant) beside a living tree scene (sky gradient, sun, drifting clouds, grassy ground). The tree scales with the computed value, gold coins appear at value milestones, and pressing ▶ plays a 4.5s time-lapse "movie" of the full timeline with a scrubber. Same visual language as the 2a hero and 3a tools grid.

## About the design files
This bundle contains a **design reference created in HTML** plus a **production-ready React port**. `MoneyTreeGame.tsx` is written for this repo's environment (Next App Router + Tailwind `mv` tokens + `next/font`) and is meant to be dropped in. `reference/MoneyVerse Landing.dc.html` is the visual source of truth — this page is the **4a** frame (leftmost) in that file.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and animation timings. Recreate pixel-perfectly. One adaptation from the fixed 1180×800 prototype: the page is responsive (`max-w-6xl`, `lg:grid-cols-[400px_1fr]`, columns stack below `lg`, scene `min-height: 620px`).

## Screen: Money Tree game (`/tools/money-tree-calculator`)

### Layout
- Full-bleed `<main>`, background `#FBFBFE`, `min-h-screen`, decorative layers: top-right **green** radial blob (`#DFF5E7`), faint 26px dot grid (`#E7E2F6`, opacity .4).
- Container `max-w-6xl px-6 pt-8 pb-10`, grid `lg:[400px_1fr]` gap 32px, items stretch.

### Controls column (left)
Top to bottom (rises in as one block):
- **Back link** — "← Free Tools" → `/tools`, 12.5px/600 `#8B7FC0`.
- **Pill** — "🌳 Free tool · compound growth", BG `#EAFBF2`, text `#2F9E67`, 12.5px/600.
- **H1** — Fredoka 600, 34px, tracking −0.6px, line-height 1.06: "Plant coins today. / Watch them **grow.**" ("grow." in `#2F9E67`).
- **Subhead** — 14px `#6E6A85`: *"Slide, plant, and press play. Weekly saving plus compound growth turns pocket money into a money tree."*
- **4 sliders** (gap 15px). Row = label left (13px/600 `#413B5A`, emoji prefix) + value right (Fredoka 700 18px `mv.primary`):
  - 🪙 Start with — 0–500 step 10, default **$100**
  - 💧 Add every week — 0–50 step 1, default **$10**
  - 📅 Let it grow for — 1–15 step 1, default **5 years**
  - ✨ Growth rate per year — 0–12 step 0.5, default **5%**
  - Slider skin: 8px track `#EDE7F8` full-radius; 22px thumb `#6B4EFF` with 3px white border + purple shadow.
- **Inflation toggle** — 40×22 pill track (`#D9D2F0` off / `#6B4EFF` on), 16px white knob slides 18px; label "Adjust for inflation (−2.5% / yr)" 12.5px/500 `#6E6A85`. Rendered as a real `role="switch"` button.
- **Goal badges** — "Goals" + three pills 🌿 $1,000 · 🌳 $5,000 · 🌲 $20,000. Lit when the **end-of-timeline** value reaches them: BG `#EAFBF2`, text `#2F9E67`, border `#CDEFDD`; unlit: white BG, text `#B4ABCE`, border `#EDE7FA`.
- **Actions** (pinned to bottom, gap 10px): primary "▶ Watch it grow" (flex-1, `#6B4EFF` pill, 16px/600, hover `#5A3EE6`, purple glow shadow; label flips to "🌱 Growing…" while playing) + "↺" replant (white pill, `#5A3EE6` text, border `#D9CFF5`, hover `#F4F1FE`).
- **Disclaimer** — 11px `#A8A2C0`: *"A simulation for learning. Real investing goes up and down — no real money, no advice."*

### Tree scene (right)
Rounded 26px card, sky gradient `#E9F5FF → #F4FBF3 58% → #E0F5E7`, border `#E3EFE6`, green-tinted shadow. Contains:
- **Sun** — 58px gold coin-gradient circle top-right, floats (7s). **Clouds** — two white pills drifting (11s / 14s alternate).
- **Ground** — big `#6FCF94` mound (curved top) + `#5DBF83` ellipse.
- **Stage chip** (top-left) — frosted pill, Fredoka 600 14px `#2F9E67`: 🌱 Seed (<$1K) / 🌿 Sapling / 🌳 Growing Tree / 🌲 Money Forest ($20K+).
- **Value card** (top-right) — frosted 18px card: "Tree value" 11px `#8480A0`; value Fredoka 700 32px `mv.primary`; "Planted $X · ✨ +$Y grew" 11px `#6E6A85`. Updates live.
- **The tree** — 280×330 composition (trunk gradient `#B07A46→#8B5A2B`, three canopy circles `#7BE3A3/#5FD38D` + `#6FDD98/#4FC47E`), bobbing 6s; whole tree scaled `0.25 + √(min(v,50000)/50000) × 0.95` from bottom-center.
- **Coins** — 5 gold coins pop (spring, .5s) onto the canopy as value crosses **$400, $1.2K, $2.5K, $6K, $12K** (first three carry a "$").
- **Forest trees** — at stage 4, two smaller trees pop in at 11% left / 9% right.
- **Confetti** — 7 pieces (purple/yellow/teal/green/pink squares+dots) rain for 3.4s when the time-lapse completes.
- **Timeline bar** (bottom, frosted 18px) — scrubber (0–1000) + "Year 0 / **Week N of M** (green) / Year Y" labels + "Share my tree 🔗" purple pill.

## Interactions & behavior
- **All derived state is computed per render** from `{start, weekly, years, rate, inflation, pos}` — value, contributed (`start + weekly·⌊w⌋`), growth, stage, scale, badges. No effects needed.
- **▶ Play**: guards with a **ref flag** (synchronous — repeated clicks can't stack rAF loops), snaps `pos` to 0, eases 0→1 over 4500ms (easeInOutQuad), then celebrates (confetti 3.4s). Scrubbing, ↺, or unmount cancels via the same flag + `cancelAnimationFrame`.
- **Scrub**: stops playback, sets `pos` directly.
- **↺ Replant**: stops playback, resets all inputs to defaults, `pos` to 1.
- **Share**: `navigator.share` when available, else clipboard + "Copied! 🎉" (2s). Share text: value at end of timeline + years + page URL.
- Focus-visible purple outlines on every control; reduced-motion disables ambient/celebration animation only.

## Design tokens
Same palette as the 2a/3a handoffs. **Tailwind `mv` tokens:** `primary #6B4EFF`, `yellow #FFD84D`, `teal #5CE1E6`, `lavender #D9CFFF`, `green #5FD38D`, `dark #1C1F2E`, `light #F8F8FF`. **Fonts:** `font-display` Fredoka / `font-sans` Inter (already wired in `app/layout.tsx`).
**One-off hexes (inline, intentional):** page `#FBFBFE`; text `#413B5A #6E6A85 #8480A0 #8B7FC0 #A8A2C0 #B4ABCE`; purples `#5A3EE6 #D9CFF5 #D9D2F0 #EDE7F8 #EDE7FA #F4F1FE`; greens `#2F9E67 #EAFBF2 #CDEFDD #DFF5E7 #6FCF94 #5DBF83 #7BE3A3 #6FDD98 #4FC47E #E0F5E7 #F4FBF3 #E3EFE6`; sky `#E9F5FF`; gold `#FFECAE #FFD84D #F3C218 #8A5A12`; wood `#B07A46 #8B5A2B`; pink `#FF8FB1`.
**Motion:** rise 600ms cubic-bezier(.2,.9,.3,1); coin/tree pop 500–600ms cubic-bezier(.2,1.3,.4,1); time-lapse 4500ms easeInOutQuad via rAF; bob 6s; sun float 7s; clouds 11/14s; confetti 2.5–3.2s linear loops; toggle/hover 250ms.
**Note:** ignore the zero-radius "Modernist" system if it's bound in the design project — this page is the rounded MoneyVerse brand.

## Assets
None. Emoji + CSS shapes only (sun, clouds, tree, coins are pure CSS), matching the prototype.

## Files in this bundle
- `MoneyTreeGame.tsx` — production React component (copy to `app/components/`).
- `README.md` — this spec + the Windsurf prompt.
- `reference/MoneyVerse Landing.dc.html` — HTML prototype; **4a** (leftmost frame) is this page.

## Notes / decisions to confirm
- SEO stays intact: `metadata` in the route's `page.tsx` is preserved; only the rendered body changes.
- The old page's results table/chart (if any) is replaced by the live scene + scrubber. If you want a "see the numbers" details section below the game for SEO/education content, say the word.
- Share is client-side only (native sheet / clipboard) — no share-image generation yet.
- Coin milestones ($400/$1.2K/$2.5K/$6K/$12K) and the scale curve are design choices, not repo math; the FV formula, 2.5% inflation drag, and stage thresholds ($1K/$5K/$20K) match the repo exactly.
