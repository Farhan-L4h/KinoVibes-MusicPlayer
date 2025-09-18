// Local Music Library Service - Firebase Storage Integration
// Manages local music files stored in Firebase Storage and Firestore

import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Collection reference for music metadata
const MUSIC_COLLECTION = 'music_library';

// Upload music file to Firebase Storage and save metadata to Firestore
export const uploadMusic = async (audioFile, albumArtFile, metadata, userId) => {
  try {
    if (!audioFile) throw new Error('Audio file is required');
    
    const timestamp = Date.now();
    const audioFileName = `${timestamp}_${audioFile.name}`;
    const albumArtFileName = albumArtFile ? `${timestamp}_${albumArtFile.name}` : null;
    
    // Upload audio file
    const audioRef = ref(storage, `music/${userId}/${audioFileName}`);
    await uploadBytes(audioRef, audioFile);
    const audioUrl = await getDownloadURL(audioRef);
    
    // Upload album art if provided
    let albumArtUrl = null;
    if (albumArtFile) {
      const albumArtRef = ref(storage, `album-art/${userId}/${albumArtFileName}`);
      await uploadBytes(albumArtRef, albumArtFile);
      albumArtUrl = await getDownloadURL(albumArtRef);
    }
    
    // Save metadata to Firestore
    const musicData = {
      id: `local_${timestamp}`,
      title: metadata.title || 'Untitled',
      artist: metadata.artist || 'Unknown Artist',
      album: metadata.album || 'Unknown Album',
      genre: metadata.genre || 'Unknown',
      duration: metadata.duration || 0,
      audioUrl,
      albumArt: albumArtUrl,
      uploadedBy: userId,
      uploadedAt: new Date(),
      fileName: audioFileName,
      fileSize: audioFile.size,
      source: 'local',
      isFullTrack: true
    };
    
    const docRef = await addDoc(collection(db, MUSIC_COLLECTION), musicData);
    console.log('🎵 Music uploaded successfully:', docRef.id);
    
    return { ...musicData, firestoreId: docRef.id };
  } catch (error) {
    console.error('Error uploading music:', error);
    throw error;
  }
};

// Get all music from local library
export const getAllMusic = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, MUSIC_COLLECTION), orderBy('uploadedAt', 'desc'))
    );
    
    const musicList = [];
    querySnapshot.forEach((doc) => {
      musicList.push({
        ...doc.data(),
        firestoreId: doc.id
      });
    });
    
    return musicList;
  } catch (error) {
    console.error('Error getting music library:', error);
    throw error;
  }
};

// Search local music library
export const searchMusic = async (query, limit = 20) => {
  try {
    const allMusic = await getAllMusic();
    
    if (!query || query.trim() === '') return allMusic.slice(0, limit);
    
    const searchTerm = query.toLowerCase();
    const filteredMusic = allMusic.filter(song =>
      song.title.toLowerCase().includes(searchTerm) ||
      song.artist.toLowerCase().includes(searchTerm) ||
      song.album.toLowerCase().includes(searchTerm) ||
      song.genre.toLowerCase().includes(searchTerm)
    );
    
    return filteredMusic.slice(0, limit);
  } catch (error) {
    console.error('Error searching music:', error);
    throw error;
  }
};

// Get trending/featured music (recently uploaded or most popular)
export const getTrendingMusic = async () => {
  try {
    const allMusic = await getAllMusic();
    
    // If we have local music, return the most recent ones
    if (allMusic.length > 0) {
      return allMusic.slice(0, 15);
    }
    
    // Return demo music if no local music available
    return getDemoMusic();
  } catch (error) {
    console.error('Error getting trending music:', error);
    return getDemoMusic();
  }
};

// Get music by genre from local library
export const getMusicByGenre = async (genre) => {
  try {
    const allMusic = await getAllMusic();
    return allMusic.filter(song => 
      song.genre.toLowerCase().includes(genre.toLowerCase())
    );
  } catch (error) {
    console.error('Error getting music by genre:', error);
    throw error;
  }
};

// Get artist's tracks from local library
export const getArtistTopTracks = async (artistName) => {
  try {
    const allMusic = await getAllMusic();
    return allMusic.filter(song => 
      song.artist.toLowerCase().includes(artistName.toLowerCase())
    );
  } catch (error) {
    console.error('Error getting artist tracks:', error);
    throw error;
  }
};

// Delete music from Firebase Storage and Firestore
export const deleteMusic = async (firestoreId, audioUrl, albumArtUrl, userId) => {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, MUSIC_COLLECTION, firestoreId));
    
    // Delete audio file from Storage
    if (audioUrl) {
      const audioRef = ref(storage, audioUrl);
      await deleteObject(audioRef);
    }
    
    // Delete album art from Storage if exists
    if (albumArtUrl) {
      const albumArtRef = ref(storage, albumArtUrl);
      await deleteObject(albumArtRef);
    }
    
    console.log('🗑️ Music deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting music:', error);
    throw error;
  }
};

// Update music metadata
export const updateMusic = async (firestoreId, updates) => {
  try {
    const musicRef = doc(db, MUSIC_COLLECTION, firestoreId);
    await updateDoc(musicRef, {
      ...updates,
      updatedAt: new Date()
    });
    
    console.log('✅ Music updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating music:', error);
    throw error;
  }
};

// Demo music data - fallback when no local music is available
export const getDemoMusic = () => {
  return [
    {
      id: 'demo1',
      title: "Chill Vibes",
      artist: "Demo Artist 1",
      album: "Demo Album",
      duration: 180,
      albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      genre: "Electronic",
      isFullTrack: true,
      source: 'demo'
    },
    {
      id: 'demo2',
      title: "Summer Nights",
      artist: "Demo Artist 2", 
      album: "Demo Collection",
      duration: 220,
      albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      genre: "Pop",
      isFullTrack: true,
      source: 'demo'
    },
    {
      id: 'demo3',
      title: "Midnight Drive",
      artist: "Demo Artist 3",
      album: "Night Sessions", 
      duration: 195,
      albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      genre: "Synthwave",
      isFullTrack: true,
      source: 'demo'
    },
    {
      id: 'demo4',
      title: "Ocean Waves",
      artist: "Demo Artist 4",
      album: "Natural Sounds",
      duration: 240,
      albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop", 
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      genre: "Ambient",
      isFullTrack: true,
      source: 'demo'
    },
    {
      id: 'demo5',
      title: "City Lights", 
      artist: "Demo Artist 5",
      album: "Urban Collection",
      duration: 210,
      albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      genre: "Hip Hop",
      isFullTrack: true,
      source: 'demo'
    },
    {
      id: 'demo6',
      title: "Acoustic Dreams",
      artist: "Demo Artist 6",
      album: "Unplugged Sessions",
      duration: 267,
      albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
      genre: "Acoustic",
      isFullTrack: true,
      source: 'demo'
    },
    {
      id: 'demo7',
      title: "Electronic Pulse",
      artist: "Demo Artist 7",
      album: "Digital Waves",
      duration: 198,
      albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", 
      genre: "Electronic",
      isFullTrack: true,
      source: 'demo'
    },
    {
      id: 'demo8',
      title: "Jazz Interlude",
      artist: "Demo Artist 8",
      album: "Smooth Collection",
      duration: 234,
      albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
      genre: "Jazz",
      isFullTrack: true,
      source: 'demo'
    }
  ];
};

// Utility function to get file extension
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

// Utility function to validate audio file
export const isValidAudioFile = (file) => {
  const validTypes = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
  const extension = getFileExtension(file.name);
  return validTypes.includes(extension) && file.type.startsWith('audio/');
};

// Utility function to validate image file for album art
export const isValidImageFile = (file) => {
  const validTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const extension = getFileExtension(file.name);
  return validTypes.includes(extension) && file.type.startsWith('image/');
};

// Check if local music library is configured
export const isLocalLibraryConfigured = () => {
  return true; // Always true since we use Firebase
};