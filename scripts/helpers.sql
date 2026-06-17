-- ============================================================
-- Helper functions for fix-seeded-users.ts
-- Run once in the Supabase SQL editor.
-- Safe to re-run (uses CREATE OR REPLACE).
-- ============================================================

-- Returns USER profiles whose auth account is missing or broken.
-- A "valid" auth account has an auth.identities row where
-- provider = 'email' AND provider_id = lower(email).
-- Raw SQL inserts (from the seed script) don't have this, so they
-- show up here and get fixed by the TypeScript script.
CREATE OR REPLACE FUNCTION get_profiles_without_valid_auth()
RETURNS TABLE(
  id uuid,
  email text,
  title text,
  first_name text,
  last_name text,
  phone text,
  compliance jsonb
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    p.id,
    p.email,
    p.title,
    p.first_name,
    p.last_name,
    p.phone,
    p.compliance
  FROM public.profiles p
  WHERE p.role = 'USER'
    AND NOT EXISTS (
      SELECT 1
      FROM auth.users u
      JOIN auth.identities i ON i.user_id = u.id
      WHERE lower(u.email) = lower(p.email)
        AND i.provider = 'email'
        AND lower(i.provider_id) = lower(p.email)
    );
$$;

-- Deletes the auth.users row for the given email.
-- Cascades to auth.identities AND public.profiles (via FK).
-- The TypeScript script saves profile data before calling this.
CREATE OR REPLACE FUNCTION delete_auth_user_by_email(p_email text)
RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM auth.users WHERE lower(email) = lower(p_email);
$$;
