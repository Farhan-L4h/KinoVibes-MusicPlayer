import React, { useEffect, useState } from 'react';
import { useMusicStore } from '../stores/music';
import { Music2, ChevronDown } from 'lucide-react';

const LyricsPageYT = () => {
  const { currentTrack, currentTime } = useMusicStore();
  const [lyrics, setLyrics] = useState([]);
  const [activeLine, setActiveLine] = useState(0);

  useEffect(() => {
    if (currentTrack?.lyricsUrl) {
      fetchLyrics(currentTrack.lyricsUrl);
    } else {
      // Default placeholder lyrics
      setLyrics([
        { time: 0, text: 'No lyrics available' },
        { time: 1, text: 'Upload a lyrics file (.lrc, .txt, .json)' },
        { time: 2, text: 'to see synchronized lyrics here' },
      ]);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!lyrics.length) return;
    
    // Find active lyric line based on current time
    const currentIndex = lyrics.findIndex((line, idx) => {
      const nextLine = lyrics[idx + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });
    
    if (currentIndex !== -1) {
      setActiveLine(currentIndex);
    }
  }, [currentTime, lyrics]);

  const fetchLyrics = async (url) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      // Parse LRC format
      if (url.endsWith('.lrc')) {
        const parsed = parseLRC(text);
        setLyrics(parsed);
      } else {
        // Plain text - split by lines
        const lines = text.split('\n').filter(l => l.trim());
        setLyrics(lines.map((text, idx) => ({ time: idx * 3, text })));
      }
    } catch (error) {
      console.error('Failed to fetch lyrics:', error);
    }
  };

  const parseLRC = (lrcText) => {
    const lines = lrcText.split('\n');
    const lyrics = [];
    
    lines.forEach(line => {
      const match = line.match(/\[(\d+):(\d+)\.?(\d+)?\](.*)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = match[3] ? parseInt(match[3]) / 100 : 0;
        const time = minutes * 60 + seconds + milliseconds;
        const text = match[4].trim();
        
        if (text) {
          lyrics.push({ time, text });
        }
      }
    });
    
    return lyrics;
  };

  if (!currentTrack) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-yt-bg-elevated/50 rounded-full flex items-center justify-center mb-6">
          <Music2 className="w-10 h-10 text-yt-text-tertiary" />
        </div>
        <h2 className="text-2xl font-bold text-yt-text-primary mb-2">
          No song playing
        </h2>
        <p className="text-yt-text-secondary max-w-md">
          Start playing a song to see the lyrics here
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header with album art blur background */}
      <div className="relative mb-8 md:mb-12">
        {/* Background blur */}
        {currentTrack.albumArt && (
          <div 
            className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-full h-96 opacity-20 blur-3xl"
            style={{
              backgroundImage: `url(${currentTrack.albumArt})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        
        {/* Content */}
        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8 pt-8">
          {/* Album Art */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
            {currentTrack.albumArt ? (
              <img
                src={currentTrack.albumArt}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-yt-bg-elevated to-yt-bg-primary flex items-center justify-center">
                <Music2 className="w-20 h-20 text-yt-text-tertiary" />
              </div>
            )}
          </div>
          
          {/* Track Info */}
          <div className="text-center md:text-left">
            <div className="text-sm text-yt-text-secondary mb-2 uppercase tracking-wider">
              Lyrics
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-yt-text-primary mb-3">
              {currentTrack.title}
            </h1>
            <p className="text-lg md:text-xl text-yt-text-secondary mb-4">
              {currentTrack.artist}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-yt-text-tertiary">
              <span>{currentTrack.album}</span>
              <span>•</span>
              <span>
                {Math.floor(currentTrack.duration / 60)}:
                {String(Math.floor(currentTrack.duration % 60)).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lyrics Display - YouTube Music Style */}
      <div className="max-w-4xl mx-auto px-4">
        {/* Scroll hint */}
        <div className="flex items-center justify-center mb-8 opacity-50">
          <ChevronDown className="w-5 h-5 text-yt-text-tertiary animate-bounce" />
        </div>

        {/* Lyrics Lines */}
        <div className="space-y-6 md:space-y-8">
          {lyrics.map((line, index) => {
            const isActive = index === activeLine;
            const isPast = index < activeLine;
            const isFuture = index > activeLine;
            
            return (
              <div
                key={index}
                className={`
                  transition-all duration-500 transform
                  ${isActive ? 'scale-100 opacity-100' : ''}
                  ${isPast ? 'scale-95 opacity-40' : ''}
                  ${isFuture ? 'scale-95 opacity-40' : ''}
                `}
              >
                <p
                  className={`
                    text-2xl md:text-4xl lg:text-5xl font-bold leading-relaxed
                    transition-all duration-500
                    ${isActive ? 'text-yt-text-primary text-shadow-lg' : 'text-yt-text-secondary'}
                  `}
                  style={{
                    textShadow: isActive ? '0 0 30px rgba(255,255,255,0.3)' : 'none',
                  }}
                >
                  {line.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom spacer */}
        <div className="h-64" />
      </div>
    </div>
  );
};

export default LyricsPageYT;
