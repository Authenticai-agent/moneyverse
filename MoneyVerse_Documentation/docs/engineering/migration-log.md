# Migration Log

| Migration | Date | Purpose | Data risk | Backfill | Rollback | Status |
|---|---|---|---|---|---|---|
| 20260712160000_replace_age_band_with_age | 2026-07-12 | Replace child profile age band enum with integer age | Low | Yes, mapped existing bands to representative ages | Revert to enum and restore original band values | Applied (dev) |
| 20260712202037_add_lesson_engine | 2026-07-12 | Add curriculum tables: courses, modules, lessons, lesson_versions, lesson_progress, mastery_records | Low | No | Drop new tables | Applied (dev) |
| 20260712204610_add_ledger_and_xp | 2026-07-12 | Add simulated_accounts and virtual_ledger_entries for Learning XP | Low | No | Drop new tables | Applied (dev) |
| 20260712211050_add_rls_policies | 2026-07-12 | Enable RLS and create policies on tenant-owned tables | Low | No | Disable RLS and drop policies | Applied (dev) |
| 20260712215000_fix_rls_with_check | 2026-07-12 | Fix RLS WITH CHECK clauses for insert paths on tenant tables | Low | No | Revert to previous policies | Applied (dev) |
| 20260712215500_fix_rls_guc_functions | 2026-07-12 | Make RLS context helper functions robust to unset GUC values | Low | No | Revert to previous functions | Applied (dev) |
| 20260712220000_rls_functions_security_invoker | 2026-07-12 | Set RLS helper functions to SECURITY INVOKER to read session context | Low | No | Revert to SECURITY DEFINER | Applied (dev) |
| 20260712234000_add_savings_goals | 2026-07-12 | Add savings_goals table, SavingsGoalStatus enum, and RLS policy | Low | No | Drop savings_goals table and enum | Applied (dev) |

Every migration entry must include deployment status for development, staging, and production.
