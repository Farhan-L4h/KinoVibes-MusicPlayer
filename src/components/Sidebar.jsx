import React from 'react';
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
  Library
} from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { logout } from '../services/auth';

const Sidebar = () => {
  const { user } = useAuthStore();

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
    { to: '/playlists', icon: Music, label: 'Playlists' },
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
      <nav className="flex-1 px-4 py-6">
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
    </aside>
  );
};

export default Sidebar;