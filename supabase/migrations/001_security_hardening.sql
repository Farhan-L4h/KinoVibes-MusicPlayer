-- KinoVibe security hardening
-- Run once in Supabase Dashboard → SQL Editor.
-- Safe to re-run (idempotent). Does not delete any data.

-- 1. Restrict library & album metadata to their owner
DROP POLICY IF EXISTS "Anyone can view music" ON public.music_library;
DROP POLICY IF EXISTS "Users can view own music" ON public.music_library;
CREATE POLICY "Users can view own music"
  ON public.music_library FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view albums" ON public.albums;
DROP POLICY IF EXISTS "Users can view own albums" ON public.albums;
CREATE POLICY "Users can view own albums"
  ON public.albums FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Make audio & lyrics buckets private (covers stay public)
UPDATE storage.buckets SET public = false WHERE id IN ('music', 'lyrics');

-- 3. Replace blanket storage policies with per-user folder policies
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read album art" ON storage.objects;
DROP POLICY IF EXISTS "Owner read private files" ON storage.objects;
DROP POLICY IF EXISTS "Owner write own folder" ON storage.objects;
DROP POLICY IF EXISTS "Owner update own folder" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete own folder" ON storage.objects;

CREATE POLICY "Public read album art"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'album-art');

CREATE POLICY "Owner read private files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('music', 'lyrics')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner write own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('music', 'album-art', 'lyrics')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner update own folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('music', 'album-art', 'lyrics')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner delete own folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('music', 'album-art', 'lyrics')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );