import { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  TrendingUp, 
  Car, 
  AlertCircle,
  ChevronDown,
  MapPin,
  Plus,
  Trash2,
  Globe,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../services/api';

const AdminDashboard = () => {

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // State for Managing Parking Lots (Branches & Maps)
  const [parkingLots, setParkingLots] = useState<any[]>([]);

  const fetchParkingLots = async () => {
    try {
      const response = await api.get('/ParkingLots');
      if (response.data && Array.isArray(response.data)) {
        setParkingLots(response.data);
      } else {
        setParkingLots([]);
      }
    } catch (error) {
      console.error('Error fetching parking lots:', error);
      setParkingLots([]);
    }
  };

  useEffect(() => {
    fetchParkingLots();
  }, []);

  const [incidents, setIncidents] = useState<any[]>([]);

  const fetchIncidents = async () => {
    try {
      const response = await api.get('/Incidents');
      if (response.data) {
        setIncidents(response.data);
      }
    } catch (error) {
      console.error('Error fetching incidents from db:', error);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleResolveIncident = async (id: string) => {
    try {
      await api.put(`/Incidents/${id}/resolve`);
      await fetchIncidents();
      showToast('Đã đánh dấu sự cố là Đã giải quyết!', 'success');
    } catch (error) {
      console.error('Error resolving incident in db:', error);
      showToast('Lỗi khi đánh dấu giải quyết.', 'error');
    }
  };

  const handleDeleteIncident = async (id: string) => {
    try {
      await api.delete(`/Incidents/${id}`);
      await fetchIncidents();
      showToast('Đã xóa báo cáo sự cố thành công!', 'info');
    } catch (error) {
      console.error('Error deleting incident in db:', error);
      showToast('Lỗi khi xóa báo cáo.', 'error');
    }
  };

  const [newLotAddress, setNewLotAddress] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState('');
  
  // Floor configuration for the new lot
  const [newLotFloors, setNewLotFloors] = useState<number[]>([1, 2, 3]);

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (newLotAddress.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLotAddress)}&limit=5`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setAddressSuggestions(data);
        }
      } catch (e) {
        console.error("Suggestions fetch error:", e);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [newLotAddress]);

  const handleSelectSuggestion = (item: any) => {
    const lat = item.lat;
    const lon = item.lon;
    const fullAddress = item.display_name;

    setNewLotAddress(fullAddress);
    setNewLot(prev => ({
      ...prev,
      latitude: lat,
      longitude: lon
    }));
    
    setSearchFeedback('Đã định vị thành công!');
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  const [newLot, setNewLot] = useState({
    name: '',
    floor: 'Tầng 1',
    block: 'Block A',
    latitude: '10.7717',
    longitude: '106.7044'
  });

  const handleSearchAddress = async () => {
    if (!newLotAddress.trim()) return;
    setIsSearchingLocation(true);
    setSearchFeedback('Đang tìm vị trí...');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLotAddress)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setNewLot(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon
        }));
        setSearchFeedback(`Đã định vị thành công!`);
      } else {
        setSearchFeedback('Không tìm thấy địa điểm. Hãy thử địa chỉ khác.');
      }
    } catch (e) {
      setSearchFeedback('Lỗi kết nối bản đồ. Hãy thử lại.');
      console.error(e);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleAddLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLot.name.trim()) return;

    try {
      await api.post('/ParkingLots', {
        name: newLot.name,
        latitude: newLot.latitude,
        longitude: newLot.longitude,
        floor: newLot.floor,
        block: newLot.block,
        floors: [...newLotFloors]
      });
      await fetchParkingLots();
    } catch (error) {
      console.error('Error adding parking lot:', error);
    }
    
    setNewLot({
      name: '',
      floor: 'Tầng 1',
      block: 'Block A',
      latitude: '10.7717',
      longitude: '106.7044'
    });
    setNewLotAddress('');
    setSearchFeedback('');
    setNewLotFloors([1, 2, 3]);
    showToast('Thêm chi nhánh mới thành công!', 'success');
  };

  const handleDeleteLot = async (id: any) => {
    try {
      await api.delete(`/ParkingLots/${id}`);
      await fetchParkingLots();
      showToast('Đã xóa chi nhánh thành công!', 'info');
    } catch (error) {
      console.error('Error deleting parking lot:', error);
      showToast('Xóa chi nhánh thất bại!', 'error');
    }
  };

  const handleAddFloorToLot = async (id: any) => {
    const lot = parkingLots.find(p => p.id === id);
    if (!lot) return;
    const currentFloors = lot.floors || [1, 2, 3];
    const nextFloor = currentFloors.length ? Math.max(...currentFloors) + 1 : 1;
    const updatedFloors = [...currentFloors, nextFloor];

    try {
      await api.put(`/ParkingLots/${id}`, { ...lot, floors: updatedFloors });
      await fetchParkingLots();
      showToast('Đã thêm tầng mới thành công!', 'success');
    } catch (error) {
      console.error('Error adding floor:', error);
      showToast('Thêm tầng thất bại!', 'error');
    }
  };

  const handleRemoveFloorFromLot = async (id: any, floorToRemove: number) => {
    const lot = parkingLots.find(p => p.id === id);
    if (!lot) return;
    const currentFloors = lot.floors || [1, 2, 3];
    const updatedFloors = currentFloors.filter((f: number) => f !== floorToRemove);

    try {
      await api.put(`/ParkingLots/${id}`, { ...lot, floors: updatedFloors });
      await fetchParkingLots();
      showToast('Đã xóa tầng thành công!', 'info');
    } catch (error) {
      console.error('Error removing floor:', error);
      showToast('Xóa tầng thất bại!', 'error');
    }
  };

  // Helper to get short Vietnamese weekday name
  const getVNWeekday = (date: Date) => {
    const day = date.getDay();
    if (day === 0) return 'CN';
    return `T${day + 1}`;
  };

  // Calculate daily revenue for the last 7 days from sessions
  const getLast7DaysRevenue = () => {
    const days: any[] = [];
    
    // Initialize array for the last 7 days (oldest to newest, today is index 6)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      days.push({
        dateLabel: dateStr,
        dayName: getVNWeekday(d),
        dateKey: d.toDateString(),
        revenue: 0,
        isToday: i === 0
      });
    }

    // Accumulate revenue from sessions
    sessions.forEach(s => {
      if (s.totalFee && s.totalFee > 0) {
        const refTime = s.exitTime || s.endTime || s.startTime || s.createdAt;
        if (refTime) {
          const sessionDate = new Date(refTime);
          const dateKey = sessionDate.toDateString();
          
          const dayObj = days.find(d => d.dateKey === dateKey);
          if (dayObj) {
            dayObj.revenue += s.totalFee;
          }
        }
      }
    });

    return days;
  };

  const last7DaysData = getLast7DaysRevenue();
  const maxRevenue = Math.max(...last7DaysData.map(d => d.revenue), 1000); // Prevent division by zero

  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K';
    return amount.toString();
  };

  const metrics = [
    { label: 'TỔNG DOANH THU', value: loading ? '...' : formatRevenue(totalRevenue), unit: 'VND', trend: '+12%', icon: TrendingUp, color: 'text-blue-600', sub: 'Toàn thời gian' },
    { label: 'TỶ LỆ LẤP ĐẦY', value: loading ? '...' : occupancyRate, trend: 'Hiện tại', icon: Car, color: 'text-emerald-600', sub: 'Công suất tối ưu' },
    { label: 'ĐẶT CHỖ HOẠT ĐỘNG', value: loading ? '...' : activeBookings.toString(), trend: 'Mới', icon: CalendarDays, color: 'text-blue-500', sub: 'Đang gửi & chờ' },
    { label: 'BÁO CÁO SỰ CỐ', value: incidents.filter(inc => inc.status === 'Chờ xử lý').length.toString().padStart(2, '0'), unit: '', trend: 'KHẨN CẤP', icon: AlertCircle, color: 'text-red-600', sub: `${incidents.filter(inc => inc.status === 'Chờ xử lý').length} sự cố chưa xử lý`, urgent: true },
  ];



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
                className={`bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col relative overflow-hidden group ${m.urgent ? 'ring-2 ring-red-500/20 border-red-100' : ''}`}
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
            <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Xu hướng Doanh Thu</h3>
                  <p className="text-xs text-slate-400 font-bold">Thống kê doanh thu theo tuần (VNĐ)</p>
                </div>
                <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-inner">
                  <button className="text-[11px] font-extrabold px-4 py-1.5 rounded-lg bg-white text-blue-600 shadow-sm border border-slate-200/50 transition-all">7 ngày qua</button>
                  <button className="text-[11px] font-bold px-4 py-1.5 text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5">
                    30 ngày qua
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>
                </div>
              </div>
              
              <div className="h-64 w-full flex items-end gap-3 pb-4">
                {last7DaysData.map((day, i) => {
                  const pct = (day.revenue / maxRevenue) * 100;
                  // If there is revenue, make sure it has a tiny visible height (minimum 4%)
                  const heightPct = day.revenue > 0 ? Math.max(pct, 4) : 0;
                  return (
                    <div 
                      key={i} 
                      className="flex-1 h-full flex flex-col justify-end items-center group relative"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {(hoveredIndex === i || (hoveredIndex === null && day.isToday)) && (
                        <div className="absolute -top-12 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl mb-2 flex items-center gap-2 z-20 whitespace-nowrap pointer-events-none">
                          {day.isToday ? 'Hôm nay' : `${day.dayName} ${day.dateLabel}`}: {day.revenue.toLocaleString('vi-VN')}đ
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                        </div>
                      )}
                      <div className="w-full flex-1 flex items-end min-h-0">
                        <div 
                          className={`w-full rounded-t-xl transition-all duration-500 cursor-pointer ${day.isToday ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'bg-slate-100 hover:bg-slate-200'}`} 
                          style={{ height: `${heightPct}%` }}
                        ></div>
                      </div>
                      <span className={`mt-2 text-[9px] font-black shrink-0 ${day.isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                        {day.isToday ? 'Hôm nay' : day.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Mix Area */}
            <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40">
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

          {/* Branch & Map Management Section */}
          <div className="grid grid-cols-12 gap-8">
            {/* Create Branch Card */}
            <div className="col-span-12 lg:col-span-5 bg-gradient-to-b from-white to-slate-50/80 p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 flex flex-col justify-between relative overflow-hidden">
              {/* Ambient Background Glows */}
              <div className="absolute top-0 left-0 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shadow-inner flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight">Tạo chi nhánh mới</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Thêm chi nhánh bãi đỗ xe bằng tìm kiếm địa chỉ</p>
                  </div>
                </div>
                
                <form onSubmit={handleAddLot} className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Tên chi nhánh</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ví dụ: Landmark 81 - Bãi đỗ A1"
                      className="w-full px-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all shadow-sm"
                      value={newLot.name}
                      onChange={e => setNewLot({...newLot, name: e.target.value})}
                    />
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Địa chỉ / Tìm vị trí</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          placeholder="Nhập địa chỉ để tự động gợi ý..."
                          className="w-full px-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all shadow-sm"
                          value={newLotAddress}
                          onChange={e => {
                            setNewLotAddress(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />

                        {showSuggestions && addressSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 py-1">
                            {addressSuggestions.map((item, index) => {
                              const name = item.display_name.split(',')[0];
                              const details = item.display_name.split(',').slice(1).join(',').trim();
                              
                              return (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleSelectSuggestion(item)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50/50 transition-colors flex items-start gap-2.5 cursor-pointer text-slate-800"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
                                    <p className="text-[10px] font-semibold text-slate-400 truncate">{details}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleSearchAddress}
                        disabled={isSearchingLocation}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[14px]">explore</span>
                        ĐỊNH VỊ
                      </button>
                    </div>
                    
                    {searchFeedback && (
                      <p className={`text-[10px] font-bold mt-1.5 ml-1 ${searchFeedback.includes('thành công') ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {searchFeedback}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Khu vực / Block</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Block A"
                        className="w-full px-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all shadow-sm"
                        value={newLot.block}
                        onChange={e => setNewLot({...newLot, block: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Tầng mặc định</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Tầng 1"
                        className="w-full px-5 py-3 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all shadow-sm"
                        value={newLot.floor}
                        onChange={e => setNewLot({...newLot, floor: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Danh sách Tầng ({newLotFloors.length})</label>
                    <div className="flex flex-wrap items-center gap-2 bg-slate-100/40 border border-slate-200/60 p-3 rounded-2xl min-h-[48px]">
                      {newLotFloors.map(f => (
                        <span key={f} className="inline-flex items-center gap-1.5 bg-white border border-slate-200/80 text-[10px] font-bold text-slate-700 px-3 py-1.5 rounded-full shadow-sm hover:border-slate-350 transition-all">
                          Tầng {f}
                          <button 
                            type="button" 
                            onClick={() => setNewLotFloors(newLotFloors.filter(x => x !== f))}
                            className="w-4 h-4 rounded-full bg-slate-100 hover:bg-rose-500 text-slate-400 hover:text-white flex items-center justify-center font-bold cursor-pointer transition-colors text-[8px]"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const next = newLotFloors.length ? Math.max(...newLotFloors) + 1 : 1;
                          setNewLotFloors([...newLotFloors, next]);
                        }}
                        className="inline-flex items-center gap-1 bg-blue-50/80 hover:bg-blue-600 border border-blue-100/60 text-blue-600 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 shadow-sm"
                      >
                        <Plus className="w-3 h-3" /> Thêm tầng
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-full text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-6 cursor-pointer relative overflow-hidden group btn-premium"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm Chi Nhánh mới
                    <div className="shimmer-effect"></div>
                  </button>
                </form>
              </div>
            </div>
            
            {/* List Existing Branches Card */}
            <div className="col-span-12 lg:col-span-7 bg-gradient-to-b from-white to-slate-50/80 p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 flex flex-col relative overflow-hidden">
              {/* Ambient Background Glows */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50 shadow-inner flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight">Danh sách chi nhánh hiện có</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Thêm/xóa tầng hoặc xóa chi nhánh trực tiếp trên danh sách</p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[420px] pr-2 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {parkingLots.map((lot, idx) => (
                    <div 
                      key={lot.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-blue-200/80 bg-white hover:bg-blue-50/5 transition-all duration-300 group gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 relative z-10"
                    >
                      <div className="flex items-start gap-4.5 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm relative group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse z-10"></span>
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-slate-800 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">{lot.name}</p>
                          
                          {/* Floor config section */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 shrink-0">
                              <Layers className="w-3.5 h-3.5 text-slate-400" /> Tầng:
                            </span>
                            {(lot.floors || [1, 2, 3]).map((f: number) => (
                              <span key={f} className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 px-2.5 py-1 rounded-full hover:border-slate-300 transition-all">
                                Tầng {f}
                                <button
                                  onClick={() => handleRemoveFloorFromLot(lot.id, f)}
                                  className="w-4 h-4 rounded-full bg-slate-200/70 hover:bg-rose-500 hover:text-white flex items-center justify-center cursor-pointer transition-colors text-[8px] font-bold ml-1"
                                  title="Xóa tầng này"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                            <button
                              onClick={() => handleAddFloorToLot(lot.id)}
                              className="inline-flex items-center gap-1 bg-blue-50/50 border border-blue-100/50 hover:bg-blue-600 hover:text-white text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all duration-200"
                              title="Thêm tầng"
                            >
                              <Plus className="w-3 h-3" /> Thêm tầng
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400 mt-3 border-t border-slate-100/80 pt-2.5">
                            <span className="flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors">
                              <Globe className="w-3.5 h-3.5 text-blue-500/80" /> 
                              {parseFloat(lot.latitude || '0').toFixed(4)}, {parseFloat(lot.longitude || '0').toFixed(4)}
                            </span>
                            <span className="text-slate-200">•</span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <Layers className="w-3.5 h-3.5 text-indigo-500/85" /> 
                              {lot.block}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteLot(lot.id)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer sm:self-center self-end shadow-sm hover:shadow-md"
                        title="Xóa chi nhánh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Incident Reports Table */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 mt-8">
             <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="text-lg font-black text-slate-900 tracking-tight">Sự cố hệ thống cần xử lý</h3>
                   <p className="text-xs text-slate-400 font-bold mt-1">Danh sách các báo cáo từ khách hàng & nhân viên trực ban</p>
                </div>
                <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-4 py-2 rounded-full">
                   {incidents.filter(inc => inc.status === 'Chờ xử lý').length} Chưa xử lý
                </span>
             </div>
             
             {incidents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold text-xs">
                   Chưa ghi nhận sự cố nào trong hệ thống.
                </div>
             ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-slate-100">
                         <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã sự cố</th>
                         <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại & Tiêu đề</th>
                         <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vị trí</th>
                         <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người báo cáo</th>
                         <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ khẩn cấp</th>
                         <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                         <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {incidents.map((inc) => (
                         <tr key={inc.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                           <td className="py-5 text-xs font-black text-slate-500">
                             {inc.id.startsWith('#') ? inc.id : '#INC-' + inc.id.substring(0, 4).toUpperCase()}
                           </td>
                           <td className="py-5 max-w-xs">
                             <div className="min-w-0">
                               <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase mb-1.5 ${
                                 inc.type === 'Thiết bị hỏng' ? 'bg-red-50 text-red-600' :
                                 inc.type === 'Lỗi thanh toán' ? 'bg-amber-50 text-amber-600' :
                                 inc.type === 'Xe đỗ sai vị trí' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                               }`}>
                                 {inc.type}
                               </span>
                               <p className="text-xs font-bold text-slate-900 leading-snug">{inc.title}</p>
                               <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">{inc.description}</p>
                             </div>
                           </td>
                           <td className="py-5">
                             <div className="text-xs font-bold text-slate-800">{inc.branch}</div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{inc.floor}</div>
                           </td>
                           <td className="py-5">
                             <div className="text-xs font-bold text-slate-900">{inc.reporter}</div>
                             <div className="text-[9px] text-slate-400 font-black uppercase">{inc.role}</div>
                           </td>
                           <td className="py-5">
                             <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                               inc.urgency === 'Khẩn cấp' ? 'bg-rose-100 text-rose-600 animate-pulse' :
                               inc.urgency === 'Cao' ? 'bg-amber-100 text-amber-600' :
                               'bg-slate-100 text-slate-600'
                             }`}>
                               {inc.urgency}
                             </span>
                           </td>
                           <td className="py-5">
                             <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                               inc.status === 'Đã xử lý' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                             }`}>
                               {inc.status}
                             </span>
                           </td>
                           <td className="py-5 text-right">
                             <div className="flex items-center justify-end gap-2">
                               {inc.status === 'Chờ xử lý' && (
                                 <button
                                   onClick={() => handleResolveIncident(inc.id)}
                                   className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                                 >
                                   Giải quyết
                                 </button>
                               )}
                               <button
                                 onClick={() => handleDeleteIncident(inc.id)}
                                 className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-colors cursor-pointer"
                                 title="Xóa báo cáo"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
             )}
          </div>
          

        </div>

        {/* Custom Floating Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-500/10'
                  : toastMessage.type === 'error'
                  ? 'bg-rose-500/90 text-white border-rose-400/50 shadow-rose-500/10'
                  : 'bg-slate-900/90 text-white border-slate-700/50 shadow-slate-900/10'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-black text-xs shrink-0">✓</div>
              ) : toastMessage.type === 'error' ? (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-black text-xs shrink-0">✕</div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-black text-xs shrink-0">i</div>
              )}
              <span className="text-xs font-black tracking-wide uppercase">{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminDashboard;
