// Local Music Library Service - Local Storage + Firestore
// Manages local music files stored in project folder with metadata in Firestore

import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Collection reference for music metadata
const MUSIC_COLLECTION = 'music_library';

// Local storage paths
const MUSIC_BASE_PATH = '/music/uploads/';
const ALBUM_ART_BASE_PATH = '/album-art/';
const DEMO_MUSIC_PATH = '/music/demo/';

// Backend API URL
const API_BASE_URL = 'http://localhost:3001';

// Save music file to local project folder and metadata to Firestore
export const uploadMusic = async (audioFile, albumArtFile, metadata, userId) => {
  try {
    if (!audioFile) throw new Error('Audio file is required');
    
    console.log('🎵 Starting music upload process...');
    const timestamp = Date.now();
    const sanitizedFileName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const audioFileName = `${userId}_${timestamp}_${sanitizedFileName}`;
    const albumArtFileName = albumArtFile 
      ? `${userId}_${timestamp}_${albumArtFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}` 
      : null;
    
    // Construct local file paths (relative to public folder)
    const audioPath = `${MUSIC_BASE_PATH}${audioFileName}`;
    const albumArtPath = albumArtFile ? `${ALBUM_ART_BASE_PATH}${albumArtFileName}` : null;
    
    console.log('📤 Uploading files to backend API...');
    
    // Upload files to backend API
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('audioFileName', audioFileName);
    
    if (albumArtFile) {
      formData.append('albumArt', albumArtFile);
      formData.append('albumArtFileName', albumArtFileName);
    }
    
    // Upload to backend
    const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.message || 'File upload failed');
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Files uploaded successfully:', uploadResult);
    
    console.log('💾 Saving metadata to Firestore...');
    // Save metadata to Firestore (file paths instead of Firebase URLs)
    const musicData = {
      id: `local_${timestamp}`,
      title: metadata.title || 'Untitled',
      artist: metadata.artist || 'Unknown Artist',
      album: metadata.album || 'Unknown Album',
      albumId: metadata.albumId || null,
      genre: metadata.genre || 'Unknown',
      duration: metadata.duration || 0,
      audioUrl: audioPath, // Local path instead of Firebase URL
      albumArt: albumArtPath,
      uploadedBy: userId,
      uploadedAt: new Date(),
      fileName: audioFileName,
      fileSize: audioFile.size,
      source: 'local',
      isFullTrack: true
    };
    
    const docRef = await addDoc(collection(db, MUSIC_COLLECTION), musicData);
    console.log('🎵 Music metadata saved successfully:', docRef.id);
    
    return { ...musicData, firestoreId: docRef.id };
  } catch (error) {
    console.error('❌ Error uploading music:', error);
    
    if (error.message?.includes('Firebase') || error.message?.includes('Firestore')) {
      throw new Error('Database service temporarily unavailable. Please try again.');
    }
    
    if (error.message?.includes('fetch') || error.message?.includes('upload')) {
      throw new Error('Backend API not available. Please make sure the server is running on port 3001.');
    }
    
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

// Delete music metadata from Firestore and files from server
export const deleteMusic = async (firestoreId, audioUrl, albumArtUrl) => {
  try {
    // Delete files from backend
    if (audioUrl || albumArtUrl) {
      try {
        const deleteResponse = await fetch(`${API_BASE_URL}/api/files`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            audioPath: audioUrl,
            albumArtPath: albumArtUrl
          })
        });
        
        if (deleteResponse.ok) {
          console.log('✅ Files deleted from server');
        } else {
          console.warn('⚠️ Failed to delete files from server');
        }
      } catch (error) {
        console.warn('⚠️ Backend API not available, files not deleted:', error.message);
      }
    }
    
    // Delete metadata from Firestore
    await deleteDoc(doc(db, MUSIC_COLLECTION, firestoreId));
    console.log('🗑️ Music metadata deleted successfully');
    
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

// Demo music data - uses local or external demo files
export const getDemoMusic = () => {
  return [
    {
      id: 'demo1',
      title: "Chill Vibes",
      artist: "Demo Artist 1",
      album: "Demo Album",
      duration: 180,
      albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      audioUrl: "/music/demo/chill-vibes.mp3", // Local demo file (or fallback to external)
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
      audioUrl: "/music/demo/summer-nights.mp3",
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
      audioUrl: "/music/demo/midnight-drive.mp3",
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
      audioUrl: "/music/demo/ocean-waves.mp3",
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
      audioUrl: "/music/demo/city-lights.mp3",
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
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // External fallback
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
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", 
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
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
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
  return true; // Always true since we use local storage + Firestore
};

// Get list of pending files (files that need to be saved manually)
export const getPendingFiles = () => {
  const audioFiles = JSON.parse(localStorage.getItem('pending_audio_files') || '[]');
  const albumArtFiles = JSON.parse(localStorage.getItem('pending_album_art_files') || '[]');
  return {
    audioFiles,
    albumArtFiles,
    total: audioFiles.length + albumArtFiles.length
  };
};

// Clear pending files after they've been saved
export const clearPendingFiles = () => {
  localStorage.removeItem('pending_audio_files');
  localStorage.removeItem('pending_album_art_files');
  console.log('✅ Pending files cleared');
};