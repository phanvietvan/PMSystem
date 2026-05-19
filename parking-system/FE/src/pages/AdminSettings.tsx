import React, { useState } from 'react';
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
  Car,
  Bell,
  Lock,
  Globe,
  Database,
  CreditCard,
  Smartphone,
  Save,
  ChevronRight,
  ShieldCheck,
  Zap,
  Menu,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminLayout from '../components/admin/AdminLayout';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Cài đặt chung', icon: Globe },
    { id: 'security', label: 'Bảo mật', icon: Lock },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'parking', label: 'Cấu hình Bãi xe', icon: Car },
    { id: 'api', label: 'IoT & API', icon: Zap },
  ];


  return (
    <AdminLayout>
      {/* Page Content */}
        <div className="p-10">
          <div className="max-w-5xl mx-auto">
             <div className="mb-10">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Cài đặt Hệ thống</h2>
                <p className="text-sm text-slate-500 font-medium">Quản lý cấu hình vận hành, bảo mật và tích hợp IoT của PM System.</p>
             </div>

             <div className="flex flex-col lg:flex-row gap-10">
                {/* Tabs Menu */}
                <div className="lg:w-72 shrink-0">
                   <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-2">
                      {tabs.map((tab) => (
                         <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id)}
                           className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm transition-all duration-300
                             ${activeTab === tab.id 
                               ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold scale-[1.02]' 
                               : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                             }`}
                         >
                            <tab.icon className={`w-4.5 h-4.5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                            {tab.label}
                         </button>
                      ))}
                   </div>

                   <div className="mt-8 p-8 bg-slate-900 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-slate-900/30">
                      <div className="relative z-10">
                         <h4 className="font-black text-lg mb-2">PM System v2.5</h4>
                         <p className="text-xs text-white/50 leading-relaxed mb-6">Bạn đang sử dụng phiên bản mới nhất của hệ thống quản trị.</p>
                         <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4" /> Hệ thống bảo mật
                         </div>
                      </div>
                      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
                   </div>
                </div>

                {/* Tab Panels */}
                <div className="flex-1 space-y-8">
                   {activeTab === 'general' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">Thông tin Cơ sở</h3>
                            <div className="space-y-6">
                               <div className="grid grid-cols-2 gap-6">
                                  <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Tên Bãi đỗ xe</label>
                                     <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all" defaultValue="PM System Central Tower" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Mã cơ sở (ID)</label>
                                     <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 outline-none" defaultValue="PI-CT-001" disabled />
                                  </div>
                               </div>
                               <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Địa chỉ vận hành</label>
                                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all" defaultValue="Số 123, Đường Lê Lợi, Quận 1, TP. HCM" />
                               </div>
                               <div className="grid grid-cols-2 gap-6">
                                  <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Múi giờ</label>
                                     <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none">
                                        <option>GMT +7 (Hanoi, Bangkok)</option>
                                     </select>
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Ngôn ngữ mặc định</label>
                                     <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none">
                                        <option>Tiếng Việt (VN)</option>
                                        <option>English (US)</option>
                                     </select>
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">Thương hiệu & Logo</h3>
                            <div className="flex items-center gap-8">
                               <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-blue-600/30">P</div>
                               <div className="space-y-4 flex-1">
                                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Logo của bạn sẽ xuất hiện trên Dashboard, ứng dụng người dùng và hóa đơn in ra.</p>
                                  <div className="flex gap-3">
                                     <button className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition-all">Tải lên Logo mới</button>
                                     <button className="px-5 py-2 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all">Gỡ bỏ</button>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                   )}

                   {activeTab === 'parking' && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">Chính sách Giá gửi xe</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               {[
                                 { type: 'Xe máy', price: '5.000', sub: 'VNĐ / Lượt' },
                                 { type: 'Ô tô 4-7 chỗ', price: '30.000', sub: 'VNĐ / Giờ' },
                                 { type: 'SUV / Bán tải', price: '50.000', sub: 'VNĐ / Giờ' },
                               ].map((p, i) => (
                                 <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 group hover:border-blue-600 transition-all cursor-pointer">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{p.type}</p>
                                    <div className="flex items-baseline gap-2">
                                       <input type="text" className="w-full bg-transparent text-2xl font-black text-blue-600 border-none p-0 focus:ring-0" defaultValue={p.price} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1">{p.sub}</p>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">Vận hành & Đặt chỗ</h3>
                            <div className="space-y-4">
                               {[
                                 { label: 'Cho phép đặt chỗ trước', sub: 'Người dùng có thể giữ chỗ qua mobile app.' },
                                 { label: 'Tự động mở Barrier', sub: 'Mở barrier tự động khi nhận diện biển số hợp lệ.' },
                                 { label: 'Thanh toán không tiền mặt', sub: 'Bắt buộc thanh toán qua QR/E-wallet.' },
                               ].map((opt, i) => (
                                 <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                                    <div>
                                       <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                                       <p className="text-[11px] text-slate-400 font-medium">{opt.sub}</p>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${i === 0 || i === 2 ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${i === 0 || i === 2 ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </motion.div>
                   )}

                   {/* Other tabs placeholder */}
                   {activeTab !== 'general' && activeTab !== 'parking' && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-20 text-center">
                         <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/10">
                            <ShieldCheck className="w-10 h-10" />
                         </div>
                         <h3 className="text-xl font-black text-slate-900 tracking-tight">Tính năng đang phát triển</h3>
                         <p className="text-sm text-slate-400 max-w-xs mx-auto mt-3 leading-relaxed font-medium">Phần cấu hình này sẽ có mặt trong bản cập nhật v2.6 sắp tới.</p>
                         <button className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Thông báo cho tôi</button>
                      </motion.div>
                   )}
                </div>
             </div>
          </div>
        </div>
    </AdminLayout>
  );
};

export default AdminSettings;
