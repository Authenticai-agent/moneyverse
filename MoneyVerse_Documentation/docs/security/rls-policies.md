# Row-Level Security Policies

## Principles

- Enable RLS on every tenant-owned table.
- Deny by default.
- Scope through stable tenant or relationship keys.
- Service roles are narrowly separated.
- Background workers use dedicated roles and explicit task scope.
- RLS supplements application authorization; it does not replace it.

## Policy categories

### Family-owned data

Read/write requires active family membership and sufficient family role.

### Child-owned data

Access requires authorized family relationship, assigned educational relationship, or the child’s own approved session scope.

### School/classroom data

Access requires active school or classroom membership and role-specific action.

### Ledger data

Children may read approved views of their own ledger. Mutations occur only through trusted server procedures or application services.

### Audit data

Ordinary application roles may insert approved audit events but cannot update or delete them. Read access is highly restricted.

## Required tests

- Cross-family read and write
- Cross-classroom read and write
- Teacher attempts family-finance access
- Suspended membership
- Revoked membership
- Background worker overreach
- Service-role misuse
- Missing tenant context
