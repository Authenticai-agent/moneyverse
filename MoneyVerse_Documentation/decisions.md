# MoneyVerse Decisions

| ID | Decision | Why | Status |
|---|---|---|---|
| D-001 | Use a modular monolith initially | Lower operational complexity and cost | Accepted |
| D-002 | PostgreSQL is the primary database | Strong transactions, constraints, and RLS | Accepted |
| D-003 | Money uses integer minor units | Prevent floating-point errors | Permanent |
| D-004 | Virtual ledger is append-only | Auditability and replay safety | Permanent |
| D-005 | LLM disabled for MVP | Determinism, privacy, cost, and safety | Accepted |
| D-006 | Plaid disabled for MVP | No bank dependency and lower risk | Accepted |
| D-007 | Payments disabled for MVP | Avoid premature financial and compliance scope | Accepted |
| D-008 | No public child profiles | Privacy and child safety | Permanent |
| D-009 | No child-to-stranger messaging | Child safety | Permanent |
| D-010 | No targeted child advertising | Privacy and ethics | Permanent |
| D-011 | No loot boxes or gambling mechanics | Child safety and product integrity | Permanent |
| D-012 | Full date of birth not collected by default | Data minimization | Accepted |
| D-013 | Teachers cannot access family financial data | Separation of educational and family scopes | Permanent |
| D-014 | RLS is defense in depth, not sole authorization | Prevent policy bypass through application mistakes | Accepted |
| D-015 | Design values come only from `design.md` | Prevent UI drift | Accepted |
| D-016 | User-facing strings come from `copy.md` | Consistency and localization readiness | Accepted |
| D-017 | Disabled features make no network calls | Reduce attack surface and hidden cost | Permanent |
