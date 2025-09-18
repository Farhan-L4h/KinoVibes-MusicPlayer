import { create } from 'zustand';
import { Howl } from 'howler';

export const useMusicStore = create((set, get) => ({
  // Current song info
  currentSong: null,
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
  setCurrentSong: (song) => set({ currentSong: song }),
  
  playSong: (song, playlist = null) => {
    const state = get();
    
    // Stop current song if playing
    if (state.howl) {
      state.howl.stop();
    }
    
    // Create new Howl instance
    const howl = new Howl({
      src: [song.audioUrl],
      html5: true,
      volume: state.volume,
      onplay: () => set({ isPlaying: true }),
      onpause: () => set({ isPlaying: false }),
      onstop: () => set({ isPlaying: false }),
      onend: () => {
        // Auto play next song
        get().nextSong();
      },
      onload: () => {
        set({ duration: howl.duration() });
      }
    });
    
    // Update state
    set({
      currentSong: song,
      howl,
      playlist: playlist || state.playlist,
      currentIndex: playlist ? 0 : state.currentIndex
    });
    
    howl.play();
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
  
  nextSong: () => {
    const state = get();
    if (state.playlist.length > 0) {
      const nextIndex = (state.currentIndex + 1) % state.playlist.length;
      const nextSong = state.playlist[nextIndex];
      get().playSong(nextSong);
      set({ currentIndex: nextIndex });
    }
  },
  
  previousSong: () => {
    const state = get();
    if (state.playlist.length > 0) {
      const prevIndex = state.currentIndex === 0 ? state.playlist.length - 1 : state.currentIndex - 1;
      const prevSong = state.playlist[prevIndex];
      get().playSong(prevSong);
      set({ currentIndex: prevIndex });
    }
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
  
  setCurrentLyricIndex: (index) => set({ currentLyricIndex: index })
}));