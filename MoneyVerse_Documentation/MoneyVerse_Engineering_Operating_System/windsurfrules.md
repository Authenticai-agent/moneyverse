# MoneyVerse Non-Negotiable Rules

1. Read `AGENTS.md`, `current-task.md`, `tasks.md`, `architecture.md`, `schema.md`, and `decisions.md`.
2. Do one approved task at a time.
3. Never expose secrets or restricted data to browser code.
4. Never store passwords, tokens, Plaid secrets, card data, or keys in logs.
5. Never trust client-calculated XP, rewards, balances, roles, prices, or permissions.
6. Every mutation requires authentication, authorization, validation, and audit where applicable.
7. Every private query must be tenant- and relationship-scoped.
8. Every tenant-owned Supabase table requires RLS.
9. Never authorize by identifier alone.
10. No raw SQL interpolation, eval, dynamic code execution, unsafe HTML, or unrestricted URL fetch.
11. Money uses integer minor units or decimal-safe arithmetic.
12. Ledger entries are append-only.
13. Disabled features expose no UI, route, job, SDK initialization, secret, or network call.
14. `LLM_ENABLED=false`, `PLAID_ENABLED=false`, and `PAYMENTS_ENABLED=false` by default.
15. Children cannot connect financial accounts, make payments, publish public profiles, or message strangers.
16. No targeted child advertising, loot boxes, gambling mechanics, or shame-based copy.
17. Use only design tokens and approved copy.
18. Do not guess schema or policy.
19. Never suppress a security test to make CI pass.
20. Leave the repository compiling, tested, documented, and reversible.
