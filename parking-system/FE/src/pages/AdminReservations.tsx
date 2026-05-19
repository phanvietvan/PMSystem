import {
  Search,
  TrendingUp,
  TrendingDown,
  Filter,
  FileDown,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  Car,
  Clock,
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';

const AdminReservations = () => {
  console.log("AdminReservations rendered");

  const reservations = [
    { id: '#BK-5182', name: 'Nguyễn Văn Lợi', initials: 'NL', plate: '51F-123.45', type: 'Ô tô (4-7 chỗ)', in: '08:30 - 15/05', out: '17:30 - 15/05', status: 'Confirmed' },
    { id: '#BK-5183', name: 'Hoàng Minh Tú', initials: 'HT', plate: '30A-999.88', type: 'SUV / Bán tải', in: '09:15 - 15/05', out: '11:00 - 15/05', status: 'Pending' },
    { id: '#BK-5184', name: 'Phạm Thị Bích', initials: 'PB', plate: '51H-678.90', type: 'Xe máy', in: '10:00 - 15/05', out: '18:00 - 15/05', status: 'Cancelled' },
    { id: '#BK-5185', name: 'Lê Hoàng', initials: 'LH', plate: '51C-445.67', type: 'Ô tô (4-7 chỗ)', in: '13:45 - 15/05', out: '15:00 - 15/05', status: 'Confirmed' },
    { id: '#BK-5186', name: 'Trần Quốc', initials: 'TQ', plate: '51G-112.23', type: 'SUV / Bán tải', in: '14:00 - 15/05', out: '16:30 - 15/05', status: 'Confirmed' },
  ];


  return (
    <AdminLayout>
      {/* Page Content */}
        <div className="p-10 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
               { label: 'TỔNG ĐẶT CHỖ', value: '1,284', icon: TrendingUp, color: 'text-blue-600', trend: '+12%' },
               { label: 'ĐANG CHỜ', value: '42', icon: Clock, color: 'text-amber-600', trend: 'Cần xử lý' },
               { label: 'HỦY BỎ', value: '18', icon: TrendingDown, color: 'text-red-600', trend: '-2%' },
               { label: 'DOANH THU', value: '45.2M', unit: 'VND', icon: Car, color: 'text-blue-600', trend: 'Dự kiến' },
             ].map((stat, i) => (
               <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-2.5 bg-slate-50 rounded-xl text-slate-900">
                        <stat.icon className="w-5 h-5" />
                     </div>
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stat.color === 'text-red-600' ? 'bg-red-50' : 'bg-blue-50'} ${stat.color}`}>
                        {stat.trend}
                     </span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                    {stat.unit && <span className="text-[10px] font-bold text-slate-400">{stat.unit}</span>}
                  </div>
               </div>
             ))}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 w-full sm:w-80">
                <Search className="text-slate-400 w-4 h-4" />
                <input className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 w-full p-0" placeholder="Tìm theo mã hoặc biển số..." />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <Filter className="w-4 h-4" />
                    Bộ lọc
                 </button>
                 <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <FileDown className="w-4 h-4" />
                    Xuất File
                 </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã đặt chỗ</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phương tiện</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giờ vào/ra</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5 text-sm font-bold text-slate-900">{row.id}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">{row.initials}</div>
                          <span className="text-sm font-bold text-slate-900">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-900 font-mono">{row.plate}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{row.type}</p>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> {row.in}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div> {row.out}
                            </span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                          row.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          row.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600" title="Xem chi tiết">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600" title="Chỉnh sửa">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Hiển thị 1-5 của 1,284 đặt chỗ</span>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 rounded-lg bg-blue-600 text-white font-black text-xs shadow-lg shadow-blue-600/20">1</button>
                <button className="w-9 h-9 rounded-lg hover:bg-white font-black text-xs text-slate-400">2</button>
                <button className="w-9 h-9 rounded-lg hover:bg-white font-black text-xs text-slate-400">3</button>
                <button className="p-2 rounded-lg border border-slate-200 hover:bg-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
    </AdminLayout>
  );
};

export default AdminReservations;
