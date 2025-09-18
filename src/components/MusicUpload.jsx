import { useState } from 'react';
import { useAuthStore } from '../stores/auth';
import { uploadMusic, isValidAudioFile, isValidImageFile } from '../services/musicApi';
import { Upload, Music, Image, X, CheckCircle, AlertCircle } from 'lucide-react';

const MusicUpload = ({ onUploadSuccess, onClose }) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    duration: 0
  });
  
  const [audioFile, setAudioFile] = useState(null);
  const [albumArtFile, setAlbumArtFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle audio file selection
  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    setError('');
    
    if (file) {
      if (!isValidAudioFile(file)) {
        setError('Please select a valid audio file (MP3, WAV, OGG, M4A, AAC, FLAC)');
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError('Audio file is too large. Maximum size is 50MB.');
        return;
      }
      
      setAudioFile(file);
      
      // Auto-fill title if not provided
      if (!formData.title) {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setFormData(prev => ({ ...prev, title: fileName }));
      }
      
      // Get audio duration
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        setFormData(prev => ({
          ...prev,
          duration: Math.floor(audio.duration)
        }));
      };
      audio.src = URL.createObjectURL(file);
    }
  };

  // Handle album art file selection  
  const handleAlbumArtChange = (e) => {
    const file = e.target.files[0];
    setError('');
    
    if (file) {
      if (!isValidImageFile(file)) {
        setError('Please select a valid image file (JPG, PNG, WEBP, GIF)');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image file is too large. Maximum size is 10MB.');
        return;
      }
      
      setAlbumArtFile(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user || !user.uid) {
      setError('You must be logged in to upload music');
      return;
    }
    
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }
    
    if (!formData.title.trim()) {
      setError('Please enter a song title');
      return;
    }
    
    if (!formData.artist.trim()) {
      setError('Please enter an artist name');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadMusic(
        audioFile,
        albumArtFile,
        {
          title: formData.title.trim(),
          artist: formData.artist.trim(),
          album: formData.album.trim() || 'Unknown Album',
          genre: formData.genre.trim() || 'Unknown',
          duration: formData.duration
        },
        user.uid
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);
      
      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      
      // Reset form after short delay
      setTimeout(() => {
        setFormData({
          title: '',
          artist: '',
          album: '',
          genre: '',
          duration: 0
        });
        setAudioFile(null);
        setAlbumArtFile(null);
        setSuccess(false);
        setUploadProgress(0);
        if (onClose) onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload music');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Remove selected audio file
  const removeAudioFile = () => {
    setAudioFile(null);
    setFormData(prev => ({ ...prev, duration: 0 }));
  };

  // Remove selected album art file
  const removeAlbumArt = () => {
    setAlbumArtFile(null);
  };

  if (success) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Successful!</h3>
        <p className="text-gray-600">Your music has been added to the library.</p>
      </div>
    );
  }

  return (
    <div className="retro-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-600">
        <h2 className="text-2xl font-bold text-white">Upload Music</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Audio File Upload */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <Music className="w-4 h-4 inline mr-1" />
            Audio File *
          </label>
          {!audioFile ? (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-white transition-colors bg-black bg-opacity-30">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileChange}
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Click to select audio file</p>
                <p className="text-xs text-gray-500 mt-1">MP3, WAV, OGG, M4A, AAC, FLAC (max 50MB)</p>
              </label>
            </div>
          ) : (
            <div className="bg-black bg-opacity-30 rounded-lg p-4 flex items-center justify-between border border-gray-600">
              <div className="flex items-center">
                <Music className="w-5 h-5 text-white mr-2" />
                <div>
                  <p className="text-sm font-medium text-white">{audioFile.name}</p>
                  <p className="text-xs text-gray-400">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeAudioFile}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Album Art Upload */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <Image className="w-4 h-4 inline mr-1" />
            Album Art (Optional)
          </label>
          {!albumArtFile ? (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-white transition-colors bg-black bg-opacity-30">
              <input
                type="file"
                accept="image/*"
                onChange={handleAlbumArtChange}
                className="hidden"
                id="albumart-upload"
              />
              <label htmlFor="albumart-upload" className="cursor-pointer">
                <Image className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Click to select album art</p>
              </label>
            </div>
          ) : (
            <div className="bg-black bg-opacity-30 rounded-lg p-3 flex items-center justify-between border border-gray-600">
              <div className="flex items-center">
                <Image className="w-4 h-4 text-white mr-2" />
                <p className="text-sm text-white">{albumArtFile.name}</p>
              </div>
              <button
                type="button"
                onClick={removeAlbumArt}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Metadata Form */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-black bg-opacity-30 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white placeholder-gray-400"
              placeholder="Song title"
              required
            />
          </div>
          
          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-white mb-1">
              Artist *
            </label>
            <input
              type="text"
              id="artist"
              name="artist"
              value={formData.artist}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-black bg-opacity-30 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white placeholder-gray-400"
              placeholder="Artist name"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="album" className="block text-sm font-medium text-white mb-1">
                Album
              </label>
              <input
                type="text"
                id="album"
                name="album"
                value={formData.album}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-black bg-opacity-30 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white placeholder-gray-400"
                placeholder="Album name"
              />
            </div>
            
            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-white mb-1">
                Genre
              </label>
              <select
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-black bg-opacity-30 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
              >
                <option value="" className="bg-gray-800">Select genre</option>
                <option value="Pop" className="bg-gray-800">Pop</option>
                <option value="Rock" className="bg-gray-800">Rock</option>
                <option value="Hip Hop" className="bg-gray-800">Hip Hop</option>
                <option value="Electronic" className="bg-gray-800">Electronic</option>
                <option value="Jazz" className="bg-gray-800">Jazz</option>
                <option value="Classical" className="bg-gray-800">Classical</option>
                <option value="Country" className="bg-gray-800">Country</option>
                <option value="R&B" className="bg-gray-800">R&B</option>
                <option value="Indie" className="bg-gray-800">Indie</option>
                <option value="Alternative" className="bg-gray-800">Alternative</option>
                <option value="Acoustic" className="bg-gray-800">Acoustic</option>
                <option value="Ambient" className="bg-gray-800">Ambient</option>
                <option value="Other" className="bg-gray-800">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="w-full bg-black bg-opacity-30 rounded-full h-3 border border-gray-600">
            <div
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="retro-card p-4 bg-red-500 bg-opacity-20 border-red-500 border-opacity-50">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!audioFile || !formData.title.trim() || !formData.artist.trim() || uploading}
          className="retro-button w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent mr-3"></div>
              Uploading... {uploadProgress}%
            </div>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload Music
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default MusicUpload;