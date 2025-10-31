# ✅ Upload File Fix - Backend API Ready!

## 🎉 Masalah Sudah Diperbaiki!

File upload sekarang **otomatis tersimpan** ke folder `public/music/uploads/` dan `public/album-art/`!

---

## 🚀 Cara Menggunakan

### 1. **Pastikan Backend Server Jalan**

Backend server sudah running di: **http://localhost:3001** ✅

Kalau server mati, jalankan lagi:
```bash
cd backend
node server.js
```

### 2. **Upload Music Seperti Biasa**

1. Buka app di **http://localhost:5174**
2. Login
3. Klik **"Upload Music"** atau tombol "+" di Library
4. Isi form:
   - Title (judul lagu)
   - Artist (penyanyi)
   - Album (pilih dari dropdown atau buat baru)
   - Genre
   - Audio file (.mp3, .wav, dll)
   - Album art (optional, .jpg/.png)
5. Klik **"Upload Music"**
6. **File otomatis tersimpan!** 🎵

### 3. **Play Music** 🎧

Setelah upload selesai:
- File langsung tersimpan di folder
- Bisa langsung diputar tanpa refresh
- Album art langsung muncul

---

## 📁 File Tersimpan Di:

```
public/
├── music/
│   └── uploads/
│       └── userId_timestamp_namefile.mp3  ⭐ FILE AUDIO TERSIMPAN DI SINI
└── album-art/
    └── userId_timestamp_cover.jpg  ⭐ ALBUM ART TERSIMPAN DI SINI
```

---

## 🔍 Cek Status Backend

Test kalau backend jalan:
```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "message": "KinoVibes Backend API is running",
  "timestamp": "2025-01-30T12:00:00.000Z"
}
```

---

## ⚙️ Technical Details

### Backend Tech Stack:
- **Express.js** - Web server
- **Multer** - File upload handler
- **CORS** - Cross-origin requests

### API Endpoints:
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload music & album art |
| DELETE | `/api/files` | Delete files from server |
| GET | `/api/health` | Check server status |

### Upload Process:
1. Frontend send files via FormData
2. Backend receive via Multer middleware
3. Files saved to `public/music/uploads/` & `public/album-art/`
4. Response with file paths
5. Frontend save metadata to Firestore
6. Done! ✅

---

## 🛠️ Troubleshooting

### Problem: "Backend API not available"
**Solution:**
```bash
# Check if backend running
curl http://localhost:3001/api/health

# If not, start it:
cd backend
node server.js
```

### Problem: "Port 3001 already in use"
**Solution:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in backend/.env
PORT=3002
```

### Problem: Files tidak tersimpan
**Solution:**
- Check backend console log
- Check folder permissions
- Check file size (max 50MB)

### Problem: CORS error
**Solution:**
Backend sudah configured untuk accept requests dari `http://localhost:5173` dan `http://localhost:5174`

---

## 📊 Performance

- Max file size: **50MB**
- Supported audio: MP3, WAV, OGG, M4A, AAC, FLAC
- Supported images: JPG, PNG, WEBP, GIF
- Upload speed: Depends on file size

---

## 🎯 Next Steps

1. ✅ Backend server running
2. ✅ Upload form connected to backend
3. ✅ Files auto-saved to disk
4. ✅ Delete function works
5. ⏭️ Optional: Deploy backend to cloud (Heroku, Railway, etc)

---

## 📝 File Changes Made

### New Files:
- `backend/server.js` - Express server
- `backend/package.json` - Dependencies
- `backend/README.md` - Backend docs

### Updated Files:
- `src/services/musicApi.js`:
  - Added `API_BASE_URL` constant
  - Updated `uploadMusic()` to use fetch API
  - Updated `deleteMusic()` to call backend
  - Removed `saveFileLocally()` helper

### Removed:
- FileDownloadHelper component (tidak diperlukan lagi)
- localStorage file queue system

---

**Status: READY TO USE** ✅  
**Backend: RUNNING** 🟢  
**Upload: WORKING** ✅  

Silahkan test upload lagu sekarang!
