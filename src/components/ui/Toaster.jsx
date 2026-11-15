import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '../../stores/toast';

const ICONS = {
  green: CheckCircle2,
  red: AlertTriangle,
  blue: Info,
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[120] flex w-[calc(100%-1.5rem)] max-w-sm flex-col items-end gap-2 sm:right-5 sm:top-5">
      {toasts.map(({ id, message, tone }) => {
        const Icon = ICONS[tone] || Info;
        return (
          <div
            key={id}
            role="status"
            className="pointer-events-auto flex animate-pop-in items-center gap-2.5 rounded-full border border-kv-ink bg-kv-ink px-4 py-2.5 text-kv-panel shadow-kv-lg"
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <p className="flex-1 text-sm font-semibold">{message}</p>
            <button
              onClick={() => dismiss(id)}
              aria-label="Tutup notifikasi"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-kv-panel/70 transition-colors hover:bg-kv-panel/15 hover:text-kv-panel"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
