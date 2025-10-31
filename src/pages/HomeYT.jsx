import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth';
import { useMusicStore } from '../stores/music';
import { Play, Pause, TrendingUp, Clock, Plus, ListMusic } from 'lucide-react';
import { getTrendingMusic, getAllMusic } from '../services/supabaseMusicApi';
import LoadingSpinner from '../components/LoadingSpinner';
import AuroraBackground from '../components/AuroraBackground';
import FadeInView from '../components/FadeInView';

const HomeYT = () => {
  const { user } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useMusicStore();
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMusicData();
  }, []);

  const loadMusicData = async () => {
    try {
      setLoading(true);
      const allMusic = await getAllMusic();
      setRecentlyPlayed(allMusic.slice(0, 6));
      
      const trendingMusic = await getTrendingMusic(20);
      setTrending(trendingMusic);
    } catch (error) {
      console.error('Error loading music:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack();
    } else {
      playTrack(track, trending);
    }
  };

  const isCurrentTrack = (track) => currentTrack?.id === track.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 relative">
      {/* Welcome Section */}
      <div className="mb-8 relative z-10 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-bold text-yt-text-primary mb-2">
          Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! 👋
        </h1>
        <p className="text-yt-text-secondary">
          Ready to discover your next favorite song?
        </p>
      </div>

      {/* Quick Stats Cards */}
      <FadeInView className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 relative z-10" delay={0.3}>
        <div className="bg-yt-bg-elevated/50 backdrop-blur-md rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <ListMusic className="w-5 h-5 text-yt-text-secondary" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-yt-text-primary">{trending.length}</div>
          <div className="text-xs text-yt-text-secondary">Total Songs</div>
        </div>
        
        <div className="bg-yt-bg-elevated/50 backdrop-blur-md rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-yt-text-secondary" />
          </div>
          <div className="text-2xl font-bold text-yt-text-primary">
            {Math.floor(trending.reduce((acc, t) => acc + (t.duration || 0), 0) / 3600)}h
          </div>
          <div className="text-xs text-yt-text-secondary">Hours Played</div>
        </div>
      </FadeInView>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <div className="mb-12 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yt-text-primary">Quick picks</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentlyPlayed.map((track) => (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track)}
                className="group bg-yt-bg-elevated/40 backdrop-blur-sm rounded-xl p-3 hover:bg-yt-bg-elevated/70 transition-all cursor-pointer border border-white/5 hover:border-white/10"
              >
                <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-yt-bg-primary">
                  {track.albumArt ? (
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yt-bg-elevated to-yt-bg-primary">
                      <ListMusic className="w-10 h-10 text-yt-text-tertiary" />
                    </div>
                  )}
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                      {isCurrentTrack(track) && isPlaying ? (
                        <Pause className="w-6 h-6 text-black" fill="currentColor" />
                      ) : (
                        <Play className="w-6 h-6 text-black ml-0.5" fill="currentColor" />
                      )}
                    </div>
                  </div>
                  
                  {/* Currently playing indicator */}
                  {isCurrentTrack(track) && isPlaying && (
                    <div className="absolute bottom-2 right-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse" />
                        <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-75" />
                        <div className="w-1 h-2 bg-green-500 rounded-full animate-pulse delay-150" />
                      </div>
                    </div>
                  )}
                </div>
                
                <h3 className="text-sm font-semibold text-yt-text-primary truncate mb-1">
                  {track.title}
                </h3>
                <p className="text-xs text-yt-text-secondary truncate">
                  {track.artist}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Now - YouTube Music List Style */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yt-brand/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yt-brand" />
            </div>
            <h2 className="text-2xl font-bold text-yt-text-primary">Trending Now</h2>
          </div>
        </div>

        {/* List View */}
        <div className="space-y-1">
          {trending.map((track, index) => (
            <div
              key={track.id}
              onClick={() => handlePlayTrack(track)}
              className={`group flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-yt-bg-elevated/50 transition-all cursor-pointer
                ${isCurrentTrack(track) ? 'bg-yt-bg-elevated/70' : ''}`}
            >
              {/* Index/Play Button */}
              <div className="w-10 flex items-center justify-center flex-shrink-0">
                <span className={`text-sm font-medium group-hover:hidden ${
                  isCurrentTrack(track) ? 'text-yt-brand' : 'text-yt-text-secondary'
                }`}>
                  {index + 1}
                </span>
                <div className="hidden group-hover:flex">
                  {isCurrentTrack(track) && isPlaying ? (
                    <Pause className="w-5 h-5 text-yt-text-primary" fill="currentColor" />
                  ) : (
                    <Play className="w-5 h-5 text-yt-text-primary" fill="currentColor" />
                  )}
                </div>
              </div>

              {/* Album Art */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-yt-bg-primary">
                {track.albumArt ? (
                  <img
                    src={track.albumArt}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yt-bg-elevated to-yt-bg-primary">
                    <ListMusic className="w-5 h-5 text-yt-text-tertiary" />
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium truncate ${
                  isCurrentTrack(track) ? 'text-yt-brand' : 'text-yt-text-primary'
                }`}>
                  {track.title}
                </h3>
                <p className="text-xs text-yt-text-secondary truncate">
                  {track.artist}
                </p>
              </div>

              {/* Album */}
              <div className="hidden md:block flex-1 min-w-0">
                <p className="text-sm text-yt-text-secondary truncate">
                  {track.album}
                </p>
              </div>

              {/* Duration */}
              <div className="text-sm text-yt-text-secondary flex-shrink-0">
                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
              </div>

              {/* More options */}
              <button className="w-8 h-8 rounded-full hover:bg-yt-bg-elevated flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-yt-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeYT;
