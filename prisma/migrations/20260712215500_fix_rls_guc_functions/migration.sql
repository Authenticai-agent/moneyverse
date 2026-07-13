-- Make context helper functions robust when no context has been set.

CREATE OR REPLACE FUNCTION current_app_family_id() RETURNS text AS $$
BEGIN
  RETURN NULLIF(current_setting('app.family_id', true), '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS text AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_id', true), '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rls_bypass() RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(current_setting('app.bypass_rls', true), '') = 'true';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
