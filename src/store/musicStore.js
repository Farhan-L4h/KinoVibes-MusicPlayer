import { create } from 'zustand';
import { Howl } from 'howler';

export const useMusicStore = create((set, get) => ({
  // Current track info
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  
  // Playlist and queue
  playlist: [],
  currentIndex: 0,
  queue: [],
  
  // Lyrics
  lyrics: null,
  currentLyricIndex: 0,
  
  // Howler instance
  howl: null,
  
  // Actions
  setCurrentTrack: (track) => set({ currentTrack: track }),
  
  playTrack: (track, playlist = null) => {
    const state = get();
    
    // Stop current song if playing
    if (state.howl) {
      state.howl.stop();
    }
    
    // Create new Howl instance
    const howl = new Howl({
      src: [track.audioUrl],
      html5: true,
      volume: state.volume,
      onplay: () => set({ isPlaying: true }),
      onpause: () => set({ isPlaying: false }),
      onstop: () => set({ isPlaying: false }),
      onend: () => {
        // Auto play next song
        get().nextTrack();
      },
      onload: () => {
        set({ duration: howl.duration() });
      }
    });
    
    // Update state
    set({
      currentTrack: track,
      howl,
      playlist: playlist || state.playlist,
      currentIndex: playlist ? 0 : state.currentIndex
    });
    
    howl.play();
  },
  
  pauseTrack: () => {
    const state = get();
    if (state.howl && state.isPlaying) {
      state.howl.pause();
    }
  },
  
  togglePlay: () => {
    const state = get();
    if (state.howl) {
      if (state.isPlaying) {
        state.howl.pause();
      } else {
        state.howl.play();
      }
    }
  },
  
  nextTrack: () => {
    const state = get();
    if (state.playlist.length > 0) {
      const nextIndex = (state.currentIndex + 1) % state.playlist.length;
      const nextTrack = state.playlist[nextIndex];
      get().playTrack(nextTrack);
      set({ currentIndex: nextIndex });
    }
  },
  
  previousTrack: () => {
    const state = get();
    if (state.playlist.length > 0) {
      const prevIndex = state.currentIndex === 0 ? state.playlist.length - 1 : state.currentIndex - 1;
      const prevTrack = state.playlist[prevIndex];
      get().playTrack(prevTrack);
      set({ currentIndex: prevIndex });
    }
  },
  
  addToQueue: (track) => {
    const state = get();
    set({ queue: [...state.queue, track] });
  },
  
  setVolume: (volume) => {
    const state = get();
    if (state.howl) {
      state.howl.volume(volume);
    }
    set({ volume });
  },
  
  seekTo: (time) => {
    const state = get();
    if (state.howl) {
      state.howl.seek(time);
      set({ currentTime: time });
    }
  },
  
  updateTime: (time) => set({ currentTime: time }),
  
  setLyrics: (lyrics) => set({ lyrics }),
  
  setCurrentLyricIndex: (index) => set({ currentLyricIndex: index }),

  // Backward compatibility - legacy function names
  currentSong: null,
  playSong: (song, playlist) => get().playTrack(song, playlist)
}));