-- Migration: add resumes table columns expected by backend
-- Run this against your Supabase Postgres database (via psql or Supabase SQL editor)

ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS filename text,
  ADD COLUMN IF NOT EXISTS ats_score integer,
  ADD COLUMN IF NOT EXISTS feedback jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();


CREATE INDEX IF NOT EXISTS resumes_user_id_idx ON public.resumes(user_id);
