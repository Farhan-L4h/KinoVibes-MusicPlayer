import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Check, X, Ban, ShieldOff, Gauge, Trash2, RefreshCw, Loader2, Search as SearchIcon, UserRound } from 'lucide-react';
import { useAuthStore, selectIsAdmin, selectIsSuperadmin } from '../stores/auth';
import { listUsers, setUserStatus, setUserBanned, setUserLimited, setUserRole, deleteUser } from '../services/adminApi';
import { initials, cn } from '../lib/utils';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from '../stores/toast';

const FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'active', label: 'Aktif' },
  { value: 'banned', label: 'Banned' },
  { value: 'limited', label: 'Dibatasi' },
];

const ROLE_LABEL = { user: 'User', admin: 'Admin', superadmin: 'Superadmin' };

const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const Admin = () => {
  const me = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore(selectIsAdmin);
  const isSuperadmin = useAuthStore(selectIsSuperadmin);
  const [users, setUsers] = useState([]);
  const [state, setState] = useState('loading');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const rows = await listUsers();
      setUsers(rows);
      setState('ready');
    } catch (err) {
      toast.error(err.message);
      setState('error');
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  // Optimistic patch: apply locally, roll back if the server rejects.
  const mutate = async (user, patch, fn) => {
    setBusyId(user.id);
    const before = users;
    setUsers((rows) => rows.map((r) => (r.id === user.id ? { ...r, ...patch } : r)));
    try {
      await fn();
      toast.success('Tersimpan.');
    } catch (err) {
      setUsers(before);
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (user) => {
    setBusyId(user.id);
    const before = users;
    setUsers((rows) => rows.filter((r) => r.id !== user.id));
    try {
      await deleteUser(user.id);
      toast.success(`Akun ${user.email} dihapus.`);
      setConfirmDelete(null);
    } catch (err) {
      setUsers(before);
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (term && !`${u.email} ${u.display_name || ''}`.toLowerCase().includes(term)) return false;
      if (filter === 'pending') return u.status === 'pending';
      if (filter === 'active') return u.status === 'approved' && !u.is_banned;
      if (filter === 'banned') return u.is_banned;
      if (filter === 'limited') return u.is_limited;
      return true;
    });
  }, [users, q, filter]);

  const counts = useMemo(() => ({
    total: users.length,
    pending: users.filter((u) => u.status === 'pending').length,
    banned: users.filter((u) => u.is_banned).length,
    limited: users.filter((u) => u.is_limited).length,
  }), [users]);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState
          icon={ShieldCheck}
          title="Khusus admin"
          description="Halaman ini hanya untuk admin dan superadmin."
        />
      </div>
    );
  }

  const canManage = (u) =>
    u.id !== me?.id && u.role !== 'superadmin' && (u.role !== 'admin' || isSuperadmin);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-kv-line-strong bg-kv-ink text-kv-panel">
          <ShieldCheck size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl leading-relaxed sm:text-2xl">Panel admin</h1>
          <p className="text-sm text-kv-ink-muted">Setujui pendaftaran, ban, batasi, atau hapus akun.</p>
        </div>
        <Badge tone="ink">{isSuperadmin ? 'Superadmin' : 'Admin'}</Badge>
        <Button variant="secondary" size="sm" onClick={load} disabled={state === 'loading'}>
          <RefreshCw size={14} className={state === 'loading' ? 'animate-spin' : ''} /> Muat ulang
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        <Badge>Total {counts.total}</Badge>
        <Badge tone={counts.pending ? 'ink' : 'surface'}>Menunggu {counts.pending}</Badge>
        <Badge tone={counts.banned ? 'ink' : 'surface'}>Banned {counts.banned}</Badge>
        <Badge tone={counts.limited ? 'ink' : 'surface'}>Dibatasi {counts.limited}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-kv-ink-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari email atau nama…"
            aria-label="Cari akun"
            className="min-h-[44px] w-full rounded-full border border-kv-line bg-kv-surface py-2 pl-10 pr-4 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink"
          />
        </div>
        <Tabs tabs={FILTERS} active={filter} onChange={setFilter} />
      </div>

      {state === 'loading' && (
        <div className="space-y-2" role="status" aria-label="Memuat akun">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-kv border border-kv-line bg-kv-surface" />
          ))}
        </div>
      )}

      {state === 'error' && (
        <EmptyState
          icon={ShieldCheck}
          title="Gagal memuat akun"
          description="Periksa koneksi kamu, lalu coba lagi."
          action={<Button size="sm" onClick={load}>Coba lagi</Button>}
        />
      )}

      {state === 'ready' && visible.length === 0 && (
        <EmptyState
          icon={UserRound}
          title="Tidak ada akun"
          description={q || filter !== 'all' ? 'Tidak ada akun yang cocok dengan filter ini.' : 'Belum ada akun terdaftar.'}
        />
      )}

      {state === 'ready' && visible.length > 0 && (
        <ul className="space-y-2">
          {visible.map((u) => {
            const manageable = canManage(u);
            const busy = busyId === u.id;
            return (
              <li
                key={u.id}
                className={cn(
                  'kv-rise flex flex-wrap items-center gap-3 rounded-kv border border-kv-line bg-kv-surface p-3',
                  u.is_banned && 'opacity-80'
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-kv-line-strong bg-kv-panel font-display text-xs">
                  {initials(u.display_name || u.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-bold">{u.display_name || u.email.split('@')[0]}</span>
                    {u.id === me?.id && <Badge tone="ink">Kamu</Badge>}
                    <Badge tone={u.role === 'user' ? 'surface' : 'ink'}>{ROLE_LABEL[u.role] || u.role}</Badge>
                    {u.status === 'pending' && <Badge tone="surface">Menunggu</Badge>}
                    {u.status === 'rejected' && <Badge tone="surface">Ditolak</Badge>}
                    {u.is_banned && <Badge tone="ink">Banned</Badge>}
                    {u.is_limited && <Badge tone="surface">Dibatasi</Badge>}
                  </p>
                  <p className="truncate font-mono text-xs text-kv-ink-muted">
                    {u.email} · gabung {dateFmt.format(new Date(u.created_at))}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {busy && <Loader2 size={16} className="animate-spin text-kv-ink-muted" />}
                  {manageable && u.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => mutate(u, { status: 'approved' }, () => setUserStatus(u.id, 'approved'))} disabled={busy}>
                        <Check size={14} /> Setujui
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => mutate(u, { status: 'rejected' }, () => setUserStatus(u.id, 'rejected'))} disabled={busy}>
                        <X size={14} /> Tolak
                      </Button>
                    </>
                  )}
                  {manageable && u.status !== 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant={u.is_banned ? 'primary' : 'ghost'}
                        onClick={() => mutate(u, { is_banned: !u.is_banned }, () => setUserBanned(u.id, !u.is_banned))}
                        disabled={busy}
                        title={u.is_banned ? 'Cabut ban' : 'Ban akun ini'}
                      >
                        {u.is_banned ? <ShieldOff size={14} /> : <Ban size={14} />}
                        {u.is_banned ? 'Unban' : 'Ban'}
                      </Button>
                      <Button
                        size="sm"
                        variant={u.is_limited ? 'primary' : 'ghost'}
                        onClick={() => mutate(u, { is_limited: !u.is_limited }, () => setUserLimited(u.id, !u.is_limited))}
                        disabled={busy}
                        title="Akun dibatasi tidak bisa membuat playlist baru"
                      >
                        <Gauge size={14} /> {u.is_limited ? 'Lepas batas' : 'Batasi'}
                      </Button>
                    </>
                  )}
                  {manageable && isSuperadmin && (
                    <>
                      <select
                        value={u.role}
                        onChange={(e) => mutate(u, { role: e.target.value }, () => setUserRole(u.id, e.target.value))}
                        disabled={busy}
                        aria-label={`Role ${u.email}`}
                        className="min-h-[36px] rounded-kv border border-kv-line bg-kv-panel px-2 font-mono text-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(u)} disabled={busy} aria-label={`Hapus akun ${u.email}`}>
                        <Trash2 size={14} className="text-kv-danger" />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete)}
        title="Hapus akun permanen?"
        message={confirmDelete ? `Akun ${confirmDelete.email} beserta lagu upload, playlist, dan favoritnya akan dihapus permanen. Aksi ini tidak bisa dibatalkan.` : ''}
        confirmLabel="Hapus akun"
      />
    </div>
  );
};

export default Admin;