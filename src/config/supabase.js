import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const BUCKETS = {
  MUSIC: 'music',
  ALBUM_ART: 'album-art',
  LYRICS: 'lyrics',
};

const signedUrlCache = new Map();

export const getSignedUrl = async (bucket, path, expiresIn = 3600) => {
  if (!path) return null;
  const key = `${bucket}/${path}`;
  const cached = signedUrlCache.get(key);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.url;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  signedUrlCache.set(key, { url: data.signedUrl, expiresAt: Date.now() + expiresIn * 1000 });
  return data.signedUrl;
};

export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const uploadFile = async (bucket, path, file, options = {}) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: options.upsert || false,
    ...options,
  });
  if (error) throw error;
  return { path: data.path, publicUrl: getPublicUrl(bucket, data.path) };
};

export const deleteFile = async (bucket, path) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
  return true;
};

export const isSupabaseConfigured = () => !!(supabaseUrl && supabaseAnonKey);