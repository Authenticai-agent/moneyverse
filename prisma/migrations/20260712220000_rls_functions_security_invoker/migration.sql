-- Set RLS helper functions to SECURITY INVOKER so they read the current session context.

ALTER FUNCTION current_app_family_id() SECURITY INVOKER;
ALTER FUNCTION current_app_user_id() SECURITY INVOKER;
ALTER FUNCTION rls_bypass() SECURITY INVOKER;
