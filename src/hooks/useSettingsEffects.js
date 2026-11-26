import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settings';
import { useMusicStore } from '../stores/music';
import { setEqualizer } from '../player/analyser';
import { ytPlayer } from '../player/youtube';
import { clearMediaSession, updateMediaMetadata } from '../player/mediaSession';

// Applies preferences that live outside React render (CSS variables, Web Audio
// graph, YouTube player) and keeps them in sync with the persisted settings.
export const useSettingsEffects = () => {
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const eqEnabled = useSettingsStore((s) => s.eqEnabled);
  const eqGains = useSettingsStore((s) => s.eqGains);
  const youtubeQuality = useSettingsStore((s) => s.youtubeQuality);
  const mediaSessionEnabled = useSettingsStore((s) => s.mediaSessionEnabled);
  const lyricsFontScale = useSettingsStore((s) => s.lyricsFontScale);
  const lyricsSpeed = useSettingsStore((s) => s.lyricsSpeed);
  const lyricsBlur = useSettingsStore((s) => s.lyricsBlur);
  const lyricsActiveHighlight = useSettingsStore((s) => s.lyricsActiveHighlight);

  useEffect(() => {
    document.documentElement.classList.toggle('kv-reduce-motion', reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    setEqualizer({ enabled: eqEnabled, gains: eqGains });
  }, [eqEnabled, eqGains]);

  useEffect(() => {
    ytPlayer.setQuality(youtubeQuality);
  }, [youtubeQuality]);

  useEffect(() => {
    if (!mediaSessionEnabled) {
      clearMediaSession();
      return;
    }
    const track = useMusicStore.getState().currentTrack;
    if (track) updateMediaMetadata(track);
  }, [mediaSessionEnabled]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--kv-lyric-scale', String(lyricsFontScale));
    root.style.setProperty('--kv-lyric-duration', `${Math.round(560 / lyricsSpeed)}ms`);
    root.style.setProperty('--kv-lyric-blur', lyricsBlur ? '1.4px' : '0px');
    root.classList.toggle('kv-lyrics-no-highlight', !lyricsActiveHighlight);
  }, [lyricsFontScale, lyricsSpeed, lyricsBlur, lyricsActiveHighlight]);
};
