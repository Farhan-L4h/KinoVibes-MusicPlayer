import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home,
  Search,
  Heart,
  Music,
  Upload,
  User,
  LogOut,
  MessageSquare,
  Library,
  Plus,
  ListMusic
} from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { signOut as logout } from '../services/supabaseAuth';
import { usePlaylistStore } from '../stores/playlist';
import CreatePlaylistModal from './CreatePlaylistModal';

const Sidebar = () => {
  const { user } = useAuthStore();
  const { playlists, loadUserPlaylists } = usePlaylistStore();
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

  // Load user playlists on mount
  useEffect(() => {
    if (user?.id) {
      loadUserPlaylists(user.id);
    }
  }, [user, loadUserPlaylists]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/library', icon: Library, label: 'My Library' },
    { to: '/lyrics', icon: MessageSquare, label: 'Lyrics' },
    { to: '/favorites', icon: Heart, label: 'Favorites' },
    { to: '/upload', icon: Upload, label: 'Upload' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="w-64 h-screen bg-black border-r border-white/10 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-xl text-black">🎵</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Kino <span className="text-gray-300">Vibe</span>
            </h1>
            <p className="text-xs text-gray-400">Your Music Hub</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="px-4 py-6">
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-white text-black shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Playlists Section */}
      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            My Playlists
          </h3>
          <button
            onClick={() => setShowCreatePlaylist(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
            title="Create Playlist"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1">
          {playlists.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <ListMusic className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No playlists yet</p>
              <p className="text-xs text-gray-600 mt-1">Create your first playlist</p>
            </div>
          ) : (
            playlists.map((playlist) => (
              <NavLink
                key={playlist.id}
                to={`/playlists/${playlist.id}`}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <ListMusic className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{playlist.name}</p>
                  <p className="text-xs text-gray-500">
                    {playlist.track_count || 0} songs
                  </p>
                </div>
              </NavLink>
            ))
          )}
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-white/10 space-y-4">
        {user && (
          <div className="retro-card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <User className="w-5 h-5 text-black" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-gray-400 text-xs truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-red-500/20 transition-all duration-200 group border border-transparent hover:border-red-500/30"
        >
          <LogOut className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal 
        isOpen={showCreatePlaylist} 
        onClose={() => setShowCreatePlaylist(false)} 
      />
    </aside>
  );
};

export default Sidebar;