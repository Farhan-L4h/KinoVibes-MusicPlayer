import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMusicStore } from '../stores/music';
import { getSettings } from '../stores/settings';
import { toast } from '../stores/toast';

const isTypingTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
};

const flash = (message) => {
  const { toastDurationMs } = getSettings();
  toast.info(message, Math.min(1600, toastDurationMs));
};

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(e.target) || e.metaKey || e.altKey) return;
      if (!getSettings().keyboardShortcuts) return;
      if (document.querySelector('[data-kv-modal]')) return;
      const s = useMusicStore.getState();

      // F10/F11 are often reserved (F11 = fullscreen) so the same actions get
      // a modifier chord that browsers never intercept.
      const altPrev = e.ctrlKey && e.shiftKey && e.key === 'ArrowLeft';
      const altNext = e.ctrlKey && e.shiftKey && e.key === 'ArrowRight';
      if (e.ctrlKey && !altPrev && !altNext) return;

      if (e.key === 'F10' || altPrev) {
        e.preventDefault();
        s.previousTrack();
        flash('Lagu sebelumnya');
        return;
      }
      if (e.key === 'F11' || altNext) {
        e.preventDefault();
        s.nextTrack(false);
        flash('Lagu berikutnya');
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          s.togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) s.nextTrack(false);
          else s.seekTo(s.currentTime + 5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) s.previousTrack();
          else s.seekTo(s.currentTime - 5);
          break;
        case 'm':
        case 'M': {
          e.preventDefault();
          const wasMuted = s.muted;
          s.toggleMute();
          flash(wasMuted ? 'Bunyi aktif' : 'Dibisukan');
          break;
        }
        case 'l':
        case 'L': {
          if (!s.currentTrack) return;
          e.preventDefault();
          if (s.nowPlayingOpen && s.nowPlayingTab === 'lyrics') s.setNowPlayingOpen(false);
          else s.setNowPlayingOpen(true, 'lyrics');
          break;
        }
        case '/':
          if (document.querySelector('[data-kv-nowplaying]')) return;
          e.preventDefault();
          navigate('/search');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);
};