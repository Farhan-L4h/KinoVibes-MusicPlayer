import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  VolumeX,
  Heart,
  Shuffle,
  Repeat,
  Music,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMusicStore } from '../stores/music';

const MusicPlayer = () => {
  const navigate = useNavigate();
  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    togglePlay,
    nextSong,
    previousSong,
    setVolume,
    seekTo,
    howl
  } = useMusicStore();

  const [showVolume, setShowVolume] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  // Update current time
  useEffect(() => {
    if (!howl || !isPlaying) return;

    const updateTime = () => {
      if (howl && isPlaying) {
        const current = howl.seek();
        useMusicStore.getState().updateTime(current);
      }
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [howl, isPlaying]);

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    if (!duration) return;
    const clickX = e.nativeEvent.offsetX;
    const width = e.currentTarget.offsetWidth;
    const newTime = (clickX / width) * duration;
    seekTo(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  // Don't render if no current song
  if (!currentSong) {
    return null;
  }

  return (
    <div className="bg-black bg-opacity-40 backdrop-blur-lg border-t border-white border-opacity-20 p-4">
      <div className="flex items-center justify-between">
        {/* Song Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
            {currentSong.albumArt ? (
              <img 
                src={currentSong.albumArt} 
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-8 h-8 text-gray-400" />
            )}
          </div>
          
          <div className="min-w-0">
            <h4 className="text-white font-medium truncate">{currentSong.title}</h4>
            <p className="text-gray-300 text-sm truncate">{currentSong.artist}</p>
          </div>
          
          <button className="text-gray-400 hover:text-red-500 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center flex-1 max-w-md">
          <div className="flex items-center space-x-4 mb-2">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Shuffle className="w-5 h-5" />
            </button>
            
            <button 
              onClick={previousSong}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            
            <button
              onClick={togglePlay}
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>
            
            <button 
              onClick={nextSong}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
            
            <button className="text-gray-400 hover:text-white transition-colors">
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-2 w-full">
            <span className="text-xs text-gray-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            
            <div 
              className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer relative"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-white rounded-full relative"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
            
            <span className="text-xs text-gray-400 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-4 flex-1 justify-end">
          {/* Lyrics Button */}
          <button 
            onClick={() => navigate('/lyrics')}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            title="View Lyrics"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleMute}
              onMouseEnter={() => setShowVolume(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            
            {showVolume && (
              <div 
                className="w-24"
                onMouseLeave={() => setShowVolume(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;