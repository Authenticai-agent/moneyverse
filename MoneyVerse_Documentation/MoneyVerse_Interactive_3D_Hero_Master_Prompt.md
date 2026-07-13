# MoneyVerse Interactive 3D Hero Section — Master Build Prompt

## Project Goal

Design and build a visually unforgettable, truly three-dimensional, interactive hero section for the **MoneyVerse** financial education web application.

The hero must communicate:

- Financial education as an adventure
- Building a better future through smart decisions
- Trust for parents and schools
- Excitement for children and teenagers
- Premium technology
- Strong viral and screenshot-worthy potential

The experience should feel like a combination of:

- Apple-quality product presentation
- AAA game-world polish
- Pixar-like warmth
- Unreal Engine-style lighting
- Premium fintech elegance
- A living miniature world

Do not copy any existing product, game, visual scene, character, or interface.

The final result must feel original, elegant, interactive, and unmistakably MoneyVerse.

---

# Core Creative Concept

Create a floating 3D island called the **MoneyVerse World**.

The island represents a child's evolving financial future.

The world should visibly transform from a simple beginning into a thriving, healthy, responsible, and sustainable community as the visitor interacts with the hero.

The scene should include:

- A modern family home
- A small bakery
- A lemonade stand
- A school
- A library
- A park
- A community garden
- A savings vault
- A business district
- A transportation hub
- Solar panels
- Wind turbines
- A financial observatory
- A glowing Money Tree
- Paths connecting all major areas
- Tiny animated residents
- Water, clouds, birds, and environmental details

Every object should symbolize a financial concept or life skill.

Avoid imagery centered on excessive luxury, greed, gambling, speculation, or unrealistic wealth.

The world should communicate:

> Smart financial decisions help people build stable, meaningful, and sustainable lives.

---

# True 3D Visual Direction

This must be a genuine 3D experience, not a flat illustration with fake shadows.

Use:

- Physically based rendering
- Global illumination
- Ambient occlusion
- Cinematic depth of field
- Soft volumetric lighting
- Realistic reflections
- Subtle bloom
- High-quality shadows
- Premium materials
- Layered environmental depth
- Smooth camera motion
- Professional animation timing
- High-detail hero assets
- Responsive rendering quality

Recommended implementation:

- React Three Fiber
- Three.js
- Drei utilities where appropriate
- GSAP or Framer Motion for coordinated transitions
- Instancing for repeated objects
- Compressed GLTF or GLB assets
- Draco or Meshopt compression
- Texture atlases where useful
- WebGL with graceful fallback

Avoid:

- Flat vector scenes
- Low-quality low-poly visuals
- Generic dashboard mockups
- Cartoon clipart
- Casino visuals
- NFT styling
- Crypto speculation imagery
- Overly childish design
- Excessive particle effects
- Distracting camera movement

---

# Hero Layout

## Desktop

Use a split composition:

### Left side

Headline:

# Learn Money by Building Your Future

Subheadline:

MoneyVerse transforms financial education into an unforgettable adventure for kids, families, and classrooms.

Primary CTA:

**Start Your Adventure**

Secondary CTA:

**Explore MoneyVerse**

Optional trust line:

No bank connection required. No ads. Built for safe learning.

### Right side

A large interactive 3D floating island occupying most of the visual space.

The island must feel alive, deep, and explorable.

## Tablet

Compress the scene while preserving depth and interactivity.

The copy may remain left-aligned or move above the island depending on available width.

## Mobile

Use a vertically stacked layout:

1. Headline
2. Subheadline
3. Primary CTA
4. Secondary CTA
5. Interactive island preview

Mobile interactions should use tap instead of hover.

The scene must remain legible and performant.

---

# Interactive World Growth

The hero must not remain static.

As the visitor scrolls, the island should gradually evolve.

## Scroll progression

### Stage 1 — The Beginning

At the initial viewport:

- A smaller island
- A simple home
- A young Money Tree
- A lemonade stand
- Open land
- A few paths
- Minimal activity

The atmosphere should feel full of potential.

### Stage 2 — Learning and Saving

As the visitor scrolls slightly:

- The Money Tree grows taller
- New leaves appear
- Small glowing coins emerge among the branches
- A savings vault appears
- The school and library become more prominent
- Additional paths connect the island
- Small UI cards appear for Saving and Budgeting

### Stage 3 — Earning and Entrepreneurship

Further scroll progression should reveal:

- The bakery expands
- A new business district develops
- Delivery vehicles begin moving
- Tiny NPCs enter and leave businesses
- The entrepreneurship district becomes active
- A floating card displays Revenue, Costs, and Profit

### Stage 4 — Long-Term Growth

Near the end of the hero sequence:

- The island reaches its most developed state
- Parks and trees flourish
- Clean transportation becomes visible
- The Money Tree reaches full maturity
- The community becomes lively
- The observatory glows
- The horizon becomes brighter
- The world feels prosperous, balanced, and sustainable

The transformation must be smooth, elegant, and optimistic.

Do not show destruction or punish the visitor for scrolling backward.

When the user scrolls upward, the world may reverse gracefully without appearing damaged.

---

# Money Tree Animation

The Money Tree is the signature visual icon of MoneyVerse.

It should be positioned prominently on the island.

## Behavior

Over time and during scroll progression:

- The trunk becomes slightly stronger
- Branches extend
- New leaves grow
- Leaves gently move in the wind
- Small coin-like lights appear among the branches
- A soft glow travels from the roots upward
- The surrounding ground becomes greener
- Tiny flowers or plants emerge nearby

The tree should communicate compound growth without looking like coins are literally falling from the sky.

## Interaction

When hovered or tapped:

- The tree subtly brightens
- A glass panel appears
- The panel explains:

**Money Tree**

Small savings can grow over time when you stay consistent.

Optional animated indicators:

- Starting amount
- Weekly contribution
- Time
- Growth

Do not display guaranteed investment returns.

Use educational language and clearly label simulated examples.

---

# Tiny NPC Life System

Add small, tasteful, animated NPCs throughout the island.

NPCs should:

- Walk between the home, school, bakery, park, and businesses
- Enter and exit buildings
- Sit on benches
- Carry books or small packages
- Water plants
- Ride bicycles
- Work at the lemonade stand
- Visit the savings vault
- Use public transportation
- Participate in community life

The NPCs should make the world feel alive without becoming visually noisy.

## Behavior requirements

- Use short looping paths
- Randomize timing slightly
- Avoid collisions
- Use lightweight animation
- Pause or reduce movement when the browser tab is inactive
- Respect reduced-motion preferences
- Avoid rendering large NPC counts on low-powered devices

NPCs must not display speech bubbles containing unmoderated or random text.

---

# Building Hover and Tap Discovery

Every major building should represent a financial concept.

When the user hovers over a building on desktop or taps it on mobile:

- The building lifts or glows slightly
- Its outline becomes more visible
- A small glassmorphism information card appears
- The camera may gently focus toward it
- The rest of the scene subtly softens

## Suggested mappings

### Family Home

**Budgeting**

Plan where your money should go before you spend it.

### Savings Vault

**Saving**

Build toward goals and prepare for unexpected expenses.

### Business District

**Entrepreneurship**

Learn revenue, costs, profit, pricing, and customer value.

### Financial Observatory

**Investing**

Explore long-term growth, diversification, and risk through simulations.

### School

**Learning**

Complete short lessons and build real-world financial skills.

### Bakery

**Business Basics**

Set prices, buy supplies, serve customers, and calculate profit.

### Community Garden

**Patience and Growth**

Small, consistent actions can create meaningful long-term results.

### Transportation Hub

**Life Costs**

Learn how transportation choices affect a budget.

## Safety rule

Hover cards must be educational and non-promotional.

Do not recommend specific financial products, investments, lenders, banks, securities, or cryptocurrencies.

---

# Day-to-Night Cycle

The world should slowly transition through a refined day-to-night cycle.

Suggested cycle duration:

- Approximately four to eight minutes
- Slow enough to feel atmospheric
- Never abrupt
- Never distracting

## Day

- Warm sunlight
- Clear sky
- Active NPC movement
- Bright vegetation
- Soft shadows

## Sunset

- Golden light
- Orange and lavender horizon
- Longer shadows
- Warm window lights begin appearing

## Night

- Deep navy sky
- Soft stars
- Building lights
- Glowing paths
- Illuminated Money Tree
- Gentle moonlight
- Reduced NPC activity

## Dawn

- Cool soft light
- Gradual return of activity
- Subtle mist
- Warm horizon

The cycle should pause when:

- The tab is hidden
- The user enables reduced motion
- Device performance is constrained
- Battery-saving mode requires reduced activity

Allow the application to use a static lighting state on low-powered devices.

---

# Mouse and Pointer Parallax

The camera should respond gently to pointer movement.

## Desktop behavior

- Small horizontal and vertical camera offset
- Slight foreground and background depth separation
- Slow easing
- Maximum movement strictly limited
- Camera returns smoothly to center

The effect should create presence, not dizziness.

## Mobile behavior

Do not require device-motion permissions.

Use:

- Very subtle touch drag
- Optional controlled orbit
- Tap-to-focus interactions

Do not use aggressive gyroscope effects by default.

## Accessibility

Disable or reduce parallax when:

- `prefers-reduced-motion` is active
- The device has low performance
- The user chooses a static experience
- Motion causes accessibility concerns

---

# Seasonal World Events

Make the hero feel fresh over time through optional seasonal themes.

Seasonal changes must never affect learning progress or create fear of missing out.

## Spring

- Blossoming trees
- New flowers
- Soft rainbows after light rain
- Butterflies
- Fresh green vegetation

## Summer

- Bright sunlight
- Lush trees
- Active community garden
- Picnic activity
- Gentle water reflections

## Autumn

- Orange and gold leaves
- Falling leaves
- Harvest details
- Warm lighting
- Pumpkins or seasonal plants where appropriate

## Winter

- Light snow
- Snow-covered rooftops
- Warm windows
- Subtle breath or mist effects
- Evergreen accents

## Optional educational events

- Savings Week
- Entrepreneurship Month
- Scam Awareness Week
- Back-to-School Budget Challenge
- Family Goal Season

Seasonal content must remain subtle, tasteful, and safe.

Avoid:

- Limited-time purchase pressure
- Countdown timers aimed at children
- Paid seasonal exclusivity
- Fear-of-missing-out mechanics
- Reward loss after a season ends

---

# Start Your Adventure Camera Fly-In

The primary CTA must trigger a memorable transition.

When the visitor selects **Start Your Adventure**:

1. The CTA confirms the action immediately.
2. The 3D camera begins a smooth cinematic fly-in.
3. The camera moves toward the island.
4. It passes the Money Tree or a major landmark.
5. Buildings become larger and more detailed.
6. The camera approaches a glowing gateway, school entrance, or central plaza.
7. The scene transitions seamlessly into onboarding or the application dashboard.

## Transition requirements

- Duration should feel premium but not slow
- Target approximately 1.2 to 2.2 seconds
- User input should not be trapped
- The transition must be cancelable or skippable when appropriate
- Route navigation should remain reliable
- Avoid delaying access on repeat visits
- Respect reduced-motion settings
- Provide a simple fade transition fallback

## Reduced-motion fallback

When reduced motion is enabled:

- Briefly highlight the island
- Fade the scene
- Navigate immediately

---

# Floating Interface Cards

Integrate subtle translucent interface cards into the 3D world.

Possible cards:

- Savings Goal
- Weekly Budget
- Money Tree Growth
- Business Profit
- XP Earned
- Achievement Unlocked
- Scam Shield Score

The cards should:

- Use glassmorphism sparingly
- Have strong text contrast
- Remain readable
- Feel attached to world locations
- Animate with restrained movement
- Never obscure the main scene
- Avoid displaying real child or family financial data in the hero

Use fictional demo values only.

---

# Viral and Shareable Potential

The hero should be memorable enough to encourage:

- Screenshots
- Screen recordings
- Social sharing
- Product demos
- Press coverage
- Classroom presentations
- Parent recommendations

Potential viral moments:

- The Money Tree visibly growing
- The world transforming during scroll
- Hovering over buildings to reveal financial concepts
- The day-to-night transition
- Seasonal variations
- The cinematic fly-in
- A polished loading reveal
- Small hidden educational easter eggs

Do not build virality through manipulative referral mechanics.

Virality should come from visual quality, originality, usefulness, and delight.

---

# Performance and Loading Strategy

The hero must remain fast despite the 3D experience.

## Loading

- Show the headline and CTA immediately
- Do not block all content while 3D assets load
- Use an elegant lightweight placeholder
- Load essential geometry first
- Defer secondary effects
- Lazy-load seasonal assets
- Avoid large uncompressed textures
- Cache static assets appropriately

## Optimization

Use:

- GLB or GLTF compression
- Draco or Meshopt
- Texture compression
- Instanced meshes
- Level of detail
- Frustum culling
- Reduced NPC counts on mobile
- Reduced particles on weak devices
- Adaptive device pixel ratio
- Animation pause when offscreen
- Code splitting
- Asset budgets

## Suggested performance tiers

### High

- Full lighting
- Full NPC system
- Seasonal effects
- Reflections
- Advanced shadows
- Day-night cycle

### Medium

- Simplified shadows
- Reduced NPC count
- Fewer particles
- Lower texture resolution

### Low

- Static or lightly animated island
- No advanced reflections
- Limited particles
- Simplified lighting

### No WebGL

Use a high-quality static rendered image or short lightweight video fallback with fully accessible HTML content.

---

# Accessibility Requirements

The hero must meet or support WCAG 2.2 AA.

Requirements:

- Fully accessible HTML headline and buttons
- Keyboard-accessible interactive buildings
- Visible focus states
- Text equivalents for 3D interactions
- Screen-reader descriptions
- Reduced-motion support
- Sufficient contrast
- No color-only meaning
- No flashing effects
- No required mouse-only interaction
- Tap and keyboard alternatives
- Skip animation option
- Static fallback

The canvas must never contain the only accessible version of important content.

Each interactive building should have an accessible DOM counterpart.

---

# Security and Privacy Requirements

The hero should not:

- Collect sensitive financial data
- Request child identity
- Request precise location
- Load unreviewed third-party scripts
- Include advertising trackers
- Expose secrets in frontend code
- Render arbitrary HTML
- Execute remote user-generated content
- Load unrestricted remote models or textures
- Use public child data
- Send interaction data to analytics unless analytics is explicitly enabled

Any analytics must be first-party, minimized, and privacy-reviewed.

---

# Color Direction

Use the MoneyVerse palette:

- Primary Purple: `#6B4EFF`
- Solar Yellow: `#FFD84D`
- Aqua Teal: `#5CE1E6`
- Lavender Mist: `#D9CFFF`
- Emerald Green: `#5FD38D`
- Dark Base: `#1C1F2E`
- Light Base: `#F8F8FF`

Keep the scene sophisticated.

Avoid excessive saturation.

Use color to guide attention toward:

- The Money Tree
- The primary CTA
- Interactive learning locations
- The glowing gateway used for the fly-in

---

# Hero Copy

## Headline

**Learn Money by Building Your Future**

## Subheadline

MoneyVerse transforms financial education into an unforgettable adventure for kids, families, and classrooms.

## Primary CTA

**Start Your Adventure**

## Secondary CTA

**Explore MoneyVerse**

## Optional trust statement

No bank connection required. No ads. Built for safe learning.

---

# Acceptance Criteria

The hero is complete only when:

- The island is genuinely 3D
- The scene works on desktop, tablet, and mobile
- The island evolves during scroll
- The Money Tree grows visibly
- NPCs move naturally
- Major buildings support hover, tap, and keyboard discovery
- The day-night cycle is smooth
- Parallax is subtle and accessible
- Seasonal themes can be enabled through configuration
- The CTA triggers a cinematic fly-in
- Reduced-motion fallback works
- No WebGL fallback works
- Important content remains accessible in HTML
- Performance tiers work
- Mobile performance is acceptable
- No sensitive data is collected
- No external tracker is added
- No casino, gambling, crypto, or manipulative design language appears
- The result feels premium, elegant, safe, original, and memorable

---

# Final Instruction to the Coding Agent

Build this hero as a production-quality interactive 3D experience, not a visual mockup.

Start with a high-performance core scene and then add interactivity in phases:

1. Static optimized 3D island
2. Responsive layout and accessible HTML
3. Scroll-based world progression
4. Money Tree growth
5. Building hover and tap interactions
6. Lightweight NPC paths
7. Day-night cycle
8. Seasonal configuration
9. Parallax camera movement
10. Cinematic CTA fly-in
11. Performance tiers and fallbacks
12. Accessibility, security, and final polish

Do not compromise page speed, accessibility, child safety, or clarity for visual effects.

The finished hero should make visitors feel that MoneyVerse is not simply another budgeting application.

It is a living financial-learning world they want to explore.
