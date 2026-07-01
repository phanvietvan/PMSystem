import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Info, Zap, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { parseLicensePlate, getActiveQrs, removeActiveQr } from '../utils/auth';
import api from '../services/api';
import QRCode from 'qrcode';
import { useSettings } from '../hooks/useSettings.tsx';

interface SessionQrProps {
  qr: string;
  language?: string;
}

const SessionQr = ({ qr, language = 'vi' }: SessionQrProps) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(qr, { width: 250, margin: 1 }, (err, url) => {
      if (!err && url) {
        setQrUrl(url);
      }
    });
  }, [qr]);

  if (!qrUrl) {
    return (
      <div className="w-36 h-36 flex items-center justify-center text-[10px] text-slate-400 font-bold animate-pulse">
        {language === 'en' ? 'Generating QR...' : 'Đang tạo mã QR...'}
      </div>
    );
  }

  return (
    <img 
      src={qrUrl} 
      alt="Session QR Code" 
      className="w-36 h-36 object-contain animate-fade-in"
    />
  );
};

const getLevelFromSlot = (slot: string | null | undefined): string => {
  if (!slot) return '1';
  const prefix = slot.charAt(0).toUpperCase();
  if (['C', 'D'].includes(prefix)) return '2';
  if (['E', 'F'].includes(prefix)) return '3';
  return '1';
};

interface SessionData {
  id?: string;
  qr: string;
  licensePlate: string;
  slot: string;
  level: string;
  seconds: number;
  entryTime: string | null;
  isCheckedIn: boolean;
  isCompleted?: boolean;
  isCancelled?: boolean;
  exitTime?: string | null;
  exitLicensePlate?: string;
  isPlateMatched?: boolean;
  parkingLotName?: string;
  vehicleType?: string;
  reservationEndTime?: string;
}

const ActiveSessionPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useSettings();

  const [activeExtendId, setActiveExtendId] = useState<string | null>(null);
  const [newEndTime, setNewEndTime] = useState<string>('');
  const [extending, setExtending] = useState<boolean>(false);
  const [extendError, setExtendError] = useState<string | null>(null);

  const calculateDefaultNextHour = (timeStr: string): string => {
    try {
      const [h, m] = timeStr.split(':');
      let hour = parseInt(h, 10) + 1;
      if (hour >= 24) hour = 0;
      return `${hour.toString().padStart(2, '0')}:${m}`;
    } catch (e) {
      return '18:00';
    }
  };

  const handleExtendSession = async (sessionId: string, qrCode: string) => {
    if (!sessionId) {
      setExtendError(language === 'en' ? 'Session ID not found.' : 'Không tìm thấy ID phiên.');
      return;
    }
    if (!newEndTime) {
      setExtendError(language === 'en' ? 'Please choose end time.' : 'Vui lòng chọn giờ kết thúc.');
      return;
    }

    setExtending(true);
    setExtendError(null);

    try {
      const response = await api.post(`/ParkingSessions/${sessionId}/extend`, {
        newEndTime: newEndTime
      });
      if (response.data) {
        alert(language === 'en' ? 'Extending parking time successful!' : 'Gia hạn thời gian đỗ xe thành công!');
        setActiveExtendId(null);
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      const defaultErr = language === 'en'
        ? 'Could not extend session. Please check if slot is reserved or select different time.'
        : 'Không thể gia hạn. Vui lòng kiểm tra xem slot đã được đặt trước hoặc chọn giờ khác.';
      const errMsg = err.response?.data?.message || defaultErr;
      setExtendError(errMsg);
    } finally {
      setExtending(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchAllActiveSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        const results: SessionData[] = [];

        if (token && user) {
          const allResp = await api.get('/ParkingSessions/history');
          if (allResp.data && Array.isArray(allResp.data)) {
            const mySessions = allResp.data;
            
            for (const s of mySessions) {
              const sExitTime = s.exitTime || s.ExitTime;
              const sEntryTime = s.entryTime || s.EntryTime;
              const sStatus = s.status || s.Status;
              const sQrCode = s.qrCode || s.QrCode;
              const sParkingSlot = s.parkingSlot || s.ParkingSlot;
              const sIsCheckedIn = s.isCheckedIn ?? s.IsCheckedIn;
              const sParkingLotName = s.parkingLotName || s.ParkingLotName;
              const sLicensePlate = s.licensePlate || s.LicensePlate;

              const diffMs = sExitTime && sEntryTime ? new Date(sExitTime).getTime() - new Date(sEntryTime).getTime() : 0;
              const isCompleted = sStatus === 'Completed';
              const isCancelled = sStatus === 'Cancelled';
              
              if (!isCompleted && !isCancelled && sQrCode) {
                const { addActiveQr } = await import('../utils/auth');
                addActiveQr(sQrCode);
              } else if ((isCompleted || isCancelled) && sQrCode) {
                const { removeActiveQr } = await import('../utils/auth');
                removeActiveQr(sQrCode);
              }

              results.push({
                id: s.id || s.Id,
                qr: sQrCode,
                licensePlate: parseLicensePlate(sLicensePlate),
                slot: sParkingSlot || 'A3',
                level: getLevelFromSlot(sParkingSlot),
                seconds: isCompleted ? Math.max(0, Math.floor(diffMs / 1000)) : 0,
                entryTime: sEntryTime || null,
                isCheckedIn: sIsCheckedIn || false,
                isCompleted: isCompleted,
                isCancelled: isCancelled,
                exitTime: sExitTime,
                exitLicensePlate: s.exitLicensePlate || s.ExitLicensePlate,
                isPlateMatched: s.isPlateMatched ?? s.IsPlateMatched,
                parkingLotName: sParkingLotName,
                vehicleType: s.vehicleType || s.VehicleType || 'car',
                reservationEndTime: s.reservationEndTime || s.ReservationEndTime || ''
              });
            }
          }
        } else {
          const qrs = getActiveQrs();
          if (qrs.length > 0) {
            for (const qr of qrs) {
              try {
                const resp = await api.get(`/ParkingSessions/verify/${qr}`);
                if (resp.data && resp.data.session) {
                  const s = resp.data.session;
                  const sStatus = s.status || s.Status;
                  if (sStatus === 'Cancelled' || sStatus === 'Completed') {
                     removeActiveQr(qr);
                     continue;
                  }
                  
                  const sLicensePlate = s.licensePlate || s.LicensePlate;
                  const sParkingSlot = s.parkingSlot || s.ParkingSlot;
                  const sEntryTime = s.entryTime || s.EntryTime;
                  const sIsCheckedIn = s.isCheckedIn ?? s.IsCheckedIn;
                  const sParkingLotName = s.parkingLotName || s.ParkingLotName;

                  results.push({
                    id: s.id || s.Id,
                    qr,
                    licensePlate: parseLicensePlate(sLicensePlate),
                    slot: sParkingSlot || 'A3',
                    level: getLevelFromSlot(sParkingSlot),
                    seconds: 0,
                    entryTime: sEntryTime || null,
                    isCheckedIn: sIsCheckedIn || false,
                    isCompleted: false,
                    isCancelled: false,
                    parkingLotName: sParkingLotName,
                    vehicleType: s.vehicleType || s.VehicleType || 'car',
                    reservationEndTime: s.reservationEndTime || s.ReservationEndTime || ''
                  });
                } else {
                  removeActiveQr(qr);
                }
              } catch (e) {
                removeActiveQr(qr);
              }
            }
          }
        }

        const localQrs = getActiveQrs();
        if (localQrs.length > 0) {
          for (const qr of localQrs) {
            if (results.some(r => r.qr === qr)) continue;
            try {
              const resp = await api.get(`/ParkingSessions/verify/${qr}`);
              if (resp.data && resp.data.session) {
                const s = resp.data.session;
                const sStatus = s.status || s.Status;
                if (sStatus === 'Cancelled' || sStatus === 'Completed') {
                   removeActiveQr(qr);
                   continue;
                }
                
                const sLicensePlate = s.licensePlate || s.LicensePlate;
                const sParkingSlot = s.parkingSlot || s.ParkingSlot;
                const sEntryTime = s.entryTime || s.EntryTime;
                const sIsCheckedIn = s.isCheckedIn ?? s.IsCheckedIn;
                const sParkingLotName = s.parkingLotName || s.ParkingLotName;

                results.push({
                  id: s.id || s.Id,
                  qr,
                  licensePlate: parseLicensePlate(sLicensePlate),
                  slot: sParkingSlot || 'A3',
                  level: getLevelFromSlot(sParkingSlot),
                  seconds: 0,
                  entryTime: sEntryTime || null,
                  isCheckedIn: sIsCheckedIn || false,
                  isCompleted: false,
                  isCancelled: false,
                  parkingLotName: sParkingLotName,
                  vehicleType: s.vehicleType || s.VehicleType || 'car',
                  reservationEndTime: s.reservationEndTime || s.ReservationEndTime || ''
                });
              } else {
                removeActiveQr(qr);
              }
            } catch (e) {
              removeActiveQr(qr);
            }
          }
        }

        if (results.length === 0) {
          if (isMounted) {
            setSessions([]);
            setLoading(false);
          }
          return;
        }

        results.sort((a, b) => {
           if (a.isCompleted === b.isCompleted && a.isCancelled === b.isCancelled) {
              return new Date(b.entryTime || 0).getTime() - new Date(a.entryTime || 0).getTime();
           }
           if (a.isCompleted || a.isCancelled) return 1;
           return -1;
        });

        if (isMounted) {
          setSessions(results);
          setLoading(false);
        }
      } catch (e) {
        if (isMounted) {
          setSessions([]);
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchAllActiveSessions();

    // Polling interval for realtime sync (slot changes, cancellations, etc.)
    const syncId = setInterval(() => {
      fetchAllActiveSessions();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(syncId);
    };
  }, []);

  // Timer: update seconds every second based on each session's entryTime (only if checked in!)
  useEffect(() => {
    if (sessions.length === 0) return;
    const tick = () => {
      setSessions(prev =>
        prev.map(s => {
          if (s.isCompleted) return s;
          if (!s.isCheckedIn || !s.entryTime) return { ...s, seconds: 0 };
          const diffMs = Date.now() - new Date(s.entryTime).getTime();
          return { ...s, seconds: Math.max(0, Math.floor(diffMs / 1000)) };
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessions.length]);

  // Removed old manual exit-gate polling because fetchAllActiveSessions runs every 5 seconds now

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
  };

  const calculateFee = (entryStr: string | null | undefined, exitStr: string | null | undefined, vehicleType: string | null | undefined) => {
    if (!entryStr || !exitStr) return 10000;
    const entry = new Date(entryStr);
    const exit = new Date(exitStr);
    const elapsedMinutes = Math.ceil((exit.getTime() - entry.getTime()) / (60 * 1000));
    
    let baseRate = 10000;
    let isHourly = true;

    const savedPricing = localStorage.getItem('parking_pricing');
    if (savedPricing) {
      try {
        const parsed = JSON.parse(savedPricing);
        const vType = (vehicleType || 'car').toLowerCase();
        let matched = null;
        if (vType === 'bike') {
          matched = parsed[0];
        } else if (vType === 'car') {
          matched = parsed[1];
        } else if (vType === 'suv') {
          matched = parsed[2];
        }

        if (matched) {
          const cleanPriceStr = matched.price.replace(/[.,]/g, '');
          const parsedPrice = parseFloat(cleanPriceStr);
          if (!isNaN(parsedPrice)) {
            baseRate = parsedPrice;
          }
          isHourly = matched.sub.toLowerCase().includes('giờ') || matched.sub.toLowerCase().includes('hour');
        }
      } catch (e) {
        console.error('Error parsing pricing in calculateFee', e);
      }
    }

    if (isHourly) {
      const hours = Math.max(1, Math.ceil(elapsedMinutes / 60));
      return baseRate * hours;
    } else {
      return baseRate;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">{language === 'en' ? 'Loading sessions...' : 'Đang tải phiên đỗ...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-gradient selection:bg-primary/10 relative">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 pt-32 pb-20 relative z-10">


        <div className="space-y-6">
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-100 rounded-[3rem] p-12 text-center space-y-6 shadow-xl shadow-blue-500/5"
            >
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100/50 shadow-inner">
                <History className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">{language === 'en' ? 'No parking history' : 'Chưa có lịch sử gửi xe'}</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                  {language === 'en' ? 'Your account currently has no recorded parking history or active parking sessions in the system.' : 'Tài khoản của bạn hiện tại chưa ghi nhận bất kỳ lịch sử đỗ xe hoặc phiên gửi xe đang hoạt động nào trong hệ thống.'}
                </p>
              </div>
              <button
                onClick={() => navigate('/reserve')}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-full transition-all shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer inline-flex items-center gap-2"
              >
                {language === 'en' ? 'Book parking spot now' : 'Đặt chỗ gửi xe ngay'}
              </button>
            </motion.div>
          ) : (
            sessions.map((session, idx) => {
            if (session.isCompleted || session.isCancelled) {
              return (
                <motion.div
                  key={session.qr}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-surface-container-lowest border rounded-[3rem] p-10 relative overflow-hidden ${
                    session.isCancelled 
                      ? 'border-red-500/20 shadow-2xl shadow-red-500/5' 
                      : 'border-emerald-500/20 shadow-2xl shadow-emerald-500/5'
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
                    session.isCancelled ? 'bg-red-500/5' : 'bg-emerald-500/5'
                  }`} />
                  
                  <div className="absolute top-0 right-0 p-8">
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm ${
                      session.isCancelled 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        session.isCancelled ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                      }`}></span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        session.isCancelled ? 'text-red-700' : 'text-emerald-700'
                      }`}>
                        {session.isCancelled ? (language === 'en' ? 'Cancelled' : 'Đã hủy') : (language === 'en' ? 'Exited' : 'Đã ra cổng')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <div className={`flex items-center gap-3 ${session.isCancelled ? 'text-red-600' : 'text-emerald-600'}`}>
                        <ShieldCheck className={`w-6 h-6 animate-bounce ${session.isCancelled ? 'fill-red-100 text-red-600' : 'fill-emerald-100 text-emerald-600'}`} />
                        <span className="text-xs font-black uppercase tracking-widest">
                          {session.isCancelled ? (language === 'en' ? 'Cancelled ticket history' : 'Lịch sử hủy vé') : (language === 'en' ? 'Exit/entry history' : 'Lịch sử đã ra vào')}
                        </span>
                      </div>
                      {!session.isCancelled && (
                        <div>
                          <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">
                            {language === 'en' ? 'Total parking duration' : 'Tổng thời gian đỗ'}
                          </p>
                          <h1 className="text-5xl font-display font-black text-on-surface tracking-tighter tabular-nums">
                            {formatTime(session.seconds)}
                          </h1>
                        </div>
                      )}
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant/10 rounded-[2.5rem] p-8 space-y-6 relative">
                      <div className="border-b border-outline-variant/10 pb-4 flex justify-between items-center">
                        <span className="text-xs font-extrabold text-on-surface uppercase tracking-wider">{language === 'en' ? 'Parking session details' : 'Chi tiết phiên gửi xe'}</span>
                        {!session.isCancelled && session.isPlateMatched !== undefined && (
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            session.isPlateMatched 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {session.isPlateMatched ? (language === 'en' ? '✓ Plate matched' : '✓ Khớp biển số') : (language === 'en' ? '⚠ Plate mismatched' : '⚠ Lệch biển số')}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">1</div>
                            <span className="text-[10px] font-black text-outline uppercase tracking-wider">
                              {session.isCancelled ? (language === 'en' ? 'Est. Entry Time' : 'Thời gian dự kiến vào') : (language === 'en' ? 'Entry Time' : 'Thời gian xe vào')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{formatDateTime(session.entryTime)}</p>
                            <p className="text-xs text-on-surface-variant font-medium mt-1">{language === 'en' ? 'License Plate:' : 'Biển số:'} <strong className="text-on-surface font-extrabold">{session.licensePlate}</strong></p>
                            <p className="text-xs text-on-surface-variant font-medium">{language === 'en' ? 'Building:' : 'Tòa nhà:'} <strong className="text-on-surface font-extrabold">{session.parkingLotName || 'Landmark 81 - Bãi đỗ A1'}</strong></p>
                            <p className="text-xs text-on-surface-variant font-medium">{language === 'en' ? 'Slot:' : 'Vị trí:'} <strong className="text-primary font-extrabold">{language === 'en' ? 'Slot ' : 'Ô '}{session.slot}</strong></p>
                          </div>
                        </div>

                        {!session.isCancelled && (
                          <div className="space-y-4 border-t md:border-t-0 md:border-l border-outline-variant/10 pt-4 md:pt-0 md:pl-6">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs font-bold">2</div>
                              <span className="text-[10px] font-black text-outline uppercase tracking-wider">{language === 'en' ? 'Exit Time' : 'Thời gian xe ra'}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-on-surface">{formatDateTime(session.exitTime)}</p>
                              <p className="text-xs text-on-surface-variant font-medium mt-1">{language === 'en' ? 'Exit Plate:' : 'Biển số ra:'} <strong className="text-on-surface font-extrabold">{session.exitLicensePlate ? parseLicensePlate(session.exitLicensePlate) : session.licensePlate}</strong></p>
                              <p className="text-xs text-on-surface-variant font-medium">{language === 'en' ? 'Building:' : 'Tòa nhà:'} <strong className="text-on-surface font-extrabold">{session.parkingLotName || 'Landmark 81 - Bãi đỗ A1'}</strong></p>
                              <p className="text-xs text-on-surface-variant font-medium">{language === 'en' ? 'Parking Spot:' : 'Bãi đỗ:'} <strong className="text-on-surface font-extrabold">{language === 'en' ? 'Zone ' : 'Khu vực '}{session.level}</strong></p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {!session.isCancelled ? (
                      <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                            <span className="material-symbols-outlined text-[24px]">payments</span>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">{language === 'en' ? 'Payment Status' : 'Trạng thái thanh toán'}</p>
                            <p className="text-xs text-slate-500 font-semibold">{language === 'en' ? 'Auto-deducted from linked wallet' : 'Tự động trừ ví qua tài khoản liên kết'}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">{language === 'en' ? 'Amount Paid' : 'Số tiền đã trả'}</p>
                          <p className="text-2xl font-black text-emerald-600">
                            {formatCurrency(calculateFee(session.entryTime, session.exitTime, session.vehicleType))}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50/50 border border-red-200/50 rounded-[2rem] p-6 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-red-100 flex items-center justify-center text-red-600 shadow-sm shrink-0">
                          <span className="material-symbols-outlined text-[24px]">cancel</span>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-red-700 uppercase tracking-widest">{language === 'en' ? 'Parking ticket cancelled' : 'Vé đỗ xe đã bị hủy'}</p>
                          <p className="text-xs text-slate-600 font-medium">{language === 'en' ? 'This ticket is no longer valid. If you still need a spot, please make a new reservation.' : 'Vé này không còn giá trị sử dụng. Nếu bạn vẫn có nhu cầu, vui lòng đặt lại một chỗ mới trên hệ thống.'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={session.qr}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-surface-container-lowest border border-outline-variant/30 rounded-[3rem] p-10 shadow-xl shadow-primary/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8">
                   {session.isCheckedIn ? (
                     <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 animate-fade-in">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{language === 'en' ? 'Parking' : 'Đang đỗ xe'}</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 animate-fade-in">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{language === 'en' ? 'Reserved - Pending Entry' : 'Đã đặt - Chờ vào bốt'}</span>
                     </div>
                   )}
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                      <Zap className="w-5 h-5 fill-primary" />
                      <span className="text-xs font-black uppercase tracking-widest">
                        {language === 'en' ? (sessions.length > 1 ? `Session #${idx + 1}` : 'Active Session') : (`Phiên đỗ ${sessions.length > 1 ? `#${idx + 1}` : 'đang hoạt động'}`)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">
                        {session.isCheckedIn ? (language === 'en' ? 'Duration' : 'Thời gian đã đỗ') : (language === 'en' ? 'Time Remaining' : 'Thời gian đếm ngược')}
                      </p>
                      <h1 className="text-6xl font-display font-black text-on-surface tracking-tighter tabular-nums">
                        {formatTime(session.seconds)}
                      </h1>
                      {!session.isCheckedIn && (
                        <p className="text-[10px] font-bold text-blue-600 mt-2 animate-pulse">
                          {language === 'en' ? '⏳ Parking duration will only start counting once you scan the QR code at the entry gate!' : '⏳ Thời gian đỗ xe sẽ chỉ bắt đầu tính khi bạn quét mã QR đi qua bốt cổng vào!'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 border-y border-outline-variant/10 py-8 text-left">
                     <div>
                       <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">{language === 'en' ? 'Slot' : 'Vị trí đỗ'}</p>
                       <p className="text-base font-black text-on-surface">{language === 'en' ? 'Slot ' : 'Ô '}{session.slot}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">{language === 'en' ? 'License Plate' : 'Biển số xe'}</p>
                       <p className="text-base font-black text-on-surface tracking-tight">{session.licensePlate}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">{language === 'en' ? 'Parking Spot' : 'Bãi đỗ'}</p>
                       <p className="text-base font-black text-on-surface">{language === 'en' ? 'Zone ' : 'Khu vực '}{session.level}</p>
                     </div>
                     <div className="col-span-2 sm:col-span-2">
                       <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">{language === 'en' ? 'Building' : 'Tòa nhà'}</p>
                       <p className="text-base font-black text-primary truncate" title={session.parkingLotName || 'Landmark 81 - Bãi đỗ A1'}>
                         {session.parkingLotName || 'Landmark 81 - Bãi đỗ A1'}
                       </p>
                     </div>
                     <div className="col-span-2 sm:col-span-1">
                       <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">{language === 'en' ? 'Entry Time' : 'Thời gian vào'}</p>
                       <p className="text-xs font-bold text-on-surface">
                         {session.entryTime ? formatDateTime(session.entryTime) : (language === 'en' ? 'Awaiting entry...' : 'Đang chờ vào bốt...')}
                       </p>
                     </div>
                  </div>

                  {/* Exit Verification QR Code Card */}
                  <div className="bg-surface-container-low border border-outline-variant/20 rounded-[2rem] p-6 text-center space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-on-surface">{language === 'en' ? 'Your Parking QR Code' : 'Mã QR đỗ xe của bạn'}</h4>
                      <p className="text-[10px] text-on-surface-variant font-medium mt-1">{language === 'en' ? 'Present this code at the exit gate scanner for verification & auto-payment' : 'Trình mã này trước máy quét tại cổng ra để đối chiếu & thanh toán'}</p>
                    </div>

                      <div 
                      className="relative w-48 h-48 bg-white border border-outline-variant/30 rounded-2xl mx-auto flex flex-col items-center justify-center p-4"
                    >
                      <SessionQr qr={session.qr} language={language} />
                    </div>

                    <p className="text-[10px] font-mono text-outline font-semibold tracking-wider">
                      {language === 'en' ? 'SESSION ID' : 'MÃ SỐ PHIÊN'}: {session.qr}
                    </p>
                  </div>

                  {session.reservationEndTime && !session.isCompleted && !session.isCancelled && (
                    <div className="bg-surface-container-low border border-outline-variant/20 rounded-[2rem] p-6 text-left space-y-4">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-on-surface">{language === 'en' ? 'Reservation Schedule' : 'Lịch trình đặt chỗ'}</h4>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {language === 'en' ? 'End Time: ' : 'Giờ kết thúc đăng ký: '}<span className="font-extrabold text-on-surface">{session.reservationEndTime}</span>
                        </p>
                      </div>

                      {activeExtendId === session.qr ? (
                        <div className="space-y-4 pt-2 border-t border-outline-variant/10">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1">
                              {language === 'en' ? 'Choose New End Time' : 'Chọn giờ kết thúc mới'}
                            </label>
                            <input
                              type="time"
                              value={newEndTime}
                              onChange={(e) => setNewEndTime(e.target.value)}
                              className="premium-input block w-full pl-4 pr-4 py-2.5 rounded-full border border-outline-variant focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/60 transition-all text-xs font-semibold bg-white"
                            />
                          </div>

                          {extendError && (
                            <p className="text-[10px] font-bold text-rose-500 ml-1 animate-pulse">
                              {extendError}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleExtendSession(session.id || '', session.qr)}
                              disabled={extending}
                              className="flex-1 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-md transition-all disabled:opacity-50"
                            >
                              {extending ? (language === 'en' ? 'Processing...' : 'Đang xử lý...') : (language === 'en' ? 'Confirm' : 'Xác nhận')}
                            </button>
                            <button
                              onClick={() => {
                                setActiveExtendId(null);
                                setExtendError(null);
                              }}
                              className="flex-1 py-2 rounded-full border border-outline-variant text-on-surface text-xs font-bold hover:bg-surface-container-high transition-all"
                            >
                              {language === 'en' ? 'Cancel' : 'Hủy'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveExtendId(session.qr);
                            setNewEndTime(calculateDefaultNextHour(session.reservationEndTime || ''));
                          }}
                          className="w-full py-2.5 rounded-full border border-primary/30 text-primary text-xs font-extrabold hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <Zap size={14} className="fill-primary text-primary" />
                          {language === 'en' ? 'Extend Parking Time' : 'Gia hạn thời gian đỗ'}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center">
                       <ShieldCheck className="text-emerald-500 w-6 h-6" />
                     </div>
                     <div>
                       <p className="text-xs font-bold text-on-surface">{language === 'en' ? 'AI Security Activated' : 'An ninh AI đã kích hoạt'}</p>
                       <p className="text-[10px] text-on-surface-variant font-medium">{language === 'en' ? 'Your vehicle is monitored by SecureNode v1.4' : 'Xe của bạn đang được giám sát bởi SecureNode v1.4'}</p>
                     </div>
                  </div>
                </div>
              </motion.div>
            );
          }))}

          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10 flex items-start gap-4">
             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm flex-shrink-0">
               <Info className="w-5 h-5" />
             </div>
             <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
               {language === 'en' ? 'The system will automatically reconcile the entry and exit times in the database to calculate the most accurate fee when you present the QR code at the exit gate and complete the payment.' : 'Hệ thống sẽ tự động đối chiếu thời gian ra và vào trên Cơ sở dữ liệu để tính toán chi phí đỗ xe chính xác nhất khi bạn trình mã QR tại cổng ra và hoàn tất quá trình thanh toán thành công.'}
             </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActiveSessionPage;
