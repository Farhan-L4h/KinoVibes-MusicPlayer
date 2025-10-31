import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/auth';
import { useMusicStore } from '../stores/music';
import { getAllMusic, deleteMusic } from '../services/supabaseMusicApi';
import MusicUpload from '../components/MusicUpload';
import SplitText from '../components/SplitText';
import FadeInView from '../components/FadeInView';
import { 
  Upload, 
  Music, 
  Search, 
  Plus, 
  Play, 
  Pause,
  Trash2,
  Clock,
  User,
  Disc3,
  AlertTriangle
} from 'lucide-react';

const Library = () => {
  const { user } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, pauseTrack, addToQueue } = useMusicStore();
  
  const [musicLibrary, setMusicLibrary] = useState([]);
  const [filteredMusic, setFilteredMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load music library on component mount
  useEffect(() => {
    loadMusicLibrary();
  }, []);

  // Filter music when search query or genre changes
  useEffect(() => {
    filterMusic();
  }, [searchQuery, selectedGenre, musicLibrary]);

  const loadMusicLibrary = async () => {
    try {
      setLoading(true);
      const music = await getAllMusic();
      setMusicLibrary(music);
    } catch (error) {
      console.error('Failed to load music library:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMusic = () => {
    let filtered = musicLibrary;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.album.toLowerCase().includes(query) ||
        song.genre.toLowerCase().includes(query)
      );
    }

    // Filter by genre
    if (selectedGenre !== 'All') {
      filtered = filtered.filter(song =>
        song.genre === selectedGenre
      );
    }

    setFilteredMusic(filtered);
  };

  const handlePlay = (song) => {
    if (currentTrack?.id === song.id && isPlaying) {
      pauseTrack();
    } else {
      playTrack(song);
    }
  };

  const handleDelete = async (song) => {
    if (!song.firestoreId) return;
    
    try {
      await deleteMusic(
        song.firestoreId,
        song.audioPath,
        song.albumArtPath,
        song.lyricsPath
      );
      
      // Remove from local state
      setMusicLibrary(prev =>
        prev.filter(track => track.firestoreId !== song.firestoreId)
      );
      
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete music:', error);
      alert('Failed to delete music. Please try again.');
    }
  };

  const handleUploadSuccess = (newSong) => {
    setMusicLibrary(prev => [newSong, ...prev]);
    setShowUploadModal(false);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUniqueGenres = () => {
    const genres = musicLibrary.map(song => song.genre).filter(Boolean);
    return ['All', ...new Set(genres)];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <span className="text-gray-600">Loading your music library...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <SplitText className="text-3xl font-bold text-white mb-2" delay={0.1}>
            My Music Library
          </SplitText>
          <p className="text-gray-400 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {musicLibrary.length} {musicLibrary.length === 1 ? 'track' : 'tracks'} in your library
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="retro-button mt-4 sm:mt-0 animate-fade-in-up"
          style={{ animationDelay: '0.8s' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Music
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="retro-card p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search your music..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="retro-input pl-10"
              />
            </div>
            
            {/* Genre Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="retro-input w-auto min-w-32"
            >
              {getUniqueGenres().map(genre => (
                <option key={genre} value={genre} className="bg-black text-white">
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredMusic.length === 0 && !loading ? (
          <div className="retro-card p-12 text-center">
            {musicLibrary.length === 0 ? (
              <div>
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No music uploaded yet</h3>
                <p className="text-gray-400 mb-6">Start building your music library by uploading your favorite tracks</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="retro-button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Track
                </button>
              </div>
            ) : (
              <div>
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No music found</h3>
                <p className="text-gray-400">Try adjusting your search terms or filters</p>
              </div>
            )}
          </div>
        ) : (
          /* Music Grid */
          <FadeInView className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" stagger={0.05}>
            {filteredMusic.map((song) => (
              <div
                key={song.firestoreId || song.id}
                className="retro-card overflow-hidden group"
              >
                {/* Album Art */}
                <div className="aspect-square relative">
                  <img
                    src={song.albumArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'}
                    alt={`${song.title} artwork`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handlePlay(song)}
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      {currentTrack?.id === song.id && isPlaying ? (
                        <Pause className="w-5 h-5 text-black ml-0.5" />
                      ) : (
                        <Play className="w-5 h-5 text-black ml-0.5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Currently Playing Indicator */}
                  {currentTrack?.id === song.id && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  )}
                  
                  {/* Delete Button */}
                  {song.uploadedBy === user?.uid && (
                    <button
                      onClick={() => setDeleteConfirm(song)}
                      className="absolute top-3 left-3 w-8 h-8 bg-red-500 bg-opacity-80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-100"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {/* Song Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white truncate mb-1">{song.title}</h3>
                  <p className="text-gray-400 text-sm truncate mb-3">{song.artist}</p>
                  
                  <div className="flex items-center text-xs text-gray-500 space-x-3 mb-2">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(song.duration)}
                    </div>
                    <div className="flex items-center">
                      <Disc3 className="w-3 h-3 mr-1" />
                      {song.genre || 'Unknown'}
                    </div>
                  </div>
                  
                  {song.fileSize && (
                    <div className="text-xs text-gray-500">
                      {formatFileSize(song.fileSize)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </FadeInView>
        )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <MusicUpload
            onUploadSuccess={handleUploadSuccess}
            onClose={() => setShowUploadModal(false)}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="retro-card p-8 max-w-md w-full">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Track</h3>
                <p className="text-gray-400 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="retro-card mb-6 p-4 bg-black bg-opacity-30">
              <p className="text-white font-medium">{deleteConfirm.title}</p>
              <p className="text-gray-400 text-sm">{deleteConfirm.artist}</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;