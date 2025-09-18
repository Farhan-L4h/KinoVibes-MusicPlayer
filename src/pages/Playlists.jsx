import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Plus, 
  Play, 
  Pause, 
  MoreVertical, 
  Edit, 
  Trash2,
  Clock,
  Heart
} from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { usePlaylistStore } from '../stores/playlist';
import { useMusicStore } from '../stores/music';

const Playlists = () => {
  const { user } = useAuthStore();
  const { 
    playlists, 
    loading, 
    error, 
    createPlaylist, 
    updatePlaylist, 
    deletePlaylist,
    loadUserPlaylists,
    addSongToPlaylist,
    removeSongFromPlaylist
  } = usePlaylistStore();
  
  const { currentSong, isPlaying, playSong, togglePlay } = useMusicStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  useEffect(() => {
    if (user) {
      loadUserPlaylists(user.uid);
    }
  }, [user, loadUserPlaylists]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      await createPlaylist(user.uid, {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
        isPublic: false
      });
      
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const handleEditPlaylist = async (e) => {
    e.preventDefault();
    if (!selectedPlaylist || !newPlaylistName.trim()) return;

    try {
      await updatePlaylist(selectedPlaylist.id, {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim()
      });
      
      setShowEditModal(false);
      setSelectedPlaylist(null);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
    } catch (error) {
      console.error('Error updating playlist:', error);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      try {
        await deletePlaylist(playlistId);
      } catch (error) {
        console.error('Error deleting playlist:', error);
      }
    }
  };

  const handlePlayPlaylist = (playlist) => {
    if (playlist.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  const isCurrentSong = (song) => {
    return currentSong && currentSong.id === song.id;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = (songs) => {
    const total = songs.reduce((acc, song) => acc + (song.duration || 0), 0);
    return formatTime(total);
  };

  const openEditModal = (playlist) => {
    setSelectedPlaylist(playlist);
    setNewPlaylistName(playlist.name);
    setNewPlaylistDescription(playlist.description || '');
    setShowEditModal(true);
  };

  if (loading && playlists.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
            Your Playlists
          </h1>
          <p className="text-gray-300 text-lg">
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-white text-black px-6 py-3 rounded-full hover:scale-105 transition-all duration-200 font-semibold flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Playlists Grid */}
      {playlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-900/50 rounded-2xl p-6 hover:bg-gray-800/50 transition-all duration-300 group"
            >
              {/* Playlist Cover */}
              <div className="relative mb-4">
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                  {playlist.songs && playlist.songs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 w-full h-full p-2">
                      {playlist.songs.slice(0, 4).map((song, index) => (
                        <div key={index} className="rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
                          {song.albumArt ? (
                            <img
                              src={song.albumArt}
                              alt={song.album}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Music className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handlePlayPlaylist(playlist)}
                      className="bg-white text-black rounded-full p-3 hover:scale-110 transition-transform"
                    >
                      <Play className="w-6 h-6 ml-0.5" />
                    </button>
                    
                    <div className="relative">
                      <button className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {/* Dropdown menu would go here */}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Playlist Info */}
              <div className="space-y-2">
                <h3 className="text-white font-bold text-lg truncate">
                  {playlist.name}
                </h3>
                
                {playlist.description && (
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {playlist.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{playlist.songs?.length || 0} songs</span>
                  {playlist.songs && playlist.songs.length > 0 && (
                    <span>{getTotalDuration(playlist.songs)}</span>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                <button 
                  onClick={() => openEditModal(playlist)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={() => handleDeletePlaylist(playlist.id)}
                  className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-gray-900/30 rounded-2xl p-12 text-center">
          <Music className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">No playlists yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Create your first playlist to organize your favorite songs and discover new music.
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-black px-8 py-3 rounded-full hover:scale-105 transition-all duration-200 font-semibold"
          >
            Create Your First Playlist
          </button>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Playlist</h2>
            
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Playlist Name
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Describe your playlist..."
                  rows={3}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                />
              </div>
              
              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Create Playlist
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                  }}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Playlist Modal */}
      {showEditModal && selectedPlaylist && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Playlist</h2>
            
            <form onSubmit={handleEditPlaylist} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Playlist Name
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                />
              </div>
              
              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPlaylist(null);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                  }}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlists;