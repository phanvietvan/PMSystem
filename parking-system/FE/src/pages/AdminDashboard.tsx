import { 
  CalendarDays, 
  TrendingUp, 
  Car, 
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '../components/admin/AdminLayout';

const AdminDashboard = () => {
  console.log("AdminDashboard rendered");

  const metrics = [
    { label: 'TỔNG DOANH THU', value: '245M', unit: 'VND', trend: '+12%', icon: TrendingUp, color: 'text-blue-600', sub: 'So với tháng trước' },
    { label: 'TỶ LỆ LẤP ĐẦY', value: '85%', trend: '85%', icon: Car, color: 'text-emerald-600', sub: 'Công suất tối ưu' },
    { label: 'ĐẶT CHỖ HOẠT ĐỘNG', value: '124', trend: '18', icon: CalendarDays, color: 'text-blue-500', sub: 'Đang chờ xử lý: 18' },
    { label: 'THÔNG BÁO THUẾ', value: '03', unit: '', trend: 'KHẨN CẤP', icon: AlertCircle, color: 'text-red-600', sub: 'Hết hạn trong 48 giờ', urgent: true },
  ];

  const recentBookings = [
    { id: '#BK-1082', user: 'Lê Minh', time: '10:30', status: 'Hoàn tất', amount: '45,000đ' },
    { id: '#BK-1083', user: 'Trần Hòa', time: '10:45', status: 'Đang xử lý', amount: '120,000đ' },
    { id: '#BK-1084', user: 'Nguyễn Nam', time: '11:00', status: 'Hoàn tất', amount: '30,000đ' },
  ];


  return (
    <AdminLayout>
        <div className="p-10 space-y-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Tổng quan hệ thống</h2>
            <p className="text-sm text-slate-500 font-medium">Chào mừng trở lại. Dưới đây là hiệu suất vận hành bãi đỗ xe của bạn hôm nay.</p>
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
                  <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="24" fill="transparent" strokeDasharray={`${2*Math.PI*80}`} strokeDashoffset={`${2*Math.PI*80*(1-0.6)}`} className="text-blue-600" />
                  <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="24" fill="transparent" strokeDasharray={`${2*Math.PI*80}`} strokeDashoffset={-2*Math.PI*80*0.6} className="text-emerald-500" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-900">542</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TỔNG LƯỢT</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-xs font-bold text-slate-600">Ô tô (4-7 chỗ)</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">60%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs font-bold text-slate-600">SUV / Bán tải</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">25%</span>
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
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-[10px]">LM</div>
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
