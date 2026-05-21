import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ParkingMap from '../components/navigation/ParkingMap';
import { ArrowRight, Calendar, Clock, MapPin, Car, Info, Map, Layers, Compass, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReservationPage = () => {
  const navigate = useNavigate();
  const [, setUser] = useState<any>(null);

  const parkingLots = [
    { id: 1, name: "Landmark 81 - Bãi đỗ A1", latitude: "10.7949", longitude: "106.7218", floor: "Tầng 1", block: "Block A" },
    { id: 2, name: "Bitexco Financial - Bãi đỗ B2", latitude: "10.7717", longitude: "106.7044", floor: "Tầng 2", block: "Block B" },
    { id: 3, name: "Vincom Center - Bãi đỗ V3", latitude: "10.7781", longitude: "106.7020", floor: "Hầm B3", block: "Block V" },
    { id: 4, name: "Saigon Centre - Bãi đỗ S1", latitude: "10.7736", longitude: "106.7013", floor: "Tầng 4", block: "Block S" },
    { id: 5, name: "Lotte Mart Q7 - Bãi đỗ L1", latitude: "10.7482", longitude: "106.7023", floor: "Hầm B1", block: "Block L" },
    { id: 6, name: "Crescent Mall Q7 - Bãi đỗ C1", latitude: "10.7287", longitude: "106.7169", floor: "Tầng G", block: "Block C" },
    { id: 7, name: "Sân bay Tân Sơn Nhất - Block A", latitude: "10.8160", longitude: "106.6630", floor: "Ga quốc tế", block: "Khu vực A" }
  ];

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState({
    date: today,
    startTime: currentTime,
    licensePlate: '',
    vehicleType: 'car',
    parkingLotId: 1
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedParking = parkingLots.find(p => p.id === formData.parkingLotId) || parkingLots[0];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setFormData(prev => ({
          ...prev,
          licensePlate: parsed.licensePlate || '',
          vehicleType: parsed.vehicleType?.toLowerCase() || 'car'
        }));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('selectedParking', JSON.stringify(selectedParking));
    localStorage.setItem('reservationDate', formData.date);
    localStorage.setItem('reservationStartTime', formData.startTime);
    localStorage.setItem('reservationVehicleType', formData.vehicleType);
    localStorage.setItem('reservationLicensePlate', formData.licensePlate);
    navigate('/status', { state: { selectedParking } });
  };

  return (
    <div className="min-h-screen bg-mesh-gradient text-on-surface font-sans selection:bg-primary/10 relative overflow-x-hidden">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative mt-16 z-10">
        {/* Floating Glowing Orbs */}
        <div className="absolute top-[-5%] left-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-15%] w-[700px] h-[700px] bg-indigo-500/10 blur-[200px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Form Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.05 }}
            className="lg:col-span-5 xl:col-span-5 relative"
          >
            {/* Outer Glow Outline for Form Card */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-700 pointer-events-none"></div>

            <div className="glass-panel p-9 md:p-11 rounded-[3rem] glow-border relative overflow-hidden bg-white/80 shadow-[0_20px_50px_rgba(0,80,203,0.06)]">
              {/* Corner Decorative Gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/0 blur-2xl rounded-full"></div>

              {/* Step Banner */}
              <header className="mb-9">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                  BƯỚC 1: NHẬP THÔNG TIN
                </div>
                <h1 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight leading-none mb-3">
                  Đăng ký giữ chỗ
                </h1>
                <p className="text-slate-500/90 text-sm font-medium leading-relaxed">
                  Thiết lập thời gian và vị trí đỗ xe thông minh chỉ trong vài giây.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-7">
                
                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-blue-500" /> Ngày gửi xe
                  </label>
                  <div className="relative group">
                    <input 
                      className="premium-input block w-full pl-5 pr-5 py-3.5 rounded-full border border-outline-variant focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all text-sm font-semibold cursor-pointer shadow-sm bg-white" 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Time Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1.5 flex items-center gap-1.5">
                    <Clock size={13} className="text-blue-500" /> Giờ bắt đầu
                  </label>
                  <div className="relative group">
                    <input 
                      className="premium-input block w-full pl-5 pr-5 py-3.5 rounded-full border border-outline-variant focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all text-sm font-semibold cursor-pointer shadow-sm bg-white" 
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* License Plate */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-blue-500">credit_card</span> Biển số xe
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">badge</span>
                    </div>
                    <input 
                      className="premium-input block w-full pl-13 pr-5 py-3.5 rounded-full border border-outline-variant focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all text-sm font-semibold uppercase placeholder:text-slate-300 shadow-sm bg-white" 
                      placeholder="VD: 51F-123.45" 
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                      required
                    />
                  </div>
                </div>

                {/* Custom Parking Lot Dropdown */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1.5 flex items-center gap-1.5">
                    <MapPin size={13} className="text-blue-500" /> Chọn vị trí / bãi đỗ
                  </label>
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-white border border-outline-variant/80 hover:border-blue-500/40 rounded-full py-4 px-6 text-slate-900 font-extrabold flex items-center justify-between cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-md"
                  >
                    <span className="text-sm truncate pr-2">{selectedParking.name}</span>
                    <span className={`material-symbols-outlined text-[20px] text-slate-400 group-hover:text-blue-500 transition-all duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                      keyboard_arrow_down
                    </span>
                  </div>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute z-[2500] left-0 right-0 mt-3.5 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-100/90 max-h-64 overflow-y-auto divide-y divide-slate-50 scrollbar-thin overflow-hidden p-2"
                      >
                        {parkingLots.map(lot => (
                          <div 
                            key={lot.id}
                            onClick={() => {
                              setFormData({...formData, parkingLotId: lot.id});
                              setIsDropdownOpen(false);
                            }}
                            className={`px-5 py-3.5 rounded-2xl hover:bg-blue-50/50 cursor-pointer transition-all duration-200 flex items-center justify-between my-0.5
                              ${formData.parkingLotId === lot.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'}`}
                          >
                            <div className="flex flex-col">
                              <span className="font-extrabold text-sm text-slate-800">{lot.name}</span>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase mt-1">
                                <span>{lot.floor}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                <span>{lot.block}</span>
                              </div>
                            </div>
                            {formData.parkingLotId === lot.id && (
                              <span className="material-symbols-outlined text-[22px] text-blue-600 animate-scale-up">check_circle</span>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Vehicle Type Tab Selector */}
                <div className="space-y-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1.5">Loại phương tiện</p>
                  
                  <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-50 border border-slate-100 rounded-3xl">
                    {['car', 'suv', 'bike'].map((type) => (
                      <button 
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, vehicleType: type})}
                        className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-300 gap-1.5 relative overflow-hidden group
                          ${formData.vehicleType === type 
                            ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5 font-extrabold scale-[1.03] border border-slate-100' 
                            : 'text-slate-400 hover:text-slate-600 font-semibold'}`}
                      >
                        <span className="material-symbols-outlined text-[22px] transition-transform duration-300 group-hover:scale-110">
                          {type === 'car' ? 'directions_car' : type === 'suv' ? 'airport_shuttle' : 'two_wheeler'}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold">
                          {type === 'car' ? 'Ô tô 4-7' : type === 'suv' ? 'SUV/Tải' : 'Xe máy'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtle Info alert */}
                <div className="flex items-start gap-3 p-4 bg-indigo-50/50 border border-indigo-100/60 rounded-[1.5rem]">
                  <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-indigo-700 leading-relaxed">
                    Hệ thống tự động đồng bộ biển số xe và loại phương tiện từ thông tin cá nhân của bạn để tối ưu thời gian thao tác.
                  </p>
                </div>

                {/* Next Step Action Button */}
                <button 
                  className="group relative overflow-hidden w-full py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-1 active:scale-[0.98] text-sm flex items-center justify-center gap-2" 
                  type="submit"
                >
                  <span className="relative z-10 uppercase tracking-widest font-black text-xs">TIẾP THEO: CHỌN VỊ TRÍ CHI TIẾT</span>
                  <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
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
            className="lg:col-span-7 xl:col-span-7 lg:sticky lg:top-32 self-start"
          >
            <div className="flex flex-col gap-6">
              
              {/* Ultra-premium Live Map Frame */}
              <div className="relative bg-white border border-slate-100 rounded-[3rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden group">
                <div className="absolute top-4 left-4 z-50 pointer-events-none">
                  <div className="glass-panel px-4 py-2 rounded-full border border-slate-200/60 shadow-lg backdrop-blur-md flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
                      <Cpu size={12} className="text-emerald-500" /> BẢN ĐỒ KỸ THUẬT SỐ LIVE
                    </span>
                  </div>
                </div>

                <div className="rounded-[2.5rem] overflow-hidden h-[420px] relative z-10">
                  <ParkingMap selectedDestination={selectedParking} allParkingLots={parkingLots} />
                </div>
              </div>

              {/* Digital Twin Dashboard Panel */}
              <div className="glass-panel p-6 rounded-[2.5rem] glow-border relative overflow-hidden bg-white/70 shadow-sm flex flex-col gap-5">
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

            </div>
          </motion.div>

        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center border-t border-slate-100/60 mt-12 relative z-10">
        <p className="text-slate-400/80 text-xs font-bold tracking-wide">© 2024 PM System Smart Parking Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ReservationPage;
