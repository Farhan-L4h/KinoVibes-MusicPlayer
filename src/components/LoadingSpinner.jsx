import { Music2 } from 'lucide-react';

const LoadingSpinner = ({ label = 'Memuat…' }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-kv-bg" role="status">
    <div className="flex gap-2">
      {['bg-kv-yellow', 'bg-kv-pink', 'bg-kv-blue'].map((bg, i) => (
        <span
          key={bg}
          className={`h-6 w-6 rounded border-3 border-kv-ink ${bg} animate-eq-${i + 1}`}
          style={{ animationDuration: '0.8s' }}
        />
      ))}
    </div>
    <div className="flex items-center gap-2 rounded-kv border-3 border-kv-ink bg-kv-surface px-4 py-2 shadow-kv">
      <Music2 size={16} />
      <span className="font-mono text-xs font-bold uppercase tracking-[0.25em]">{label}</span>
    </div>
  </div>
);

export default LoadingSpinner;