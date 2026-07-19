# MoneyVerse Development Plan

## Phase 0 — Discovery and controls

- [x] Product vision documented
- [x] Root agent rules documented
- [x] Architecture baseline documented
- [x] Schema baseline documented
- [x] Security invariants documented
- [x] Child-safety requirements documented
- [x] Threat-model baseline documented
- [ ] Legal and privacy review scheduled
- [ ] Final MVP scope approved

## Phase 1 — Secure foundation

- [x] Parent registration
- [x] Login and email-verification structure
- [x] JWT access-token validation
- [x] Rotating refresh tokens
- [x] Session revocation
- [x] Parent family creation
- [x] Child profile creation
- [x] Authorization policies
- [x] RLS policies
- [x] Audit events
- [x] Rate limiting
- [x] Security headers
- [x] CI quality gates
- [x] Local seed and setup

## Phase 2 — Curriculum MVP

- [x] Versioned lesson model
- [x] Lesson player
- [x] Quiz engine
- [x] Mastery and progress
- [x] XP and achievements
- [x] Age-band controls
- [x] Parent progress dashboard
- [x] Initial reviewed curriculum

## Phase 3 — Game world / MoneyVerse Lite public tools

- [x] Immutable virtual ledger
- [x] Savings goals
- [x] Interactive 3D hero
- [x] Money Tree simulator
- [x] Scam Shield quiz
- [x] Lemonade stand profit game
- [x] Savings goal calculator
- [x] Parent/teacher waitlist capture
- [x] Budget builder
- [x] Money Tree family feature
- [x] Daily Money Quests
- [x] Business simulator (lemonade stand to bakery)
- [x] Shareable achievement cards
- [x] New landing hero — design 2a (static marketing hero with carousel)
- [x] Redesigned /tools index — design 3a (animated card grid)
- [x] Money Tree Simulator game page — design 4a
- [x] Savings Goal Calculator rebuilt as the Goal Jar — playable simulator with
      a live answer, 26-card tradeoff mechanic, and a printable signed plan
      (pure engine + 105 unit tests; route, h1, metadata and JSON-LD unchanged)
- [ ] Goal Jar: keyboard-only and reduced-motion passes in a real browser
- [ ] Goal Jar: decide the parent email field — wire to /api/waitlist or remove
- [ ] Dispose WebGL contexts on unmount in InteractiveHero, moneytree-world and
      TreeScene (root cause of "Context Lost" on /tools; blocks any new canvas)
- [ ] Cosmetic rewards
- [ ] World-state persistence
- [ ] Anti-replay and anti-farming tests

## Phase 4 — Family tools

- [ ] Chores
- [ ] Simulated allowance schedules
- [ ] Parent-created missions
- [ ] Family goals
- [ ] Private family challenges
- [ ] Parent-approved share cards

## Phase 5 — Advanced learning

- [ ] Entrepreneurship simulator
- [ ] Financial life simulator
- [ ] Scam Shield
- [ ] Credit and debt simulator
- [ ] Future-self simulation
- [ ] Date-sensitive content lifecycle

## Phase 6 — Classroom edition

- [ ] Teacher accounts
- [ ] School and classroom isolation
- [ ] Expiring join codes
- [ ] Assignments
- [ ] Private leaderboards
- [ ] Educational reports
- [ ] Permission-controlled exports

## Phase 7 — Production hardening

- [x] Accessibility audit
- [x] Penetration test
- [x] Load test
- [x] Security audit and hardening
- [ ] Restore test
- [ ] Incident-response drill
- [x] Vendor review (dependencies audited and updated)
- [x] Privacy review
- [ ] Retention automation
- [ ] Production monitoring
- [x] Launch checklist complete

## Phase 8 — Optional monetization

- [ ] Parent subscription
- [ ] Classroom licensing
- [ ] School licensing
- [ ] Non-manipulative premium cosmetics
- [ ] Premium educational scenarios

## Phase 9 — Optional Plaid

- [ ] Legal review
- [ ] Consent design
- [ ] Updated threat model
- [ ] Sandbox implementation
- [ ] Token encryption
- [ ] Webhook verification
- [ ] Data deletion
- [ ] Incident-response update

## Phase 10 — Optional LLM

- [ ] Privacy review
- [ ] Provider review
- [ ] Prompt-injection tests
- [ ] Structured-output validation
- [ ] Cost controls
- [ ] Human oversight
- [ ] Kill switch
- [ ] Red-team evaluation

## Current approved task

See `current-task.md`.
