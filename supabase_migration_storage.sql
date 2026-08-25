-- ==============================================================================
-- INVOIX — ASSET STORAGE MIGRATION
-- ==============================================================================
-- Run ONCE in the Supabase SQL Editor. Idempotent: re-running is safe.
--
-- WHY
--   Every vault document currently embeds base64 for the logo, watermark and
--   both signatures. Base64 adds ~33% on top, so a document runs 150-300 KB
--   against a ~5 MB localStorage cap — roughly 20-30 documents before storage is
--   full. "Unlimited Documents" is a Pro promise localStorage cannot keep.
--
--   It also means every autosave ships those blobs to Supabase again, every
--   1.2s of editing.
--
--   After this, images are uploaded once and documents carry a short URL.
-- ==============================================================================


-- ==============================================================================
-- SECTION 1 — THE BUCKET
-- ==============================================================================
-- Public read is deliberate: these images render on the public client portal for
-- anonymous visitors, so <img src> must work without auth. Paths carry a random
-- UUID, so a URL is not guessable — the same model as the document share token.
--
-- 2 MB ceiling and an image-only MIME allowlist are enforced by storage itself,
-- so a client-side bypass cannot upload a 50 MB file or a script.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoix-assets',
  'invoix-assets',
  TRUE,
  2097152, -- 2 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ==============================================================================
-- SECTION 2 — ACCESS POLICIES
-- ==============================================================================
-- Layout: {user_id}/{kind}/{uuid}.{ext}
-- The first path segment is the owner's uid, which is what every write policy
-- below checks. A user can therefore only ever write inside their own folder.

DROP POLICY IF EXISTS "invoix_assets_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "invoix_assets_owner_insert"  ON storage.objects;
DROP POLICY IF EXISTS "invoix_assets_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "invoix_assets_owner_delete"  ON storage.objects;

-- Anyone may read: client proposal links are opened by people with no account.
CREATE POLICY "invoix_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoix-assets');

-- Writes are restricted to the signed-in owner's own folder.
CREATE POLICY "invoix_assets_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoix-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "invoix_assets_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'invoix-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'invoix-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "invoix_assets_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'invoix-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ==============================================================================
-- SECTION 3 — VERIFY
-- ==============================================================================
--   SELECT id, public, file_size_limit, allowed_mime_types
--     FROM storage.buckets WHERE id = 'invoix-assets';
--
--   SELECT policyname, cmd FROM pg_policies
--    WHERE schemaname = 'storage' AND tablename = 'objects'
--      AND policyname LIKE 'invoix_assets%';
--   -- expect 4 rows: SELECT, INSERT, UPDATE, DELETE
-- ==============================================================================
