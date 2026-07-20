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

export type AdminVehicle = { plate: string; type: string };

export type AdminUserForm = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  vehicles: AdminVehicle[];
  address: string;
  role: string;
  status: string;
};

const emptyForm: AdminUserForm = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  vehicles: [{ plate: '', type: 'Car' }],
  address: '',
  role: 'User',
  status: 'Active',
};

function normalizeVehicleType(type?: string | null): string {
  const t = (type || 'Car').trim().toLowerCase();
  if (t === 'moto' || t === 'motorcycle' || t === 'xe máy') return 'Moto';
  if (t === 'suv') return 'SUV';
  return 'Car';
}

function parseVehiclesFromUser(user: AppUser): AdminVehicle[] {
  const lp = (user.licensePlate || '').trim();
  if (lp.startsWith('[')) {
    try {
      const raw = JSON.parse(lp);
      if (Array.isArray(raw) && raw.length > 0) {
        const list = raw
          .map((v: { plate?: string; PLATE?: string; type?: string; TYPE?: string }) => ({
            plate: String(v.plate || v.PLATE || '').trim(),
            type: normalizeVehicleType(v.type || v.TYPE || user.vehicleType),
          }))
          .filter((v: AdminVehicle) => v.plate);
        if (list.length > 0) return list;
      }
    } catch {
      /* fall through */
    }
  }
  if (lp) return [{ plate: lp, type: normalizeVehicleType(user.vehicleType) }];
  return [{ plate: '', type: normalizeVehicleType(user.vehicleType) }];
}

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
  const actorId = actor?.id ?? '';
  const canEdit = actorRole === 'Admin' || actorRole === 'Staff';
  const canAssignAdmin = actorRole === 'Admin';
  const isEditingSelf = !!editing && !!actorId && editing.id === actorId;

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
      vehicles: parseVehiclesFromUser(user),
      address: user.address ?? '',
      role: user.role ?? 'User',
      status: user.status ?? 'Active',
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
  };

  const updateVehicle = (index: number, patch: Partial<AdminVehicle>) => {
    setForm((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  };

  const addVehicle = () => {
    setForm((prev) => ({
      ...prev,
      vehicles: [...prev.vehicles, { plate: '', type: 'Car' }],
    }));
  };

  const removeVehicle = (index: number) => {
    setForm((prev) => {
      if (prev.vehicles.length <= 1) return prev;
      return { ...prev, vehicles: prev.vehicles.filter((_, i) => i !== index) };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    if (
      editing.id === actorId &&
      (form.status === 'Banned' || form.status === 'Inactive' || form.status === 'PendingVerification')
    ) {
      setError('Bạn không thể tự khóa hoặc vô hiệu hóa tài khoản của chính mình.');
      return;
    }

    const cleanedVehicles = form.vehicles
      .map((v) => ({ plate: v.plate.trim().toUpperCase(), type: v.type.trim() || 'Car' }))
      .filter((v) => v.plate);

    setSaving(true);
    setError('');
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        address: form.address,
        role: form.role,
        status: form.status,
        licensePlate:
          cleanedVehicles.length > 0 ? JSON.stringify(cleanedVehicles) : '',
        vehicleType: cleanedVehicles[0]?.type || 'Car',
      };
      const response = await adminService.updateUser(editing.id, payload);
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
    updateVehicle,
    addVehicle,
    removeVehicle,
    canEdit,
    canAssignAdmin,
    isEditingSelf,
    filtered,
    stats,
    openEdit,
    closeEdit,
    handleSave,
    handleDelete,
  };
}
