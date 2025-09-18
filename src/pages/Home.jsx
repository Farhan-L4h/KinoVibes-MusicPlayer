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
    <div className="flex items-center p-3 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer group">
      <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mr-4 group-hover:from-purple-500/40 group-hover:to-blue-500/40 transition-all duration-200">
        <span className="text-gray-400 text-sm group-hover:text-white font-medium">
          {index + 1}
        </span>
      </div>
      <div className="flex-1 ml-2">
        <h4 className="text-white font-semibold group-hover:text-blue-400 transition-colors truncate">
          {song.title}
        </h4>
        <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors truncate">{song.artist}</p>
      </div>
      <div className="hidden md:block text-gray-400 text-sm mr-6 group-hover:text-gray-300 transition-colors truncate max-w-32">
        {song.album}
      </div>
      <div className="text-gray-400 text-sm mr-4 group-hover:text-gray-300 transition-colors font-mono">
        {song.duration}
      </div>
      <button className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10">
        <Heart className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <div className="inline-block p-4 rounded-2xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-white/10 mb-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Welcome back, <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{user?.displayName || user?.email?.split('@')[0]}</span>! 👋
          </h1>
          <p className="text-gray-300 text-lg">
            Ready to discover your next favorite song?
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Total Songs</p>
              <p className="text-white text-3xl font-bold mt-1">1,234</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Music className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Playlists</p>
              <p className="text-white text-3xl font-bold mt-1">12</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Hours Played</p>
              <p className="text-white text-3xl font-bold mt-1">156</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-medium">Favorites</p>
              <p className="text-white text-3xl font-bold mt-1">89</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recently Played */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Recently Played
            </h2>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-500/20 transition-all duration-200">
              View All
            </button>
          </div>
          <div className="space-y-1">
            {recentlyPlayed.map((song, index) => (
              <SongRow key={song.id} song={song} index={index} />
            ))}
          </div>
        </div>

        {/* Trending Now */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
              Trending Now
            </h2>
            <button className="text-green-400 hover:text-green-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-500/20 transition-all duration-200">
              View All
            </button>
          </div>
          <div className="space-y-1">
            {trending.map((song, index) => (
              <SongRow key={song.id} song={song} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <span className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mr-3"></span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-3 group hover:scale-105">
            <Music className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-semibold">Create Playlist</span>
          </button>
          
          <button className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-3 group hover:scale-105">
            <TrendingUp className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-semibold">Discover Music</span>
          </button>
          
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-3 group hover:scale-105">
            <Heart className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-semibold">View Favorites</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;