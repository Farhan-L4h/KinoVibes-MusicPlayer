# 🚀 Full Supabase Migration Guide - KinoVibes

## 🎯 100% Supabase - No Firebase!

**All-in-One Solution:**
- ✅ **Authentication** - Supabase Auth
- ✅ **Database** - PostgreSQL
- ✅ **Storage** - File Storage
- ✅ **Real-time** - Built-in
- ✅ **FREE** - Generous free tier!

---

## 📋 Quick Setup (10 minutes)

### 1️⃣ Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `kinovibes`
   - **Database Password**: (strong password!)
   - **Region**: Choose closest to you
4. Wait 2-3 minutes for setup

### 2️⃣ Run Database Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New Query"**
3. Copy entire content from [`supabase-full-schema.sql`](supabase-full-schema.sql)
4. Paste and click **"Run"**
5. Wait for success ✅

**This creates:**
- 6 tables (users, music_library, albums, playlists, etc)
- 3 storage buckets (music, album-art, lyrics)
- All RLS policies
- Indexes for performance

### 3️⃣ Get API Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGci...`

### 4️⃣ Configure Environment

Create `.env` file:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 5️⃣ Install & Run

```bash
npm install
npm run dev
```

**Done! 🎉**

---

## 📊 Database Schema

### Tables Created:

1. **`users`** - User profiles
   ```sql
   - id (UUID, references auth.users)
   - email
   - display_name
   - avatar_url
   - created_at, updated_at
   ```

2. **`music_library`** - All songs
   ```sql
   - id (UUID)
   - user_id (references users)
   - title, artist, album, genre
   - audio_url, audio_path
   - album_art, album_art_path
   - lyrics_url, lyrics_path
   - duration, file_size
   - play_count
   - created_at, updated_at
   ```

3. **`albums`** - Album collections
   ```sql
   - id (UUID)
   - user_id
   - name, artist
   - cover_art
   - track_count
   - created_at, updated_at
   ```

4. **`playlists`** - User playlists
   ```sql
   - id (UUID)
   - user_id
   - name, description
   - cover_image
   - is_public
   - track_count
   - created_at, updated_at
   ```

5. **`playlist_tracks`** - Junction table
   ```sql
   - id (UUID)
   - playlist_id
   - music_id
   - position
   - added_at
   ```

6. **`favorites`** - Favorite songs
   ```sql
   - id (UUID)
   - user_id
   - music_id
   - added_at
   ```

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled:

### Music Library:
- ✅ Anyone can **view** all music
- ✅ Users can **insert** own music
- ✅ Users can **update** own music
- ✅ Users can **delete** own music

### Playlists:
- ✅ Users can view **own** or **public** playlists
- ✅ Users can create/edit/delete **own** playlists

### Favorites:
- ✅ Users can only see **own** favorites

---

## 📦 Storage Buckets

### 1. `music` bucket
- Max size: **50MB**
- Types: MP3, WAV, OGG, FLAC, M4A
- Public: Yes (for playback)

### 2. `album-art` bucket
- Max size: **10MB**
- Types: JPG, PNG, WebP, GIF
- Public: Yes (for display)

### 3. `lyrics` bucket
- Max size: **1MB**
- Types: LRC, TXT, JSON
- Public: Yes (for reading)

---

## 🔑 Authentication Features

### Email/Password (Built-in)
```javascript
import { signUp, signIn, signOut } from './services/supabaseAuth';

// Sign up
await signUp(email, password, displayName);

// Sign in
await signIn(email, password);

// Sign out
await signOut();
```

### Social Login (Optional)
Can enable:
- Google
- GitHub
- Discord
- Twitter/X
- Facebook

Go to **Authentication** → **Providers** → Enable

---

## 📝 API Usage

### Upload Music
```javascript
import { uploadMusic } from './services/supabaseMusicApi';

const result = await uploadMusic(
  audioFile,
  albumArtFile,
  lyricsFile,
  {
    title: 'Song Title',
    artist: 'Artist Name',
    album: 'Album Name',
    genre: 'Pop'
  },
  userId
);
```

### Get All Music
```javascript
import { getAllMusic } from './services/supabaseMusicApi';

const songs = await getAllMusic();
```

### Search
```javascript
import { searchMusic } from './services/supabaseMusicApi';

const results = await searchMusic('query');
```

### Delete
```javascript
import { deleteMusic } from './services/supabaseMusicApi';

await deleteMusic(musicId, audioPath, albumArtPath, lyricsPath);
```

---

## 🌐 Deployment to Vercel

### Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Deploy

```bash
git push origin main
```

Vercel auto-deploys! ✅

---

## 💰 Pricing

### Supabase Free Tier:
- ✅ **Database**: 500MB
- ✅ **Storage**: 1GB
- ✅ **Bandwidth**: 2GB/month
- ✅ **Auth**: Unlimited users
- ✅ **Realtime**: Unlimited

**Perfect for:**
- ~30-40 songs (with album art)
- Small to medium projects
- Testing & development

### Pro Tier ($25/month):
- 8GB Database
- 100GB Storage
- 250GB Bandwidth
- Priority support

---

## 🔄 Migration from Firebase

### What Changed:

**Before (Firebase):**
```
- Firebase Auth
- Firestore Database
- Firebase Storage (was Cloudinary/Local)
- Complex setup
```

**Now (Supabase):**
```
- Supabase Auth ✅
- PostgreSQL Database ✅
- Supabase Storage ✅
- Simple setup ✅
```

### Advantages:
1. **One Platform** - Everything in Supabase
2. **Better Database** - PostgreSQL > NoSQL
3. **Simpler** - No Firestore rules complexity
4. **Cheaper** - More free tier
5. **Open Source** - Can self-host if needed

---

## 🧪 Testing

### 1. Test Auth
```bash
# Register new user
# Login
# Check Supabase Dashboard → Authentication → Users
```

### 2. Test Upload
```bash
# Upload a song with album art and lyrics
# Check Database → music_library table
# Check Storage → music, album-art, lyrics buckets
```

### 3. Test Playback
```bash
# Play uploaded song
# Check if URL loads
```

---

## 🐛 Troubleshooting

### "Invalid API credentials"
**Solution:** Check `.env` file, make sure URL and Key are correct

### "RLS policy violation"
**Solution:** Run `supabase-full-schema.sql` again to create policies

### "Bucket does not exist"
**Solution:** SQL schema creates buckets automatically, check if ran successfully

### "File too large"
**Solution:** 
- Audio max: 50MB
- Image max: 10MB
- Lyrics max: 1MB

---

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Database schema ran successfully
- [ ] 6 tables created
- [ ] 3 storage buckets created
- [ ] RLS policies active
- [ ] API credentials obtained
- [ ] `.env` configured
- [ ] App runs locally
- [ ] Auth works (register/login)
- [ ] Upload works
- [ ] Playback works
- [ ] Ready to deploy!

---

**You're all set! 100% Supabase, 0% Firebase! 🎉**
