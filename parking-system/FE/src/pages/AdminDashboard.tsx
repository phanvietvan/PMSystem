import { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  TrendingUp, 
  Car, 
  AlertCircle,
  ChevronDown,
  MapPin,
  Clock,
  Building,
  ArrowRight,
  Shield,
  CircleAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../services/api';
import { useAdminUser } from '../hooks/useAdminUser';
import { getUserDisplayName, parseLicensePlate } from '../utils/auth';
import { useSettings } from '../hooks/useSettings.tsx';

const AdminDashboard = () => {
  const user = useAdminUser();
  const { t, language } = useSettings();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'en' ? '☀️ Good morning' : '☀️ Chào buổi sáng';
    if (hour < 18) return language === 'en' ? '🌤️ Good afternoon' : '🌤️ Chào buổi chiều';
    return language === 'en' ? '🌙 Good evening' : '🌙 Chào buổi tối';
  };

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
    { label: t('totalRevenue'), value: loading ? '...' : formatRevenue(totalRevenue), unit: 'VND', trend: '+12%', icon: TrendingUp, color: 'text-blue-600', sub: language === 'en' ? 'All time' : 'Toàn thời gian' },
    { label: language === 'en' ? 'OCCUPANCY RATE' : 'TỶ LỆ LẤP ĐẦY', value: loading ? '...' : occupancyRate, trend: language === 'en' ? 'Current' : 'Hiện tại', icon: Car, color: 'text-emerald-600', sub: language === 'en' ? 'Optimal capacity' : 'Công suất tối ưu' },
    { label: t('activeSessions'), value: loading ? '...' : activeBookings.toString(), trend: language === 'en' ? 'New' : 'Mới', icon: CalendarDays, color: 'text-blue-500', sub: language === 'en' ? 'Parked & waiting' : 'Đang gửi & chờ' },
    { label: language === 'en' ? 'INCIDENT REPORTS' : 'BÁO CÁO SỰ CỐ', value: incidents.filter(inc => inc.status === 'Chờ xử lý').length.toString().padStart(2, '0'), unit: '', trend: language === 'en' ? 'URGENT' : 'KHẨN CẤP', icon: AlertCircle, color: 'text-red-600', sub: `${incidents.filter(inc => inc.status === 'Chờ xử lý').length} ${language === 'en' ? 'unresolved incidents' : 'sự cố chưa xử lý'}`, urgent: true },
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
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">{getUserDisplayName(user)}</span></h2>
              <p className="text-sm text-slate-500 font-medium">{language === 'en' ? `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.` : `Dưới đây là hiệu suất vận hành bãi đỗ xe của bạn hôm nay, ${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`}</p>
            </div>
            <Link 
              to="/admin/settings?tab=parking"
              className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-6 rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              {language === 'en' ? 'EDIT PRICING' : 'CHỈNH SỬA BẢNG GIÁ'}
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
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{language === 'en' ? 'Revenue Trend' : 'Xu hướng Doanh Thu'}</h3>
                  <p className="text-xs text-slate-400 font-bold">{language === 'en' ? 'Weekly revenue statistics (VND)' : 'Thống kê doanh thu theo tuần (VNĐ)'}</p>
                </div>
                <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-inner">
                  <button className="text-[11px] font-extrabold px-4 py-1.5 rounded-lg bg-white text-blue-600 shadow-sm border border-slate-200/50 transition-all">{language === 'en' ? 'Last 7 days' : '7 ngày qua'}</button>
                  <button className="text-[11px] font-bold px-4 py-1.5 text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5">
                    {language === 'en' ? 'Last 30 days' : '30 ngày qua'}
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
                          {day.isToday ? (language === 'en' ? 'Today' : 'Hôm nay') : `${day.dayName} ${day.dateLabel}`}: {day.revenue.toLocaleString('vi-VN')}đ
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
                        {day.isToday ? (language === 'en' ? 'Today' : 'Hôm nay') : day.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Mix Area */}
            <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40">
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">{language === 'en' ? 'Vehicle Mix' : 'Cơ cấu Phương Tiện'}</h3>
              <p className="text-xs text-slate-400 font-bold mb-10">{language === 'en' ? 'Traffic distribution by vehicle type' : 'Phân bổ lưu lượng theo loại xe'}</p>
              
              <div className="relative h-56 flex items-center justify-center mb-10">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="24" fill="transparent" className="text-slate-50" />
                  <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="24" fill="transparent" strokeDasharray={`${2*Math.PI*80}`} strokeDashoffset={`${2*Math.PI*80*(1-carPercentage/100)}`} className="text-blue-600" />
                  <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="24" fill="transparent" strokeDasharray={`${2*Math.PI*80}`} strokeDashoffset={-2*Math.PI*80*(carPercentage/100)} className="text-emerald-500" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-900">{totalMix}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'en' ? 'TOTAL TRIPS' : 'TỔNG LƯỢT'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-xs font-bold text-slate-600">{language === 'en' ? 'Sedan (4-7 seats)' : 'Ô tô (4-7 chỗ)'}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{carPercentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs font-bold text-slate-600">{language === 'en' ? 'SUV / Pickup' : 'SUV / Bán tải'}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{suvPercentage}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parking Lots Overview */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{language === 'en' ? 'Parking Lot Overview' : 'Tổng quan Bãi đỗ'}</h3>
                <p className="text-xs text-slate-400 font-bold">{language === 'en' ? 'Occupancy rate by branch' : 'Mức lấp đầy theo từng chi nhánh'}</p>
              </div>
              <Link to="/admin/monitoring" className="text-[11px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors uppercase tracking-wider">
                {language === 'en' ? 'View map' : 'Xem bản đồ'} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-5">
              {parkingLots.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6 font-medium">{language === 'en' ? 'No parking lots have been set up yet.' : 'Chưa có bãi đỗ nào được thiết lập.'}</p>
              )}
              {parkingLots.map((lot: any) => {
                const lotSessions = sessions.filter(s => s.parkingLotName === lot.name && s.status === 'Active');
                const occupied = lotSessions.filter((s: any) => s.isCheckedIn).length;
                const reserved = lotSessions.filter((s: any) => !s.isCheckedIn).length;
                const total = occupied + reserved;
                const capacity = lot.capacity || 24;
                const pct = Math.min(Math.round((total / capacity) * 100), 100);
                const barColor = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500';
                const barBg = pct > 85 ? 'bg-red-50' : pct > 60 ? 'bg-amber-50' : 'bg-emerald-50';

                return (
                  <div key={lot.id} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-xl text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-tight">{lot.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{lot.floor} · {lot.block}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">{total}</span>
                        <span className="text-xs text-slate-400 font-medium"> / {capacity}</span>
                        <p className="text-[10px] font-bold text-slate-400">{occupied} {language === 'en' ? 'parked' : 'đỗ'} · {reserved} {language === 'en' ? 'reserved' : 'đặt'}</p>
                      </div>
                    </div>
                    <div className={`w-full h-2.5 ${barBg} rounded-full overflow-hidden`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full ${barColor} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Grid: Recent Activity + Pending Incidents */}
          <div className="grid grid-cols-12 gap-8">
            {/* Recent Activity */}
            <div className="col-span-12 lg:col-span-7 bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{t('recentActivity')}</h3>
                  <p className="text-xs text-slate-400 font-bold">{language === 'en' ? 'Latest parking sessions in the system' : 'Các phiên đỗ xe mới nhất trong hệ thống'}</p>
                </div>
                <Link to="/admin/reservations" className="text-[11px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors uppercase tracking-wider">
                  {language === 'en' ? 'View all' : 'Tất cả'} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-1">
                {sessions.length === 0 && !loading && (
                  <p className="text-sm text-slate-400 text-center py-8 font-medium">{language === 'en' ? 'No activity yet.' : 'Chưa có hoạt động nào.'}</p>
                )}
                {[...sessions]
                  .sort((a, b) => new Date(b.createdAt || b.startTime || 0).getTime() - new Date(a.createdAt || a.startTime || 0).getTime())
                  .slice(0, 6)
                  .map((s: any, i: number) => {
                    const timeStr = s.createdAt || s.startTime;
                    const timeAgo = timeStr ? (() => {
                      const diff = Math.floor((Date.now() - new Date(timeStr).getTime()) / 60000);
                      if (diff < 1) return language === 'en' ? 'Just now' : 'Vừa xong';
                      if (diff < 60) return language === 'en' ? `${diff} min ago` : `${diff} phút trước`;
                      if (diff < 1440) return language === 'en' ? `${Math.floor(diff / 60)} hr ago` : `${Math.floor(diff / 60)} giờ trước`;
                      return language === 'en' ? `${Math.floor(diff / 1440)} days ago` : `${Math.floor(diff / 1440)} ngày trước`;
                    })() : '';

                    return (
                      <motion.div 
                        key={s.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50/80 transition-colors group"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          s.status === 'Active' && s.isCheckedIn ? 'bg-emerald-50 text-emerald-600' :
                          s.status === 'Active' ? 'bg-blue-50 text-blue-600' :
                          s.status === 'Completed' ? 'bg-slate-100 text-slate-500' :
                          'bg-red-50 text-red-500'
                        }`}>
                          <Car className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {parseLicensePlate(s.licensePlate)}
                            <span className="text-slate-400 font-medium"> · {s.parkingSlot || '—'}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium truncate">
                             {s.parkingLotName || (language === 'en' ? 'Unknown lot' : 'Không rõ bãi')} · {s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() || s.user.email : t('guestLabel')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                            s.status === 'Active' && s.isCheckedIn ? 'bg-emerald-50 text-emerald-600' :
                            s.status === 'Active' ? 'bg-blue-50 text-blue-600' :
                            s.status === 'Completed' ? 'bg-slate-100 text-slate-500' :
                            'bg-red-50 text-red-500'
                          }`}>
                            {s.status === 'Active' && s.isCheckedIn ? (language === 'en' ? 'Parked' : 'Đang đỗ') : s.status === 'Active' ? (language === 'en' ? 'Reserved' : 'Đã đặt') : s.status === 'Completed' ? (language === 'en' ? 'Completed' : 'Hoàn tất') : s.status}
                          </span>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">{timeAgo}</p>
                        </div>
                      </motion.div>
                    );
                  })
                }
              </div>
            </div>

            {/* Pending Incidents */}
            <div className="col-span-12 lg:col-span-5 bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{language === 'en' ? 'Pending Incidents' : 'Sự cố chờ xử lý'}</h3>
                  <p className="text-xs text-slate-400 font-bold">{language === 'en' ? 'Requires admin action' : 'Cần hành động từ quản trị viên'}</p>
                </div>
                <Link to="/admin/incidents" className="text-[11px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors uppercase tracking-wider">
                  {language === 'en' ? 'Manage' : 'Quản lý'} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-4">
                {incidents.filter(inc => inc.status === 'Chờ xử lý').length === 0 && (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center">
                      <Shield className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">{language === 'en' ? 'No incidents' : 'Không có sự cố nào'}</p>
                    <p className="text-xs text-slate-400 mt-1">{language === 'en' ? 'System is running stable 🎉' : 'Hệ thống đang hoạt động ổn định 🎉'}</p>
                  </div>
                )}
                {incidents
                  .filter(inc => inc.status === 'Chờ xử lý')
                  .slice(0, 5)
                  .map((inc: any, i: number) => (
                    <motion.div
                      key={inc.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-4 bg-red-50/50 border border-red-100/60 rounded-2xl hover:bg-red-50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0 mt-0.5">
                          <CircleAlert className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-bold text-slate-800 truncate">{inc.title || inc.type || (language === 'en' ? 'Reported incident' : 'Sự cố báo cáo')}</p>
                           <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2">{inc.description || (language === 'en' ? 'No description' : 'Không có mô tả')}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {inc.createdAt ? new Date(inc.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </span>
                            {inc.parkingLotName && (
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {inc.parkingLotName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
