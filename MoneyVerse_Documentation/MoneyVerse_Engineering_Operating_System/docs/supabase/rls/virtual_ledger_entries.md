# RLS: virtual_ledger_entries

## Default
RLS enabled; deny by default.

## Policy dimensions
- actor role
- tenant membership
- relationship to child
- resource status
- consent state
- action type

## Required tests
- authorized read
- unauthorized read
- authorized insert
- unauthorized insert
- update scope
- delete scope
- suspended membership
- cross-family or cross-school access

Service-role use must be documented and limited.
