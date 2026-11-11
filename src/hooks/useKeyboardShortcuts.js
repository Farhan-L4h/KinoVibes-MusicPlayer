import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMusicStore } from '../stores/music';

const isTypingTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useMusicStore.getState();

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
        case 'M':
          s.toggleMute();
          break;
        case 'l':
        case 'L':
          if (s.currentTrack) navigate('/lyrics');
          break;
        case '/':
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