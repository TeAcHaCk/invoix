-- ==============================================================================
-- INVOIX — CLOSE THE DOCUMENT-ID ENUMERATION HOLE
-- ==============================================================================
-- Run ONCE in the Supabase SQL Editor. Idempotent.
--
-- THE LEAK
--   get_public_document() and sign_document() matched on
--       (share_token = p_token OR id = p_token)
--
--   That `OR id` fallback was added so older links built from a document id kept
--   working. But document ids are `doc_<millisecond timestamp>` — enumerable.
--   It therefore bypassed the unguessable share token entirely.
--
--   The practical attack is not brute force. Any client who legitimately holds
--   ONE proposal link knows a valid `doc_<ts>`. Documents created around the
--   same moment sit at neighbouring timestamps, so walking a few thousand values
--   returns OTHER tenants' proposals: client names, email addresses, contract
--   values and signature images. Every document is `is_public = TRUE`, so
--   nothing else stood in the way.
--
-- THE FIX
--   Match on share_token ONLY. A share token is 128 bits of randomness and
--   cannot be walked.
--
--   Cost: links issued from a document id stop resolving. On a product days old
--   that is a small number of links against a cross-tenant data leak, so the
--   trade is clearly worth taking. Re-copy any affected link from the editor.
-- ==============================================================================


-- ==============================================================================
-- SECTION 1 — get_public_document: share_token only
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_public_document(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_data JSONB;
BEGIN
  -- Deliberately NO `OR id = p_token`. See the header: ids are timestamps.
  SELECT document_data INTO v_data
    FROM public.documents
   WHERE share_token = p_token
     AND is_public = TRUE
   LIMIT 1;

  RETURN v_data; -- NULL when not found; the client renders "link expired"
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==============================================================================
-- SECTION 2 — record_public_view: share_token only
-- ==============================================================================
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


-- ==============================================================================
-- SECTION 3 — sign_document: share_token only
-- ==============================================================================
-- Signing by a guessed id would let an attacker bind a signature to someone
-- else's contract, which is worse than reading it.
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

  v_existing := coalesce(v_data -> 'signatory' ->> 'clientSignedName', '');
  IF v_existing <> '' THEN
    RAISE EXCEPTION 'This document has already been signed' USING ERRCODE = '23505';
  END IF;

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


-- ==============================================================================
-- SECTION 4 — REPAIR: documents sharing a share_token
-- ==============================================================================
-- The vault's "Duplicate" action copied a document without resetting its
-- shareToken, so copies could claim the original's public link. The unique index
-- rejected the second row (a 409 on every autosave), but any pair that predates
-- the index would make one client's link resolve to another client's document.
--
-- Inspect first:
--   SELECT share_token, count(*), array_agg(id)
--     FROM public.documents
--    GROUP BY share_token HAVING count(*) > 1;
--
-- Reissue a fresh token to every duplicate, keeping the oldest row's link intact.
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY share_token ORDER BY created_at NULLS LAST, id) AS rn
    FROM public.documents
   WHERE share_token IS NOT NULL
)
UPDATE public.documents d
   SET share_token = replace(gen_random_uuid()::text, '-', '')
  FROM ranked r
 WHERE d.id = r.id
   AND r.rn > 1;


-- ==============================================================================
-- SECTION 5 — VERIFY
-- ==============================================================================
--   -- must return 0 rows
--   SELECT share_token, count(*) FROM public.documents
--    GROUP BY share_token HAVING count(*) > 1;
--
--   -- must return NULL: an id is no longer a valid key
--   SELECT public.get_public_document('doc_1756000000000');
-- ==============================================================================
