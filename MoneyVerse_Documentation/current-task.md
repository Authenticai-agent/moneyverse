# Current Task

## Goal

Implement the new MoneyVerse landing hero (design "2a") from `MoneyVerse_Documentation/design_handoff_hero_2a` on the landing page.

## Status

Implemented and verified.

## Completed work

- Added `app/components/MoneyVerseHero.tsx` from the design handoff bundle.
- Updated `app/page.tsx` to render `MoneyVerseHero` as the landing hero, keeping the existing 3D `Hero`/`InteractiveHero` files in the repo for reuse.
- Added a `next.config.js` workaround that disables server-side webpack code splitting to avoid a Next.js 15.5 dev-server missing-chunk error (`Cannot find module './1331.js'`).
- Wired the primary CTA to `/tools` and the secondary "Join the waitlist" CTA to `/register`.
- Confirmed the Tailwind `mv` color tokens and `font-display`/`font-sans` families resolve correctly.
- Removed the standalone waitlist section below the hero; the hero's "Join the waitlist" CTA now handles waitlist entry.

## Verification

- `npm run dev` loads the landing page and returns `200`.
- `npm run lint` passes with no warnings or errors.
- `npm run type-check` passes.
- `npm run build` passes.
- `npm run test` passes (56 tests).
- Carousel auto-rotates, pauses on hover, and dot navigation works.

## Notes

- The 3D hero remains available for reuse elsewhere; the landing route now uses the static marketing hero.
- Existing `Hero.tsx` and `InteractiveHero.tsx` files were not modified or deleted.
