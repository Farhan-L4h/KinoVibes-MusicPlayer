import React, { useState, useEffect } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { useMusicStore } from '../stores/music';
import { fetchSynchronizedLyrics, getCurrentLyricLine } from '../services/lyricsApi';

const Lyrics = () => {
  const { currentSong, isPlaying, currentTime } = useMusicStore();
  const [lyrics, setLyrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLyricData, setCurrentLyricData] = useState(null);

  useEffect(() => {
    if (currentSong) {
      loadLyrics();
    } else {
      setLyrics([]);
      setCurrentLyricData(null);
    }
  }, [currentSong]);

  useEffect(() => {
    if (lyrics.length > 0 && typeof currentTime === 'number') {
      const lyricData = getCurrentLyricLine(lyrics, currentTime);
      setCurrentLyricData(lyricData);
    }
  }, [lyrics, currentTime]);

  const loadLyrics = async () => {
    if (!currentSong) return;

    try {
      setLoading(true);
      setError(null);
      
      const lyricsData = await fetchSynchronizedLyrics(
        currentSong.id, 
        currentSong.artist, 
        currentSong.title
      );
      
      setLyrics(lyricsData.lyrics);
    } catch (err) {
      console.error('Error loading lyrics:', err);
      setError('Lyrics not available for this song');
      setLyrics([]);
    } finally {
      setLoading(false);
    }
  };

  if (!currentSong) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl font-medium">No song playing</p>
          <p className="text-sm mt-2">Play a song to see lyrics here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
            {currentSong.albumArt ? (
              <img
                src={currentSong.albumArt}
                alt={currentSong.album}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-6 h-6 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">
              {currentSong.title}
            </h1>
            <p className="text-gray-400 truncate">{currentSong.artist}</p>
            <p className="text-gray-500 text-sm truncate">{currentSong.album}</p>
          </div>

          <div className="flex items-center space-x-2">
            {isPlaying ? (
              <Volume2 className="w-5 h-5 text-green-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Lyrics Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-400">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && lyrics.length > 0 && (
          <div className="p-6">
            <div className="space-y-6 max-w-2xl mx-auto">
              {lyrics.map((line, index) => {
                const isCurrent = currentLyricData?.current === line;
                const isPast = currentLyricData?.current && 
                  lyrics.indexOf(currentLyricData.current) > index;
                const isNext = currentLyricData?.next === line;

                return (
                  <div
                    key={index}
                    className={`text-center transition-all duration-300 ${
                      isCurrent
                        ? 'text-white text-2xl lg:text-3xl font-bold scale-105 opacity-100'
                        : isPast
                        ? 'text-gray-500 text-lg opacity-60'
                        : isNext
                        ? 'text-gray-300 text-xl opacity-80'
                        : 'text-gray-400 text-lg opacity-50'
                    }`}
                    style={{
                      transform: isCurrent ? 'translateY(-10px)' : 'translateY(0)',
                    }}
                  >
                    {line.text || '\u00A0'} {/* Non-breaking space for empty lines */}
                  </div>
                );
              })}
              
              {/* Add some bottom padding for better scrolling */}
              <div className="h-64"></div>
            </div>
          </div>
        )}

        {!loading && !error && lyrics.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-400">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No lyrics available</p>
              <p className="text-sm mt-2">Try playing a different song</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with playback info */}
      {currentLyricData && (
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              {currentTime ? Math.floor(currentTime / 60) : 0}:
              {currentTime ? (currentTime % 60).toString().padStart(2, '0').split('.')[0] : '00'}
            </span>
            <span className="flex-1 text-center">
              {currentLyricData.current?.text && (
                <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">
                  Now playing
                </span>
              )}
            </span>
            <span>Synchronized Lyrics</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lyrics;