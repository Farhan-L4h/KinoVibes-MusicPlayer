import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Trash2, MoreVertical, Clock, Calendar } from 'lucide-react';
import { usePlaylistStore } from '../stores/playlist';
import { useMusicStore } from '../stores/music';
import { useAuthStore } from '../stores/auth';
import { getPlaylistWithTracks } from '../services/supabasePlaylistApi';
import LoadingSpinner from '../components/LoadingSpinner';
import SplitText from '../components/SplitText';
import FadeInView from '../components/FadeInView';

const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useMusicStore();
  const { deletePlaylist, removeSongFromPlaylist } = usePlaylistStore();
  
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingTrackId, setDeletingTrackId] = useState(null);

  // Load playlist with tracks
  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getPlaylistWithTracks(id);
      
      if (!data) {
        setError('Playlist not found');
        return;
      }
      
      setPlaylist(data);
    } catch (err) {
      console.error('Failed to load playlist:', err);
      setError('Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack();
    } else {
      playTrack(track);
    }
  };

  const handleRemoveTrack = async (trackId) => {
    if (!confirm('Remove this song from the playlist?')) return;
    
    try {
      setDeletingTrackId(trackId);
      await removeSongFromPlaylist(id, trackId);
      // Reload playlist to update UI
      await loadPlaylist();
    } catch (err) {
      console.error('Failed to remove track:', err);
      alert('Failed to remove track from playlist');
    } finally {
      setDeletingTrackId(null);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm(`Delete playlist "${playlist.name}"? This cannot be undone.`)) return;
    
    try {
      await deletePlaylist(id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      alert('Failed to delete playlist');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-400 text-lg mb-4">{error || 'Playlist not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  const tracks = playlist.tracks || [];
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Playlist Header */}
      <div className="bg-gradient-to-b from-purple-900/40 to-transparent px-8 pt-20 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end space-x-6">
            {/* Playlist Cover */}
            <div className="w-48 h-48 bg-gradient-to-br from-purple-600 to-purple-900 rounded-2xl shadow-2xl flex items-center justify-center flex-shrink-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Play className="w-20 h-20 text-white/80" />
            </div>

            {/* Playlist Info */}
            <div className="flex-1 pb-4">
              <p className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                Playlist
              </p>
              <SplitText className="text-5xl font-bold mb-4" delay={0.4}>
                {playlist.name}
              </SplitText>
              {playlist.description && (
                <p className="text-gray-300 mb-4">{playlist.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>{user?.displayName || 'You'}</span>
                <span>•</span>
                <span>{tracks.length} songs</span>
                {totalDuration > 0 && (
                  <>
                    <span>•</span>
                    <span>{Math.floor(totalDuration / 60)} min</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pb-4">
              <button
                onClick={handleDeletePlaylist}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks List */}
      <div className="px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {tracks.length === 0 ? (
            <div className="text-center py-16">
              <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">This playlist is empty</p>
              <p className="text-gray-500 text-sm">Add songs from your library</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-[50px_1fr_200px_100px_80px] gap-4 px-4 py-2 text-sm text-gray-400 border-b border-white/10 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <div className="text-center">#</div>
                <div>Title</div>
                <div>Album</div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Added
                </div>
                <div className="flex items-center justify-end">
                  <Clock className="w-4 h-4 mr-2" />
                  Duration
                </div>
              </div>

              {/* Tracks */}
              <FadeInView delay={0.7} stagger={0.05}>
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="grid grid-cols-[50px_1fr_200px_100px_80px] gap-4 px-4 py-3 rounded-lg hover:bg-white/5 group transition-colors"
                >
                  {/* Play Button / Number */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handlePlayTrack(track)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Play className="w-4 h-4 text-white group-hover:text-purple-400" />
                      )}
                    </button>
                  </div>

                  {/* Track Info */}
                  <div className="flex items-center space-x-3 min-w-0">
                    {track.album_art_url && (
                      <img
                        src={track.album_art_url}
                        alt={track.title}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{track.title}</p>
                      <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Album */}
                  <div className="flex items-center">
                    <p className="text-sm text-gray-400 truncate">{track.album || 'Unknown'}</p>
                  </div>

                  {/* Added Date */}
                  <div className="flex items-center">
                    <p className="text-sm text-gray-400">{formatDate(track.added_at)}</p>
                  </div>

                  {/* Duration & Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    <span className="text-sm text-gray-400">{formatDuration(track.duration)}</span>
                    <button
                      onClick={() => handleRemoveTrack(track.id)}
                      disabled={deletingTrackId === track.id}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all disabled:opacity-50"
                      title="Remove from playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              </FadeInView>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistDetail;
