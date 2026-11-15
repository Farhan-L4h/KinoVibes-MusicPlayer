// Inline video slots, highest priority wins: NowPlaying (3) > Home deck (2) >
// route deck card (1). The iframe is portalled into the winner so it stays in
// normal flow instead of floating over the UI.
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