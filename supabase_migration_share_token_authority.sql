-- ==============================================================================
-- INVOIX — SHARE TOKEN AUTHORITY
-- ==============================================================================
-- Run ONCE in the Supabase SQL Editor. Idempotent.
--
-- THE BUG
--   Two independent generators mint share tokens: createShareToken() in the
--   browser, and this database (backfill + column default). Nothing made them
--   agree. saveDocument upserts the client's token over whatever the row holds,
--   so if a link was copied before a re-save — or an upsert failed after one —
--   the token in the link and the token in the row diverge permanently.
--
--   The link then 404s for everyone EXCEPT the owner, whose browser still
--   resolves it from localStorage. The owner sees a working link and sends a
--   dead one to their client.
--
-- THE FIX
--   The database owns the token. Once a row has one it can never be changed, so
--   every link ever issued for that document keeps working.
-- ==============================================================================


-- Every row must have a token, and it must never be NULL going forward.
UPDATE public.documents
   SET share_token = replace(gen_random_uuid()::text, '-', '')
 WHERE share_token IS NULL OR share_token = '';

ALTER TABLE public.documents
  ALTER COLUMN share_token SET DEFAULT replace(gen_random_uuid()::text, '-', '');


-- ==============================================================================
-- The token is immutable once assigned
-- ==============================================================================
-- The client keeps sending share_token in its upsert payload. Rather than break
-- those writes, silently keep the established value — same approach as
-- protect_signed_documents. The client reconciles by reading the row back.
CREATE OR REPLACE FUNCTION public.freeze_share_token()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.share_token IS NOT NULL AND OLD.share_token <> '' THEN
    -- An existing token always wins. Links already in a client's inbox
    -- must not be invalidated by a later save from the editor.
    NEW.share_token := OLD.share_token;
  ELSIF NEW.share_token IS NULL OR NEW.share_token = '' THEN
    NEW.share_token := replace(gen_random_uuid()::text, '-', '');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_freeze_share_token ON public.documents;
CREATE TRIGGER trg_freeze_share_token
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.freeze_share_token();


-- ==============================================================================
-- DIAGNOSTIC — documents whose links cannot resolve
-- ==============================================================================
--   SELECT id, share_token, is_public, status, updated_at
--     FROM public.documents
--    WHERE is_public IS NOT TRUE OR share_token IS NULL
--    ORDER BY updated_at DESC;
--
-- Anything listed has a share link that 404s for everyone but the owner.
-- ==============================================================================
