import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Map as MapIcon, 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Bell, 
  Search, 
  Camera,
  Wifi,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  Play,
  Maximize2,
  Menu,
  Car,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminMonitoring = () => {
  console.log("AdminMonitoring rendered");

  const cameras = [
    { id: 1, name: 'Cổng vào A1 (Chính)', status: 'Online', lastEvent: 'Xe ô tô 51F-123.45 vừa vào', type: 'LPR (AI)' },
    { id: 2, name: 'Cổng ra A2', status: 'Online', lastEvent: 'Barrier đóng', type: 'Standard' },
    { id: 3, name: 'Tầng hầm B1 - Khu A', status: 'Online', lastEvent: 'Phát hiện khói (Giả định)', type: 'Thermal' },
    { id: 4, name: 'Tầng hầm B2 - Khu C', status: 'Offline', lastEvent: 'Mất tín hiệu', type: 'Standard', error: true },
  ];

  const devices = [
    { name: 'QR Scanner A1', status: 'Hoạt động', health: 98, icon: Zap },
    { name: 'Barrier Gate A1', status: 'Hoạt động', health: 100, icon: ShieldCheck },
    { name: 'Cảm biến chỗ đỗ B2', status: 'Lỗi', health: 45, icon: Activity, warning: true },
  ];

  const navLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Reservations', icon: CalendarDays, path: '/admin/reservations' },
    { name: 'Live Monitoring', icon: MapIcon, path: '/admin/monitoring', active: true },
    { name: 'Reports', icon: BarChart3, path: '/admin/reports' },
    { name: 'User Management', icon: Users, path: '/admin/users' },
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
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <p className="text-xs font-bold text-blue-900 mb-1">IoT Health</p>
            <p className="text-[10px] text-blue-600 font-medium mb-4 leading-relaxed">Tất cả cảm biến đang ổn định 92%.</p>
            <button className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20">
              Chi tiết thiết bị
            </button>
          </div>
          
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
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold text-slate-900">Giám sát Vận hành</h2>
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live: Hệ thống ổn định</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
             <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-slate-900/20 mr-4">
                <Maximize2 className="w-4 h-4" />
                Toàn màn hình
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
        <div className="p-10">
          <div className="grid grid-cols-12 gap-8">
            {/* Camera Matrix */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Hệ thống Camera CCTV</h3>
                <div className="flex gap-2">
                  <button className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600 shadow-sm shadow-blue-600/5">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {cameras.map((cam) => (
                  <div key={cam.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group">
                    <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
                      {cam.error ? (
                        <div className="flex flex-col items-center gap-2 text-red-400">
                          <AlertTriangle className="w-8 h-8" />
                          <span className="text-[10px] font-black uppercase tracking-widest">No Signal</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      )}
                      <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md">
                        <Camera className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold text-white uppercase">{cam.name}</span>
                      </div>
                      <div className="absolute bottom-4 right-4 text-white/50 text-[10px] font-mono">
                        {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{cam.lastEvent}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{cam.type}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cam.error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {cam.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IoT & Device Health */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Trạng thái Thiết bị IoT</h3>
              <div className="space-y-4">
                {devices.map((device, i) => (
                  <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${device.warning ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} group-hover:scale-110 transition-transform`}>
                        <device.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{device.name}</p>
                        <p className={`text-[10px] font-black uppercase ${device.warning ? 'text-red-500' : 'text-emerald-500'}`}>{device.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${device.warning ? 'text-red-600' : 'text-slate-900'}`}>{device.health}%</p>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full rounded-full ${device.warning ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${device.health}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/30">
                <h4 className="text-lg font-black mb-2 relative z-10">Bản đồ Cảm biến</h4>
                <p className="text-xs text-white/60 mb-6 relative z-10 leading-relaxed">Xem vị trí trực quan của tất cả cảm biến đỗ xe trong hầm.</p>
                <button className="w-full py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase hover:bg-blue-50 transition-colors relative z-10">
                  Mở Sơ đồ 3D
                </button>
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMonitoring;
