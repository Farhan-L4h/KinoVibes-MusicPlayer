# 📊 Supabase SQL Setup Files

## 📁 Files

### 1. `supabase-quick-setup.sql` ⚡
**Quick & Easy Setup** - Recommended untuk kebanyakan kasus

- Simple policies (anyone read, authenticated write/delete)
- Auto-creates buckets dengan proper settings
- Verifikasi setup included
- **Use this jika:** Kamu mau setup cepat dan gak ribet

### 2. `supabase-storage-setup.sql` 🔒
**Advanced Setup** - Security-focused

- Detailed policies per bucket
- User-specific file permissions
- Users can only delete their own files
- More complex but more secure
- **Use this jika:** Kamu mau security maksimal

---

## 🚀 How to Use

### Method 1: Quick Setup (Recommended)

1. Go to Supabase Dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open file `supabase-quick-setup.sql`
5. Copy ALL content
6. Paste to SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for success message
9. Done! ✅

### Method 2: Advanced Setup

Same steps, but use `supabase-storage-setup.sql` instead

---

## ✅ Verify Setup

After running SQL, run this query to verify:

```sql
-- Check buckets
SELECT * FROM storage.buckets;

-- Check policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects';
```

Should see:
- 3 buckets: `music`, `album-art`, `lyrics`
- 4 policies: SELECT, INSERT, UPDATE, DELETE

---

## 🐛 Troubleshooting

### Error: "relation storage.buckets does not exist"
**Solution:** Storage belum enabled. Enable di Dashboard → Storage

### Error: "policy already exists"
**Solution:** Policies sudah ada. Drop dulu atau skip step ini

### Error: "permission denied"
**Solution:** Login dengan owner account atau admin role

---

## 📝 What Each File Does

### `supabase-quick-setup.sql`:
```sql
1. Create 3 buckets (music, album-art, lyrics)
2. Set file size limits (50MB, 10MB, 1MB)
3. Set allowed MIME types
4. Create simple policies:
   - Anyone can read
   - Authenticated users can upload/delete
5. Verify setup
```

### `supabase-storage-setup.sql`:
```sql
1. Create buckets with detailed config
2. Create policies per bucket:
   - Public read
   - Authenticated upload (only to own folder)
   - User can update own files
   - User can delete own files
3. Include DROP policies section
4. Include simplified version as fallback
```

---

## 🔐 Security Notes

### Quick Setup:
- ✅ Anyone can view files (needed for playback)
- ✅ Only authenticated users can upload
- ✅ Only authenticated users can delete
- ⚠️ Users can delete any file (not just theirs)

### Advanced Setup:
- ✅ Anyone can view files (needed for playback)
- ✅ Only authenticated users can upload
- ✅ Files organized by userId folder
- ✅ Users can only delete their OWN files
- ✅ More secure for production

---

## 💡 Tips

1. **Start with Quick Setup** untuk testing
2. **Switch to Advanced** kalau sudah production
3. **Backup before running** DROP commands
4. **Test upload** after running SQL
5. **Check Storage dashboard** untuk verify files

---

## 🔄 Reset/Undo

Jika mau reset semua policies:

```sql
-- Drop all policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Delete all buckets (WARNING: This deletes all files!)
DELETE FROM storage.buckets WHERE id IN ('music', 'album-art', 'lyrics');
```

---

## 📚 Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)

---

**Need help? Check [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for full guide!**
