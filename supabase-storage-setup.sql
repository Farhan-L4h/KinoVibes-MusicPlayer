-- ============================================
-- SUPABASE STORAGE POLICIES SETUP
-- KinoVibes Music Player
-- ============================================

-- Run these queries in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query

-- ============================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================
-- Note: Buckets usually created via UI, but here's the SQL version

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('music', 'music', true),
  ('album-art', 'album-art', true),
  ('lyrics', 'lyrics', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STORAGE POLICIES - MUSIC BUCKET
-- ============================================

-- Policy 1: Allow PUBLIC read access for music files
CREATE POLICY "Public Access - Music"
ON storage.objects FOR SELECT
USING (bucket_id = 'music');

-- Policy 2: Allow AUTHENTICATED users to upload music
CREATE POLICY "Authenticated Upload - Music"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to UPDATE their own music files
CREATE POLICY "User Update Own - Music"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'music'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'music'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to DELETE their own music files
CREATE POLICY "User Delete Own - Music"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'music'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 3. STORAGE POLICIES - ALBUM-ART BUCKET
-- ============================================

-- Policy 1: Allow PUBLIC read access for album art
CREATE POLICY "Public Access - Album Art"
ON storage.objects FOR SELECT
USING (bucket_id = 'album-art');

-- Policy 2: Allow AUTHENTICATED users to upload album art
CREATE POLICY "Authenticated Upload - Album Art"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'album-art'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to UPDATE their own album art
CREATE POLICY "User Update Own - Album Art"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'album-art'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'album-art'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to DELETE their own album art
CREATE POLICY "User Delete Own - Album Art"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'album-art'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 4. STORAGE POLICIES - LYRICS BUCKET
-- ============================================

-- Policy 1: Allow PUBLIC read access for lyrics
CREATE POLICY "Public Access - Lyrics"
ON storage.objects FOR SELECT
USING (bucket_id = 'lyrics');

-- Policy 2: Allow AUTHENTICATED users to upload lyrics
CREATE POLICY "Authenticated Upload - Lyrics"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lyrics'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to UPDATE their own lyrics
CREATE POLICY "User Update Own - Lyrics"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lyrics'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'lyrics'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to DELETE their own lyrics
CREATE POLICY "User Delete Own - Lyrics"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lyrics'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 5. VERIFY POLICIES
-- ============================================

-- Check all storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- Check all buckets
SELECT * FROM storage.buckets;

-- ============================================
-- 6. OPTIONAL: DROP ALL POLICIES (if need reset)
-- ============================================

-- Uncomment to use:

-- DROP POLICY IF EXISTS "Public Access - Music" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated Upload - Music" ON storage.objects;
-- DROP POLICY IF EXISTS "User Update Own - Music" ON storage.objects;
-- DROP POLICY IF EXISTS "User Delete Own - Music" ON storage.objects;

-- DROP POLICY IF EXISTS "Public Access - Album Art" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated Upload - Album Art" ON storage.objects;
-- DROP POLICY IF EXISTS "User Update Own - Album Art" ON storage.objects;
-- DROP POLICY IF EXISTS "User Delete Own - Album Art" ON storage.objects;

-- DROP POLICY IF EXISTS "Public Access - Lyrics" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated Upload - Lyrics" ON storage.objects;
-- DROP POLICY IF EXISTS "User Update Own - Lyrics" ON storage.objects;
-- DROP POLICY IF EXISTS "User Delete Own - Lyrics" ON storage.objects;

-- ============================================
-- 7. SIMPLIFIED VERSION (if above doesn't work)
-- ============================================

-- If you want SIMPLE setup (less secure but easier):
-- Just make buckets public and allow all operations

-- Drop all existing policies first
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Allow all SELECT (read) operations
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
USING (true);

-- Allow all INSERT for authenticated users
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all UPDATE for authenticated users
CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow all DELETE for authenticated users
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- DONE! 
-- ============================================

-- Test your setup:
-- 1. Try uploading a file via your app
-- 2. Check if file appears in Supabase Storage
-- 3. Try accessing file URL in browser
-- 4. Try deleting file via your app

-- If issues, check:
-- SELECT * FROM storage.objects;  -- See all files
-- SELECT * FROM storage.buckets;  -- Check bucket settings
