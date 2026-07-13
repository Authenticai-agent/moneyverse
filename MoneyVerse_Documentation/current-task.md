# Current Task

## Goal

Implement the new MoneyVerse landing hero (design "2a") and the redesigned `/tools` index (design "3a") from the design handoff bundles.

## Status

Implemented and verified.

## Completed work

- Added `app/components/MoneyVerseHero.tsx` from `design_handoff_hero_2a` and rendered it on the landing page.
- Added `app/components/ToolsIndex.tsx` from `design_handoff_tools_3a` and rewrote `app/tools/page.tsx` to use it while preserving existing metadata.
- Added lightweight client wrappers (`MoneyVerseHeroWrapper`, `ToolsIndexWrapper`) that load the large handoff components with `ssr: false` to avoid a Next.js 15.5 dev-server missing-chunk error.
- Wired the landing hero's primary CTA to `/tools` and the secondary "Join the waitlist" CTA to `/register`.
- Clarified the hero's waitlist note: it is for MoneyVerse Plus updates, not unlocking features, and removed "premium cosmetics".
- Removed the standalone waitlist section below the hero.
- Confirmed the Tailwind `mv` color tokens and `font-display`/`font-sans` families resolve correctly.

## Verification

- `npm run dev` loads `/` and `/tools` and returns `200`.
- `npm run lint` passes with no warnings or errors.
- `npm run type-check` passes.
- `npm run build` passes (fresh `.next` cache).
- `npm run test` passes (56 tests).
- Landing hero carousel auto-rotates, pauses on hover, and dot navigation works.
- Tools cards stagger in on load and animate their micro-visuals.

## Notes

- The 3D hero and old tools grid are no longer used on the landing and tools routes, but the files remain in the repo for reuse.
- The client-only wrappers mean the hero and tools grid render after JavaScript loads; this is a workaround for the Next.js 15.5 dev-server chunk bug.
