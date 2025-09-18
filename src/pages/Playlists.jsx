import React from 'react';
import { Music } from 'lucide-react';

const Playlists = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Your Playlists</h1>
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
          Create Playlist
        </button>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 text-center">
        <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-300">Playlist management will be implemented with Firestore</p>
      </div>
    </div>
  );
};

export default Playlists;