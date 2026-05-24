import { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  TrendingUp, 
  Car, 
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../services/api';

const AdminDashboard = () => {

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await api.get('/ParkingSessions');
        if (response.data) {
          setSessions(Array.isArray(response.data) ? response.data : (response.data.data || []));
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalFee || 0), 0);
  const activeBookings = sessions.filter(s => s.status === 'Active' || s.status === 'Pending').length;
  const occupancyRate = sessions.length ? ((activeBookings / 174) * 100).toFixed(1) + '%' : '0%';

  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K';
    return amount.toString();
  };

  const metrics = [
    { label: 'TỔNG DOANH THU', value: loading ? '...' : formatRevenue(totalRevenue), unit: 'VND', trend: '+12%', icon: TrendingUp, color: 'text-blue-600', sub: 'Toàn thời gian' },
    { label: 'TỶ LỆ LẤP ĐẦY', value: loading ? '...' : occupancyRate, trend: 'Hiện tại', icon: Car, color: 'text-emerald-600', sub: 'Công suất tối ưu' },
    { label: 'ĐẶT CHỖ HOẠT ĐỘNG', value: loading ? '...' : activeBookings.toString(), trend: 'Mới', icon: CalendarDays, color: 'text-blue-500', sub: 'Đang gửi & chờ' },
    { label: 'THÔNG BÁO THUẾ', value: '03', unit: '', trend: 'KHẨN CẤP', icon: AlertCircle, color: 'text-red-600', sub: 'Hết hạn trong 48 giờ', urgent: true },
  ];

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const recentBookings = sortedSessions.slice(0, 5).map(s => {
    const date = new Date(s.startTime);
    const user = s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() : 'Khách vãng lai';
    return {
      id: `#BK-${(s.id || s._id || '0000').toString().substring(0,4).toUpperCase()}`,
      user: user || 'Khách vãng lai',
      initials: (user || 'Kh').substring(0, 2).toUpperCase(),
      time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      status: s.status === 'Completed' ? 'Hoàn tất' : (s.isCheckedIn ? 'Đang gửi' : 'Đang chờ'),
      amount: s.totalFee ? `${s.totalFee.toLocaleString()}đ` : '---'
    };
  });

  if (recentBookings.length === 0 && !loading) {
     recentBookings.push({ id: '#BK-1082', user: 'Lê Minh', initials: 'LM', time: '10:30', status: 'Hoàn tất', amount: '45,000đ' });
     recentBookings.push({ id: '#BK-1083', user: 'Trần Hòa', initials: 'TH', time: '10:45', status: 'Đang xử lý', amount: '120,000đ' });
     recentBookings.push({ id: '#BK-1084', user: 'Nguyễn Nam', initials: 'NN', time: '11:00', status: 'Hoàn tất', amount: '30,000đ' });
  }

  const totalMix = sessions.length || 542;
  const carSessions = sessions.filter(s => s.vehicleType?.toLowerCase() === 'car').length || 325;
  const carPercentage = totalMix ? Math.round((carSessions / totalMix) * 100) : 60;
  const suvPercentage = 100 - carPercentage;


  return (
    <AdminLayout>
        <div className="p-10 space-y-10">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Tổng quan hệ thống</h2>
              <p className="text-sm text-slate-500 font-medium">Chào mừng trở lại. Dưới đây là hiệu suất vận hành bãi đỗ xe của bạn hôm nay.</p>
            </div>
            <Link 
              to="/admin/settings?tab=parking"
              className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-6 rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              CHỈNH SỬA BẢNG GIÁ
            </Link>
          </div>

          {/* Metrics Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {metrics.map((m, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden group ${m.urgent ? 'ring-2 ring-red-500/10 border-red-100' : ''}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${m.urgent ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-900'} group-hover:scale-110 transition-transform`}>
                    <m.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${m.urgent ? 'bg-red-600 text-white animate-pulse' : 'text-blue-600 bg-blue-50'}`}>
                    {m.trend}
                  </span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{m.label}</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-black text-slate-900">{m.value}</span>
                  {m.unit && <span className="text-xs font-bold text-slate-400">{m.unit}</span>}
                </div>
                <p className="text-[11px] font-bold text-slate-400">{m.sub}</p>
                
                {/* Visual Accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] translate-x-10 -translate-y-10 group-hover:rotate-12 transition-transform duration-700 ${m.urgent ? 'text-red-600' : 'text-blue-600'}`}>
                  <m.icon className="w-full h-full" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Revenue Trend Chart Area */}
            <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Xu hướng Doanh Thu</h3>
                  <p className="text-xs text-slate-400 font-bold">Thống kê doanh thu theo tuần (VNĐ)</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <button className="text-[10px] font-black px-4 py-1.5 rounded-lg bg-white text-slate-900 shadow-sm border border-slate-200">7 ngày qua</button>
                  <button className="text-[10px] font-black px-4 py-1.5 text-slate-400 hover:text-slate-900 transition-colors">30 ngày qua</button>
                  <ChevronDown className="w-4 h-4 text-slate-400 mr-2" />
                </div>
              </div>
              
              <div className="h-64 w-full flex items-end gap-3 pb-4">
                {[120, 180, 250, 140, 320, 210, 410].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    {i === 6 && (
                      <div className="absolute -top-12 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl mb-2 flex items-center gap-2">
                        Hôm nay: 45.2M
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                      </div>
                    )}
                    <div 
                      className={`w-full rounded-t-xl transition-all duration-500 cursor-pointer ${i === 6 ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'bg-slate-100 hover:bg-slate-200'}`} 
                      style={{ height: `${(h/410)*100}%` }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Mix Area */}
            <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">Cơ cấu Phương Tiện</h3>
              <p className="text-xs text-slate-400 font-bold mb-10">Phân bổ lưu lượng theo loại xe</p>
              
              <div className="relative h-56 flex items-center justify-center mb-10">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="24" fill="transparent" className="text-slate-50" />
                  <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="24" fill="transparent" strokeDasharray={`${2*Math.PI*80}`} strokeDashoffset={`${2*Math.PI*80*(1-carPercentage/100)}`} className="text-blue-600" />
                  <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="24" fill="transparent" strokeDasharray={`${2*Math.PI*80}`} strokeDashoffset={-2*Math.PI*80*(carPercentage/100)} className="text-emerald-500" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-900">{totalMix}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TỔNG LƯỢT</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-xs font-bold text-slate-600">Ô tô (4-7 chỗ)</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{carPercentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs font-bold text-slate-600">SUV / Bán tải</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{suvPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Activity Table */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Hoạt động đặt chỗ gần đây</h3>
                <button className="text-[11px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">Xem tất cả</button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã đặt chỗ</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thanh toán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-5 text-sm font-bold text-slate-900">{b.id}</td>
                        <td className="py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-[10px]">{b.initials}</div>
                            <span className="text-sm font-bold text-slate-900">{b.user}</span>
                          </div>
                        </td>
                        <td className="py-5 text-sm font-medium text-slate-500">{b.time}</td>
                        <td className="py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${b.status === 'Hoàn tất' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-5 text-sm font-black text-slate-900 text-right">{b.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
