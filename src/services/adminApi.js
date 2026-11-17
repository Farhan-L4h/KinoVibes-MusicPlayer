import { supabase } from '../config/supabase';

const rpc = async (fn, args) => {
  const { error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message || 'Aksi admin gagal.');
};

export const listUsers = async () => {
  const { data, error } = await supabase.rpc('kv_admin_list_users');
  if (error) throw new Error(error.message || 'Gagal memuat daftar akun.');
  return data || [];
};

export const setUserStatus = (id, status) => rpc('kv_admin_set_status', { target: id, new_status: status });
export const setUserBanned = (id, banned) => rpc('kv_admin_set_banned', { target: id, banned });
export const setUserLimited = (id, limited) => rpc('kv_admin_set_limited', { target: id, limited });
export const setUserRole = (id, role) => rpc('kv_admin_set_role', { target: id, new_role: role });
export const deleteUser = (id) => rpc('kv_admin_delete_user', { target: id });