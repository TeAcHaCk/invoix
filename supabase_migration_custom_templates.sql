-- ==============================================================================
-- INVOIX — CUSTOM TEMPLATES SYNC
-- ==============================================================================
-- Run ONCE in the Supabase SQL Editor. Idempotent.
--
-- THE PROBLEM
--   Custom templates lived entirely in localStorage
--   (`invoix_custom_templates_v1`). They were never sent anywhere, so a template
--   designed on a laptop did not exist on a phone, and clearing browser data
--   destroyed it permanently.
--
--   That contradicts the "Cloud Active" badge and the Pro promise, and it is the
--   kind of loss a paying user does not forgive: their saved brand template is
--   the thing they least expect to be device-local.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.custom_templates (
  -- The client mints the id, so an offline-created template keeps its identity
  -- when it later syncs rather than being duplicated.
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  industry    TEXT,
  theme       TEXT,
  -- The whole CustomTemplatePreset, so the shape can evolve without a migration.
  template    JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_templates_user_id
  ON public.custom_templates(user_id);

ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- Strictly private. Unlike `documents`, a template has NO public surface: there
-- is no share link, no anon read, nothing granted to anon. Owner only.
-- ==============================================================================
DROP POLICY IF EXISTS "custom_templates_select_own" ON public.custom_templates;
DROP POLICY IF EXISTS "custom_templates_insert_own" ON public.custom_templates;
DROP POLICY IF EXISTS "custom_templates_update_own" ON public.custom_templates;
DROP POLICY IF EXISTS "custom_templates_delete_own" ON public.custom_templates;

CREATE POLICY "custom_templates_select_own"
  ON public.custom_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "custom_templates_insert_own"
  ON public.custom_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_templates_update_own"
  ON public.custom_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_templates_delete_own"
  ON public.custom_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- VERIFY
-- ==============================================================================
--   SELECT policyname, cmd FROM pg_policies
--    WHERE tablename = 'custom_templates';
--   -- expect 4 rows, all owner-scoped, none granted to anon
-- ==============================================================================
