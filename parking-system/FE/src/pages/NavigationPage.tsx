import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const NavigationPage = () => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);

  const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';
  const selectedLevel = localStorage.getItem('selectedLevel') || '3';

  const handleVerifyAtSlot = () => {
    setIsVerified(true);
    setTimeout(() => {
      navigate('/active-session');
    }, 2000);
  };

  // Calculate coordinates for all slots in 800x500 viewport
  const getSlotCoords = (slotId: string) => {
    const prefix = slotId.charAt(0);
    const num = parseInt(slotId.substring(1));
    const isWest = ['A', 'C', 'E'].includes(prefix);
    const isRow1 = num <= 5;
    const colIndex = isRow1 ? num - 1 : num - 6;

    const x = isWest ? 80 + colIndex * 50 : 520 + colIndex * 50;
    const y = isRow1 ? 80 : 350;
    const centerX = x + 20;
    const centerY = y + 35;

    return { x, y, centerX, centerY, isRow1, isWest };
  };

  const targetCoords = getSlotCoords(selectedSlot);

  // Generate lists of slots for rendering
  const westPrefix = selectedLevel === '1' ? 'A' : selectedLevel === '2' ? 'C' : 'E';
  const eastPrefix = selectedLevel === '1' ? 'B' : selectedLevel === '2' ? 'D' : 'F';

  const westSlots = Array.from({ length: 10 }, (_, i) => `${westPrefix}${i + 1}`);
  const eastSlots = Array.from({ length: 10 }, (_, i) => `${eastPrefix}${i + 1}`);

  // Create the path string
  const pathD = `M 40 250 L ${targetCoords.centerX} 250 L ${targetCoords.centerX} ${targetCoords.isRow1 ? 160 : 340}`;

  return (
    <div className="min-h-screen bg-mesh-gradient text-[#191c1e] selection:bg-blue-500/10" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Direction Map */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-blue-500/5">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Navigation className="text-blue-600 w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-on-surface">Chỉ đường tới ô đỗ</h2>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">
                      Đang hướng dẫn bạn đến Tầng {selectedLevel.padStart(2, '0')} • Ô {selectedSlot}
                    </p>
                  </div>
                </div>
              </div>

              {/* Floor Plan with Path */}
              <div className="bg-slate-100 rounded-3xl aspect-[16/10] relative overflow-hidden border border-slate-200/50">
                
                {/* SVG Visual Floor Plan */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 500">
                  {/* Outer Road Lane background */}
                  <rect x="30" y="220" width="740" height="60" rx="10" fill="#e2e8f0" opacity="0.6" />
                  
                  {/* Central Lobby Core (Sảnh thang máy) */}
                  <rect x="345" y="180" width="110" height="140" rx="15" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="400" y="245" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b" letterSpacing="1">SẢNH THANG</text>
                  <text x="400" y="260" textAnchor="middle" fontSize="8" fill="#94a3b8">LIFT & STAIRS</text>

                  {/* Render West Zone Slots */}
                  {westSlots.map((id) => {
                    const coords = getSlotCoords(id);
                    const isTarget = id === selectedSlot;
                    
                    return (
                      <g key={id}>
                        <rect 
                          x={coords.x} 
                          y={coords.y} 
                          width="40" 
                          height="70" 
                          rx="8" 
                          fill={isTarget ? 'rgba(245, 158, 11, 0.15)' : '#ffffff'} 
                          stroke={isTarget ? '#f59e0b' : '#e2e8f0'} 
                          strokeWidth={isTarget ? '2.5' : '1.5'} 
                        />
                        <text 
                          x={coords.centerX} 
                          y={coords.centerY + 4} 
                          textAnchor="middle" 
                          fontSize="10" 
                          fontWeight="bold" 
                          fill={isTarget ? '#d97706' : '#94a3b8'}
                        >
                          {id}
                        </text>
                      </g>
                    );
                  })}

                  {/* Render East Zone Slots */}
                  {eastSlots.map((id) => {
                    const coords = getSlotCoords(id);
                    const isTarget = id === selectedSlot;
                    
                    return (
                      <g key={id}>
                        <rect 
                          x={coords.x} 
                          y={coords.y} 
                          width="40" 
                          height="70" 
                          rx="8" 
                          fill={isTarget ? 'rgba(245, 158, 11, 0.15)' : '#ffffff'} 
                          stroke={isTarget ? '#f59e0b' : '#e2e8f0'} 
                          strokeWidth={isTarget ? '2.5' : '1.5'} 
                        />
                        <text 
                          x={coords.centerX} 
                          y={coords.centerY + 4} 
                          textAnchor="middle" 
                          fontSize="10" 
                          fontWeight="bold" 
                          fill={isTarget ? '#d97706' : '#94a3b8'}
                        >
                          {id}
                        </text>
                      </g>
                    );
                  })}

                  {/* Animated Path from Entrance to Selected Slot */}
                  <motion.path 
                    d={pathD}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="8 8"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  />

                  {/* Animated glowing dot moving along the path */}
                  <motion.circle 
                    r="6" 
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="2"
                    animate={{ 
                      cx: [40, targetCoords.centerX, targetCoords.centerX], 
                      cy: [250, 250, targetCoords.isRow1 ? 160 : 340] 
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  />

                  {/* Pin drop on the target slot */}
                  <g transform={`translate(${targetCoords.centerX - 12}, ${targetCoords.centerY - 25})`}>
                    <MapPin className="text-amber-500 w-6 h-6 animate-bounce" style={{ color: '#f59e0b' }} />
                  </g>
                </svg>

                {/* Current Location Badge */}
                <div className="absolute bottom-6 left-6 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-lg flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                   </div>
                   <div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vị trí hiện tại</p>
                     <p className="text-xs font-bold text-slate-800">Lối vào Tầng {selectedLevel}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
              <Info className="w-5 h-5 text-blue-600 mt-1" />
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Vui lòng di chuyển xe và đỗ đúng vào ô <strong className="text-blue-600">{selectedSlot}</strong>. Sau khi đỗ xe an toàn, bấm xác nhận ở bảng bên phải để kích hoạt hệ thống giám sát an ninh AI bảo vệ xe của bạn.
              </p>
            </div>
          </div>

          {/* Right: Verification Action */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-blue-500/5 text-center">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Trạng thái đỗ xe</h3>
              
              <div className="space-y-6">
                {/* Visual Status Indicator */}
                <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center gap-3 transition-all duration-500
                  ${isVerified ? 'bg-emerald-50/50 border-emerald-200' : 'bg-blue-50/40 border-blue-100'}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm relative
                    ${isVerified ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white animate-pulse'}`}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : (
                      <ShieldCheck className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border
                      ${isVerified 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                        : 'bg-blue-100 text-blue-800 border-blue-200'}`}
                    >
                      {isVerified ? 'ĐÃ KÍCH HOẠT AN NINH' : 'ĐANG CHỜ ĐỖ XE'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-left space-y-3">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Vị trí đỗ chỉ định</span>
                    <span className="text-sm font-black text-slate-800">Tầng {selectedLevel.padStart(2, '0')} • Ô {selectedSlot}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Hệ thống an ninh AI</span>
                    <span className="text-xs text-slate-600 font-medium">Tự động kích hoạt giám sát an ninh camera SecureNode bảo vệ xe của bạn sau khi xác nhận.</span>
                  </div>
                </div>

                <button 
                  onClick={handleVerifyAtSlot}
                  disabled={isVerified}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2
                    ${isVerified 
                      ? 'bg-emerald-500 text-white shadow-emerald-200' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02] shadow-blue-200'}`}
                >
                  {isVerified ? 'ĐANG KẾT NỐI GIÁM SÁT...' : 'XÁC NHẬN ĐÃ ĐỖ AN TOÀN'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default NavigationPage;
