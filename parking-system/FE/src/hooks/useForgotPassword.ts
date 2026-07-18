import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { getPasswordStrength } from './passwordStrength';

export function useForgotPassword() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
      const response = await authService.forgotPassword({
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

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (step === 0) {
      if (!email) {
        setError('Vui lòng nhập email.');
        return;
      }
      setLoading(true);
      try {
        const response = await authService.forgotPassword({
          email: email.toLowerCase().trim(),
        });
        if (response.data.data?.otpCode) {
          console.log('Dev OTP Code:', response.data.data.otpCode);
        }
        setLoading(false);
        setStep(1);
        startTimer();
      } catch (err: any) {
        setLoading(false);
        setError(
          err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.',
        );
      }
    } else if (step === 1) {
      if (otp.length !== 6) {
        setError('Mã OTP phải chứa đúng 6 chữ số.');
        return;
      }
      setLoading(true);
      try {
        await authService.verifyPasswordOtp({
          email: email.toLowerCase().trim(),
          otp,
        });
        setLoading(false);
        setStep(2);
      } catch (err: any) {
        setLoading(false);
        setError(err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      }
    } else if (step === 2) {
      if (!newPassword || !confirmPassword) {
        setError('Vui lòng điền đầy đủ các trường mật khẩu.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
      if (getPasswordStrength(newPassword).score < 5) {
        setError(
          'Mật khẩu chưa đủ mạnh. Mật khẩu phải dài ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường, chữ số và ít nhất một ký tự đặc biệt.',
        );
        return;
      }
      setLoading(true);
      try {
        await authService.resetPassword({
          email: email.toLowerCase().trim(),
          otp,
          newPassword,
        });
        setLoading(false);
        setSuccessMessage('Mật khẩu của bạn đã được cập nhật thành công!');
        setTimeout(() => navigate('/login'), 2000);
      } catch (err: any) {
        setLoading(false);
        setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
    }
  };

  return {
    step,
    setStep,
    loading,
    email,
    setEmail,
    otp,
    setOtp,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    successMessage,
    timer,
    canResend,
    handleResendOtp,
    handleNext,
    getPasswordStrength,
  };
}
