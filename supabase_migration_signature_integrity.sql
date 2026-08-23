-- ==============================================================================
-- INVOIX — SIGNATURE INTEGRITY FIX
-- ==============================================================================
-- Run this ONCE in the Supabase SQL Editor, after supabase_migration_hardening.sql.
-- It is idempotent: re-running it is safe.
--
-- THE BUG THIS FIXES
--   sign_document decided "already signed" from the documents.status COLUMN,
--   while the client portal decides it from the signature inside document_data.
--   Those two can drift apart — a row can carry status = 'APPROVED' with no
--   signature in document_data (the studio owner's autosave used to write the
--   whole row back, carrying a stale status forward). When they drift, the RPC
--   returns 409 "already signed" on a proposal the client sees as unsigned, and
--   the proposal becomes impossible to sign.
--
-- THE FIX
--   1. sign_document now reads the same truth the UI does: the signature itself.
--   2. A trigger makes it impossible for any ordinary UPDATE to erase a client's
--      signature, so the two can never drift again.
--   3. Existing drifted rows are reconciled.
-- ==============================================================================


-- ==============================================================================
-- SECTION 1 — sign_document: gate on the signature, not the status column
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sign_document(
  p_token              TEXT,
  p_signatory          JSONB,
  p_audit              JSONB,
  p_selected_addon_ids TEXT[] DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_id         TEXT;
  v_data       JSONB;
  v_existing   TEXT;
  v_items      JSONB;
  v_total      NUMERIC;
  v_audit      JSONB;
BEGIN
  SELECT id, document_data
    INTO v_id, v_data
    FROM public.documents
   WHERE share_token = p_token AND is_public = TRUE
   LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Document not found or link expired' USING ERRCODE = 'P0002';
  END IF;

  -- Authoritative "is this signed?" test: an actual client signature on file.
  -- This is exactly what PublicProposalPage checks, so the server and the page
  -- can never disagree about whether the signing form should be offered.
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

REVOKE ALL     ON FUNCTION public.sign_document(TEXT, JSONB, JSONB, TEXT[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.sign_document(TEXT, JSONB, JSONB, TEXT[]) TO anon, authenticated;


-- ==============================================================================
-- SECTION 2 — A signature can never be erased by an ordinary UPDATE
-- ==============================================================================
-- The studio owner's editor autosaves the whole document row every ~1.2s while
-- they type. If a client signs while the owner has that proposal open, the next
-- autosave would previously overwrite document_data and wipe the signature —
-- silent loss of a legally-binding acceptance record.
--
-- Rather than reject the owner's edit (which would break their editor with a
-- constant stream of errors), this preserves the signed fields and lets the rest
-- of their edit through.
CREATE OR REPLACE FUNCTION public.protect_signed_documents()
RETURNS TRIGGER AS $$
DECLARE
  v_old_sig TEXT;
  v_new_sig TEXT;
BEGIN
  v_old_sig := coalesce(OLD.document_data -> 'signatory' ->> 'clientSignedName', '');
  v_new_sig := coalesce(NEW.document_data -> 'signatory' ->> 'clientSignedName', '');

  IF v_old_sig <> '' AND v_new_sig = '' THEN
    NEW.document_data := NEW.document_data
      || jsonb_build_object(
           'signatory',       OLD.document_data -> 'signatory',
           'acceptanceAudit', OLD.document_data -> 'acceptanceAudit',
           'status',          'APPROVED',
           'approvedAt',      OLD.document_data -> 'approvedAt'
         );
    NEW.status      := 'APPROVED';
    NEW.signed_at   := OLD.signed_at;
    NEW.signer_name := OLD.signer_name;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_signed_documents ON public.documents;
CREATE TRIGGER trg_protect_signed_documents
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.protect_signed_documents();


-- ==============================================================================
-- SECTION 3 — Reconcile rows that already drifted
-- ==============================================================================
-- Any row flagged APPROVED with no signature on file is stuck: the client portal
-- shows the signing form, and the RPC refuses it. Put status back in step with
-- reality so those proposals can be signed.
--
-- Inspect first:
--   SELECT id, share_token, status, signer_name,
--          document_data -> 'signatory' ->> 'clientSignedName' AS signed_by
--     FROM public.documents
--    WHERE status = 'APPROVED'
--      AND coalesce(document_data -> 'signatory' ->> 'clientSignedName', '') = '';

UPDATE public.documents
   SET status      = 'SENT',
       signed_at   = NULL,
       signer_name = NULL
 WHERE status = 'APPROVED'
   AND coalesce(document_data -> 'signatory' ->> 'clientSignedName', '') = '';

-- Mirror of the above: a row carrying a real signature must read APPROVED.
UPDATE public.documents
   SET status = 'APPROVED'
 WHERE status <> 'APPROVED'
   AND coalesce(document_data -> 'signatory' ->> 'clientSignedName', '') <> '';
