import Navbar from '../components/layout/Navbar';
import ParkingMap from '../components/parking/map/ParkingMap';
import { ArrowRight, Calendar, Clock, MapPin, Info, Map, Layers, Compass, Cpu, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomTimePicker } from '../components/common/CustomTimePicker';
import { useReservation, mapReservationVehicleType } from '../hooks/useReservation';

const ReservationPage = () => {
  const {
    fromStatus,
    errorToast,
    parkingLots,
    formData,
    setFormData,
    handleStartTimeChange,
    isDropdownOpen,
    setIsDropdownOpen,
    isVehicleDropdownOpen,
    setIsVehicleDropdownOpen,
    userCoords,
    sortedParkingLots,
    selectedParking,
    isSlotSelected,
    setIsSlotSelected,
    currentSlot,
    setCurrentSlot,
    userVehicles,
    activePlates,
    unlockParkingLotSelection,
    handleSubmit,
    getDistance,
  } = useReservation();

  return (
    <div className="h-screen overflow-hidden bg-mesh-gradient text-on-surface font-sans selection:bg-primary/10 relative flex flex-col">
          <Navbar />
    
          {errorToast && (
            <div className="fixed top-24 right-4 z-[9999] bg-rose-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-rose-600/30">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="text-xs font-bold font-sans">{errorToast}</span>
            </div>
          )}
    
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
                      {fromStatus ? 'BƯỚc 2: HOÀN THIỆN THÔNG TIN' : 'BƯỚc 1: NHẬP THÔNG TIN'}
                    </div>
                    <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight leading-none mb-1">
                      {'Đăng ký giữ chỗ'}
                    </h1>
                    <p className="text-slate-500/90 text-[10px] font-medium leading-relaxed">
                      {'Thiết lập thời gian và vị trí đỗ xe thông minh chỉ trong vài giây.'}
                    </p>
                  </header>
    
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="space-y-4">
    
                    {/* Start: date + time (vertical) */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1 flex items-center gap-1.5">
                        <Calendar size={12} className="text-blue-500" /> {'Ngày bắt đầu (vào)'}
                      </label>
                      <div className="relative group">
                        <input
                          className="premium-input block w-full pl-4 pr-4 py-2.5 rounded-full border border-outline-variant focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all text-xs font-semibold cursor-pointer shadow-sm bg-white"
                          type="date"
                          value={formData.startDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            const startDate = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              startDate,
                              endDate: prev.endDate < startDate ? startDate : prev.endDate,
                            }));
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1 flex items-center gap-1.5">
                        <Clock size={12} className="text-blue-500" /> {'Giờ bắt đầu (vào)'}
                      </label>
                      <CustomTimePicker
                        value={formData.startTime}
                        onChange={handleStartTimeChange}
                      />
                    </div>

                    {/* End: date + time (vertical) */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1 flex items-center gap-1.5">
                        <Calendar size={12} className="text-blue-500" /> {'Ngày kết thúc (ra)'}
                      </label>
                      <div className="relative group">
                        <input
                          className="premium-input block w-full pl-4 pr-4 py-2.5 rounded-full border border-outline-variant focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all text-xs font-semibold cursor-pointer shadow-sm bg-white"
                          type="date"
                          value={formData.endDate}
                          min={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1 flex items-center gap-1.5">
                        <Clock size={12} className="text-blue-500" /> {'Giờ kết thúc (ra)'}
                      </label>
                      <CustomTimePicker
                        value={formData.endTime}
                        onChange={(newTime) => setFormData(prev => ({ ...prev, endTime: newTime }))}
                      />
                    </div>
    
                    {/* License Plate selection if they have multiple */}
                    {userVehicles.length > 0 ? (
                      <div className="space-y-1.5 relative">
                        <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-blue-500">credit_card</span> {'Chọn phương tiện gửi'}
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
                                      vehicleType: mapReservationVehicleType(veh.type),
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
                                      <Lock size={8} /> {'Đang gửi'}
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
                                <span className="font-extrabold text-xs text-slate-800">{'+ Nhập biển số xe khác'}</span>
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
                          <span className="material-symbols-outlined text-[14px] text-blue-500">credit_card</span> {'Biển số xe'}
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
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 flex items-center gap-1.5">
                          <MapPin size={12} className="text-blue-500" /> {'Chọn vị trí / bãi đỗ'}
                        </label>
                        {userCoords && sortedParkingLots.length > 0 && formData.parkingLotId !== sortedParkingLots[0].id && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsSlotSelected(false);
                              setCurrentSlot('');
                              setFormData(prev => ({ ...prev, parkingLotId: sortedParkingLots[0].id }));
                            }}
                            className="text-[9px] font-extrabold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider flex items-center gap-1 bg-blue-50 hover:bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-100 animate-pulse"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            B�i g?n nh?t
                          </button>
                        )}
                      </div>
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
                          <span className="text-xs truncate pr-2 flex items-center gap-1.5">
                            {selectedParking.name}
                            {userCoords && selectedParking.latitude && selectedParking.longitude && (
                              <span className="text-[9px] text-blue-500 bg-blue-50/50 px-2 py-0.5 rounded-full border border-blue-100/30">
                                ~ {getDistance(userCoords.latitude, userCoords.longitude, parseFloat(selectedParking.latitude), parseFloat(selectedParking.longitude)).toFixed(1)} km
                              </span>
                            )}
                          </span>
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
                            {sortedParkingLots.map((lot: any, idx: number) => (
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
                                  <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                                    {lot.name}
                                    {idx === 0 && lot.distance !== null && (
                                      <span className="text-[8px] bg-emerald-50 text-emerald-600 font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        G?n nh?t
                                      </span>
                                    )}
                                  </span>
                                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase mt-0.5">
                                    <span>{lot.floor}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                    <span>{lot.block}</span>
                                    {lot.distance !== null && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                        <span className="text-blue-500 font-bold">~ {lot.distance.toFixed(1)} km</span>
                                      </>
                                    )}
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
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400/90 ml-1">{'Loại phương tiện'}</p>
    
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
                        {'Hệ thống tự động đồng bộ biển số xe và loại phương tiện từ thông tin cá nhân của bạn để tối ưu thời gian thao tác.'}
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
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{'Vị trí đã chọn'}</span>
                          <span className="text-xs font-black text-slate-800">{selectedParking.name}</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={unlockParkingLotSelection}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                      >
                        {'Thay đổi'}
                      </button>
                    </div>
                  )}
    
                  {/* Next Step Action Button */}
                  <button
                    className="group relative overflow-hidden w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-full transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] text-xs flex items-center justify-center gap-2 mt-4 shrink-0 cursor-pointer"
                    type="submit"
                  >
                    <span className="relative z-10 uppercase tracking-widest font-black text-[10px]">
                      {isSlotSelected && currentSlot ? 'TIẾP THEO: ĐI TỚI THANH TOÁN' : 'TIẾP THEO: CHẬN VỊ TRÍ CHI TIẾT'}
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
                        <Cpu size={12} className="text-emerald-500" /> {'BẢN ĐỒ'}
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
                      <h3 className="font-display font-extrabold text-slate-800 text-base leading-none">{'Thông số Bãi Đỗ Số Hóa'}</h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mt-1.5">{'Giám sát hạ tầng thời gian thực'}</p>
                    </div>
                  </div>
    
                  <div className="grid grid-cols-3 gap-4 mt-1">
                    <div className="flex flex-col p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5">
                        <Layers size={10} className="text-blue-500" /> {'Tầng định vị'}
                      </span>
                      <span className="text-base font-extrabold text-slate-800 mt-1">{selectedParking.floor}</span>
                    </div>
                    <div className="flex flex-col p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5">
                        <Compass size={10} className="text-blue-500" /> {'Phân Khu'}
                      </span>
                      <span className="text-base font-extrabold text-slate-800 mt-1">{selectedParking.block}</span>
                    </div>
                    <div className="flex flex-col p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5">
                        <MapPin size={10} className="text-blue-500" /> {'Tọa độ GPS'}
                      </span>
                      <span className="text-xs font-black text-slate-800 mt-2.5 truncate">{selectedParking.latitude}, {selectedParking.longitude}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </main>
    
          <footer className="shrink-0 py-3 text-center border-t border-slate-100/60 relative z-10 bg-white/20 backdrop-blur-xs">
            <p className="text-slate-400/80 text-[10px] font-bold tracking-wide">© 2026 PM System — Giải pháp quản lý bãi đỗ xe thông minh. Bảo lưu mọi quyền.</p>
          </footer>
        </div>
  );
};

export default ReservationPage;
