// Inline video slots, highest priority wins: NowPlaying (3) > Home deck (2) >
// lyrics cover (1). The persistent host positions itself over the winner so the
// iframe never reparents (no playback reload on navigation).
const slots = new Map();

const emit = () => window.dispatchEvent(new Event('kv-video-slot'));

export const registerVideoSlot = (el, priority = 1) => {
  if (!el) return;
  slots.set(el, priority);
  emit();
};

export const unregisterVideoSlot = (el) => {
  if (slots.delete(el)) emit();
};

export const getVideoSlot = () => {
  let best = null;
  let bestPriority = -1;
  for (const [el, priority] of slots) {
    if (el.isConnected && priority > bestPriority) {
      bestPriority = priority;
      best = el;
    }
  }
  return best;
};