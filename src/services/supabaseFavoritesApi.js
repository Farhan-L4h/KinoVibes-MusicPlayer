// Favorites Service - 100% Supabase
import { supabase } from '../config/supabase';

// Add song to favorites
export const addToFavorites = async (userId, musicId) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        music_id: musicId,
        added_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Check if already exists
      if (error.code === '23505') {
        console.log('Song already in favorites');
        return null;
      }
      throw error;
    }

    console.log('✅ Added to favorites');
    return data;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

// Remove song from favorites
export const removeFromFavorites = async (userId, musicId) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('music_id', musicId);

    if (error) throw error;
    
    console.log('✅ Removed from favorites');
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

// Get user's favorites
export const getUserFavorites = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        music:music_library(*)
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw error;
    
    return data?.map(fav => fav.music) || [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

// Check if song is favorited
export const isFavorite = async (userId, musicId) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('music_id', musicId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return !!data;
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

// Toggle favorite (add if not exists, remove if exists)
export const toggleFavorite = async (userId, musicId) => {
  try {
    const favorited = await isFavorite(userId, musicId);
    
    if (favorited) {
      await removeFromFavorites(userId, musicId);
      return false;
    } else {
      await addToFavorites(userId, musicId);
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};
