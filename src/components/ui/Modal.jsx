import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import IconButton from './IconButton';

export default function Modal({ open, onClose, title, children, className, wide }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.activeElement;
    panelRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#0a0a0a]/60 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'kv-card max-h-[92vh] w-full animate-slide-up overflow-y-auto rounded-b-none sm:rounded-kv',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
          className
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b-3 border-kv-ink bg-kv-yellow px-4 py-3">
          <h2 className="font-display text-lg uppercase text-[#0a0a0a]">{title}</h2>
          <IconButton label="Tutup" size="sm" variant="ghost" onClick={onClose} className="bg-kv-surface">
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}