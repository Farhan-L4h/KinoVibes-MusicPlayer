# ✅ Setup Checklist - KinoVibes Music Player

Gunakan checklist ini untuk memastikan aplikasi sudah siap digunakan.

---

## 📋 Pre-Setup

- [ ] Node.js 18+ terinstall
- [ ] npm atau yarn terinstall
- [ ] Git terinstall
- [ ] Firebase account sudah ada
- [ ] Text editor (VS Code recommended)

---

## 🔧 Initial Setup

### 1. Clone & Install
```bash
- [ ] git clone https://github.com/Farhan-L4h/KinoVibes-MusicPlayer.git
- [ ] cd KinoVibes-MusicPlayer
- [ ] npm install
```

### 2. Firebase Setup
- [ ] Buat project baru di [Firebase Console](https://console.firebase.google.com/)
- [ ] Enable Authentication (Email/Password)
- [ ] Enable Firestore Database
- [ ] Copy Firebase config

### 3. Environment Variables
- [ ] Create file `.env` di root folder
- [ ] Copy Firebase config ke `.env`:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
- [ ] Verify `.env` is in `.gitignore`

### 4. Firebase CLI Setup
```bash
- [ ] npm install -g firebase-tools
- [ ] firebase login
- [ ] firebase init (select Firestore)
- [ ] firebase deploy --only firestore
```

### 5. Verify Deployment
- [ ] Check Firestore rules deployed di Firebase Console
- [ ] Verify collections: `music_library`, `playlists`
- [ ] Check Authentication enabled

---

## 🎵 Demo Music (Optional)

### Option 1: Use External URLs (Default)
- [ ] No action needed - app uses external demo URLs

### Option 2: Add Local Demo Files
- [ ] Download free music (MP3 format)
- [ ] Rename files:
  - [ ] `chill-vibes.mp3`
  - [ ] `summer-nights.mp3`
  - [ ] `midnight-drive.mp3`
  - [ ] `ocean-waves.mp3`
  - [ ] `city-lights.mp3`
- [ ] Copy to `/public/music/demo/`
- [ ] Verify files accessible

**Free Music Sources:**
- [Free Music Archive](https://freemusicarchive.org/)
- [Incompetech](https://incompetech.com/music/)
- [Bensound](https://www.bensound.com/)

---

## 🚀 Development

### Run Dev Server
```bash
- [ ] npm run dev
- [ ] Open http://localhost:5173
- [ ] Verify app loads without errors
```

### Test Basic Features
- [ ] Register new account
- [ ] Login with account
- [ ] View home page
- [ ] Click demo songs
- [ ] Test music playback
- [ ] Test pause/play
- [ ] Test volume control
- [ ] Test next/previous
- [ ] Test search functionality

### Test Upload (Metadata Only)
- [ ] Click "Upload Music"
- [ ] Select audio file
- [ ] Fill metadata
- [ ] Click upload
- [ ] Check console for file info
- [ ] Verify metadata saved to Firestore

### Test Playlists
- [ ] Create new playlist
- [ ] Add songs to playlist
- [ ] Remove songs from playlist
- [ ] Delete playlist
- [ ] Verify changes in Firestore

---

## 📦 Production Setup (Optional)

### Option 1: Static Hosting (Vercel/Netlify)
```bash
- [ ] npm run build
- [ ] Test build: npm run preview
- [ ] Upload dist/ to hosting
```

**Limitations:**
- ⚠️ File upload won't work automatically
- ⚠️ Users need to manually save files

### Option 2: With Backend API

#### Backend Setup
- [ ] Choose backend (Node.js/Express recommended)
- [ ] Follow `BACKEND_SETUP.md`
- [ ] Create upload endpoint
- [ ] Test file upload locally
- [ ] Deploy backend to hosting

#### Frontend Update
- [ ] Update `src/services/musicApi.js`
- [ ] Change `saveFileLocally` to call backend API
- [ ] Update API URL to production
- [ ] Test upload flow
- [ ] Build and deploy

---

## 🧪 Testing Checklist

### Before Deployment
- [ ] All features work in dev mode
- [ ] No console errors
- [ ] Authentication flow works
- [ ] Music playback works
- [ ] Playlists work
- [ ] Search works
- [ ] Build succeeds: `npm run build`
- [ ] Preview works: `npm run preview`

### After Deployment
- [ ] App loads on production URL
- [ ] Login/Register works
- [ ] Music playback works
- [ ] Firestore queries work
- [ ] No 404 errors (check Network tab)
- [ ] Test on mobile device
- [ ] Test on different browsers

---

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
- [ ] Clear node_modules: `rm -rf node_modules && npm install`
- [ ] Clear cache: `npm run clean` (if exists)
- [ ] Check Node version: `node --version` (should be 18+)

#### Firebase Errors
- [ ] Verify .env file exists and has correct values
- [ ] Check Firebase project ID matches
- [ ] Deploy rules: `firebase deploy --only firestore`
- [ ] Check Firebase Console for errors

#### File Upload Issues
- [ ] Check browser console for logs
- [ ] Verify localStorage not full
- [ ] Check file size limits (<50MB audio)
- [ ] Check file format (MP3, WAV, etc.)

#### Music Playback Issues
- [ ] Check file path is correct
- [ ] Verify file exists in public folder
- [ ] Check browser console for 404 errors
- [ ] Test with demo songs first

#### Playlist Issues
- [ ] Verify user is logged in
- [ ] Check Firestore rules deployed
- [ ] Check Firebase Console → Firestore
- [ ] Verify userId matches auth user

---

## 📚 Documentation Reference

- [ ] Read `README.md` - General overview
- [ ] Read `STORAGE_ARCHITECTURE.md` - Storage system details
- [ ] Read `BACKEND_SETUP.md` - Backend API setup
- [ ] Read `MIGRATION_SUMMARY.md` - Changes summary
- [ ] Check `/public/music/demo/README.md` - Demo music guide
- [ ] Check `/public/lyrics/README.md` - Lyrics format guide

---

## 🎉 Ready to Go!

Once all checkboxes are checked, your app is ready!

### Next Steps:
1. Share with friends
2. Add more features
3. Customize UI
4. Setup backend for production
5. Deploy to hosting

---

## 📞 Need Help?

- Check documentation files
- Open issue on GitHub
- Check Firebase Console logs
- Review browser console errors

---

**Last Updated**: October 30, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready (with backend for uploads)
