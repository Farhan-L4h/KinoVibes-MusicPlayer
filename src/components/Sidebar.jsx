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
    <div className="w-64 bg-black bg-opacity-30 backdrop-blur-lg p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">🎵 Kino Vibe</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white bg-opacity-20 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="mt-auto">
        {user && (
          <div className="mb-4 p-4 rounded-lg bg-white bg-opacity-10">
            <p className="text-white text-sm font-medium">
              {user.displayName || user.email}
            </p>
            <p className="text-gray-300 text-xs">{user.email}</p>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-red-500 hover:bg-opacity-20 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;