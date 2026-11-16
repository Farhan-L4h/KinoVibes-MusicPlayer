import { useEffect, useRef } from 'react';
import { useMusicStore } from '../../stores/music';

// A tall equalizer column that sits beside the cover. Like the oscilloscope it
// is stylized (cross-origin audio can't be tapped), follows play state, borrows
// the ambient light, and stops its rAF loop when paused to stay cheap.
export default function VerticalSpectrum({ className = '' }) {
  const canvasRef = useRef(null);
  const playingRef = useRef(false);
  const kickRef = useRef(null);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const hasTrack = useMusicStore((s) => !!s.currentTrack);

  useEffect(() => {
    playingRef.current = isPlaying && hasTrack;
    kickRef.current?.();
  }, [isPlaying, hasTrack]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let running = false;
    let energy = playingRef.current ? 1 : 0.16;
    let tick = 0;
    let a = '#888';
    let b = '#888';

    const refreshColors = () => {
      const cs = getComputedStyle(canvas);
      const pick = (name, fb) => {
        const v = cs.getPropertyValue(name).trim();
        return v && v !== 'transparent' && v !== 'rgba(0, 0, 0, 0)' ? v : fb;
      };
      a = pick('--kv-ambient-a', cs.color);
      b = pick('--kv-ambient-b', a);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      if (tick++ % 30 === 0) refreshColors();
      ctx.clearRect(0, 0, w, h);
      const time = t / 1000;
      const bands = 26;
      const gap = 3;
      const bh = (h - gap * (bands - 1)) / bands;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, a);
      grad.addColorStop(1, b);
      ctx.fillStyle = grad;
      ctx.lineJoin = 'round';
      for (let i = 0; i < bands; i += 1) {
        const y = i * (bh + gap);
        const center = 1 - Math.abs(i / (bands - 1) - 0.45) * 1.5;
        const wave =
          0.5 +
          0.32 * Math.sin(time * 2.2 + i * 0.55) +
          0.2 * Math.sin(time * 3.7 - i * 0.31 + 1.2);
        const len = Math.max(2, w * Math.max(0.06, center) * wave * energy);
        ctx.globalAlpha = 0.28 + 0.72 * energy * Math.max(0.2, center);
        const r = Math.min(bh / 2, 2);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(0, y, len, bh, r);
        else ctx.rect(0, y, len, bh);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t) => {
      const target = playingRef.current ? 1 : 0.16;
      energy += (target - energy) * 0.08;
      draw(t);
      if (!playingRef.current && Math.abs(energy - target) < 0.01) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (reduce) {
        energy = playingRef.current ? 0.85 : 0.16;
        refreshColors();
        draw(0);
        return;
      }
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    kickRef.current = kick;

    resize();
    refreshColors();
    kick();
    const ro = new ResizeObserver(() => {
      resize();
      if (!running) draw(0);
    });
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      running = false;
      kickRef.current = null;
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full text-kv-ink ${className}`} />;
}