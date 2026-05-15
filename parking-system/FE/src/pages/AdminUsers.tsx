import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Map as MapIcon, 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Search, 
  Bell,
  Plus,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        // Backend bọc trong ApiResponse { success, data, ... }
        if (response.data.success) {
          setUsers(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const navLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Reservations', icon: CalendarDays, path: '/admin/reservations' },
    { name: 'Live Monitoring', icon: MapIcon, path: '/admin/monitoring' },
    { name: 'Reports', icon: BarChart3, path: '/admin/reports' },
    { name: 'User Management', icon: Users, path: '/admin/users', active: true },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] min-h-screen flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* SideNavBar */}
      <aside className="hidden md:flex flex-col h-screen py-8 sticky left-0 top-0 bg-white border-r border-slate-200 w-[280px] z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="px-8 mb-10 group cursor-pointer">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 transition-transform group-hover:rotate-6">
              <span className="text-white font-black text-2xl">P</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tighter">ParkIntel</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Command Center</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              to={link.path} 
              className={`flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all duration-300 group
                ${link.active 
                  ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-600/5' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <link.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${link.active ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className={`text-sm ${link.active ? 'font-bold' : 'font-semibold'}`}>{link.name}</span>
            </Link>
          ))}
        </nav>

        <div className="px-4 mt-auto space-y-6">
           <div className="space-y-1">
            <Link to="#" className="flex items-center gap-3 px-5 py-3 text-slate-500 text-sm hover:text-blue-600 transition-colors font-bold group">
              <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
              <span>Help Center</span>
            </Link>
            <Link to="/" className="flex items-center gap-3 px-5 py-3 text-red-500 text-sm hover:text-red-600 transition-colors font-bold group">
              <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-600" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 bg-[#f8f9fb]">
        {/* Top Header */}
        <header className="flex justify-between items-center h-20 px-10 w-full sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
           <div className="flex items-center gap-4 bg-slate-100/80 px-4 py-2.5 rounded-2xl border border-slate-200 w-80 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all">
              <Search className="text-slate-400 w-4.5 h-4.5" />
              <input className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 w-full p-0 placeholder:text-slate-400" placeholder="Tìm kiếm nhân sự..." type="text"/>
            </div>

          <div className="flex items-center gap-5">
             <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 mr-4">
                <UserPlus className="w-4 h-4" />
                Thêm Thành viên
             </button>
             <Link 
              to="/"
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50 text-blue-600 rounded-full transition-all duration-300 font-black text-sm border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              title="Quay lại trang chủ"
            >
              W
            </Link>
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-full border border-slate-200">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 overflow-hidden">
                 <img alt="Admin" className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100"/>
              </div>
              <div className="hidden sm:block text-left">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-0.5">Quản trị viên</p>
                 <p className="text-xs font-bold text-slate-900 leading-none">Admin ParkIntel</p>
              </div>
              <Link to="/" className="ml-2 p-2 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-full transition-colors" title="Đăng xuất">
                 <LogOut size={16} />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-10 space-y-10">
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Quản lý Người dùng</h2>
              <p className="text-sm text-slate-500 font-medium">Phân quyền và quản lý tài khoản nhân viên toàn hệ thống.</p>
           </div>

           {/* Stats Grid */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
                { label: 'Tổng nhân sự', value: '24', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Hoạt động', value: '18', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Yêu cầu mới', value: '03', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Quản trị viên', value: '05', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
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
                      ) : users.map((user) => (
                         <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center font-black text-blue-600 text-xs uppercase">
                                     {user.firstName ? user.firstName[0] : (user.username ? user.username[0] : 'U')}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-slate-900">{user.firstName} {user.lastName}</p>
                                     <p className="text-[11px] font-bold text-slate-400">{user.email} (@{user.username})</p>
                                  </div>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                                  <Shield className={`w-3.5 h-3.5 ${(user.role || '').includes('Admin') ? 'text-blue-600' : 'text-slate-400'}`} />
                                  <span className="text-[11px] font-bold text-slate-900">{user.role || 'User'}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                  (user.status || 'Active') === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  user.status === 'Suspended' ? 'bg-red-50 text-red-600 border-red-100' :
                                  'bg-slate-50 text-slate-400 border-slate-200'
                               }`}>
                                  {user.status || 'Active'}
                               </span>
                            </td>
                            <td className="px-8 py-6 text-[11px] font-bold text-slate-400">
                               {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-blue-600">
                                     <Edit className="w-4 h-4" />
                                  </button>
                                  <button className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-500">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">Hiển thị {users.length} của 24 nhân sự</span>
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
      </main>
    </div>
  );
};

export default AdminUsers;
