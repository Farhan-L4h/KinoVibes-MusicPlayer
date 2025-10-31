# 🚀 Vercel Deployment - Quick Checklist

## ⚡ PRIORITY 1: Environment Variables (MUST DO!)

Login ke Vercel Dashboard → Your Project → Settings → Environment Variables

Add these 2 variables untuk **ALL ENVIRONMENTS** (Production, Preview, Development):

```
VITE_SUPABASE_URL = https://cigrzozxyuwpsdlpqujr.supabase.co
VITE_SUPABASE_ANON_KEY = [your_anon_key_from_supabase]
```

**Cara dapat anon key:**
1. Buka https://supabase.com/dashboard
2. Pilih project KinoVibes
3. Settings → API
4. Copy "anon/public" key

---

## 🔐 PRIORITY 2: Supabase RLS (Row Level Security)

Login ke Supabase Dashboard → SQL Editor

**Copy & paste** file `supabase_rls_policies.sql` ke SQL Editor, lalu RUN.

File ini akan:
- ✅ Enable RLS di semua tables
- ✅ Setup policies untuk read/write
- ✅ Secure user data

---

## 🗄️ PRIORITY 3: Storage Bucket Permissions

Login ke Supabase Dashboard → Storage

### Bucket: `music` (sudah ada)
1. Click **`music`** bucket
2. Click **Policies** tab
3. Add policy:
   - **Name:** Public Read Access
   - **Operation:** SELECT
   - **Policy:** `bucket_id = 'music'`

### Bucket: `album-art` (sudah ada)
- Same as music bucket

### Bucket: `lyrics` (sudah ada)
- Same as music bucket

---

## 🔑 PRIORITY 4: Google OAuth Setup

### A. Google Cloud Console
1. Go to https://console.cloud.google.com/
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client
4. **Authorized redirect URIs** - ADD:
   ```
   https://cigrzozxyuwpsdlpqujr.supabase.co/auth/v1/callback
   https://your-vercel-app.vercel.app/auth/callback
   ```

### B. Supabase Dashboard
1. Authentication → URL Configuration
2. **Site URL:** `https://your-vercel-app.vercel.app`
3. **Redirect URLs** - ADD:
   ```
   https://your-vercel-app.vercel.app/**
   http://localhost:5173/**
   ```

---

## 📦 PRIORITY 5: Deploy to Vercel

### Option A: Via Dashboard (Recommended)
1. Login https://vercel.com
2. New Project
3. Import GitHub repo: `Farhan-L4h/KinoVibes-MusicPlayer`
4. Framework: **Vite**
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. **Deploy**

### Option B: Via CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## ✅ Post-Deployment Testing

After deploy, test these features:

### 1. Authentication
- [ ] Google login works
- [ ] User profile loads
- [ ] Logout works

### 2. Upload Music
- [ ] Can select audio file
- [ ] Can upload album art
- [ ] Can select genre
- [ ] Can select playlists
- [ ] Upload completes successfully

### 3. Playback
- [ ] Click play button
- [ ] Audio plays
- [ ] Progress bar moves
- [ ] Volume control works
- [ ] Next/Previous works

### 4. Playlists
- [ ] Can create playlist
- [ ] Playlist shows in sidebar
- [ ] Can add songs to playlist
- [ ] Can view playlist detail
- [ ] Can remove songs
- [ ] Can delete playlist

### 5. Library
- [ ] All uploaded songs appear
- [ ] Can search songs
- [ ] Can filter by genre

---

## 🐛 Troubleshooting

### Issue: "Network Error" on login
**Fix:** Check environment variables di Vercel

### Issue: Audio not playing
**Fix:** Check storage bucket policies (must be public read)

### Issue: Can't upload music
**Fix:** Run RLS policies SQL script

### Issue: Google OAuth error
**Fix:** Update redirect URIs di Google Cloud Console

---

## 📝 Files to Commit

Make sure these files are in your repo:

- [x] `vercel.json` - Vercel configuration
- [x] `VERCEL_DEPLOYMENT.md` - Full documentation
- [x] `supabase_rls_policies.sql` - Database security
- [x] `.env.example` - Template for env vars
- [x] `.gitignore` - Exclude .env files

---

## 🎯 Expected Result

After completing all steps:

✅ App deployed to: `https://your-app.vercel.app`
✅ Google OAuth login works
✅ Music upload works
✅ Playback works
✅ Playlists work
✅ All features functional

---

## 📞 Need Help?

Check these resources:
- Vercel Logs: Project → Deployments → Click deployment → Logs
- Supabase Logs: Dashboard → Logs → API
- Browser Console: F12 → Console tab

---

**Time to complete:** ~15-20 minutes

Good luck! 🚀🎵
