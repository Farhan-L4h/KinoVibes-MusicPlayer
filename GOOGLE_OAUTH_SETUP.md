# 🔐 Google OAuth Setup - KinoVibes

## Quick Setup (5 minutes)

### 1️⃣ Enable Google Provider di Supabase

1. **Buka Supabase Dashboard** → https://supabase.com/dashboard
2. **Pilih Project** → `KinoVibes` (cigrzozxyuwpsdlpqujr)
3. **Authentication** → **Providers**
4. **Cari "Google"** → Klik **Enable**

### 2️⃣ Get Google OAuth Credentials

#### Option A: Quick Setup (Recommended)
Supabase akan auto-configure Google OAuth untuk kamu! Just click **Enable**.

#### Option B: Custom Setup (Advanced)
1. Buka **Google Cloud Console**: https://console.cloud.google.com/
2. **Create New Project** atau pilih existing
3. **APIs & Services** → **OAuth consent screen**
   - User Type: **External**
   - App name: `KinoVibes Music Player`
   - User support email: your-email@gmail.com
   - Developer email: your-email@gmail.com
   - Click **Save**

4. **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `KinoVibes Supabase`
   - Authorized redirect URIs:
     ```
     https://cigrzozxyuwpsdlpqujr.supabase.co/auth/v1/callback
     ```
   - Click **Create**

5. **Copy** Client ID & Client Secret

6. **Paste di Supabase**:
   - Authentication → Providers → Google
   - Client ID: `paste-here`
   - Client Secret: `paste-here`
   - Click **Save**

### 3️⃣ Configure Redirect URLs

Di Supabase Dashboard:
1. **Authentication** → **URL Configuration**
2. **Site URL**: `http://localhost:5173`
3. **Redirect URLs** (add these):
   ```
   http://localhost:5173
   http://localhost:5173/
   ```

### 4️⃣ Test Login

1. Restart dev server: `npm run dev`
2. Open: http://localhost:5173/login
3. Click **"Continue with Google"**
4. Login dengan Google account
5. ✅ Success!

---

## 🔧 Troubleshooting

### Error: "OAuth provider not enabled"
**Fix**: Enable Google provider di Supabase Dashboard → Authentication → Providers

### Error: "Redirect URI mismatch"
**Fix**: Add `http://localhost:5173` ke Redirect URLs di Supabase

### Error: "Invalid client"
**Fix**: Check Client ID & Secret di Google Cloud Console

---

## 📝 Code Already Implemented

✅ `signInWithGoogle()` function ready
✅ Login page has Google button
✅ Register page has Google button
✅ Auto-creates user profile on first login

---

## 🚀 Production Deployment

When deploying to production (e.g., Vercel):

1. Update **Site URL** di Supabase:
   ```
   https://your-domain.vercel.app
   ```

2. Add production URL ke **Redirect URLs**:
   ```
   https://your-domain.vercel.app
   https://your-domain.vercel.app/
   ```

3. Update Google OAuth **Authorized redirect URIs**:
   ```
   https://cigrzozxyuwpsdlpqujr.supabase.co/auth/v1/callback
   ```

Done! 🎉
