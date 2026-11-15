import { useEffect, useRef } from 'react';
import { useMusicStore } from '../../stores/music';

const BARS = 56;

// Stylized spectrum, not a true FFT: YouTube audio is cross-origin and HTML5
// uploads can't be tapped without rerouting playback, so motion follows play state.
export default function Visualizer({ className = '', bars = BARS }) {
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
    const n = Math.max(8, bars);
    const phases = Array.from({ length: n }, (_, i) => i * 0.55 + Math.sin(i) * 2);
    const speeds = Array.from({ length: n }, (_, i) => 0.9 + (i % 7) * 0.13);
    const weights = Array.from({ length: n }, (_, i) => {
      const x = i / (n - 1);
      const d = (x - 0.26) / 0.44;
      return 0.32 + 0.68 * Math.exp(-(d * d));
    });

    let raf = 0;
    let running = false;
    let energy = playingRef.current ? 1 : 0.12;
    let ink = getComputedStyle(canvas).color;
    let colorTick = 0;

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
      if (colorTick++ % 30 === 0) ink = getComputedStyle(canvas).color;
      ctx.clearRect(0, 0, w, h);
      const gap = w > 320 ? 2 : 1.5;
      const bw = (w - gap * (n - 1)) / n;
      const time = t / 1000;
      const radius = Math.min(bw / 2, 2);
      ctx.fillStyle = ink;
      for (let i = 0; i < n; i++) {
        const wave = 0.5 + 0.5 * Math.sin(time * speeds[i] * 2.2 + phases[i]) * Math.sin(time * 0.7 + i * 0.13);
        const flicker = 0.82 + 0.18 * Math.sin(time * 9 + i * 1.7);
        const level = Math.max(0.06, weights[i] * wave * flicker);
        const bh = Math.max(2, level * energy * (h - 4));
        const x = i * (bw + gap);
        const y = h - bh;
        ctx.globalAlpha = 0.26 + 0.62 * level * energy;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, y, bw, bh, radius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, bw, bh);
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t) => {
      const target = playingRef.current ? 1 : 0.12;
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
        energy = playingRef.current ? 0.85 : 0.12;
        draw(0);
        return;
      }
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    kickRef.current = kick;

    resize();
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
  }, [bars]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full text-kv-ink ${className}`}
    />
  );
}