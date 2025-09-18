import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home,
  Search,
  Heart,
  Music,
  Upload,
  User,
  LogOut 
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
    { to: '/favorites', icon: Heart, label: 'Favorites' },
    { to: '/playlists', icon: Music, label: 'Playlists' },
    { to: '/upload', icon: Upload, label: 'Upload' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">🎵</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Kino <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Vibe</span>
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-lg border border-blue-500/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-lg'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="mt-auto space-y-4">
        {user && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-gray-300 text-xs truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-red-500/20 hover:shadow-lg transition-all duration-300 group border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;