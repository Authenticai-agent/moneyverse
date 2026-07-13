# Handoff: MoneyVerse Landing Hero — design "2a"

## ⤵ Paste this into Windsurf (Cascade) to implement

> **Task: add the new MoneyVerse landing hero (design "2a") to this repo.**
>
> Stack is already Next 15 (App Router) · React 19 · Tailwind 3.4 · `next/font`. Do NOT introduce new dependencies.
>
> 1. Add the file `app/components/MoneyVerseHero.tsx` (provided in this bundle — copy it in verbatim). It is a self-contained `'use client'` component with no imports beyond `react`.
> 2. Render it as the hero of the landing page. On `app/page.tsx`, replace the current `<Hero />` usage with `<MoneyVerseHero />` (keep the existing 3D `Hero`/`InteractiveHero` files in the repo — we are swapping which hero the landing route shows, not deleting them). If you prefer to A/B, mount `MoneyVerseHero` behind a flag/route instead and tell me.
> 3. Confirm the Tailwind `mv` color tokens and the `font-display`/`font-sans` families resolve (they already exist in `tailwind.config.ts` and `app/layout.tsx`). The component also uses a handful of one-off hex values inline (light purples/greens/teals for the dashboard cards) — that is intentional; leave them inline.
> 4. Wire the two CTAs to real routes: primary "Explore free tools" → `/tools`, secondary "Join the waitlist" → `/register` (or the waitlist route). Adjust hrefs if the routes differ.
> 5. The component includes its own top-of-hero eyebrow/heading/CTAs and a decorative background; it does NOT render the site nav. Keep using the app's existing global nav/layout above it.
> 6. Verify: `npm run dev`, load the landing page, confirm the right-hand card carousel auto-rotates through 3 cards every ~5.2s, dots switch cards, hovering the carousel pauses it, and count-up numbers + the chart/progress-bar animations replay when each card becomes active. Then run `npm run lint` and `npm run type-check` and fix anything they flag.
> 7. Respect `prefers-reduced-motion` — the component already disables motion and shows final states; don't remove that block.
>
> This is a pixel-spec recreation. Match spacing, radii, colors, and copy exactly as written in the component.

---

## Overview
A landing hero that reframes MoneyVerse's pitch as **"Learn money by living it."** Left column: eyebrow, headline, subhead, four skill chips, two CTAs, and a paid-tier ("MoneyVerse Plus") description under the waitlist CTA. Right column: an **auto-rotating carousel** of three "adventure" cards that showcase the product's core loops — grow a business, outsmart a scam, save for a goal.

## About the design files
The files in this bundle are a **design reference created in HTML** (a prototype showing intended look and behavior) plus a **production-ready React port** of that prototype. `MoneyVerseHero.tsx` is written to your repo's existing environment (Next App Router + Tailwind `mv` tokens + `next/font`) and is meant to be dropped in and wired up — not treated as throwaway. `reference/MoneyVerse Landing.dc.html` is the visual source of truth for anything ambiguous.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and interactions. Recreate pixel-perfectly.

## Screen: Landing hero (design 2a)

### Layout
- Full-bleed `<section>`, background `#FBFBFE`, with three decorative layers behind content: a top-right purple radial blob, a bottom-left yellow radial blob, and a faint `26px` dot grid (`#E7E2F6`, opacity .45).
- Inner container: `max-w-6xl`, `px-6`, `py-16`→`py-20`, a 2-column grid `lg:grid-cols-[0.92fr_1.08fr]`, `gap-10`, vertically centered. Collapses to one column below `lg`.
- Left column = copy + CTAs. Right column = carousel (a `472px`-wide, `556px`-tall stage centered in the cell, with a row of dots beneath).

### Left column components
- **Eyebrow pill** — text "✨ Money skills, disguised as play". BG `#EDE6FF`, text `#5A3EE6`, `13px`/600, full-radius, `px-15 py-8`.
- **Headline** — `font-display` (Fredoka), 600, `56px` (44px on small), line-height 1.02, letter-spacing `-1px`, color `mv.dark #1C1F2E`. Two lines: "Learn money by" + "living it." where "living it." is `mv.primary #6B4EFF`.
- **Subhead** — `19px`/1.55, color `#4A4560`, `max-w-[452px]`. Copy: *"Outsmart a scam. Grow a business. Save up for that bike. MoneyVerse turns real financial skills into adventures kids actually finish, with every number worked out just like real life."*
- **Skill chips** (4, wrap, `gap-2.5`) — white BG, `1.5px` border `#EDE7FA`, radius `12px`, `13.5px`/600, text `#413B5A`: "🛡️ Outsmart scams", "🏢 Grow a business", "🚲 Save for a goal", "🧾 Real money math".
- **CTAs** (`gap-3.5`):
  - Primary "Explore free tools →" — BG `mv.primary`, white text, `16px`/600, full-radius, `px-26 py-15`, shadow `0 14px 30px -10px rgba(107,78,255,.7)`, hover `mv.primary/90`. → `/tools`.
  - Secondary "Join the waitlist" — white BG, text `#5A3EE6`, `1.5px` border `#D9CFF5`, full-radius, same padding, hover `mv.lavender/40`. → `/register`.
- **Paid-tier note** (under CTAs) — `13.5px`/1.5, color `#6E6A85`, with a small `＋` chip. Copy: *"**Waitlist unlocks MoneyVerse Plus:** advanced simulators (business, credit & real-life money), parent-set missions, allowance & family goals, premium cosmetics, and a classroom edition for teachers."* (Grounded in the repo roadmap — tasks.md Phase 8 monetization + Phases 4–6.)

### Right column — carousel cards
Each card: `472px` wide, BG `rgba(255,255,255,.94)`, `backdrop-blur`, `1px` border `#ECE7FB`, radius `26px`, shadow `0 34px 68px -28px rgba(80,60,150,.5)`, `padding 22px`, with a colored badge pill overhanging the top-left edge. Inner "tiles" use BG `#FAF9FE`, border `#F0ECFA`, radius `18px`.

1. **Grow a business** — badge `mv.primary` "🏢 Grow-a-business adventure". Header: 🍪 avatar, "Zoe's Cookie Co. / CEO · Level 4", streak "🔥 6 days". Body: monthly-revenue area chart (animated draw + pulsing live endpoint + `$1,240 · June` tooltip), a **Team** tile (Sam W-2, Ava W-2, Max 1099, + Hire), a **Tax Center** tile (Federal $82 / State $41 / City $25 / Set aside $148, "from $820 profit this month").
2. **Outsmart a scam** — badge teal `#2FB8BE` "🛡️ Outsmart-a-scam adventure". Header: 🛡️ avatar, "Scam Shield / Detective · Level 3", "🎯 12 caught". Body: a fake "Unknown sender" DM ("🎉 You WON a $500 gift card! … bit.ly/claim-now-free"), three caught **red-flag** chips (red), a green **verdict** banner ("It's a scam. Nice catch!" + "+40 XP"), a **Scam radar** bar animating to 92%.
3. **Save for a goal** — badge solar `#FFD84D`/`#8A5A12` "🚲 Save-for-a-goal adventure". Header: 🚲 avatar, "Zoe's Bike Fund / Goal · Trail Blazer 20″", "🔥 6 days". Body: goal tile ("$117 saved of $180", progress bar animating to 65% with a 🚲 marker riding the fill, "65% there / 4 weeks to go"), two tiles (This week +$15 / Auto-save $15 wk), a **Milestones** checklist (3 done, 1 locked).

### Dots
Row of 3 buttons under the stage. Active = `26px` wide `mv.primary`; inactive = `9px` `#D9D2F0`. `height 9px`, full-radius, `width`+`background` transition 300ms.

## Interactions & behavior
- **Auto-rotate**: active card advances 0→1→2→0 every **5200ms**.
- **Pause on hover**: `onMouseEnter` clears the interval; `onMouseLeave` restarts it.
- **Dot click**: jumps to that card and resets the timer.
- **Crossfade**: cards are stacked absolutely; active is `opacity:1 / transform:none / z-2 / pointer-events:auto`, others `opacity:0 / translateY(22px) scale(.97) / z-1 / pointer-events:none`, `600ms` cubic-bezier(.2,.9,.3,1).
- **Replay on activation**: animations are scoped to `.mvh-card[data-active="true"]`, so each card's count-ups, chart draw, area fade, endpoint ping, pop-in chips/avatars, radar bar, and bike-fill bar re-run every time it becomes active. Count-ups use `requestAnimationFrame`, easeOutCubic, 1400ms; reset to 0 when inactive.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables all card animation and pins every element to its final state.

## State management
- `active: number` (0–2) — current card index.
- `timer: ref` — the rotation interval; `start()`/`stop()` manage it; `goTo(i)` sets index + restarts.
- Per-card `CountUp` holds its own animated display value, driven by the `active` prop.
- No data fetching. All numbers/copy are static props inside the component.

## Design tokens
**Tailwind `mv` tokens (already in `tailwind.config.ts`):** `primary #6B4EFF`, `yellow #FFD84D`, `teal #5CE1E6`, `lavender #D9CFFF`, `green #5FD38D`, `dark #1C1F2E`, `light #F8F8FF`.
**Fonts:** `font-display` = Fredoka (`--font-fredoka`), `font-sans` = Inter (`--font-inter`) — both wired in `app/layout.tsx`.
**One-off hexes used inline (dashboard chrome, not tokenized):** page `#FBFBFE`; text `#4A4560 #413B5A #6E6A85 #8480A0 #A8A2C0 #3A3550`; purples `#5A3EE6 #EDE6FF #D9CFF5 #D9D2F0 #ECE7FB #F0ECFA #FAF9FE #EDE7FA #DED3FA`; greens `#2F9E67 #3E9C6B #EAFBF2 #CDEFDD #D5EFDF`; teals `#2FB8BE #127C82 #E4F9FA #7FE9EE`; scam red `#C0392B #FDECEC #F7D3D3 #E5533C`; solar `#F3C218 #FFF3CF #A9760A #8A5A12 #FFE29A #FFB74D`; link blue `#2F7BD6`.
**Radii:** cards `26px`, tiles `18px`, chips/CTAs full (`9999px`), small chips `12px`. **Note:** if you also maintain the "Modernist" design system in this project, ignore it here — this hero is the rounded MoneyVerse brand, not the zero-radius Modernist theme.
**Motion:** rotate `5200ms`; crossfade `600ms cubic-bezier(.2,.9,.3,1)`; count-up `1400ms` easeOutCubic; chart draw `1500ms`; radar `1300ms`; bike-fill `1400ms`.

## Assets
None. Icons are emoji (matches the prototype and avoids adding an icon dependency). If you'd rather use Lucide per the design-system guide, swap emoji for `lucide-react` glyphs and add the dependency — tell me and I'll provide the mapping.

## Files in this bundle
- `MoneyVerseHero.tsx` — the production React component (copy into `app/components/`).
- `reference/MoneyVerse Landing.dc.html` — the original HTML prototype (visual source of truth). It also contains three earlier hero explorations (1a/1b/1c) below the 2a design; **2a is the one to build.**

## Notes / decisions to confirm
- The prototype's dashboard **numbers are illustrative**, not computed from real 2024/2025 tax brackets. If you want the Tax Center card to reflect real bracket math, say so and I'll update the values (or wire it to a calc util).
- The hero swaps the *landing* hero only; the existing WebGL `Hero`/`InteractiveHero` remain in the repo for reuse elsewhere.
