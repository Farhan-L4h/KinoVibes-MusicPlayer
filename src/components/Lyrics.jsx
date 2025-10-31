import React, { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { useMusicStore } from '../stores/music';
import { fetchSynchronizedLyrics, getCurrentLyricLine } from '../services/lyricsApi';

const Lyrics = () => {
  const { currentSong, isPlaying, currentTime, seek } = useMusicStore();
  const [lyrics, setLyrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLyricData, setCurrentLyricData] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const lyricsContainerRef = useRef(null);
  const currentLineRef = useRef(null);

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

  // Auto-scroll to current lyric
  useEffect(() => {
    if (!autoScroll || !currentLineRef.current || !lyricsContainerRef.current) return;
    
    const container = lyricsContainerRef.current;
    const currentLine = currentLineRef.current;
    
    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      const containerHeight = container.clientHeight;
      const lineOffsetTop = currentLine.offsetTop;
      const lineHeight = currentLine.clientHeight;
      
      // Calculate position to center the current line
      const scrollTo = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2);
      
      // Smooth scroll to position
      container.scrollTo({
        top: Math.max(0, scrollTo),
        behavior: 'smooth'
      });
    });
  }, [currentLyricData?.current, autoScroll]);

  // Handle manual scroll - disable auto-scroll temporarily
  const handleScroll = () => {
    if (autoScroll) {
      setAutoScroll(false);
      // Re-enable auto-scroll after 3 seconds of no manual scrolling
      setTimeout(() => setAutoScroll(true), 3000);
    }
  };

  // Handle lyric line click - jump to that time
  const handleLyricClick = (time) => {
    if (typeof time === 'number' && seek) {
      seek(time);
      setAutoScroll(true); // Re-enable auto-scroll when clicking
    }
  };

  const loadLyrics = async () => {
    if (!currentSong) return;

    try {
      setLoading(true);
      setError(null);
      
      const lyricsData = await fetchSynchronizedLyrics(
        currentSong.id, 
        currentSong.artist, 
        currentSong.title,
        currentSong.lyricsUrl
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
    <div className="h-full w-full bg-black">
      <div className="h-full flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side - Album Art (Sticky) */}
        <div className="hidden lg:flex lg:w-[400px] xl:w-[480px] flex-shrink-0 items-start justify-center p-8 border-r border-gray-800">
          <div className="sticky top-8 w-full">
            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
              {/* Album Cover */}
              <div className="relative aspect-square">
                {currentSong.albumArt ? (
                  <img
                    src={currentSong.albumArt}
                    alt={currentSong.album}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Music className="w-24 h-24 text-gray-600" />
                  </div>
                )}
              </div>
              
              {/* Song Info */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2">{currentSong.title}</h2>
                <p className="text-gray-400">{currentSong.artist}</p>
                <p className="text-gray-500 text-sm mt-1">{currentSong.album}</p>
                
                {/* Status Indicator */}
                <div className="mt-4 flex items-center gap-2">
                  {isPlaying ? (
                    <>
                      <div className="flex gap-1">
                        <div className="w-1 h-4 bg-green-500 animate-pulse"></div>
                        <div className="w-1 h-4 bg-green-500 animate-pulse animation-delay-1000"></div>
                        <div className="w-1 h-4 bg-green-500 animate-pulse animation-delay-2000"></div>
                      </div>
                      <span className="text-green-500 text-sm font-medium">Now playing</span>
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm">Paused</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Lyrics (Full Width) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                {currentSong.albumArt ? (
                  <img src={currentSong.albumArt} alt={currentSong.album} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-6 h-6 text-gray-400 m-auto mt-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate">{currentSong.title}</h3>
                <p className="text-sm text-gray-400 truncate">{currentSong.artist}</p>
              </div>
            </div>
          </div>

          {/* Lyrics Header - Fixed */}
          <div className="px-8 lg:px-12 xl:px-16 py-6 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Lyrics</h3>
          </div>

          {/* Lyrics Content Wrapper */}
          <div className="flex-1 overflow-hidden relative">

            <div 
              ref={lyricsContainerRef}
              className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
              onScroll={handleScroll}
              style={{ scrollBehavior: 'smooth' }}
            >
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
                <div className="max-w-4xl mx-auto px-8 lg:px-12 xl:px-16 py-8">
                  {/* Top padding */}
                  <div className="h-24"></div>
                  
                  {lyrics.map((line, index) => {
                    const isCurrent = currentLyricData?.current === line;
                    const isPast = currentLyricData?.current && 
                      lyrics.indexOf(currentLyricData.current) > index;

                    return (
                      <div
                        key={index}
                        ref={isCurrent ? currentLineRef : null}
                        onClick={() => handleLyricClick(line.time)}
                        className={`transition-all duration-200 cursor-pointer py-2 mb-2 ${
                          isCurrent
                            ? 'text-white text-4xl lg:text-5xl xl:text-6xl font-bold'
                            : isPast
                            ? 'text-gray-600 text-xl lg:text-2xl hover:text-gray-500'
                            : 'text-gray-600 text-xl lg:text-2xl hover:text-gray-500'
                        }`}
                        style={{
                          lineHeight: '1.4',
                        }}
                      >
                        {line.text || '\u00A0'}
                      </div>
                    );
                  })}
                  
                  {/* Bottom padding */}
                  <div className="h-96"></div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lyrics;