import AdminLayout from '../components/admin/AdminLayout';
import { useState, useEffect, useMemo } from 'react';
import { 
  Users,
  UserPlus,
  MoreVertical,
  Edit,
  Shield,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import api from '../services/api';

interface AppUser {
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

const statusLabel: Record<string, string> = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Banned: 'SUSPENDED',
  PendingVerification: 'PENDING',
};

const statusClass: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Inactive: 'bg-slate-50 text-slate-500 border-slate-200',
  Banned: 'bg-red-50 text-red-600 border-red-100',
  PendingVerification: 'bg-amber-50 text-amber-600 border-amber-100',
};

function getStoredUser(): AppUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const AdminUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [viewingUser, setViewingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    licensePlate: '',
    vehicleType: '',
    address: '',
    role: 'User',
    status: 'Active',
  });

  const actorRole = getStoredUser()?.role ?? 'User';
  const canEdit = actorRole === 'Admin' || actorRole === 'Staff';
  const canAssignAdmin = actorRole === 'Admin';

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users');
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
    fetchUsers();
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
      const response = await api.put(`/users/${editing.id}`, form);
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
      const response = await api.delete(`/users/${deletingUser.id}`);
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


  return (
    <AdminLayout
      searchPlaceholder="Tìm kiếm nhân sự..."
      searchValue={search}
      onSearchChange={setSearch}
      headerActions={
        <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 mr-4">
          <UserPlus className="w-4 h-4" />
          Thêm Thành viên
        </button>
      }>
      {/* Page Content */}
        <div className="p-10 space-y-10">
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Quản lý Người dùng</h2>
              <p className="text-sm text-slate-500 font-medium">Phân quyền và quản lý tài khoản nhân viên toàn hệ thống.</p>
              {error && !editing && (
                <p className="mt-3 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2 w-fit">{error}</p>
              )}
              {!canEdit && (
                <p className="mt-3 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 w-fit">
                  Tài khoản của bạn chỉ được xem danh sách. Cần vai trò Admin hoặc Staff để chỉnh sửa.
                </p>
              )}
           </div>

           {/* Stats Grid */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
                { label: 'Tổng nhân sự', value: String(stats.total), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Hoạt động', value: String(stats.active), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Yêu cầu mới', value: String(stats.pending).padStart(2, '0'), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Quản trị viên', value: String(stats.admins).padStart(2, '0'), icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
             ].map((stat, i) => (
                <div key={i} className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                   <div className="flex justify-between items-start mb-6">
                      <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                         <stat.icon className="w-6 h-6" />
                      </div>
                      <MoreVertical className="text-slate-300 w-5 h-5 cursor-pointer hover:text-slate-900" />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
                   <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                </div>
             ))}
           </div>

           {/* Users Table */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Danh sách Nhân sự</h3>
                <div className="flex gap-3">
                   <button className="px-4 py-2 text-xs font-black bg-slate-50 text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all">Bộ lọc</button>
                   <button className="px-4 py-2 text-xs font-black bg-slate-50 text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all">Xuất CSV</button>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoạt động cuối</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {loading ? (
                         <tr>
                            <td colSpan={5} className="px-8 py-20 text-center">
                               <div className="flex flex-col items-center gap-3">
                                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                  <p className="text-sm font-bold text-slate-400">Đang tải dữ liệu...</p>
                               </div>
                            </td>
                         </tr>
                      ) : users.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="px-8 py-20 text-center">
                               <p className="text-sm font-bold text-slate-400">Không có người dùng nào trong hệ thống.</p>
                            </td>
                         </tr>
                      ) : filtered.map((user) => (
                         <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 text-xs uppercase overflow-hidden shrink-0">
                                     {user.avatarUrl ? (
                                       <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                     ) : (
                                       <span>{user.firstName ? user.firstName[0] : (user.username ? user.username[0] : 'U')}</span>
                                     )}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-slate-900">{user.firstName} {user.lastName}</p>
                                     <p className="text-[11px] font-bold text-slate-400">{user.email} (@{user.username})</p>
                                  </div>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                                  <Shield className={`w-3.5 h-3.5 ${
                                    user.role === 'Admin' ? 'text-purple-600' :
                                    user.role === 'Staff' ? 'text-blue-600' : 'text-slate-400'
                                  }`} />
                                  <span className="text-[11px] font-bold text-slate-900">{user.role || 'User'}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                  statusClass[user.status] || statusClass.Active
                               }`}>
                                  {statusLabel[user.status] || user.status || 'ACTIVE'}
                               </span>
                            </td>
                            <td className="px-8 py-6 text-[11px] font-bold text-slate-400">
                               {user.lastLoginAt
                                 ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN')
                                 : user.createdAt
                                   ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                                   : 'N/A'}
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex items-center justify-end gap-2">
                                 <button
                                   type="button"
                                   onClick={() => setViewingUser(user)}
                                   className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 cursor-pointer flex items-center justify-center"
                                   title="Xem chi tiết"
                                 >
                                   <span className="material-symbols-outlined text-[18px]">visibility</span>
                                 </button>
                                 {canEdit && (
                                   <button
                                     type="button"
                                     onClick={() => openEdit(user)}
                                     className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-blue-600 cursor-pointer flex items-center justify-center"
                                     title="Chỉnh sửa"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </button>
                                 )}
                                 {canEdit && (
                                   <button
                                     type="button"
                                     onClick={() => setDeletingUser(user)}
                                     className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-600 cursor-pointer flex items-center justify-center"
                                     title="Xóa thành viên"
                                   >
                                     <span className="material-symbols-outlined text-[18px]">delete</span>
                                   </button>
                                 )}
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">Hiển thị {filtered.length} / {users.length} nhân sự</span>
                <div className="flex gap-2">
                   <button className="px-4 py-2 text-xs font-black bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center gap-2">
                      <ChevronLeft className="w-4 h-4" /> Trước
                   </button>
                   <button className="px-4 py-2 text-xs font-black bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
                      Sau <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
             </div>
           </div>
        </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Chỉnh sửa nhân sự</h3>
              <button type="button" onClick={closeEdit} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              {error && <p className="text-sm font-bold text-red-600">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Họ</span>
                  <input required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Tên</span>
                  <input required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} />
                </label>
              </div>
              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase">SĐT</span>
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.phoneNumber} onChange={(e) => setForm({...form, phoneNumber: e.target.value})} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Biển số</span>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.licensePlate} onChange={(e) => setForm({...form, licensePlate: e.target.value})} />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Loại xe</span>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.vehicleType} onChange={(e) => setForm({...form, vehicleType: e.target.value})} />
                </label>
              </div>
              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase">Địa chỉ</span>
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Vai trò</span>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
                    <option value="User">User</option>
                    <option value="Staff">Staff</option>
                    {canAssignAdmin && <option value="Admin">Admin</option>}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Trạng thái</span>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Banned">Banned</option>
                    <option value="PendingVerification">Pending</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeEdit} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600">Hủy</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingUser && (() => {
        let parsedVehicles: { plate: string; type: string }[] = [];
        const lp = viewingUser.licensePlate || '';
        if (lp.startsWith('[')) {
          try {
            const raw = JSON.parse(lp);
            if (Array.isArray(raw)) {
              parsedVehicles = raw.map((v: any) => ({
                plate: String(v.plate || v.PLATE || '').toUpperCase(),
                type: String(v.type || v.TYPE || 'CAR')
              })).filter(v => v.plate);
            }
          } catch {}
        } else if (lp) {
          parsedVehicles = [{ plate: lp.toUpperCase(), type: viewingUser.vehicleType || 'CAR' }];
        }

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-scale-up">
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[22px]">account_circle</span>
                  <h3 className="text-lg font-black text-slate-900">Chi tiết nhân sự</h3>
                </div>
                <button type="button" onClick={() => setViewingUser(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center gap-4.5 p-4.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 text-lg uppercase overflow-hidden shrink-0">
                    {viewingUser.avatarUrl ? (
                      <img src={viewingUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{viewingUser.firstName ? viewingUser.firstName[0] : (viewingUser.username ? viewingUser.username[0] : 'U')}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base">{viewingUser.firstName} {viewingUser.lastName}</h4>
                    <p className="text-xs font-bold text-slate-400">@{viewingUser.username}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Vai trò</span>
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                      <Shield size={14} className="text-blue-500" /> {viewingUser.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Trạng thái</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase mt-1 border ${
                      statusClass[viewingUser.status] || statusClass.Active
                    }`}>
                      {statusLabel[viewingUser.status] || viewingUser.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>

                {/* Vehicles list section */}
                <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Danh sách phương tiện ({parsedVehicles.length})</span>
                  {parsedVehicles.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400 italic">Chưa đăng ký phương tiện</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {parsedVehicles.map((v, i) => (
                        <div key={i} className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-slate-100">
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/50 uppercase tracking-wide">
                            {v.plate}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-100/50 px-2 py-0.5 rounded-md">
                            {v.type === 'car' || v.type === 'CAR' ? 'Ô tô' : 
                             v.type === 'suv' || v.type === 'SUV' ? 'Xe SUV' : 
                             v.type === 'moto' || v.type === 'MOTO' ? 'Xe máy' : v.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3.5 pt-2">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400">Địa chỉ Email</span>
                    <span className="text-xs font-extrabold text-slate-700">{viewingUser.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400">Số điện thoại</span>
                    <span className="text-xs font-extrabold text-slate-700">{viewingUser.phoneNumber || 'Chưa cung cấp'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400">Địa chỉ</span>
                    <span className="text-xs font-extrabold text-slate-700">{viewingUser.address || 'Chưa cung cấp'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400">Ngày đăng ký</span>
                    <span className="text-xs font-extrabold text-slate-700">
                      {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="button" onClick={() => setViewingUser(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors">Đóng chi tiết</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {deletingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-scale-up">
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[30px]">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Xác nhận xóa tài khoản</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">Hành động này không thể hoàn tác</p>
              </div>
              <p className="text-sm text-slate-500">
                Bạn có chắc chắn muốn xóa thành viên <strong className="text-slate-800">{deletingUser.firstName} {deletingUser.lastName}</strong> khỏi hệ thống không?
              </p>
              {error && <p className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl py-2 px-3">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setDeletingUser(null)} className="flex-1 py-3 border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">Hủy</button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors shadow-lg shadow-red-600/10"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminUsers;
