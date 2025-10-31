# 🎤 Lyrics Upload Feature

## ✨ New Feature: Upload Lyrics File

Sekarang kamu bisa upload file lyrics bersamaan dengan lagu!

---

## 📝 Supported Formats

### 1. **LRC Format** (Recommended) ⭐
File dengan timestamp untuk synced lyrics.

**Example: `song.lrc`**
```lrc
[00:12.00]Line 1 of lyrics
[00:17.20]Line 2 of lyrics
[00:21.10]Line 3 of lyrics
[ti:Song Title]
[ar:Artist Name]
[al:Album Name]
```

### 2. **Plain Text** (.txt)
Simple text format, no timestamps.

**Example: `song.txt`**
```txt
Line 1 of lyrics
Line 2 of lyrics
Line 3 of lyrics
```

### 3. **JSON Format** (.json)
Structured data format.

**Example: `song.json`**
```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "lines": [
    {
      "time": 12.0,
      "text": "Line 1 of lyrics"
    },
    {
      "time": 17.2,
      "text": "Line 2 of lyrics"
    }
  ]
}
```

---

## 🚀 How to Upload

1. **Open Upload Form**
   - Click "Upload Music" button
   - Or click "+" in Library page

2. **Fill Required Fields**
   - Audio File (required) ✅
   - Title (required) ✅
   - Artist (required) ✅
   - Album (required) ✅
   - Genre

3. **Add Optional Files**
   - Album Art (image) 🖼️
   - **Lyrics File** 📝 ⭐ NEW!

4. **Select Lyrics File**
   - Click "Click to select lyrics file"
   - Choose `.lrc`, `.txt`, or `.json` file
   - Max file size: 1MB

5. **Upload**
   - Click "Upload Music"
   - Files will be saved to:
     - Audio → `public/music/uploads/`
     - Album Art → `public/album-art/`
     - Lyrics → `public/lyrics/` ⭐

---

## 📂 File Storage

Lyrics files tersimpan di:
```
public/
└── lyrics/
    └── userId_timestamp_filename.lrc  ⭐ YOUR LYRICS FILES HERE
```

File naming convention:
```
{userId}_{timestamp}_{originalFilename}
```

Example:
```
abc123_1730304521000_song_lyrics.lrc
```

---

## 🔍 How It Works

### Backend (server.js):
1. Receive lyrics file via multipart/form-data
2. Validate file extension (.lrc, .txt, .json)
3. Rename file with sanitized name from client
4. Save to `public/lyrics/` folder
5. Return file path

### Frontend (MusicUpload.jsx):
1. User selects lyrics file
2. Validate file type and size
3. Send to backend via FormData
4. Save lyrics path to Firestore metadata

### Firestore (music_library collection):
```javascript
{
  title: "Song Title",
  artist: "Artist Name",
  audioUrl: "/music/uploads/...",
  albumArt: "/album-art/...",
  lyricsUrl: "/lyrics/userId_timestamp_filename.lrc", // ⭐ NEW FIELD
  // ... other fields
}
```

---

## 🎯 API Endpoint

### Upload Endpoint
**POST** `/api/upload`

**FormData fields:**
- `audio` (file) - Audio file
- `audioFileName` (string) - Custom audio filename
- `albumArt` (file) - Album art image (optional)
- `albumArtFileName` (string) - Custom album art filename
- **`lyrics` (file)** - Lyrics file (optional) ⭐
- **`lyricsFileName` (string)** - Custom lyrics filename ⭐

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
    },
    "lyrics": {
      "filename": "userId_timestamp_lyrics.lrc",
      "path": "/lyrics/userId_timestamp_lyrics.lrc",
      "size": 5000
    }
  }
}
```

---

## 🛠️ Technical Details

### File Validation:
- **Extensions:** .lrc, .txt, .json only
- **Max Size:** 1MB
- **MIME Types:** text/plain, application/json

### Upload Process:
```
1. Frontend validates file (extension + size)
2. FormData with 3 files sent to backend
3. Multer receives & stores temporarily
4. Backend renames with sanitized filename
5. Moves to public/lyrics/ folder
6. Returns lyrics path
7. Frontend saves path to Firestore
```

### Backend Code (server.js):
```javascript
// Lyrics directory
const lyricsDir = path.join(__dirname, '../public/lyrics');

// Multer storage
destination: (req, file, cb) => {
  if (file.fieldname === 'lyrics') {
    cb(null, lyricsDir);
  }
}

// File filter
if (file.fieldname === 'lyrics') {
  const allowedLyricsTypes = /lrc|txt|json/;
  const extname = allowedLyricsTypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) cb(null, true);
}

// Upload handler
if (req.files.lyrics) {
  const tempPath = req.files.lyrics[0].path;
  const desiredFilename = req.body.lyricsFileName;
  const finalPath = path.join(lyricsDir, desiredFilename);
  fs.renameSync(tempPath, finalPath);
}
```

---

## 📊 File Structure

```
KinoVibes-MusicPlayer/
├── backend/
│   └── server.js            # ⭐ Updated - Handle lyrics upload
├── public/
│   ├── music/
│   │   └── uploads/         # Audio files
│   ├── album-art/           # Album art images
│   └── lyrics/              # ⭐ NEW - Lyrics files
└── src/
    ├── components/
    │   └── MusicUpload.jsx  # ⭐ Updated - Lyrics field added
    └── services/
        └── musicApi.js      # ⭐ Updated - Upload with lyrics
```

---

## 🔄 Migration

### Backend Restart Required:
Setelah update backend code, restart server:

```bash
# Stop backend (Ctrl+C)

# Start backend again
cd backend
node server.js
```

Output should show:
```
🚀 KinoVibes Backend API Server
================================
📡 Server running on http://localhost:3001
📁 Upload directory: .../public/music/uploads
🖼️  Album art directory: .../public/album-art
📝 Lyrics directory: .../public/lyrics  ⭐ NEW
================================
```

---

## ✅ Testing

1. **Restart Backend**
   ```bash
   cd backend && node server.js
   ```

2. **Upload New Song**
   - Go to Upload page
   - Select audio file
   - Select album art (optional)
   - **Select lyrics file** (.lrc, .txt, or .json) ⭐
   - Fill metadata
   - Click Upload

3. **Verify Files**
   ```bash
   # Check lyrics folder
   ls -lh public/lyrics/
   ```

4. **Check Firestore**
   - Open Firebase Console
   - Go to Firestore Database
   - Check `music_library` collection
   - Verify `lyricsUrl` field exists ✅

---

## 🐛 Troubleshooting

### Problem: "Only .lrc, .txt, or .json files are allowed for lyrics!"
**Solution:** Make sure file extension is `.lrc`, `.txt`, or `.json`

### Problem: "Lyrics file is too large. Maximum size is 1MB."
**Solution:** Compress lyrics file or remove unnecessary content

### Problem: Lyrics file not uploaded
**Solution:**
1. Check backend console for errors
2. Verify backend is running on port 3001
3. Check file permissions on `public/lyrics/` folder

### Problem: lyricsUrl not saved to Firestore
**Solution:**
1. Check browser console for errors
2. Verify Firestore rules allow write to `music_library`
3. Check if lyricsFile state is set before upload

---

## 🎵 Next Steps

1. ✅ Lyrics upload feature implemented
2. ✅ Backend supports .lrc, .txt, .json formats
3. ✅ Files saved to `public/lyrics/`
4. ✅ Lyrics path saved to Firestore
5. ⏭️ TODO: Display lyrics in Lyrics component
6. ⏭️ TODO: Sync lyrics with music playback
7. ⏭️ TODO: LRC parser for timed lyrics

---

**Status: READY TO USE** ✅  
**Backend Updated:** ✅  
**Frontend Updated:** ✅  
**Storage Ready:** ✅  

Silahkan test upload lagu dengan lyrics sekarang! 🎤
