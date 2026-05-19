import React from 'react';
import BrandLogo from '../components/brand/BrandLogo';
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
import AdminLayout from '../components/admin/AdminLayout';

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


  return (
    <AdminLayout>
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
    </AdminLayout>
  );
};

export default AdminMonitoring;
