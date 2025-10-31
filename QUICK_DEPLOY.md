# ⚡ Quick Deployment - Supabase + Vercel

## 🎯 Super Simple Setup (10 menit!)

### 1️⃣ Setup Supabase (3 menit)

```bash
# 1. Buat account di supabase.com (FREE)
# 2. Create new project
# 3. Create 3 buckets: music, album-art, lyrics (set PUBLIC)
# 4. Run SQL: supabase-quick-setup.sql (Setup policies)
# 5. Copy URL & Anon Key dari Settings → API
```

📝 **Quick SQL Setup:**
- Go to SQL Editor → New Query
- Copy from `supabase-quick-setup.sql`
- Run → Done!

### 2️⃣ Configure Local (.env)

```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env, isi:
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# (etc)
```

### 3️⃣ Test Local (2 menit)

```bash
npm install
npm run dev

# Test upload: http://localhost:5173
# Check Supabase Dashboard → Storage
```

### 4️⃣ Deploy ke Vercel (3 menit)

```bash
# Push to GitHub
git add .
git commit -m "Setup Supabase storage"
git push origin main

# Di Vercel:
# 1. Import repository
# 2. Add environment variables (sama seperti .env)
# 3. Deploy!
```

### 5️⃣ Update Firebase Authorized Domains (1 menit)

```bash
# Firebase Console → Authentication → Settings
# Add: your-app.vercel.app
```

---

## ✅ Done!

**Your app is now live with:**
- ✅ Frontend on Vercel
- ✅ Files on Supabase (1GB FREE)
- ✅ Auth & DB on Firebase
- ✅ NO backend server needed!

**Total cost: $0/month** (Free tier!)

---

## 🔗 Architecture

```
┌─────────┐
│ Browser │
└────┬────┘
     │
     ├──> Vercel (Frontend)
     │
     ├──> Supabase (File Storage)
     │    ├── music/
     │    ├── album-art/
     │    └── lyrics/
     │
     └──> Firebase (Auth + Firestore)
          ├── Authentication
          └── Firestore Database
```

**Simple. Clean. Scalable. 🚀**

---

**Detail lengkap: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)**
