import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ParkingMap from '../components/navigation/ParkingMap';
import { ArrowRight, Calendar, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ReservationPage = () => {
  const navigate = useNavigate();
  const [, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    date: '2024-05-13',
    startTime: '',
    licensePlate: '',
    vehicleType: 'car',
    parkingLotId: 1
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const parkingLots = [
    { id: 1, name: "Landmark 81 - Bãi đỗ A1", latitude: "10.7949", longitude: "106.7218", floor: "Tầng 1", block: "Block A" },
    { id: 2, name: "Bitexco Financial - Bãi đỗ B2", latitude: "10.7717", longitude: "106.7044", floor: "Tầng 2", block: "Block B" },
    { id: 3, name: "Vincom Center - Bãi đỗ V3", latitude: "10.7781", longitude: "106.7020", floor: "Hầm B3", block: "Block V" },
    { id: 4, name: "Saigon Centre - Bãi đỗ S1", latitude: "10.7736", longitude: "106.7013", floor: "Tầng 4", block: "Block S" },
    { id: 5, name: "Lotte Mart Q7 - Bãi đỗ L1", latitude: "10.7482", longitude: "106.7023", floor: "Hầm B1", block: "Block L" },
    { id: 6, name: "Crescent Mall Q7 - Bãi đỗ C1", latitude: "10.7287", longitude: "106.7169", floor: "Tầng G", block: "Block C" },
    { id: 7, name: "Sân bay Tân Sơn Nhất - Block A", latitude: "10.8160", longitude: "106.6630", floor: "Ga quốc tế", block: "Khu vực A" }
  ];

  const selectedParking = parkingLots.find(p => p.id === formData.parkingLotId) || parkingLots[0];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
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
    <div className="min-h-screen bg-mesh-gradient text-slate-800 font-sans selection:bg-blue-100">
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .custom-shadow {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }
        .hero-gradient {
          background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent);
        }
        input:focus {
          outline: none;
          ring: 2px;
          ring-color: rgba(59, 130, 246, 0.2);
        }
        /* Hide default browser icons for date/time */
        input::-webkit-calendar-picker-indicator {
          display: none !important;
          -webkit-appearance: none;
        }
      `}} />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 hero-gradient relative mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Reservation Form Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 xl:col-span-4"
          >
            <div className="glass-card rounded-[2.5rem] p-8 custom-shadow">
              <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Thông tin đặt chỗ</h1>
                <p className="text-blue-500 font-bold text-xs uppercase tracking-widest">Bước 1: Khởi tạo thông tin</p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày gửi xe</label>
                  <div className="relative group">
                    <input 
                      className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer" 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Time Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Giờ bắt đầu</label>
                  <div className="relative group">
                    <input 
                      className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer" 
                      type="time"
                      placeholder="--:-- --"
                      value={formData.startTime}
                      onClick={() => {
                        const now = new Date();
                        const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                        setFormData({...formData, startTime: time});
                      }}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      required
                    />
                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" size={18} />
                  </div>
                </div>

                {/* License Plate */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Biển số xe</label>
                  <input 
                    className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all uppercase" 
                    placeholder="51F-123.45" 
                    type="text"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                    required
                  />
                </div>

                {/* Custom Parking Lot Dropdown */}
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chọn bãi đỗ</label>
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-xl py-4 px-4 text-slate-900 font-bold flex items-center justify-between cursor-pointer hover:border-blue-500/20 transition-all group"
                  >
                    <span>{selectedParking.name}</span>
                    <ChevronRight className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-90' : ''}`} size={18} />
                  </div>

                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-[2000] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                    >
                      {parkingLots.map(lot => (
                        <div 
                          key={lot.id}
                          onClick={() => {
                            setFormData({...formData, parkingLotId: lot.id});
                            setIsDropdownOpen(false);
                          }}
                          className={`px-6 py-4 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between
                            ${formData.parkingLotId === lot.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                        >
                          <span className="font-bold">{lot.name}</span>
                          {formData.parkingLotId === lot.id && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>



                {/* Vehicle Type Selection */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Loại xe</p>
                  
                  {['car', 'suv', 'bike'].map((type) => (
                    <label 
                      key={type}
                      className={`flex items-center justify-between p-4 bg-white border-2 rounded-2xl cursor-pointer shadow-sm transition-all
                        ${formData.vehicleType === type ? 'border-blue-600' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <span className={`font-bold transition-colors ${formData.vehicleType === type ? 'text-slate-900' : 'text-slate-500'}`}>
                        {type === 'car' ? 'Ô tô (4-7 chỗ)' : type === 'suv' ? 'SUV / Bán tải' : 'Xe máy'}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center
                        ${formData.vehicleType === type ? 'border-blue-600 bg-white' : 'border-slate-200 bg-white'}`}>
                        {formData.vehicleType === type && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                      </div>
                      <input 
                        className="hidden" 
                        name="vehicle" 
                        type="radio" 
                        checked={formData.vehicleType === type}
                        onChange={() => setFormData({...formData, vehicleType: type})}
                      />
                    </label>
                  ))}
                </div>

                {/* Submit Button */}
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95" 
                  type="submit"
                >
                  TIẾP THEO: CHỌN VỊ TRÍ
                  <ArrowRight size={20} />
                </button>
              </form>
            </div>
          </motion.div>

          {/* Hero Content Area - Sticky Map */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7 xl:col-span-8 lg:pl-16 py-4 sticky top-32 self-start"
          >
            <div className="max-w-4xl mx-auto">
              {/* Digital Twin Preview Area / Live Map - Level with input box */}
              <div className="bg-white/60 border border-slate-100 rounded-[2.5rem] p-0 relative overflow-hidden h-[450px] shadow-soft group hover:shadow-lg transition-all duration-500 mb-12">
                <ParkingMap selectedDestination={selectedParking} allParkingLots={parkingLots} />
              </div>

            </div>
          </motion.div>


        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center border-t border-slate-100 mt-12">
        <p className="text-slate-400 text-xs font-medium tracking-wide">© 2024 PM System Smart Parking Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ReservationPage;
