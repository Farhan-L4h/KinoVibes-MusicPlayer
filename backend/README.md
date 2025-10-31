# KinoVibes Backend API

Backend server untuk handle file upload musik dan album art.

## 🚀 Quick Start

### Install Dependencies
```bash
cd backend
npm install
```

### Run Server
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3001`

## 📡 API Endpoints

### 1. Upload Files
**POST** `/api/upload`

Upload audio file dan album art ke server.

**Form Data:**
- `audio` (file) - Audio file (.mp3, .wav, dll)
- `albumArt` (file) - Album art image (.jpg, .png, dll)
- `audioFileName` (string) - Custom filename untuk audio
- `albumArtFileName` (string) - Custom filename untuk album art

**Response:**
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "files": {
    "audio": {
      "filename": "userId_timestamp_song.mp3",
      "path": "/music/uploads/userId_timestamp_song.mp3",
      "size": 7280000
    },
    "albumArt": {
      "filename": "userId_timestamp_cover.jpg",
      "path": "/album-art/userId_timestamp_cover.jpg",
      "size": 350000
    }
  }
}
```

### 2. Delete Files
**DELETE** `/api/files`

Hapus file audio dan/atau album art dari server.

**Body:**
```json
{
  "audioPath": "/music/uploads/file.mp3",
  "albumArtPath": "/album-art/cover.jpg"
}
```

### 3. Health Check
**GET** `/api/health`

Cek status server.

**Response:**
```json
{
  "status": "ok",
  "message": "KinoVibes Backend API is running",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 📁 File Storage

Files disimpan di:
- Audio: `../public/music/uploads/`
- Album Art: `../public/album-art/`

## 🔒 Security Features

- File type validation (hanya audio dan image)
- File size limit (50MB max)
- CORS enabled untuk frontend
- Automatic directory creation

## 🛠️ Configuration

Edit `PORT` di file `.env`:
```
PORT=3001
NODE_ENV=development
```

## 📝 Notes

- Server otomatis create folder uploads jika belum ada
- Mendukung multiple file formats (MP3, WAV, OGG, M4A, AAC, FLAC)
- Image formats: JPG, PNG, WEBP, GIF
