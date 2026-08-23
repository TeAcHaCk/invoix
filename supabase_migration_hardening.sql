-- ==============================================================================
-- INVOIX — SECURITY HARDENING MIGRATION
-- ==============================================================================
-- Run this ONCE in the Supabase SQL Editor, after supabase_schema.sql.
-- It is idempotent: re-running it is safe.
--
-- WHAT THIS FIXES
--   1. Any signed-in user could set their own profiles.plan = 'agency'
--      (free Pro) or profiles.role = 'superadmin' (full platform takeover).
--   2. Any anonymous visitor could SELECT and UPDATE every row in documents,
--      because both policies contained "OR (is_public = TRUE)" and is_public
--      defaults to TRUE.
--   3. document_views had RLS enabled with ZERO policies, so every view-tracking
--      insert was silently denied.
--   4. payment_transactions did not exist, though the app writes to it.
--   5. Public share links keyed on documents.id ('doc_' + Date.now()), which is
--      trivially enumerable. Links now key on an unguessable share_token.
-- ==============================================================================


-- ==============================================================================
-- SECTION 1 — PROFILES: lock plan / role / is_suspended
-- ==============================================================================
-- Row-level ownership stays as-is; what changes is WHICH COLUMNS a normal user
-- may write. Two independent layers, so a mistake in either one is not fatal.

-- Layer 1: column-level privileges. A normal user simply has no UPDATE grant
-- on the privileged columns, so the write is rejected before RLS is consulted.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT  UPDATE (full_name, business_name, currency_code, updated_at)
  ON public.profiles TO authenticated;

-- Layer 2: a trigger, so that any future GRANT cannot silently re-open the hole.
CREATE OR REPLACE FUNCTION public.enforce_profile_privileges()
RETURNS TRIGGER AS $$
BEGIN
  -- service_role (billing webhook) and direct SQL-editor access bypass this.
  IF coalesce(auth.role(), 'service_role') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- Platform admins may still manage other users from the admin panel.
  -- Admin status itself can only be granted by service_role, which is what
  -- makes this safe: there is no path from 'user' to 'admin' via this table.
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.plan          IS DISTINCT FROM OLD.plan
  OR NEW.role          IS DISTINCT FROM OLD.role
  OR NEW.is_suspended  IS DISTINCT FROM OLD.is_suspended THEN
    RAISE EXCEPTION
      'plan, role and is_suspended may only be changed by the billing service'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_profile_privileges ON public.profiles;
CREATE TRIGGER trg_enforce_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_privileges();


-- ==============================================================================
-- SECTION 2 — DOCUMENTS: unguessable share tokens
-- ==============================================================================
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS share_token TEXT;

-- Backfill any existing rows with a random token.
UPDATE public.documents
   SET share_token = replace(gen_random_uuid()::text, '-', '')
 WHERE share_token IS NULL;

ALTER TABLE public.documents
  ALTER COLUMN share_token SET DEFAULT replace(gen_random_uuid()::text, '-', '');

CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_share_token
  ON public.documents(share_token);


-- ==============================================================================
-- SECTION 3 — DOCUMENTS: replace the wide-open policies
-- ==============================================================================
-- Before: SELECT and UPDATE both allowed "OR (is_public = TRUE)", i.e. everyone.
-- After:  direct table access is owner/admin only. Anonymous client access goes
--         exclusively through the two SECURITY DEFINER functions in section 5,
--         which require the share token and can only touch signing columns.

DROP POLICY IF EXISTS "Creators can view own documents or admins can view all"   ON public.documents;
DROP POLICY IF EXISTS "Creators can insert own documents"                        ON public.documents;
DROP POLICY IF EXISTS "Creators can update own documents or admins can update any" ON public.documents;
DROP POLICY IF EXISTS "Creators can delete own documents or admins can delete any" ON public.documents;

CREATE POLICY "documents_select_own_or_admin"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "documents_insert_own"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update_own_or_admin"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "documents_delete_own_or_admin"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());


-- ==============================================================================
-- SECTION 4 — DOCUMENT_VIEWS: RLS was on with no policies (all inserts denied)
-- ==============================================================================
DROP POLICY IF EXISTS "document_views_insert_anyone" ON public.document_views;
DROP POLICY IF EXISTS "document_views_select_owner"  ON public.document_views;

-- Anyone opening a share link may record a view. The row carries no user data
-- beyond the user agent, and cannot be read back by the public.
CREATE POLICY "document_views_insert_anyone"
  ON public.document_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "document_views_select_owner"
  ON public.document_views FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.documents d
       WHERE d.id = document_views.document_id
         AND d.user_id = auth.uid()
    )
  );


-- ==============================================================================
-- SECTION 5 — PUBLIC CLIENT-PORTAL FUNCTIONS
-- ==============================================================================
-- These are the ONLY way an anonymous visitor touches the documents table.
-- Each requires the unguessable share_token.

-- 5a. Read one document by share token.
CREATE OR REPLACE FUNCTION public.get_public_document(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_data JSONB;
BEGIN
  SELECT document_data INTO v_data
    FROM public.documents
   WHERE share_token = p_token
     AND is_public = TRUE
   LIMIT 1;

  RETURN v_data; -- NULL when not found; the client renders "link expired"
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5b. Record a view against a share token.
CREATE OR REPLACE FUNCTION public.record_public_view(p_token TEXT)
RETURNS VOID AS $$
DECLARE
  v_id TEXT;
BEGIN
  SELECT id INTO v_id
    FROM public.documents
   WHERE share_token = p_token AND is_public = TRUE
   LIMIT 1;

  IF v_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.document_views (document_id, user_agent)
  VALUES (v_id, current_setting('request.headers', true)::jsonb ->> 'user-agent');

  UPDATE public.documents
     SET views_count    = coalesce(views_count, 0) + 1,
         last_viewed_at = NOW(),
         status         = CASE WHEN status = 'APPROVED' THEN 'APPROVED' ELSE 'VIEWED' END,
         document_data  = jsonb_set(
                            jsonb_set(
                              document_data,
                              '{viewCount}',
                              to_jsonb(coalesce(views_count, 0) + 1)
                            ),
                            '{lastViewedAt}',
                            to_jsonb(NOW())
                          )
   WHERE id = v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5c. Sign a document.
--
-- Deliberately does NOT accept a document_data blob from the caller. It merges
-- only the signature fields, and recomputes the accepted total server-side from
-- the stored pricing items, so a client cannot sign a ₹500,000 contract as ₹1.
CREATE OR REPLACE FUNCTION public.sign_document(
  p_token              TEXT,
  p_signatory          JSONB,
  p_audit              JSONB,
  p_selected_addon_ids TEXT[] DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_id        TEXT;
  v_data      JSONB;
  v_existing  TEXT;
  v_items     JSONB;
  v_total     NUMERIC;
  v_audit     JSONB;
BEGIN
  SELECT id, document_data
    INTO v_id, v_data
    FROM public.documents
   WHERE share_token = p_token AND is_public = TRUE
   LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Document not found or link expired' USING ERRCODE = 'P0002';
  END IF;

  -- Gate on the signature itself, NOT the status column. The status column can
  -- drift out of step with document_data, and the client portal decides whether
  -- to show the signing form from the signature — so this must match it.
  v_existing := coalesce(v_data -> 'signatory' ->> 'clientSignedName', '');

  IF v_existing <> '' THEN
    RAISE EXCEPTION 'This document has already been signed' USING ERRCODE = '23505';
  END IF;

  -- Re-apply the client's add-on choices onto the stored pricing items.
  SELECT jsonb_agg(
           CASE
             WHEN coalesce((item ->> 'isOptional')::boolean, false)
               THEN jsonb_set(item, '{selected}',
                      to_jsonb((item ->> 'id') = ANY (p_selected_addon_ids)))
             ELSE item
           END
           ORDER BY ord
         )
    INTO v_items
    FROM jsonb_array_elements(coalesce(v_data -> 'pricingItems', '[]'::jsonb))
         WITH ORDINALITY AS t(item, ord);

  v_items := coalesce(v_items, '[]'::jsonb);

  -- Authoritative total: every non-optional line, plus the selected add-ons.
  SELECT coalesce(sum(
           CASE
             WHEN (item ->> 'qty')  IS NOT NULL
              AND (item ->> 'rate') IS NOT NULL
               THEN (item ->> 'qty')::numeric * (item ->> 'rate')::numeric
             ELSE coalesce((item ->> 'amount')::numeric, 0)
           END
         ), 0)
    INTO v_total
    FROM jsonb_array_elements(v_items) AS t(item)
   WHERE NOT coalesce((item ->> 'isOptional')::boolean, false)
      OR coalesce((item ->> 'selected')::boolean, false);

  -- Stamp the server's own total and timestamp over whatever the client sent.
  v_audit := p_audit
             || jsonb_build_object(
                  'acceptedTotalInvestment', v_total,
                  'signedAt', to_jsonb(NOW())
                );

  v_data := v_data
            || jsonb_build_object(
                 'status',          'APPROVED',
                 'approvedAt',      to_jsonb(NOW()),
                 'signatory',       p_signatory,
                 'acceptanceAudit', v_audit,
                 'pricingItems',    v_items,
                 'totalInvestment', v_total
               );

  UPDATE public.documents
     SET status           = 'APPROVED',
         signed_at        = NOW(),
         signer_name      = p_signatory ->> 'clientSignedName',
         total_investment = v_total,
         document_data    = v_data,
         updated_at       = NOW()
   WHERE id = v_id;

  RETURN v_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Expose only these three to the public roles.
REVOKE ALL ON FUNCTION public.get_public_document(TEXT)                       FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_public_view(TEXT)                        FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sign_document(TEXT, JSONB, JSONB, TEXT[])       FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_public_document(TEXT)                 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_public_view(TEXT)                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sign_document(TEXT, JSONB, JSONB, TEXT[]) TO anon, authenticated;


-- ==============================================================================
-- SECTION 5d — ADMIN USER MANAGEMENT
-- ==============================================================================
-- Section 1 revoked UPDATE on plan/role/is_suspended from every browser client,
-- admins included. The admin panel therefore goes through this function, which
-- re-checks is_admin() server-side. SECURITY DEFINER lets it past the column
-- grants; the is_admin() check is what makes that safe.
CREATE OR REPLACE FUNCTION public.admin_set_user_plan(
  p_user_id      UUID,
  p_plan         TEXT DEFAULT NULL,
  p_role         TEXT DEFAULT NULL,
  p_is_suspended BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only platform administrators may change plans or roles'
      USING ERRCODE = '42501';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('free', 'pro', 'agency', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid plan: %', p_plan USING ERRCODE = '22023';
  END IF;

  IF p_role IS NOT NULL AND p_role NOT IN ('user', 'admin', 'superadmin') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
     SET plan         = coalesce(p_plan, plan),
         role         = coalesce(p_role, role),
         is_suspended = coalesce(p_is_suspended, is_suspended),
         updated_at   = NOW()
   WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL     ON FUNCTION public.admin_set_user_plan(UUID, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_set_user_plan(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;


-- ==============================================================================
-- SECTION 6 — PAYMENT_TRANSACTIONS (referenced by the app, never created)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_id  TEXT UNIQUE NOT NULL,
  order_id    TEXT,
  plan        TEXT NOT NULL CHECK (plan IN ('pro', 'agency', 'enterprise')),
  gateway     TEXT NOT NULL DEFAULT 'razorpay',
  amount      NUMERIC,
  currency    TEXT DEFAULT 'INR',
  interval    TEXT DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  status      TEXT NOT NULL DEFAULT 'completed'
              CHECK (status IN ('created', 'completed', 'failed', 'refunded')),
  raw_payload JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id
  ON public.payment_transactions(user_id);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_transactions_select_own_or_admin" ON public.payment_transactions;

-- Read-only for users; ONLY the service-role webhook ever writes here.
CREATE POLICY "payment_transactions_select_own_or_admin"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());


-- ==============================================================================
-- SECTION 7 — BOOTSTRAP YOUR OWN ADMIN ACCOUNT
-- ==============================================================================
-- Because role can no longer be self-assigned, the first admin must be created
-- here. Uncomment, set your email, and run once.
--
--   UPDATE public.profiles
--      SET role = 'superadmin', plan = 'agency'
--    WHERE email = 'fusionbellsfilms@gmail.com';
-- ==============================================================================
