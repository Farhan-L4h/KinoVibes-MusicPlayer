import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { saveManualLyrics } from '../services/lyricsApi';
import { isLrcFormat } from '../lib/lrc';
import { toast } from '../stores/toast';
import Badge from './ui/Badge';

const ManualLyricsModal = ({ open, track, userId, onClose, onSaved }) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setText('');
  }, [open, track?.id]);

  const handleSave = async () => {
    if (!text.trim() || !track || !userId) return;
    setSaving(true);
    try {
      await saveManualLyrics(track, text.trim(), userId);
      toast.success('Lirik tersimpan');
      onSaved?.();
    } catch (err) {
      console.error('saveManualLyrics error:', err);
      toast.error(err.message || 'Gagal menyimpan lirik');
    } finally {
      setSaving(false);
    }
  };

  const lrc = isLrcFormat(text);

  return (
    <Modal open={open} onClose={onClose} title="Lirik manual" wide>
      <div className="space-y-3">
        <p className="text-sm text-kv-ink-muted">
          Tempel lirik untuk <strong className="text-kv-ink">{track?.title}</strong>. Tambahkan
          timestamp <code className="rounded border border-kv-ink bg-kv-muted px-1 font-mono text-xs">[mm:ss.xx]</code> di
          awal baris supaya lirik tersinkron dengan lagu.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder={'[00:12.50] Baris pertama lirik\n[00:17.20] Baris kedua lirik\n\nAtau tempel teks biasa tanpa timestamp.'}
          className="w-full rounded-kv border-3 border-kv-ink bg-kv-surface p-3 font-mono text-sm text-kv-ink placeholder:text-kv-ink-muted/60 focus-visible:outline focus-visible:outline-3 focus-visible:outline-kv-blue"
          aria-label="Teks lirik"
        />
        <div className="flex items-center justify-between gap-3">
          {text.trim() ? (
            lrc ? <Badge tone="pink">● Akan tersinkron</Badge> : <Badge tone="surface">Teks biasa</Badge>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !text.trim()}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ManualLyricsModal;