-- Tracks whether a user has used their one-time email update.
-- Run once in the Supabase SQL editor.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_changed boolean NOT NULL DEFAULT false;
