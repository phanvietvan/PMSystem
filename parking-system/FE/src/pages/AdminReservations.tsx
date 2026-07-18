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
  ChevronDown,
  Car,
  Clock,
  X,
  Camera
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import { getUserInitials } from '../utils/auth';
import ExcelJS from 'exceljs';
import { parkingService } from '../services/parking.service';

const AdminReservations = () => {
    const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

  const [newEndTime, setNewEndTime] = useState('');
  const [isExtending, setIsExtending] = useState(false);
  const [extensionError, setExtensionError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'All', label: 'Tất cả trạng thái' },
    { value: 'Waiting', label: 'Chờ vào bãi' },
    { value: 'Parking', label: 'Đang đỗ xe' },
    { value: 'Completed', label: 'Đã hoàn tất' },
    { value: 'Cancelled', label: 'Đã hủy' }
  ];

  const vehicleOptions = [
    { value: 'All', label: 'Tất cả các loại' },
    { value: 'car', label: 'Ô tô (Car)' },
    { value: 'suv', label: 'Bán tải / SUV' },
    { value: 'bike', label: 'Xe máy (Bike)' }
  ];

  const locationOptions = [
    { value: 'All', label: 'Tất cả khu vực' },
    ...Array.from(new Set(reservations.map(r => r.parkingLotName).filter(Boolean))).map(loc => ({
      value: loc as string,
      label: loc as string
    }))
  ];

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await parkingService.getParkingSessions();
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

  const handleOpenModal = (row: any) => {
    setSelectedReservation(row);
    setNewEndTime(row.reservationEndTime || '');
    setExtensionError(null);
    setIsModalOpen(true);
  };

  const handleExtend = async () => {
    if (!newEndTime) return;
    setIsExtending(true);
    setExtensionError(null);
    try {
      const response = await parkingService.extendSession(selectedReservation.id,  {
        newEndTime: newEndTime
      });
      
      const updatedSession = response.data?.session || response.data;
      if (updatedSession) {
        setReservations((prev: any[]) => prev.map((r: any) => r.id === selectedReservation.id ? { ...r, ...updatedSession } : r));
        setSelectedReservation((prev: any) => ({ ...prev, ...updatedSession }));
      }
      
      alert('Gia hạn thời gian đỗ xe thành công!');
    } catch (error: any) {
      console.error('Failed to extend session:', error);
      const errMsg = error.response?.data?.message || error.message || 'Gia hạn thất bại';
      setExtensionError(errMsg);
    } finally {
      setIsExtending(false);
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lịch Sử Phiên Đỗ Xe');

    // Add Title
    worksheet.mergeCells('A1:M2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'BÁO CÁO TOÀN DIỆN PHIÊN ĐỖ XE - PMSYSTEM';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF004B58' }
    };

    // Add Timestamp & Stats
    worksheet.mergeCells('A3:M3');
    const timeCell = worksheet.getCell('A3');
    timeCell.value = `Ngày xuất: ${new Date().toLocaleString('vi-VN')}  |  Tổng số bản ghi: ${filteredReservations.length.toLocaleString('vi-VN')}`;
    timeCell.font = { name: 'Arial', size: 11, italic: true, bold: true, color: { argb: 'FF475569' } };
    timeCell.alignment = { horizontal: 'right', vertical: 'middle' };

    worksheet.addRow([]); // Blank row

    // Headers
    const headers = [
      'STT', 'Mã QR / Đặt chỗ', 'Khách hàng', 'Thông tin liên hệ',
      'Biển số (Vào)', 'Biển số (Ra)', 'Loại xe',
      'Tòa nhà & Vị trí', 'Giờ đặt', 'Giờ vào', 'Giờ ra',
      'Trạng thái', 'Thành tiền (VND)'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // slate-900
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      };
    });

    // Add Data
    let totalRevenue = 0;

    filteredReservations.forEach((r, index) => {
      const userName = r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || ('Khách hàng') : ('Khách vãng lai');
      const contactInfo = r.user ? [r.user.email, r.user.phoneNumber].filter(Boolean).join(' - ') : '—';
      
      let statusLabel = 'Đang đỗ';
      let statusColor = 'FF10B981'; // emerald-500
      if (r.status === 'Cancelled') { statusLabel = 'Đã hủy'; statusColor = 'FFEF4444'; } // red-500
      else if (r.status === 'Completed') { statusLabel = 'Hoàn tất'; statusColor = 'FF64748B'; } // slate-500
      else if (!r.isCheckedIn) { statusLabel = 'Chờ vào'; statusColor = 'FFF59E0B'; } // amber-500

      const formatTime = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleString('vi-VN') : '--:--';
      
      const bookTime = r.userId ? formatTime(r.createdAt || r.entryTime) : ('Không có (khách vãng lai)');
      const entryTime = r.isCheckedIn || !r.userId ? formatTime(r.entryTime) : ('Chưa vào bãi');
      const exitTime = formatTime(r.exitTime);
      
      const location = `${r.parkingLotName || ('Chưa phân bổ')} - Slot ${r.parkingSlot || 'Auto'}`;
      const plateIn = r.licensePlate || '—';
      const plateOut = r.exitLicensePlate || '--';
      const fee = r.totalFee || 0;
      totalRevenue += fee;
      
      const row = worksheet.addRow([
        index + 1,
        r.qrCode || `#${r.id?.substring(0, 8).toUpperCase()}`,
        userName,
        contactInfo,
        plateIn,
        plateOut,
        r.vehicleType || ('Không rõ'),
        location,
        bookTime,
        entryTime,
        exitTime,
        statusLabel,
        fee
      ]);

      // Zebra styling & Borders
      const isEven = index % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' } // white or slate-50
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, // slate-200
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
        
        // Centering specific columns
        if ([1, 2, 5, 6, 7, 12, 13].includes(colNumber)) cell.alignment.horizontal = 'center';
        
        // Status color formatting
        if (colNumber === 12) {
          cell.font = { bold: true, color: { argb: statusColor } };
        }
        // Currency formatting
        if (colNumber === 13) {
          cell.numFmt = '#,##0" ₫"';
          cell.font = { bold: true, color: { argb: 'FF0284C7' } }; // sky-600
        }
      });
    });

    // Add Total Row
    worksheet.addRow([]); // Blank
    const totalRow = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', 'TỔNG DOANH THU:', totalRevenue]);
    totalRow.height = 30;
    
    totalRow.getCell(12).font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };
    totalRow.getCell(12).alignment = { vertical: 'middle', horizontal: 'right' };
    
    totalRow.getCell(13).font = { bold: true, size: 14, color: { argb: 'FF0284C7' } };
    totalRow.getCell(13).numFmt = '#,##0" ₫"';
    totalRow.getCell(13).alignment = { vertical: 'middle', horizontal: 'center' };
    totalRow.getCell(13).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    totalRow.getCell(13).border = { 
       top: { style: 'medium', color: { argb: 'FF94A3B8' } },
       bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
    };

    // Set Column Widths
    worksheet.columns = [
      { width: 6 },  // STT
      { width: 16 }, // QR
      { width: 22 }, // Khách hàng
      { width: 25 }, // Liên hệ
      { width: 14 }, // Biển số vào
      { width: 14 }, // Biển số ra
      { width: 12 }, // Loại xe
      { width: 32 }, // Vị trí
      { width: 20 }, // Giờ đặt
      { width: 20 }, // Giờ vào
      { width: 20 }, // Giờ ra
      { width: 16 }, // Trạng thái
      { width: 22 }  // Thành tiền
    ];

    // Generate File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PMSystem_BaoCaoToanDien_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReservations = reservations.filter(r => {
    // Search Filter
    let matchSearch = true;
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const qr = (r.qrCode || '').toLowerCase();
      const id = (r.id || '').substring(0, 8).toLowerCase();
      const plate = (r.licensePlate || '').toLowerCase();
      const exitPlate = (r.exitLicensePlate || '').toLowerCase();
      const userName = r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim().toLowerCase() : 'khách vãng lai';
      const email = (r.user?.email || '').toLowerCase();
      const phone = (r.user?.phoneNumber || '').toLowerCase();
      const location = (r.parkingLotName || '').toLowerCase();
      const vehicle = (r.vehicleType || '').toLowerCase();
      
      matchSearch = qr.includes(term) 
                 || id.includes(term)
                 || plate.includes(term) 
                 || exitPlate.includes(term)
                 || userName.includes(term)
                 || email.includes(term)
                 || phone.includes(term)
                 || location.includes(term)
                 || vehicle.includes(term);
    }
    
    // Status Filter
    let matchStatus = true;
    if (statusFilter !== 'All') {
       if (statusFilter === 'Completed') matchStatus = r.status === 'Completed';
       else if (statusFilter === 'Cancelled') matchStatus = r.status === 'Cancelled';
       else if (statusFilter === 'Waiting') matchStatus = r.status !== 'Completed' && r.status !== 'Cancelled' && !r.isCheckedIn;
       else if (statusFilter === 'Parking') matchStatus = r.status !== 'Completed' && r.status !== 'Cancelled' && r.isCheckedIn;
    }

    // Vehicle Filter
    let matchVehicle = true;
    if (vehicleFilter !== 'All') {
       const vType = (r.vehicleType || '').toLowerCase();
       if (vehicleFilter === 'car') matchVehicle = vType === 'car';
       else if (vehicleFilter === 'bike') matchVehicle = vType === 'bike';
       else if (vehicleFilter === 'suv') matchVehicle = vType === 'suv';
    }

    // Location Filter
    let matchLocation = true;
    if (locationFilter !== 'All') {
       matchLocation = r.parkingLotName === locationFilter;
    }

    return matchSearch && matchStatus && matchVehicle && matchLocation;
  });

  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / ITEMS_PER_PAGE));
  const currentReservations = filteredReservations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredReservations.length);

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

  const getVehicleTypeLabel = (vType?: string) => {
    if (!vType) return 'Không rõ';
    const typeLower = vType.toLowerCase();
    if (typeLower === 'car') return 'Ô tô';
    if (typeLower === 'suv') return 'Bán tải';
    if (typeLower === 'bike' || typeLower === 'motorbike') return 'Xe máy';
    return vType;
  };

  return (
    <AdminLayout>
          {/* Page Content */}
            <div className="p-8 md:p-10 space-y-8 min-h-screen">
              <div className="flex flex-col gap-1.5 mb-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {'Quản lý Giao Dịch Đặt Xe'}
                </h1>
                <p className="text-sm font-semibold text-slate-500">
                  {'Giám sát và phân tích toàn bộ lượt ra vào bãi đỗ xe theo thời gian thực.'}
                </p>
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
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col relative z-20">
                <div className="p-6 md:p-8 border-b border-slate-100/50 flex flex-col md:flex-row justify-between items-center gap-6 relative z-50 rounded-t-[24px]">
                  <div className="relative w-full md:w-[400px] group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input 
                      className="w-full bg-slate-50/50 border border-slate-200/60 rounded-full pl-12 pr-6 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
                      placeholder={"Tìm theo mã vé, biển số, SĐT, email, vị trí..."}
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                     <div className="relative flex-1 md:flex-none">
                       <button 
                         onClick={() => setIsFilterOpen(!isFilterOpen)}
                         className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 border rounded-full text-sm font-bold transition-all shadow-sm ${isFilterOpen || statusFilter !== 'All' || vehicleFilter !== 'All' || locationFilter !== 'All' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'}`}>
                          <div className="relative flex items-center justify-center">
                             <Filter className="w-4 h-4" />
                             {(statusFilter !== 'All' || vehicleFilter !== 'All' || locationFilter !== 'All') && (
                               <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 ${isFilterOpen || statusFilter !== 'All' || vehicleFilter !== 'All' || locationFilter !== 'All' ? 'border-blue-50' : 'border-white'}`}></span>
                             )}
                          </div>
                          {'Bộ lọc'}
                       </button>
                       
                       {isFilterOpen && (
                         <div className="absolute right-0 md:right-auto md:left-0 top-full mt-3 w-[300px] bg-white rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 p-6 z-[60] animate-in fade-in slide-in-from-top-4 duration-300 origin-top-left">
                            <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-4">
                               <h4 className="text-sm font-black text-slate-900 tracking-tight">{'Bộ lọc dữ liệu'}</h4>
                               {(statusFilter !== 'All' || vehicleFilter !== 'All' || locationFilter !== 'All') && (
                                 <button 
                                   onClick={() => { setStatusFilter('All'); setVehicleFilter('All'); setLocationFilter('All'); setCurrentPage(1); }}
                                   className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors active:scale-95"
                                 >
                                   {'Xóa lọc'}
                                 </button>
                               )}
                            </div>
                            <div className="space-y-5 text-left">
                               <div className="space-y-2 relative">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{'Trạng thái'}</label>
                                   <div className="relative">
                                    <div 
                                      onClick={() => { setIsStatusDropdownOpen(!isStatusDropdownOpen); setIsVehicleDropdownOpen(false); setIsLocationDropdownOpen(false); }}
                                      className={`w-full bg-slate-50/50 border ${isStatusDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200/80'} rounded-2xl pl-4 pr-4 py-3.5 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between`}
                                    >
                                       <span>{statusOptions.find(o => o.value === statusFilter)?.label}</span>
                                       <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                                    </div>
                                    
                                    {isStatusDropdownOpen && (
                                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] overflow-hidden z-[70] animate-in fade-in zoom-in-95 duration-200 origin-top">
                                        {statusOptions.map(option => (
                                          <div 
                                            key={option.value}
                                            onClick={() => { setStatusFilter(option.value); setCurrentPage(1); setIsStatusDropdownOpen(false); }}
                                            className={`px-5 py-3.5 text-sm font-bold cursor-pointer transition-colors ${statusFilter === option.value ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                          >
                                            {option.label}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                               </div>
                               <div className="space-y-2 relative">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{'Loại phương tiện'}</label>
                                  <div className="relative">
                                    <div 
                                      onClick={() => { setIsVehicleDropdownOpen(!isVehicleDropdownOpen); setIsStatusDropdownOpen(false); setIsLocationDropdownOpen(false); }}
                                      className={`w-full bg-slate-50/50 border ${isVehicleDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200/80'} rounded-2xl pl-4 pr-4 py-3.5 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between`}
                                    >
                                       <span>{vehicleOptions.find(o => o.value === vehicleFilter)?.label}</span>
                                       <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isVehicleDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                                    </div>
                                    
                                    {isVehicleDropdownOpen && (
                                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] overflow-hidden z-[70] animate-in fade-in zoom-in-95 duration-200 origin-top">
                                        {vehicleOptions.map(option => (
                                          <div 
                                            key={option.value}
                                            onClick={() => { setVehicleFilter(option.value); setCurrentPage(1); setIsVehicleDropdownOpen(false); }}
                                            className={`px-5 py-3.5 text-sm font-bold cursor-pointer transition-colors ${vehicleFilter === option.value ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                          >
                                            {option.label}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                               </div>
                               <div className="space-y-2 relative">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{'Khu vực / Tòa nhà'}</label>
                                  <div className="relative">
                                    <div 
                                      onClick={() => { setIsLocationDropdownOpen(!isLocationDropdownOpen); setIsStatusDropdownOpen(false); setIsVehicleDropdownOpen(false); }}
                                      className={`w-full bg-slate-50/50 border ${isLocationDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200/80'} rounded-2xl pl-4 pr-4 py-3.5 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between`}
                                    >
                                       <span>{locationOptions.find(o => o.value === locationFilter)?.label || locationFilter}</span>
                                       <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isLocationDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                                    </div>
                                    
                                    {isLocationDropdownOpen && (
                                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] z-[70] max-h-48 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-200 origin-top scrollbar-thin scrollbar-thumb-slate-200">
                                        {locationOptions.map(option => (
                                          <div 
                                            key={option.value}
                                            onClick={() => { setLocationFilter(option.value); setCurrentPage(1); setIsLocationDropdownOpen(false); }}
                                            className={`px-5 py-3.5 text-sm font-bold cursor-pointer transition-colors ${locationFilter === option.value ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                          >
                                            {option.label}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                               </div>
                            </div>
                         </div>
                       )}
                     </div>
                     <button onClick={exportToExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 border border-slate-900 rounded-full text-sm font-bold text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all">
                        <FileDown className="w-4 h-4" />
                        {'Xuất File Excel'}
                     </button>
                  </div>
                </div>
    
                <div className="w-full overflow-x-auto relative z-30">
                  <table className="w-full min-w-[1000px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30">{'Mã QR / Đặt chỗ'}</th>
                        <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30">{'Khách hàng'}</th>
                        <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30">{'Phương tiện & Vị trí'}</th>
                        <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30">{'Giờ Đặt / Vào / Ra'}</th>
                        <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30 text-center">{'Trạng thái'}</th>
                        <th className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/30 text-right">{'Thao tác'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr><td colSpan={6} className="text-center py-10 text-slate-500">{'Đang tải dữ liệu...'}</td></tr>
                      ) : currentReservations.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-10 text-slate-500">{'Không tìm thấy kết quả phù hợp'}</td></tr>
                      ) : currentReservations.map((row, i) => {
                        const userName = row.user ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() || ('Khách hàng') : ('Khách vãng lai');
                        const userInitials = row.user ? getUserInitials({ firstName: row.user.firstName, lastName: row.user.lastName, username: userName } as any) : ('KV');
                        
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
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm ring-1 ring-indigo-100/50 overflow-hidden">
                                {row.user?.avatarUrl && row.user.avatarUrl !== 'null' && row.user.avatarUrl !== 'undefined' ? (
                                  <img src={row.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  userInitials
                                )}
                              </div>
                              <span className="text-sm font-semibold text-slate-800">{userName}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2 mb-1.5">
                               <span className="text-sm font-black text-slate-900 font-mono tracking-wide">{row.licensePlate || '—'}</span>
                               <span className="text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50">{getVehicleTypeLabel(row.vehicleType)}</span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                               {row.parkingLotName || ('Chưa phân bổ')} <span className="text-slate-300">•</span> Slot {row.parkingSlot || 'Auto'}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex flex-col gap-1.5">
                                {row.reservationStartTime && row.reservationEndTime && (
                                  <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-2" title={"Khung giờ đặt trước"}>
                                     <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div> {'Khung giờ:'} {row.reservationStartTime} - {row.reservationEndTime} ({row.reservationDate})
                                  </span>
                                )}
                                {row.userId && (
                                  <span className="text-[11px] font-bold text-blue-600 flex items-center gap-2" title={"Giờ đặt chỗ"}>
                                     <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> {'Đặt:'} {formatTime(row.createdAt || row.entryTime)}
                                  </span>
                                )}
                                <span className={`text-[11px] font-bold flex items-center gap-2 ${row.isCheckedIn || !row.userId ? 'text-slate-900' : 'text-slate-400 italic'}`} title={"Giờ vào"}>
                                   <div className={`w-1.5 h-1.5 rounded-full ${row.isCheckedIn || !row.userId ? 'bg-emerald-500' : 'bg-slate-300'}`}></div> 
                                   {'Vào:'} {row.isCheckedIn || !row.userId ? formatTime(row.entryTime) : ('Chưa vào')}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2" title={"Giờ ra"}>
                                   <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div> {'Ra:'} {formatTime(row.exitTime)}
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
                                onClick={() => handleOpenModal(row)}
                                className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-blue-600 border border-transparent hover:border-slate-200" title={"Xem chi tiết"}>
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleOpenModal(row)}
                                className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 border border-transparent hover:border-slate-200" title={"Chỉnh sửa"}>
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
                
                <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between rounded-b-3xl">
                  <span className="text-xs font-bold text-slate-400">
                    {'Hiển thị'} {filteredReservations.length > 0 ? startIndex : 0}-{endIndex} {'của'} {filteredReservations.length.toLocaleString('vi-VN')} {'đặt chỗ'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 transition-all">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {(() => {
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, currentPage + 2);
                      if (endPage - startPage < 4) {
                        if (startPage === 1) endPage = Math.min(totalPages, 5);
                        else if (endPage === totalPages) startPage = Math.max(1, totalPages - 4);
                      }
                      const pages = [];
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }
                      return pages.map(page => (
                        <button 
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-lg font-black text-xs transition-all ${
                            currentPage === page 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                              : 'hover:bg-white text-slate-400'
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 transition-all">
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
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                          {'Chi Tiết Phiên Đỗ Xe'}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          {'Thông tin vé & hình ảnh phương tiện'}
                        </p>
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
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{'Mã QR'}</p>
                          <p className="text-sm font-bold text-slate-800 font-mono bg-slate-50 border border-slate-200/60 inline-block px-3 py-1.5 rounded-xl shadow-sm">{selectedReservation.qrCode || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{'Khách Hàng'}</p>
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 font-bold text-xs shadow-sm ring-1 ring-blue-100/50 overflow-hidden">
                                {selectedReservation.user?.avatarUrl && selectedReservation.user.avatarUrl !== 'null' && selectedReservation.user.avatarUrl !== 'undefined' ? (
                                  <img src={selectedReservation.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  getUserInitials({ firstName: selectedReservation.user?.firstName, lastName: selectedReservation.user?.lastName, username: selectedReservation.user?.firstName ? `${selectedReservation.user?.firstName} ${selectedReservation.user?.lastName}` : ('Khách vãng lai') } as any)
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {selectedReservation.user ? `${selectedReservation.user.firstName || ''} ${selectedReservation.user.lastName || ''}`.trim() || ('Khách hàng') : ('Khách vãng lai')}
                                </p>
                                {selectedReservation.user?.email && <p className="text-xs font-semibold text-slate-500">{selectedReservation.user.email}</p>}
                             </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">{'Phương Tiện'}</p>
                            <p className="text-base font-black text-slate-900 font-mono">{selectedReservation.licensePlate}</p>
                            <p className="text-[11px] font-bold text-slate-500">{getVehicleTypeLabel(selectedReservation.vehicleType)}</p>
                          </div>
                          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">{'Vị Trí Đỗ'}</p>
                            <p className="text-sm font-bold text-slate-900">{selectedReservation.parkingLotName || '—'}</p>
                            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Chỗ: {selectedReservation.parkingSlot || '—'}</p>
                          </div>
                        </div>
                        <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3.5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-50 pb-2.5">{'Hành Trình Thời Gian'}</p>
                          {selectedReservation.reservationStartTime && selectedReservation.reservationEndTime && (
                             <div className="flex items-center justify-between border-b border-slate-50/50 pb-2">
                                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div> {'Khung giờ đặt'}</span>
                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{selectedReservation.reservationStartTime} - {selectedReservation.reservationEndTime} ({selectedReservation.reservationDate})</span>
                             </div>
                          )}
                          {selectedReservation.userId && (
                             <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> {'Đặt chỗ'}</span>
                                <span className="text-xs font-bold text-blue-600">{formatTime(selectedReservation.createdAt || selectedReservation.entryTime)}</span>
                             </div>
                          )}
                          <div className="flex items-center justify-between">
                             <span className="text-[11px] font-bold text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> {'Vào bãi'}</span>
                             <span className="text-xs font-bold text-slate-900">{selectedReservation.isCheckedIn || !selectedReservation.userId ? formatTime(selectedReservation.entryTime) : <span className="italic text-slate-400">{'Chưa vào bãi'}</span>}</span>
                          </div>
                          <div className="flex items-center justify-between">
                             <span className="text-[11px] font-bold text-slate-500 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div> {'Ra bãi'}</span>
                             <span className="text-xs font-bold text-slate-900">{selectedReservation.exitTime ? formatTime(selectedReservation.exitTime) : <span className="italic text-slate-400">{'Chưa ra bãi'}</span>}</span>
                          </div>
                        </div>
    
                        {selectedReservation.reservationEndTime && !selectedReservation.exitTime && (
                          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              {'Gia Hạn Khung Giờ Đặt'}
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="relative flex-1">
                                <input
                                  type="time"
                                  value={newEndTime}
                                  onChange={(e) => setNewEndTime(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all shadow-sm"
                                />
                              </div>
                              <button
                                type="button"
                                disabled={isExtending || newEndTime === selectedReservation.reservationEndTime}
                                onClick={handleExtend}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider shrink-0"
                              >
                                {isExtending ? ('Đang lưu...') : ('Gia hạn')}
                              </button>
                            </div>
                            {extensionError && (
                              <p className="text-[10px] font-bold text-red-500 pl-1">{extensionError}</p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-indigo-50 border border-indigo-100/50 shadow-sm">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">{'Thành Tiền'}</p>
                          <p className="text-2xl font-black text-indigo-600 tracking-tight">{selectedReservation.totalFee ? selectedReservation.totalFee.toLocaleString() + ' ₫' : ('Đang tính...')}</p>
                        </div>
                      </div>
                      
                      {/* Cột Phải: Hình ảnh Camera */}
                      <div className="space-y-6">
                        <div className="bg-slate-50/30 p-5 rounded-3xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div> {'CAMERA CỔNG VÀO'}</p>
                          {selectedReservation.entryPhoto ? (
                            <div className="p-1.5 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                               <img src={selectedReservation.entryPhoto} alt="Entry" className="w-full h-44 object-cover rounded-xl hover:scale-[1.02] transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="w-full h-44 bg-slate-100/80 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                               <Camera className="w-6 h-6 opacity-50" />
                               <span className="text-xs font-semibold">{'Chưa có ảnh chụp vào'}</span>
                            </div>
                          )}
                        </div>
                        <div className="bg-slate-50/30 p-5 rounded-3xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div> {'CAMERA CỔNG RA'}</p>
                          {selectedReservation.exitPhoto ? (
                            <div className="p-1.5 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                               <img src={selectedReservation.exitPhoto} alt="Exit" className="w-full h-44 object-cover rounded-xl hover:scale-[1.02] transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="w-full h-44 bg-slate-100/80 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                               <Camera className="w-6 h-6 opacity-50" />
                               <span className="text-xs font-semibold">{'Chưa có ảnh chụp ra'}</span>
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
