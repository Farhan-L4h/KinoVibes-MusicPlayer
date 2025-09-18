import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Play, Pause, Music, Heart, Upload, Plus } from 'lucide-react';
import { 
  searchMusic,
  getTrendingMusic,
  getAllMusic
} from '../services/musicApi';
import { useMusicStore } from '../stores/music';
import { useAuthStore } from '../stores/auth';
import MusicUpload from '../components/MusicUpload';

const Search = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingMusic, setTrendingMusic] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useMusicStore();
  const { user } = useAuthStore();

  useEffect(() => {
    // Load trending music on component mount
    loadTrendingMusic();
  }, []);

  const loadTrendingMusic = async () => {
    try {
      setLoading(true);
      console.log('🎵 Loading music from local library...');
      
      const trending = await getTrendingMusic();
      console.log('✅ Loaded tracks:', trending.length);
      
      setTrendingMusic(trending);
    } catch (err) {
      console.error('Error loading music:', err);
      setError('Failed to load music');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Searching local library for: "${query}"`);
      
      const results = await searchMusic(query, 20);
      console.log(`🎶 Found ${results.length} results`);
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('No music found in your library. Try different keywords or upload more music.');
      }
      
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song) => {
    if (currentTrack && currentTrack.id === song.id && isPlaying) {
      pauseTrack();
    } else {
      playTrack(song);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Reload trending music to include newly uploaded song
    loadTrendingMusic();
    // Clear search to show updated library
    setSearchResults([]);
    setQuery('');
  };

  const isCurrentSong = (song) => {
    return currentTrack && currentTrack.id === song.id;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const SongCard = ({ song }) => (
    <div 
      className="retro-card overflow-hidden group cursor-pointer"
      onClick={() => handlePlaySong(song)}
    >
      <div className="aspect-square relative">
        {song.albumArt ? (
          <img
            src={song.albumArt}
            alt={song.album}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-black bg-opacity-30 flex items-center justify-center">
            <Music className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
            {isCurrentSong(song) && isPlaying ? (
              <Pause className="w-5 h-5 text-black ml-0.5" />
            ) : (
              <Play className="w-5 h-5 text-black ml-0.5" />
            )}
          </button>
        </div>
        
        {/* Currently Playing Indicator */}
        {isCurrentSong(song) && (
          <div className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full animate-pulse"></div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className={`font-semibold text-sm mb-1 truncate ${
          isCurrentSong(song) ? 'text-white' : 'text-white'
        }`}>
          {song.title}
          {song.source === 'local' && (
            <span className="ml-2 bg-gray-600 bg-opacity-50 text-gray-300 text-xs px-2 py-1 rounded-full">
              Uploaded
            </span>
          )}
          {song.source === 'demo' && (
            <span className="ml-2 bg-gray-600 bg-opacity-50 text-gray-300 text-xs px-2 py-1 rounded-full">
              Demo
            </span>
          )}
        </h3>
        <p className="text-gray-400 text-xs truncate mb-1">{song.artist}</p>
        <p className="text-gray-500 text-xs truncate">{song.album}</p>
        {song.duration && (
          <p className="text-gray-500 text-xs mt-2">
            {formatTime(song.duration)}
            <span className="ml-1 text-white text-xs">Full Track</span>
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Search Header */}
      <div className="text-center pb-6">
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
          Your Music Library
        </h1>
        <p className="text-gray-300 text-lg">
          Search and discover your uploaded music collection
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <SearchIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your music library..."
              className="w-full bg-black bg-opacity-50 text-white placeholder-gray-400 pl-14 pr-4 py-4 rounded-2xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-white text-lg backdrop-blur-sm"
            />
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowUploadModal(true)}
          className="retro-button text-lg px-8 py-4 flex items-center space-x-3"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Music</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="retro-card p-6 text-center bg-gray-800 bg-opacity-50">
        <p className="text-gray-300">
          <span className="font-semibold">🎵 Your Local Library:</span> Upload your own music files to build your personal collection. 
          All uploaded music is stored securely in Firebase and available as full tracks!
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="retro-card p-4 text-center max-w-2xl mx-auto bg-red-500 bg-opacity-20 border-red-500 border-opacity-50">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !loading && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Search Results ({searchResults.length})
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span>Full Track Available</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {searchResults.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </div>
      )}

      {/* Music Library (when no search) */}
      {searchResults.length === 0 && !loading && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {trendingMusic.length > 0 ? 'Your Music' : 'Getting Started'}
            </h2>
            {trendingMusic.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                <span>Full Track</span>
              </div>
            )}
          </div>
          
          {trendingMusic.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {trendingMusic.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          ) : (
            /* Empty State for New Users */
            <div className="retro-card p-12 text-center">
              <Music className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-white mb-4">Start Your Music Journey</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Upload your favorite music files to build your personal library. 
                Support for MP3, WAV, OGG, M4A, AAC, and FLAC formats.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="retro-button text-lg px-8 py-4 flex items-center space-x-3 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Upload Your First Song</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty Search State */}
      {query && searchResults.length === 0 && !loading && !error && (
        <div className="retro-card p-12 text-center">
          <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No results found in your library</h3>
          <p className="text-gray-400 mb-6">Try different search terms or upload more music</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="retro-button px-6 py-3"
          >
            Upload Music
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <MusicUpload
            onUploadSuccess={handleUploadSuccess}
            onClose={() => setShowUploadModal(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Search;