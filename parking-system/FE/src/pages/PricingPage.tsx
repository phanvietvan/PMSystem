import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { hasActiveSessions } from '../utils/auth';

const PricingPage = () => {
  const navigate = useNavigate();
  const [showActiveWarning, setShowActiveWarning] = useState(false);

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

    const savedRegs = localStorage.getItem('parking_regulations');
    if (savedRegs) setRegulations(JSON.parse(savedRegs));
  }, []);

  // Fresh design properties for each vehicle card
  const getCardTheme = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('xe máy')) {
      return {
        icon: 'motorcycle',
        cardBg: 'bg-gradient-to-b from-cyan-50/70 via-white/80 to-white border-cyan-100/60',
        iconBg: 'bg-cyan-100/60 text-cyan-600 border-cyan-200/20',
        hoverBorder: 'hover:border-cyan-300/80',
        hoverShadow: '0 20px 40px -15px rgba(6, 182, 212, 0.12), 0 0 0 1px rgba(6, 182, 212, 0.05)'
      };
    } else if (t.includes('4-7 chỗ') || t.includes('ô tô')) {
      return {
        icon: 'directions_car',
        cardBg: 'bg-gradient-to-b from-blue-50/70 via-white/80 to-white border-blue-100/60',
        iconBg: 'bg-blue-100/60 text-blue-600 border-blue-200/20',
        hoverBorder: 'hover:border-blue-300/80',
        hoverShadow: '0 20px 40px -15px rgba(37, 99, 235, 0.12), 0 0 0 1px rgba(37, 99, 235, 0.05)'
      };
    } else {
      return {
        icon: 'airport_shuttle',
        cardBg: 'bg-gradient-to-b from-indigo-50/70 via-white/80 to-white border-indigo-100/60',
        iconBg: 'bg-indigo-100/60 text-indigo-600 border-indigo-200/20',
        hoverBorder: 'hover:border-indigo-300/80',
        hoverShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.05)'
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
      transition: { staggerChildren: 0.08 }
    }
  };

  // Modern spring card animation
  const cardVariants = {
    hidden: { opacity: 0, y: 35, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 110,
        damping: 18,
        mass: 0.8
      }
    }
  };

  return (
    <>
      <div className="mesh-bg min-h-screen text-slate-800 antialiased font-sans pb-24 overflow-x-hidden selection:bg-blue-50">
        <Navbar />

        {/* Ambient floating orbs for dynamic luxury style - slightly brighter for freshness */}
        <div className="absolute top-12 left-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-400/8 to-indigo-500/8 rounded-full blur-[130px] pointer-events-none animate-pulse-glow" />
        <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/8 to-purple-500/8 rounded-full blur-[150px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '3s' }} />

        <main className="pt-36 max-w-6xl mx-auto px-6 relative z-10">

          {/* Futuristic Page Header */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-slate-900 leading-[1.15] md:whitespace-nowrap"
            >
              Bảng Giá Đỗ Xe - <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Nội Quy Hoạt Động</span>
            </motion.h1>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >
            {/* Template: 3 Column Majestic Interactive Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              {prices.map((p: any, idx: number) => {
                const theme = getCardTheme(p.type);
                return (
                  <motion.div
                    key={idx}
                    variants={cardVariants}
                    whileHover={{
                      y: -6,
                      scale: 1.015,
                      boxShadow: theme.hoverShadow
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className={`relative border backdrop-blur-md rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-soft transition-all duration-300 cursor-pointer ${theme.cardBg} ${theme.hoverBorder}`}
                  >
                    {/* Minimalist Soft Icon Circle */}
                    <div className={`w-16 h-16 rounded-full border flex items-center justify-center shadow-sm mb-6 ${theme.iconBg}`}>
                      <span className="material-symbols-outlined text-2xl font-bold">{theme.icon}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-black text-slate-900 tracking-tight mb-6">
                      {p.type}
                    </h3>

                    {/* Price Block */}
                    <div className="w-full pt-6 border-t border-slate-100/70 flex flex-col items-center">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-display font-extrabold text-slate-900 tracking-tight">
                          {p.price}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {p.sub.replace('VNĐ', '').trim()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Centered Footnote */}
            <div className="text-center text-[10px] text-slate-400 font-medium pt-2">
              * Tất cả các biểu phí trên đã bao gồm thuế và phí đỗ xe tiện ích.
            </div>

            {/* Flat Grid: Action triggers & Operating Regulations */}
            <div className="grid lg:grid-cols-12 gap-8 items-stretch mt-6">

              {/* Left column: Quick Actions Card (5 columns) */}
              <motion.div
                variants={cardVariants}
                className="lg:col-span-5 bg-white/70 border border-slate-200/50 backdrop-blur-md rounded-[2.5rem] p-8 shadow-soft flex flex-col justify-between"
              >
                <div className="text-left">
                  <h3 className="text-base font-black text-slate-900 tracking-tight mb-2">
                    Đặt Chỗ Đỗ Xe
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Giữ chỗ trước qua ứng dụng để đảm bảo có vị trí trống ngay khi phương tiện đi vào bãi đỗ xe thông minh.
                  </p>

                  <div className="mt-8 p-5.5 rounded-2xl bg-blue-50/30 border border-blue-100/40 space-y-4">
                    <div className="flex gap-3.5 items-start">
                      <span className="material-symbols-outlined text-blue-600 text-[18px] font-bold">check_circle</span>
                      <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                        Nhận diện biển số thông minh tại cổng barrier.
                      </p>
                    </div>
                    <div className="flex gap-3.5 items-start">
                      <span className="material-symbols-outlined text-blue-600 text-[18px] font-bold">check_circle</span>
                      <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                        Thanh toán online qua QR Code không dùng tiền mặt.
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
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold py-4.5 px-6 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg"
                  >
                    <span>Đặt Chỗ Ngay</span>
                    <span className="material-symbols-outlined text-[13px] font-bold">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-extrabold py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center hover:text-slate-800"
                  >
                    Về Trang Chủ
                  </button>
                </div>
              </motion.div>

              {/* Right column: Regulations grid in a sleek 2x3 format (7 columns) */}
              <motion.div
                variants={cardVariants}
                className="lg:col-span-7 bg-white/70 border border-slate-200/50 backdrop-blur-md rounded-[2.5rem] p-8 sm:p-10 shadow-soft text-left"
              >
                <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100/70">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px] font-bold">gavel</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none">Nội Quy Vận Hành</h3>
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Yêu cầu người lái xe tuân thủ</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">PM Security</span>
                </div>

                {/* 2-Column Grid for rules to reduce visual clutter and height */}
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  {regulations.map((reg: string, i: number) => {
                    const icon = getRuleIcon(i);
                    return (
                      <div
                        key={i}
                        className="flex gap-3.5 items-start p-3 bg-white/50 border border-slate-100 hover:border-blue-100 hover:bg-white rounded-2xl transition-colors duration-200 shadow-sm"
                      >
                        <div className="w-7.5 h-7.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          <span className="material-symbols-outlined text-[14px] font-bold">{icon}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Quy định 0{i + 1}</span>
                          <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                            {reg}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-5 border-t border-slate-100/70 flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  <span>Hỗ Trợ Khẩn Cấp: 0816 386 382</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Trực Tuyến 24/7</span>
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden font-sans"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent blur-xl rounded-full" />

              <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-3xl text-red-500 font-bold">warning</span>
              </div>

              <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug mb-2">
                Phiên đỗ đang hoạt động
              </h3>

              <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-8 px-2">
                Bạn đang có một phiên đỗ xe chưa kết thúc (xe chưa ra khỏi bãi). Vui lòng hoàn tất thanh toán lối ra cho xe hiện tại trước khi thực hiện đặt chỗ mới.
              </p>

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => {
                    setShowActiveWarning(false);
                    navigate('/active-session');
                  }}
                  className="w-full bg-slate-950 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold py-3.5 rounded-xl text-[9px] uppercase tracking-widest transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[13px]">visibility</span>
                  Xem phiên hiện tại
                </button>
                <button
                  onClick={() => {
                    setShowActiveWarning(false);
                    navigate('/reserve', { state: { bypassActiveCheck: true } });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold py-3.5 rounded-xl text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[13px]">directions_car</span>
                  Đặt xe khác
                </button>
                <button
                  onClick={() => setShowActiveWarning(false)}
                  className="w-full hover:bg-slate-50 text-slate-400 font-extrabold py-3 rounded-xl text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Đóng
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
