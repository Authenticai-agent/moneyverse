# Game Economy

## Currencies

### Simulated cash

Used in educational scenarios. No cash value and no transfer to unrelated users.

### Learning XP

Measures learning progress. Cannot be purchased.

### Cosmetic tokens

Earned through approved learning activity and used for deterministic cosmetic items. No random boxes, resale, or real-money conversion.

## Sources

- Lesson completion
- Demonstrated mastery
- Parent-approved mission
- Scenario achievement
- Accessibility-neutral participation rewards

## Sinks

- Fixed-price cosmetic items
- World upgrades
- Optional scenario customization

## Invariants

- Client never supplies authoritative amounts.
- One idempotency key can create one reward outcome.
- Ledger balance equals the sum of entries.
- Reversals preserve history.
- No negative balance unless a specific simulator allows it and labels it clearly.
- No reward depends on inviting strangers.
- No paid advantage in educational rankings.

## Anti-farming

Detect duplicate submissions, impossible completion speed, replayed requests, modified client payloads, and multi-account referral patterns. Responses should be neutral and permit adult review.
