import React, { useState, useEffect, useRef } from 'react';
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
  const [address, setAddress] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic multiple vehicles list
  const [vehicles, setVehicles] = useState<{ plate: string; type: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [vehicleErrors, setVehicleErrors] = useState<Record<number, string>>({});

  // Vehicle deletion and navigation blocking states
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  
  const isDirtyRef = useRef(false);

  const isDirty = () => {
    if (!currentUser) return false;
    
    let initialVehicles: any[] = [];
    const lp = currentUser.licensePlate || '';
    if (lp.startsWith('[')) {
      try {
        initialVehicles = JSON.parse(lp);
      } catch (e) {
        initialVehicles = [{ plate: lp, type: currentUser.vehicleType || 'Car' }];
      }
    } else {
      initialVehicles = [{ plate: lp, type: currentUser.vehicleType || 'Car' }];
    }

    const initialFirstName = currentUser.firstName || '';
    const initialLastName = currentUser.lastName || '';
    const initialPhoneNumber = currentUser.phoneNumber || '';
    const initialAddress = currentUser.address || '';

    const vehiclesChanged = JSON.stringify(vehicles) !== JSON.stringify(initialVehicles);

    return (
      firstName !== initialFirstName ||
      lastName !== initialLastName ||
      phoneNumber !== initialPhoneNumber ||
      address !== initialAddress ||
      vehiclesChanged ||
      avatarBase64 !== null
    );
  };

  useEffect(() => {
    isDirtyRef.current = isDirty();
  }, [firstName, lastName, phoneNumber, address, vehicles, avatarBase64, currentUser]);

  useEffect(() => {
    const handleCaptureClick = (e: MouseEvent) => {
      if (!isDirtyRef.current || success) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/') && anchor.getAttribute('target') !== '_blank') {
        e.preventDefault();
        e.stopPropagation();
        setPendingUrl(href);
      }
    };

    document.addEventListener('click', handleCaptureClick, true);
    return () => {
      document.removeEventListener('click', handleCaptureClick, true);
    };
  }, [success]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current && !success) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [success]);

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
    setAddress(parsedUser.address || '');

    // Parse vehicles list from licensePlate field
    const lp = parsedUser.licensePlate || '';
    if (lp.startsWith('[')) {
      try {
        setVehicles(JSON.parse(lp));
      } catch (e) {
        setVehicles([{ plate: lp, type: parsedUser.vehicleType || 'Car' }]);
      }
    } else {
      setVehicles([{ plate: lp, type: parsedUser.vehicleType || 'Car' }]);
    }
  }, [navigate]);

  const handleAddVehicle = () => {
    setVehicles([...vehicles, { plate: '', type: 'Car' }]);
  };

  const handleRemoveVehicle = (index: number) => {
    if (vehicles.length <= 1) return;
    setVehicleToDelete(index);
  };

  const confirmRemoveVehicle = () => {
    if (vehicleToDelete !== null) {
      setVehicles(vehicles.filter((_, i) => i !== vehicleToDelete));
      setVehicleToDelete(null);
    }
  };

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
    setError('');
    setFieldErrors({});
    setVehicleErrors({});

    let hasError = false;

    // Validate empty inputs
    if (!firstName.trim()) {
      setFieldErrors(prev => ({ ...prev, firstName: 'Họ đệm không được để trống.' }));
      hasError = true;
    }
    if (!lastName.trim()) {
      setFieldErrors(prev => ({ ...prev, lastName: 'Tên không được để trống.' }));
      hasError = true;
    }
    if (!phoneNumber.trim()) {
      setFieldErrors(prev => ({ ...prev, phoneNumber: 'Số điện thoại không được để trống.' }));
      hasError = true;
    }
    if (!address.trim()) {
      setFieldErrors(prev => ({ ...prev, address: 'Địa chỉ không được để trống.' }));
      hasError = true;
    }
    if (vehicles.length === 0) {
      setError('Vui lòng thêm ít nhất một phương tiện.');
      hasError = true;
    }

    const nameRegex = /^[\p{L}\p{M}\s]{2,50}$/u;
    const phoneRegex = /^(0|84|\+84)[35789]\d{8}$/;
    
    const validatePlate = (plate: string) => {
      const clean = plate.replace(/[-.\s]/g, '').toUpperCase();
      return /^\d{2}[A-Z][A-Z0-9]?\d{4,5}$/.test(clean);
    };

    if (firstName.trim() && !nameRegex.test(firstName.trim())) {
      setFieldErrors(prev => ({ ...prev, firstName: 'Tên chỉ được chứa chữ cái và khoảng trắng, từ 2 đến 50 ký tự.' }));
      hasError = true;
    }

    if (lastName.trim() && !nameRegex.test(lastName.trim())) {
      setFieldErrors(prev => ({ ...prev, lastName: 'Họ chỉ được chứa chữ cái và khoảng trắng, từ 2 đến 50 ký tự.' }));
      hasError = true;
    }

    if (phoneNumber.trim() && !phoneRegex.test(phoneNumber.trim())) {
      setFieldErrors(prev => ({ ...prev, phoneNumber: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng di động Việt Nam (Ví dụ: 0987654321).' }));
      hasError = true;
    }

    const vErrors: Record<number, string> = {};
    vehicles.forEach((v, idx) => {
      if (!v.plate.trim()) {
        vErrors[idx] = 'Biển số xe không được để trống.';
      } else if (!validatePlate(v.plate)) {
        vErrors[idx] = 'Biển số xe không đúng định dạng. Ký tự thứ 3 bắt buộc là chữ cái (Ví dụ: 29A-123.45).';
      }
    });
    if (Object.keys(vErrors).length > 0) {
      setVehicleErrors(vErrors);
      hasError = true;
    }

    if (firstName.trim() === 'Google' || lastName.trim() === 'User') {
      setError('Vui lòng nhập Họ Tên thật của bạn.');
      hasError = true;
    }

    if (hasError) {
      setError('Vui lòng kiểm tra lại thông tin bị lỗi ở các trường nhập dưới đây.');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const serializedPlates = JSON.stringify(vehicles);
      const primaryVehicleType = vehicles[0]?.type || 'Car';

      const response = await api.put('/auth/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        licensePlate: serializedPlates,
        vehicleType: primaryVehicleType,
        address: address.trim(),
        avatarUrl: avatarBase64 || currentUser.avatarUrl
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
        setAvatarBase64(null);
        
        // Notify Navbar and other listening components
        window.dispatchEvent(new Event('user-login'));
        
        setSuccess(true);
        if (isForceUpdate) {
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } else {
          setTimeout(() => {
            setSuccess(false);
          }, 3000);
        }
      } else {
        setError(response.data.message || 'Cập nhật thông tin thất bại.');
      }
    } catch (err: any) {
      console.error('Update Profile Error Details:', err.response?.data);
      const beErrors = err.response?.data?.errors;
      if (beErrors) {
        const errorsMap: Record<string, string> = {};
        Object.entries(beErrors).forEach(([key, val]: any) => {
          const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
          errorsMap[normalizedKey] = Array.isArray(val) ? val[0] : val;
        });
        setFieldErrors(errorsMap);
        setError('Thông tin nhập vào không hợp lệ. Vui lòng kiểm tra các ô báo đỏ bên dưới.');
      } else {
        setError(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình cập nhật.');
      }
    } finally {
      setLoading(false);
    }
  };

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
            <span className="text-xs font-semibold tracking-normal text-white">Cập nhật thành công!</span>
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
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-blue-100 flex items-center justify-center text-blue-600 transition-all duration-300">
                  {avatarBase64 ? (
                    <img 
                      src={avatarBase64} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover" 
                    />
                  ) : currentUser.avatarUrl && currentUser.avatarUrl !== 'null' && currentUser.avatarUrl !== 'undefined' ? (
                    <img 
                      src={currentUser.avatarUrl} 
                      alt="Profile Avatar" 
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        setError('Kích thước ảnh không được vượt quá 2MB');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatarBase64(reader.result as string);
                        setError('');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
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
                  placeholder="Ví dụ: 0987654321"
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
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Thông tin phương tiện</label>
                <button
                  type="button"
                  onClick={handleAddVehicle}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-wider hover:underline"
                >
                  + Thêm xe mới
                </button>
              </div>

              {vehicles.map((veh, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 bg-slate-50/40 rounded-3xl border border-slate-100/50 relative">
                  <div className="sm:col-span-6 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">Biển số xe #{index + 1}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Tag size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="Ví dụ: 29A-12345"
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
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1">Loại phương tiện</label>
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
                        <option value="Car">Ô tô (Car)</option>
                        <option value="Motorbike">Xe máy (Motorbike)</option>
                        <option value="Bicycle">Xe đạp / Xe điện (Bicycle)</option>
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
              <span>{loading ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}</span>
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
              <h3 className="text-sm font-bold text-slate-900 mb-2">Xác nhận xóa xe</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn xóa xe với biển số <span className="font-bold text-slate-800">"{vehicles[vehicleToDelete]?.plate || 'chưa nhập'}"</span> khỏi danh sách không?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setVehicleToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-full transition-colors cursor-pointer border border-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmRemoveVehicle}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors cursor-pointer"
                >
                  Xác nhận xóa
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
                <h3 className="text-sm font-bold text-slate-900">Thay đổi chưa lưu</h3>
              </div>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Bạn có thay đổi chưa lưu. Nếu rời đi bây giờ, thay đổi của bạn sẽ bị hủy bỏ. Bạn có muốn tiếp tục chỉnh sửa không?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingUrl(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-full transition-colors cursor-pointer border border-slate-200"
                >
                  Ở lại
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = pendingUrl;
                    setPendingUrl(null);
                    navigate(url);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-full transition-colors cursor-pointer"
                >
                  Rời đi & Hủy lưu
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
