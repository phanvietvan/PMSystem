import { motion } from 'framer-motion';
import { MapPin, Navigation, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const NavigationPage = () => {
  const navigate = useNavigate();

  const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';
  const selectedLevel = localStorage.getItem('selectedLevel') || '3';

  const getSlotCoords = (slotId: string) => {
    const prefix = slotId.charAt(0);
    const num = parseInt(slotId.substring(1), 10);
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

  const westPrefix = selectedLevel === '1' ? 'A' : selectedLevel === '2' ? 'C' : 'E';
  const eastPrefix = selectedLevel === '1' ? 'B' : selectedLevel === '2' ? 'D' : 'F';

  const westSlots = Array.from({ length: 10 }, (_, i) => `${westPrefix}${i + 1}`);
  const eastSlots = Array.from({ length: 10 }, (_, i) => `${eastPrefix}${i + 1}`);

  const pathD = `M 40 250 L ${targetCoords.centerX} 250 L ${targetCoords.centerX} ${targetCoords.isRow1 ? 160 : 340}`;

  return (
    <div className="min-h-screen bg-mesh-gradient text-[#191c1e] selection:bg-blue-500/10">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 relative z-10 space-y-6">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-blue-500/5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Navigation className="text-blue-600 w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">Chỉ đường tới ô đỗ</h2>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">
                  {`Tầng ${selectedLevel.padStart(2, '0')} • Ô ${selectedSlot}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/active-session')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-200 transition-all cursor-pointer"
            >
              Xem phiên đang đỗ
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-100 rounded-3xl aspect-[16/10] relative overflow-hidden border border-slate-200/50">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 500">
              <rect x="30" y="220" width="740" height="60" rx="10" fill="#e2e8f0" opacity="0.6" />

              <rect x="345" y="180" width="110" height="140" rx="15" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              <text x="400" y="245" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b" letterSpacing="1">
                SẢNH THANG
              </text>
              <text x="400" y="260" textAnchor="middle" fontSize="8" fill="#94a3b8">
                LIFT & STAIRS
              </text>

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

              <motion.path
                d={pathD}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="8 8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />

              <motion.circle
                r="6"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
                animate={{
                  cx: [40, targetCoords.centerX, targetCoords.centerX],
                  cy: [250, 250, targetCoords.isRow1 ? 160 : 340],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />

              <g transform={`translate(${targetCoords.centerX - 12}, ${targetCoords.centerY - 25})`}>
                <MapPin className="text-amber-500 w-6 h-6 animate-bounce" style={{ color: '#f59e0b' }} />
              </g>
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NavigationPage;
