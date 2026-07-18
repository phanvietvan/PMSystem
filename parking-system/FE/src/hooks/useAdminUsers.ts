import { useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/admin.service';
import { useAdminUser } from './useAdminUser';

export interface AppUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  licensePlate?: string;
  vehicleType?: string;
  address?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
}

export type AdminUserForm = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  licensePlate: string;
  vehicleType: string;
  address: string;
  role: string;
  status: string;
};

const emptyForm: AdminUserForm = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  licensePlate: '',
  vehicleType: '',
  address: '',
  role: 'User',
  status: 'Active',
};

export function useAdminUsers() {
  const actor = useAdminUser();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [viewingUser, setViewingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<AdminUserForm>(emptyForm);

  const actorRole = actor?.role ?? 'User';
  const canEdit = actorRole === 'Admin' || actorRole === 'Staff';
  const canAssignAdmin = actorRole === 'Admin';

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getUsers();
      if (response.data.success) {
        setUsers(response.data.data ?? []);
      } else {
        setError(response.data.message || 'Không tải được danh sách.');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Cần đăng nhập tài khoản Admin hoặc Staff.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(q)
    );
  }, [users, search]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === 'Active').length,
      pending: users.filter((u) => u.status === 'PendingVerification').length,
      admins: users.filter((u) => u.role === 'Admin').length,
    }),
    [users]
  );

  const openEdit = (user: AppUser) => {
    if (!canEdit) return;
    setEditing(user);
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phoneNumber: user.phoneNumber ?? '',
      licensePlate: user.licensePlate ?? '',
      vehicleType: user.vehicleType ?? '',
      address: user.address ?? '',
      role: user.role ?? 'User',
      status: user.status ?? 'Active',
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      const response = await adminService.updateUser(editing.id, form);
      if (response.data.success) {
        const updated = response.data.data as AppUser;
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        closeEdit();
      } else {
        setError(response.data.message || 'Cập nhật thất bại.');
      }
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Cập nhật thất bại.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    setError('');
    try {
      const response = await adminService.deleteUser(deletingUser.id);
      if (response.data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
        setDeletingUser(null);
      } else {
        setError(response.data.message || 'Xóa thất bại.');
      }
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Xóa thất bại.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    users,
    loading,
    search,
    setSearch,
    error,
    saving,
    editing,
    viewingUser,
    setViewingUser,
    deletingUser,
    setDeletingUser,
    isDeleting,
    form,
    setForm,
    canEdit,
    canAssignAdmin,
    filtered,
    stats,
    openEdit,
    closeEdit,
    handleSave,
    handleDelete,
  };
}
