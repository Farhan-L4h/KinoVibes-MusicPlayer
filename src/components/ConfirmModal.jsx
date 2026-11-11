import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Yakin?',
  message,
  confirmLabel = 'Hapus',
}) => {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-red">
            <AlertTriangle size={20} className="text-white" />
          </span>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirm} disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;