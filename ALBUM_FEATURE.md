# 💿 Album Management Feature

## Overview

Fitur album management memungkinkan user untuk mengorganisir lagu-lagu ke dalam album, bukan hanya input text biasa.

## ✨ Features

### 1. **Album Selection saat Upload**
- Dropdown untuk memilih album yang sudah ada
- Option untuk membuat album baru
- Auto-populate artist dari album yang dipilih
- Album art otomatis dari lagu pertama di album

### 2. **Album Organization**
- Setiap album menyimpan:
  - Nama album
  - Artist
  - Cover art
  - Track count
  - Year & genre
  - Created & updated timestamps

### 3. **Auto Album Creation**
- Jika user pilih "Create New Album", album akan dibuat otomatis
- Album akan di-reuse jika sudah ada dengan nama & artist yang sama
- Track count auto-increment setiap ada lagu baru

## 🗂️ Database Structure

### Firestore Collection: `albums`
```javascript
{
  id: "album_id_123",
  name: "Album Name",
  artist: "Artist Name",
  year: 2025,
  genre: "Pop",
  coverArt: "/album-art/cover.jpg",
  userId: "user123",
  trackCount: 12,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Updated `music_library` Collection
```javascript
{
  // ... existing fields
  album: "Album Name",
  albumId: "album_id_123", // NEW: Reference to albums collection
  // ... other fields
}
```

## 🎯 User Flow

### Upload dengan Album Baru:
1. User click "Upload Music"
2. Select audio file & album art
3. Fill title & artist
4. Select "Create New Album" dari dropdown
5. Input nama album baru
6. Click "Upload"
7. ✅ Album dibuat otomatis dan lagu di-assign ke album tersebut

### Upload ke Album Existing:
1. User click "Upload Music"
2. Select audio file
3. Fill title
4. Select album dari dropdown
5. Artist auto-filled dari album
6. Click "Upload"
7. ✅ Lagu ditambahkan ke album, track count di-update

## 📖 API Reference

### Album API (`src/services/albumApi.js`)

#### `createAlbum(userId, albumData)`
Membuat album baru
```javascript
const album = await createAlbum(user.uid, {
  name: "My Album",
  artist: "Artist Name",
  coverArt: "/path/to/cover.jpg"
});
```

#### `getUserAlbums(userId)`
Get semua album milik user
```javascript
const albums = await getUserAlbums(user.uid);
```

#### `getOrCreateAlbum(albumName, artist, userId, coverArt)`
Get album yang sudah ada atau buat baru jika belum ada
```javascript
const album = await getOrCreateAlbum(
  "Album Name",
  "Artist",
  user.uid,
  coverUrl
);
```

#### `incrementTrackCount(albumId)`
Increment jumlah track di album
```javascript
await incrementTrackCount(albumId);
```

## 🔐 Security Rules

```javascript
// Albums Collection
match /albums/{albumId} {
  // Anyone can read
  allow read: if request.auth != null;
  
  // Only creator can write
  allow create: if request.auth != null 
                && request.resource.data.userId == request.auth.uid;
  allow update, delete: if request.auth != null 
                        && resource.data.userId == request.auth.uid;
}
```

## 🎨 UI Components

### Album Dropdown
```jsx
<select onChange={handleAlbumChange}>
  <option value="">Select album...</option>
  {albums.map(album => (
    <option key={album.id} value={album.id}>
      {album.name} - {album.artist}
    </option>
  ))}
  <option value="new">+ Create New Album</option>
</select>
```

### New Album Input (Conditional)
```jsx
{showNewAlbum && (
  <input
    name="album"
    placeholder="Enter new album name"
    required
  />
)}
```

## 🚀 Future Enhancements

### Planned Features:
1. **Album Detail Page**
   - View all songs in album
   - Edit album metadata
   - Change album cover

2. **Album Grid View**
   - Browse all albums
   - Sort by name, artist, date
   - Filter by genre

3. **Album Statistics**
   - Total duration
   - Most played album
   - Completion percentage

4. **Bulk Upload**
   - Upload multiple songs to same album
   - Auto-detect album from metadata

5. **Album Sharing**
   - Share album with other users
   - Public/private album settings

## 📝 Usage Examples

### Example 1: Upload First Song to New Album
```javascript
// User fills form:
// - Title: "Song 1"
// - Artist: "My Band"
// - Album: "Create New Album" → "Debut Album"
// - Genre: "Rock"

// System akan:
// 1. Create album "Debut Album" by "My Band"
// 2. Upload song dengan albumId reference
// 3. Set album coverArt dari song's album art
```

### Example 2: Add Song to Existing Album
```javascript
// User selects existing album "Debut Album"
// Artist auto-filled: "My Band"
// Upload song → trackCount incremented
```

## 🐛 Known Issues

1. ~~Album cover tidak update jika upload song tanpa album art~~ 
   → Fixed: Only updates if album has no cover

2. ~~Duplikat album jika typo di nama~~
   → Fixed: Case-sensitive matching, consider adding fuzzy search

## 📊 Benefits

✅ **Organized Library**: Lagu ter-group rapi per album
✅ **Consistent Metadata**: Artist & genre consistent dalam 1 album
✅ **Easy Navigation**: Browse by album, bukan scattered songs
✅ **Professional Look**: Mirip Spotify/Apple Music
✅ **Scalable**: Support ratusan album & ribuan lagu

---

**Created**: October 30, 2025  
**Status**: ✅ Production Ready  
**Firebase Rules**: ✅ Deployed
