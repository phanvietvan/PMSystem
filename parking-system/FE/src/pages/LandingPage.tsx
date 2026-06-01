import { useState, useEffect } from 'react';
import BrandLogo from '../components/brand/BrandLogo';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLottie } from 'lottie-react';
import Navbar from '../components/layout/Navbar';
import { Cpu, SmartphoneNfc, Zap, QrCode } from 'lucide-react';
import animationData from '../components/ui/hasahar.json';
import { hasActiveSessions, addActiveQr } from '../utils/auth';
import api from '../services/api';

const LandingPage = () => {
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

  const lottieOptions = {
    animationData: animationData,
    loop: true,
  };

  const { View: LottieView } = useLottie(lottieOptions);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: [0.22, 1, 0.36, 1] as const,
      }
    }
  };

  const floatingVariants: Variants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    }
  };

  return (
    <>
    <div className="bg-mesh-gradient text-slate-900 antialiased min-h-screen selection:bg-blue-100 font-['Inter'] overflow-x-hidden">
      <Navbar />

      <main className="pt-40 relative">
        {/* Abstract Background Orbs */}
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-indigo-100/20 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Text Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="space-y-10"
            >

              <motion.h1 variants={itemVariants} className="text-6xl lg:text-[84px] font-['Plus_Jakarta_Sans'] font-extrabold text-slate-900 leading-[1.05] tracking-[-0.04em]">
                Hệ thống <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500">Quản lý Đỗ xe</span> <br />
                Thông minh
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl text-slate-500/80 leading-relaxed max-w-lg font-medium">
                Thế hệ quản lý hạ tầng tiếp theo. Trải nghiệm sự liền mạch và tối ưu hóa không gian được dẫn dắt bởi trí tuệ nhân tạo kiến trúc.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5 pt-4">
                <button
                  onClick={() => {
                    if (hasActiveSessions()) {
                      setShowActiveWarning(true);
                    } else {
                      navigate('/reserve');
                    }
                  }}
                  className="group relative bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 px-10 rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 active:scale-95 overflow-hidden cursor-pointer"
                >
                  <span className="relative z-10">Đặt chỗ ngay</span>
                  <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="bg-white/60 hover:bg-white text-blue-600 font-bold py-5 px-10 rounded-full border border-blue-100 backdrop-blur-sm transition-all duration-300 flex items-center justify-center hover:shadow-xl hover:-translate-y-1 active:scale-95 cursor-pointer"
                >
                  Xem Bảng giá
                </button>
              </motion.div>
            </motion.div>

            {/* Hero Visual: Dashboard Preview */}
            <div className="relative">
              {/* Luminous Glow behind the card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/10 blur-[120px] rounded-full"></div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95, rotateY: -10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10"
              >
                <motion.div
                  variants={floatingVariants}
                  animate="animate"
                  className="glass-card glow-border p-3 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)]"
                >
                  <div className="bg-white/80 rounded-[2.2rem] overflow-hidden border border-white/40 shadow-inner">
                    {/* Mockup UI Header */}
                    <div className="px-8 py-5 bg-white/40 border-b border-slate-100/50 flex items-center justify-between">
                      <div className="flex gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-sm"></div>
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm"></div>
                        <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-sm"></div>
                      </div>
                      <div className="h-2 w-24 bg-slate-100 rounded-full"></div>
                    </div>

                    {/* Mockup Content */}
                    <div className="p-8">
                      <div className="relative rounded-3xl overflow-hidden bg-slate-50/50 shadow-2xl shadow-inner-lg group">
                        <div className="w-full h-full transform group-hover:scale-[1.02] transition-transform duration-700">
                          {LottieView}
                        </div>
                        {/* Glass Overlay on Animation */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                      </div>

                      {/* Live Data Card */}
                      <div className="mt-8 glass-card p-6 rounded-[2rem] border border-white/60 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">Tỉ lệ lấp đầy</p>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-black text-slate-900 tracking-tighter">88.4%</span>
                              <span className="px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-md uppercase tracking-wider">Tối ưu</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 max-w-[140px] ml-6">
                          <div className="w-full h-3 bg-slate-100/80 rounded-full overflow-hidden relative border border-slate-200/20">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '88.4%' }}
                              transition={{ duration: 2, delay: 0.8 }}
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section with extra spacing */}
        <section className="bg-white/20 border-t border-slate-200/40 py-32 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {[
                { label: 'Thời gian hoạt động', value: '99.9', unit: '%', color: 'text-emerald-500' },
                { label: 'Vị trí khả dụng', value: '1,248', unit: '', color: 'text-blue-500' },
                { label: 'Thời gian xử lý', value: '4.2', unit: 'ms', color: 'text-indigo-500' },
                { label: 'Điểm dữ liệu', value: '2.5', unit: 'Tr', color: 'text-blue-600' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="glass-card p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 group"
                >
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 group-hover:text-blue-600 transition-colors">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-['Plus_Jakarta_Sans'] font-extrabold text-slate-900 tracking-tight">{stat.value}</span>
                    {stat.unit && <span className={`${stat.color} font-black text-sm uppercase tracking-widest ml-1`}>{stat.unit}</span>}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 relative overflow-hidden bg-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 shadow-sm"
              >
                <Zap size={14} className="text-blue-500" /> Công nghệ lõi
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight mb-6"
              >
                Trải nghiệm đỗ xe <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">không chạm</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-slate-500 text-lg font-medium leading-relaxed"
              >
                Hệ thống PM System tích hợp công nghệ AI và IoT tiên tiến nhất, mang đến giải pháp quản lý bãi đỗ xe toàn diện và tự động hóa 100%.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Cpu className="w-8 h-8 text-indigo-500" />,
                  title: 'Nhận diện AI tức thì',
                  desc: 'Camera AI tự động đọc biển số xe trong 0.2s, mở barrier tự động không cần lấy vé giấy hay dừng chờ.'
                },
                {
                  icon: <QrCode className="w-8 h-8 text-blue-500" />,
                  title: 'Bản đồ số Digital Twin',
                  desc: 'Giám sát hạ tầng theo thời gian thực. Cập nhật trạng thái từng vị trí đỗ chính xác đến từng giây.'
                },
                {
                  icon: <SmartphoneNfc className="w-8 h-8 text-emerald-500" />,
                  title: 'Thanh toán không tiền mặt',
                  desc: 'Tích hợp VNPay, tự động trừ tiền qua mã QR. Khách hàng dễ dàng xuất bến mà không cần tiền mặt.'
                }
              ].map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="glass-card p-8 rounded-[2rem] hover:-translate-y-2 transition-all duration-300 border border-slate-100/60 bg-white/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] group cursor-default"
                >
                  <motion.div 
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-2xl bg-white shadow-lg shadow-slate-200/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                  >
                    {feat.icon}
                  </motion.div>
                  <h3 className="text-xl font-display font-extrabold text-slate-900 mb-3">{feat.title}</h3>
                  <p className="text-slate-500/90 leading-relaxed font-semibold text-sm">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-32 bg-white/40 border-t border-slate-200/40 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-24">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight mb-6"
              >
                Quy trình <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">tối giản</span>
              </motion.h2>
              <p className="text-slate-500 text-lg font-medium">Chỉ với 3 bước đơn giản, mọi thủ tục gửi xe của bạn sẽ được hoàn tất hoàn toàn tự động.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Animated Connecting Line */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-slate-100 overflow-hidden rounded-full">
                <motion.div 
                  className="w-1/3 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              
              {[
                { step: '01', title: 'Đặt chỗ trước', desc: 'Chọn bãi đỗ và vị trí thông qua bản đồ trực tuyến ngay trên điện thoại.' },
                { step: '02', title: 'Quét & Nhận diện', desc: 'Hệ thống Camera AI tại cổng sẽ tự động nhận diện biển số và cấp quyền truy cập.' },
                { step: '03', title: 'Tự động thanh toán', desc: 'Khi xe ra, hệ thống tự đối soát thời gian và trừ tiền tự động.' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative text-center group"
                >
                  <div className="relative w-24 h-24 mx-auto mb-8 z-10">
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-blue-400/40"
                      animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
                    />
                    <div className="absolute inset-0 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] group-hover:border-blue-200 group-hover:shadow-blue-500/20 group-hover:scale-110 transition-all duration-500 bg-clip-padding">
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 font-display">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight text-slate-900">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed px-4 text-sm font-medium">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden bg-white/70 border-t border-slate-200/40 backdrop-blur-md">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white/80 to-white pointer-events-none"></div>
          
          {/* Animated Blob Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="w-[800px] h-[800px] bg-gradient-to-tr from-blue-400/20 to-indigo-400/15 blur-[100px] rounded-[40%_60%_70%_30%]"
            />
          </div>
          
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-[56px] leading-[1.1] font-black text-slate-900 mb-8 tracking-tight font-display"
            >
              Sẵn sàng trải nghiệm bãi đỗ xe của <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">tương lai?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium"
            >
              Hàng ngàn khách hàng đã chuyển sang hệ thống quản lý thông minh. Tham gia mạng lưới của chúng tôi ngay hôm nay.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => {
                  if (hasActiveSessions()) {
                    setShowActiveWarning(true);
                  } else {
                    navigate('/reserve');
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all duration-300 font-extrabold py-5 px-12 rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/25 cursor-pointer relative overflow-hidden group"
              >
                <span className="relative z-10">Bắt đầu Đặt chỗ</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Elegant Footer */}
      <footer className="py-20 border-t border-slate-200/60 bg-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <BrandLogo size="md" asLink />
            <div className="flex gap-12">
              <a className="text-slate-400 hover:text-blue-600 text-xs font-bold uppercase tracking-widest transition-colors" href="#">Kiến trúc</a>
              <a className="text-slate-400 hover:text-blue-600 text-xs font-bold uppercase tracking-widest transition-colors" href="#">Mạng lưới</a>
              <a className="text-slate-400 hover:text-blue-600 text-xs font-bold uppercase tracking-widest transition-colors" href="#">Bảo mật</a>
            </div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.1em]">
              © 2026 Thiết kế bởi PM System Global.
            </p>
          </div>
        </div>
      </footer>
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
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent blur-xl rounded-full" />
              
              <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-3xl text-red-500 font-bold">warning</span>
              </div>
              
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug mb-2">
                Phiên đỗ đang hoạt động
              </h3>
              
              <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-8 px-2">
                Bạn đang có một phiên đỗ xe chưa kết thúc (xe chưa ra khỏi bãi). Vui lòng hoàn tất thanh toán lối ra cho xe hiện tại trước khi thực hiện đặt chỗ mới.
              </p>
              
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={() => {
                    setShowActiveWarning(false);
                    navigate('/active-session');
                  }}
                  className="w-full bg-slate-950 hover:bg-slate-900 active:scale-[0.98] text-white font-extrabold py-3.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  Xem phiên đỗ hiện tại
                </button>
                <button
                  onClick={() => {
                    setShowActiveWarning(false);
                    navigate('/reserve', { state: { bypassActiveCheck: true } });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold py-3.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">directions_car</span>
                  Đặt chỗ cho xe khác
                </button>
                <button
                  onClick={() => setShowActiveWarning(false)}
                  className="w-full hover:bg-slate-50 text-slate-500 font-extrabold py-3 rounded-full text-[10px] uppercase tracking-wider transition-all cursor-pointer"
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

export default LandingPage;
