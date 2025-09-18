import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

const Search = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Search Music</h1>
        <p className="text-gray-300">Discover your next favorite song</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search for songs, artists, albums..."
            className="w-full bg-white bg-opacity-20 text-white placeholder-gray-400 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-opacity-30"
          />
        </div>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 text-center">
        <p className="text-gray-300">Search functionality will be implemented with Spotify API</p>
      </div>
    </div>
  );
};

export default Search;