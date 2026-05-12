import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

import Navbar from '../components/layout/Navbar';

const ParkingStatus = () => {
  const [selectedLevel, setSelectedLevel] = useState(3);
  const levels = [6, 5, 4, 3, 2, 1];

  const zones = [
    { name: 'Zone Alpha', range: 'A', count: 12, premium: true },
    { name: 'Zone Bravo', range: 'B', count: 18, premium: false },
  ];

  return (
    <div className="min-h-screen mesh-bg font-sans antialiased text-on-surface relative overflow-x-hidden">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Live Monitoring Active</span>
            </div>
            <h1 className="text-5xl font-display font-extrabold tracking-tight mb-4 text-on-background">Trạng thái bãi xe</h1>
            <p className="text-on-surface-variant text-lg max-w-xl font-medium">Theo dõi thực tế mật độ và vị trí các ô trống trên toàn bộ hệ thống tòa nhà theo thời gian thực.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-4"
          >
            <div className="glass-panel p-5 rounded-[2rem] glow-border flex items-center gap-8 px-8 border border-white/20">
              <div className="text-center">
                <span className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Tổng dung lượng</span>
                <span className="text-3xl font-display font-extrabold">360</span>
              </div>
              <div className="w-px h-10 bg-outline-variant/30"></div>
              <div className="text-center">
                <span className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Đang trống</span>
                <span className="text-3xl font-display font-extrabold text-primary">214</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Level Selector Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="glass-panel rounded-[2.5rem] p-6 glow-border border border-white/20">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6 ml-2">Chọn tầng</h3>
              <div className="space-y-3">
                {levels.map((level) => {
                  // Mock occupancy data for demonstration
                  const occupancy = level === 1 ? 95 : level === 3 ? 40 : level === 6 ? 10 : 65;
                  const isFull = occupancy >= 90;
                  const isWarning = occupancy >= 70 && occupancy < 90;

                  return (
                    <button 
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`w-full group flex flex-col p-5 rounded-2xl transition-all duration-300 mb-3
                        ${selectedLevel === level 
                          ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                          : 'hover:bg-primary/5 text-on-surface-variant'}`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <span className="flex items-center gap-4 font-bold">
                          <span className="material-symbols-outlined text-[20px]">layers</span>
                          Tầng {level}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedLevel === level ? 'text-white/60' : 'text-outline'}`}>
                          {60 - Math.floor(60 * occupancy / 100)} Trống
                        </span>
                      </div>
                      
                      {/* Horizontal Occupancy Bar */}
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${selectedLevel === level ? 'bg-white/20' : 'bg-surface-container'}`}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${occupancy}%` }}
                          className={`h-full rounded-full ${
                            selectedLevel === level 
                              ? 'bg-white' 
                              : isFull ? 'bg-error' : isWarning ? 'bg-amber-500' : 'bg-primary'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="glass-panel rounded-[2rem] p-6 glow-border border border-white/20">
              <div className="space-y-4">
                {[
                  { label: 'Trống (Available)', color: 'border-2 border-primary/30 bg-primary/5' },
                  { label: 'Đã đỗ (Occupied)', color: 'bg-outline-variant/40' },
                  { label: 'Đã đặt (Reserved)', color: 'bg-primary shadow-lg shadow-primary/20' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-lg ${item.color}`}></div>
                    <span className="text-xs font-bold text-on-surface-variant">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Map View */}
          <div className="lg:col-span-9 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-[2.5rem] p-10 glow-border relative overflow-hidden border border-white/20"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-2xl font-display font-extrabold tracking-tight text-on-surface">Sơ đồ Tầng {selectedLevel}</h2>
                  <p className="text-xs font-medium text-on-surface-variant mt-1">Cập nhật lúc: 12:45:30 • <span className="text-primary">Tín hiệu ổn định</span></p>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-outline">
                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                  </button>
                  <button className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-outline">
                    <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedLevel}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-12"
                >
                  {zones.map((zone) => (
                    <div key={zone.name}>
                      <div className="flex items-center gap-4 mb-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{zone.name}</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent"></div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
                        {[...Array(zone.count)].map((_, i) => {
                          const id = `${zone.range}${i + 1}`;
                          const isOccupied = [1, 4, 7, 10, 15].includes(i) && !zone.premium;
                          const isReserved = i === 2 && zone.premium;
                          const isFree = !isOccupied && !isReserved;

                          return (
                            <motion.div 
                              key={id}
                              whileHover={isFree ? { y: -5, scale: 1.05 } : {}}
                              className={`group relative aspect-[3/4] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border
                                ${isOccupied ? 'bg-outline-variant/10 border-outline-variant/20 opacity-40 grayscale' : 
                                  isReserved ? 'bg-primary border-primary-fixed shadow-xl shadow-primary/20 z-10' : 
                                  'bg-white/50 border-primary/10 hover:border-primary hover:shadow-2xl hover:shadow-primary/10 cursor-pointer'}`}
                            >
                              <span className={`text-sm font-display font-extrabold ${isReserved ? 'text-white' : 'text-on-surface'}`}>{id}</span>
                              <div className="absolute top-2 left-2 flex gap-1">
                                <div className={`w-1 h-1 rounded-full ${isFree ? 'bg-primary animate-pulse' : 'bg-outline/20'}`}></div>
                              </div>
                              {zone.premium && i % 4 === 0 && (
                                <span className={`material-symbols-outlined text-[14px] absolute bottom-2 right-2 ${isReserved ? 'text-white/50' : 'text-primary/40'}`}>ev_station</span>
                              )}
                              {isOccupied && (
                                <div className="mt-2 opacity-20">
                                  <span className="material-symbols-outlined text-[24px] text-on-surface">directions_car</span>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="mt-16 bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/30 relative overflow-hidden group">
                    <div className="absolute top-4 left-6 z-10">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Real-time Visualization Feed</h4>
                    </div>
                    <div className="relative aspect-video max-h-[300px] w-full flex items-center justify-center">
                    <div className="w-full h-full bg-primary/5 rounded-3xl border border-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-primary/20">directions_car</span>
                    </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-surface-container-low"></div>
                      <div className="relative z-10 text-center">
                        <div className="animate-pulse mb-4">
                          <span className="material-symbols-outlined text-6xl text-primary/40">architecture</span>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary/60">Digital Twin Synchronized</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="bg-surface/30 backdrop-blur-md border-t border-primary/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-on-surface">
          <div className="space-y-2">
            <h3 className="text-xl font-display font-extrabold tracking-tight">ParkIntel</h3>
            <p className="text-xs text-on-surface-variant font-medium">© 2024 ParkIntel Infrastructure. Advanced AI Systems.</p>
          </div>
          <div className="flex gap-10">
            {['Privacy', 'Terms', 'Security'].map(l => (
              <a key={l} href="#" className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors tracking-widest uppercase">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ParkingStatus;
