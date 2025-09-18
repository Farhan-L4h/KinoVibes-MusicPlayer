import React from 'react';
import Sidebar from './Sidebar';
import MusicPlayer from './MusicPlayer';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        
        {/* Music Player */}
        <MusicPlayer />
      </div>
    </div>
  );
};

export default Layout;