import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth';
import { useMusicStore } from '../stores/music';
import { Music, TrendingUp, Clock, Heart, Play, Pause, Upload, Plus } from 'lucide-react';
import { getDemoMusic, getTrendingMusic, getAllMusic } from '../services/musicApi';
import MusicUpload from '../components/MusicUpload';

const Home = () => {
  const { user } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useMusicStore();
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [totalSongs, setTotalSongs] = useState(0);

  useEffect(() => {
    loadMusicData();
  }, []);

  const loadMusicData = async () => {
    try {
      setLoading(true);
      
      // Get all music for stats
      const allMusic = await getAllMusic();
      setTotalSongs(allMusic.length);
      
      // Set recently played (first few from user's library)
      setRecentlyPlayed(allMusic.slice(0, 3));
      
      // Get trending music (includes demo if no user music)
      const trending = await getTrendingMusic();
      setTrending(trending.slice(0, 6));
      
    } catch (error) {
      console.error('Error loading music data:', error);
      // Set fallback data
      const fallbackMusic = getDemoMusic();
      setRecentlyPlayed(fallbackMusic.slice(0, 3));
      setTrending(fallbackMusic.slice(3, 9));
    } finally {
      setLoading(false);
    }
  };

  const allSongs = [...recentlyPlayed, ...trending];

  const handlePlaySong = (song) => {
    if (currentTrack && currentTrack.id === song.id && isPlaying) {
      pauseTrack();
    } else {
      playTrack(song);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    loadMusicData(); // Reload data to include new upload
  };

  const isCurrentSong = (song) => {
    return currentTrack && currentTrack.id === song.id;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const SongRow = ({ song, index }) => (
    <div className="flex items-center p-3 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer group"
         onClick={() => handlePlaySong(song)}>
      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-white/20 transition-all duration-200 flex-shrink-0">
        <div className="relative">
          <span className={`text-sm group-hover:hidden font-medium ${
            isCurrentSong(song) ? 'text-white' : 'text-gray-400'
          }`}>
            {index + 1}
          </span>
          <div className="hidden group-hover:block">
            {isCurrentSong(song) && isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-w-0 mr-4">
        <h4 className={`font-semibold text-sm transition-colors truncate ${
          isCurrentSong(song) ? 'text-white' : 'text-white group-hover:text-gray-200'
        }`}>
          {song.title}
        </h4>
        <p className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors truncate">
          {song.artist}
        </p>
      </div>
      
      <div className="hidden md:block text-gray-400 text-xs mr-6 group-hover:text-gray-300 transition-colors truncate max-w-32 flex-shrink-0">
        {song.album}
      </div>
      
      <div className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors font-mono flex-shrink-0 mr-4">
        {typeof song.duration === 'string' ? song.duration : formatTime(song.duration)}
      </div>
      
      <button 
        className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          // TODO: Toggle favorite
        }}
      >
        <Heart className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-8 w-full">
      {/* Welcome Section */}
      <div className="w-full">
        <div className="retro-card p-8 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Welcome back, <span className="text-gray-300">{user?.displayName || user?.email?.split('@')[0]}</span>! 👋
          </h1>
          <p className="text-gray-400 text-lg">
            Ready to discover your next favorite song?
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div className="retro-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Total Songs</p>
                <p className="text-white text-3xl font-bold">{totalSongs}</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Music className="w-6 h-6 text-black" />
              </div>
            </div>
          </div>

          <div className="retro-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Playlists</p>
                <p className="text-white text-3xl font-bold">12</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-black" />
              </div>
            </div>
          </div>

          <div className="retro-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Hours Played</p>
                <p className="text-white text-3xl font-bold">156</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-black" />
              </div>
            </div>
          </div>

          <div className="retro-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Favorites</p>
                <p className="text-white text-3xl font-bold">89</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-black" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Music Sections */}
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Your Music */}
          <div className="retro-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Your Music
              </h2>
            </div>
            {recentlyPlayed.length > 0 ? (
              <div className="space-y-3">
                {recentlyPlayed.map((song, index) => (
                  <SongRow key={song.id} song={song} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No music uploaded yet</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="retro-button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Music
                </button>
              </div>
            )}
          </div>

          {/* Featured Tracks */}
          <div className="retro-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Featured Tracks
              </h2>
            </div>
            <div className="space-y-3">
              {trending.map((song, index) => (
                <SongRow key={song.id} song={song} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="w-full">
        <div className="retro-card p-6 max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setShowUploadModal(true)}
              className="retro-button-secondary p-6 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center justify-center space-x-3 group"
            >
              <Upload className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-semibold">Upload Music</span>
            </button>
            
            <button className="retro-button-secondary p-6 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center justify-center space-x-3 group">
              <TrendingUp className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-semibold">Browse Library</span>
            </button>
            
            <button className="retro-button-secondary p-6 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center justify-center space-x-3 group">
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-semibold">Create Playlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <MusicUpload
            onUploadSuccess={handleUploadSuccess}
            onClose={() => setShowUploadModal(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Home;