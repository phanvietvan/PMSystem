import {
  TrendingUp,
  Leaf,
  ShieldCheck,
  MoreVertical,
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';

const AdminReports = () => {
  console.log("AdminReports rendered");

  const monthlyData = [
    { month: 'Th.1', lastYear: 40, current: 55 },
    { month: 'Th.2', lastYear: 35, current: 48 },
    { month: 'Th.3', lastYear: 60, current: 75 },
    { month: 'Th.4', lastYear: 50, current: 65 },
    { month: 'Th.5', lastYear: 80, current: 95, active: true },
    { month: 'Th.6', lastYear: 40, current: 50, forecast: true },
  ];

  const heatmapDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const heatmapColors = [
    'bg-blue-50', 'bg-blue-100', 'bg-blue-50', 'bg-blue-200', 'bg-blue-600/60', 'bg-blue-600', 'bg-slate-900',
    'bg-blue-200', 'bg-blue-200', 'bg-blue-600', 'bg-blue-600', 'bg-slate-900', 'bg-slate-900', 'bg-slate-900',
    'bg-blue-50', 'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-600', 'bg-blue-600', 'bg-blue-600',
    'bg-blue-50', 'bg-blue-50', 'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-600', 'bg-blue-600',
  ];

  const zones = [
    { id: 'A1', name: 'Khu A1 - Hầm B2', count: '1,240', revenue: '45,2tr ₫' },
    { id: 'C3', name: 'Khu C3 - Ngoài trời', count: '980', revenue: '32,1tr ₫' },
    { id: 'B2', name: 'Khu B2 - Hầm B1', count: '850', revenue: '28,5tr ₫' },
    { id: 'D1', name: 'Khu D1 - VIP', count: '420', revenue: '25,8tr ₫' },
  ];


  return (
    <AdminLayout>
      {/* Page Content */}
        <div className="p-10 space-y-8">
           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng lượt gửi</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">+12.5%</span>
                 </div>
                 <div className="text-4xl font-black text-blue-600">24,592</div>
                 <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Giao dịch trong tháng 5</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tỷ lệ lấp đầy</span>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase">Cao nhất</span>
                 </div>
                 <div className="text-4xl font-black text-slate-900">88.4%</div>
                 <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Giờ cao điểm (18:00 - 21:00)</p>
              </div>
              <div className="bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-600/20 text-white relative overflow-hidden group">
                 <div className="relative z-10">
                    <h4 className="text-lg font-black mb-2">Dự báo tuần tới</h4>
                    <p className="text-xs text-white/70 mb-6 leading-relaxed">Tải trọng dự kiến tăng 15% do sự kiện cuối tuần.</p>
                    <button className="bg-white text-blue-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-transform">Xem dự báo AI</button>
                 </div>
                 <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
              </div>
           </div>

           <div className="grid grid-cols-12 gap-8">
              {/* Bar Chart Comparison */}
              <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">So sánh Doanh thu Hàng tháng</h3>
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Hiện tại</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-slate-200 rounded-full"></div>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Năm ngoái</span>
                       </div>
                    </div>
                 </div>
                 <div className="h-64 flex items-end justify-between px-2 gap-4">
                    {monthlyData.map((d, i) => (
                       <div key={i} className={`flex-1 flex flex-col items-center group ${d.forecast ? 'opacity-30' : ''}`}>
                          <div className="w-full flex items-end gap-1.5 h-full">
                             <div className="flex-1 bg-slate-100 rounded-t-lg transition-all" style={{ height: `${d.lastYear}%` }}></div>
                             <div className={`flex-1 bg-blue-600 rounded-t-lg transition-all group-hover:scale-y-105 origin-bottom`} style={{ height: `${d.current}%` }}></div>
                          </div>
                          <span className={`mt-4 text-[10px] font-black ${d.active ? 'text-blue-600' : 'text-slate-400'}`}>{d.month}</span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Heatmap Section */}
              <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Bản đồ Nhiệt Cao Điểm</h3>
                    <div className="flex items-center gap-1">
                       <div className="w-2 h-2 bg-blue-50 rounded-sm"></div>
                       <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
                    </div>
                 </div>
                 <div className="grid grid-cols-7 gap-1.5">
                    {heatmapDays.map((day, i) => (
                       <div key={i} className={`text-center text-[10px] font-black mb-2 ${i >= 5 ? 'text-blue-600' : 'text-slate-400'}`}>{day}</div>
                    ))}
                    {heatmapColors.map((color, i) => (
                       <div key={i} className={`h-11 ${color} rounded-lg transition-all hover:scale-110 cursor-pointer`}></div>
                    ))}
                 </div>
                 <div className="mt-6 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Sáng</span><span>Trưa</span><span>Chiều</span><span>Đêm</span>
                 </div>
              </div>
           </div>

           {/* Table & Insights Grid */}
           <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Khu vực Hiệu quả nhất</h3>
                    <MoreVertical className="text-slate-400 w-5 h-5 cursor-pointer" />
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/50">
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khu vực</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lượt xe</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Doanh thu</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {zones.map((zone, i) => (
                             <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-[10px] border border-blue-100">{zone.id}</div>
                                      <span className="text-sm font-bold text-slate-900">{zone.name}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-5 text-sm text-slate-900 text-center font-bold">{zone.count}</td>
                                <td className="px-8 py-5 text-sm text-blue-600 text-right font-black">{zone.revenue}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="col-span-12 lg:col-span-5 space-y-6">
                 <div className="bg-[#004b58] text-white p-8 rounded-3xl relative overflow-hidden group shadow-xl shadow-[#004b58]/20">
                    <div className="relative z-10">
                       <h4 className="text-lg font-black mb-2">Tối ưu hóa năng lượng</h4>
                       <p className="text-xs text-white/70 mb-6 leading-relaxed">Hệ thống gợi ý giảm 20% độ sáng tại khu vực C3 từ 01:00 đến 05:00 sáng.</p>
                       <button className="bg-white text-[#004b58] px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-transform">Áp dụng ngay</button>
                    </div>
                    <Leaf className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                 </div>
                 <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm relative overflow-hidden group">
                    <div className="relative z-10">
                       <h4 className="text-lg font-black text-slate-900 mb-2">Báo cáo An ninh</h4>
                       <p className="text-xs text-slate-400 mb-6 leading-relaxed">03 cảnh báo cần xem xét trong 24 giờ qua liên quan đến lỗi nhận diện biển số.</p>
                       <button className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-transform shadow-lg shadow-blue-600/20">Kiểm tra Logs</button>
                    </div>
                    <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-600 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                 </div>
              </div>
           </div>
        </div>
    </AdminLayout>
  );
};

export default AdminReports;
