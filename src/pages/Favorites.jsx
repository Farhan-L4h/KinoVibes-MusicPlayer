import React from 'react';
import { Heart } from 'lucide-react';

const Favorites = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white text-center">Your Favorites</h1>

      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 text-center">
        <Heart className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-gray-300">Your favorite songs will appear here</p>
      </div>
    </div>
  );
};

export default Favorites;