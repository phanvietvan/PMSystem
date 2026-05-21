import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Tag, Car, Save, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import BrandLogo from '../components/brand/BrandLogo';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // State fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [address, setAddress] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);
    setFirstName(parsedUser.firstName || '');
    setLastName(parsedUser.lastName || '');
    setPhoneNumber(parsedUser.phoneNumber || '');
    setLicensePlate(parsedUser.licensePlate || '');
    setVehicleType(parsedUser.vehicleType || 'Car');
    setAddress(parsedUser.address || '');
  }, [navigate]);

  // Determine if profile update is mandatory based on persisted user profile fields
  const isForceUpdate = currentUser && (
    !currentUser.firstName || 
    !currentUser.lastName || 
    !currentUser.phoneNumber || 
    !currentUser.licensePlate || 
    !currentUser.vehicleType || 
    !currentUser.address || 
    currentUser.firstName === 'Google' || 
    currentUser.lastName === 'User'
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !firstName.trim() || 
      !lastName.trim() || 
      !phoneNumber.trim() || 
      !licensePlate.trim() || 
      !vehicleType.trim() || 
      !address.trim()
    ) {
      setError('Vui lòng điền đầy đủ tất cả thông tin yêu cầu.');
      return;
    }

    if (firstName.trim() === 'Google' || lastName.trim() === 'User') {
      setError('Vui lòng nhập Họ Tên thật của bạn.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.put('/auth/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        licensePlate: licensePlate.trim(),
        vehicleType: vehicleType.trim(),
        address: address.trim()
      });

      if (response.data.success) {
        const updatedUser = {
          ...currentUser,
          firstName: response.data.data.firstName,
          lastName: response.data.data.lastName,
          phoneNumber: response.data.data.phoneNumber,
          licensePlate: response.data.data.licensePlate,
          vehicleType: response.data.data.vehicleType,
          address: response.data.data.address,
          avatarUrl: response.data.data.avatarUrl || currentUser.avatarUrl
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        
        // Notify Navbar and other listening components
        window.dispatchEvent(new Event('user-login'));
        
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(response.data.message || 'Cập nhật thông tin thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình cập nhật.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-mesh-gradient text-[#191c1e] selection:bg-blue-500/10" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* Hide standard navbar to prevent navigation if force update is active */}
      {!isForceUpdate ? (
        <Navbar />
      ) : (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <BrandLogo size="md" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200/50 text-xs font-bold uppercase tracking-wider animate-pulse">
              <ShieldAlert size={14} />
              Bắt buộc cập nhật thông tin
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
                <h3 className="text-sm font-bold text-amber-900">Cập nhật thông tin bắt buộc</h3>
                <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
                  Để đảm bảo an ninh bãi xe, quý khách vui lòng cập nhật đầy đủ thông tin: Họ tên, Số điện thoại, Biển số xe, Loại xe và Địa chỉ trước khi tiếp tục.
                </p>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            {/* Avatar Profile Section */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-blue-100 flex items-center justify-center text-blue-600">
                {currentUser.avatarUrl && currentUser.avatarUrl !== 'null' && currentUser.avatarUrl !== 'undefined' ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt="Profile Avatar" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User size={40} className="opacity-80" />
                )}
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-950">Thông tin cá nhân</h1>
            <p className="text-xs text-slate-400 mt-1">Cập nhật thông tin hồ sơ tài khoản của bạn</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            {/* Username & Email (Readonly in grid) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Tên đăng nhập</label>
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
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Địa chỉ Email</label>
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
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="premium-input block w-full px-5 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">Tên</label>
                <input
                  type="text"
                  placeholder="Văn A"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="premium-input block w-full px-5 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium"
                />
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
                  placeholder="Ví dụ: 0987654321"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="premium-input block w-full pl-10 pr-4 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium"
                />
              </div>
            </div>

            {/* Biển số xe & Loại xe */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">Biển số xe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Tag size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Ví dụ: 29A-12345"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    required
                    className="premium-input block w-full pl-10 pr-4 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">Loại phương tiện</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Car size={16} />
                  </div>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    required
                    className="premium-input block w-full pl-10 pr-4 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium appearance-none bg-white cursor-pointer"
                  >
                    <option value="Car">Ô tô (Car)</option>
                    <option value="Motorbike">Xe máy (Motorbike)</option>
                    <option value="Bicycle">Xe đạp / Xe điện (Bicycle)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">Địa chỉ</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <MapPin size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Ví dụ: Căn hộ A12, Chung cư Sunrise, Quận 7, TP. HCM"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="premium-input block w-full pl-10 pr-4 py-2.5 rounded-full focus:outline-none transition-all text-xs font-medium"
                />
              </div>
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

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-2xl"
                >
                  <CheckCircle2 className="text-green-500 shrink-0" size={16} />
                  <p className="text-[11px] font-bold text-green-600 leading-tight">Đã cập nhật thông tin thành công! Đang chuyển hướng...</p>
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
              <span>{loading ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}</span>
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfilePage;
