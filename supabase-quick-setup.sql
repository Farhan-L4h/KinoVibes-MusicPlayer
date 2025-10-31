-- ============================================
-- QUICK SETUP - Supabase Storage
-- Simple & Easy Version
-- ============================================

-- Copy & paste ini ke Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run

-- ============================================
-- STEP 1: Enable Storage (if not enabled)
-- ============================================

-- Check if storage schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'storage';

-- ============================================
-- STEP 2: Create Buckets (if using SQL)
-- ============================================

-- Note: Lebih mudah buat via UI, tapi ini SQL version
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'music', 
    'music', 
    true, 
    52428800,  -- 50MB in bytes
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/flac']
  ),
  (
    'album-art', 
    'album-art', 
    true, 
    10485760,  -- 10MB in bytes
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'lyrics', 
    'lyrics', 
    true, 
    1048576,  -- 1MB in bytes
    ARRAY['text/plain', 'application/json', 'application/octet-stream']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STEP 3: Simple Policies (Recommended)
-- ============================================

-- Drop any existing policies first
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Policy 1: Anyone can READ/VIEW files (for playback)
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
USING (true);

-- Policy 2: Authenticated users can UPLOAD files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Authenticated users can UPDATE files
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (true);

-- Policy 4: Authenticated users can DELETE files
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- STEP 4: Verify Setup
-- ============================================

-- Check buckets
SELECT 
  id as bucket_name,
  name,
  public,
  file_size_limit / 1048576 as max_size_mb,
  allowed_mime_types
FROM storage.buckets
ORDER BY id;

-- Check policies
SELECT 
  policyname as policy,
  cmd as operation,
  CASE 
    WHEN roles = '{public}' THEN 'Public'
    WHEN roles = '{authenticated}' THEN 'Authenticated'
    ELSE roles::text
  END as who_can_use
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- ============================================
-- DONE! ✅
-- ============================================

-- Your storage is now ready!
-- Test by uploading a file via your app
