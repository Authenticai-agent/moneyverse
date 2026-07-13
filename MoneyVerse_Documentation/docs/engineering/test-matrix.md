# Requirement-to-Test Matrix

| Requirement | Unit | Integration | E2E | Security | Status |
|---|---:|---:|---:|---:|---|
| Parent cannot access another family | Yes | Yes | Yes | Yes | Planned |
| Refresh reuse revokes family | Yes | Yes | Yes | Yes | Planned |
| Reward cannot be replayed | Yes | Yes | Optional | Yes | Planned |
| LLM disabled makes no network calls | Yes | Yes | Optional | Yes | Planned |
| Plaid disabled exposes no route | Yes | Yes | Yes | Yes | Planned |
| Child cannot access adult settings | Yes | Yes | Yes | Yes | Planned |
| RLS blocks cross-tenant access | Yes | Yes | Optional | Yes | Passing |
| Sensitive input warning works | Yes | Yes | Yes | Yes | Planned |
| Data export is authorized and rate-limited | Yes | Yes | Yes | Yes | Planned |
