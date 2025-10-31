# 🎵 KinoVibes Music Player - Storage Architecture

## 📁 Arsitektur Penyimpanan Baru

Sistem penyimpanan telah dirombak dengan struktur hybrid:

### ✅ Yang Disimpan di Project (Lokal)
- 🎵 **File Audio** → `/public/music/uploads/`
- 🖼️ **Album Art** → `/public/album-art/`
- 📝 **File Lirik** → `/public/lyrics/`
- 🎼 **Demo Music** → `/public/music/demo/`

### ☁️ Yang Disimpan di Firebase
- 👤 **User Authentication** → Firebase Auth
- 🗂️ **Music Metadata** → Firestore Collection `music_library`
- 📋 **Playlists** → Firestore Collection `playlists`
- ⭐ **User Data** → Firestore Collections `users`, `favorites`

---

## 📂 Struktur Folder

```
public/
├── music/
│   ├── demo/              # File musik demo
│   │   ├── chill-vibes.mp3
│   │   ├── summer-nights.mp3
│   │   └── README.md
│   └── uploads/           # File musik yang diupload user
│       ├── {userId}_{timestamp}_{filename}.mp3
│       └── README.md
├── album-art/             # Cover album
│   └── {userId}_{timestamp}_{filename}.jpg
└── lyrics/                # File lirik synchronized
    ├── {songId}.json
    └── README.md
```

---

## 🔄 Alur Upload Musik

### Browser-Only Mode (Current)
1. User pilih file audio & album art
2. Metadata disimpan ke Firestore
3. File disimpan sementara di browser localStorage
4. Console menampilkan instruksi untuk save file manual
5. File harus di-copy manual ke folder `/public/music/uploads/`

### Production Mode (Dengan Backend)
1. User pilih file audio & album art
2. File di-upload ke backend API
3. Backend save file ke folder `/public/`
4. Backend return file path
5. Metadata + path disimpan ke Firestore

---

## 🛠️ Setup untuk Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Firebase
Pastikan file `.env` sudah ada dengan config Firebase:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore
```

### 4. Tambahkan Demo Music (Optional)
Download free music dari:
- [Free Music Archive](https://freemusicarchive.org/)
- [Incompetech](https://incompetech.com/music/)
- [Bensound](https://www.bensound.com/)

Simpan ke `/public/music/demo/` dengan nama:
- `chill-vibes.mp3`
- `summer-nights.mp3`
- `midnight-drive.mp3`
- `ocean-waves.mp3`
- `city-lights.mp3`

### 5. Run Development Server
```bash
npm run dev
```

---

## 🚀 Setup untuk Production

### Option 1: Static Hosting (Netlify, Vercel)
⚠️ **Limitation**: File upload tidak akan bekerja otomatis.
User harus manual save file ke server.

Deploy steps:
```bash
npm run build
# Upload dist/ folder ke hosting
```

### Option 2: Dengan Backend API

#### Node.js/Express Backend Example:
```javascript
// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();

// Setup multer untuk menyimpan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'audio' 
      ? 'public/music/uploads' 
      : 'public/album-art';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const userId = req.body.userId;
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${userId}_${timestamp}_${sanitized}`);
  }
});

const upload = multer({ storage });

// Upload endpoint
app.post('/api/upload-music', 
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'albumArt', maxCount: 1 }
  ]), 
  (req, res) => {
    const audioPath = req.files.audio 
      ? `/music/uploads/${req.files.audio[0].filename}` 
      : null;
    const albumArtPath = req.files.albumArt 
      ? `/album-art/${req.files.albumArt[0].filename}` 
      : null;
    
    res.json({
      success: true,
      audioPath,
      albumArtPath
    });
  }
);

app.listen(3000);
```

#### Update Frontend (src/services/musicApi.js):
```javascript
// Replace saveFileLocally with API call
const response = await fetch('http://your-api.com/api/upload-music', {
  method: 'POST',
  body: formData
});
const { audioPath, albumArtPath } = await response.json();
```

---

## 📊 Firestore Collections Schema

### `music_library`
```javascript
{
  id: "local_1730312345678",
  title: "Song Title",
  artist: "Artist Name",
  album: "Album Name",
  genre: "Genre",
  duration: 180,
  audioUrl: "/music/uploads/user123_1730312345678_song.mp3",
  albumArt: "/album-art/user123_1730312345678_cover.jpg",
  uploadedBy: "user123",
  uploadedAt: Timestamp,
  fileName: "user123_1730312345678_song.mp3",
  fileSize: 5242880,
  source: "local",
  isFullTrack: true
}
```

### `playlists`
```javascript
{
  id: "playlist123",
  userId: "user123",
  name: "My Playlist",
  description: "Description",
  songs: [
    { id: "local_xxx", title: "Song 1", ... },
    { id: "local_yyy", title: "Song 2", ... }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🔒 Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Music metadata: read for all, write for uploader only
    match /music_library/{musicId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
                    && request.resource.data.uploadedBy == request.auth.uid;
      allow update, delete: if request.auth != null 
                            && resource.data.uploadedBy == request.auth.uid;
    }
    
    // Playlists: read for all, write for owner only
    match /playlists/{playlistId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
                    && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null 
                            && resource.data.userId == request.auth.uid;
    }
  }
}
```

**Note**: Storage rules dihapus karena tidak menggunakan Firebase Storage.

---

## 🐛 Troubleshooting

### File Upload Tidak Muncul
1. Check browser console untuk path file
2. Pastikan file ada di folder yang benar
3. Refresh halaman
4. Check network tab untuk 404 errors

### Firestore Permission Denied
1. Check user sudah login
2. Deploy Firestore rules: `firebase deploy --only firestore`
3. Check rules di Firebase Console

### Demo Music Tidak Muncul
1. Check file demo ada di `/public/music/demo/`
2. Check nama file sesuai dengan kode
3. Fallback akan menggunakan external URLs

---

## 📝 Notes

- ⚠️ Browser localStorage memiliki limit ~5-10MB
- ⚠️ Untuk production, gunakan backend API untuk upload
- ✅ Firestore free tier: 50K reads/day, 20K writes/day
- ✅ Firebase Auth free tier: unlimited users

---

## 🔄 Migration dari Firebase Storage

Jika sebelumnya menggunakan Firebase Storage:

1. Export data dari Firestore
2. Download files dari Firebase Storage
3. Copy files ke `/public/music/uploads/`
4. Update `audioUrl` dan `albumArt` paths di Firestore
5. Delete Firebase Storage bucket (optional)

---

## 📚 Resources

- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Vite Public Folder](https://vitejs.dev/guide/assets.html#the-public-directory)
- [Express File Upload](https://expressjs.com/en/resources/middleware/multer.html)

---

**Last Updated**: October 30, 2025
