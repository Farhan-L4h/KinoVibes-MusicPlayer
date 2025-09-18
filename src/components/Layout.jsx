import React from 'react';
import Sidebar from './Sidebar';
import MusicPlayer from './MusicPlayer';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 flex justify-center">
          <div className="w-full max-w-7xl mx-auto">
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