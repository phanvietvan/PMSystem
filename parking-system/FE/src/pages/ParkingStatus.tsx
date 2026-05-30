import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Layers, Sparkles, ChevronDown, CheckCircle, XCircle, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { hasActiveSessions, addActiveQr } from '../utils/auth';
import api from '../services/api';

/* ─── Types ─── */
type SlotStatus = 'available' | 'occupied' | 'reserved' | 'locked';

interface ParkingSlot {
  id: string;
  status: SlotStatus;
  isBest?: boolean;
}

/* ─── Helpers ─── */
const generateSlots = (prefix: string, count: number, level: number, slotStatusMap: Record<string, SlotStatus> = {}, lockedSlots: string[] = []): ParkingSlot[] => {
  const startChar = prefix === 'A' ? 65 : 66; // 'A' or 'B'
  const offset = (level - 1) * 2;
  const actualPrefix = String.fromCharCode(startChar + offset);

  return Array.from({ length: count }, (_, i) => {
    const slotId = `${actualPrefix}${i + 1}`;
    // Real status from database. By default, it's 'available' (clean & empty).
    let status = slotStatusMap[slotId] || 'available';
    if (lockedSlots.includes(slotId)) status = 'locked';

    return {
      id: slotId,
      status,
      isBest: prefix === 'A' && ((level === 1 && i === 2) || (level === 2 && i === 4) || (level === 3 && i === 1)) && status === 'available',
    };
  });
};

const countByStatus = (slots: ParkingSlot[], s: SlotStatus) =>
  slots.filter((sl) => sl.status === s).length;

/* ─── Main Page ─── */
const ParkingStatus: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showReservePrompt, setShowReservePrompt] = useState(false);
  const [showActiveSessionWarning, setShowActiveSessionWarning] = useState(false);
  const [slotStatusMap, setSlotStatusMap] = useState<Record<string, SlotStatus>>({});
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const defaultLots = [
    { id: 1, name: "Landmark 81 - Bãi đỗ A1", floor: "Tầng 1", block: "Block A" },
    { id: 2, name: "Bitexco Financial - Bãi đỗ B2", floor: "Tầng 2", block: "Block B" },
    { id: 3, name: "Vincom Center - Bãi đỗ V3", floor: "Hầm B3", block: "Block V" },
    { id: 4, name: "Saigon Centre - Bãi đỗ S1", floor: "Tầng 4", block: "Block S" },
    { id: 5, name: "Lotte Mart Q7 - Bãi đỗ L1", floor: "Hầm B1", block: "Block L" },
    { id: 6, name: "Crescent Mall Q7 - Bãi đỗ C1", floor: "Tầng G", block: "Block C" },
    { id: 7, name: "Sân bay Tân Sơn Nhất - Block A", floor: "Ga quốc tế", block: "Khu vực A" }
  ];

  const [parkingLots, setParkingLots] = useState<any[]>(defaultLots);

  useEffect(() => {
    const loadLots = async () => {
      try {
        const response = await api.get('/ParkingLots');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setParkingLots(response.data);
        }
      } catch (e) {
        console.error('Error fetching parking lots:', e);
      }
    };
    loadLots();
  }, []);

  const [selectedParking, setSelectedParking] = useState(
    location.state?.selectedParking ||
    JSON.parse(localStorage.getItem('selectedParking') || 'null') ||
    defaultLots[0]
  );
  
  const floors = selectedParking.floors || [1, 2, 3];
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (selectedParking.floor?.includes('Tầng')) {
      const n = parseInt(selectedParking.floor.replace('Tầng ', ''));
      if (!isNaN(n) && n <= 3) setSelectedLevel(n);
    }
  }, [selectedParking.floor]);

  // Fetch actual occupied/reserved slots and parking lot configs from BE
  useEffect(() => {
    const fetchStatus = () => {
      api.get(`/ParkingSessions/slots-status?parkingLotName=${encodeURIComponent(selectedParking.name)}`)
        .then(res => {
          if (res.data) setSlotStatusMap(res.data);
        })
        .catch(err => console.error('Error fetching slot status map', err));

      api.get('/ParkingLots').then(res => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setParkingLots(res.data);
          setSelectedParking((prev: any) => {
            const updated = res.data.find((l: any) => l.id === prev?.id);
            if (updated) {
              localStorage.setItem('selectedParking', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      }).catch(err => console.error(err));
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [selectedParking.name]);

  // Verify and sync active session from database
  useEffect(() => {
    api.get('/ParkingSessions/my-session')
      .then(res => {
        if (res.data) {
          if (res.data.hasActiveSession && res.data.session) {
            addActiveQr(res.data.session.qrCode);
          } else {
            localStorage.removeItem('activeSessionQrs');
            localStorage.removeItem('activeSessionQr');
            setShowActiveSessionWarning(false);
          }
        }
      })
      .catch(err => {
        console.log('No active session on database.', err);
      });
  }, []);

  // Clear selection on floor change
  useEffect(() => { setSelectedSlot(null); }, [selectedLevel]);

  const currentFloorCapacity = selectedParking.floorCapacities?.[selectedLevel.toString()] || selectedParking.capacity || 24;
  const capacityHalf = Math.floor(currentFloorCapacity / 2);
  const westSlots = generateSlots('A', capacityHalf, selectedLevel, slotStatusMap, selectedParking.lockedSlots || []);
  const eastSlots = generateSlots('B', capacityHalf, selectedLevel, slotStatusMap, selectedParking.lockedSlots || []);
  const allSlots = [...westSlots, ...eastSlots];
  const availableCount = countByStatus(allSlots, 'available');
  const occupiedCount = countByStatus(allSlots, 'occupied');

  const getSlotCoords = (slotId: string) => {
    const prefix = slotId.charAt(0);
    const num = parseInt(slotId.substring(1));
    const isWest = prefix.charCodeAt(0) % 2 !== 0; // Odd character codes are west zone
    
    const rowSize = Math.floor(capacityHalf / 2);
    const isRow1 = num <= rowSize;
    const colIndex = isRow1 ? num - 1 : num - rowSize - 1;

    // Dynamically adjust spacing and width to fit any capacity (SVG width is 800)
    let slotWidth = 40;
    let spacing = 52; // slotWidth + gap
    
    const availableWidth = 290; // Space on each side
    if (rowSize * spacing > availableWidth) {
      spacing = Math.floor(availableWidth / Math.max(1, rowSize));
      slotWidth = Math.max(16, spacing - (spacing > 25 ? 6 : 2)); 
    }

    const startX = 40;
    const eastStartX = 760 - ((rowSize - 1) * spacing + slotWidth);

    const x = isWest ? startX + colIndex * spacing : eastStartX + colIndex * spacing;
    const y = isRow1 ? 80 : 350;
    const centerX = x + (slotWidth / 2);
    const centerY = y + 35;

    return { x, y, centerX, centerY, isRow1, isWest, slotWidth };
  };

  const handleSlotClick = (id: string) => {
    if (slotStatusMap[id] === 'reserved') {
      showToast('Vị trí này đã có người đặt trước!', 'error');
      return;
    }
    setSelectedSlot((prev) => {
      const newSlot = prev === id ? null : id;
      if (newSlot) {
        localStorage.setItem('selectedSlot', newSlot);
        localStorage.setItem('selectedLevel', selectedLevel.toString());
      } else {
        localStorage.removeItem('selectedSlot');
      }
      return newSlot;
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-mesh-gradient text-slate-800 antialiased font-sans selection:bg-blue-500/10 flex flex-col">

      {/* ── Navbar (Fixed 80px height) ── */}
      <div className="h-20 shrink-0">
        <Navbar />
      </div>

      {/* ── Dashboard Content Layout ── */}
      <div className="flex-1 flex min-h-0 relative">

        {/* ── Sidebar (Glassmorphic, static height) ── */}
        <aside className="w-72 shrink-0 h-full bg-white/80 backdrop-blur-md border-r border-slate-200/40 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="flex flex-col gap-8">
            
            {/* Building selector */}
            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-3 ml-1">Tòa nhà</p>
              <div 
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 text-[10px] font-extrabold text-slate-900 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">apartment</span>
                  <span className="truncate pr-2">{selectedParking.name}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 shrink-0 ${isDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </div>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/30 py-2.5 z-[9999] max-h-60 overflow-y-auto"
                  >
                    {parkingLots.map((lot: any) => (
                      <div 
                        key={lot.id}
                        className={`px-4 py-3 hover:bg-blue-50/70 text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-colors flex items-center gap-2 ${
                          selectedParking.name === lot.name 
                            ? 'text-blue-600 bg-blue-50/40 font-black' 
                            : 'text-slate-600'
                        }`}
                        onClick={() => {
                          setSelectedParking(lot);
                          localStorage.setItem('selectedParking', JSON.stringify(lot));
                          setIsDropdownOpen(false);
                          setSelectedSlot(null); // Clear selected slot when changing building
                        }}
                      >
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span className="truncate">{lot.name}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Floor selector */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-3 ml-1">Chọn tầng</p>
              <div className="space-y-2">
                {floors.map((f: any) => {
                  const active = selectedLevel === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setSelectedLevel(f)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[10px] font-extrabold tracking-wide uppercase transition-all duration-300 cursor-pointer group border
                        ${active
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600/10 shadow-lg shadow-blue-500/15 scale-[1.02]'
                          : 'bg-slate-50/30 text-slate-500 border-slate-200/40 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Layers size={14} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 transition-colors'} />
                        <span>Tầng {f}</span>
                      </div>
                      {active ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      ) : (
                        <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-slate-500 transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-3 ml-1">Chú thích</p>
              <div className="bg-slate-50/30 border border-slate-200/40 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">Đang trống</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] text-slate-500">directions_car</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">Xe đang đỗ</span>
                </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">Đã đặt chỗ</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIi8+Cjxwb2x5Z29uIHBvaW50cz0iMCwwIDgsOCAwLDggOCwwIiBzdHJva2U9IiNlMmU4ZjAiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=')] opacity-50" />
                      <span className="material-symbols-outlined text-[12px] text-slate-400 z-10">lock</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">Bảo trì / Khóa</span>
                  </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Viewport Panel (Locked height, no scrolling) ── */}
        <main className="flex-1 h-full bg-slate-50/40 p-6 flex flex-col min-w-0 overflow-hidden">
          {/* Header Area */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 shrink-0 gap-4"
          >
            <div>
              <h1 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="text-blue-600 animate-pulse" size={22} /> Giám sát hạ tầng
              </h1>
              <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                <span className="material-symbols-outlined text-[14px] animate-spin text-blue-500" style={{ animationDuration: '3s' }}>sync</span>
                <p className="text-[10px] font-semibold text-slate-400/90">Hệ thống phân tích hình ảnh AI đồng bộ mỗi 2 giây.</p>
              </div>
            </div>

            {/* Quick stats (Compact style) */}
            <div className="flex gap-3">
              <div className="bg-white border border-slate-150 px-4 py-2.5 rounded-2xl shadow-sm flex flex-col min-w-[100px] transition-all duration-300">
                <span className="text-[8px] font-black uppercase tracking-wide text-slate-450">Còn trống</span>
                <span className="text-xl font-display font-black text-emerald-500 leading-none mt-1">{availableCount}</span>
              </div>
              <div className="bg-white border border-slate-150 px-4 py-2.5 rounded-2xl shadow-sm flex flex-col min-w-[100px] transition-all duration-300">
                <span className="text-[8px] font-black uppercase tracking-wide text-slate-450">Đang đỗ</span>
                <span className="text-xl font-display font-black text-slate-900 leading-none mt-1">{occupiedCount}</span>
              </div>
            </div>
          </motion.div>

          {/* Interactive Card (Fills exactly 100% of available height) */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 flex flex-col min-h-0 overflow-hidden"
          >
            {/* Card header */}
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <h2 className="text-lg font-display font-extrabold text-slate-900 tracking-tight">Mặt bằng Tầng {selectedLevel}</h2>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  {selectedParking.name.split(' - ')[0]} • {selectedParking.block}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wide border border-emerald-100/50">
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Hệ thống trực tuyến
              </div>
            </div>

            {/* SVG Interactive Map Container (Densely constrained layout) */}
            <div className="flex-1 min-h-0 bg-slate-50 border border-slate-100/60 rounded-2xl relative overflow-hidden flex items-center justify-center p-2">
              <svg className="w-full h-full max-h-full object-contain" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
                {/* Outer Road Lane background */}
                <rect x="30" y="220" width="740" height="60" rx="12" fill="#e2e8f0" opacity="0.4" />
                
                {/* Central Lobby Core (Sảnh thang máy) */}
                <rect x="345" y="180" width="110" height="140" rx="20" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                <text x="400" y="235" textAnchor="middle" fontSize="10" fontWeight="900" fill="#64748b" letterSpacing="1" className="font-sans">SẢNH THANG</text>
                <text x="400" y="250" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#94a3b8" className="font-sans">LIFT & STAIRS</text>
                
                {/* Icon symbols inside central lobby */}
                <g transform="translate(372, 270)">
                  <svg width="24" height="24" className="w-6 h-6 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 3v18M18 3v18M6 7h12M6 12h12M6 17h12" />
                  </svg>
                </g>
                <g transform="translate(406, 270)">
                  <svg width="24" height="24" className="w-6 h-6 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="4" width="14" height="16" rx="2" />
                    <path d="M9 9h2M13 9h2M9 13h2M13 13h2M9 17h6" />
                  </svg>
                </g>

                {/* West Parking Zone Slots */}
                {westSlots.map((slot) => {
                  const id = slot.id;
                  const coords = getSlotCoords(id);
                  const isSelected = selectedSlot === id;
                  const isOccupied = slot.status === 'occupied';
                  const isReserved = slot.status === 'reserved';
                  const isLocked = slot.status === 'locked';
                  const isBest = slot.isBest;

                  let fill = '#ffffff';
                  let stroke = '#e2e8f0';
                  let strokeWidth = '1.5';
                  let dashArray = '';

                  if (isSelected) {
                    fill = 'rgba(59, 130, 246, 0.08)';
                    stroke = '#2563eb';
                    strokeWidth = '2.5';
                  } else if (isLocked) {
                    fill = '#f1f5f9';
                    stroke = '#cbd5e1';
                  } else if (isOccupied) {
                    fill = '#f8fafc';
                    stroke = '#f1f5f9';
                  } else if (isReserved) {
                    fill = 'rgba(59, 130, 246, 0.02)';
                    stroke = '#3b82f6';
                    dashArray = '3 3';
                  } else if (isBest) {
                    fill = 'rgba(245, 158, 11, 0.04)';
                    stroke = '#fbbf24';
                    strokeWidth = '2';
                  }

                  return (
                    <g 
                      key={id} 
                      className={(!isOccupied && !isLocked) ? 'cursor-pointer select-none transition-all duration-200 hover:opacity-95' : 'select-none opacity-80'} 
                      onClick={(!isOccupied && !isLocked) ? () => handleSlotClick(id) : undefined}
                    >
                      {/* Slot Box */}
                      <rect 
                        x={coords.x} 
                        y={coords.y} 
                        width="40" 
                        height="70" 
                        rx="10" 
                        fill={fill} 
                        stroke={stroke} 
                        strokeWidth={strokeWidth}
                        strokeDasharray={dashArray}
                        className="transition-all duration-300"
                      />
                      {/* Slot ID Label */}
                      <text 
                        x={coords.centerX} 
                        y={coords.y + 18} 
                        textAnchor="middle" 
                        fontSize="9" 
                        fontWeight="900" 
                        fill={isSelected ? '#2563eb' : isLocked ? '#94a3b8' : isOccupied ? '#94a3b8' : isReserved ? '#3b82f6' : '#475569'}
                        className="font-sans"
                      >
                        {id}
                      </text>

                      {/* Status Details / Car icon inside slot */}
                      {isLocked ? (
                        <g transform={`translate(${coords.centerX - 10}, ${coords.y + 35})`} opacity="0.6">
                          <svg width="20" height="20" className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
                            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                          </svg>
                        </g>
                      ) : isOccupied ? (
                        <g transform={`translate(${coords.centerX - 10}, ${coords.y + 35})`} opacity="0.5">
                          <svg width="20" height="20" className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11 2 11.2 2 11.5V16c0 .6.4 1 1 1h2m10 0h2m-12 0a3 3 0 106 0M15 17a3 3 0 106 0" />
                          </svg>
                        </g>
                      ) : isReserved ? (
                        <circle cx={coords.centerX} cy={coords.y + 45} r="4" fill="#3b82f6" opacity="0.8" />
                      ) : (
                        <circle cx={coords.centerX} cy={coords.y + 45} r="4" fill="#10b981" opacity="0.8" />
                      )}

                      {/* Best position badge */}
                      {isBest && !isOccupied && !isSelected && !isLocked && (
                        <g>
                          <rect x={coords.x + 3} y={coords.y - 6} width="34" height="10" rx="3.5" fill="#fbbf24" />
                          <text x={coords.centerX} y={coords.y + 1} textAnchor="middle" fontSize="6" fontWeight="900" fill="#ffffff" className="font-sans">BEST</text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* East Parking Zone Slots */}
                {eastSlots.map((slot) => {
                  const id = slot.id;
                  const coords = getSlotCoords(id);
                  const isSelected = selectedSlot === id;
                  const isOccupied = slot.status === 'occupied';
                  const isReserved = slot.status === 'reserved';
                  const isLocked = slot.status === 'locked';
                  const isBest = slot.isBest;

                  let fill = '#ffffff';
                  let stroke = '#e2e8f0';
                  let strokeWidth = '1.5';
                  let dashArray = '';

                  if (isSelected) {
                    fill = 'rgba(59, 130, 246, 0.08)';
                    stroke = '#2563eb';
                    strokeWidth = '2.5';
                  } else if (isLocked) {
                    fill = '#f1f5f9';
                    stroke = '#cbd5e1';
                  } else if (isOccupied) {
                    fill = '#f8fafc';
                    stroke = '#f1f5f9';
                  } else if (isReserved) {
                    fill = 'rgba(59, 130, 246, 0.02)';
                    stroke = '#3b82f6';
                    dashArray = '3 3';
                  } else if (isBest) {
                    fill = 'rgba(245, 158, 11, 0.04)';
                    stroke = '#fbbf24';
                    strokeWidth = '2';
                  }

                  return (
                    <g 
                      key={id} 
                      className={(!isOccupied && !isLocked) ? 'cursor-pointer select-none transition-all duration-200 hover:opacity-95' : 'select-none opacity-80'} 
                      onClick={(!isOccupied && !isLocked) ? () => handleSlotClick(id) : undefined}
                    >
                      {/* Slot Box */}
                      <rect 
                        x={coords.x} 
                        y={coords.y} 
                        width={coords.slotWidth} 
                        height="70" 
                        rx="10" 
                        fill={fill} 
                        stroke={stroke} 
                        strokeWidth={strokeWidth}
                        strokeDasharray={dashArray}
                        className="transition-all duration-300"
                      />
                      {/* Slot ID Label */}
                      <text 
                        x={coords.centerX} 
                        y={coords.y + 18} 
                        textAnchor="middle" 
                        fontSize="9" 
                        fontWeight="900" 
                        fill={isSelected ? '#2563eb' : isLocked ? '#94a3b8' : isOccupied ? '#94a3b8' : isReserved ? '#3b82f6' : '#475569'}
                        className="font-sans"
                      >
                        {id}
                      </text>

                      {/* Status Details / Car icon inside slot */}
                      {isLocked ? (
                        <g transform={`translate(${coords.centerX - 10}, ${coords.y + 35})`} opacity="0.6">
                          <svg width="20" height="20" className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
                            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                          </svg>
                        </g>
                      ) : isOccupied ? (
                        <g transform={`translate(${coords.centerX - 10}, ${coords.y + 35})`} opacity="0.5">
                          <svg width="20" height="20" className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11 2 11.2 2 11.5V16c0 .6.4 1 1 1h2m10 0h2m-12 0a3 3 0 106 0M15 17a3 3 0 106 0" />
                          </svg>
                        </g>
                      ) : isReserved ? (
                        <circle cx={coords.centerX} cy={coords.y + 45} r="4" fill="#3b82f6" opacity="0.8" />
                      ) : (
                        <circle cx={coords.centerX} cy={coords.y + 45} r="4" fill="#10b981" opacity="0.8" />
                      )}

                      {/* Best position badge */}
                      {isBest && !isOccupied && !isSelected && !isLocked && (
                        <g>
                          <rect x={coords.centerX - 17} y={coords.y - 6} width="34" height="10" rx="3.5" fill="#fbbf24" />
                          <text x={coords.centerX} y={coords.y + 1} textAnchor="middle" fontSize="6" fontWeight="900" fill="#ffffff" className="font-sans">BEST</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center shrink-0 gap-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold uppercase tracking-wide">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                <span>Dữ liệu mã hóa 256-bit AES</span>
              </div>
            </div>
          </motion.div>
        </main>
      </div>


      {/* ── Slot Selection Bottom Sheet ── */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pointer-events-none"
          >
            <div className="bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 border border-white/10 pointer-events-auto">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-wide text-slate-400">Vị trí đã chọn</span>
                <span className="text-[11px] font-display font-black tracking-wide uppercase mt-1">Tầng {selectedLevel} • Ô {selectedSlot}</span>
              </div>
              <button
                onClick={() => {
                  const bypassActiveCheck = location.state?.bypassActiveCheck || false;
                  const isActive = hasActiveSessions();
                  if (isActive && !bypassActiveCheck) {
                    setShowActiveSessionWarning(true);
                    return;
                  }

                  localStorage.setItem('selectedSlot', selectedSlot || 'A3');
                  localStorage.setItem('selectedLevel', selectedLevel.toString());
                  
                  if (location.state?.fromReserve) {
                    navigate('/payment', { state: { mode: 'reserve' } });
                  } else {
                    navigate('/reserve', { state: { fromStatus: true } });
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full text-[9px] font-extrabold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <span>{location.state?.fromReserve ? 'Xác nhận và thanh toán' : 'Tiếp tục đăng ký xe'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reservation Prompt Modal ── */}
      <AnimatePresence>
        {showReservePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent blur-xl rounded-full" />
              
              <div className="w-16 h-16 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-3xl text-blue-500 font-bold">info</span>
              </div>
              
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug mb-2">
                Thông tin đăng ký trống
              </h3>
              
              <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-8 px-2">
                Vui lòng hoàn tất thông tin đăng ký giữ chỗ (như biển số xe, thời gian) để hệ thống ghi nhận chính xác trước khi thanh toán.
              </p>
              
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    setShowReservePrompt(false);
                    localStorage.setItem('selectedSlot', selectedSlot || 'A3');
                    localStorage.setItem('selectedLevel', selectedLevel.toString());
                    navigate('/reserve', { state: { fromStatus: true } });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold py-3.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  Nhập thông tin ngay
                </button>
                <button
                  onClick={() => setShowReservePrompt(false)}
                  className="w-full hover:bg-slate-50 text-slate-500 font-extrabold py-3.5 rounded-full text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active Session Warning Modal ── */}
      <AnimatePresence>
        {showActiveSessionWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 pointer-events-auto"
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
                    setShowActiveSessionWarning(false);
                    navigate('/active-session');
                  }}
                  className="w-full bg-slate-950 hover:bg-slate-900 active:scale-[0.98] text-white font-extrabold py-3.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  Xem phiên đỗ hiện tại
                </button>
                <button
                  onClick={() => {
                    setShowActiveSessionWarning(false);
                    navigate('/reserve', { state: { fromStatus: true, bypassActiveCheck: true } });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold py-3.5 rounded-full text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">directions_car</span>
                  Đặt chỗ cho xe khác
                </button>
                <button
                  onClick={() => setShowActiveSessionWarning(false)}
                  className="w-full hover:bg-slate-50 text-slate-500 font-extrabold py-3 rounded-full text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-8 left-1/2 z-[9999]"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100/80 bg-white/95 backdrop-blur-xl">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full ${
                toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </div>
              <p className="font-semibold text-[13px] text-slate-700 whitespace-nowrap pr-2">{toast.message}</p>
              <button 
                onClick={() => setToast(null)} 
                className="ml-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 p-1.5 rounded-full transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ParkingStatus;
