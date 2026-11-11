let slotEl = null;

export const registerVideoSlot = (el) => {
  slotEl = el;
};

export const unregisterVideoSlot = (el) => {
  if (slotEl === el) slotEl = null;
};

export const getVideoSlot = () => slotEl;