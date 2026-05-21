import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Info, Zap, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const ActiveSessionPage = () => {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(0);
  const [licensePlate, setLicensePlate] = useState('51F-123.45');
  const [sessionQr, setSessionQr] = useState('QR_SESSION_8A9D');

  const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';
  const selectedLevel = localStorage.getItem('selectedLevel') || '3';

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // Retrieve license plate from local storage user profile if available
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.licensePlate) {
          setLicensePlate(user.licensePlate);
        }
      } catch (e) {
        console.error('Error parsing user storage in ActiveSessionPage', e);
      }
    }

    // Set persistent session QR code
    let savedQr = localStorage.getItem('activeSessionQr');
    if (!savedQr) {
      savedQr = `QR_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      localStorage.setItem('activeSessionQr', savedQr);
    }
    setSessionQr(savedQr);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-mesh-gradient selection:bg-primary/10 relative">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-[3rem] p-10 shadow-xl shadow-primary/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8">
               <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Đang giám sát</span>
               </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Zap className="w-5 h-5 fill-primary" />
                  <span className="text-xs font-black uppercase tracking-widest">Phiên đỗ đang hoạt động</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Thời gian đã đỗ</p>
                  <h1 className="text-6xl font-display font-black text-on-surface tracking-tighter tabular-nums">
                    {formatTime(seconds)}
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 border-y border-outline-variant/10 py-8">
                 <div>
                   <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Vị trí đỗ</p>
                   <p className="text-xl font-black text-on-surface">Tầng {selectedLevel.padStart(2, '0')} • {selectedSlot}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Biển số xe</p>
                   <p className="text-xl font-black text-on-surface tracking-tight">{licensePlate}</p>
                 </div>
              </div>

              {/* Exit Verification QR Code Card */}
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-[2rem] p-6 text-center space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-on-surface">Mã QR đỗ xe của bạn</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-1">Trình mã này trước máy quét tại cổng ra để đối chiếu & thanh toán</p>
                </div>

                <div 
                  onClick={() => navigate('/payment')}
                  className="relative w-48 h-48 bg-white border border-outline-variant/30 rounded-2xl mx-auto flex flex-col items-center justify-center p-4 cursor-pointer group hover:border-primary hover:shadow-lg transition-all"
                >
                  <QrCode className="w-36 h-36 text-on-surface/80 group-hover:text-primary transition-colors" />
                  
                  {/* Hover Overlay to simulate scanning */}
                  <div className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                      <Zap className="w-5 h-5 fill-white" />
                    </div>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Giả lập quét lối ra</span>
                  </div>
                </div>

                <p className="text-[10px] font-mono text-outline font-semibold tracking-wider">
                  MÃ SỐ PHIÊN: {sessionQr}
                </p>
              </div>

              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center">
                   <ShieldCheck className="text-emerald-500 w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-on-surface">An ninh AI đã kích hoạt</p>
                   <p className="text-[10px] text-on-surface-variant font-medium">Xe của bạn đang được giám sát bởi SecureNode v1.4</p>
                 </div>
              </div>
            </div>
          </motion.div>

          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10 flex items-start gap-4">
             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm flex-shrink-0">
               <Info className="w-5 h-5" />
             </div>
             <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
               Hệ thống sẽ tự động đối chiếu thời gian ra và vào trên Cơ sở dữ liệu để tính toán chi phí đỗ xe chính xác nhất khi bạn trình mã QR tại cổng ra và hoàn tất quá trình thanh toán thành công.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActiveSessionPage;
