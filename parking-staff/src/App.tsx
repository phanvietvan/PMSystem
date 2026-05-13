import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ExternalLink, 
  FileText, 
  Activity, 
  Lock, 
  QrCode, 
  Keyboard, 
  CheckCircle2, 
  LogOut, 
  ShieldCheck, 
  Radio, 
  Search, 
  Bell,
  Camera,
  RefreshCw,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import WelcomeAnimation from './Welcome.json';

const App = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [scannedResult, setScannedResult] = useState<any>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recentLogs, setRecentLogs] = useState([
    { plate: '51G-624.44', status: 'Hợp lệ', time: '14:02:11', type: 'ENTRY' },
    { plate: '51F-123.45', status: 'Hợp lệ', time: '13:58:45', type: 'ENTRY' },
    { plate: '51A-999.88', status: 'Xe ra', time: '13:45:02', type: 'EXIT' },
  ]);

  // Handle Lottie import quirk
  const LottieComp = useMemo(() => {
    return (Lottie as any).default || Lottie;
  }, []);

  useEffect(() => {
    const init = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await startCamera();
      }
    };
    init();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    stopCamera();
    
    const constraints = [
      { video: { facingMode: 'user' } },
      { video: { facingMode: 'environment' } },
      { video: true }
    ];

    for (const constraint of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setHasCameraAccess(true);
          return;
        }
      } catch (err) {
        console.warn(`Failed constraint:`, constraint, err);
      }
    }
    
    setHasCameraAccess(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const simulateScan = () => {
    if (!isScanning) return;
    setIsScanning(false);
    
    setTimeout(() => {
      const mockData = {
        plate: '51G-' + Math.floor(100 + Math.random() * 900) + '.' + Math.floor(10 + Math.random() * 90),
        status: 'Hợp lệ',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        owner: 'NGUYỄN VĂN A'
      };
      
      setScannedResult(mockData);
      setRecentLogs(prev => [mockData, ...prev.slice(0, 4)]);
      
      setTimeout(() => {
        setScannedResult(null);
        setIsScanning(true);
      }, 5000);
    }, 800);
  };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen selection:bg-primary/10 overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full h-16 glass-panel-heavy border-b border-primary/5 z-50 px-12 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tighter text-on-surface">AETHER<span className="text-primary font-light">_OS</span></span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded uppercase tracking-widest">v2.5</span>
          </div>
          <nav className="hidden xl:flex gap-8 items-center h-full">
            <a className="text-primary font-bold text-[11px] tracking-premium uppercase h-16 flex items-center border-b-2 border-primary" href="#">Điều khiển</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-medium text-[11px] tracking-premium uppercase h-16 flex items-center" href="#">Hậu cần</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-medium text-[11px] tracking-premium uppercase h-16 flex items-center" href="#">An ninh</a>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,88,188,0.4)]"></span>
            <span className="text-[10px] tracking-widest text-primary font-bold uppercase">Khu vực A1 • Đang hoạt động</span>
          </div>
          <div className="flex items-center gap-1 border-l border-outline/10 pl-6">
            <button className="text-on-surface-variant hover:text-primary p-2 flex items-center">
              <Search size={18} />
            </button>
            <button className="text-on-surface-variant hover:text-primary p-2 relative flex items-center">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-error rounded-full"></span>
            </button>
          </div>
          <div className="flex items-center gap-4 pl-6 border-l border-outline/10">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold tracking-premium text-on-surface uppercase leading-none mb-0.5">Nhân viên-04</p>
              <p className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-wider">Kỹ sư trưởng</p>
            </div>
            <div className="w-9 h-9 rounded-full border border-primary/20 p-0.5 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden">
              <img 
                alt="Chief Engineer" 
                className="w-full h-full rounded-full object-cover" 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-12 min-h-screen max-w-[1920px] mx-auto">
        <div className="grid grid-cols-12 gap-8 items-stretch">
          
          {/* Left Side */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-[32px] flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold tracking-premium text-on-surface-variant uppercase">Sức chứa hiện tại</span>
                <div className="p-2 bg-primary/5 rounded-lg">
                  <BarChart3 className="text-primary" size={18} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-light text-on-surface">142</span>
                  <span className="text-sm text-on-surface-variant font-medium">/ 200 vị trí</span>
                </div>
                <div className="w-full h-1.5 bg-primary/5 mt-4 overflow-hidden rounded-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '71%' }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[32px] flex-1 flex flex-col">
              <h3 className="text-[10px] font-bold tracking-premium text-on-surface-variant uppercase mb-8 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Điều khiển hệ thống
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Mở cổng thủ công', icon: ExternalLink },
                  { label: 'Báo cáo sự cố', icon: FileText },
                  { label: 'Chẩn đoán hệ thống', icon: Activity }
                ].map((btn, i) => (
                  <button key={i} className="w-full group flex items-center justify-between p-5 rounded-2xl bg-primary/[0.02] border border-primary/5 hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                    <span className="text-xs font-bold text-on-surface-variant group-hover:text-primary uppercase tracking-widest">{btn.label}</span>
                    <btn.icon className="text-on-surface-variant/30 group-hover:text-primary transition-colors" size={16} />
                  </button>
                ))}
                <div className="mt-auto pt-10">
                  <button className="w-full bg-error/5 hover:bg-error/10 border border-error/20 p-5 rounded-2xl transition-all group">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-[10px] font-bold text-error uppercase tracking-premium">Khóa cổng khẩn cấp</span>
                      <Lock className="text-error" size={16} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Camera & Result */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-8">
            <div className="glass-panel flex-1 flex flex-col relative overflow-hidden rounded-[48px] border-primary/10 group shadow-2xl">
              {/* Live Camera Feed */}
              <div className="absolute inset-0 z-0 bg-slate-100">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* Result Overlay */}
                <AnimatePresence>
                  {!isScanning && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10"
                    />
                  )}
                </AnimatePresence>

                {!hasCameraAccess && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80">
                    <Camera className="text-slate-300" size={48} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Không có tín hiệu camera</p>
                    <button 
                      onClick={startCamera}
                      className="mt-2 text-[10px] font-bold text-primary uppercase border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/5"
                    >
                      Thử lại
                    </button>
                  </div>
                )}
              </div>

              <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-12">
                <AnimatePresence mode="wait">
                  {isScanning ? (
                    <motion.div 
                      key="scanner"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="relative w-80 h-80 cursor-pointer"
                      onClick={simulateScan}
                    >
                      {/* Premium Scanner Frame */}
                      <div className="absolute inset-0 border border-primary/30 rounded-[40px]">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-[32px]" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-[32px]" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-[32px]" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-[32px]" />
                        
                        <div className="absolute inset-12 border border-primary/20 flex items-center justify-center rounded-3xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                          <div className="scanner-line !animate-[scan_3s_ease-in-out_infinite]" />
                          <QrCode className="text-primary/5" size={80} />
                        </div>
                      </div>
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -inset-4 border border-primary/5 rounded-[48px]" 
                      />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="result"
                      initial={{ scale: 0.8, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      className="relative"
                    >
                      {/* Success Glow */}
                      <div className="absolute -inset-20 bg-primary/5 blur-[100px] rounded-full animate-pulse" />
                      
                      <div className="relative p-10 rounded-[48px] border border-white/20 text-center shadow-[0_32px_64px_-16px_rgba(0,88,188,0.4)] max-w-sm w-80 overflow-hidden bg-gradient-to-br from-[#0058bc] via-[#004bb1] to-[#003d82]">
                        {/* Decorative background circles */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />

                        <div className="w-full h-24 mb-6 flex items-center justify-center relative z-10">
                          {LottieComp && (
                            <LottieComp 
                              animationData={WelcomeAnimation} 
                              loop={false}
                              className="w-full h-full scale-110 filter brightness-200" 
                            />
                          )}
                        </div>
                        
                        <div className="relative z-10">
                          <h2 className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] mb-4">Xác thực thành công</h2>
                          <h3 className="text-3xl font-black text-white tracking-tight mb-2">{scannedResult?.plate}</h3>
                          <p className="text-xs font-bold text-white/50 uppercase tracking-widest opacity-80">{scannedResult?.owner}</p>
                          
                          <div className="mt-10 flex items-center justify-center gap-2 py-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                            <Zap size={14} className="text-white animate-pulse" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Cổng đang mở...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-16 text-center">
                  <motion.h2 
                    animate={!isScanning ? { opacity: [0.4, 1, 0.4] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`text-4xl font-light tracking-[0.5em] uppercase mb-4 ${!isScanning ? 'text-primary' : 'text-on-surface'}`}
                  >
                    {isScanning ? 'ĐANG ĐỢI' : 'ĐANG MỞ CỔNG'}
                  </motion.h2>
                  <div className="px-6 py-2 bg-primary/5 rounded-full inline-flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-primary' : 'bg-emerald-500'} animate-pulse`} />
                    <span className="text-[10px] text-primary font-black tracking-[0.2em] uppercase">
                      {isScanning ? 'Vui lòng đưa mã vào vùng quét' : 'HỆ THỐNG CỔNG ĐÃ SẴN SÀNG'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interface Footer */}
              <div className="z-20 p-8 glass-panel-heavy border-t border-primary/5 flex items-center gap-6">
                <div className="flex-1 flex items-center gap-4 bg-primary/[0.03] px-6 py-4 rounded-2xl border border-primary/10 focus-within:border-primary/30 focus-within:bg-white transition-all duration-300">
                  <Keyboard className="text-primary/30" size={18} />
                  <input 
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-bold text-sm uppercase placeholder:text-on-surface/20 tracking-widest outline-none" 
                    placeholder="NHẬP BIỂN SỐ THỦ CÔNG" 
                    type="text"
                  />
                </div>
                <button 
                  onClick={simulateScan}
                  disabled={!isScanning}
                  className="bg-primary hover:bg-[#004bb1] disabled:opacity-50 text-white px-12 py-4 rounded-2xl font-bold text-[11px] tracking-premium transition-all active:scale-[0.98] shadow-2xl shadow-primary/20 uppercase flex items-center gap-3"
                >
                  <RefreshCw size={14} className={!isScanning ? 'animate-spin' : ''} />
                  Khởi tạo
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Logs */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
            <div className="glass-panel flex-1 p-8 flex flex-col rounded-[32px]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] font-bold tracking-premium text-on-surface-variant uppercase flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Hoạt động gần đây
                </h3>
                <div className="flex items-center gap-2 px-2 py-1 bg-primary/5 rounded-md">
                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Trực tiếp</span>
                </div>
              </div>
              
              <div className="space-y-2 overflow-y-auto max-h-[500px] -mx-8 px-8">
                {recentLogs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="group py-4 border-b border-primary/[0.03] flex items-center justify-between hover:bg-primary/[0.02] -mx-4 px-4 rounded-xl transition-all"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors tracking-wider">{log.plate}</span>
                      <span className="text-[9px] text-on-surface-variant uppercase font-black tracking-tighter opacity-60">{log.status} • {log.time}</span>
                    </div>
                    <div className="p-2 bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      {log.status === 'Xe ra' ? (
                        <LogOut className="text-on-surface-variant/40" size={14} />
                      ) : (
                        <CheckCircle2 className="text-primary" size={14} />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <button className="mt-8 text-[10px] text-primary font-black tracking-premium hover:underline transition-colors uppercase flex items-center gap-2 text-left">
                <span>Xem tất cả nhật ký</span>
                <ExternalLink size={12} />
              </button>
            </div>

            <div className="glass-panel p-8 rounded-[32px] flex flex-col gap-4">
              <h3 className="text-[10px] font-bold tracking-premium text-on-surface-variant uppercase">Bảo mật hệ thống</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Giao thức</span>
                  </div>
                  <span className="text-[9px] font-black text-primary tracking-widest px-2 py-1 bg-primary/5 rounded-lg">TLS 1.3</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <Radio size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Luồng truyền</span>
                  </div>
                  <span className="text-[9px] font-black text-emerald-500 tracking-widest px-2 py-1 bg-emerald-500/5 rounded-lg">ĐÃ MÃ HÓA</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full glass-panel-heavy border-t border-primary/5 px-12 h-10 flex justify-between items-center z-50">
        <span className="text-[9px] tracking-premium text-on-surface-variant/40 uppercase font-black">© 2024 NEXUS GLOBAL TERMINAL • V2.5.81</span>
        <div className="flex gap-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
            <span className="text-[9px] tracking-premium text-on-surface-variant/60 uppercase font-bold">Độ trễ: 0.8ms</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary" size={14} />
            <span className="text-[9px] tracking-premium text-primary font-bold uppercase">Đã mã hóa</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
