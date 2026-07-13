# MoneyVerse Design System

## Design principles

- Friendly, optimistic, and trustworthy
- Playful without feeling childish
- Educational without feeling institutional
- Never resemble a casino, brokerage terminal, or manipulative game store
- Accessible by default
- Clear separation between child and adult experiences

## Token rule

Feature code may not introduce arbitrary colors, spacing, radii, shadows, typography, or animation durations. Use centralized design tokens.

## Initial color tokens

- Primary Purple: `#6B4EFF`
- Solar Yellow: `#FFD84D`
- Aqua Teal: `#5CE1E6`
- Lavender Mist: `#D9CFFF`
- Emerald Green: `#5FD38D`
- Dark Base: `#1C1F2E`
- Light Base: `#F8F8FF`

Every token requires accessible foreground pairings and tested contrast.

## Typography

Use a highly legible sans-serif family with system fallbacks. Avoid decorative fonts for body text. Support text scaling without layout breakage.

## Motion

- Respect `prefers-reduced-motion`.
- Do not use flashing content.
- Avoid motion as the only indicator of success or failure.
- Do not use loss animations designed to shame or pressure.
- Keep celebrations short and dismissible.

## Components

Maintain approved variants for:

- Buttons
- Inputs
- Cards
- Progress indicators
- Dialogs
- Alerts
- Tabs
- Tables
- Charts
- Empty states
- Lesson slides
- Quiz choices
- Parent approvals
- Security warnings

## Child-facing design

- Large touch targets
- Minimal dense text
- Clear progress
- Non-punitive error states
- No public popularity metrics
- No monetization pressure

## Adult-facing design

- Clear permissions
- Explicit consent
- Transparent data use
- Strong security settings
- Clear separation between simulated and real financial data
