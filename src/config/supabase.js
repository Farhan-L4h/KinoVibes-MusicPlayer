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
const pendingUrls = new Map();
const MAX_SIGNED_URLS = 200;
let authSubject;
let authGeneration = 0;

supabase.auth.onAuthStateChange((event, session) => {
  const subject = session?.user?.id || null;
  if (event === 'SIGNED_OUT' || subject !== authSubject) {
    authSubject = subject;
    authGeneration++;
    signedUrlCache.clear();
    pendingUrls.clear();
  }
});

export const invalidateSignedUrl = (bucket, path) => {
  for (const entries of [signedUrlCache, pendingUrls]) {
    for (const [key, entry] of entries) {
      if (entry.bucket === bucket && entry.path === path) entries.delete(key);
    }
  }
};

export const getSignedUrl = async (bucket, path, expiresIn = 3600) => {
  if (!path) return null;
  const key = JSON.stringify([bucket, path, expiresIn]);
  const now = Date.now();
  for (const [id, entry] of signedUrlCache) {
    if (entry.expiresAt <= now + 60_000) signedUrlCache.delete(id);
  }
  const cached = signedUrlCache.get(key);
  if (cached) {
    signedUrlCache.delete(key);
    signedUrlCache.set(key, cached);
    return cached.url;
  }
  if (pendingUrls.has(key)) return pendingUrls.get(key).promise;

  const generation = authGeneration;
  const entry = { bucket, path };
  let timeout;
  entry.promise = Promise.race([
    supabase.storage.from(bucket).createSignedUrl(path, expiresIn),
    new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new DOMException('Signed URL timeout', 'TimeoutError')), 15_000);
    }),
  ]).then(({ data, error }) => {
    if (generation !== authGeneration || pendingUrls.get(key) !== entry) {
      throw new DOMException('Signed URL invalidated', 'AbortError');
    }
    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Signed URL tidak tersedia');
    signedUrlCache.set(key, { bucket, path, url: data.signedUrl, expiresAt: now + expiresIn * 1000 });
    while (signedUrlCache.size > MAX_SIGNED_URLS) signedUrlCache.delete(signedUrlCache.keys().next().value);
    return data.signedUrl;
  }).finally(() => {
    clearTimeout(timeout);
    if (pendingUrls.get(key) === entry) pendingUrls.delete(key);
  });
  pendingUrls.set(key, entry);
  while (pendingUrls.size > MAX_SIGNED_URLS) pendingUrls.delete(pendingUrls.keys().next().value);
  return entry.promise;
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
  invalidateSignedUrl(bucket, path);
  return { path: data.path, publicUrl: getPublicUrl(bucket, data.path) };
};

export const deleteFile = async (bucket, path) => {
  invalidateSignedUrl(bucket, path);
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return true;
  } finally {
    invalidateSignedUrl(bucket, path);
  }
};

export const isSupabaseConfigured = () => !!(supabaseUrl && supabaseAnonKey);