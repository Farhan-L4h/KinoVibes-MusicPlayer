import { useEffect, useRef } from 'react';
import { useMusicStore } from '../../stores/music';
import { readTime } from '../../player/analyser';

// Oscilloscope: real time-domain audio when the graph is live (uploads and
// Spotify previews), stylized ripple for YouTube/Spotify SDK whose audio can't
// be tapped. Borrows the cover's ambient light; calm when paused.
export default function Visualizer({ className = '' }) {
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
    let energy = playingRef.current ? 1 : 0.14;
    let colorTick = 0;
    let ink = '#888';
    let a = ink;
    let b = ink;

    const refreshColors = () => {
      const cs = getComputedStyle(canvas);
      ink = cs.color;
      const pick = (name, fallback) => {
        const v = cs.getPropertyValue(name).trim();
        return v && v !== 'transparent' && v !== 'rgba(0, 0, 0, 0)' ? v : fallback;
      };
      a = pick('--kv-ambient-a', ink);
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
      if (colorTick++ % 30 === 0) refreshColors();
      ctx.clearRect(0, 0, w, h);
      const mid = h / 2;
      const time = t / 1000;
      const amp = h * 0.36 * energy;
      const pulse = 0.86 + 0.14 * Math.sin(time * 2.1);
      const step = Math.max(2, Math.floor(w / 240));

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, a);
      grad.addColorStop(0.5, b);
      grad.addColorStop(1, a);

      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.stroke();

      const pts = [];
      const wave = readTime();
      if (wave) {
        const gain = h * 0.44 * energy;
        for (let x = 0; x <= w; x += step) {
          const idx = Math.min(wave.length - 1, Math.round((x / w) * (wave.length - 1)));
          const win = Math.pow(Math.sin(Math.PI * (x / w)), 0.3);
          const y = mid + ((wave[idx] - 128) / 128) * gain * win;
          pts.push([x, y]);
        }
      } else {
        for (let x = 0; x <= w; x += step) {
          const win = Math.pow(Math.sin(Math.PI * (x / w)), 0.85);
          const swell = 0.78 + 0.22 * Math.sin(x * 0.006 - time * 0.9);
          const y =
            mid +
            win * swell * pulse * amp *
              (0.6 * Math.sin(x * 0.018 + time * 1.8) +
                0.3 * Math.sin(x * 0.031 - time * 2.6 + 1.3) +
                0.18 * Math.sin(x * 0.052 + time * 3.4 + 2.1));
          pts.push([x, y]);
        }
      }
      const trace = (mirror) => {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i += 1) {
          const [x, y] = pts[i];
          const yy = mirror ? 2 * mid - y : y;
          if (i) ctx.lineTo(x, yy);
          else ctx.moveTo(x, yy);
        }
      };

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = grad;
      ctx.shadowBlur = 0;

      ctx.globalAlpha = 0.12 * energy;
      ctx.lineWidth = 1.5;
      trace(true);
      ctx.stroke();

      ctx.globalAlpha = 0.12 * energy;
      ctx.lineWidth = 6;
      trace(false);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.shadowColor = a;
      ctx.shadowBlur = 6 + 10 * energy;
      trace(false);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    const loop = (t) => {
      const target = playingRef.current ? 1 : 0.14;
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
        energy = playingRef.current ? 0.85 : 0.14;
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

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full text-kv-ink ${className}`}
    />
  );
}