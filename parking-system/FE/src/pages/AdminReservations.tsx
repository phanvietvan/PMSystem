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
  Camera
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
      if (r.status === 'Cancelled') statusLabel = 'Đã hủy';
      else if (r.status === 'Completed') statusLabel = 'Hoàn tất';
      else if (!r.isCheckedIn) statusLabel = 'Chờ vào';

      return [
        r.qrCode || `#${r.id?.substring(0, 8).toUpperCase()}`,
        userName,
        r.licensePlate || 'N/A',
        r.vehicleType || 'Không rõ',
        `${r.parkingLotName || 'Chưa phân bổ'} - Slot ${r.parkingSlot || 'Auto'}`,
        r.isCheckedIn || !r.userId ? (r.entryTime ? new Date(r.entryTime).toLocaleString() : '--:--') : 'Chưa vào',
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
  const pendingCount = reservations.filter(r => !r.isCheckedIn && r.status !== 'Completed' && r.status !== 'Cancelled').length;
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
        <div className="p-8 md:p-10 space-y-8 min-h-screen">
          <div className="flex flex-col gap-1.5 mb-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Phiên Đỗ Xe</h1>
            <p className="text-sm font-semibold text-slate-500">Giám sát và phân tích toàn bộ lượt ra vào bãi đỗ xe theo thời gian thực.</p>
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
               { label: 'TỔNG ĐẶT CHỖ', value: totalReservations.toString(), icon: TrendingUp, color: 'text-blue-600', trend: 'Tất cả', bgGlow: 'bg-blue-500', iconBg: 'bg-blue-50 text-blue-600', badgeClass: 'bg-blue-100/50 text-blue-700' },
               { label: 'ĐANG CHỜ VÀO', value: pendingCount.toString(), icon: Clock, color: 'text-amber-600', trend: 'Cần xử lý', bgGlow: 'bg-amber-500', iconBg: 'bg-amber-50 text-amber-600', badgeClass: 'bg-amber-100/50 text-amber-700' },
               { label: 'HOÀN TẤT', value: completedCount.toString(), icon: TrendingDown, color: 'text-emerald-600', trend: 'Đã thanh toán', bgGlow: 'bg-emerald-500', iconBg: 'bg-emerald-50 text-emerald-600', badgeClass: 'bg-emerald-100/50 text-emerald-700' },
               { label: 'DOANH THU', value: formatRevenue(totalRevenue), unit: 'VND', icon: Car, color: 'text-indigo-600', trend: 'Thực tế', bgGlow: 'bg-indigo-500', iconBg: 'bg-indigo-50 text-indigo-600', badgeClass: 'bg-indigo-100/50 text-indigo-700' },
             ].map((stat, i) => (
               <div key={i} className="bg-white p-7 rounded-[24px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-400 ease-out cursor-pointer relative overflow-hidden group">
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${stat.bgGlow}`}></div>
                  <div className="flex justify-between items-start mb-6">
                     <div className={`p-3.5 rounded-2xl ${stat.iconBg}`}>
                        <stat.icon className="w-5 h-5" />
                     </div>
                     <span className={`text-[10px] font-black px-3 py-1 rounded-full ${stat.badgeClass}`}>
                        {stat.trend}
                     </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">{stat.label}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-800 tracking-tight">{loading ? '-' : stat.value}</span>
                    {stat.unit && <span className="text-[10px] font-bold text-slate-400">{stat.unit}</span>}
                  </div>
               </div>
             ))}
          </div>

          {/* Table Container */}
          {/* Table Container */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100/50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative w-full md:w-[400px] group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input 
                  className="w-full bg-slate-50/50 border border-slate-200/60 rounded-full pl-12 pr-6 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
                  placeholder="Tìm theo mã vé hoặc biển số..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 border border-slate-200/80 bg-white rounded-full text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
                    <Filter className="w-4 h-4" />
                    Bộ lọc
                 </button>
                 <button onClick={exportToCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 border border-slate-900 rounded-full text-sm font-bold text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all">
                    <FileDown className="w-4 h-4" />
                    Xuất File
                 </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30">Mã QR / Đặt chỗ</th>
                    <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30">Khách hàng</th>
                    <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30">Phương tiện & Vị trí</th>
                    <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30">Giờ Đặt / Vào / Ra</th>
                    <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30 text-center">Trạng thái</th>
                    <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-500">Đang tải dữ liệu...</td></tr>
                  ) : filteredReservations.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-500">Không tìm thấy kết quả phù hợp</td></tr>
                  ) : filteredReservations.map((row, i) => {
                    const userName = row.user ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() || 'Khách hàng' : 'Khách vãng lai';
                    const userInitials = row.user ? getUserInitials({ firstName: row.user.firstName, lastName: row.user.lastName, username: userName } as any) : 'KV';
                    
                    let statusLabel = 'Đang đỗ';
                    let statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                    if (row.status === 'Cancelled') {
                        statusLabel = 'Đã hủy';
                        statusColor = 'bg-rose-50 text-rose-600 border-rose-100';
                    } else if (row.status === 'Completed') {
                        statusLabel = 'Hoàn tất';
                        statusColor = 'bg-slate-50 text-slate-600 border-slate-200';
                    } else if (!row.isCheckedIn) {
                        statusLabel = 'Chờ vào';
                        statusColor = 'bg-amber-50 text-amber-600 border-amber-100';
                    }

                    return (
                    <tr key={row.id || i} className="hover:bg-slate-50/80 transition-colors duration-200 group relative border-b border-slate-50 last:border-none">
                      <td className="px-8 py-6 text-sm font-semibold text-slate-700 font-mono tracking-wider">{row.qrCode || `#${row.id.substring(0, 8).toUpperCase()}`}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3.5">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm ring-1 ring-indigo-100/50">{userInitials}</div>
                          <span className="text-sm font-semibold text-slate-800">{userName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 mb-1.5">
                           <span className="text-sm font-black text-slate-900 font-mono tracking-wide">{row.licensePlate || 'N/A'}</span>
                           <span className="text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50">{row.vehicleType || 'Không rõ'}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                           {row.parkingLotName || 'Chưa phân bổ'} <span className="text-slate-300">•</span> Slot {row.parkingSlot || 'Auto'}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col gap-1.5">
                            {row.userId && (
                              <span className="text-[11px] font-bold text-blue-600 flex items-center gap-2" title="Giờ đặt chỗ">
                                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Đặt: {formatTime(row.createdAt || row.entryTime)}
                              </span>
                            )}
                            <span className={`text-[11px] font-bold flex items-center gap-2 ${row.isCheckedIn || !row.userId ? 'text-slate-900' : 'text-slate-400 italic'}`} title="Giờ vào">
                               <div className={`w-1.5 h-1.5 rounded-full ${row.isCheckedIn || !row.userId ? 'bg-emerald-500' : 'bg-slate-300'}`}></div> 
                               Vào: {row.isCheckedIn || !row.userId ? formatTime(row.entryTime) : 'Chưa vào'}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2" title="Giờ ra">
                               <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div> Ra: {formatTime(row.exitTime)}
                            </span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            onClick={() => { setSelectedReservation(row); setIsModalOpen(true); }}
                            className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-blue-600 border border-transparent hover:border-slate-200" title="Xem chi tiết">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setSelectedReservation(row); setIsModalOpen(true); }}
                            className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 border border-transparent hover:border-slate-200" title="Chỉnh sửa">
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_20px_80px_-20px_rgba(0,0,0,0.3)] border border-slate-100/50 flex flex-col relative scale-100 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between p-8 border-b border-slate-100/60 sticky top-0 bg-white/90 backdrop-blur-xl z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100/50 flex items-center justify-center text-blue-600 shadow-sm">
                     <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Chi Tiết Phiên Đỗ Xe</h3>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Thông tin vé & hình ảnh phương tiện</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Cột Trái: Thông tin */}
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Mã QR</p>
                      <p className="text-sm font-bold text-slate-800 font-mono bg-slate-50 border border-slate-200/60 inline-block px-3 py-1.5 rounded-xl shadow-sm">{selectedReservation.qrCode || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Khách Hàng</p>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 font-bold text-xs shadow-sm ring-1 ring-blue-100/50">{getUserInitials({ firstName: selectedReservation.user?.firstName, lastName: selectedReservation.user?.lastName, username: selectedReservation.user?.firstName ? `${selectedReservation.user?.firstName} ${selectedReservation.user?.lastName}` : 'Khách vãng lai' } as any)}</div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">
                              {selectedReservation.user ? `${selectedReservation.user.firstName || ''} ${selectedReservation.user.lastName || ''}`.trim() || 'Khách hàng' : 'Khách vãng lai'}
                            </p>
                            {selectedReservation.user?.email && <p className="text-xs font-semibold text-slate-500">{selectedReservation.user.email}</p>}
                         </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">Phương Tiện</p>
                        <p className="text-base font-black text-slate-900 font-mono">{selectedReservation.licensePlate}</p>
                        <p className="text-[11px] font-bold text-slate-500">{selectedReservation.vehicleType}</p>
                      </div>
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">Vị Trí Đỗ</p>
                        <p className="text-sm font-bold text-slate-900">{selectedReservation.parkingLotName || 'N/A'}</p>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">Slot: {selectedReservation.parkingSlot || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-50 pb-2.5">Hành Trình Thời Gian</p>
                      {selectedReservation.userId && (
                         <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Đặt chỗ</span>
                            <span className="text-xs font-bold text-blue-600">{formatTime(selectedReservation.createdAt || selectedReservation.entryTime)}</span>
                         </div>
                      )}
                      <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Vào bãi</span>
                         <span className="text-xs font-bold text-slate-900">{selectedReservation.isCheckedIn || !selectedReservation.userId ? formatTime(selectedReservation.entryTime) : <span className="italic text-slate-400">Chưa vào bãi</span>}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div> Ra bãi</span>
                         <span className="text-xs font-bold text-slate-900">{selectedReservation.exitTime ? formatTime(selectedReservation.exitTime) : <span className="italic text-slate-400">Chưa ra bãi</span>}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-indigo-50 border border-indigo-100/50 shadow-sm">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Thành Tiền</p>
                      <p className="text-2xl font-black text-indigo-600 tracking-tight">{selectedReservation.totalFee ? selectedReservation.totalFee.toLocaleString() + ' ₫' : 'Đang tính...'}</p>
                    </div>
                  </div>
                  
                  {/* Cột Phải: Hình ảnh Camera */}
                  <div className="space-y-6">
                    <div className="bg-slate-50/30 p-5 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div> CAMERA CỔNG VÀO</p>
                      {selectedReservation.entryPhoto ? (
                        <div className="p-1.5 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                           <img src={selectedReservation.entryPhoto} alt="Entry" className="w-full h-44 object-cover rounded-xl hover:scale-[1.02] transition-transform duration-300" />
                        </div>
                      ) : (
                        <div className="w-full h-44 bg-slate-100/80 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                           <Camera className="w-6 h-6 opacity-50" />
                           <span className="text-xs font-semibold">Chưa có ảnh chụp vào</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-50/30 p-5 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div> CAMERA CỔNG RA</p>
                      {selectedReservation.exitPhoto ? (
                        <div className="p-1.5 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                           <img src={selectedReservation.exitPhoto} alt="Exit" className="w-full h-44 object-cover rounded-xl hover:scale-[1.02] transition-transform duration-300" />
                        </div>
                      ) : (
                        <div className="w-full h-44 bg-slate-100/80 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                           <Camera className="w-6 h-6 opacity-50" />
                           <span className="text-xs font-semibold">Chưa có ảnh chụp ra</span>
                        </div>
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
