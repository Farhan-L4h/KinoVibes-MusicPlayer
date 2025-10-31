# Upload Music dengan Playlist Selection

## Overview
Fitur upload music sekarang sudah dinamis dengan pilihan playlist! User bisa langsung memilih playlist mana saja yang ingin ditambahkan saat upload musik baru.

## Fitur Baru

### **Dynamic Playlist Selection dalam Upload Form**
Location: `src/components/MusicUpload.jsx`

**Apa yang ditambahkan:**
- ✅ Checkbox list playlist yang dinamis
- ✅ Load playlist user otomatis saat form dibuka
- ✅ Multiple selection - bisa pilih beberapa playlist sekaligus
- ✅ Menampilkan jumlah lagu di setiap playlist
- ✅ Auto-add ke playlist yang dipilih setelah upload berhasil
- ✅ Counter berapa playlist yang akan ditambahkan
- ✅ Empty state jika belum ada playlist

## Cara Kerja

### Flow Upload dengan Playlist:

1. **User membuka Upload form**
2. **System load playlist user** → `loadUserPlaylists(user.id)`
3. **User upload file audio** + isi metadata (title, artist, album, genre)
4. **User pilih playlist** → Centang checkbox playlist yang diinginkan
5. **User klik Upload Music**
6. **File terupload ke Supabase Storage**
7. **Data tersimpan di database music_library**
8. **Loop through selected playlists** → `addSongToPlaylist(playlistId, musicId)`
9. **Lagu otomatis masuk ke playlist yang dipilih** ✅

## UI Components

### Playlist Selection Box:
```
┌──────────────────────────────────┐
│ 🎵 Add to Playlists (Optional)   │
├──────────────────────────────────┤
│ ☑ Chill Vibes       12 songs     │
│ ☐ Workout Mix       25 songs     │
│ ☑ Study Focus       8 songs      │
│ ☐ Road Trip         15 songs     │
├──────────────────────────────────┤
│ Will be added to 2 playlists     │
└──────────────────────────────────┘
```

### Empty State (No Playlists):
```
┌──────────────────────────────────┐
│ 🎵 Add to Playlists (Optional)   │
├──────────────────────────────────┤
│     No playlists available       │
│     Create a playlist first      │
└──────────────────────────────────┘
```

## Kode Penting

### State Management:
```javascript
const [formData, setFormData] = useState({
  title: '',
  artist: '',
  album: '',
  genre: '',
  duration: 0,
  selectedPlaylists: [] // Array of playlist IDs
});
```

### Load Playlists:
```javascript
useEffect(() => {
  if (user?.id) {
    loadUserPlaylists(user.id);
  }
}, [user, loadUserPlaylists]);
```

### Toggle Playlist Selection:
```javascript
const handlePlaylistToggle = (playlistId) => {
  setFormData(prev => ({
    ...prev,
    selectedPlaylists: prev.selectedPlaylists.includes(playlistId)
      ? prev.selectedPlaylists.filter(id => id !== playlistId)
      : [...prev.selectedPlaylists, playlistId]
  }));
};
```

### Add to Playlists After Upload:
```javascript
// Add to selected playlists
if (formData.selectedPlaylists.length > 0 && result.id) {
  console.log('🎵 Adding song to selected playlists...');
  for (const playlistId of formData.selectedPlaylists) {
    try {
      await addSongToPlaylist(playlistId, result.id);
      console.log(`✅ Added to playlist: ${playlistId}`);
    } catch (playlistError) {
      console.error(`Failed to add to playlist ${playlistId}:`, playlistError);
    }
  }
}
```

## Features Detail

### 1. **Checkbox List Dinamis**
- Load dari database user's playlists
- Menampilkan nama playlist + jumlah lagu
- Smooth hover effect
- Max height dengan scroll untuk banyak playlist

### 2. **Multiple Selection**
- User bisa pilih 1 atau lebih playlist
- Checkbox state managed dengan array
- Indicator berapa playlist dipilih

### 3. **Validasi**
- Field playlist optional (tidak wajib)
- Upload tetap bisa dilakukan tanpa pilih playlist
- Jika ada playlist dipilih, otomatis ditambahkan setelah upload

### 4. **Error Handling**
- Jika gagal add ke playlist, tidak block upload
- Error log per playlist yang gagal
- Upload tetap sukses meski ada playlist error

## User Experience

### Scenario 1: Upload dengan Playlist
1. User upload lagu baru "Song A"
2. User centang "Chill Vibes" dan "Study Focus"
3. Klik Upload Music
4. ✅ Lagu uploaded ke library
5. ✅ Lagu otomatis masuk ke "Chill Vibes"
6. ✅ Lagu otomatis masuk ke "Study Focus"
7. Success message muncul

### Scenario 2: Upload tanpa Playlist
1. User upload lagu baru "Song B"
2. User tidak centang playlist apapun
3. Klik Upload Music
4. ✅ Lagu uploaded ke library
5. ✅ Lagu tidak masuk playlist manapun
6. Success message muncul

### Scenario 3: Belum Ada Playlist
1. User baru belum buat playlist
2. Buka Upload form
3. ✅ Muncul empty state "No playlists available"
4. User tetap bisa upload musik
5. Lagu masuk ke library

## Database Operations

### Tables Used:
- **music_library** - Menyimpan data musik
- **playlists** - Daftar playlist user
- **playlist_tracks** - Relasi many-to-many

### API Calls:
1. `loadUserPlaylists(userId)` - Load daftar playlist
2. `uploadMusic(...)` - Upload file dan metadata
3. `addSongToPlaylist(playlistId, musicId)` - Add ke playlist (loop)

## Benefits

✅ **Efficiency**: Upload dan organize dalam 1 step
✅ **Flexibility**: Bisa pilih multiple playlists sekaligus
✅ **Optional**: Tidak wajib, upload tetap bisa tanpa playlist
✅ **User Friendly**: Clear UI dengan counter dan labels
✅ **Error Tolerant**: Gagal add playlist tidak block upload
✅ **Real-time**: Playlist langsung ter-update

## Testing Checklist

- [x] Form load playlist user otomatis
- [x] Checkbox berfungsi untuk select/unselect
- [x] Multiple selection works
- [x] Counter update sesuai jumlah playlist dipilih
- [x] Upload berhasil tanpa pilih playlist
- [x] Upload berhasil dengan 1 playlist
- [x] Upload berhasil dengan multiple playlists
- [x] Lagu masuk ke playlist yang dipilih
- [x] Empty state muncul jika belum ada playlist
- [x] Form reset setelah upload sukses

## Files Modified

### Updated:
- ✅ `src/components/MusicUpload.jsx` - Added playlist selection UI and logic

### Imports Added:
```javascript
import { usePlaylistStore } from '../stores/playlist';
import { ListMusic } from 'lucide-react';
```

### Dependencies Used:
- ✅ `src/stores/playlist.js` - loadUserPlaylists, addSongToPlaylist
- ✅ `src/services/supabasePlaylistApi.js` - Backend API calls

## Success! 🎉

Upload form sekarang sudah **fully dynamic** dengan playlist selection!

User bisa:
- ✅ Lihat semua playlist mereka di form upload
- ✅ Pilih multiple playlist sekaligus
- ✅ Upload music langsung masuk ke playlist yang dipilih
- ✅ Upload tetap bisa tanpa pilih playlist
- ✅ Tracking berapa playlist yang akan ditambahkan

**Dev server ready at: http://localhost:5173/**

Selamat mencoba! 🎵
