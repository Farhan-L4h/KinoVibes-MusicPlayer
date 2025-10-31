// Music Library Service - Supabase Storage + Firestore
// Manages music files in Supabase Storage with metadata in Firestore

import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  updateDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  uploadFile, 
  deleteFile, 
  BUCKETS,
  isSupabaseConfigured 
} from '../config/supabase';

// Collection reference for music metadata
const MUSIC_COLLECTION = 'music_library';

// Upload music to Supabase Storage and save metadata to Firestore
export const uploadMusic = async (audioFile, albumArtFile, lyricsFile, metadata, userId) => {
  try {
    if (!audioFile) throw new Error('Audio file is required');
    
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured. Please check your environment variables.');
    }
    
    console.log('🎵 Starting music upload to Supabase...');
    const timestamp = Date.now();
    const sanitizedFileName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Generate file paths
    const audioPath = `${userId}/${timestamp}_${sanitizedFileName}`;
    const albumArtPath = albumArtFile 
      ? `${userId}/${timestamp}_${albumArtFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}` 
      : null;
    const lyricsPath = lyricsFile
      ? `${userId}/${timestamp}_${lyricsFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      : null;
    
    // Upload audio file to Supabase Storage
    console.log('📤 Uploading audio to Supabase Storage...');
    const audioUpload = await uploadFile(BUCKETS.MUSIC, audioPath, audioFile);
    
    // Upload album art if provided
    let albumArtUpload = null;
    if (albumArtFile) {
      console.log('📤 Uploading album art...');
      albumArtUpload = await uploadFile(BUCKETS.ALBUM_ART, albumArtPath, albumArtFile);
    }
    
    // Upload lyrics if provided
    let lyricsUpload = null;
    if (lyricsFile) {
      console.log('📤 Uploading lyrics...');
      lyricsUpload = await uploadFile(BUCKETS.LYRICS, lyricsPath, lyricsFile);
    }
    
    console.log('💾 Saving metadata to Firestore...');
    // Save metadata to Firestore with Supabase URLs
    const musicData = {
      id: `supabase_${timestamp}`,
      title: metadata.title || 'Untitled',
      artist: metadata.artist || 'Unknown Artist',
      album: metadata.album || 'Unknown Album',
      albumId: metadata.albumId || null,
      genre: metadata.genre || 'Unknown',
      duration: metadata.duration || 0,
      audioUrl: audioUpload.publicUrl,
      audioPath: audioUpload.path, // For deletion
      albumArt: albumArtUpload?.publicUrl || '/default-album.jpg',
      albumArtPath: albumArtUpload?.path || null,
      lyricsUrl: lyricsUpload?.publicUrl || null,
      lyricsPath: lyricsUpload?.path || null,
      uploadedBy: userId,
      uploadedAt: serverTimestamp(),
      createdAt: new Date().toISOString(),
      fileName: sanitizedFileName,
      fileSize: audioFile.size,
      source: 'supabase',
      isFullTrack: true
    };
    
    const docRef = await addDoc(collection(db, MUSIC_COLLECTION), musicData);
    console.log('✅ Music uploaded successfully! Firestore ID:', docRef.id);
    
    return { ...musicData, firestoreId: docRef.id };
  } catch (error) {
    console.error('❌ Error uploading music:', error);
    throw error;
  }
};

// Get all music from library
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

// Search music library
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
    
    // If we have music, return the most recent ones
    if (allMusic.length > 0) {
      return allMusic.slice(0, 15);
    }
    
    // Return demo music if no music available
    return getDemoMusic();
  } catch (error) {
    console.error('Error getting trending music:', error);
    return getDemoMusic();
  }
};

// Get music by genre
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

// Get artist's tracks
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

// Delete music from Supabase Storage and Firestore
export const deleteMusic = async (firestoreId, audioPath, albumArtPath, lyricsPath) => {
  try {
    // Delete files from Supabase Storage
    if (audioPath) {
      await deleteFile(BUCKETS.MUSIC, audioPath);
      console.log('🗑️ Deleted audio from Supabase');
    }
    
    if (albumArtPath) {
      await deleteFile(BUCKETS.ALBUM_ART, albumArtPath);
      console.log('🗑️ Deleted album art from Supabase');
    }
    
    if (lyricsPath) {
      await deleteFile(BUCKETS.LYRICS, lyricsPath);
      console.log('🗑️ Deleted lyrics from Supabase');
    }
    
    // Delete metadata from Firestore
    await deleteDoc(doc(db, MUSIC_COLLECTION, firestoreId));
    console.log('🗑️ Music metadata deleted from Firestore');
    
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
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Music updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating music:', error);
    throw error;
  }
};

// Demo music data
export const getDemoMusic = () => {
  return [
    {
      id: 'demo1',
      title: "Chill Vibes",
      artist: "Demo Artist 1",
      album: "Demo Album",
      duration: 180,
      albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      audioUrl: "/music/demo/chill-vibes.mp3",
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
    }
  ];
};

// Utility functions
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

export const isValidAudioFile = (file) => {
  const validTypes = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
  const extension = getFileExtension(file.name);
  return validTypes.includes(extension) && file.type.startsWith('audio/');
};

export const isValidImageFile = (file) => {
  const validTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const extension = getFileExtension(file.name);
  return validTypes.includes(extension) && file.type.startsWith('image/');
};

export const isValidLyricsFile = (file) => {
  const validTypes = ['lrc', 'txt', 'json'];
  const extension = getFileExtension(file.name);
  return validTypes.includes(extension);
};
