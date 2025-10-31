import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Heart, User } from 'lucide-react';

/**
 * MobileBottomNav - Pill style navigation for mobile
 * Positioned at bottom with music player above it
 */
const MobileBottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/library', icon: Library, label: 'Library' },
    { to: '/favorites', icon: Heart, label: 'Favorites' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-safe">
      {/* Gradient fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-yt-bg-primary via-yt-bg-primary/95 to-transparent pointer-events-none" />
      
      {/* Pill Navigation Container */}
      <div className="relative px-4 pb-4">
        <div className="bg-yt-bg-elevated/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center px-3 py-2 rounded-full transition-all duration-200 min-w-[60px] ${
                    isActive
                      ? 'bg-white text-black scale-105'
                      : 'text-yt-text-secondary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon 
                      className={`w-5 h-5 mb-1 transition-transform ${
                        isActive ? 'scale-110' : ''
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={`text-[10px] font-medium ${
                      isActive ? 'font-semibold' : ''
                    }`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
