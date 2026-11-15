let slotEl = null;

export const registerVideoSlot = (el) => {
  slotEl = el;
  window.dispatchEvent(new Event('kv-video-slot'));
};

export const unregisterVideoSlot = (el) => {
  if (slotEl === el) {
    slotEl = null;
    window.dispatchEvent(new Event('kv-video-slot'));
  }
};

export const getVideoSlot = () => slotEl;