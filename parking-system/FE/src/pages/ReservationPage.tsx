import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ParkingMap from '../components/navigation/ParkingMap';
import { ArrowRight, Calendar, Clock, MapPin, Info, Map, Layers, Compass, Cpu, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { addActiveQr } from '../utils/auth';

const ReservationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromStatus = location.state?.fromStatus || false;
  const [, setUser] = useState<any>(null);

  const defaultLots = [
    { id: 1, name: "Landmark 81 - Bãi đỗ A1", latitude: "10.7949", longitude: "106.7218", floor: "Tầng 1", block: "Block A" },
    { id: 2, name: "Bitexco Financial - Bãi đỗ B2", latitude: "10.7717", longitude: "106.7044", floor: "Tầng 2", block: "Block B" },
    { id: 3, name: "Vincom Center - Bãi đỗ V3", latitude: "10.7781", longitude: "106.7020", floor: "Hầm B3", block: "Block V" },
    { id: 4, name: "Saigon Centre - Bãi đỗ S1", latitude: "10.7736", longitude: "106.7013", floor: "Tầng 4", block: "Block S" },
    { id: 5, name: "Lotte Mart Q7 - Bãi đỗ L1", latitude: "10.7482", longitude: "106.7023", floor: "Hầm B1", block: "Block L" },
    { id: 6, name: "Crescent Mall Q7 - Bãi đỗ C1", latitude: "10.7287", longitude: "106.7169", floor: "Tầng G", block: "Block C" },
    { id: 7, name: "Sân bay Tân Sơn Nhất - Block A", latitude: "10.8160", longitude: "106.6630", floor: "Ga quốc tế", block: "Khu vực A" }
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

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState(() => {
    const storedParking = localStorage.getItem('selectedParking');
    let initialParkingLotId = 1;
    if (storedParking) {
      try {
        const parsed = JSON.parse(storedParking);
        const matched = parkingLots.find((p: any) => p.name === parsed.name);
        if (matched) initialParkingLotId = matched.id;
      } catch (e) {}
    }
    return {
      date: today,
      startTime: currentTime,
      licensePlate: '',
      vehicleType: 'car',
      parkingLotId: initialParkingLotId
    };
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

  const selectedParking = parkingLots.find((p: any) => p.id === formData.parkingLotId) || parkingLots[0];

  const [isSlotSelected, setIsSlotSelected] = useState(fromStatus);
  const [currentSlot, setCurrentSlot] = useState(() => localStorage.getItem('selectedSlot') || '');

  const [userVehicles, setUserVehicles] = useState<Array<{ plate: string; type: string }>>([]);
  const [activePlates, setActivePlates] = useState<Array<{ plate: string; parkingLotName: string }>>([]);

  useEffect(() => {
    const bypassActiveCheck = location.state?.bypassActiveCheck || false;

    if (!bypassActiveCheck) {
      api.get('/ParkingSessions/my-session')
        .then(res => {
          if (res.data) {
            if (res.data.hasActiveSession && res.data.session) {
              const sQrCode = res.data.session.qrCode || res.data.session.QrCode;
              if (sQrCode) {
                addActiveQr(sQrCode);
              }
            } else {
              localStorage.removeItem('activeSessionQrs');
              localStorage.removeItem('activeSessionQr');
            }
          }
        })
        .catch(err => {
          console.log('No active session on database.', err);
        });
    }

    const init = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          
          const lp = parsed.licensePlate || '';
          let parsedVehicles: Array<{ plate: string; type: string }> = [];
          if (lp.startsWith('[')) {
            parsedVehicles = JSON.parse(lp);
          } else if (lp) {
            parsedVehicles = [{ plate: lp, type: parsed.vehicleType || 'Car' }];
          }
          
          setUserVehicles(parsedVehicles);

          // Fetch active plates from BE to determine locked vehicles
          try {
            const resp = await api.get('/ParkingSessions/active-plates');
            const data: any[] = resp.data || [];
            const normalizedActive = data.map((item: any) => ({
              plate: (item.licensePlate || item.LicensePlate || '').replace(/[-. ]/g, '').toUpperCase(),
              parkingLotName: item.parkingLotName || item.ParkingLotName || ''
            }));
            setActivePlates(normalizedActive);

            // Auto-select the first available (non-active in current building) vehicle
            const currentLotName = parkingLots.find((p: any) => p.id === formData.parkingLotId)?.name || parkingLots[0].name;
            const firstAvailable = parsedVehicles.find(v => {
              const norm = v.plate.replace(/[-. ]/g, '').toUpperCase();
              return !normalizedActive.some(a => a.plate === norm && a.parkingLotName === currentLotName);
            });
            if (firstAvailable) {
              setFormData(prev => ({
                ...prev,
                licensePlate: firstAvailable.plate,
                vehicleType: firstAvailable.type.toLowerCase() === 'motorbike' ? 'bike' : firstAvailable.type.toLowerCase() === 'bicycle' ? 'bike' : firstAvailable.type.toLowerCase()
              }));
            } else if (parsedVehicles.length > 0) {
              setFormData(prev => ({ ...prev, licensePlate: 'CUSTOM', vehicleType: 'car' }));
            }
          } catch (e) {
            if (parsedVehicles.length > 0) {
              setFormData(prev => ({
                ...prev,
                licensePlate: parsedVehicles[0].plate,
                vehicleType: parsedVehicles[0].type.toLowerCase() === 'motorbike' ? 'bike' : parsedVehicles[0].type.toLowerCase() === 'bicycle' ? 'bike' : parsedVehicles[0].type.toLowerCase()
              }));
            }
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    };

    init();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('selectedParking', JSON.stringify(selectedParking));
    localStorage.setItem('reservationDate', formData.date);
    localStorage.setItem('reservationStartTime', formData.startTime);
    localStorage.setItem('reservationVehicleType', formData.vehicleType);
    localStorage.setItem('reservationLicensePlate', formData.licensePlate);
    
    if (isSlotSelected && currentSlot) {
      navigate('/payment', { state: { mode: 'reserve' } });
    } else {
      localStorage.removeItem('selectedSlot');
      localStorage.removeItem('selectedLevel');
      navigate('/status', { state: { selectedParking, fromReserve: true, bypassActiveCheck: location.state?.bypassActiveCheck } });
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-mesh-gradient text-on-surface font-sans selection:bg-primary/10 relative flex flex-col">
      <Navbar />

      {/* Floating Glowing Orbs */}
      <div className="absolute top-[-5%] left-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[700px] h-[700px] bg-indigo-500/10 blur-[200px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

      <main className="flex-1 min-h-0 relative pt-24 px-4 sm:px-6 lg:px-8 pb-6 flex flex-col justify-center overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full max-w-7xl mx-auto h-full min-h-0 pb-2">

          {/* Left Column: Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.05 }}
            className="lg:col-span-4 self-start relative"
          >
            {/* Outer Glow Outline for Form Card */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2rem] blur-2xl opacity-10 pointer-events-none"></div>

            <div className="glass-panel p-5 md:p-6 rounded-[2rem] glow-border relative overflow-hidden bg-white/85 shadow-[0_20px_50px_rgba(0,80,203,0.06)] flex flex-col">
              {/* Corner Decorative Gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/0 blur-2xl rounded-full pointer-events-none"></div>

              {/* Step Banner */}
              <header className="mb-4 shrink-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[8px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 shadow-sm">
                  <span className="w-1.2 h-1.2 rounded-full bg-blue-600 animate-ping"></span>
                  {fromStatus ? 'BƯỚC 2: HOÀN THIỆN THÔNG TIN' : 'BƯỚC 1: NHẬP THÔNG TIN'}
                </div>
                <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight leading-none mb-1">
                  Đăng ký giữ chỗ
                </h1>
                <p className="text-slate-500/90 text-[10px] font-medium leading-relaxed">
                  Thiết lập thời gian và vị trí đỗ xe thông minh chỉ trong vài giây.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="space-y-4">

                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1 flex items-center gap-1.5">
                    <Calendar size={12} className="text-blue-500" /> Ngày gửi xe
                  </label>
                  <div className="relative group">
                    <input
                      className="premium-input block w-full pl-4 pr-4 py-2.5 rounded-full border border-outline-variant focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all text-xs font-semibold cursor-pointer shadow-sm bg-white"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Time Picker */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1 flex items-center gap-1.5">
                    <Clock size={12} className="text-blue-500" /> Giờ bắt đầu
                  </label>
                  <div className="relative group">
                    <input
                      className="premium-input block w-full pl-4 pr-4 py-2.5 rounded-full border border-outline-variant focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all text-xs font-semibold cursor-pointer shadow-sm bg-white"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* License Plate selection if they have multiple */}
                {userVehicles.length > 0 ? (
                  <div className="space-y-1.5 relative">
                    <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-blue-500">credit_card</span> Chọn phương tiện gửi
                    </label>
                    <div
                      onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                      className="w-full bg-white border border-outline-variant/80 hover:border-blue-500/40 rounded-full py-2.5 px-5 text-slate-900 font-extrabold flex items-center justify-between cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-md"
                    >
                      <span className="text-xs truncate pr-2">
                        {formData.licensePlate === 'CUSTOM' || !userVehicles.some(v => v.plate === formData.licensePlate)
                          ? (formData.licensePlate === 'CUSTOM' ? '+ Nhập biển số xe khác' : (formData.licensePlate || 'Chọn xe của bạn'))
                          : `${formData.licensePlate} (${
                              userVehicles.find(v => v.plate === formData.licensePlate)?.type === 'Car' ? 'Ô tô' : 
                              userVehicles.find(v => v.plate === formData.licensePlate)?.type === 'Motorbike' ? 'Xe máy' : 'Xe đạp/Xe điện'
                            })`
                        }
                      </span>
                      <span className={`material-symbols-outlined text-[18px] text-slate-400 group-hover:text-blue-500 transition-all duration-300 ${isVehicleDropdownOpen ? 'rotate-180' : ''}`}>
                        keyboard_arrow_down
                      </span>
                    </div>

                    <AnimatePresence>
                      {isVehicleDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -12, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -12, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute z-[2500] left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100/90 max-h-56 overflow-y-auto divide-y divide-slate-50 scrollbar-thin overflow-hidden p-1.5"
                        >
                          {userVehicles.map((veh, i) => {
                            const normPlate = veh.plate.replace(/[-. ]/g, '').toUpperCase();
                            const isLocked = activePlates.some(a => a.plate === normPlate && a.parkingLotName === selectedParking.name);
                            return (
                            <div
                              key={i}
                              onClick={() => {
                                if (isLocked) return;
                                setFormData(prev => ({
                                  ...prev,
                                  licensePlate: veh.plate,
                                  vehicleType: veh.type.toLowerCase() === 'motorbike' ? 'bike' : veh.type.toLowerCase() === 'bicycle' ? 'bike' : veh.type.toLowerCase()
                                }));
                                setIsVehicleDropdownOpen(false);
                              }}
                              className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between my-0.5
                                ${isLocked
                                  ? 'opacity-50 cursor-not-allowed bg-slate-50'
                                  : formData.licensePlate === veh.plate
                                    ? 'bg-blue-50 text-blue-600 font-bold cursor-pointer hover:bg-blue-50/50'
                                    : 'text-slate-600 cursor-pointer hover:bg-blue-50/50'}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[16px]">
                                  {isLocked ? 'lock' : veh.type.toLowerCase() === 'car' ? 'directions_car' : veh.type.toLowerCase() === 'motorbike' ? 'two_wheeler' : 'pedal_bike'}
                                </span>
                                <span className={`font-extrabold text-xs ${isLocked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{veh.plate}</span>
                              </div>
                              {isLocked ? (
                                <span className="text-[8px] bg-red-50 text-red-500 font-black uppercase px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                                  <Lock size={8} /> Đang gửi
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400 font-black uppercase">
                                  {veh.type === 'Car' ? 'Ô tô' : veh.type === 'Motorbike' ? 'Xe máy' : 'Xe đạp/Xe điện'}
                                </span>
                              )}
                            </div>
                            );
                          })}
                          
                          <div
                            onClick={() => {
                              setFormData(prev => ({ ...prev, licensePlate: 'CUSTOM' }));
                              setIsVehicleDropdownOpen(false);
                            }}
                            className={`px-4 py-2.5 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-all duration-200 flex items-center gap-2.5 my-0.5
                              ${formData.licensePlate === 'CUSTOM' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">add_circle</span>
                            <span className="font-extrabold text-xs text-slate-800">+ Nhập biển số xe khác</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {(formData.licensePlate === 'CUSTOM' || !userVehicles.some(v => v.plate === formData.licensePlate)) && (
                      <div className="relative group pt-1.5 animate-fade-in-up">
                        <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">badge</span>
                        </div>
                        <input
                          className="premium-input block w-full pl-11 pr-4 py-2.5 rounded-full border border-outline-variant focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all text-xs font-semibold uppercase placeholder:text-slate-300 shadow-sm bg-white"
                          placeholder="VD: 51F-123.45"
                          type="text"
                          value={formData.licensePlate === 'CUSTOM' ? '' : formData.licensePlate}
                          onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                          required
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-blue-500">credit_card</span> Biển số xe
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                      </div>
                      <input
                        className="premium-input block w-full pl-11 pr-4 py-2.5 rounded-full border border-outline-variant focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all text-xs font-semibold uppercase placeholder:text-slate-300 shadow-sm bg-white"
                        placeholder="VD: 51F-123.45"
                        type="text"
                        value={formData.licensePlate}
                        onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Custom Parking Lot Dropdown */}
                <div className="space-y-1.5 relative">
                  <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1 flex items-center gap-1.5">
                    <MapPin size={12} className="text-blue-500" /> Chọn vị trí / bãi đỗ
                  </label>
                  {fromStatus ? (
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 px-5 text-slate-500 font-extrabold flex items-center justify-between cursor-not-allowed shadow-inner">
                      <span className="text-xs truncate pr-2">{selectedParking.name}</span>
                      <Lock size={14} className="text-slate-400" />
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-white border border-outline-variant/80 hover:border-blue-500/40 rounded-full py-2.5 px-5 text-slate-900 font-extrabold flex items-center justify-between cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-md"
                    >
                      <span className="text-xs truncate pr-2">{selectedParking.name}</span>
                      <span className={`material-symbols-outlined text-[18px] text-slate-400 group-hover:text-blue-500 transition-all duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                        keyboard_arrow_down
                      </span>
                    </div>
                  )}

                  <AnimatePresence>
                    {!fromStatus && isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute z-[2500] left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100/90 max-h-56 overflow-y-auto divide-y divide-slate-50 scrollbar-thin overflow-hidden p-1.5"
                      >
                        {parkingLots.map((lot: any) => (
                          <div
                            key={lot.id}
                            onClick={() => {
                              if (formData.parkingLotId !== lot.id) {
                                setIsSlotSelected(false);
                                setCurrentSlot('');
                              }
                              setFormData({ ...formData, parkingLotId: lot.id });
                              setIsDropdownOpen(false);
                            }}
                            className={`px-4 py-2.5 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-all duration-200 flex items-center justify-between my-0.5
                              ${formData.parkingLotId === lot.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'}`}
                          >
                            <div className="flex flex-col">
                              <span className="font-extrabold text-xs text-slate-800">{lot.name}</span>
                              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase mt-0.5">
                                <span>{lot.floor}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                <span>{lot.block}</span>
                              </div>
                            </div>
                            {formData.parkingLotId === lot.id && (
                              <span className="material-symbols-outlined text-[18px] text-blue-600 animate-scale-up">check_circle</span>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Vehicle Type Tab Selector */}
                {(userVehicles.length === 0 || formData.licensePlate === 'CUSTOM' || !userVehicles.some(v => v.plate === formData.licensePlate)) && (
                  <div className="space-y-2 animate-fade-in-up">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1">Loại phương tiện</p>

                    <div className="grid grid-cols-3 gap-2.5 p-1 bg-slate-50 border border-slate-100 rounded-2xl">
                      {['car', 'suv', 'bike'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, vehicleType: type })}
                          className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-300 gap-1 relative overflow-hidden group
                            ${formData.vehicleType === type
                              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5 font-extrabold scale-[1.03] border border-slate-100'
                              : 'text-slate-400 hover:text-slate-600 font-semibold'}`}
                        >
                          <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:scale-110">
                            {type === 'car' ? 'directions_car' : type === 'suv' ? 'airport_shuttle' : 'two_wheeler'}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold">
                            {type === 'car' ? 'Ô tô 4-7' : type === 'suv' ? 'SUV/Tải' : 'Xe máy'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtle Info alert */}
                <div className="flex items-start gap-2.5 p-3 bg-indigo-50/50 border border-indigo-100/60 rounded-2xl">
                  <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-indigo-700 leading-relaxed">
                    Hệ thống tự động đồng bộ biển số xe và loại phương tiện từ thông tin cá nhân của bạn để tối ưu thời gian thao tác.
                  </p>
                </div>

              </div>

              {/* Selected Slot Indicator */}
              {isSlotSelected && currentSlot && (
                <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-2xl mt-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center font-black shadow-sm">
                      {currentSlot}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Vị trí đã chọn</span>
                      <span className="text-xs font-black text-slate-800">{selectedParking.name}</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsSlotSelected(false);
                      setCurrentSlot('');
                    }}
                    className="text-[10px] font-bold text-slate-500 hover:text-blue-600 underline cursor-pointer"
                  >
                    Thay đổi
                  </button>
                </div>
              )}

              {/* Next Step Action Button */}
              <button
                className="group relative overflow-hidden w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] text-xs flex items-center justify-center gap-2 mt-4 shrink-0 cursor-pointer"
                type="submit"
              >
                <span className="relative z-10 uppercase tracking-widest font-black text-[10px]">
                  {isSlotSelected && currentSlot ? 'TIẾP THEO: ĐI TỚI THANH TOÁN' : 'TIẾP THEO: CHỌN VỊ TRÍ CHI TIẾT'}
                </span>
                <ArrowRight size={16} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
              </button>
            </form>
            </div>
          </motion.div>

          {/* Right Column: Sticky Live Map & Digital Twin Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.15 }}
            className="lg:col-span-8 flex flex-col h-full min-h-0 gap-6"
          >
            {/* Ultra-premium Live Map Frame (Fills remaining height) */}
            <div className="flex-1 min-h-0 relative bg-white border border-slate-100 rounded-[2.5rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden group flex flex-col">
              <div className="absolute top-4 left-4 z-50 pointer-events-none">
                <div className="glass-panel px-4 py-2 rounded-full border border-slate-200/60 shadow-lg backdrop-blur-md flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
                    <Cpu size={12} className="text-emerald-500" /> BẢN ĐỒ
                  </span>
                </div>
              </div>

              <div className="rounded-[2rem] overflow-hidden flex-1 min-h-0 relative z-10">
                <ParkingMap selectedDestination={selectedParking} allParkingLots={parkingLots} />
              </div>
            </div>

            {/* Digital Twin Dashboard Panel */}
            <div className="shrink-0 glass-panel p-5 rounded-[2rem] glow-border relative overflow-hidden bg-white/70 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100/60 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Map className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-slate-800 text-base leading-none">Thông số Bãi Đỗ Số Hóa</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mt-1.5">Giám sát hạ tầng thời gian thực</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-1">
                <div className="flex flex-col p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5">
                    <Layers size={10} className="text-blue-500" /> Tầng định vị
                  </span>
                  <span className="text-base font-extrabold text-slate-800 mt-1">{selectedParking.floor}</span>
                </div>
                <div className="flex flex-col p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5">
                    <Compass size={10} className="text-blue-500" /> Phân Khu
                  </span>
                  <span className="text-base font-extrabold text-slate-800 mt-1">{selectedParking.block}</span>
                </div>
                <div className="flex flex-col p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5">
                    <MapPin size={10} className="text-blue-500" /> Tọa độ GPS
                  </span>
                  <span className="text-xs font-black text-slate-800 mt-2.5 truncate">{selectedParking.latitude}, {selectedParking.longitude}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="shrink-0 py-3 text-center border-t border-slate-100/60 relative z-10 bg-white/20 backdrop-blur-xs">
        <p className="text-slate-400/80 text-[10px] font-bold tracking-wide">© 2026 PM System Smart Parking Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ReservationPage;
