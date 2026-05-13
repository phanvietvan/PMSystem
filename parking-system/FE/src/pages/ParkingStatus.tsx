import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Layers, Info, CheckCircle2, CarFront, Lock, Settings2, ZoomIn, ArrowRight } from 'lucide-react';

import Navbar from '../components/layout/Navbar';
import { useNavigate } from 'react-router-dom';

const ParkingStatus = () => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const levels = [1, 2, 3];

  const zones = [
    { name: 'Khu vực phía Tây', range: 'A', count: 5 },
    { name: 'Khu vực phía Đông', range: 'B', count: 5 },
  ];

  const getSlotStatus = (range: string, index: number) => {
    const seed = selectedLevel * 50 + range.charCodeAt(0) + index;
    const val = (Math.sin(seed) + 1) / 2;
    if (val > 0.75) return 'occupied';
    if (val > 0.6) return 'reserved';
    return 'available';
  };

  return (
    <div className="min-h-screen mesh-bg selection:bg-primary/10 relative">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16 relative">
        {/* Breadcrumb & Title */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-on-surface-variant font-label-caps text-[9px] mb-2">
            <span>Giám sát</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="text-primary font-bold">Trạng thái bãi đỗ</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface">Giám sát hạ tầng</h1>
              <p className="font-body-sm text-on-surface-variant mt-1 max-w-md">Hệ thống phân tích hình ảnh AI đồng bộ mỗi 2 giây.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-surface-container-lowest border border-outline-variant/30 px-4 py-2 rounded-xl flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="font-label-caps text-[8px] text-outline uppercase tracking-widest">Available</span>
                  <span className="font-display text-xl font-bold text-primary">18</span>
                </div>
                <div className="w-px h-6 bg-outline-variant/30"></div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[8px] text-outline uppercase tracking-widest">Occupied</span>
                  <span className="font-display text-xl font-bold text-on-surface">12</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Floor Selection Bar */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-xs font-bold text-on-surface">Chọn tầng</h3>
              </div>
              
              <div className="space-y-1.5">
                {levels.map((level) => {
                  const isActive = selectedLevel === level;
                  return (
                    <button 
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all duration-300
                        ${isActive 
                          ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                          : 'hover:bg-surface-container-low text-on-surface-variant'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px]
                          ${isActive ? 'bg-white/20' : 'bg-surface-container'}`}>
                          {level}
                        </span>
                        <span className="font-semibold text-xs">Tầng {level}</span>
                      </div>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-3.5 h-3.5 text-outline" />
                <span className="text-[9px] font-bold text-outline uppercase tracking-widest">Chú thích</span>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Ô đang trống', color: 'bg-emerald-500' },
                  { label: 'Xe đang đỗ', color: 'bg-slate-400' },
                  { label: 'Đã được đặt', color: 'bg-blue-400' }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-[11px] font-medium text-on-surface-variant">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Map Content Area */}
          <div className="lg:col-span-9">
            <motion.div 
              layout
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem] p-8 shadow-sm relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                    <LayoutGrid className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-on-surface">Mặt bằng Tầng {selectedLevel}</h2>
                    <p className="text-[10px] text-on-surface-variant font-medium italic">Sân bay Tân Sơn Nhất • Block A</p>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <button className="p-2.5 rounded-lg hover:bg-surface-container transition-colors text-outline">
                    <Settings2 className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 rounded-lg hover:bg-surface-container transition-colors text-outline">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Simplified Grid Map */}
              <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/20 relative">
                {/* Visual Road Center */}
                <div className="absolute top-1/2 left-0 w-full h-12 -translate-y-1/2 border-y border-dashed border-outline-variant/40 flex items-center justify-center opacity-30">
                  <div className="w-full h-px bg-outline-variant/20"></div>
                  <span className="absolute font-label-caps text-[7px] tracking-[0.3em] uppercase text-outline">Lối lưu thông chính</span>
                </div>

                <div className="relative z-10 flex flex-col gap-16">
                  {zones.map((zone) => (
                    <div key={zone.name} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="font-label-caps text-[8px] text-outline uppercase tracking-widest">{zone.name}</span>
                        <div className="h-px flex-1 bg-outline-variant/10"></div>
                      </div>

                      <div className="grid grid-cols-5 gap-3">
                        {[...Array(zone.count)].map((_, i) => {
                          const id = `${zone.range}${i + 1}`;
                          const status = getSlotStatus(zone.range, i);

                          const isRecommended = id === 'A3';

                          return (
                            <motion.div 
                              key={id}
                              onClick={() => status === 'available' && setSelectedSlot(id)}
                              whileHover={{ scale: 1.05, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                              className={`aspect-[4/5] rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-between py-3 relative
                                ${status === 'occupied' 
                                  ? 'bg-slate-50 border-slate-200 opacity-90' 
                                  : selectedSlot === id
                                  ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(59,130,246,0.3)] z-20'
                                  : status === 'reserved'
                                  ? 'bg-blue-50/50 border-blue-200 opacity-60'
                                  : isRecommended
                                  ? 'bg-amber-50 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                                  : 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-400 cursor-pointer shadow-sm'}`}
                            >
                              {isRecommended && status === 'available' && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[6px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm whitespace-nowrap z-10">
                                  Best Choice
                                </div>
                              )}
                              <span className={`text-[9px] font-black tracking-widest 
                                ${selectedSlot === id ? 'text-primary' : status === 'occupied' ? 'text-slate-400' : status === 'reserved' ? 'text-blue-400' : isRecommended ? 'text-amber-600' : 'text-emerald-500'}`}>
                                {id}
                              </span>
                              
                              <AnimatePresence>
                                {status === 'occupied' && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-slate-500"
                                  >
                                    <CarFront className="w-6 h-6 stroke-[1.5px]" />
                                  </motion.div>
                                )}
                                {status === 'reserved' && (
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-blue-500"
                                  >
                                    <Lock className="w-5 h-5 stroke-[2px]" />
                                  </motion.div>
                                )}
                                {status === 'available' && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <div className={`w-6 h-1 rounded-full ${status === 'occupied' ? 'bg-slate-300' : status === 'reserved' ? 'bg-blue-400' : 'bg-emerald-500'}`}></div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Hint */}
              <div className="mt-8 flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-lg border border-outline-variant/20 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-medium text-on-surface-variant uppercase tracking-wider">Hệ thống đang trực tuyến</span>
              </div>
              {/* Floating Action Button for Payment */}
              <AnimatePresence>
                {selectedSlot && (
                  <motion.div 
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-6 border border-white/10"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Vị trí đã chọn</span>
                      <span className="text-lg font-black tracking-tight">Tầng {selectedLevel} • Ô {selectedSlot}</span>
                    </div>
                    <button 
                      onClick={() => navigate('/payment')}
                      className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      Tiếp tục thanh toán
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="bg-surface-container-lowest border-t border-outline-variant/30 py-12 mt-12">
        <div className="max-w-container-max mx-auto px-margin-edge flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-display font-bold text-on-surface">ParkIntel</h3>
            <p className="font-body-sm text-on-surface-variant">© 2024 Intelligent Urban Mobility. All rights reserved.</p>
          </div>
          <div className="flex gap-8">
            {['Privacy', 'Terms', 'Security'].map(l => (
              <a key={l} href="#" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ParkingStatus;

