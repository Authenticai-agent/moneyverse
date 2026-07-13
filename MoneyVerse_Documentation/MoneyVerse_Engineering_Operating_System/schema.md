# Schema Authority

This document is the top-level schema authority. Detailed table specifications live in `docs/supabase/schema/`.

Global rules:

- Supabase Auth owns adult authentication.
- Application profiles reference `auth.users.id`.
- Child profiles do not require `auth.users` records by default.
- Tenant-owned tables carry explicit tenant keys.
- RLS is mandatory.
- Ledger and audit records are append-oriented.
- Money uses integer minor units.
- All migrations are versioned and reversible where feasible.
