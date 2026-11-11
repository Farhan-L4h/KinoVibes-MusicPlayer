import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '../../stores/toast';
import { cn } from '../../lib/utils';

const TONES = {
  green: { bg: 'bg-kv-green', Icon: CheckCircle2 },
  red: { bg: 'bg-kv-red', Icon: AlertTriangle },
  blue: { bg: 'bg-kv-blue', Icon: Info },
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[120] flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-2 sm:right-5 sm:top-5">
      {toasts.map(({ id, message, tone }) => {
        const { bg, Icon } = TONES[tone] || TONES.blue;
        return (
          <div
            key={id}
            role="status"
            className={cn(
              'pointer-events-auto flex animate-pop-in items-center gap-2.5 rounded-kv border-3 border-kv-ink px-3 py-2.5 shadow-kv',
              bg
            )}
          >
            <Icon className="h-5 w-5 shrink-0 text-[#0a0a0a]" />
            <p className="flex-1 text-sm font-bold text-[#0a0a0a]">{message}</p>
            <button
              onClick={() => dismiss(id)}
              aria-label="Tutup notifikasi"
              className="rounded-[4px] border-2 border-[#0a0a0a] bg-white/40 p-0.5 text-[#0a0a0a] hover:bg-white/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}