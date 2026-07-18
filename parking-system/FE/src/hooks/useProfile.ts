import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

export function useProfile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [vehicles, setVehicles] = useState<{ plate: string; type: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [vehicleErrors, setVehicleErrors] = useState<Record<number, string>>({});

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
      } catch {
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

    const lp = parsedUser.licensePlate || '';
    if (lp.startsWith('[')) {
      try {
        setVehicles(JSON.parse(lp));
      } catch {
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

  const isForceUpdate =
    currentUser &&
    (!currentUser.firstName ||
      !currentUser.lastName ||
      !currentUser.phoneNumber ||
      !currentUser.licensePlate ||
      !currentUser.vehicleType ||
      !currentUser.address ||
      currentUser.firstName === 'Google' ||
      currentUser.lastName === 'User');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setVehicleErrors({});

    let hasError = false;

    if (!firstName.trim()) {
      setFieldErrors((prev) => ({ ...prev, firstName: 'Họ đệm không được để trống.' }));
      hasError = true;
    }
    if (!lastName.trim()) {
      setFieldErrors((prev) => ({ ...prev, lastName: 'Tên không được để trống.' }));
      hasError = true;
    }
    if (!phoneNumber.trim()) {
      setFieldErrors((prev) => ({ ...prev, phoneNumber: 'Số điện thoại không được để trống.' }));
      hasError = true;
    }
    if (!address.trim()) {
      setFieldErrors((prev) => ({ ...prev, address: 'Địa chỉ không được để trống.' }));
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
      setFieldErrors((prev) => ({
        ...prev,
        firstName: 'Tên chỉ được chứa chữ cái và khoảng trắng, từ 2 đến 50 ký tự.',
      }));
      hasError = true;
    }

    if (lastName.trim() && !nameRegex.test(lastName.trim())) {
      setFieldErrors((prev) => ({
        ...prev,
        lastName: 'Họ chỉ được chứa chữ cái và khoảng trắng, từ 2 đến 50 ký tự.',
      }));
      hasError = true;
    }

    if (phoneNumber.trim() && !phoneRegex.test(phoneNumber.trim())) {
      setFieldErrors((prev) => ({
        ...prev,
        phoneNumber:
          'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng di động Việt Nam (Ví dụ: 0987654321).',
      }));
      hasError = true;
    }

    const vErrors: Record<number, string> = {};
    vehicles.forEach((v, idx) => {
      if (!v.plate.trim()) {
        vErrors[idx] = 'Biển số xe không được để trống.';
      } else if (!validatePlate(v.plate)) {
        vErrors[idx] =
          'Biển số xe không đúng định dạng. Ký tự thứ 3 bắt buộc là chữ cái (Ví dụ: 29A-123.45).';
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

      const response = await authService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        licensePlate: serializedPlates,
        vehicleType: primaryVehicleType,
        address: address.trim(),
        avatarUrl: avatarBase64 || currentUser.avatarUrl,
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
          avatarUrl: response.data.data.avatarUrl || currentUser.avatarUrl,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setAvatarBase64(null);

        window.dispatchEvent(new Event('user-login'));

        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1500);
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

  const discardAndLeave = () => {
    const url = pendingUrl;
    setPendingUrl(null);
    if (url) navigate(url);
  };

  return {
    ready: !!currentUser,
    currentUser,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phoneNumber,
    setPhoneNumber,
    address,
    setAddress,
    avatarBase64,
    fileInputRef,
    vehicles,
    setVehicles,
    loading,
    error,
    setError,
    success,
    fieldErrors,
    vehicleErrors,
    vehicleToDelete,
    setVehicleToDelete,
    pendingUrl,
    setPendingUrl,
    isForceUpdate,
    handleAddVehicle,
    handleRemoveVehicle,
    confirmRemoveVehicle,
    handleAvatarChange,
    handleUpdate,
    discardAndLeave,
    navigate,
  };
}
