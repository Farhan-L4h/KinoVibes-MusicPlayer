import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home,
  Search,
  Heart,
  Upload,
  User,
  LogOut,
  MessageSquare,
  Library,
  Plus,
  ListMusic,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { signOut as logout } from '../services/supabaseAuth';
import { usePlaylistStore } from '../stores/playlist';
import CreatePlaylistModal from './CreatePlaylistModal';

const SidebarYT = () => {
  const { user } = useAuthStore();
  const { playlists, loadUserPlaylists } = usePlaylistStore();
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    { to: '/library', icon: Library, label: 'Library' },
  ];

  const secondaryItems = [
    { to: '/lyrics', icon: MessageSquare, label: 'Lyrics' },
    { to: '/favorites', icon: Heart, label: 'Favorites' },
    { to: '/upload', icon: Upload, label: 'Upload' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-yt-brand rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lg text-white">🎵</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-yt-text-primary">
              Kino <span className="text-yt-text-secondary">Vibe</span>
            </h1>
            <p className="text-[10px] text-yt-text-tertiary">Your Music Hub</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-yt-bg-elevated scrollbar-track-transparent">
        {/* Primary Navigation */}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-4 px-4 py-3 rounded-xl transition-all group ${
                isActive
                  ? 'bg-yt-bg-elevated text-yt-text-primary'
                  : 'text-yt-text-secondary hover:bg-yt-bg-hover hover:text-yt-text-primary'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* Divider */}
        <div className="h-px bg-white/5 my-4 mx-4" />

        {/* Secondary Navigation */}
        {secondaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-4 px-4 py-3 rounded-xl transition-all group ${
                isActive
                  ? 'bg-yt-bg-elevated text-yt-text-primary'
                  : 'text-yt-text-secondary hover:bg-yt-bg-hover hover:text-yt-text-primary'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* Divider */}
        <div className="h-px bg-white/5 my-4 mx-4" />

        {/* Playlists Section */}
        <div className="px-2">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-yt-text-tertiary uppercase tracking-wider">
              Your Playlists
            </h3>
            <button
              onClick={() => setShowCreatePlaylist(true)}
              className="w-6 h-6 rounded-full hover:bg-yt-bg-elevated flex items-center justify-center text-yt-text-secondary hover:text-yt-text-primary transition-all"
              title="Create Playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {playlists.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <ListMusic className="w-8 h-8 text-yt-text-tertiary mx-auto mb-2 opacity-50" />
                <p className="text-xs text-yt-text-tertiary">No playlists yet</p>
                <button
                  onClick={() => setShowCreatePlaylist(true)}
                  className="text-xs text-yt-brand hover:underline mt-2"
                >
                  Create one
                </button>
              </div>
            ) : (
              playlists.map((playlist) => (
                <NavLink
                  key={playlist.id}
                  to={`/playlists/${playlist.id}`}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all group ${
                      isActive
                        ? 'bg-yt-bg-elevated text-yt-text-primary'
                        : 'text-yt-text-secondary hover:bg-yt-bg-hover hover:text-yt-text-primary'
                    }`
                  }
                >
                  <ListMusic className="w-4 h-4 flex-shrink-0 opacity-70" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{playlist.name}</p>
                    <p className="text-xs text-yt-text-tertiary">
                      {playlist.track_count || 0} songs
                    </p>
                  </div>
                </NavLink>
              ))
            )}
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/5">
        {user && (
          <div className="mb-3 p-3 bg-yt-bg-elevated/50 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yt-brand rounded-full flex items-center justify-center flex-shrink-0">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yt-text-primary truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-yt-text-tertiary truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-yt-text-secondary hover:bg-yt-bg-hover hover:text-yt-brand transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-yt-bg-elevated rounded-full flex items-center justify-center text-yt-text-primary shadow-lg"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 h-full bg-yt-bg-primary/80 backdrop-blur-xl border-r border-white/5 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-yt-bg-primary border-r border-white/5 flex flex-col z-50 animate-slide-in">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Create Playlist Modal */}
      <CreatePlaylistModal 
        isOpen={showCreatePlaylist} 
        onClose={() => setShowCreatePlaylist(false)} 
      />
    </>
  );
};

export default SidebarYT;
