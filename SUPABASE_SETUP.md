# 🚀 Supabase Setup Guide - KinoVibes Music Player

## 📋 Overview

KinoVibes sekarang menggunakan **Supabase** untuk file storage! Supabase adalah alternative open-source untuk Firebase yang lebih simple dan powerful.

### ✅ Keuntungan Supabase:

1. **Free Tier Generous** - 1GB storage, 2GB bandwidth, 50GB transfer
2. **Simple API** - Lebih mudah dari Cloudinary
3. **Integrated** - Storage + Database + Auth dalam satu platform
4. **No Backend Needed** - Direct upload dari frontend
5. **PostgreSQL** - Real database (bukan NoSQL)

---

## 🎯 Step-by-Step Setup

### 1️⃣ **Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** (Sign up FREE)
3. Click **"New Project"**
4. Fill in:
   - **Name**: `kinovibes` (or any name)
   - **Database Password**: (strong password, save it!)
   - **Region**: Choose closest to you
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup

### 2️⃣ **Create Storage Buckets**

1. In Supabase Dashboard, go to **Storage**
2. Click **"Create a new bucket"**

**Create 3 buckets:**

**Bucket 1: music**
- Name: `music`
- Public bucket: ✅ YES
- File size limit: 50 MB
- Allowed MIME types: `audio/mpeg, audio/wav, audio/ogg, audio/mp4, audio/flac`

**Bucket 2: album-art**
- Name: `album-art`
- Public bucket: ✅ YES
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`

**Bucket 3: lyrics**
- Name: `lyrics`
- Public bucket: ✅ YES
- File size limit: 1 MB
- Allowed MIME types: `text/plain, application/json`

### 3️⃣ **Get API Credentials**

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4️⃣ **Configure Environment Variables**

Create/update `.env` file di root project:

```env
# Firebase (for Auth & Firestore)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=kino-vibe.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kino-vibe
VITE_FIREBASE_STORAGE_BUCKET=kino-vibe.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase (for File Storage)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5️⃣ **Setup Storage Policies (RLS)**

**OPTION A: Quick Setup (Recommended - Easy)**

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Copy & paste from: [`supabase-quick-setup.sql`](supabase-quick-setup.sql)
4. Click **"Run"**
5. Done! ✅

**OPTION B: Detailed Setup (Advanced Security)**

Use: [`supabase-storage-setup.sql`](supabase-storage-setup.sql)

**OPTION C: UI Setup (Manual)**

Di Supabase Dashboard → **Storage** → Each bucket → **Policies**

For each bucket, create these policies:

1. **Public Read** - Anyone can view files
   - Template: "Allow public SELECT"
   
2. **Authenticated Upload** - Logged-in users can upload
   - Template: "Allow authenticated INSERT"
   
3. **Authenticated Delete** - Users can delete files
   - Template: "Allow authenticated DELETE"

---

## 📂 File Structure

```
Supabase Storage Structure:
├── music/
│   └── {userId}/
│       └── {timestamp}_{filename}.mp3
├── album-art/
│   └── {userId}/
│       └── {timestamp}_{filename}.jpg
└── lyrics/
    └── {userId}/
        └── {timestamp}_{filename}.lrc
```

**Example:**
```
music/KBsjil5VRBdr1CWJvMZgYI1yTnY2/1761880430292_song.mp3
```

---

## 🧪 Testing

### **Test Upload:**

1. Start development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173

3. Login → Upload → Check Supabase Dashboard → Storage

### **Check Files:**

Go to Supabase Dashboard → **Storage** → **music** bucket

You should see folders with userId and files inside!

---

## 🔐 Security

### **What's Protected:**

- ✅ Only **authenticated users** can upload
- ✅ Only **file owner** can delete
- ✅ **Public** can read/play (for playback)
- ✅ Files organized by **userId** folder

### **Best Practices:**

1. Never commit `.env` to Git
2. Use environment variables in production
3. Enable RLS (Row Level Security) policies
4. Validate file types before upload
5. Set appropriate file size limits

---

## 💰 Pricing

### **Supabase Free Tier:**

- ✅ **1 GB Database space**
- ✅ **1 GB File storage**
- ✅ **2 GB Bandwidth**
- ✅ **50 GB Data transfer/month**
- ✅ Unlimited API requests

**Estimated capacity:**
- ~30-40 songs (avg 30MB each)
- ~100-200 album arts
- Perfect untuk testing/small projects

### **Pro Tier ($25/month):**
- 8 GB Database
- 100 GB File storage
- 250 GB Bandwidth
- Good for production

---

## 🔄 Migration dari Local/Cloudinary

Jika kamu punya existing data:

### **Option 1: Manual Upload**
1. Re-upload lagu lewat UI
2. Akan otomatis ke Supabase

### **Option 2: Batch Import** (coming soon)
```javascript
// Script untuk import bulk files
// Will be added in future update
```

---

## 🌐 Deployment (Vercel)

### **Environment Variables di Vercel:**

1. Go to Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Add:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   (etc)
   ```
4. **Redeploy** project

---

## 🐛 Troubleshooting

### **Error: "Supabase not configured"**
**Solution:** Check `.env` file, pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` ada

### **Error: "Row Level Security policy violation"**
**Solution:** 
1. Check RLS policies di Supabase Dashboard
2. Make sure buckets are **public**
3. Enable **authenticated upload** policy

### **Error: "File upload failed"**
**Solution:**
1. Check file size (max 50MB for audio)
2. Check file type (MP3, WAV, etc)
3. Check internet connection
4. Verify Supabase credentials

### **Error: "Policy not found"**
**Solution:** Create policies for each bucket (see step 5)

### **Files tidak muncul**
**Solution:**
1. Check Supabase Dashboard → Storage
2. Verify bucket names match: `music`, `album-art`, `lyrics`
3. Check if files actually uploaded (look in userId folder)

---

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

## ✅ Quick Checklist

- [ ] Supabase account created
- [ ] Project created
- [ ] 3 buckets created (music, album-art, lyrics)
- [ ] Buckets set to **public**
- [ ] RLS policies configured
- [ ] `.env` file configured with credentials
- [ ] Test upload works
- [ ] Files visible in Supabase Dashboard
- [ ] Playback works from Supabase URLs

---

## 🎉 You're Done!

Your KinoVibes Music Player is now using Supabase for file storage!

**Architecture:**
```
User Upload → Frontend → Supabase Storage (upload file)
                       ↓
                  Get public URL
                       ↓
                  Save to Firestore (metadata)
                       ↓
                  Playback from Supabase URL
```

**No backend needed! Direct frontend → Supabase! 🚀**

---

**Happy coding! 🎵✨**
