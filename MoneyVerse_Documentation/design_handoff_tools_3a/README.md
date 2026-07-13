# Handoff: Explore MoneyVerse — Free Tools index (design "3a")

## ⤵ Paste this into Windsurf (Cascade) to implement

> **Task: redesign the `/tools` page ("Explore MoneyVerse") with the new animated card grid (design "3a").**
>
> Stack is already Next 15 (App Router) · React 19 · Tailwind 3.4 · `next/font`. Do NOT introduce new dependencies.
>
> 1. Add `app/components/ToolsIndex.tsx` (provided in this bundle — copy it in verbatim). It is a self-contained `'use client'` component whose only imports are `react` and `next/link`.
> 2. Rewrite `app/tools/page.tsx` to keep its existing `metadata` export exactly as-is (title, description, openGraph) and replace the rendered body with the new component:
>
>    ```tsx
>    import { Metadata } from 'next';
>    import ToolsIndex from '../components/ToolsIndex';
>
>    export const metadata: Metadata = { /* keep the existing metadata object unchanged */ };
>
>    export default function ToolsPage() {
>      return <ToolsIndex />;
>    }
>    ```
>
>    Delete the old inline `tools` array and grid markup from `page.tsx` — the new component carries the same 8 tools with identical hrefs, titles, and descriptions.
> 3. Do not change any `/tools/*` game pages; every card links to the existing routes (`/tools/money-tree-calculator`, `/tools/savings-goal-calculator`, `/tools/kids-budget-calculator`, `/tools/lemonade-stand-profit-game`, `/tools/business-simulator`, `/tools/daily-money-quests`, `/tools/scam-shield-quiz`, `/tools/achievement-cards`) with `<Link prefetch={false}>`, same as before.
> 4. The page renders below the app's existing global nav/layout; the component does not include a nav.
> 5. Verify: `npm run dev` → `/tools`. Cards stagger in on load (rise, ~70ms apart); each card's micro-visual animates (curve draws, ring fills, budget bar segments grow, chips pop, level path connects, quest checks pop, radar bar fills, trophy card + stars pop); hovering a card lifts it 6px with a deeper shadow; clicking navigates to the tool. Keyboard focus shows a purple outline. Then run `npm run lint` and `npm run type-check` and fix anything flagged.
> 6. Respect `prefers-reduced-motion` — the component already disables motion and pins final states; don't remove that block.
> 7. If the hero from the previous handoff (`MoneyVerseHero.tsx`) is installed, its "Explore free tools" CTA already points at `/tools` — no extra wiring needed.
>
> This is a pixel-spec recreation. Match spacing, radii, colors, and copy exactly as written in the component.

---

## Overview
The `/tools` index page, redesigned in the same visual language as the 2a landing hero. Header (eyebrow pill, "Explore MoneyVerse." headline, subhead, No-ads/Kid-safe chips) over a 4-column grid of 8 tool cards. Every card is a link to its existing game page and carries a small **animated micro-visual** that previews what the tool does — the same "glassy white card with playful data details" treatment as the hero's carousel cards.

## About the design files
This bundle contains a **design reference created in HTML** plus a **production-ready React port**. `ToolsIndex.tsx` is written for this repo's environment (Next App Router + Tailwind `mv` tokens + `next/font`) and is meant to be dropped in. `reference/MoneyVerse Landing.dc.html` is the visual source of truth — the tools page is the **3a** frame at the top of that file (the 2a hero and older 1a/1b/1c explorations sit below it).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and animation timings. Recreate pixel-perfectly.

## Screen: Tools index (`/tools`)

### Layout
- Full-bleed `<main>`, background `#FBFBFE`, `min-h-screen`, with decorative layers: top-right purple radial blob, bottom-left aqua radial blob, faint `26px` dot grid (`#E7E2F6`, opacity .45).
- Container `max-w-6xl px-6 py-14`.
- Header block, then the grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, `gap 18px`. Cards stretch to equal height per row (flex column; footer pinned with `margin-top:auto`).

### Header
- **Eyebrow pill** — "🧰 8 free tools · no sign-up needed", BG `#EDE6FF`, text `#5A3EE6`, 13px/600, full-radius.
- **H1** — `font-display` (Fredoka) 600, 44px (36px small), tracking −0.8px: "Explore **MoneyVerse.**" with "MoneyVerse." in `mv.primary`.
- **Subhead** — 16.5px, `#4A4560`, max-w 560px. Copy: *"Free, safe money tools and games built for kids, families, and classrooms. No bank connection required."* (verbatim from the current page).
- **Right-aligned chips** — "🚫 No ads", "🔒 Kid-safe": white BG, `1.5px` border `#EDE7FA`, radius 12px, 12.5px/600, text `#413B5A`.
- Header elements rise in staggered (0 / .06s / .12s / .18s).

### Tool cards (8)
Card shell: BG `rgba(255,255,255,.94)`, border `1px #ECE7FB`, radius `22px`, shadow `0 18px 40px -24px rgba(80,60,150,.35)`, padding `18px`, flex column `gap 11px`. **Hover:** `translateY(-6px)` + shadow `0 32px 60px -26px rgba(80,60,150,.55)`, 250ms ease. **Entrance:** rise 600ms cubic-bezier(.2,.9,.3,1), delays `0.1s + i×0.07s`. **Focus-visible:** 2px `#6B4EFF` outline, offset 3px.

Each card, top to bottom:
1. Row: 44px round **emoji avatar** on a themed radial gradient + **category tag** pill (10px/700, tracking .4px).
2. **Title** — Fredoka 600, 16.5px, `mv.dark`. **Description** — 12.5px/1.45, `#6E6A85` (copy verbatim from the current page).
3. **Micro-visual tile** — height 56px, BG `#FAF9FE`, border `#F0ECFA`, radius 14px.
4. **CTA line** — 13px/600 `mv.primary` with a "→".

Per-card content (route · emoji/gradient · tag · micro-visual · CTA):
1. `/tools/money-tree-calculator` · 🌳 green (#7BE3A3→#4FC47E) · SIMULATOR (green tint) · compound-growth curve draws in (stroke `#2F9E67`, dasharray 170, 1.3s @.5s) beside "$148 / by week 12" · "Plant yours".
2. `/tools/savings-goal-calculator` · 🎯 purple (#8B74FF→#6B4EFF) · CALCULATOR (purple tint) · 40px progress ring fills to 68% (r15, dasharray 94.2 → offset 30, 1.2s @.4s) beside "$68 saved / of a $100 goal · 4 wks left" · "Plan a goal".
3. `/tools/kids-budget-calculator` · 🪙 teal (#7FE9EE→#2FB8BE) · CALCULATOR (teal tint) · segmented bar 40/30/10/20% in `#6B4EFF #5FD38D #FFD84D #5CE1E6`, each segment scaleX-grows staggered (.35/.5/.65/.8s), labels Spend/Save/Give/Goals · "Split it up".
4. `/tools/lemonade-stand-profit-game` · 🍋 solar (#FFE29A→#FFB74D) · GAME (solar tint) · chips pop in: "Cost $0.50" → "Price $1.50" → "+$1.00 profit" (.35/.55/.8s) · "Open your stand".
5. `/tools/business-simulator` · 🏢 purple · GAME (purple tint) · level path 🍋 —(purple connector grows)— 🧁 —(grey)— 🏪 (last locked at 50% opacity) · "Start building".
6. `/tools/daily-money-quests` · ⚡ green · QUESTS (green tint) · two ✓ circles pop + one dashed ＋, "🔥 6 day streak" chip pops right · "Today's quest".
7. `/tools/scam-shield-quiz` · 🛡️ teal · QUIZ (teal tint) · "Scam radar / Sharp 🔍" + bar fills to 92% (teal gradient, 1.2s @.4s) · "Test your radar".
8. `/tools/achievement-cards` · 🏆 solar · CREATOR (solar tint) · mini trophy card (56×38, purple gradient, shadow) pops + ⭐⭐⭐ pop staggered, "Parent-approved sharing" · "Make a card".

## Interactions & behavior
- Whole card is one `<Link prefetch={false}>` → its tool route (navigation exactly as the current page).
- Entrance stagger on load; micro-visual animations run once on mount (CSS keyframes, `both`/`forwards` fill).
- Hover lift + deeper shadow; focus-visible purple outline; reduced-motion pins all final states.
- No state, no data fetching — everything static.

## Design tokens
Same palette as the 2a hero handoff. **Tailwind `mv` tokens:** `primary #6B4EFF`, `yellow #FFD84D`, `teal #5CE1E6`, `lavender #D9CFFF`, `green #5FD38D`, `dark #1C1F2E`, `light #F8F8FF`. **Fonts:** `font-display` Fredoka / `font-sans` Inter (already wired in `app/layout.tsx`).
**One-off hexes (inline, intentional):** page `#FBFBFE`; text `#4A4560 #413B5A #6E6A85 #A8A2C0`; purples `#5A3EE6 #EDE6FF #EDE7FA #ECE7FB #F0ECFA #FAF9FE #EDE7F8 #C9BFE8 #8B7FC0 #8B74FF #F1EEF9`; greens `#2F9E67 #EAFBF2 #7BE3A3 #4FC47E`; teals `#2FB8BE #127C82 #E4F9FA #7FE9EE`; solar `#FFF3CF #A9760A #FFE29A #FFB74D`.
**Motion:** card rise 600ms cubic-bezier(.2,.9,.3,1) @ 0.1s+i×0.07s; pop 500ms cubic-bezier(.2,1.3,.4,1); curve draw 1.3s; ring 1.2s; bar/radar fills 1.2–1.3s; hover 250ms.
**Note:** ignore the zero-radius "Modernist" system if it's bound in the design project — this page is the rounded MoneyVerse brand.

## Assets
None. Emoji as icons (no icon dependency), matching the prototype and the hero handoff.

## Files in this bundle
- `ToolsIndex.tsx` — production React component (copy to `app/components/`).
- `README.md` — this spec + the Windsurf prompt.
- `reference/MoneyVerse Landing.dc.html` — HTML prototype; **3a** (top frame) is this page.

## Notes / decisions to confirm
- SEO stays intact: `metadata` in `app/tools/page.tsx` is preserved; only the rendered body changes.
- Micro-visual numbers ($148, $68/$100, 40/30/10/20 split, $0.50→$1.50) are illustrative previews, consistent with the hero. Say the word if you want them pulled from each game's real defaults.
