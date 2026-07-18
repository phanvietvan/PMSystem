import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../services/auth.service';
import { getPasswordStrength } from './passwordStrength';

export { getPasswordStrength };

export function useRegister() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const startTimer = () => {
    setTimer(60);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    setError('');
    try {
      const response = await authService.registerSendOtp({
        email: email.toLowerCase().trim(),
      });
      if (response.data.data?.otpCode) {
        console.log('Dev OTP Code:', response.data.data.otpCode);
      }
      setLoading(false);
      startTimer();
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
    }
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const response = await authService.googleLogin({
          idToken: tokenResponse.access_token,
        });
        const { user, accessToken } = response.data.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user-login'));
        setLoading(false);
        const isForceUpdate =
          !user.firstName ||
          !user.lastName ||
          user.firstName === 'Google' ||
          user.lastName === 'User';
        navigate(isForceUpdate ? '/profile' : '/');
      } catch (err: any) {
        setLoading(false);
        setError(err.response?.data?.message || 'Đăng ký bằng Google thất bại.');
      }
    },
    onError: () => setError('Đăng ký bằng Google thất bại.'),
  });

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (step === 0) {
      if (!email || !email.includes('@')) {
        setError('Vui lòng nhập email hợp lệ.');
        return;
      }
      setLoading(true);
      try {
        const response = await authService.registerCheckEmail(email.toLowerCase().trim());
        if (response.data.success) setStep(1);
        else setError(response.data.message || 'Email này đã được đăng ký.');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Email này đã được đăng ký hoặc không hợp lệ.');
      } finally {
        setLoading(false);
      }
    } else if (step === 1) {
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
      if (getPasswordStrength(password).score < 5) {
        setError(
          'Mật khẩu chưa đủ mạnh. Mật khẩu phải dài ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường, chữ số và ít nhất một ký tự đặc biệt.',
        );
        return;
      }
      setLoading(true);
      try {
        const response = await authService.registerSendOtp({
          email: email.toLowerCase().trim(),
        });
        if (response.data.data?.otpCode) {
          console.log('Dev OTP Code:', response.data.data.otpCode);
        }
        setLoading(false);
        setStep(2);
        startTimer();
      } catch (err: any) {
        setLoading(false);
        setError(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
      }
    } else if (step === 2) {
      if (otp.length !== 6) {
        setError('Mã OTP phải chứa đúng 6 chữ số.');
        return;
      }
      setLoading(true);
      try {
        const response = await authService.registerVerify({
          email: email.toLowerCase().trim(),
          otp,
          username: email.split('@')[0],
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        const { user, accessToken } = response.data.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user-login'));
        setLoading(false);
        navigate('/');
      } catch (err: any) {
        setLoading(false);
        const beErrors = err.response?.data?.errors;
        setError(
          beErrors
            ? Object.values(beErrors).flat().join(' | ')
            : err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.',
        );
      }
    }
  };

  return {
    step,
    setStep,
    loading,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    otp,
    setOtp,
    error,
    timer,
    canResend,
    handleResendOtp,
    loginGoogle,
    handleNext,
    getPasswordStrength,
  };
}
