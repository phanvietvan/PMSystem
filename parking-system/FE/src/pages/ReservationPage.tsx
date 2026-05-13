import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const ReservationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: '2024-05-13',
    startTime: '',
    licensePlate: '',
    vehicleType: 'car'
  });

  const vehicleTypes = [
    { id: 'car', label: 'Ô tô (4-7 chỗ)' },
    { id: 'suv', label: 'SUV / Bán tải' },
    { id: 'motorbike', label: 'Xe máy' },
  ];

  return (
    <div className="bg-parkintel-light font-sans text-slate-900 min-h-screen selection:bg-parkintel-blue/10">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-8 py-16 grid grid-cols-12 gap-16">
        {/* LEFT COLUMN: Reservation Form */}
        <section className="col-span-12 lg:col-span-5 xl:col-span-4">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[40px] p-12 shadow-premium border border-slate-50 relative"
          >
            <header className="mb-12">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Thông tin đặt chỗ</h1>
              <p className="text-[11px] font-extrabold text-slate-300 uppercase tracking-[0.2em] mt-3">Bước 1: Khởi tạo thông tin</p>
            </header>

            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); navigate('/status'); }}>
              {/* Date Input */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Ngày gửi xe
                </label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border-transparent border-b-slate-200 focus:border-b-parkintel-blue rounded-none py-4 px-1 text-slate-700 font-semibold text-lg transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              {/* Time Input */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Giờ bắt đầu
                </label>
                <input 
                  type="time" 
                  className="w-full bg-slate-50 border-transparent border-b-slate-200 focus:border-b-parkintel-blue rounded-none py-4 px-1 text-slate-700 font-semibold text-lg transition-all"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                />
              </div>

              {/* Plate Number Input */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Biển số xe
                </label>
                <input 
                  type="text" 
                  placeholder="51F-123.45"
                  className="w-full bg-slate-50 border-transparent border-b-slate-200 focus:border-b-parkintel-blue rounded-none py-4 px-1 text-slate-700 font-bold text-xl tracking-wider placeholder:text-slate-300 transition-all uppercase"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                />
              </div>

              {/* Vehicle Selection */}
              <div className="space-y-5 pt-4">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Loại xe
                </label>
                <div className="space-y-2">
                  {vehicleTypes.map((type) => (
                    <label key={type.id} className="vehicle-option block cursor-pointer">
                      <input 
                        type="radio" 
                        className="hidden" 
                        name="vehicle"
                        checked={formData.vehicleType === type.id}
                        onChange={() => setFormData({...formData, vehicleType: type.id})}
                      />
                      <div className="flex items-center justify-between py-5 px-6 rounded-2xl border border-slate-100 bg-white transition-all vehicle-card-premium">
                        <span className={`font-bold text-base ${formData.vehicleType === type.id ? 'text-parkintel-blue' : 'text-slate-800'}`}>
                          {type.label}
                        </span>
                        <div className={`radio-indicator w-3 h-3 rounded-full border border-slate-200 transition-all duration-300 ${formData.vehicleType === type.id ? 'border-parkintel-blue bg-parkintel-blue' : ''}`}></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Action - Hyper Premium Upgrade */}
              <button 
                type="submit"
                className="btn-premium group relative w-full mt-12 bg-gradient-to-br from-parkintel-blue via-parkintel-blue to-[#003fa4] text-white py-6 rounded-[24px] font-black text-sm tracking-[0.2em] uppercase shadow-[0_20px_40px_-10px_rgba(0,85,212,0.4)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_30px_60px_-12px_rgba(0,85,212,0.5)] active:scale-[0.96] active:translate-y-0 overflow-hidden border-t border-white/20"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Tiếp theo: Chọn vị trí
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                  </svg>
                </span>
                <div className="shimmer-effect"></div>
                {/* Subtle Glow Effect */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            </form>
          </motion.div>
        </section>

        {/* RIGHT COLUMN: Visualization & Marketing */}
        <section className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col space-y-12 relative">
          {/* Background Highlight Orbs */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-parkintel-blue/5 rounded-full blur-[100px] -z-10"></div>
          <div className="absolute top-1/2 -left-20 w-64 h-64 bg-emerald-400/5 rounded-full blur-[80px] -z-10"></div>

          <div className="flex-1 flex flex-col relative">
            <motion.header 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <div className="flex items-center space-x-3 text-parkintel-blue mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-parkintel-blue opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-parkintel-blue"></span>
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.25em]">Vị trí trung tâm: Landmark 81 Bãi đỗ A1</span>
              </div>
              <h2 className="text-[56px] leading-[1.1] font-extrabold text-slate-900 max-w-2xl tracking-tight">
                Trải nghiệm <br/>
                <span className="relative inline-block text-parkintel-blue">
                  đỗ xe thông minh
                  <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" width="300">
                    <motion.path 
                      d="M2 10C50 4 100 4 150 6C200 8 250 8 298 2" 
                      fill="none" 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                      stroke="#0055D4" 
                      strokeLinecap="round" 
                      strokeWidth="4"
                    />
                  </svg>
                </span><br/>
                một chạm.
              </h2>
              <p className="text-slate-400 mt-8 text-xl max-w-lg leading-relaxed font-medium">
                Sau khi cung cấp thông tin, hệ thống AI sẽ tự động đề xuất các vị trí tối ưu dựa trên thời gian và kích thước thực tế của xe.
              </p>
            </motion.header>

            {/* Feature Chips */}
            <div className="grid grid-cols-2 gap-8 mb-16 max-w-2xl">
              <div className="group border-l-2 border-slate-100 hover:border-parkintel-blue pl-8 py-2 transition-colors cursor-default">
                <span className="text-[10px] font-extrabold text-parkintel-blue uppercase tracking-[0.25em] mb-2 block">An Toàn</span>
                <p className="text-slate-800 font-bold text-lg group-hover:text-parkintel-blue transition-colors">Giám sát Camera AI 24/7</p>
              </div>
              <div className="group border-l-2 border-slate-100 hover:border-parkintel-blue pl-8 py-2 transition-colors cursor-default">
                <span className="text-[10px] font-extrabold text-parkintel-blue uppercase tracking-[0.25em] mb-2 block">Tiện Lợi</span>
                <p className="text-slate-800 font-bold text-lg group-hover:text-parkintel-blue transition-colors">Thanh toán tự động</p>
              </div>
            </div>

            {/* 3D Visualization Placeholder - ENHANCED HIGHLIGHT */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex-1 relative bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-premium group min-h-[400px] flex flex-col items-center justify-center"
            >
              {/* Scanning AI Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,85,212,0.02),transparent_70%)]"></div>
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-parkintel-blue/30 to-transparent z-10 shadow-[0_0_15px_rgba(0,85,212,0.5)]"
              ></motion.div>

              {/* Simplified Visual Core */}
              <div className="relative z-20 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="absolute -inset-4 bg-parkintel-blue/10 rounded-full blur-xl animate-pulse"></div>
                  <div className="w-20 h-20 rounded-3xl bg-white border border-slate-100 shadow-xl flex items-center justify-center relative">
                    <div className="w-8 h-8 border-2 border-parkintel-blue border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-[10px] mb-2">Digital Twin Active</p>
                  <p className="text-slate-400 text-sm font-bold opacity-60">Đang chờ thông tin bãi xe...</p>
                </div>
              </div>
              
              {/* Floating Badges */}
              <div className="absolute top-10 right-10 flex gap-3">
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Live AI</span>
                </div>
                <div className="bg-slate-900 text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                  <span className="text-[10px] font-black uppercase tracking-widest">Secure 128-bit</span>
                </div>
              </div>

              {/* Bottom Overlay Info */}
              <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center">
                <div className="flex space-x-12">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-widest mb-1">Hệ thống</span>
                    <span className="text-xs font-bold text-slate-400">V2.4.81</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-widest mb-1">Trạng thái</span>
                    <span className="text-xs font-bold text-slate-400 italic">Đang chờ...</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Syncing</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-parkintel-blue animate-bounce"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="max-w-[1440px] mx-auto px-8 pb-16">
        <div className="flex items-center justify-between border-t border-slate-100 pt-12">
          <div className="flex items-center space-x-16">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em] mb-1">Trạng thái bãi</span>
              <span className="text-slate-800 font-bold text-sm">84% Trống</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em] mb-1">Giờ cao điểm</span>
              <span className="text-slate-800 font-bold text-sm">17:00 - 19:00</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em] mb-1">Hỗ trợ</span>
              <span className="text-parkintel-blue font-bold text-sm tracking-wide">1900 8888</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Powered by ParkIntel AI</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ReservationPage;
