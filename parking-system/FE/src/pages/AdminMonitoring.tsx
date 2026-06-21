import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building,
  Car,
  ChevronDown,
  MapPin,
  X,
  CheckCircle,
  Calendar,
  Lock,
  Unlock,
  XCircle,
  RefreshCw,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import api from '../services/api';
import { parseLicensePlate } from '../utils/auth';

const DEFAULT_LOTS = [
  { id: 1, name: "Landmark 81 - Bãi đỗ A1", floor: "Tầng 1", block: "Block A", capacity: 24 },
  { id: 2, name: "Bitexco Financial - Bãi đỗ B2", floor: "Tầng 2", block: "Block B", capacity: 24 },
  { id: 3, name: "Vincom Center - Bãi đỗ V3", floor: "Hầm B3", block: "Block V", capacity: 18 }
];

const AdminMonitoring = () => {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [parkingLots, setParkingLots] = useState<any[]>(DEFAULT_LOTS);
  const [selectedLot, setSelectedLot] = useState(DEFAULT_LOTS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [actionModalSlot, setActionModalSlot] = useState<string | null>(null);
  const [actionModalStatus, setActionModalStatus] = useState<string>('');
  const [actionModalSession, setActionModalSession] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [newSlotInput, setNewSlotInput] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, lotsRes] = await Promise.all([
          api.get('/ParkingSessions'),
          api.get('/ParkingLots')
        ]);
        
        if (lotsRes.data && Array.isArray(lotsRes.data) && lotsRes.data.length > 0) {
          const lots = lotsRes.data.map(l => ({ ...l, capacity: l.capacity || 24 }));
          setParkingLots(lots);
          setSelectedLot(prev => lots.find(l => l.id === prev.id) || lots[0]);
        }

        if (sessionsRes.data) {
          const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : (sessionsRes.data.data || []);
          const active = sessions.filter((s: any) => s.status === 'Active');
          setActiveSessions(active);
        }
      } catch (error) {
        console.error("Error fetching monitoring data:", error);
      }
    };
    
    fetchData();
    const interval = setInterval(() => {
      api.get('/ParkingSessions').then(res => {
         if (res.data) {
           const sessions = Array.isArray(res.data) ? res.data : (res.data.data || []);
           setActiveSessions(sessions.filter((s: any) => s.status === 'Active'));
         }
      }).catch(err => console.error(err));

      api.get('/ParkingLots').then(res => {
         if (res.data && Array.isArray(res.data)) {
           setParkingLots(res.data);
           setSelectedLot(prev => {
             const updated = res.data.find((l: any) => l.id === prev?.id);
             if (updated) {
               // Update local storage too just in case
               localStorage.setItem('selectedLot', JSON.stringify(updated));
               return updated;
             }
             return prev;
           });
         }
      }).catch(err => console.error(err));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getLotStats = (lotName: string) => {
    const sessions = activeSessions.filter(s => s.parkingLotName === lotName);
    const occupied = sessions.filter(s => s.isCheckedIn).length;
    const reserved = sessions.filter(s => !s.isCheckedIn).length;
    return { occupied, reserved, total: sessions.length };
  };

  const currentLotStats = getLotStats(selectedLot.name);
  const currentLotSessions = activeSessions.filter(s => s.parkingLotName === selectedLot.name);
  const occupiedSessions = currentLotSessions.filter(s => s.isCheckedIn);
  const reservedSessions = currentLotSessions.filter(s => !s.isCheckedIn);

  const getSlotGlobalIndex = (slotName: string) => {
    const prefix = slotName.charAt(0);
    const num = parseInt(slotName.slice(1)) - 1;
    let base = 0;
    if (prefix === 'A') base = 0;
    else if (prefix === 'B') base = 10;
    else if (prefix === 'C') base = 20;
    else if (prefix === 'D') base = 30;
    else if (prefix === 'E') base = 40;
    else if (prefix === 'F') base = 50;
    return base + num;
  };

  const getSlotStatus = (slotName: string) => {
    if (selectedLot.lockedSlots?.includes(slotName)) return 'locked';

    const exactSession = currentLotSessions.find(s => s.parkingSlot === slotName);
    if (exactSession) return exactSession.isCheckedIn ? 'occupied' : 'reserved';

    return 'available';
  };
  
  const toggleSlotLock = async (slotId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isLocked = selectedLot.lockedSlots?.includes(slotId);
    try {
      if (isLocked) {
        await api.post(`/ParkingLots/${selectedLot.id}/unlock-slot/${slotId}`);
      } else {
        await api.post(`/ParkingLots/${selectedLot.id}/lock-slot/${slotId}`);
      }
      // Update local state instantly
      const updatedLockedSlots = isLocked 
        ? (selectedLot.lockedSlots || []).filter((id: string) => id !== slotId)
        : [...(selectedLot.lockedSlots || []), slotId];
        
      const updatedLot = { ...selectedLot, lockedSlots: updatedLockedSlots };
      setSelectedLot(updatedLot);
      setParkingLots(parkingLots.map(l => l.id === selectedLot.id ? updatedLot : l));
    } catch (err: any) {
      console.error("Error toggling slot lock:", err);
      alert("Lỗi khi khóa/mở khóa vị trí: " + (err.response?.data?.message || err.message));
    }
  };
  
  const getSlotSession = (slotName: string) => {
    const exactSession = currentLotSessions.find(s => s.parkingSlot === slotName);
    if (exactSession) return exactSession;

    return undefined;
  };

  const handleSlotClick = (slotId: string, status: string, session: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActionModalSlot(slotId);
    setActionModalStatus(status);
    setActionModalSession(session);
    setNewSlotInput('');
    setShowUserInfo(false);
    setShowActionModal(true);
  };

  const handleCancelSession = async () => {
    if (!actionModalSession) return;
    if (confirm('Bạn có chắc chắn muốn hủy phiên đặt chỗ này?')) {
      try {
        await api.post(`/ParkingSessions/${actionModalSession.id}/cancel`);
        alert('Hủy chỗ thành công!');
        setShowActionModal(false);
        // Force refresh sessions immediately
        api.get('/ParkingSessions').then(res => {
          if (res.data) {
            const sessions = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setActiveSessions(sessions.filter((s: any) => s.status === 'Active'));
          }
        });
      } catch (err: any) {
        alert("Lỗi khi hủy chỗ: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleChangeSlot = async () => {
    if (!actionModalSession) {
      alert("Lỗi: Không tìm thấy phiên đỗ xe này.");
      return;
    }
    if (!newSlotInput.trim()) {
      alert("Vui lòng nhập vị trí mới (ví dụ: B5) trước khi bấm Đổi.");
      return;
    }
    
    try {
      await api.post(`/ParkingSessions/${actionModalSession.id}/change-slot`, { newSlot: newSlotInput.trim().toUpperCase() });
      alert('Đổi vị trí thành công!');
      setShowActionModal(false);
      // Force refresh sessions immediately
      api.get('/ParkingSessions').then(res => {
        if (res.data) {
          const sessions = Array.isArray(res.data) ? res.data : (res.data.data || []);
          setActiveSessions(sessions.filter((s: any) => s.status === 'Active'));
        }
      });
    } catch (err: any) {
      alert("Lỗi khi đổi vị trí: " + (err.response?.data?.message || err.message));
    }
  };

  const performLockToggle = async () => {
    if (!actionModalSlot) return;
    const isLocked = actionModalStatus === 'locked';
    try {
      if (isLocked) {
        await api.post(`/ParkingLots/${selectedLot.id}/unlock-slot/${actionModalSlot}`);
      } else {
        await api.post(`/ParkingLots/${selectedLot.id}/lock-slot/${actionModalSlot}`);
      }
      const updatedLockedSlots = isLocked 
        ? (selectedLot.lockedSlots || []).filter((id: string) => id !== actionModalSlot)
        : [...(selectedLot.lockedSlots || []), actionModalSlot];
        
      const updatedLot = { ...selectedLot, lockedSlots: updatedLockedSlots };
      setSelectedLot(updatedLot);
      setParkingLots(parkingLots.map(l => l.id === selectedLot.id ? updatedLot : l));
      setShowActionModal(false);
      showToast(isLocked ? 'Đã mở khóa vị trí thành công' : 'Đã khóa vị trí thành công');
    } catch (err: any) {
      console.error("Error toggling slot lock:", err);
      showToast("Lỗi: " + (err.response?.data?.message || err.message), 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 shrink-0 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Giám sát Bãi đỗ (Live Map)</h2>
            <p className="text-sm text-slate-500 font-medium">Theo dõi thời gian thực trạng thái toàn bộ vị trí đỗ xe của hệ thống.</p>
          </div>

          <div className="relative">
            <button 
               onClick={() => setIsDropdownOpen(!isDropdownOpen)}
               className="flex items-center gap-4 bg-white border border-slate-200/80 px-6 py-3.5 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:shadow-slate-200/40 transition-all active:scale-95 group"
            >
               <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                 <Building className="w-5 h-5" />
               </div>
               <div className="text-left">
                  <div className="text-sm font-bold text-slate-900">{selectedLot.name}</div>
                  <div className="text-[10px] font-medium text-slate-500">{selectedLot.floor} • {selectedLot.block}</div>
               </div>
               <ChevronDown className={`w-5 h-5 text-slate-400 ml-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="absolute top-full right-0 mt-3 w-[360px] bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-2xl shadow-slate-200/60 border border-slate-200/50 z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-3 py-3">Chọn Tòa nhà để giám sát</h3>
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 space-y-1">
                    {parkingLots.map(lot => {
                      const stats = getLotStats(lot.name);
                      const isSelected = selectedLot.id === lot.id;
                      
                      return (
                        <div 
                          key={lot.id} 
                          onClick={() => { setSelectedLot(lot); setIsDropdownOpen(false); }}
                          className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-center gap-3 group
                            ${isSelected ? 'bg-slate-900 shadow-md' : 'hover:bg-slate-50 bg-transparent'}`}
                        >
                          <div className={`shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                             <Building className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                             <h4 className={`text-[13px] font-bold truncate mb-0.5 ${isSelected ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>{lot.name}</h4>
                             <p className={`text-[10px] truncate ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{lot.floor} • {lot.block}</p>
                          </div>

                          <div className="shrink-0 flex items-center">
                             <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                               {stats.occupied + stats.reserved}/{lot.capacity}
                             </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {/* Detailed Slot Map (Full Width) */}
          <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-200/40 h-full flex flex-col overflow-hidden relative">
            {/* Map Header */}
            <div className="p-4 px-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">{selectedLot.name}</h3>
                  <div className="flex items-center gap-4">
                     <p className="text-sm font-medium text-slate-500">Sơ đồ chi tiết ({selectedLot.capacity} vị trí / Tầng)</p>
                     
                     {/* Floor Selector */}
                     <div className="bg-slate-100/80 p-1.5 rounded-[1rem] flex items-center shadow-inner border border-slate-200/50">
                        {[1, 2, 3].map(floor => (
                           <button 
                             key={floor}
                             onClick={() => setSelectedLevel(floor)}
                             className={`px-4 py-1.5 text-[11px] font-extrabold rounded-xl transition-all ${selectedLevel === floor ? 'bg-white text-blue-600 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                           >
                             Tầng {floor}
                           </button>
                        ))}
                     </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex gap-4 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase">Trống</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase">Đã Đặt</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-100 border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase">Có Xe</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.3)]"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase">Bảo trì</span>
                  </div>
                </div>
              </div>

              {/* SVG Map Area (Exact Match with ParkingStatus) */}
              <div className="flex-1 bg-[#f8fafc] overflow-hidden relative border-y border-slate-100 flex items-center justify-center p-4">
                 <div className="w-full h-full max-w-5xl max-h-[600px] bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-200/80 relative overflow-hidden">
                    <svg viewBox="0 0 1000 600" className="w-full h-full">
                      {/* Driveway Background */}
                      <rect x="250" y="220" width="500" height="60" rx="10" fill="#f1f5f9" opacity="0.5" />
                      
                      {/* Central Lift/Stairs Core */}
                      <g transform="translate(500, 250)">
                        <rect x="-40" y="-70" width="80" height="140" rx="15" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                        <text x="0" y="-15" textAnchor="middle" fontSize="10" fontWeight="900" fill="#64748b" letterSpacing="1">SẢNH THANG</text>
                        <text x="0" y="0" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#94a3b8">LIFT & STAIRS</text>
                        
                        {/* Elevator Icon */}
                        <g transform="translate(-15, 20)">
                          <rect x="0" y="0" width="12" height="18" rx="2" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                          <line x1="6" y1="0" x2="6" y2="18" stroke="#cbd5e1" strokeWidth="1.5" />
                          <circle cx="3" cy="9" r="1" fill="#cbd5e1" />
                          <circle cx="9" cy="9" r="1" fill="#cbd5e1" />
                        </g>
                        
                        {/* Stairs Icon */}
                        <g transform="translate(5, 20)">
                          <rect x="0" y="0" width="12" height="18" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                          <line x1="0" y1="4.5" x2="12" y2="4.5" stroke="#cbd5e1" strokeWidth="1.5" />
                          <line x1="0" y1="9" x2="12" y2="9" stroke="#cbd5e1" strokeWidth="1.5" />
                          <line x1="0" y1="13.5" x2="12" y2="13.5" stroke="#cbd5e1" strokeWidth="1.5" />
                        </g>
                      </g>

                      {/* Render West Slots and East Slots based on capacity */}
                      {(() => {
                        const currentFloorCapacity = selectedLot.floorCapacities?.[selectedLevel.toString()] || selectedLot.capacity || 24;
                        const capacityHalf = Math.floor(currentFloorCapacity / 2);
                        const rowSize = Math.floor(capacityHalf / 2);
                        
                        const getSlotCoords = (slotId: string) => {
                          const prefix = slotId.charAt(0);
                          const num = parseInt(slotId.substring(1));
                          const isWest = ['A', 'C', 'E', 'G', 'I'].includes(prefix);
                          const isRow1 = num <= rowSize;
                          const colIndex = isRow1 ? num - 1 : num - rowSize - 1;

                          // Adjust spacing dynamically if rowSize > 5
                          let slotWidth = 40;
                          let spacing = 52; // slotWidth + gap
                          
                          const availableWidth = 360; // Space on each side
                          if (rowSize * spacing > availableWidth) {
                            spacing = Math.floor(availableWidth / Math.max(1, rowSize));
                            slotWidth = Math.max(16, spacing - (spacing > 25 ? 6 : 2)); 
                          }
                          
                          const startX = 60;
                          const eastStartX = 940 - ((rowSize - 1) * spacing + slotWidth);
                          
                          const x = isWest ? startX + colIndex * spacing : eastStartX + colIndex * spacing;
                          const y = isRow1 ? 80 : 350;
                          const centerX = x + (slotWidth / 2);
                          const centerY = y + 35;

                          return { x, y, centerX, centerY, isRow1, isWest, slotWidth };
                        };

                        const prefix1 = selectedLevel === 1 ? 'A' : selectedLevel === 2 ? 'C' : 'E';
                        const prefix2 = selectedLevel === 1 ? 'B' : selectedLevel === 2 ? 'D' : 'F';
                        const westSlots = Array.from({ length: capacityHalf }, (_, i) => `${prefix1}${i + 1}`);
                        const eastSlots = Array.from({ length: capacityHalf }, (_, i) => `${prefix2}${i + 1}`);
                        const allSlotsToRender = [...westSlots, ...eastSlots];

                        return allSlotsToRender.map(slotId => {
                          const status = getSlotStatus(slotId);
                          const session = getSlotSession(slotId);
                          const coords = getSlotCoords(slotId);
                          
                          const isSelected = false; 
                          const isOccupied = status === 'occupied';
                          const isReserved = status === 'reserved';
                          const isLocked = status === 'locked';
                          const isBest = slotId === 'A3'; 

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
                            <g key={slotId} className="group transition-all duration-300 cursor-pointer" onClick={(e) => handleSlotClick(slotId, status, session, e as any)}>
                               {/* Hover Tooltip trigger box */}
                               <rect x={coords.x} y={coords.y - 20} width={40} height={110} fill="transparent" />
                               
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
                               />
                               
                               {/* Slot ID Label */}
                               <text 
                                 x={coords.centerX} 
                                 y={coords.y + 18} 
                                 textAnchor="middle" 
                                 fontSize="9" 
                                 fontWeight="900" 
                                 fill={isSelected ? '#2563eb' : isLocked ? '#94a3b8' : isOccupied ? '#94a3b8' : isReserved ? '#3b82f6' : '#475569'}
                               >
                                 {slotId}
                               </text>

                               {/* Car Icon or Indicators */}
                               {isLocked ? (
                                   <g transform={`translate(${coords.centerX - 10}, ${coords.y + 35})`} opacity="0.6">
                                     <svg width="20" height="20" className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                       <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
                                       <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                     </svg>
                                   </g>
                               ) : isOccupied ? (
                                  <g transform={`translate(${coords.centerX - 10}, ${coords.y + 35})`} opacity="0.5">
                                    <svg width="20" height="20" className="text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                   <text x={coords.centerX} y={coords.y + 1} textAnchor="middle" fontSize="6" fontWeight="900" fill="#ffffff">BEST</text>
                                 </g>
                               )}

                               {/* Tooltip implementation using foreignObject */}
                               {session && (
                                  <foreignObject x={coords.centerX - 75} y={coords.isRow1 ? coords.y - 45 : coords.y + 80} width="150" height="40" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                     <div className="bg-slate-900 text-white text-[10px] font-medium px-3 py-1.5 rounded-lg text-center shadow-xl truncate">
                                        {parseLicensePlate(session.licensePlate)}<br/>
                                        <span className="text-slate-400">{session.user ? `${session.user.firstName || ''} ${session.user.lastName || ''}` : 'Khách'}</span>
                                     </div>
                                  </foreignObject>
                               )}
                            </g>
                          );
                        });
                      })()}
                    </svg>
                 </div>
              </div>
              
              {/* Summary Footer */}
              <div className="bg-white p-6 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><LayoutDashboard className="w-4 h-4"/></div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Còn Trống</p>
                          <p className="text-xl font-black text-slate-900">{selectedLot.capacity - currentLotStats.occupied - currentLotStats.reserved}</p>
                       </div>
                    </div>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Car className="w-4 h-4"/></div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Tỷ lệ lấp đầy</p>
                          <p className="text-xl font-black text-slate-900">{((currentLotStats.occupied + currentLotStats.reserved) / selectedLot.capacity * 100).toFixed(0)}%</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Modal */}
        <AnimatePresence>
          {showActionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setShowActionModal(false)}
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/20 w-full max-w-md overflow-hidden relative z-10 border border-slate-100/50"
              >
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Thao tác vị trí</h3>
                      <p className="text-xs font-bold text-slate-500">Ô đỗ xe: <span className="text-blue-600">{actionModalSlot}</span></p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowActionModal(false)} 
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</span>
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
                      actionModalStatus === 'available' ? 'bg-green-100 text-green-700' :
                      actionModalStatus === 'occupied' ? 'bg-orange-100 text-orange-700' :
                      actionModalStatus === 'reserved' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {actionModalStatus === 'available' && <><CheckCircle className="w-4 h-4" /> Trống</>}
                      {actionModalStatus === 'occupied' && <><Car className="w-4 h-4" /> Đang có xe</>}
                      {actionModalStatus === 'reserved' && <><Calendar className="w-4 h-4" /> Đã đặt chỗ</>}
                      {actionModalStatus === 'locked' && <><Lock className="w-4 h-4" /> Bảo trì</>}
                    </div>
                  </div>

                  {/* Common Action: Lock/Unlock */}
                  <button 
                    onClick={performLockToggle}
                    className={`w-full py-4 px-6 rounded-2xl font-black flex justify-center items-center gap-3 transition-all cursor-pointer ${
                      actionModalStatus === 'locked' 
                        ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200' 
                        : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    {actionModalStatus === 'locked' ? (
                      <><Unlock className="w-5 h-5" /> Mở khóa vị trí</>
                    ) : (
                      <><Lock className="w-5 h-5" /> Khóa bảo trì vị trí này</>
                    )}
                  </button>

                  {/* Actions for Reserved/Occupied Slots */}
                  {actionModalSession && (actionModalStatus === 'reserved' || actionModalStatus === 'occupied') && (
                    <div className="relative pt-6 mt-6">
                      <div className="absolute inset-0 flex items-center pointer-events-none" aria-hidden="true">
                        <div className="w-full border-t border-slate-100"></div>
                      </div>
                      <div className="relative flex justify-center pointer-events-none">
                        <span className="px-3 bg-white text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Quản lý vé đỗ
                        </span>
                      </div>

                      <div className="mt-6 space-y-4 relative z-10">
                        {/* User Info Toggle Button */}
                        {actionModalSession.user && (
                          <div className="space-y-3">
                            <button
                              onClick={() => setShowUserInfo(!showUserInfo)}
                              className="w-full py-3 px-6 rounded-xl font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-blue-100"
                            >
                              {showUserInfo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              {showUserInfo ? "Ẩn thông tin khách hàng" : "Xem thông tin người đặt"}
                            </button>
                            
                            {/* User Info Panel */}
                            {showUserInfo && (
                              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                                    {actionModalSession.user.avatarUrl && actionModalSession.user.avatarUrl !== 'null' && actionModalSession.user.avatarUrl !== 'undefined' ? (
                                      <img src={actionModalSession.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                      (actionModalSession.user.firstName?.[0] || actionModalSession.user.lastName?.[0] || actionModalSession.user.email?.[0] || "U").toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">
                                      {actionModalSession.user.firstName || actionModalSession.user.lastName 
                                        ? `${actionModalSession.user.firstName || ''} ${actionModalSession.user.lastName || ''}`.trim() 
                                        : "Khách hàng"}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium tracking-tight">Người đặt chỗ</p>
                                  </div>
                                </div>
                                <div className="space-y-2 pt-1">
                                  <div className="flex items-center gap-2.5 text-slate-600">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium">{actionModalSession.user.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2.5 text-slate-600">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium">{actionModalSession.user.phoneNumber || "Không có SĐT"}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {actionModalStatus === 'reserved' && (
                          <button 
                            onClick={async () => {
                              const sessionId = actionModalSession.id || actionModalSession.Id;
                              if (!sessionId) return showToast("Lỗi: Không tìm thấy ID phiên.", 'error');
                              if (confirm('Bạn có chắc chắn muốn hủy phiên đặt chỗ này?')) {
                                try {
                                  await api.post(`/ParkingSessions/${sessionId}/cancel`);
                                  showToast('Hủy chỗ thành công!');
                                  setShowActionModal(false);
                                  api.get('/ParkingSessions').then(res => {
                                    if (res.data) setActiveSessions(Array.isArray(res.data) ? res.data.filter((s: any) => s.status === 'Active') : []);
                                  });
                                } catch (err: any) { showToast("Lỗi khi hủy: " + err.message, 'error'); }
                              }
                            }}
                            className="w-full py-3 px-6 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <XCircle className="w-5 h-5" /> Hủy bỏ vé đặt chỗ
                          </button>
                        )}

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100/50 space-y-4 shadow-inner">
                          <div className="flex items-center gap-2 text-blue-800">
                            <RefreshCw className="w-4 h-4" />
                            <p className="text-xs font-black uppercase tracking-wider">Đổi sang vị trí khác</p>
                          </div>
                          <div className="flex gap-3">
                            <div className="relative flex-1">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                              <input 
                                type="text" 
                                placeholder="Nhập ô (VD: B5)"
                                value={newSlotInput}
                                onChange={(e) => setNewSlotInput(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 placeholder:font-medium uppercase"
                              />
                            </div>
                            <button 
                              onClick={async () => {
                                if (!newSlotInput.trim()) return showToast("Vui lòng nhập vị trí mới (VD: B5).", 'error');
                                const sessionId = actionModalSession.id || actionModalSession.Id;
                                if (!sessionId) return showToast("Lỗi: Không tìm thấy ID phiên.", 'error');
                                try {
                                  await api.post(`/ParkingSessions/${sessionId}/change-slot`, { newSlot: newSlotInput.trim().toUpperCase() });
                                  showToast('Đổi vị trí thành công!');
                                  setShowActionModal(false);
                                  api.get('/ParkingSessions').then(res => {
                                    if (res.data) setActiveSessions(Array.isArray(res.data) ? res.data.filter((s: any) => s.status === 'Active') : []);
                                  });
                                } catch (err: any) { showToast("Lỗi khi đổi vị trí: " + (err.response?.data?.message || err.message), 'error'); }
                              }}
                              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 relative z-20"
                            >
                              Đổi <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
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
              className="fixed top-8 left-1/2 z-[100]"
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

    </AdminLayout>
  );
};

export default AdminMonitoring;
