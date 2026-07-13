# MoneyVerse Non-Negotiable Rules

1. Read `AGENTS.md`, `current-task.md`, `tasks.md`, `architecture.md`, `schema.md`, `design.md`, `copy.md`, and `decisions.md` before coding.
2. Do one approved task at a time.
3. Never expose server secrets or restricted data to client code.
4. Never store passwords, PINs, JWTs, refresh tokens, Plaid tokens, card data, or API keys in logs.
5. Never trust client-calculated balances, rewards, XP, prices, permissions, or roles.
6. Every state-changing action requires authentication, authorization, validation, rate limiting where applicable, and an audit event.
7. Every resource query must be tenant- and relationship-scoped.
8. Use RLS as defense in depth on every tenant-owned table.
9. Never authorize by UUID alone.
10. Never use raw SQL interpolation, `eval`, `Function`, shell execution, unsafe HTML, or unrestricted URL fetching.
11. Use parameterized queries and runtime schemas at every trust boundary.
12. Use integer minor units or decimal-safe types for money.
13. Virtual ledger entries are append-only; corrections use reversals.
14. Disabled features expose no routes, UI, jobs, SDK initialization, secrets, or network calls.
15. `LLM_ENABLED=false`, `PLAID_ENABLED=false`, and `PAYMENTS_ENABLED=false` by default.
16. Future LLM output is untrusted and cannot move money, award rewards, change permissions, publish content, or contact children.
17. Never send unrestricted free text, secrets, banking data, or child identifiers to an LLM.
18. Children cannot connect banks, initiate payments, access adult settings, publish public profiles, or message strangers.
19. No targeted child advertising, loot boxes, gambling mechanics, public follower counts, or manipulative streak loss.
20. Use only design tokens from `design.md`; no arbitrary visual constants.
21. Use approved UI language from `copy.md`; never shame a child.
22. Do not add dependencies without checking necessity, maintenance, license, and security.
23. Do not reformat, rename, or rewrite unrelated files.
24. Do not silently change settled decisions; update `decisions.md`.
25. Do not guess schema; update `schema.md` and add a migration.
26. Run lint, type-check, unit tests, integration tests, and relevant E2E/security tests.
27. Never suppress a failing security test to make CI pass.
28. Never use production data in development or tests.
29. Never claim the system is unhackable or legally compliant without review.
30. Stop when the current task acceptance criteria are met.
