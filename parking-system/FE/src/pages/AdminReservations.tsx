import { useState, useEffect } from 'react';
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
  X,
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../services/api';
import { getUserInitials } from '../utils/auth';

const AdminReservations = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await api.get('/ParkingSessions');
        if (response.data) {
          const sessions = Array.isArray(response.data) ? response.data : (response.data.data || []);
          // Sort by createdAt descending (newest first)
          const sorted = [...sessions].sort((a, b) => {
            const timeA = new Date(a.createdAt || a.entryTime).getTime();
            const timeB = new Date(b.createdAt || b.entryTime).getTime();
            return timeB - timeA;
          });
          setReservations(sorted);
        }
      } catch (error) {
        console.error("Error fetching reservations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch immediately on mount
    fetchReservations();
    
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchReservations, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '--:--';
    const d = new Date(dateString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const exportToCSV = () => {
    const headers = ['Mã QR', 'Khách hàng', 'Biển số', 'Loại xe', 'Vị trí đỗ', 'Giờ vào', 'Giờ ra', 'Trạng thái', 'Thành tiền'];
    const rows = filteredReservations.map(r => {
      const userName = r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || 'Khách hàng' : 'Khách vãng lai';
      let statusLabel = 'Đang đỗ';
      if (r.status === 'Completed') statusLabel = 'Hoàn tất';
      else if (!r.isCheckedIn) statusLabel = 'Chờ vào';

      return [
        r.qrCode || `#${r.id?.substring(0, 8).toUpperCase()}`,
        userName,
        r.licensePlate || 'N/A',
        r.vehicleType || 'Không rõ',
        `${r.parkingLotName || 'Chưa phân bổ'} - Slot ${r.parkingSlot || 'Auto'}`,
        r.entryTime ? new Date(r.entryTime).toLocaleString() : '--:--',
        r.exitTime ? new Date(r.exitTime).toLocaleString() : '--:--',
        statusLabel,
        r.totalFee || 0
      ].map(v => `"${v}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reservations_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReservations = reservations.filter(r => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    const qr = (r.qrCode || '').toLowerCase();
    const plate = (r.licensePlate || '').toLowerCase();
    const userName = r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim().toLowerCase() : 'khách vãng lai';
    return qr.includes(term) || plate.includes(term) || userName.includes(term);
  });

  // Tính toán thống kê theo thời gian thực (Real-time Stats)
  const totalReservations = reservations.length;
  const pendingCount = reservations.filter(r => !r.isCheckedIn && r.status !== 'Completed').length;
  const completedCount = reservations.filter(r => r.status === 'Completed').length;
  const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalFee || 0), 0);
  
  // Format doanh thu (VD: 45,000,000 -> 45M)
  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K';
    return amount.toString();
  };

  return (
    <AdminLayout>
      {/* Page Content */}
        <div className="p-10 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
               { label: 'TỔNG ĐẶT CHỖ', value: totalReservations.toString(), icon: TrendingUp, color: 'text-blue-600', trend: 'Tất cả' },
               { label: 'ĐANG CHỜ VÀO', value: pendingCount.toString(), icon: Clock, color: 'text-amber-600', trend: 'Cần xử lý' },
               { label: 'HOÀN TẤT', value: completedCount.toString(), icon: TrendingDown, color: 'text-emerald-600', trend: 'Đã thanh toán' },
               { label: 'DOANH THU', value: formatRevenue(totalRevenue), unit: 'VND', icon: Car, color: 'text-blue-600', trend: 'Thực tế' },
             ].map((stat, i) => (
               <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50/50 to-transparent rounded-bl-[4rem] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-2.5 bg-slate-50 rounded-xl text-slate-900">
                        <stat.icon className="w-5 h-5" />
                     </div>
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stat.color === 'text-red-600' ? 'bg-red-50' : stat.color === 'text-emerald-600' ? 'bg-emerald-50' : stat.color === 'text-amber-600' ? 'bg-amber-50' : 'bg-blue-50'} ${stat.color}`}>
                        {stat.trend}
                     </span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{loading ? '-' : stat.value}</span>
                    {stat.unit && <span className="text-[10px] font-bold text-slate-400">{stat.unit}</span>}
                  </div>
               </div>
             ))}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="p-8 border-b border-slate-100/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 bg-slate-50/50 px-4 py-2.5 rounded-xl border border-slate-100/60 w-full sm:w-80 focus-within:bg-white focus-within:border-blue-200 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all">
                <Search className="text-slate-400 w-4 h-4" />
                <input 
                  className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 w-full p-0" 
                  placeholder="Tìm theo mã hoặc biển số..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <Filter className="w-4 h-4" />
                    Bộ lọc
                 </button>
                 <button onClick={exportToCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <FileDown className="w-4 h-4" />
                    Xuất File
                 </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã QR / Đặt chỗ</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phương tiện & Vị trí</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giờ vào/ra</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-500">Đang tải dữ liệu...</td></tr>
                  ) : filteredReservations.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-500">Không tìm thấy kết quả phù hợp</td></tr>
                  ) : filteredReservations.map((row, i) => {
                    const userName = row.user ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() || 'Khách hàng' : 'Khách vãng lai';
                    const userInitials = row.user ? getUserInitials({ firstName: row.user.firstName, lastName: row.user.lastName, username: userName } as any) : 'KV';
                    
                    let statusLabel = 'Đang đỗ';
                    let statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                    if (row.status === 'Completed') {
                        statusLabel = 'Hoàn tất';
                        statusColor = 'bg-slate-50 text-slate-600 border-slate-200';
                    } else if (!row.isCheckedIn) {
                        statusLabel = 'Chờ vào';
                        statusColor = 'bg-amber-50 text-amber-600 border-amber-100';
                    }

                    return (
                    <tr key={row.id || i} className="hover:bg-blue-50/30 transition-all duration-200 group relative">
                      <td className="px-8 py-5 text-sm font-semibold text-slate-700 font-mono tracking-wider">{row.qrCode || `#${row.id.substring(0, 8).toUpperCase()}`}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center text-blue-600 font-bold text-xs shadow-sm border border-blue-100/50">{userInitials}</div>
                          <span className="text-sm font-semibold text-slate-800">{userName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-sm font-black text-slate-900 font-mono">{row.licensePlate || 'N/A'}</span>
                           <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{row.vehicleType || 'Không rõ'}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block border border-blue-100 mt-1">
                           {row.parkingLotName || 'Chưa phân bổ'} • Slot {row.parkingSlot || 'Auto'}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> {formatTime(row.entryTime)}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div> {formatTime(row.exitTime)}
                            </span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setSelectedReservation(row); setIsModalOpen(true); }}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600" title="Xem chi tiết">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setSelectedReservation(row); setIsModalOpen(true); }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600" title="Chỉnh sửa">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
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
        
        {/* Modal Chi Tiết */}
        {isModalOpen && selectedReservation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-md p-4 transition-all">
            <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgb(0,0,0,0.08)] border border-white/50 flex flex-col">
              <div className="flex items-center justify-between p-8 border-b border-slate-100/50 sticky top-0 bg-white/80 backdrop-blur-xl z-10">
                <h3 className="text-xl font-black text-slate-900">Chi Tiết Phiên Đỗ Xe</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cột Trái: Thông tin */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mã QR</p>
                      <p className="text-sm font-black text-blue-600 font-mono bg-blue-50 inline-block px-2 py-1 rounded">{selectedReservation.qrCode || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Khách Hàng</p>
                      <p className="text-sm font-bold text-slate-900">
                        {selectedReservation.user ? `${selectedReservation.user.firstName || ''} ${selectedReservation.user.lastName || ''}`.trim() || 'Khách hàng' : 'Khách vãng lai'}
                      </p>
                      {selectedReservation.user?.email && <p className="text-xs font-semibold text-slate-500">{selectedReservation.user.email}</p>}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Phương Tiện</p>
                      <p className="text-sm font-black text-slate-900">{selectedReservation.licensePlate}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase">{selectedReservation.vehicleType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Vị Trí Đỗ</p>
                      <p className="text-sm font-bold text-slate-900">{selectedReservation.parkingLotName || 'N/A'}</p>
                      <p className="text-xs font-bold text-slate-500">Slot: {selectedReservation.parkingSlot || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Thời Gian</p>
                      <p className="text-sm font-bold text-slate-900"><span className="text-emerald-600">Vào:</span> {formatTime(selectedReservation.entryTime)}</p>
                      <p className="text-sm font-bold text-slate-900"><span className="text-slate-500">Ra:</span> {formatTime(selectedReservation.exitTime)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Thành Tiền</p>
                      <p className="text-lg font-black text-blue-600">{selectedReservation.totalFee ? selectedReservation.totalFee.toLocaleString() + ' VNĐ' : 'Đang tính...'}</p>
                    </div>
                  </div>
                  
                  {/* Cột Phải: Hình ảnh Camera */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ảnh Camera (Lúc Vào)</p>
                      {selectedReservation.entryPhoto ? (
                        <div className="p-1.5 bg-white border border-slate-100/80 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                           <img src={selectedReservation.entryPhoto} alt="Entry" className="w-full h-48 object-cover rounded-[1.5rem]" />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs font-semibold">Chưa có ảnh vào</div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ảnh Camera (Lúc Ra)</p>
                      {selectedReservation.exitPhoto ? (
                        <div className="p-1.5 bg-white border border-slate-100/80 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                           <img src={selectedReservation.exitPhoto} alt="Exit" className="w-full h-48 object-cover rounded-[1.5rem]" />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs font-semibold">Chưa có ảnh ra</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
};

export default AdminReservations;
