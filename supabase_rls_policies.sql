-- KinoVibes Music Player - Supabase RLS Policies
-- Run this SQL in Supabase SQL Editor to setup Row Level Security

-- ==============================================
-- ENABLE RLS ON ALL TABLES
-- ==============================================

ALTER TABLE music_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- MUSIC_LIBRARY POLICIES
-- ==============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can read music" ON music_library;
DROP POLICY IF EXISTS "Users can insert own music" ON music_library;
DROP POLICY IF EXISTS "Users can update own music" ON music_library;
DROP POLICY IF EXISTS "Users can delete own music" ON music_library;

-- Allow everyone to read music (public library)
CREATE POLICY "Public can read music"
ON music_library FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert their own music
CREATE POLICY "Users can insert own music"
ON music_library FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Allow users to update their own music
CREATE POLICY "Users can update own music"
ON music_library FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id);

-- Allow users to delete their own music
CREATE POLICY "Users can delete own music"
ON music_library FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- ==============================================
-- PLAYLISTS POLICIES
-- ==============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can create playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON playlists;

-- Allow users to read their own playlists
CREATE POLICY "Users can read own playlists"
ON playlists FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Allow users to create playlists
CREATE POLICY "Users can create playlists"
ON playlists FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Allow users to update their own playlists
CREATE POLICY "Users can update own playlists"
ON playlists FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id);

-- Allow users to delete their own playlists
CREATE POLICY "Users can delete own playlists"
ON playlists FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- ==============================================
-- PLAYLIST_TRACKS POLICIES
-- ==============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read playlist tracks" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can add tracks" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can update tracks" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can remove tracks" ON playlist_tracks;

-- Allow users to read tracks in their playlists
CREATE POLICY "Users can read playlist tracks"
ON playlist_tracks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM playlists
    WHERE playlists.id = playlist_tracks.playlist_id
    AND playlists.user_id = auth.uid()::text
  )
);

-- Allow users to add tracks to their playlists
CREATE POLICY "Users can add tracks"
ON playlist_tracks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM playlists
    WHERE playlists.id = playlist_tracks.playlist_id
    AND playlists.user_id = auth.uid()::text
  )
);

-- Allow users to update tracks in their playlists
CREATE POLICY "Users can update tracks"
ON playlist_tracks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM playlists
    WHERE playlists.id = playlist_tracks.playlist_id
    AND playlists.user_id = auth.uid()::text
  )
);

-- Allow users to remove tracks from their playlists
CREATE POLICY "Users can remove tracks"
ON playlist_tracks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM playlists
    WHERE playlists.id = playlist_tracks.playlist_id
    AND playlists.user_id = auth.uid()::text
  )
);

-- ==============================================
-- FAVORITES POLICIES
-- ==============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;

-- Allow users to read their own favorites
CREATE POLICY "Users can read own favorites"
ON favorites FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Allow users to add favorites
CREATE POLICY "Users can add favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Allow users to remove favorites
CREATE POLICY "Users can remove favorites"
ON favorites FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- ==============================================
-- USERS TABLE POLICIES
-- ==============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid()::text = uid);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = uid);

-- ==============================================
-- STORAGE POLICIES
-- ==============================================

-- Note: Run these in Storage > Policies in Supabase Dashboard

-- MUSIC BUCKET
-- 1. Allow public read access
-- Policy name: "Public Read Access"
-- Allowed operation: SELECT
-- Policy definition:
-- bucket_id = 'music'

-- 2. Allow authenticated users to upload
-- Policy name: "Authenticated Upload"
-- Allowed operation: INSERT
-- Policy definition:
-- bucket_id = 'music' AND auth.role() = 'authenticated'

-- 3. Allow users to delete their own files
-- Policy name: "Users Delete Own"
-- Allowed operation: DELETE
-- Policy definition:
-- bucket_id = 'music' AND auth.uid()::text = (storage.foldername(name))[1]

-- ALBUM-ART BUCKET
-- Same policies as music bucket

-- LYRICS BUCKET
-- Same policies as music bucket

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('music_library', 'playlists', 'playlist_tracks', 'favorites', 'users');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==============================================
-- SUCCESS!
-- ==============================================
-- All RLS policies have been configured ✅
-- Your KinoVibes Music Player is now secure! 🔐
