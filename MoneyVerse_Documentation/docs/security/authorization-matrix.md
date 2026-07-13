# Authorization Matrix

| Action | Parent/Guardian | Child | Teacher | School Admin | Support | Platform Admin |
|---|---|---|---|---|---|---|
| View own child progress | Allowed by family relationship | Own profile | Assigned classroom only | Aggregate | No | Restricted |
| Create child profile | Authorized guardian | No | No | No | No | Restricted break-glass |
| Edit child nickname | Authorized guardian | Limited future option | No | No | No | Restricted |
| Connect Plaid | Adult owner only, future | No | No | No | No | No |
| View family financial data | Authorized guardian | Age-limited own simulation | No | No | No | Restricted and audited |
| Assign lesson | Parent or teacher by scope | No | Assigned teacher | Policy-based | No | Content/admin scope |
| Publish curriculum | No | No | No | No | No | Authorized content admin |
| Adjust virtual ledger | Parent policy or system rule | No | No | No | No | Controlled audited process |
| Export child data | Authorized guardian | No | School export by lawful scope | Aggregate/policy | No | Restricted |
| Delete child profile | Authorized guardian | No | No | No | No | Restricted recovery process |

Role alone is never sufficient. Every decision also evaluates relationship, tenant, consent, feature flag, resource state, and requested action.
