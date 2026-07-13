-- Fix WITH CHECK clauses so legitimate app rows can be inserted while RLS is active.

DROP POLICY IF EXISTS child_profiles_family_policy ON "public"."child_profiles";
CREATE POLICY child_profiles_family_policy ON "public"."child_profiles"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR "family_id" = (current_app_family_id())::uuid
  )
  WITH CHECK (
    rls_bypass()
    OR "family_id" = (current_app_family_id())::uuid
  );

DROP POLICY IF EXISTS family_memberships_member_policy ON "public"."family_memberships";
CREATE POLICY family_memberships_member_policy ON "public"."family_memberships"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR "family_id" = (current_app_family_id())::uuid
    OR "user_id" = (current_app_user_id())::uuid
  )
  WITH CHECK (
    rls_bypass()
    OR "family_id" = (current_app_family_id())::uuid
    OR "user_id" = (current_app_user_id())::uuid
  );

DROP POLICY IF EXISTS lesson_progress_family_policy ON "public"."lesson_progress";
CREATE POLICY lesson_progress_family_policy ON "public"."lesson_progress"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR EXISTS (
      SELECT 1 FROM "public"."child_profiles" cp
      WHERE cp.id = "lesson_progress"."child_id"
        AND cp."family_id" = (current_app_family_id())::uuid
    )
  )
  WITH CHECK (
    rls_bypass()
    OR EXISTS (
      SELECT 1 FROM "public"."child_profiles" cp
      WHERE cp.id = "lesson_progress"."child_id"
        AND cp."family_id" = (current_app_family_id())::uuid
    )
  );

DROP POLICY IF EXISTS mastery_records_family_policy ON "public"."mastery_records";
CREATE POLICY mastery_records_family_policy ON "public"."mastery_records"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR EXISTS (
      SELECT 1 FROM "public"."child_profiles" cp
      WHERE cp.id = "mastery_records"."child_id"
        AND cp."family_id" = (current_app_family_id())::uuid
    )
  )
  WITH CHECK (
    rls_bypass()
    OR EXISTS (
      SELECT 1 FROM "public"."child_profiles" cp
      WHERE cp.id = "mastery_records"."child_id"
        AND cp."family_id" = (current_app_family_id())::uuid
    )
  );

DROP POLICY IF EXISTS simulated_accounts_family_policy ON "public"."simulated_accounts";
CREATE POLICY simulated_accounts_family_policy ON "public"."simulated_accounts"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR EXISTS (
      SELECT 1 FROM "public"."child_profiles" cp
      WHERE cp.id = "simulated_accounts"."child_id"
        AND cp."family_id" = (current_app_family_id())::uuid
    )
  )
  WITH CHECK (
    rls_bypass()
    OR EXISTS (
      SELECT 1 FROM "public"."child_profiles" cp
      WHERE cp.id = "simulated_accounts"."child_id"
        AND cp."family_id" = (current_app_family_id())::uuid
    )
  );

DROP POLICY IF EXISTS virtual_ledger_entries_family_policy ON "public"."virtual_ledger_entries";
CREATE POLICY virtual_ledger_entries_family_policy ON "public"."virtual_ledger_entries"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR EXISTS (
      SELECT 1 FROM "public"."child_profiles" cp
      WHERE cp.id = "virtual_ledger_entries"."child_id"
        AND cp."family_id" = (current_app_family_id())::uuid
    )
  )
  WITH CHECK (
    rls_bypass()
    OR EXISTS (
      SELECT 1 FROM "public"."child_profiles" cp
      WHERE cp.id = "virtual_ledger_entries"."child_id"
        AND cp."family_id" = (current_app_family_id())::uuid
    )
  );
