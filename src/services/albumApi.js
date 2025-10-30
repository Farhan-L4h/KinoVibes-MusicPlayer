// Album Management Service
// Manages albums stored in Firestore

import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const ALBUMS_COLLECTION = 'albums';

// Create new album
export const createAlbum = async (userId, albumData) => {
  try {
    const album = {
      name: albumData.name,
      artist: albumData.artist || 'Unknown Artist',
      year: albumData.year || new Date().getFullYear(),
      genre: albumData.genre || 'Unknown',
      coverArt: albumData.coverArt || null,
      userId,
      trackCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, ALBUMS_COLLECTION), album);
    console.log('✅ Album created:', docRef.id);
    
    return { id: docRef.id, ...album };
  } catch (error) {
    console.error('Error creating album:', error);
    throw error;
  }
};

// Get all albums for a user
export const getUserAlbums = async (userId) => {
  try {
    const albumsQuery = query(
      collection(db, ALBUMS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(albumsQuery);
    const albums = [];
    
    querySnapshot.forEach((doc) => {
      albums.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by updatedAt manually (client-side sorting)
    albums.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || 0;
      const bTime = b.updatedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return albums;
  } catch (error) {
    console.error('Error getting user albums:', error);
    throw error;
  }
};

// Get all unique albums from music library
export const getAllAlbums = async () => {
  try {
    const albumsQuery = query(
      collection(db, ALBUMS_COLLECTION),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(albumsQuery);
    const albums = [];
    
    querySnapshot.forEach((doc) => {
      albums.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return albums;
  } catch (error) {
    console.error('Error getting albums:', error);
    throw error;
  }
};

// Update album
export const updateAlbum = async (albumId, updates) => {
  try {
    const albumRef = doc(db, ALBUMS_COLLECTION, albumId);
    await updateDoc(albumRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Album updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating album:', error);
    throw error;
  }
};

// Increment track count
export const incrementTrackCount = async (albumId) => {
  try {
    const albumsQuery = query(
      collection(db, ALBUMS_COLLECTION),
      where('name', '==', albumId)
    );
    
    const querySnapshot = await getDocs(albumsQuery);
    
    if (!querySnapshot.empty) {
      const albumDoc = querySnapshot.docs[0];
      const currentCount = albumDoc.data().trackCount || 0;
      
      await updateDoc(albumDoc.ref, {
        trackCount: currentCount + 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error incrementing track count:', error);
  }
};

// Delete album
export const deleteAlbum = async (albumId) => {
  try {
    await deleteDoc(doc(db, ALBUMS_COLLECTION, albumId));
    console.log('🗑️ Album deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting album:', error);
    throw error;
  }
};

// Get album by name (for checking if exists)
export const getAlbumByName = async (albumName, artist) => {
  try {
    let albumsQuery = query(
      collection(db, ALBUMS_COLLECTION),
      where('name', '==', albumName)
    );
    
    if (artist) {
      albumsQuery = query(
        collection(db, ALBUMS_COLLECTION),
        where('name', '==', albumName),
        where('artist', '==', artist)
      );
    }

    const querySnapshot = await getDocs(albumsQuery);
    
    if (!querySnapshot.empty) {
      const albumDoc = querySnapshot.docs[0];
      return {
        id: albumDoc.id,
        ...albumDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting album by name:', error);
    throw error;
  }
};

// Get or create album (helper function for upload)
export const getOrCreateAlbum = async (albumName, artist, userId, coverArt = null) => {
  try {
    // Check if album already exists
    const existingAlbum = await getAlbumByName(albumName, artist);
    
    if (existingAlbum) {
      // Update cover art if provided and not set
      if (coverArt && !existingAlbum.coverArt) {
        await updateAlbum(existingAlbum.id, { coverArt });
      }
      return existingAlbum;
    }
    
    // Create new album
    const newAlbum = await createAlbum(userId, {
      name: albumName,
      artist,
      coverArt
    });
    
    return newAlbum;
  } catch (error) {
    console.error('Error getting or creating album:', error);
    throw error;
  }
};
