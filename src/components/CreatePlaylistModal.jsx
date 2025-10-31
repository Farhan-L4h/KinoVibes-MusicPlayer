import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePlaylistStore } from '../stores/playlist';
import { useAuthStore } from '../stores/auth';

const CreatePlaylistModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { createPlaylist } = usePlaylistStore();
  const { user } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a playlist name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createPlaylist(user.id, {
        name: name.trim(),
        description: description.trim() || null
      });
      
      // Reset form and close modal
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create playlist');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Create Playlist</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="playlistName" className="block text-sm font-medium text-gray-300 mb-2">
              Playlist Name *
            </label>
            <input
              type="text"
              id="playlistName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Playlist"
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="playlistDescription" className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="playlistDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your playlist..."
              rows={3}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 font-medium transition-all"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-purple-500/20"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;
