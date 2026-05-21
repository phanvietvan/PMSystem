import React, { useState } from 'react';
import BrandLogo from '../../components/brand/BrandLogo';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AlertCircle } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const RegisterPage = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpCode, setDevOtpCode] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const response = await api.post('/auth/google', {
          idToken: tokenResponse.access_token
        });
        
        const apiResponse = response.data;
        const { user, accessToken } = apiResponse.data;

        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        window.dispatchEvent(new Event('user-login'));
        setLoading(false);
        
        const isForceUpdate = !user.firstName || !user.lastName || user.firstName === 'Google' || user.lastName === 'User';
        if (isForceUpdate) {
          navigate('/profile');
        } else {
          navigate('/');
        }
      } catch (err: any) {
        setLoading(false);
        console.error('Google Register/Login Error:', err.response?.data);
        setError(err.response?.data?.message || 'Đăng ký bằng Google thất bại.');
      }
    },
    onError: () => {
      setError('Đăng ký bằng Google thất bại.');
    }
  });

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
      if (password.length < 6) {
        setError('Mật khẩu phải chứa ít nhất 6 ký tự.');
        return;
      }

      setLoading(true);
      try {
        // Step 1: Request OTP
        const response = await api.post('/auth/register/send-otp', {
          email: email.toLowerCase().trim()
        });

        const apiResponse = response.data;
        // In dev mode (EnableMailtrap=false), backend returns the OTP code in response
        if (apiResponse.data && apiResponse.data.otpCode) {
          setDevOtpCode(apiResponse.data.otpCode);
        } else {
          setDevOtpCode('');
        }

        setLoading(false);
        setStep(2);
      } catch (err: any) {
        setLoading(false);
        console.error('Send OTP Error:', err.response?.data);
        setError(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
      }
    } else if (step === 2) {
      if (otp.length !== 6) {
        setError('Mã OTP phải chứa đúng 6 chữ số.');
        return;
      }

      setLoading(true);
      const username = email.split('@')[0];

      try {
        // Step 2: Verify OTP and Register
        const response = await api.post('/auth/register/verify', {
          email: email.toLowerCase().trim(),
          otp,
          username,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim()
        });

        const apiResponse = response.data;
        const { user, accessToken } = apiResponse.data;

        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        window.dispatchEvent(new Event('user-login'));
        setLoading(false);
        navigate('/');
      } catch (err: any) {
        setLoading(false);
        console.error('Verify OTP Error Details:', err.response?.data);
        
        const beErrors = err.response?.data?.errors;
        let errorMessage = 'Xác minh OTP và đăng ký thất bại.';
        
        if (beErrors) {
          errorMessage = Object.values(beErrors).flat().join(' | ');
        } else {
          errorMessage = err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.';
        }
        
        setError(errorMessage);
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
          <h2 className="text-[72px] font-display font-extrabold leading-[1.05] tracking-tight mb-8 text-on-surface">
            Bắt đầu hành trình<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500">với PM System.</span>
          </h2>
          <p className="text-on-surface-variant text-xl leading-relaxed max-w-lg font-medium">
            Tạo tài khoản để trải nghiệm hệ thống quản lý bãi xe thông minh, đặt chỗ nhanh chóng và nhận ưu đãi đặc biệt.
          </p>
        </div>

        <div className="flex items-center space-x-16 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col">
            <span className="text-5xl font-display font-extrabold text-on-surface tracking-tight mb-2">10k<span className="text-primary/60 text-3xl">+</span></span>
            <span className="text-outline text-[10px] uppercase tracking-[0.2em] font-bold">Người dùng tin dùng</span>
          </div>
          <div className="flex flex-col border-l border-primary/10 pl-12">
            <span className="text-5xl font-display font-extrabold text-on-surface tracking-tight mb-2">50<span className="text-primary/60 text-3xl">+</span></span>
            <span className="text-outline text-[10px] uppercase tracking-[0.2em] font-bold">Điểm đỗ xe thông minh</span>
          </div>
        </div>
      </section>

      {/* Register Section */}
      <section className="flex flex-col items-center justify-center w-full lg:w-[45%] p-8 md:p-16 relative z-20">
        <div className="w-full max-w-[460px] glass-panel p-10 md:p-12 rounded-[2.5rem] glow-border">
          {/* Back Button */}
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-outline hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest mb-6">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Quay lại
            </button>
          )}

          {/* Welcome Header */}
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-display font-extrabold text-on-surface tracking-tight mb-3">Tạo tài khoản</h2>
            <p className="text-on-surface-variant font-medium">Đã có tài khoản? <Link to="/login" className="text-primary hover:text-primary-container transition-all font-bold underline underline-offset-4 decoration-primary/30">Đăng nhập</Link></p>
          </div>

          {/* Form Wrapper */}
          <div className="w-full">
            {/* Step Progress */}
            <div className="flex gap-2 mb-10 justify-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-primary shadow-[0_0_10px_rgba(0,80,203,0.3)]' : 'w-4 bg-surface-container'}`}></div>
              ))}
            </div>

            <form onSubmit={handleNext} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 rounded-2xl animate-shake">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-xs font-bold text-red-600">{error}</p>
                </div>
              )}



              {step === 0 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Họ</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                        <input className="premium-input block w-full pl-12 pr-4 py-3 rounded-full border border-outline-variant focus:outline-none transition-all text-sm font-medium" placeholder="Nguyễn" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Tên</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                        <input className="premium-input block w-full pl-12 pr-4 py-3 rounded-full border border-outline-variant focus:outline-none transition-all text-sm font-medium" placeholder="Văn A" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                      </div>
                      <input className="premium-input block w-full pl-12 pr-4 py-3 rounded-full border border-outline-variant focus:outline-none transition-all text-sm font-medium" type="email" placeholder="email@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <button className="group relative overflow-hidden w-full py-3 bg-primary hover:bg-primary-container text-white font-semibold rounded-full transition-all duration-300 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transform hover:-translate-y-0.5 active:scale-[0.98] text-sm" type="submit">
                    <span className="relative z-10">Tiếp theo</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
                  </button>

                  {/* Divider */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-outline-variant/30"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/40">Hoặc đăng ký bằng</span>
                    <div className="flex-grow border-t border-outline-variant/30"></div>
                  </div>

                  {/* Google Sign In Button */}
                  <button 
                    type="button"
                    onClick={() => loginGoogle()}
                    className="group relative overflow-hidden w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-full border border-slate-200/80 shadow-sm transition-all duration-300 flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 active:scale-[0.98] text-sm"
                  >
                    <svg className="w-4.5 h-4.5 relative z-10 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="relative z-10">Đăng ký với Google</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/40 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
                  </button>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Mật khẩu</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                      </div>
                      <input className="premium-input block w-full pl-12 pr-4 py-3 rounded-full border border-outline-variant focus:outline-none transition-all text-sm font-medium" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Xác nhận mật khẩu</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                      </div>
                      <input className="premium-input block w-full pl-12 pr-4 py-3 rounded-full border border-outline-variant focus:outline-none transition-all text-sm font-medium" type="password" placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-start gap-3 px-1">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20" required id="terms" />
                    <label htmlFor="terms" className="text-xs text-on-surface-variant leading-relaxed">
                      Tôi đồng ý với <Link to="/terms" className="text-primary font-bold">Điều khoản sử dụng</Link> và <Link to="/privacy" className="text-primary font-bold">Chính sách bảo mật</Link>.
                    </label>
                  </div>
                  <button 
                    className={`group relative overflow-hidden w-full py-3 bg-primary hover:bg-primary-container text-white font-semibold rounded-full transition-all duration-300 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transform hover:-translate-y-0.5 active:scale-[0.98] text-sm ${loading ? 'opacity-80 cursor-wait' : ''}`} 
                    type="submit"
                    disabled={loading}
                  >
                    <span className="relative z-10">{loading ? 'ĐANG GỬI OTP...' : 'Đăng ký & Gửi OTP'}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="text-center p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                    <p className="text-xs text-on-surface-variant font-medium">Mã OTP đăng ký đã được gửi.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Mã xác thực OTP (6 chữ số)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">verified</span>
                      </div>
                      <input 
                        className="premium-input block w-full pl-12 pr-4 py-3 rounded-full border border-outline-variant focus:outline-none transition-all text-center text-lg font-bold tracking-[0.25em]" 
                        maxLength={6} 
                        required 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                        placeholder="000000" 
                      />
                    </div>
                  </div>
                  <button 
                    className={`group relative overflow-hidden w-full py-3 bg-primary hover:bg-primary-container text-white font-semibold rounded-full transition-all duration-300 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transform hover:-translate-y-0.5 active:scale-[0.98] text-sm ${loading ? 'opacity-80 cursor-wait' : ''}`} 
                    type="submit"
                    disabled={loading}
                  >
                    <span className="relative z-10">{loading ? 'ĐANG XÁC MINH...' : 'Xác nhận & Hoàn tất'}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
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

export default RegisterPage;
