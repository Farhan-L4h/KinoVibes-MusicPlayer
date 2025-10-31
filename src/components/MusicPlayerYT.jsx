import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  VolumeX,
  Heart,
  Music,
  ChevronUp,
  MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMusicStore } from '../stores/music';

const MusicPlayerYT = () => {
  const navigate = useNavigate();
  const {
    currentSong,
    currentTrack,
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
  const [isExpanded, setIsExpanded] = useState(false);

  const track = currentTrack || currentSong;

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
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
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

  if (!track) {
    return null; // Hide player when no song
  }

  return (
    <>
      {/* Desktop Music Player */}
      <div className="hidden md:block bg-yt-bg-secondary/95 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-screen-2xl mx-auto px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Album Art & Track Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-yt-bg-primary cursor-pointer hover:scale-105 transition-transform"
                   onClick={() => navigate('/lyrics')}>
                {track.albumArt ? (
                  <img
                    src={track.albumArt}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yt-bg-elevated to-yt-bg-primary">
                    <Music className="w-6 h-6 text-yt-text-tertiary" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-yt-text-primary truncate hover:underline cursor-pointer"
                    onClick={() => navigate('/lyrics')}>
                  {track.title}
                </h4>
                <p className="text-xs text-yt-text-secondary truncate">
                  {track.artist}
                </p>
              </div>

              <button className="p-2 rounded-full hover:bg-yt-bg-elevated transition-colors">
                <Heart className="w-5 h-5 text-yt-text-secondary hover:text-yt-brand" />
              </button>
            </div>

            {/* Center Controls */}
            <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={previousSong}
                  className="p-2 rounded-full hover:bg-yt-bg-elevated transition-colors"
                >
                  <SkipBack className="w-5 h-5 text-yt-text-primary" fill="currentColor" />
                </button>
                
                <button
                  onClick={togglePlay}
                  className="p-3 bg-white rounded-full hover:scale-105 transition-transform shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-black" fill="currentColor" />
                  ) : (
                    <Play className="w-6 h-6 text-black ml-0.5" fill="currentColor" />
                  )}
                </button>
                
                <button
                  onClick={nextSong}
                  className="p-2 rounded-full hover:bg-yt-bg-elevated transition-colors"
                >
                  <SkipForward className="w-5 h-5 text-yt-text-primary" fill="currentColor" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs text-yt-text-secondary w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <div
                  className="flex-1 h-1 bg-yt-bg-elevated rounded-full cursor-pointer group"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-white rounded-full relative group-hover:bg-yt-brand transition-colors"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                  </div>
                </div>
                <span className="text-xs text-yt-text-secondary w-10">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="relative flex items-center"
                   onMouseEnter={() => setShowVolume(true)}
                   onMouseLeave={() => setShowVolume(false)}>
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full hover:bg-yt-bg-elevated transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-yt-text-secondary" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-yt-text-secondary" />
                  )}
                </button>
                
                {showVolume && (
                  <div className="absolute bottom-full right-0 mb-2 p-2 bg-yt-bg-elevated rounded-lg shadow-xl">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 accent-white"
                      style={{ writingMode: 'bt-lr', appearance: 'slider-vertical' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Music Player - Mini Bar */}
      <div className="md:hidden bg-yt-bg-secondary/95 backdrop-blur-xl border-t border-white/10">
        {/* Progress bar on top */}
        <div
          className="h-1 bg-yt-bg-elevated cursor-pointer active:bg-yt-bg-hover"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-yt-brand transition-all"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Mini Player Content */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Album Art */}
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-yt-bg-primary"
               onClick={() => setIsExpanded(!isExpanded)}>
            {track.albumArt ? (
              <img
                src={track.albumArt}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yt-bg-elevated to-yt-bg-primary">
                <Music className="w-5 h-5 text-yt-text-tertiary" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0" onClick={() => navigate('/lyrics')}>
            <h4 className="text-sm font-semibold text-yt-text-primary truncate">
              {track.title}
            </h4>
            <p className="text-xs text-yt-text-secondary truncate">
              {track.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={togglePlay}
              className="p-2 bg-white rounded-full shadow-lg active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-black" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
              )}
            </button>

            <button
              onClick={nextSong}
              className="p-2 rounded-full hover:bg-yt-bg-elevated active:scale-95 transition-all"
            >
              <SkipForward className="w-5 h-5 text-yt-text-primary" fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicPlayerYT;
