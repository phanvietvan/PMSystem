import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Tag, Car, Save, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import BrandLogo from '../components/brand/BrandLogo';
import { useProfile } from '../hooks/useProfile';

const ProfilePage = () => {
  const {
    currentUser,
    firstName, setFirstName,
    lastName, setLastName,
    phoneNumber, setPhoneNumber,
    address, setAddress,
    avatarBase64,
    fileInputRef,
    vehicles, setVehicles,
    loading, error, success,
    fieldErrors, vehicleErrors,
    vehicleToDelete, setVehicleToDelete,
    pendingUrl, setPendingUrl,
    isForceUpdate,
    handleAddVehicle, handleRemoveVehicle, confirmRemoveVehicle,
    handleAvatarChange, handleUpdate, discardAndLeave, navigate,
  } = useProfile();

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-mesh-gradient text-[#191c1e] selection:bg-blue-500/10">
          {/* Viewport-fixed premium emerald success toast */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -80, x: "-50%" }}
                animate={{ opacity: 1, y: 24, x: "-50%" }}
                exit={{ opacity: 0, y: -80, x: "-50%" }}
                transition={{ type: "spring", stiffness: 120, damping: 14 }}
                className="fixed top-0 left-1/2 z-[99999] flex items-center gap-2.5 px-4.5 py-2 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/20 border border-emerald-400/20 whitespace-nowrap"
              >
                <CheckCircle2 className="text-white shrink-0" size={15} />
                <span className="text-xs font-semibold tracking-normal text-white">{'Hồ sơ đã được cập nhật!'}</span>
              </motion.div>
            )}
          </AnimatePresence>
    
          {/* Hide standard navbar to prevent navigation if force update is active */}
          {!isForceUpdate ? (
            <Navbar />
          ) : (
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50">
              <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <BrandLogo size="md" />
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200/50 text-xs font-bold uppercase tracking-wider animate-pulse">
                  <ShieldAlert size={14} />
                  {'Cập nhật hồ sơ'}
                </div>
              </nav>
            </header>
          )}
    
          <main className="max-w-xl mx-auto px-6 pt-32 pb-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/50"
            >
              {isForceUpdate && (
                <div className="mb-6 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-3">
                  <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">{'Cập nhật thông tin bắt buộc'}</h3>
                    <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
                      {'Để đảm bảo an ninh bãi xe, quý khách vui lòng cập nhật đầy đủ thông tin: Họ tên, Số điện thoại, Biển số xe, Loại xe và Địa chỉ trước khi tiếp tục.'}
                    </p>
                  </div>
                </div>
              )}
    
              <div className="text-center mb-8">
                {/* Avatar Profile Section */}
                <div className="flex justify-center mb-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-blue-100 flex items-center justify-center text-blue-600 transition-all duration-300">
                      {avatarBase64 ? (
                        <img 
                          src={avatarBase64} 
                          alt="Ảnh đại diện" 
                          className="w-full h-full object-cover" 
                        />
                      ) : currentUser.avatarUrl && currentUser.avatarUrl !== 'null' && currentUser.avatarUrl !== 'undefined' ? (
                        <img 
                          src={currentUser.avatarUrl} 
                          alt="Ảnh đại diện" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User size={40} className="opacity-80" />
                      )}
                      
                      {/* Hover Overlay */}
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer backdrop-blur-[2px]"
                      >
                        <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
                      </div>
                    </div>
                    
                    {/* File Input */}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/jpeg, image/png, image/webp" 
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-950">{'Thông tin cơ bản'}</h1>
                <p className="text-xs text-slate-400 mt-1">{'Quản lý thông tin cá nhân và bảo mật tài khoản'}</p>
              </div>
    
              <form onSubmit={handleUpdate} className="space-y-4">
                {/* Username & Email (Readonly in grid) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        value={currentUser.username}
                        disabled
                        className="block w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed focus:outline-none"
                      />
                    </div>
                  </div>
    
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        value={currentUser.email}
                        disabled
                        className="block w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
    
                {/* Họ & Tên */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">Họ</label>
                    <input
                      type="text"
                      placeholder="Nguyễn"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className={`premium-input block w-full px-5 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium ${
                        fieldErrors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
                      }`}
                    />
                    {fieldErrors.lastName && (
                      <p className="text-[10px] font-semibold text-red-500 ml-3 animate-fade-in-up">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
    
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">Tên</label>
                    <input
                      type="text"
                      placeholder="Văn A"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className={`premium-input block w-full px-5 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium ${
                        fieldErrors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
                      }`}
                    />
                    {fieldErrors.firstName && (
                      <p className="text-[10px] font-semibold text-red-500 ml-3 animate-fade-in-up">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>
                </div>
    
                {/* Số điện thoại */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">Số điện thoại</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      placeholder={'VD: 0987654321'}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className={`premium-input block w-full pl-10 pr-4 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium ${
                        fieldErrors.phoneNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
                      }`}
                    />
                  </div>
                  {fieldErrors.phoneNumber && (
                    <p className="text-[10px] font-semibold text-red-500 ml-3 animate-fade-in-up">
                      {fieldErrors.phoneNumber}
                    </p>
                  )}
                </div>
    
                {/* Vehicles List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{'Thông tin phương tiện'}</label>
                    <button
                      type="button"
                      onClick={handleAddVehicle}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-wider hover:underline"
                    >
                      + {'+ Nhập biển số xe khác'}
                    </button>
                  </div>
    
                  {vehicles.map((veh, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 bg-slate-50/40 rounded-3xl border border-slate-100/50 relative">
                      <div className="sm:col-span-6 space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">{'Biển số xe'} #{index + 1}</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Tag size={16} />
                          </div>
                          <input
                            type="text"
                            placeholder="29A-12345"
                            value={veh.plate}
                            onChange={(e) => {
                              const updated = [...vehicles];
                              updated[index].plate = e.target.value.toUpperCase();
                              setVehicles(updated);
                            }}
                            required
                            className={`premium-input block w-full pl-10 pr-4 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium uppercase ${
                              vehicleErrors[index] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
                            }`}
                          />
                        </div>
                        {vehicleErrors[index] && (
                          <p className="text-[10px] font-semibold text-red-500 ml-3 animate-fade-in-up">
                            {vehicleErrors[index]}
                          </p>
                        )}
                      </div>
    
                      <div className="sm:col-span-5 space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">{'Loại phương tiện'}</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Car size={16} />
                          </div>
                          <select
                            value={veh.type}
                            onChange={(e) => {
                              const updated = [...vehicles];
                              updated[index].type = e.target.value;
                              setVehicles(updated);
                            }}
                            required
                            className="premium-input block w-full pl-10 pr-4 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium appearance-none bg-white cursor-pointer"
                          >
                            <option value="Car">{'Ô tô'}</option>
                            <option value="Motorbike">{'Xe máy'}</option>
                            <option value="Bicycle">{'Xe đạp/Xe điện'}</option>
                          </select>
                        </div>
                      </div>
    
                      {vehicles.length > 1 && (
                        <div className="sm:col-span-1 flex justify-center pb-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveVehicle(index)}
                            className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
    
                {/* Địa chỉ */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">{'Địa chỉ'}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder={'VD: Số 1 Đường ABC, Quận 7, TP.HCM'}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className={`premium-input block w-full pl-10 pr-4 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium ${
                        fieldErrors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
                      }`}
                    />
                  </div>
                  {fieldErrors.address && (
                    <p className="text-[10px] font-semibold text-red-500 ml-3 animate-fade-in-up">
                      {fieldErrors.address}
                    </p>
                  )}
                </div>
    
                {/* Notifications */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-2xl"
                    >
                      <AlertCircle className="text-red-500 shrink-0" size={16} />
                      <p className="text-[11px] font-bold text-red-600 leading-tight">{error}</p>
                    </motion.div>
                  )}
    
                </AnimatePresence>
    
                {/* Save Button */}
                <button
                  type="submit"
                  disabled={loading || success}
                  className={`group relative overflow-hidden w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-all duration-300 shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20 transform hover:-translate-y-0.5 active:scale-[0.98] text-xs flex items-center justify-center gap-2 ${loading ? 'opacity-80 cursor-wait' : ''}`}
                >
                  <Save size={16} />
                  <span>{loading ? 'Đang lưu...' : 'Lưu thay đổi'.toUpperCase()}</span>
                </button>
              </form>
            </motion.div>
          </main>
    
          {/* Popups */}
          <AnimatePresence>
            {vehicleToDelete !== null && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-slate-100"
                >
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{'Xác nhận xóa xe'}</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    {'Bạn có chắc chắn muốn xóa xe biển số'} <span className="font-bold text-slate-800">"{vehicles[vehicleToDelete]?.plate || 'chưa nhập'}"</span>?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setVehicleToDelete(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-full transition-colors cursor-pointer border border-slate-200"
                    >
                      {'Đóng'}
                    </button>
                    <button
                      type="button"
                      onClick={confirmRemoveVehicle}
                      className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors cursor-pointer"
                    >
                      {'Xác nhận'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
    
            {pendingUrl !== null && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-slate-100"
                >
                  <div className="flex items-center gap-2 mb-3 text-amber-500">
                    <span className="material-symbols-outlined text-[24px]">warning</span>
                    <h3 className="text-sm font-bold text-slate-900">{'Thay đổi chưa lưu'}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    {'Bạn có thay đổi chưa lưu. Nếu rời đi bây giờ, thay đổi sẽ bị hủy bỏ.'}
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setPendingUrl(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-full transition-colors cursor-pointer border border-slate-200"
                    >
                      {'ở lại'}
                    </button>
                    <button
                      type="button"
                      onClick={discardAndLeave}
                      className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-full transition-colors cursor-pointer"
                    >
                      Leave & Discard
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
  );
};

export default ProfilePage;
