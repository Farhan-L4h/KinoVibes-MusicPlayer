import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Storage bucket names
export const BUCKETS = {
  MUSIC: 'music',
  ALBUM_ART: 'album-art',
  LYRICS: 'lyrics'
};

// Helper to get public URL for uploaded file
export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// Upload file to Supabase Storage
export const uploadFile = async (bucket, path, file, options = {}) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: options.upsert || false,
        ...options
      });

    if (error) throw error;

    return {
      path: data.path,
      publicUrl: getPublicUrl(bucket, data.path)
    };
  } catch (error) {
    console.error(`Error uploading to ${bucket}:`, error);
    throw error;
  }
};

// Delete file from Supabase Storage
export const deleteFile = async (bucket, path) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting from ${bucket}:`, error);
    throw error;
  }
};

// Delete multiple files
export const deleteFiles = async (files) => {
  const deletePromises = files.map(({ bucket, path }) => 
    deleteFile(bucket, path)
  );
  
  return Promise.all(deletePromises);
};

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};
