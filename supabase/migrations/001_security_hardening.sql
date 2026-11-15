-- KinoVibe security hardening. Idempotent; no application data is deleted.
-- Targets supabase-full-schema.sql and the current API: UUID owners, users.id
-- (not the older RLS script's users.uid). Schema mismatches abort the transaction.
BEGIN;

ALTER TABLE public.music_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view music" ON public.music_library;
DROP POLICY IF EXISTS "Public can read music" ON public.music_library;
DROP POLICY IF EXISTS "Anyone can view albums" ON public.albums;

-- Permissive policies OR together. Restrictive guards also constrain any remaining
-- legacy grants. FOR ALL covers CRUD; USING checks old rows, WITH CHECK new rows.
DROP POLICY IF EXISTS "KinoVibe album owner guard" ON public.albums;
CREATE POLICY "KinoVibe album owner guard"
  ON public.albums AS RESTRICTIVE FOR ALL TO public
  USING (auth.uid() = albums.user_id)
  WITH CHECK (auth.uid() = albums.user_id);

DROP POLICY IF EXISTS "KinoVibe owner albums" ON public.albums;
CREATE POLICY "KinoVibe owner albums"
  ON public.albums FOR ALL TO authenticated
  USING (auth.uid() = albums.user_id)
  WITH CHECK (auth.uid() = albums.user_id);

DROP POLICY IF EXISTS "KinoVibe music owner guard" ON public.music_library;
CREATE POLICY "KinoVibe music owner guard"
  ON public.music_library AS RESTRICTIVE FOR ALL TO public
  USING (auth.uid() = music_library.user_id)
  WITH CHECK (
    auth.uid() = music_library.user_id
    AND (
      music_library.album_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.albums AS a
        WHERE a.id = music_library.album_id
          AND a.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "KinoVibe owner music" ON public.music_library;
CREATE POLICY "KinoVibe owner music"
  ON public.music_library FOR ALL TO authenticated
  USING (auth.uid() = music_library.user_id)
  WITH CHECK (auth.uid() = music_library.user_id);

DROP POLICY IF EXISTS "KinoVibe profile owner guard" ON public.users;
CREATE POLICY "KinoVibe profile owner guard"
  ON public.users AS RESTRICTIVE FOR ALL TO public
  USING (auth.uid() = users.id)
  WITH CHECK (auth.uid() = users.id);

DROP POLICY IF EXISTS "KinoVibe owner profiles" ON public.users;
CREATE POLICY "KinoVibe owner profiles"
  ON public.users FOR ALL TO authenticated
  USING (auth.uid() = users.id)
  WITH CHECK (auth.uid() = users.id);

DROP POLICY IF EXISTS "KinoVibe favorite owner guard" ON public.favorites;
CREATE POLICY "KinoVibe favorite owner guard"
  ON public.favorites AS RESTRICTIVE FOR ALL TO public
  USING (
    auth.uid() = favorites.user_id
    AND EXISTS (
      SELECT 1 FROM public.music_library AS m
      WHERE m.id = favorites.music_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = favorites.user_id
    AND EXISTS (
      SELECT 1 FROM public.music_library AS m
      WHERE m.id = favorites.music_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "KinoVibe owner favorites" ON public.favorites;
CREATE POLICY "KinoVibe owner favorites"
  ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = favorites.user_id)
  WITH CHECK (auth.uid() = favorites.user_id);

-- getPublicPlaylists exposes playlist metadata, not private track records or IDs.
DROP POLICY IF EXISTS "KinoVibe playlist read guard" ON public.playlists;
CREATE POLICY "KinoVibe playlist read guard"
  ON public.playlists AS RESTRICTIVE FOR SELECT TO public
  USING (auth.uid() = playlists.user_id OR playlists.is_public IS TRUE);

DROP POLICY IF EXISTS "KinoVibe playlist insert guard" ON public.playlists;
CREATE POLICY "KinoVibe playlist insert guard"
  ON public.playlists AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (auth.uid() = playlists.user_id);

DROP POLICY IF EXISTS "KinoVibe playlist update guard" ON public.playlists;
CREATE POLICY "KinoVibe playlist update guard"
  ON public.playlists AS RESTRICTIVE FOR UPDATE TO public
  USING (auth.uid() = playlists.user_id)
  WITH CHECK (auth.uid() = playlists.user_id);

DROP POLICY IF EXISTS "KinoVibe playlist delete guard" ON public.playlists;
CREATE POLICY "KinoVibe playlist delete guard"
  ON public.playlists AS RESTRICTIVE FOR DELETE TO public
  USING (auth.uid() = playlists.user_id);

DROP POLICY IF EXISTS "KinoVibe readable playlists" ON public.playlists;
CREATE POLICY "KinoVibe readable playlists"
  ON public.playlists FOR SELECT TO public
  USING (auth.uid() = playlists.user_id OR playlists.is_public IS TRUE);

DROP POLICY IF EXISTS "KinoVibe owner playlists" ON public.playlists;
CREATE POLICY "KinoVibe owner playlists"
  ON public.playlists FOR ALL TO authenticated
  USING (auth.uid() = playlists.user_id)
  WITH CHECK (auth.uid() = playlists.user_id);

-- Both the parent playlist and referenced track must belong to the caller.
-- Qualified outer columns prevent accidentally uncorrelated EXISTS checks.
DROP POLICY IF EXISTS "KinoVibe playlist track owner guard" ON public.playlist_tracks;
CREATE POLICY "KinoVibe playlist track owner guard"
  ON public.playlist_tracks AS RESTRICTIVE FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists AS p
      WHERE p.id = playlist_tracks.playlist_id AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.music_library AS m
      WHERE m.id = playlist_tracks.music_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists AS p
      WHERE p.id = playlist_tracks.playlist_id AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.music_library AS m
      WHERE m.id = playlist_tracks.music_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "KinoVibe owner playlist tracks" ON public.playlist_tracks;
CREATE POLICY "KinoVibe owner playlist tracks"
  ON public.playlist_tracks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists AS p
      WHERE p.id = playlist_tracks.playlist_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists AS p
      WHERE p.id = playlist_tracks.playlist_id AND p.user_id = auth.uid()
    )
  );

-- Public object URLs bypass SELECT policies; audio and lyrics must be private.
-- Leave album-art's intentional public setting and all other buckets unchanged.
UPDATE storage.buckets SET public = false WHERE id IN ('music', 'lyrics');

-- Drop only named unsafe policies from the legacy setup scripts, not all storage
-- policies. Existing bucket-scoped owner policies and public cover reads can stay.
-- Before applying, check whether unrelated buckets rely on these blanket grants.
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - Music" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - Lyrics" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

-- Guards apply to PUBLIC, so an unknown permissive policy cannot reopen these
-- buckets for anon or authenticated users. Other bucket IDs pass through unchanged.
DROP POLICY IF EXISTS "KinoVibe private file read guard" ON storage.objects;
CREATE POLICY "KinoVibe private file read guard"
  ON storage.objects AS RESTRICTIVE FOR SELECT TO public
  USING (
    bucket_id NOT IN ('music', 'lyrics')
    OR (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "KinoVibe file insert guard" ON storage.objects;
CREATE POLICY "KinoVibe file insert guard"
  ON storage.objects AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (
    bucket_id NOT IN ('music', 'album-art', 'lyrics')
    OR (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "KinoVibe file update guard" ON storage.objects;
CREATE POLICY "KinoVibe file update guard"
  ON storage.objects AS RESTRICTIVE FOR UPDATE TO public
  USING (
    bucket_id NOT IN ('music', 'album-art', 'lyrics')
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id NOT IN ('music', 'album-art', 'lyrics')
    OR (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "KinoVibe file delete guard" ON storage.objects;
CREATE POLICY "KinoVibe file delete guard"
  ON storage.objects AS RESTRICTIVE FOR DELETE TO public
  USING (
    bucket_id NOT IN ('music', 'album-art', 'lyrics')
    OR (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Public read album art" ON storage.objects;
CREATE POLICY "Public read album art"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'album-art');

DROP POLICY IF EXISTS "Owner read private files" ON storage.objects;
CREATE POLICY "Owner read private files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('music', 'lyrics')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owner write own folder" ON storage.objects;
CREATE POLICY "Owner write own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('music', 'album-art', 'lyrics')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owner update own folder" ON storage.objects;
CREATE POLICY "Owner update own folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('music', 'album-art', 'lyrics')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('music', 'album-art', 'lyrics')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owner delete own folder" ON storage.objects;
CREATE POLICY "Owner delete own folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('music', 'album-art', 'lyrics')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMIT;
