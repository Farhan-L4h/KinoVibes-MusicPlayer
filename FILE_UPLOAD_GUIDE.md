# 📁 File Upload Guide - KinoVibes Music Player

## 🚨 Important: Current File Storage Limitation

**The music player currently cannot automatically save uploaded files to the server filesystem because we're running a client-side-only application.**

### Why Files Won't Play Immediately?

1. **Browser Limitation**: JavaScript running in the browser cannot write files directly to the server's filesystem for security reasons
2. **Temporary Storage**: Uploaded files are temporarily stored in browser's localStorage (which has a size limit)
3. **Manual Step Required**: Files need to be manually saved to the correct folders

---

## ✅ How to Upload Music (Current Workaround)

### Step 1: Upload Music Through the App
1. Go to **Upload** page in the app
2. Fill in all the music details (title, artist, album, genre)
3. Select your audio file (.mp3, .wav, etc.)
4. Select album art image (optional)
5. Click **Upload Music**
6. Metadata will be saved to Firestore ✅

### Step 2: Download the Files
After uploading, you'll see a **notification button** in the bottom-right corner showing "X files pending".

1. Click the notification button
2. A modal will open showing all pending files
3. Click **"Download All"** or download individual files
4. The files will be downloaded to your computer's Downloads folder

### Step 3: Save Files to Project Folders

**For Audio Files:**
```bash
# Copy downloaded audio files to:
/mnt/Files/Document/PROJECT/KinoVibes-MusicPlayer/public/music/uploads/

# Keep the EXACT filename as downloaded!
# Example: userId_1234567890_8_Letters.mp3
```

**For Album Art:**
```bash
# Copy downloaded image files to:
/mnt/Files/Document/PROJECT/KinoVibes-MusicPlayer/public/album-art/

# Keep the EXACT filename as downloaded!
# Example: userId_1234567890_cover.jpg
```

### Step 4: Refresh the App
After copying files to the correct folders:
1. Refresh the browser (F5 or Ctrl+R)
2. Your music should now be playable! 🎵

---

## 📂 Folder Structure

```
public/
├── music/
│   ├── demo/           # Demo music files (optional)
│   └── uploads/        # ⭐ YOUR UPLOADED MUSIC FILES GO HERE
└── album-art/          # ⭐ YOUR ALBUM ART IMAGES GO HERE
```

---

## 🔧 Alternative Solution: Backend API

For a production-ready solution, you need a backend API to handle file uploads. See `BACKEND_SETUP.md` for details.

### Quick Setup with Node.js + Express:

```bash
# Create backend folder
cd /mnt/Files/Document/PROJECT/KinoVibes-MusicPlayer
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express multer cors dotenv

# Create server.js (see BACKEND_SETUP.md for full code)
```

Once the backend is running, you can update the `uploadMusic()` function in `musicApi.js` to send files via API:

```javascript
// Instead of saving to localStorage:
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('albumArt', albumArtFile);

const response = await fetch('http://localhost:3001/api/upload', {
  method: 'POST',
  body: formData
});
```

---

## 🎯 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Upload Form | ✅ Working | Can select files and enter metadata |
| Firestore Metadata | ✅ Working | Song info saved to database |
| Album Management | ✅ Working | Albums created and linked |
| File Download Helper | ✅ Working | Shows pending files notification |
| Automatic File Save | ❌ Not Available | Manual step required |
| Music Playback | ⚠️ Manual Setup | Works after files copied to folders |
| Album Art Display | ⚠️ Manual Setup | Works after files copied to folders |

---

## 💡 Quick Tips

### 1. Check Pending Files
Look for the **floating button** in bottom-right corner showing number of pending files

### 2. File Naming Convention
Files are automatically named as:
```
{userId}_{timestamp}_{originalFilename}
```
Example: `abc123_1234567890_MySong.mp3`

**Never rename the files!** The app uses these exact filenames to match with database records.

### 3. Verify Files Are Saved
After copying files, check:
```bash
ls public/music/uploads/
ls public/album-art/
```

You should see your files there.

### 4. Demo Music
For testing without uploading, you can:
1. Add demo MP3 files to `public/music/demo/`
2. Update the demo music array in `musicApi.js`

---

## 🐛 Troubleshooting

### Problem: "Music won't play"
**Solution:**
1. Check if file exists in `public/music/uploads/` folder
2. Check browser console for 404 errors
3. Verify filename matches exactly with database record

### Problem: "Album art not showing"
**Solution:**
1. Check if image exists in `public/album-art/` folder
2. Check browser console for image loading errors
3. Try clearing browser cache

### Problem: "Pending files disappeared"
**Solution:**
- localStorage might be cleared
- Check Downloads folder for previously downloaded files
- Re-upload if needed

### Problem: "File size too large"
**Solution:**
- localStorage has ~5-10MB limit per file
- Use smaller files or implement backend API
- Consider compressing audio files

---

## 📚 Related Documentation

- `BACKEND_SETUP.md` - Full backend API implementation guide
- `STORAGE_ARCHITECTURE.md` - Storage system architecture
- `ALBUM_FEATURE.md` - Album management feature details
- `SETUP_CHECKLIST.md` - Initial setup checklist

---

## 🚀 Future Improvements

1. **Backend API**: Automatic file uploads without manual steps
2. **Cloud Storage**: Optional integration with AWS S3/Cloudinary
3. **CDN**: Content delivery network for faster streaming
4. **Compression**: Automatic audio compression
5. **Progress Tracking**: Real-time upload progress indicator

---

**Last Updated**: January 2025
**Version**: 1.0.0
