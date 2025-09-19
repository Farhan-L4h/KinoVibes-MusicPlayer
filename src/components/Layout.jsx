import React from 'react';
import Sidebar from './Sidebar';
import MusicPlayer from './MusicPlayer';

const Layout = ({ children }) => {
  return (
    <div className="h-screen bg-black flex">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main Content Area - Centered Horizontally */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto py-8 px-4">
          <div className="w-full max-w-6xl mx-auto px-4">
            {children}
          </div>
        </main>
        
        {/* Music Player */}
        <MusicPlayer />
      </div>
    </div>
  );
};

export default Layout;