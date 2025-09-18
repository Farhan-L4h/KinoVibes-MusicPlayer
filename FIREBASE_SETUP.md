# Firebase Setup untuk KinoVibe - Panduan Cepat

## ⚡ Setup Firebase dalam 5 Menit

### 1. Buat Firebase Project
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **"Create a project"**
3. Nama project: **kinovibe-music-app**
4. Disable Google Analytics (skip)
5. Klik **"Create project"**

### 2. Enable Authentication
1. Klik **"Authentication"** di sidebar
2. Klik **"Get started"**  
3. Tab **"Sign-in method"**
4. Enable **"Email/Password"**
5. Enable **"Google"** (isi email support)

### 3. Create Firestore Database
1. Klik **"Firestore Database"**
2. **"Create database"**
3. **"Start in test mode"**
4. Pilih lokasi terdekat

### 4. Setup Storage
1. Klik **"Storage"**
2. **"Get started"**
3. **"Start in test mode"**

### 5. Get Web App Config
1. Klik ⚙️ **"Project settings"**
2. Scroll ke **"Your apps"**
3. Klik **"Web"** icon `</>`
4. App name: **KinoVibe**
5. **"Register app"**
6. **Copy** konfigurasi yang muncul
7. Replace konfigurasi di `src/config/firebase.js`

### 6. Update Firebase Config
Ganti konfigurasi di `src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefgh"
};
```

### 7. Test Authentication
1. Restart dev server: `npm run dev`
2. Buka http://localhost:5174
3. Coba register atau login

## 🔧 Troubleshooting

**Error: "auth/api-key-not-valid"**
- Pastikan API key benar
- Check project ID sesuai

**Error: "auth/configuration-not-found"**
- Enable Authentication di Firebase Console
- Check authDomain benar

**Google Sign-in tidak work**
- Enable Google provider di Authentication
- Add authorized domain di Firebase Console

## 🚀 Setelah Setup
Firebase sudah siap! Anda bisa:
- Register akun baru
- Login dengan email/password  
- Login dengan Google
- Data user otomatis tersimpan di Firestore