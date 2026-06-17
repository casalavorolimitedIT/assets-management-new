-- Run once in the Supabase SQL editor.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_changed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auth_synced  boolean NOT NULL DEFAULT false;
