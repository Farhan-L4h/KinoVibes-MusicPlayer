import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ label = 'Memuat…' }) => (
  <div className="flex min-h-screen items-center justify-center bg-kv-bg p-6" role="status">
    <div className="flex items-center gap-3 rounded-kv-lg border border-kv-line bg-kv-panel px-6 py-5 text-kv-ink">
      <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
      <span className="font-mono text-xs">{label}</span>
    </div>
  </div>
);

export default LoadingSpinner;
