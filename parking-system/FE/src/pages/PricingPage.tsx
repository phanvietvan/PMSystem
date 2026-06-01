import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { hasActiveSessions, addActiveQr } from '../utils/auth';
import api from '../services/api';

const PricingPage = () => {
  const navigate = useNavigate();
  const [showActiveWarning, setShowActiveWarning] = useState(false);

  // Sync and verify active session with DB
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/ParkingSessions/my-session')
        .then(res => {
          if (res.data) {
            if (res.data.hasActiveSession && res.data.session) {
              const sQrCode = res.data.session.qrCode || res.data.session.QrCode;
              if (sQrCode) {
                addActiveQr(sQrCode);
              }
            } else {
              localStorage.removeItem('activeSessionQrs');
              localStorage.removeItem('activeSessionQr');
              setShowActiveWarning(false);
            }
          }
        })
        .catch(err => {
          console.log('Error syncing active session:', err);
        });
    }
  }, []);

  // Real-time Pricing State
  const [prices, setPrices] = useState(() => {
    const saved = localStorage.getItem('parking_pricing');
    return saved ? JSON.parse(saved) : [
      { type: 'Xe máy', price: '5.000', sub: 'VNĐ / Lượt' },
      { type: 'Ô tô 4-7 chỗ', price: '30.000', sub: 'VNĐ / Giờ' },
      { type: 'SUV / Bán tải', price: '50.000', sub: 'VNĐ / Giờ' }
    ];
  });

  // Real-time Regulations State
  const [regulations, setRegulations] = useState(() => {
    const saved = localStorage.getItem('parking_regulations');
    return saved ? JSON.parse(saved) : [
      'Vui lòng đỗ xe đúng vị trí ô đỗ đã đặt trước hoặc quét mã tại chỗ.',
      'Tốc độ di chuyển tối đa trong toàn bộ khuôn viên bãi đỗ xe là 10km/h.',
      'Tuân thủ tuyệt đối chỉ dẫn của nhân viên và biển báo thông minh.',
      'Thực hiện thanh toán trực tuyến qua ứng dụng trước khi ra cổng chắn.',
      'Không chứa các chất dễ cháy nổ, vũ khí hoặc hàng cấm trong phương tiện.',
      'Tự bảo quản tài sản cá nhân có giá trị. Ban quản lý không chịu trách nhiệm mất mát trong xe.'
    ];
  });

  useEffect(() => {
    const savedPrices = localStorage.getItem('parking_pricing');
    if (savedPrices) setPrices(JSON.parse(savedPrices));

    const fetchPricing = async () => {
      try {
        // Try PricingConfigs DB API first
        const response = await api.get('/PricingConfigs');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const mapped = response.data.map((c: any) => ({ type: c.type, price: c.price, sub: c.sub }));
          setPrices(mapped);
          localStorage.setItem('parking_pricing', JSON.stringify(mapped));
          return;
        }
      } catch (e) {}
      // Fallback to legacy endpoint
      try {
        const response = await api.get('/ParkingSessions/pricing');
        if (response.data && Array.isArray(response.data)) {
          setPrices(response.data);
          localStorage.setItem('parking_pricing', JSON.stringify(response.data));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchPricing();

    const fetchRegulations = async () => {
      try {
        const response = await api.get('/Regulations');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const mapped = response.data.map((r: any) => r.content);
          setRegulations(mapped);
          localStorage.setItem('parking_regulations', JSON.stringify(mapped));
          return;
        }
      } catch (e) {}
      const savedRegs = localStorage.getItem('parking_regulations');
      if (savedRegs) setRegulations(JSON.parse(savedRegs));
    };
    fetchRegulations();
  }, []);

  // Fresh design properties for each vehicle card
  const getCardTheme = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('xe máy')) {
      return {
        icon: 'motorcycle',
        cardBg: 'bg-white/70',
        border: 'border-white',
        iconBg: 'bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-500 border border-cyan-100/50',
        hoverBorder: 'hover:border-cyan-200/50',
        hoverShadow: '0 20px 40px -15px rgba(6, 182, 212, 0.15), 0 0 0 1px rgba(6, 182, 212, 0.05)',
        glow: 'from-cyan-400/20'
      };
    } else if (t.includes('4-7 chỗ') || t.includes('ô tô')) {
      return {
        icon: 'directions_car',
        cardBg: 'bg-white/70',
        border: 'border-white',
        iconBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-500 border border-blue-100/50',
        hoverBorder: 'hover:border-blue-200/50',
        hoverShadow: '0 20px 40px -15px rgba(37, 99, 235, 0.15), 0 0 0 1px rgba(37, 99, 235, 0.05)',
        glow: 'from-blue-400/20'
      };
    } else {
      return {
        icon: 'airport_shuttle',
        cardBg: 'bg-white/70',
        border: 'border-white',
        iconBg: 'bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-500 border border-indigo-100/50',
        hoverBorder: 'hover:border-indigo-200/50',
        hoverShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.05)',
        glow: 'from-indigo-400/20'
      };
    }
  };

  const getRuleIcon = (index: number) => {
    switch (index) {
      case 0: return 'local_parking';
      case 1: return 'speed';
      case 2: return 'traffic';
      case 3: return 'qr_code_scanner';
      case 4: return 'dangerous';
      case 5: return 'shield';
      default: return 'info';
    }
  };

  // Staggered Container Animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  // Modern spring card animation
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 20,
        mass: 0.8
      }
    }
  };

  return (
    <>
      <div className="bg-mesh-gradient text-slate-900 antialiased min-h-screen selection:bg-blue-100 font-['Inter'] overflow-x-hidden relative pb-24">
        <Navbar />

        {/* Abstract Background Orbs to match Landing Page */}
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-indigo-100/20 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <main className="pt-32 max-w-6xl mx-auto px-4 sm:px-6 relative z-10">

          {/* Majestic Soft Page Header */}
          <div className="text-center max-w-4xl mx-auto mb-16 space-y-4">
            
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]"
            >
              Bảng Giá <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">&</span> Nội Quy
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-slate-500 text-lg font-medium leading-relaxed max-w-2xl mx-auto"
            >
              Thông tin minh bạch và quy định rõ ràng, giúp trải nghiệm đỗ xe của bạn luôn an toàn, mượt mà và tiện lợi nhất.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >
            {/* Template: 3 Column Majestic Interactive Cards */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {prices.map((p: any, idx: number) => {
                const theme = getCardTheme(p.type);
                return (
                  <motion.div
                    key={idx}
                    variants={cardVariants}
                    whileHover={{
                      y: -8,
                      scale: 1.02,
                      boxShadow: theme.hoverShadow
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`relative backdrop-blur-xl border rounded-[28px] p-8 lg:p-10 flex flex-col items-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 cursor-pointer overflow-hidden group ${theme.cardBg} ${theme.border} ${theme.hoverBorder}`}
                  >
                    {/* Soft ambient glow inside card */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${theme.glow} to-transparent rounded-full blur-[30px] -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150 opacity-60`}></div>

                    {/* Minimalist Soft Icon Circle */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300 ${theme.iconBg}`}>
                      <span className="material-symbols-outlined text-2xl">{theme.icon}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-6 relative z-10">
                      {p.type}
                    </h3>

                    {/* Price Block */}
                    <div className="w-full pt-6 border-t border-slate-100/80 flex flex-col items-center relative z-10">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-900 tracking-tight">
                          {p.price}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {p.sub.replace('VNĐ', '').trim()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Centered Footnote */}
            <div className="text-center text-xs text-slate-400 font-medium">
              * Tất cả các biểu phí trên đã bao gồm thuế và dịch vụ tiện ích thông minh.
            </div>

            {/* Flat Grid: Action triggers & Operating Regulations */}
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-stretch mt-8">

              {/* Left column: Quick Actions Card */}
              <motion.div
                variants={cardVariants}
                className="lg:col-span-5 bg-white/70 backdrop-blur-xl border border-white rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between"
              >
                <div className="text-left">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3">
                    Đặt Chỗ Trực Tuyến
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Giữ chỗ trước qua ứng dụng để đảm bảo có vị trí trống ngay khi phương tiện đi vào bãi đỗ xe thông minh.
                  </p>

                  <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-100/50 space-y-4">
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-blue-100/80 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-blue-600 text-[14px] font-bold">check</span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed pt-1">
                        Nhận diện biển số thông minh 2s.
                      </p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-100/80 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-indigo-600 text-[14px] font-bold">check</span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed pt-1">
                        Thanh toán QR không dùng tiền mặt.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={() => {
                      if (hasActiveSessions()) {
                        setShowActiveWarning(true);
                      } else {
                        navigate('/reserve');
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Bắt Đầu Đặt Chỗ</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-white/80 hover:bg-white border border-slate-200 text-slate-500 hover:text-blue-600 font-bold py-4 rounded-2xl text-sm transition-all cursor-pointer text-center"
                  >
                    Về Trang Chủ
                  </button>
                </div>
              </motion.div>

              {/* Right column: Regulations grid */}
              <motion.div
                variants={cardVariants}
                className="lg:col-span-7 bg-white/70 backdrop-blur-xl border border-white rounded-[28px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left"
              >
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100/80">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-xl">gavel</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1.5">Nội Quy Vận Hành</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PM System Management</p>
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid for rules */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {regulations.map((reg: string, i: number) => {
                    const icon = getRuleIcon(i);
                    return (
                      <div
                        key={i}
                        className="flex gap-4 items-start p-4 bg-slate-50/50 hover:bg-white border border-slate-100/80 hover:border-blue-100 hover:shadow-md rounded-2xl transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 group-hover:text-blue-500 group-hover:border-blue-100 flex items-center justify-center shrink-0 shadow-sm transition-colors">
                          <span className="material-symbols-outlined text-[18px]">{icon}</span>
                        </div>
                        <div className="pt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Quy định 0{i + 1}</span>
                          <p className="text-slate-600 text-xs font-medium leading-relaxed">
                            {reg}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Hệ thống giám sát bảo mật 24/7</span>
                  </div>
                  <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider text-slate-500">
                    Hotline: 0816 386 382
                  </span>
                </div>
              </motion.div>

            </div>
          </motion.div>
        </main>
      </div>

      {/* ── Active Session Warning Modal ── */}
      <AnimatePresence>
        {showActiveWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-xl rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-white flex flex-col items-center text-center relative overflow-hidden font-sans"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-transparent blur-xl rounded-full" />

              <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm relative z-10">
                <span className="material-symbols-outlined text-3xl text-rose-500">warning</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug mb-3 relative z-10">
                Phiên đỗ đang hoạt động
              </h3>

              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 px-2 relative z-10">
                Bạn đang có một phiên đỗ xe chưa kết thúc (xe chưa ra khỏi bãi). Vui lòng hoàn tất thanh toán cho xe hiện tại trước khi đặt chỗ mới.
              </p>

              <div className="flex flex-col gap-3 w-full relative z-10">
                <button
                  onClick={() => {
                    setShowActiveWarning(false);
                    navigate('/active-session');
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  Xem phiên hiện tại
                </button>
                <button
                  onClick={() => {
                    setShowActiveWarning(false);
                    navigate('/reserve', { state: { bypassActiveCheck: true } });
                  }}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-4 rounded-2xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">directions_car</span>
                  Đặt xe khác
                </button>
                <button
                  onClick={() => setShowActiveWarning(false)}
                  className="w-full text-slate-400 hover:text-slate-600 font-bold py-3 rounded-2xl text-sm transition-all"
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PricingPage;
