import { supabase } from '../config/supabase';

const transformAlbum = (row) => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  artist: row.artist,
  coverArt: row.cover_art,
  year: row.year,
  trackCount: row.track_count || 0,
  createdAt: row.created_at,
});

export const createAlbum = async (userId, albumData) => {
  const { data, error } = await supabase
    .from('albums')
    .insert({
      user_id: userId,
      name: albumData.name,
      artist: albumData.artist || 'Unknown Artist',
      cover_art: albumData.coverArt || null,
      year: albumData.year || new Date().getFullYear(),
      track_count: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return transformAlbum(data);
};

export const getUserAlbums = async (userId) => {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformAlbum);
};

export const updateAlbum = async (albumId, updates) => {
  const { data, error } = await supabase
    .from('albums')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', albumId)
    .select()
    .single();
  if (error) throw error;
  return transformAlbum(data);
};

export const deleteAlbum = async (albumId) => {
  const { error } = await supabase.from('albums').delete().eq('id', albumId);
  if (error) throw error;
  return true;
};

export const getAlbumTracks = async (userId, albumName) => {
  const { data, error } = await supabase
    .from('music_library')
    .select('*')
    .eq('user_id', userId)
    .ilike('album', albumName)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const syncAlbumTrackCount = async (albumId, count) => {
  await supabase.from('albums').update({ track_count: count }).eq('id', albumId);
};

// Merge explicit album rows with album groups derived from track metadata,
// so every uploaded album shows up even without an albums row.
export const buildAlbumList = (albums, tracks) => {
  const byName = new Map();
  for (const album of albums) {
    byName.set(album.name.toLowerCase(), { ...album, trackCount: 0, derived: false });
  }
  for (const track of tracks) {
    const name = track.album || 'Unknown Album';
    const key = name.toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, {
        id: `derived:${key}`,
        name,
        artist: track.artist,
        coverArt: track.albumArt || null,
        year: null,
        trackCount: 0,
        derived: true,
      });
    }
    const entry = byName.get(key);
    entry.trackCount += 1;
    if (!entry.coverArt && track.albumArt) entry.coverArt = track.albumArt;
  }
  return [...byName.values()];
};

export const sortAlbums = (albums, sortKey) => {
  const list = [...albums];
  switch (sortKey) {
    case 'title':
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case 'artist':
      return list.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
    case 'year':
      return list.sort((a, b) => (b.year || 0) - (a.year || 0));
    case 'tracks':
      return list.sort((a, b) => b.trackCount - a.trackCount);
    case 'newest':
    default:
      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
};