import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

/* â”€â”€â”€ Types â”€â”€â”€ */
type SlotStatus = 'available' | 'occupied' | 'reserved';

interface ParkingSlot {
  id: string;
  status: SlotStatus;
  isBest?: boolean;
}

/* â”€â”€â”€ Helpers â”€â”€â”€ */
const generateSlots = (prefix: string, count: number, level: number): ParkingSlot[] => {
  return Array.from({ length: count }, (_, i) => {
    const seed = level * 100 + prefix.charCodeAt(0) * 10 + i;
    const val = (Math.sin(seed) + 1) / 2;
    let status: SlotStatus = 'available';
    
    if (level === 1) {
      status = val > 0.8 ? 'occupied' : val > 0.65 ? 'reserved' : 'available';
    } else if (level === 2) {
      status = val > 0.7 ? 'occupied' : val > 0.55 ? 'reserved' : 'available';
    } else {
      status = val > 0.6 ? 'occupied' : val > 0.45 ? 'reserved' : 'available';
    }

    return {
      id: `${prefix}${i + 1}`,
      status,
      isBest: prefix === 'A' && ((level === 1 && i === 2) || (level === 2 && i === 4) || (level === 3 && i === 1)) && status === 'available',
    };
  });
};

const countByStatus = (slots: ParkingSlot[], s: SlotStatus) =>
  slots.filter((sl) => sl.status === s).length;

/* â”€â”€â”€ Main Page â”€â”€â”€ */
const ParkingStatus: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(true);
  const floors = [1, 2, 3];

  const selectedParking = location.state?.selectedParking ||
    JSON.parse(localStorage.getItem('selectedParking') || 'null') ||
    { name: 'Landmark 81 - Bãi đỗ A1', floor: 'Tầng 1', block: 'Block A' };

  useEffect(() => {
    if (selectedParking.floor?.includes('Tầng')) {
      const n = parseInt(selectedParking.floor.replace('Tầng ', ''));
      if (!isNaN(n) && n <= 3) setSelectedLevel(n);
    }
  }, []);

  // Clear selection on floor change
  useEffect(() => { setSelectedSlot(null); }, [selectedLevel]);

  const westSlots = generateSlots('A', 10, selectedLevel);
  const eastSlots = generateSlots('B', 10, selectedLevel);
  const allSlots = [...westSlots, ...eastSlots];
  const availableCount = countByStatus(allSlots, 'available');
  const occupiedCount = countByStatus(allSlots, 'occupied');

  const getSlotCoords = (slotId: string) => {
    const prefix = slotId.charAt(0);
    const num = parseInt(slotId.substring(1));
    const isWest = ['A', 'C', 'E', 'G', 'I'].includes(prefix); // Support west zone letters A, C, E
    const isRow1 = num <= 5;
    const colIndex = isRow1 ? num - 1 : num - 6;

    const x = isWest ? 80 + colIndex * 50 : 520 + colIndex * 50;
    const y = isRow1 ? 80 : 350;
    const centerX = x + 20;
    const centerY = y + 35;

    return { x, y, centerX, centerY, isRow1, isWest };
  };

  const handleSlotClick = (id: string) => {
    setSelectedSlot((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-mesh-gradient text-[#191c1e] selection:bg-blue-500/10" style={{ fontFamily: "'Manrope', sans-serif" }}>

      {/* â”€â”€ Navbar â”€â”€ */}
      <Navbar />

      <div className="flex pt-20 min-h-screen">

        {/* â”€â”€ Sidebar â”€â”€ */}
        <aside className="fixed left-0 top-20 h-[calc(100vh-80px)] w-72 flex flex-col z-40 bg-[#f2f4f6] border-r border-slate-200 px-6 py-8 overflow-y-auto">
          <div className="flex flex-col gap-10 flex-1">

            {/* Floor selector */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Chọn tầng</p>
              <div className="space-y-2">
                {floors.map((f) => {
                  const active = selectedLevel === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setSelectedLevel(f)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer
                        ${active
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold border-l-0'
                          : 'text-slate-500 hover:bg-slate-200 border-l-4 border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px]">layers</span>
                        <span>Floor {f}</span>
                      </div>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Chú thích</p>
              <div className="space-y-4 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[13px] text-slate-600">Đang trống</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">directions_car</span>
                  <span className="text-[13px] text-slate-600">Xe đang đỗ</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="text-[13px] text-slate-600">Đã đặt chỗ</span>
                </div>
              </div>
            </div>

            {/* Live camera */}
            <div className="mt-auto">
              <div className="rounded-xl overflow-hidden relative shadow-md group cursor-pointer">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9aimOEQ5wLjZfZRHtypgdNlnx9glMT3tzVC0xu_7xkajY9OBhfoCOmjeIg7QIK95sZbCS36PROqfppVhrOjTleWWzZFfmqVD6Ac-c-Pd8endBFgbFgGUeZZorEziDOUjVLsffXyQFmlKRXcucvGmRWiIgBaCSa3eLBM6EBCGj4VNoSEY-zwLidZFUBGHtjdPWGlOKUb8OumQs_xFynQPRf_GLMeALTu6nwwxlp8P2FqnBmK4aWcZrQp-WDT8m_1IwhmrFRGVQovU"
                  alt="Live Camera Feed"
                  className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded text-[10px] font-black text-white uppercase animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 text-center italic">Cam 04 • Gate Entrance</p>
            </div>
          </div>
        </aside>

        {/* â”€â”€ Main Content â”€â”€ */}
        <main className="ml-72 flex-1 px-8 pt-4 pb-32 w-full">
          <div className="max-w-5xl mx-auto w-full">

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row justify-between items-end mb-4 gap-6"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-[#000] mb-1 tracking-tight">Giám sát hạ tầng</h1>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="material-symbols-outlined text-[17px] animate-spin" style={{ animationDuration: '3s' }}>sync</span>
                <p className="text-[13px]">Hệ thống phân tích hình ảnh AI đồng bộ mỗi 2 giây.</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-6">
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col min-w-[130px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Còn trống</span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1">{availableCount}</span>
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col min-w-[130px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Đang đỗ</span>
                <span className="text-2xl font-extrabold text-[#000] mt-1">{occupiedCount}</span>
              </div>
            </div>
          </motion.div>

          {/* Floor Plan Card */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="bg-white rounded-3xl px-8 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100"
          >
            {/* Card header */}
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-xl font-extrabold text-[#000]">Mặt bằng Tầng {selectedLevel}</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  {selectedParking.name.split(' - ')[0]} • {selectedParking.block}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                HỆ THỐNG ĐANG TRỰC TUYẾN
              </div>
            </div>


            {/* SVG Interactive Map Container - Styled exactly like Navigation Page */}
            <div className="bg-slate-100 border border-slate-200/60 rounded-3xl relative overflow-hidden aspect-[16/10] mb-8">
              
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 500">
                {/* Outer Road Lane background */}
                <rect x="30" y="220" width="740" height="60" rx="10" fill="#e2e8f0" opacity="0.6" />
                
                {/* Central Lobby Core (Sảnh thang máy) */}
                <rect x="345" y="180" width="110" height="140" rx="15" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                <text x="400" y="235" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b" letterSpacing="1">SẢNH THANG</text>
                <text x="400" y="250" textAnchor="middle" fontSize="8" fill="#94a3b8">LIFT & STAIRS</text>
                
                {/* Icon symbols inside central lobby */}
                <g transform="translate(372, 270)">
                  <svg width="24" height="24" className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 3v18M18 3v18M6 7h12M6 12h12M6 17h12" />
                  </svg>
                </g>
                <g transform="translate(406, 270)">
                  <svg width="24" height="24" className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="4" width="14" height="16" rx="2" />
                    <path d="M9 9h2M13 9h2M9 13h2M13 13h2M9 17h6" />
                  </svg>
                </g>

                {/* West Parking Zone Slots */}
                {westSlots.map((slot) => {
                  const id = selectedLevel === 1 ? slot.id : selectedLevel === 2 ? slot.id.replace('A', 'C') : slot.id.replace('A', 'E');
                  const coords = getSlotCoords(id);
                  const isSelected = selectedSlot === id;
                  const isOccupied = slot.status === 'occupied';
                  const isReserved = slot.status === 'reserved';
                  const isBest = slot.isBest;

                  let fill = '#ffffff';
                  let stroke = '#cbd5e1';
                  let strokeWidth = '1.5';
                  let dashArray = '';

                  if (isSelected) {
                    fill = 'rgba(59, 130, 246, 0.12)';
                    stroke = '#2563eb';
                    strokeWidth = '2.5';
                  } else if (isOccupied) {
                    fill = '#f8fafc';
                    stroke = '#e2e8f0';
                  } else if (isReserved) {
                    fill = 'rgba(59, 130, 246, 0.03)';
                    stroke = '#3b82f6';
                    dashArray = '3 3';
                  } else if (isBest) {
                    fill = 'rgba(245, 158, 11, 0.08)';
                    stroke = '#fbbf24';
                    strokeWidth = '2';
                  }

                  return (
                    <g 
                      key={id} 
                      className={!isOccupied ? 'cursor-pointer select-none transition-all duration-200 hover:opacity-90' : 'select-none opacity-80'} 
                      onClick={!isOccupied ? () => handleSlotClick(id) : undefined}
                    >
                      {/* Slot Box */}
                      <rect 
                        x={coords.x} 
                        y={coords.y} 
                        width="40" 
                        height="70" 
                        rx="8" 
                        fill={fill} 
                        stroke={stroke} 
                        strokeWidth={strokeWidth}
                        strokeDasharray={dashArray}
                      />
                      {/* Slot ID Label */}
                      <text 
                        x={coords.centerX} 
                        y={coords.y + 18} 
                        textAnchor="middle" 
                        fontSize="9" 
                        fontWeight="900" 
                        fill={isSelected ? '#2563eb' : isOccupied ? '#94a3b8' : isReserved ? '#3b82f6' : '#475569'}
                      >
                        {id}
                      </text>

                      {/* Status Details / Car icon inside slot */}
                      {isOccupied ? (
                        <g transform={`translate(${coords.centerX - 10}, ${coords.y + 35})`} opacity="0.6">
                          <svg width="20" height="20" className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11 2 11.2 2 11.5V16c0 .6.4 1 1 1h2m10 0h2m-12 0a3 3 0 106 0M15 17a3 3 0 106 0" />
                          </svg>
                        </g>
                      ) : isReserved ? (
                        <circle cx={coords.centerX} cy={coords.y + 45} r="4" fill="#3b82f6" />
                      ) : (
                        <circle cx={coords.centerX} cy={coords.y + 45} r="4" fill="#10b981" />
                      )}

                      {/* Best position badge */}
                      {isBest && !isOccupied && !isSelected && (
                        <g>
                          <rect x={coords.x + 3} y={coords.y - 6} width="34" height="10" rx="3" fill="#fbbf24" />
                          <text x={coords.centerX} y={coords.y + 1} textAnchor="middle" fontSize="6" fontWeight="extrabold" fill="#ffffff">BEST</text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* East Parking Zone Slots */}
                {eastSlots.map((slot) => {
                  const id = selectedLevel === 1 ? slot.id : selectedLevel === 2 ? slot.id.replace('B', 'D') : slot.id.replace('B', 'F');
                  const coords = getSlotCoords(id);
                  const isSelected = selectedSlot === id;
                  const isOccupied = slot.status === 'occupied';
                  const isReserved = slot.status === 'reserved';
                  const isBest = slot.isBest;

                  let fill = '#ffffff';
                  let stroke = '#cbd5e1';
                  let strokeWidth = '1.5';
                  let dashArray = '';

                  if (isSelected) {
                    fill = 'rgba(59, 130, 246, 0.12)';
                    stroke = '#2563eb';
                    strokeWidth = '2.5';
                  } else if (isOccupied) {
                    fill = '#f8fafc';
                    stroke = '#e2e8f0';
                  } else if (isReserved) {
                    fill = 'rgba(59, 130, 246, 0.03)';
                    stroke = '#3b82f6';
                    dashArray = '3 3';
                  } else if (isBest) {
                    fill = 'rgba(245, 158, 11, 0.08)';
                    stroke = '#fbbf24';
                    strokeWidth = '2';
                  }

                  return (
                    <g 
                      key={id} 
                      className={!isOccupied ? 'cursor-pointer select-none transition-all duration-200 hover:opacity-90' : 'select-none opacity-80'} 
                      onClick={!isOccupied ? () => handleSlotClick(id) : undefined}
                    >
                      {/* Slot Box */}
                      <rect 
                        x={coords.x} 
                        y={coords.y} 
                        width="40" 
                        height="70" 
                        rx="8" 
                        fill={fill} 
                        stroke={stroke} 
                        strokeWidth={strokeWidth}
                        strokeDasharray={dashArray}
                      />
                      {/* Slot ID Label */}
                      <text 
                        x={coords.centerX} 
                        y={coords.y + 18} 
                        textAnchor="middle" 
                        fontSize="9" 
                        fontWeight="900" 
                        fill={isSelected ? '#2563eb' : isOccupied ? '#94a3b8' : isReserved ? '#3b82f6' : '#475569'}
                      >
                        {id}
                      </text>

                      {/* Status Details / Car icon inside slot */}
                      {isOccupied ? (
                        <g transform={`translate(${coords.centerX - 10}, ${coords.y + 35})`} opacity="0.6">
                          <svg width="20" height="20" className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11 2 11.2 2 11.5V16c0 .6.4 1 1 1h2m10 0h2m-12 0a3 3 0 106 0M15 17a3 3 0 106 0" />
                          </svg>
                        </g>
                      ) : isReserved ? (
                        <circle cx={coords.centerX} cy={coords.y + 45} r="4" fill="#3b82f6" />
                      ) : (
                        <circle cx={coords.centerX} cy={coords.y + 45} r="4" fill="#10b981" />
                      )}

                      {/* Best position badge */}
                      {isBest && !isOccupied && !isSelected && (
                        <g>
                          <rect x={coords.x + 3} y={coords.y - 6} width="34" height="10" rx="3" fill="#fbbf24" />
                          <text x={coords.centerX} y={coords.y + 1} textAnchor="middle" fontSize="6" fontWeight="extrabold" fill="#ffffff">BEST</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>


            {/* Bottom action bar */}
            <div className="mt-14 pt-7 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 rounded-xl text-[#000] text-sm font-bold hover:bg-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                  Phóng to sơ đồ
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 rounded-xl text-[#000] text-sm font-bold hover:bg-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">analytics</span>
                  Xem báo cáo ngày
                </button>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span>Dữ liệu được mã hóa 256-bit AES</span>
                <span className="material-symbols-outlined text-[15px]">lock</span>
              </div>
            </div>
          </motion.div>
          </div>
        </main>
      </div>

      {/* â”€â”€ Floating Alert Button â”€â”€ */}
      <AnimatePresence>
        {alertVisible && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <button
              onClick={() => setAlertVisible(false)}
              className="flex items-center gap-3 bg-[#131b2e] text-white px-6 py-4 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all group"
            >
              <div className="relative">
                <span className="material-symbols-outlined text-2xl">notifications_active</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#131b2e]" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold tracking-tight opacity-60">Thông báo mới nhất</p>
                <p className="font-bold text-sm">Phát hiện đỗ sai vị trí tại Khu B</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ Slot Selection Bottom Sheet â”€â”€ */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-8 pointer-events-none"
          >
            <div className="bg-slate-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-8 border border-white/10 pointer-events-auto">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Vị trí đã chọn</span>
                <span className="text-lg font-black tracking-tight">Tầng {selectedLevel} • Ô {selectedSlot}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('selectedSlot', selectedSlot || 'A3');
                  localStorage.setItem('selectedLevel', selectedLevel.toString());
                  navigate('/payment');
                }}
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                Tiếp tục thanh toán
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParkingStatus;
