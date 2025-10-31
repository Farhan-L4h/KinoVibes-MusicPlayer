# Vercel Deployment Guide - KinoVibes Music Player

## 🚀 Prerequisites

- ✅ GitHub repository sudah ada
- ✅ Supabase project sudah setup
- ✅ Kode sudah push ke GitHub

## 📋 Step-by-Step Deployment

### 1. **Setup Environment Variables di Vercel**

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Tambahkan 2 variables berikut:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://cigrzozxyuwpsdlpqujr.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `your_supabase_anon_key_here` | Production, Preview, Development |

**Cara mendapatkan values:**
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project: **KinoVibes**
3. Go to: **Project Settings** → **API**
4. Copy:
   - **Project URL** → untuk `VITE_SUPABASE_URL`
   - **anon/public key** → untuk `VITE_SUPABASE_ANON_KEY`

⚠️ **IMPORTANT:** Pastikan pilih **All Environments** (Production, Preview, Development)

---

### 2. **Vercel Configuration File**

File `vercel.json` sudah ada (jika belum, create file ini):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### 3. **Supabase Configuration**

#### A. **Storage Buckets Permissions**

Di Supabase Dashboard, pastikan buckets sudah public:

1. Go to: **Storage** → **Policies**

**Bucket: `music`**
```sql
-- Allow public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'music');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'music');
```

**Bucket: `album-art`**
```sql
-- Allow public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'album-art');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'album-art');
```

**Bucket: `lyrics`**
```sql
-- Allow public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lyrics');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lyrics');
```

#### B. **Database Policies (RLS)**

Pastikan Row Level Security sudah benar:

**Table: `music_library`**
```sql
-- Enable RLS
ALTER TABLE music_library ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Public can read music"
ON music_library FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert their own music
CREATE POLICY "Users can insert own music"
ON music_library FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own music
CREATE POLICY "Users can update own music"
ON music_library FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own music
CREATE POLICY "Users can delete own music"
ON music_library FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**Table: `playlists`**
```sql
-- Enable RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own playlists
CREATE POLICY "Users can read own playlists"
ON playlists FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to create playlists
CREATE POLICY "Users can create playlists"
ON playlists FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own playlists
CREATE POLICY "Users can update own playlists"
ON playlists FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own playlists
CREATE POLICY "Users can delete own playlists"
ON playlists FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**Table: `playlist_tracks`**
```sql
-- Enable RLS
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Allow users to read tracks in their playlists
CREATE POLICY "Users can read playlist tracks"
ON playlist_tracks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM playlists
    WHERE playlists.id = playlist_tracks.playlist_id
    AND playlists.user_id = auth.uid()
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
    AND playlists.user_id = auth.uid()
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
    AND playlists.user_id = auth.uid()
  )
);
```

**Table: `favorites`**
```sql
-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own favorites
CREATE POLICY "Users can read own favorites"
ON favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to add favorites
CREATE POLICY "Users can add favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to remove favorites
CREATE POLICY "Users can remove favorites"
ON favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

---

### 4. **Google OAuth Configuration**

Update **Authorized redirect URIs** di Google Cloud Console:

1. Go to: [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Pilih OAuth 2.0 Client ID kamu
4. Tambahkan **Authorized redirect URIs**:
   ```
   https://cigrzozxyuwpsdlpqujr.supabase.co/auth/v1/callback
   https://your-app.vercel.app/auth/callback
   ```

Di Supabase Dashboard:
1. **Authentication** → **Providers** → **Google**
2. Pastikan Google OAuth sudah enabled
3. Site URL: `https://your-app.vercel.app`
4. Redirect URLs:
   ```
   https://your-app.vercel.app/**
   ```

---

### 5. **Build Configuration**

Pastikan `package.json` punya script yang benar:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

### 6. **Deploy to Vercel**

#### Option A: Via Vercel Dashboard
1. Login ke [Vercel](https://vercel.com)
2. Click **"Add New Project"**
3. Import repository dari GitHub
4. **Framework Preset:** Vite
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`
7. Add environment variables (step 1)
8. Click **"Deploy"**

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 🔧 Post-Deployment Checks

### 1. **Test Authentication**
- ✅ Google OAuth login works
- ✅ User profile loads
- ✅ Logout works

### 2. **Test Music Upload**
- ✅ Upload audio file
- ✅ Upload album art
- ✅ Upload lyrics file
- ✅ Music appears in library

### 3. **Test Playback**
- ✅ Click play button
- ✅ Audio plays correctly
- ✅ Progress bar works
- ✅ Next/previous works

### 4. **Test Playlists**
- ✅ Create playlist
- ✅ Add songs to playlist
- ✅ View playlist detail
- ✅ Remove songs from playlist
- ✅ Delete playlist

### 5. **Test Favorites**
- ✅ Add to favorites
- ✅ View favorites page
- ✅ Remove from favorites

---

## 🐛 Common Issues & Solutions

### Issue 1: Environment Variables Not Working
**Solution:**
- Pastikan variable names EXACT match (case-sensitive)
- Redeploy setelah add variables
- Check di Vercel logs: `Settings` → `Environment Variables`

### Issue 2: Audio Not Playing
**Checklist:**
- ✅ Supabase storage bucket `music` is public
- ✅ Storage policies allow public read
- ✅ Audio URL format correct: `https://cigrzozxyuwpsdlpqujr.supabase.co/storage/v1/object/public/music/...`

### Issue 3: Google OAuth Redirect Error
**Solution:**
- Add Vercel domain to Google OAuth authorized URIs
- Add Vercel domain to Supabase redirect URLs
- Format: `https://your-app.vercel.app/**`

### Issue 4: 404 on Page Refresh
**Solution:**
- Sudah fixed dengan `vercel.json` rewrites
- All routes redirect ke `index.html`

### Issue 5: CORS Errors
**Solution:**
- Supabase automatically handles CORS
- Pastikan requests menggunakan correct Supabase URL
- Check browser console for exact error

---

## 📊 Monitoring

### Vercel Analytics
1. Go to: **Project** → **Analytics**
2. Monitor:
   - Page views
   - Performance
   - Errors

### Supabase Logs
1. Go to: **Supabase Dashboard** → **Logs**
2. Monitor:
   - API requests
   - Auth events
   - Storage uploads

---

## 🔐 Security Checklist

- ✅ Environment variables tidak di-commit ke Git
- ✅ `.env` ada di `.gitignore`
- ✅ RLS (Row Level Security) enabled di semua tables
- ✅ Storage policies configured correctly
- ✅ Only `anon key` di frontend (bukan `service_role` key)
- ✅ Google OAuth credentials secure

---

## 🎯 Production URLs

After deployment, your URLs will be:

- **Production:** `https://your-app.vercel.app`
- **API (Supabase):** `https://cigrzozxyuwpsdlpqujr.supabase.co`
- **Storage:** `https://cigrzozxyuwpsdlpqujr.supabase.co/storage/v1/object/public/`

---

## 📝 Quick Command Reference

```bash
# Install dependencies
npm install

# Run development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod

# Check deployment logs
vercel logs
```

---

## ✅ Final Checklist

Before marking deployment as complete:

- [ ] Environment variables added to Vercel
- [ ] Supabase storage buckets are public
- [ ] Database RLS policies configured
- [ ] Google OAuth redirect URIs updated
- [ ] Site URL updated in Supabase
- [ ] Deployed successfully to Vercel
- [ ] Authentication tested
- [ ] Music upload tested
- [ ] Playback tested
- [ ] Playlists tested
- [ ] Favorites tested
- [ ] Mobile responsive tested

---

## 🎉 Success!

Your KinoVibes Music Player is now LIVE! 🎵

**Need help?** Check:
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Project Issues: GitHub Issues

---

**Built with:**
- ⚡ Vite 7.1.12
- ⚛️ React 19.1.1
- 🎨 TailwindCSS 3.4.17
- 🗄️ Supabase 2.78.0
- 🎵 Howler.js 2.2.4
- 🐻 Zustand 5.0.8

Made with ❤️ by Farhan-L4h
