import { useRef } from 'react';

export const useSeekDrag = (getDuration, seekTo) => {
  const ref = useRef(null);
  const dragging = useRef(false);

  const ratioFrom = (e) => {
    const el = ref.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return r.width > 0 ? Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) : 0;
  };

  return {
    ref,
    handlers: {
      onPointerDown: (e) => {
        const d = getDuration();
        if (!(d > 0)) return;
        dragging.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      },
      onPointerUp: (e) => {
        if (!dragging.current) return;
        dragging.current = false;
        const d = getDuration();
        if (d > 0) seekTo(ratioFrom(e) * d);
      },
      onPointerCancel: () => {
        dragging.current = false;
      },
    },
  };
};