import React, { useState, useEffect, useRef } from 'react';
import BrandLogo from '../../components/brand/BrandLogo';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AlertCircle, CheckCircle } from 'lucide-react';

const getPasswordStrength = (pwd: string) => {
  if (!pwd) return { score: 0, label: '', color: 'bg-slate-200', textColor: 'text-slate-400' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 2) {
    return { score, label: 'Yếu', color: 'bg-red-500', textColor: 'text-red-500' };
  } else if (score === 3) {
    return { score, label: 'Trung bình', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
  } else if (score === 4) {
    return { score, label: 'Khá mạnh', color: 'bg-blue-500', textColor: 'text-blue-500' };
  } else {
    return { score, label: 'Rất mạnh', color: 'bg-green-500', textColor: 'text-green-500' };
  }
};

const ForgotPasswordPage = () => {
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
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
      const response = await api.post('/auth/password/forgot', {
        email: email.toLowerCase().trim()
      });

      const apiResponse = response.data;
      if (apiResponse.data && apiResponse.data.otpCode) {
        console.log("Dev OTP Code:", apiResponse.data.otpCode);
      }

      setLoading(false);
      startTimer();
    } catch (err: any) {
      setLoading(false);
      console.error('Resend OTP Error:', err.response?.data);
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
        const response = await api.post('/auth/password/forgot', {
          email: email.toLowerCase().trim()
        });

        const apiResponse = response.data;
        if (apiResponse.data && apiResponse.data.otpCode) {
          console.log("Dev OTP Code:", apiResponse.data.otpCode);
        }

        setLoading(false);
        setStep(1);
        startTimer();
      } catch (err: any) {
        setLoading(false);
        console.error('Forgot Password OTP Error:', err.response?.data);
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
      }
    } else if (step === 1) {
      if (otp.length !== 6) {
        setError('Mã OTP phải chứa đúng 6 chữ số.');
        return;
      }
      setLoading(true);
      try {
        await api.post('/auth/password/verify-otp', {
          email: email.toLowerCase().trim(),
          otp
        });
        setLoading(false);
        setStep(2);
      } catch (err: any) {
        setLoading(false);
        console.error('Verify OTP Error:', err.response?.data);
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
      const strength = getPasswordStrength(newPassword);
      if (strength.score < 5) {
        setError('Mật khẩu chưa đủ mạnh. Mật khẩu phải dài ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường, chữ số và ít nhất một ký tự đặc biệt.');
        return;
      }

      setLoading(true);
      try {
        await api.post('/auth/password/reset', {
          email: email.toLowerCase().trim(),
          otp,
          newPassword
        });

        setLoading(false);
        setSuccessMessage('Mật khẩu của bạn đã được cập nhật thành công!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (err: any) {
        setLoading(false);
        console.error('Reset Password Error:', err.response?.data);
        setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
    }
  };

  return (
    <main className="flex min-h-screen w-full relative overflow-hidden bg-mesh-gradient font-sans antialiased text-on-surface">
      {/* Decoration Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-container/20 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Hero Section */}
      <section className="hidden lg:flex flex-col justify-between w-[55%] p-20 relative z-10">
        <BrandLogo size="lg" asLink />

        <div className="max-w-2xl opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-[72px] font-display font-extrabold leading-[1.05] tracking-tight mb-8 text-slate-900">
            Khôi phục<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500">tài khoản của bạn.</span>
          </h2>
          <p className="text-slate-500 text-xl leading-relaxed max-w-lg font-medium">
            Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại mật khẩu chỉ trong vài phút thông qua quy trình xác thực an toàn.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="flex flex-col items-center justify-center w-full lg:w-[45%] p-8 md:p-16 relative z-20">
        <div className="w-full max-w-[460px] bg-white/80 border border-slate-200/40 backdrop-blur-md p-10 md:p-12 rounded-[2.5rem] shadow-soft">
          {/* Back Button */}
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors text-[10px] font-extrabold uppercase tracking-widest mb-6 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Quay lại
            </button>
          ) : (
            <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors text-[10px] font-extrabold uppercase tracking-widest mb-6">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Về trang đăng nhập
            </Link>
          )}

          {/* Welcome Header */}
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight mb-3">Quên mật khẩu</h2>
            <p className="text-slate-500 font-medium text-sm">Nhập thông tin bên dưới để tiếp tục.</p>
          </div>

          {/* Form Wrapper */}
          <div className="w-full">
            <form onSubmit={handleNext} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 rounded-2xl animate-shake">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-xs font-bold text-red-600">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-100 rounded-2xl animate-fade-in-up">
                  <CheckCircle className="text-green-500 shrink-0" size={18} />
                  <p className="text-xs font-bold text-green-700">{successMessage}</p>
                </div>
              )}

              {step === 0 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1 block">Email khôi phục</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                      </div>
                      <input 
                        className="block w-full pl-12 pr-4 py-3 rounded-full border border-slate-200/80 bg-slate-50/40 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium focus:outline-none" 
                        type="email" 
                        placeholder="email@example.com" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-full transition-all duration-300 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] text-[10px] uppercase tracking-widest cursor-pointer ${loading ? 'opacity-80 cursor-wait' : ''}`} 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'ĐANG GỬI...' : 'Gửi mã xác thực'}
                  </button>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="text-center p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/50">
                    <p className="text-xs text-slate-500">Mã OTP đã được gửi đến email của bạn thành công. Vui lòng nhập mã để đặt lại mật khẩu.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1 block">Mã xác thực OTP (6 chữ số)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">verified</span>
                      </div>
                      <input 
                        className="block w-full pl-12 pr-4 py-3 rounded-full border border-slate-200/80 bg-slate-50/40 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-center text-lg font-bold tracking-[0.25em] focus:outline-none" 
                        maxLength={6} 
                        required 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                        placeholder="000000" 
                      />
                    </div>
                  </div>

                  <div className="flex justify-center items-center text-xs px-1 text-slate-500 mt-2">
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer bg-transparent border-none"
                        disabled={loading}
                      >
                        Gửi lại mã OTP
                      </button>
                    ) : (
                      <p>
                        Gửi lại mã sau: <span className="font-bold text-slate-700">{timer}s</span>
                      </p>
                    )}
                  </div>
                  <button 
                    className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-full transition-all duration-300 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] text-[10px] uppercase tracking-widest cursor-pointer ${loading ? 'opacity-80 cursor-wait' : ''}`} 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'ĐANG XÁC THỰC...' : 'Xác nhận mã OTP'}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1 block">Mật khẩu mới</label>
                    <input 
                      className="block w-full px-5 py-3 rounded-full border border-slate-200/80 bg-slate-50/40 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium focus:outline-none" 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  {newPassword && (
                    <div className="space-y-1.5 px-1">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.1em]">
                        <span className="text-slate-400">Độ mạnh mật khẩu:</span>
                        <span className={getPasswordStrength(newPassword).textColor}>
                          {getPasswordStrength(newPassword).label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => {
                          const strength = getPasswordStrength(newPassword);
                          const isActive = strength.score >= i;
                          return (
                            <div
                              key={i}
                              className={`h-full flex-1 transition-all duration-300 ${
                                isActive ? strength.color : 'bg-slate-200 dark:bg-slate-700/50'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Yêu cầu: dài ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1 block">Xác nhận mật khẩu mới</label>
                    <input 
                      className="block w-full px-5 py-3 rounded-full border border-slate-200/80 bg-slate-50/40 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium focus:outline-none" 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <button 
                    className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-full transition-all duration-300 shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] text-[10px] uppercase tracking-widest cursor-pointer ${loading ? 'opacity-80 cursor-wait' : ''}`} 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'ĐANG CẬP NHẬT...' : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
