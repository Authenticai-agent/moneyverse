# Database Restore Runbook

1. Declare incident and freeze risky writes.
2. Select verified restore point.
3. Restore into isolated environment.
4. Validate schema, RLS, session revocation, and data integrity.
5. Promote only after approval.
6. Reconcile writes after restore point.
7. Document recovery results.
