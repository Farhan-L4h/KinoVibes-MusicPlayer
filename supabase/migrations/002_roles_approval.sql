-- KinoVibe Phase G: account approval + roles (user / admin / superadmin).
-- Idempotent; safe to re-run. Run AFTER 001_security_hardening.sql.
-- New signups start 'pending' and cannot use the app until an admin approves.
-- muhanmedan06@gmail.com is seeded as superadmin (ban / delete / limit / roles).
BEGIN;

-- ============================================
-- 1. COLUMNS
-- ============================================
DO $do$
DECLARE first_run BOOLEAN;
BEGIN
  -- Grandfathering must happen exactly once: on re-run, pending signups
  -- created after the first apply must NOT be auto-approved.
  SELECT NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status'
  ) INTO first_run;

  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_limited BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approved_by UUID;

  BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'superadmin'));
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_status_check CHECK (status IN ('pending', 'approved', 'rejected'));
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  IF first_run THEN
    -- Grandfather everyone who already had an account when this migration runs.
    UPDATE public.users SET status = 'approved', approved_at = COALESCE(approved_at, NOW())
    WHERE status = 'pending';

    -- Backfill profile rows for accounts created before the signup trigger existed
    -- (e.g. legacy Google OAuth users). They are grandfathered as approved.
    INSERT INTO public.users (id, email, display_name, status, approved_at)
    SELECT au.id, au.email,
      COALESCE(au.raw_user_meta_data->>'display_name', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
      'approved', NOW()
    FROM auth.users au LEFT JOIN public.users u ON u.id = au.id
    WHERE u.id IS NULL;
  END IF;
END $do$;

-- ============================================
-- 2. ROLE HELPERS (SECURITY DEFINER: read users without RLS recursion)
-- ============================================
CREATE OR REPLACE FUNCTION public.kv_current_role() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT role FROM public.users WHERE id = auth.uid()), 'user');
$$;

CREATE OR REPLACE FUNCTION public.kv_is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.kv_current_role() IN ('admin', 'superadmin');
$$;

CREATE OR REPLACE FUNCTION public.kv_is_superadmin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.kv_current_role() = 'superadmin';
$$;

CREATE OR REPLACE FUNCTION public.kv_is_active() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND status = 'approved' AND NOT is_banned
  );
$$;

CREATE OR REPLACE FUNCTION public.kv_can_upload() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.kv_is_admin() AND public.kv_is_active();
$$;

CREATE OR REPLACE FUNCTION public.kv_can_create_playlist() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.kv_is_active()
    AND NOT COALESCE((SELECT is_limited FROM public.users WHERE id = auth.uid()), false);
$$;

-- ============================================
-- 3. PROFILE ROW ON SIGNUP (email + OAuth alike)
-- ============================================
CREATE OR REPLACE FUNCTION public.kv_handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_root BOOLEAN := lower(NEW.email) = lower('muhanmedan06@gmail.com');
BEGIN
  INSERT INTO public.users (id, email, display_name, full_name, role, status, approved_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN is_root THEN 'superadmin' ELSE 'user' END,
    CASE WHEN is_root THEN 'approved' ELSE 'pending' END,
    CASE WHEN is_root THEN NOW() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS kv_on_auth_user_created ON auth.users;
CREATE TRIGGER kv_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.kv_handle_new_user();

-- Seed the superadmin even if the account already exists in auth.users.
INSERT INTO public.users (id, email, display_name, role, status, approved_at)
SELECT id, email, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), 'superadmin', 'approved', NOW()
FROM auth.users WHERE lower(email) = lower('muhanmedan06@gmail.com')
ON CONFLICT (id) DO UPDATE SET role = 'superadmin', status = 'approved', approved_at = NOW();

-- ============================================
-- 4. PRIVILEGE-ESCALATION GUARD
-- Clients may edit their own display name, never role/status/ban/limit fields.
-- Admin RPCs below run as definer and target OTHER rows, so they pass through.
-- ============================================
CREATE OR REPLACE FUNCTION public.kv_protect_user_fields() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id THEN
      NEW.role := 'user';
      NEW.status := 'pending';
      NEW.is_banned := false;
      NEW.is_limited := false;
      NEW.approved_at := NULL;
      NEW.approved_by := NULL;
    END IF;
    RETURN NEW;
  END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.id THEN
    IF NEW.role IS DISTINCT FROM OLD.role
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.is_banned IS DISTINCT FROM OLD.is_banned
      OR NEW.is_limited IS DISTINCT FROM OLD.is_limited
      OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
      OR NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
      RAISE EXCEPTION 'Role dan status akun hanya bisa diubah admin.';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS kv_protect_user_fields ON public.users;
CREATE TRIGGER kv_protect_user_fields
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.kv_protect_user_fields();

-- ============================================
-- 5. USERS RLS: read self (or any row for admins), write self only
-- ============================================
DROP POLICY IF EXISTS "KinoVibe profile owner guard" ON public.users;
DROP POLICY IF EXISTS "KinoVibe owner profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "KinoVibe profile read guard" ON public.users;
DROP POLICY IF EXISTS "KinoVibe profile insert guard" ON public.users;
DROP POLICY IF EXISTS "KinoVibe profile update guard" ON public.users;
DROP POLICY IF EXISTS "KinoVibe profile delete guard" ON public.users;
DROP POLICY IF EXISTS "KinoVibe read own profile" ON public.users;
DROP POLICY IF EXISTS "KinoVibe admin read profiles" ON public.users;
DROP POLICY IF EXISTS "KinoVibe insert own profile" ON public.users;
DROP POLICY IF EXISTS "KinoVibe update own profile" ON public.users;

CREATE POLICY "KinoVibe profile read guard" ON public.users AS RESTRICTIVE FOR SELECT TO public
  USING (auth.uid() = users.id OR public.kv_is_admin());
CREATE POLICY "KinoVibe profile insert guard" ON public.users AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (auth.uid() = users.id);
CREATE POLICY "KinoVibe profile update guard" ON public.users AS RESTRICTIVE FOR UPDATE TO public
  USING (auth.uid() = users.id) WITH CHECK (auth.uid() = users.id);
CREATE POLICY "KinoVibe profile delete guard" ON public.users AS RESTRICTIVE FOR DELETE TO public
  USING (auth.uid() = users.id);

CREATE POLICY "KinoVibe read own profile" ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = users.id);
CREATE POLICY "KinoVibe admin read profiles" ON public.users FOR SELECT TO authenticated
  USING (public.kv_is_admin());
CREATE POLICY "KinoVibe insert own profile" ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = users.id);
CREATE POLICY "KinoVibe update own profile" ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = users.id) WITH CHECK (auth.uid() = users.id);

-- ============================================
-- 6. ADMIN RPCs (definer; role checks inside; never callable by anon)
-- Hierarchy: admin manages users; superadmin manages admins too.
-- Nobody touches a superadmin row or their own row through these RPCs.
-- ============================================
CREATE OR REPLACE FUNCTION public.kv_admin_target_check(target uuid) RETURNS public.users
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE row public.users; caller_role TEXT;
BEGIN
  caller_role := public.kv_current_role();
  IF caller_role NOT IN ('admin', 'superadmin') THEN RAISE EXCEPTION 'Akses ditolak.'; END IF;
  IF target = auth.uid() THEN RAISE EXCEPTION 'Tidak bisa mengubah akun sendiri.'; END IF;
  SELECT * INTO row FROM public.users WHERE id = target;
  IF NOT FOUND THEN RAISE EXCEPTION 'Akun tidak ditemukan.'; END IF;
  IF row.role = 'superadmin' THEN RAISE EXCEPTION 'Akun superadmin tidak bisa diubah.'; END IF;
  IF row.role = 'admin' AND caller_role <> 'superadmin' THEN
    RAISE EXCEPTION 'Hanya superadmin yang bisa mengubah sesama admin.';
  END IF;
  RETURN row;
END $$;

CREATE OR REPLACE FUNCTION public.kv_admin_list_users()
RETURNS TABLE(id uuid, email text, display_name text, role text, status text, is_banned boolean, is_limited boolean, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.kv_is_admin() THEN RAISE EXCEPTION 'Akses ditolak.'; END IF;
  RETURN QUERY
    SELECT u.id, u.email, u.display_name, u.role, u.status, u.is_banned, u.is_limited, u.created_at
    FROM public.users u ORDER BY u.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.kv_admin_set_status(target uuid, new_status text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.kv_admin_target_check(target);
  IF new_status NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Status tidak valid.'; END IF;
  UPDATE public.users
  SET status = new_status,
      approved_at = CASE WHEN new_status = 'approved' THEN NOW() ELSE NULL END,
      approved_by = auth.uid(),
      updated_at = NOW()
  WHERE id = target;
END $$;

CREATE OR REPLACE FUNCTION public.kv_admin_set_banned(target uuid, banned boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.kv_admin_target_check(target);
  UPDATE public.users SET is_banned = banned, updated_at = NOW() WHERE id = target;
END $$;

CREATE OR REPLACE FUNCTION public.kv_admin_set_limited(target uuid, limited boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.kv_admin_target_check(target);
  UPDATE public.users SET is_limited = limited, updated_at = NOW() WHERE id = target;
END $$;

CREATE OR REPLACE FUNCTION public.kv_admin_set_role(target uuid, new_role text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.kv_is_superadmin() THEN RAISE EXCEPTION 'Hanya superadmin yang bisa mengubah role.'; END IF;
  PERFORM public.kv_admin_target_check(target);
  IF new_role NOT IN ('user', 'admin') THEN RAISE EXCEPTION 'Role tidak valid.'; END IF;
  UPDATE public.users SET role = new_role, updated_at = NOW() WHERE id = target;
END $$;

-- Hard delete: removes the auth account (cascades profiles, music rows,
-- playlists, favorites) and the storage object metadata. Storage blobs are
-- orphaned server-side; Supabase support can purge them if ever needed.
CREATE OR REPLACE FUNCTION public.kv_admin_delete_user(target uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.kv_is_superadmin() THEN RAISE EXCEPTION 'Hanya superadmin yang bisa menghapus akun.'; END IF;
  PERFORM public.kv_admin_target_check(target);
  DELETE FROM storage.objects
  WHERE bucket_id IN ('music', 'album-art', 'lyrics')
    AND (storage.foldername(name))[1] = target::text;
  DELETE FROM auth.users WHERE id = target;
END $$;

REVOKE ALL ON FUNCTION public.kv_admin_target_check(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kv_admin_list_users() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kv_admin_set_status(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kv_admin_set_banned(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kv_admin_set_limited(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kv_admin_set_role(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kv_admin_delete_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kv_admin_target_check(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kv_admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.kv_admin_set_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kv_admin_set_banned(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kv_admin_set_limited(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kv_admin_set_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kv_admin_delete_user(uuid) TO authenticated;

-- ============================================
-- 7. APPROVAL / BAN WRITE GATES (server-side, not just UI)
-- Pending, rejected, or banned accounts cannot mutate data even with a valid
-- session. Uploads (source not youtube/spotify) additionally require admin.
-- ============================================
DROP POLICY IF EXISTS "KinoVibe music insert gate" ON public.music_library;
CREATE POLICY "KinoVibe music insert gate" ON public.music_library AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (
    public.kv_is_active()
    AND (music_library.source IN ('youtube', 'spotify') OR public.kv_is_admin())
  );
DROP POLICY IF EXISTS "KinoVibe music update gate" ON public.music_library;
CREATE POLICY "KinoVibe music update gate" ON public.music_library AS RESTRICTIVE FOR UPDATE TO public
  USING (public.kv_is_active()) WITH CHECK (public.kv_is_active());
DROP POLICY IF EXISTS "KinoVibe music delete gate" ON public.music_library;
CREATE POLICY "KinoVibe music delete gate" ON public.music_library AS RESTRICTIVE FOR DELETE TO public
  USING (public.kv_is_active());

DROP POLICY IF EXISTS "KinoVibe favorite insert gate" ON public.favorites;
CREATE POLICY "KinoVibe favorite insert gate" ON public.favorites AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (public.kv_is_active());
DROP POLICY IF EXISTS "KinoVibe favorite delete gate" ON public.favorites;
CREATE POLICY "KinoVibe favorite delete gate" ON public.favorites AS RESTRICTIVE FOR DELETE TO public
  USING (public.kv_is_active());

DROP POLICY IF EXISTS "KinoVibe playlist insert gate" ON public.playlists;
DROP POLICY IF EXISTS "KinoVibe playlist create gate" ON public.playlists;
CREATE POLICY "KinoVibe playlist create gate" ON public.playlists AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (public.kv_can_create_playlist());
DROP POLICY IF EXISTS "KinoVibe playlist update gate" ON public.playlists;
DROP POLICY IF EXISTS "KinoVibe playlist mutate gate" ON public.playlists;
CREATE POLICY "KinoVibe playlist mutate gate" ON public.playlists AS RESTRICTIVE FOR UPDATE TO public
  USING (public.kv_is_active()) WITH CHECK (public.kv_is_active());
DROP POLICY IF EXISTS "KinoVibe playlist delete gate" ON public.playlists;
DROP POLICY IF EXISTS "KinoVibe playlist remove gate" ON public.playlists;
CREATE POLICY "KinoVibe playlist remove gate" ON public.playlists AS RESTRICTIVE FOR DELETE TO public
  USING (public.kv_is_active());

DROP POLICY IF EXISTS "KinoVibe playlist track gate" ON public.playlist_tracks;
CREATE POLICY "KinoVibe playlist track gate" ON public.playlist_tracks AS RESTRICTIVE FOR ALL TO public
  USING (public.kv_is_active()) WITH CHECK (public.kv_is_active());

-- ============================================
-- 8. STORAGE: audio uploads admin-only; writes need an active account
-- ============================================
DROP POLICY IF EXISTS "KinoVibe file insert guard" ON storage.objects;
CREATE POLICY "KinoVibe file insert guard" ON storage.objects AS RESTRICTIVE FOR INSERT TO public
  WITH CHECK (
    bucket_id NOT IN ('music', 'album-art', 'lyrics')
    OR (
      (storage.foldername(name))[1] = auth.uid()::text
      AND public.kv_is_active()
      AND (bucket_id <> 'music' OR public.kv_is_admin())
    )
  );
DROP POLICY IF EXISTS "Owner write own folder" ON storage.objects;
CREATE POLICY "Owner write own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('music', 'album-art', 'lyrics')
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.kv_is_active()
    AND (bucket_id <> 'music' OR public.kv_is_admin())
  );

DROP POLICY IF EXISTS "KinoVibe file update guard" ON storage.objects;
CREATE POLICY "KinoVibe file update guard" ON storage.objects AS RESTRICTIVE FOR UPDATE TO public
  USING (
    bucket_id NOT IN ('music', 'album-art', 'lyrics')
    OR ((storage.foldername(name))[1] = auth.uid()::text AND public.kv_is_active())
  )
  WITH CHECK (
    bucket_id NOT IN ('music', 'album-art', 'lyrics')
    OR ((storage.foldername(name))[1] = auth.uid()::text AND public.kv_is_active())
  );
DROP POLICY IF EXISTS "KinoVibe file delete guard" ON storage.objects;
CREATE POLICY "KinoVibe file delete guard" ON storage.objects AS RESTRICTIVE FOR DELETE TO public
  USING (
    bucket_id NOT IN ('music', 'album-art', 'lyrics')
    OR ((storage.foldername(name))[1] = auth.uid()::text AND public.kv_is_active())
  );

COMMIT;