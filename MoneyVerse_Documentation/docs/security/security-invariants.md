# Security Invariants

1. A user cannot access a family without active membership.
2. A guardian cannot access another family by changing an identifier.
3. A teacher cannot access family financial data.
4. A child cannot initiate bank, payment, or subscription integrations.
5. A client cannot set XP, rewards, balances, prices, or roles.
6. A refresh token succeeds at most once.
7. Refresh-token reuse revokes the token family.
8. Disabled integrations make no network calls.
9. Plaid access tokens never reach the browser.
10. JWTs contain no secrets or unnecessary child data.
11. Every tenant-owned query is scoped.
12. Every tenant-owned table has tested RLS.
13. Deleted or suspended accounts retain no active sessions.
14. Audit records cannot be edited by ordinary administrators.
15. Public sharing contains no identifying child data.
16. Future LLM output cannot directly perform consequential actions.
17. No user-generated text is executed as code or privileged instructions.
18. Every critical mutation is idempotent or safely retryable.
19. Secrets never appear in logs, telemetry, support exports, or screenshots.
20. Production data is never copied into development.
