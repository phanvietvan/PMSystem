import BrandLogo from '../components/brand/BrandLogo';
import { motion, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLottie } from 'lottie-react';
import Navbar from '../components/layout/Navbar';
import animationData from '../components/ui/hasahar.json';

const LandingPage = () => {
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
                <Link to="/reserve" className="group relative bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 px-10 rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 active:scale-95 overflow-hidden">
                  <span className="relative z-10">Đặt chỗ ngay</span>
                  <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                  </svg>
                  {/* Subtle Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
                </Link>
                <Link to="/status" className="bg-white/60 hover:bg-white text-blue-600 font-bold py-5 px-10 rounded-full border border-blue-100 backdrop-blur-sm transition-all duration-300 text-center hover:shadow-xl hover:-translate-y-1 active:scale-95">
                  Xem Phân tích
                </Link>
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
              © 2024 Thiết kế bởi PM System Global.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
