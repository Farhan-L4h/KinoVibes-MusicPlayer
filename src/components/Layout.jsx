import React from 'react';
import Sidebar from './SidebarYT'; // New YouTube Music style
import MusicPlayer from './MusicPlayerYT'; // New YouTube Music style
import AmbienceBackground from './AmbienceBackground';
import AuroraBackground from './AuroraBackground';
import MobileBottomNav from './MobileBottomNav';

const Layout = ({ children }) => {
  return (
    <div className="h-screen bg-yt-bg-primary flex overflow-hidden relative">
      {/* Aurora Background Effect */}
      <AuroraBackground />
      
      {/* Ambience Background Effect */}
      <AmbienceBackground />
      
      {/* Sidebar - Hidden on mobile, visible on md+ */}
      <div className="hidden md:block w-64 flex-shrink-0 relative z-10">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-yt-bg-elevated scrollbar-track-transparent">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 pb-40 md:pb-8">
            {children}
          </div>
        </main>
        
        {/* Music Player - Fixed bottom, above mobile nav */}
        <div className="relative z-20 mb-20 md:mb-0">
          <MusicPlayer />
        </div>
      </div>
      
      {/* Mobile Bottom Pill Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default Layout;