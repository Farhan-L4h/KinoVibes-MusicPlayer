import React from 'react';
import { useAuthStore } from '../stores/auth';
import { Music, TrendingUp, Clock, Heart } from 'lucide-react';

const Home = () => {
  const { user } = useAuthStore();

  // Sample data for now
  const recentlyPlayed = [
    { id: 1, title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: "3:20" },
    { id: 2, title: "Watermelon Sugar", artist: "Harry Styles", album: "Fine Line", duration: "2:54" },
    { id: 3, title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", duration: "3:23" }
  ];

  const trending = [
    { id: 4, title: "As It Was", artist: "Harry Styles", album: "Harry's House", duration: "2:47" },
    { id: 5, title: "Heat Waves", artist: "Glass Animals", album: "Dreamland", duration: "3:58" },
    { id: 6, title: "Bad Habit", artist: "Steve Lacy", album: "Gemini Rights", duration: "3:51" }
  ];

  const SongRow = ({ song, index }) => (
    <div className="flex items-center p-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200 cursor-pointer group">
      <span className="text-gray-400 w-8 text-sm group-hover:text-white">
        {index + 1}
      </span>
      <div className="flex-1 ml-4">
        <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">
          {song.title}
        </h4>
        <p className="text-gray-400 text-sm">{song.artist}</p>
      </div>
      <div className="hidden md:block text-gray-400 text-sm mr-4">
        {song.album}
      </div>
      <div className="text-gray-400 text-sm mr-4">
        {song.duration}
      </div>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500">
        <Heart className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Welcome back, {user?.displayName || user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-gray-300 text-lg">
          Ready to discover your next favorite song?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Total Songs</p>
              <p className="text-white text-2xl font-bold">1,234</p>
            </div>
            <Music className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Playlists</p>
              <p className="text-white text-2xl font-bold">12</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Hours Played</p>
              <p className="text-white text-2xl font-bold">156</p>
            </div>
            <Clock className="w-10 h-10 text-purple-400" />
          </div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Favorites</p>
              <p className="text-white text-2xl font-bold">89</p>
            </div>
            <Heart className="w-10 h-10 text-red-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recently Played */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recently Played</h2>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {recentlyPlayed.map((song, index) => (
              <SongRow key={song.id} song={song} index={index} />
            ))}
          </div>
        </div>

        {/* Trending Now */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Trending Now</h2>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {trending.map((song, index) => (
              <SongRow key={song.id} song={song} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2">
            <Music className="w-5 h-5" />
            <span>Create Playlist</span>
          </button>
          
          <button className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Discover Music</span>
          </button>
          
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>View Favorites</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;