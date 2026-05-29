import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building,
  Car,
  ChevronDown,
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
      });
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
    const exactSession = currentLotSessions.find(s => s.parkingSlot === slotName);
    if (exactSession) return exactSession.isCheckedIn ? 'occupied' : 'reserved';

    const slotIndex = getSlotGlobalIndex(slotName);
    if (slotIndex < occupiedSessions.length) return 'occupied';
    if (slotIndex < occupiedSessions.length + reservedSessions.length) return 'reserved';
    return 'available';
  };
  
  const getSlotSession = (slotName: string) => {
    const exactSession = currentLotSessions.find(s => s.parkingSlot === slotName);
    if (exactSession) return exactSession;

    const slotIndex = getSlotGlobalIndex(slotName);
    if (slotIndex < occupiedSessions.length) return occupiedSessions[slotIndex];
    if (slotIndex < occupiedSessions.length + reservedSessions.length) return reservedSessions[slotIndex - occupiedSessions.length];
    return undefined;
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

                      {/* Render West Slots (A1-A10) and East Slots (B1-B10) */}
                      {(() => {
                        const getSlotCoords = (slotId: string) => {
                          const prefix = slotId.charAt(0);
                          const num = parseInt(slotId.substring(1));
                          const isWest = ['A', 'C', 'E', 'G', 'I'].includes(prefix);
                          const isRow1 = num <= 5;
                          const colIndex = isRow1 ? num - 1 : num - 6;

                          const x = isWest ? 200 + colIndex * 50 : 550 + colIndex * 50;
                          const y = isRow1 ? 80 : 350;
                          const centerX = x + 20;
                          const centerY = y + 35;

                          return { x, y, centerX, centerY, isRow1, isWest };
                        };

                        const prefix1 = selectedLevel === 1 ? 'A' : selectedLevel === 2 ? 'C' : 'E';
                        const prefix2 = selectedLevel === 1 ? 'B' : selectedLevel === 2 ? 'D' : 'F';
                        const westSlots = Array.from({ length: 10 }, (_, i) => `${prefix1}${i + 1}`);
                        const eastSlots = Array.from({ length: 10 }, (_, i) => `${prefix2}${i + 1}`);
                        const allSlotsToRender = [...westSlots, ...eastSlots];

                        return allSlotsToRender.map(slotId => {
                          const status = getSlotStatus(slotId);
                          const session = getSlotSession(slotId);
                          const coords = getSlotCoords(slotId);
                          
                          const isSelected = false; 
                          const isOccupied = status === 'occupied';
                          const isReserved = status === 'reserved';
                          const isBest = slotId === 'A3'; 

                          let fill = '#ffffff';
                          let stroke = '#e2e8f0';
                          let strokeWidth = '1.5';
                          let dashArray = '';
                          
                          if (isSelected) {
                            fill = 'rgba(59, 130, 246, 0.08)';
                            stroke = '#2563eb';
                            strokeWidth = '2.5';
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
                            <g key={slotId} className="group transition-all duration-300">
                               {/* Hover Tooltip trigger box */}
                               <rect x={coords.x} y={coords.y - 20} width={40} height={110} fill="transparent" className="cursor-pointer" />
                               
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
                                 {slotId}
                               </text>

                               {/* Car Icon or Indicators */}
                               {isOccupied ? (
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
                               {isBest && !isOccupied && !isSelected && (
                                 <g>
                                   <rect x={coords.x + 3} y={coords.y - 6} width="34" height="10" rx="3.5" fill="#fbbf24" />
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
    </AdminLayout>
  );
};

export default AdminMonitoring;
