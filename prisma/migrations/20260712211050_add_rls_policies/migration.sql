-- Enable Row-Level Security on tenant-owned tables.

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."families" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."family_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."child_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."refresh_token_families" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lesson_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."mastery_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."simulated_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."virtual_ledger_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too, so the app must use withRlsContext or withSystemContext.
ALTER TABLE "public"."users" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."families" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."family_memberships" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."child_profiles" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_sessions" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_credentials" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."refresh_token_families" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."lesson_progress" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."mastery_records" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."simulated_accounts" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."virtual_ledger_entries" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_events" FORCE ROW LEVEL SECURITY;
ALTER TABLE "public"."security_events" FORCE ROW LEVEL SECURITY;

-- Helper function: resolves current family_id from app context.
CREATE OR REPLACE FUNCTION current_app_family_id() RETURNS text AS $$
BEGIN
  RETURN current_setting('app.family_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS text AS $$
BEGIN
  RETURN current_setting('app.user_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rls_bypass() RETURNS boolean AS $$
BEGIN
  RETURN current_setting('app.bypass_rls', true) = 'true';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- families: read/write if the user has a membership for the family.
CREATE POLICY families_member_policy ON "public"."families"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR id = (current_app_family_id())::uuid
    OR EXISTS (
      SELECT 1 FROM "public"."family_memberships" fm
      WHERE fm."family_id" = "families".id
        AND fm."user_id" = (current_app_user_id())::uuid
    )
  )
  WITH CHECK (
    rls_bypass()
  );

-- family_memberships: read/write if the user is a member of the family.
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
  );

-- child_profiles: access if the child belongs to the current family.
CREATE POLICY child_profiles_family_policy ON "public"."child_profiles"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR "family_id" = (current_app_family_id())::uuid
  )
  WITH CHECK (
    rls_bypass()
  );

-- users: access own record only.
CREATE POLICY users_self_policy ON "public"."users"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR id = (current_app_user_id())::uuid
  )
  WITH CHECK (
    rls_bypass()
  );

-- user_sessions, user_credentials, refresh_token_families: access own records only.
CREATE POLICY user_sessions_self_policy ON "public"."user_sessions"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR "user_id" = (current_app_user_id())::uuid
  )
  WITH CHECK (
    rls_bypass()
  );

CREATE POLICY user_credentials_self_policy ON "public"."user_credentials"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR "user_id" = (current_app_user_id())::uuid
  )
  WITH CHECK (
    rls_bypass()
  );

CREATE POLICY refresh_token_families_self_policy ON "public"."refresh_token_families"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR "user_id" = (current_app_user_id())::uuid
  )
  WITH CHECK (
    rls_bypass()
  );

-- lesson_progress: access if the child belongs to the current family.
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
  );

-- mastery_records: access if the child belongs to the current family.
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
  );

-- simulated_accounts: access if the child belongs to the current family.
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
  );

-- virtual_ledger_entries: access if the child belongs to the current family.
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
  );

-- audit_events: insert only; reads restricted to system context.
CREATE POLICY audit_events_insert_policy ON "public"."audit_events"
  FOR INSERT
  TO public
  WITH CHECK (
    rls_bypass()
    OR "actor_id" = (current_app_user_id())::uuid
  );

CREATE POLICY audit_events_select_policy ON "public"."audit_events"
  FOR SELECT
  TO public
  USING (
    rls_bypass()
  );

-- security_events: insert only; reads restricted to system context.
CREATE POLICY security_events_insert_policy ON "public"."security_events"
  FOR INSERT
  TO public
  WITH CHECK (
    rls_bypass()
  );

CREATE POLICY security_events_select_policy ON "public"."security_events"
  FOR SELECT
  TO public
  USING (
    rls_bypass()
  );