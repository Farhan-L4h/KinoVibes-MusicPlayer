import { Howler } from 'howler';

// Real FFT for sources we can legally tap (uploads, Spotify previews).
// YouTube iframe and Spotify SDK audio are cross-origin/DRM and stay on the
// stylized fallback — tapping them would either silence playback or break ToS.

let audioCtx = null;
let analyser = null;
let freqData = null;
let timeData = null;
let live = false;
const tappedNodes = new WeakSet();
const corsCache = new Map();

const ensureGraph = () => {
  if (analyser) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  audioCtx = new AC();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.82;
  analyser.connect(audioCtx.destination);
  freqData = new Uint8Array(analyser.frequencyBinCount);
  timeData = new Uint8Array(analyser.fftSize);
  return true;
};

// Returns 'same' (same-origin, tap without crossOrigin), 'cors' (cross-origin
// with CORS headers, tap with crossOrigin), or 'none' (cannot tap safely).
export const probeCors = async (url) => {
  try {
    const origin = new URL(url, window.location.href).origin;
    if (origin === window.location.origin) return 'same';
    const cached = corsCache.get(origin);
    if (cached) return cached.ok ? 'cors' : Date.now() < cached.retryAt ? 'none' : await probeOrigin(url, origin);
    return await probeOrigin(url, origin);
  } catch {
    return 'none';
  }
};

const probeOrigin = async (url, origin) => {
  try {
    const res = await fetch(url, { mode: 'cors', headers: { Range: 'bytes=0-0' } });
    res.body?.cancel().catch(() => {});
    const ok = res.ok || res.status === 206;
    corsCache.set(origin, ok ? { ok: true } : { ok: false, retryAt: Date.now() + 60_000 });
    return ok ? 'cors' : 'none';
  } catch {
    corsCache.set(origin, { ok: false, retryAt: Date.now() + 60_000 });
    return 'none';
  }
};

// Howler assigns the real src during construction (preload → Sound init), so
// crossOrigin must be set on the pooled node before `new Howl()` runs.
export const withCorsAudio = (cors, create) => {
  const orig = Howler._obtainHtml5Audio;
  Howler._obtainHtml5Audio = function obtain() {
    let node = orig.call(this);
    // A tapped element outputting non-CORS media would be permanently muted.
    if (!cors && tappedNodes.has(node)) node = new Audio();
    node.crossOrigin = cors ? 'anonymous' : null;
    return node;
  };
  try {
    return create();
  } finally {
    Howler._obtainHtml5Audio = orig;
  }
};

export const tapHowl = (howl) => {
  try {
    const node = howl?._sounds?.[0]?._node;
    if (!node) return false;
    if (tappedNodes.has(node)) return true;
    if (!ensureGraph()) return false;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    audioCtx.createMediaElementSource(node).connect(analyser);
    tappedNodes.add(node);
    return true;
  } catch {
    return false;
  }
};

export const markLive = (on) => {
  live = !!on;
};

export const readFreq = () => {
  if (!live || !analyser || audioCtx.state !== 'running') return null;
  analyser.getByteFrequencyData(freqData);
  return freqData;
};

export const readTime = () => {
  if (!live || !analyser || audioCtx.state !== 'running') return null;
  analyser.getByteTimeDomainData(timeData);
  return timeData;
};