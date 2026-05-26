import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useGoogleLogin } from '@react-oauth/google';
import BrandLogo from '../../components/brand/BrandLogo';
import { syncCurrentUserFromApi } from '../../utils/auth';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        console.error('Google Login Error:', err.response?.data);
        setError(err.response?.data?.message || 'Đăng nhập Google thất bại.');
      }
    },
    onError: () => {
      setError('Đăng nhập Google thất bại.');
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        emailOrUsername: email,
        password: password
      });

      // Phản hồi từ BE mới có cấu trúc { success, data: { accessToken, user }, ... }
      const apiResponse = response.data;
      const { user, accessToken } = apiResponse.data;

      // Save to localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      await syncCurrentUserFromApi(api);

      setLoading(false);
      navigate('/profile');
    } catch (err: any) {
      setLoading(false);
      console.error('Login Error Details:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
    }
  };

  return (
    <main className="flex min-h-screen w-full relative overflow-hidden bg-mesh-gradient font-sans antialiased text-on-surface">
      {/* Decoration Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none mix-blend-multiply"></div>
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Hero Section */}
      <section className="hidden lg:flex flex-col justify-between w-[55%] p-20 relative z-10">
        {/* Brand Logo */}
        <BrandLogo size="lg" asLink />

        <div className="max-w-2xl opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-[72px] font-display font-extrabold leading-[1.05] tracking-tight mb-8 text-on-surface drop-shadow-sm">
            Quản lý bãi xe<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500">thông minh hơn.</span>
          </h2>
          <p className="text-on-surface-variant text-xl leading-relaxed max-w-lg font-medium">
            Hệ thống vận hành toàn bộ tòa nhà gửi xe — từ cổng vào đến slot, phí và báo cáo — trong một nền tảng duy nhất.
          </p>
        </div>

        {/* Metrics Footer */}
        <div className="flex items-center space-x-16 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col">
            <span className="text-5xl font-display font-extrabold text-on-surface tracking-tight mb-2">98<span className="text-primary/60 text-3xl">%</span></span>
            <span className="text-outline text-[10px] uppercase tracking-[0.2em] font-bold">Uptime hệ thống</span>
          </div>
          <div className="flex flex-col border-l border-primary/10 pl-12">
            <span className="text-5xl font-display font-extrabold text-on-surface tracking-tight mb-2">4<span className="text-primary/60 text-3xl">s</span></span>
            <span className="text-outline text-[10px] uppercase tracking-[0.2em] font-bold">Thời gian xử lý</span>
          </div>
          <div className="flex flex-col border-l border-primary/10 pl-12">
            <span className="text-5xl font-display font-extrabold text-primary tracking-tight mb-2">AI</span>
            <span className="text-outline text-[10px] uppercase tracking-[0.2em] font-bold">Phân bổ tự động</span>
          </div>
        </div>

        {/* Floating Slot Status Indicator */}
        <div className="absolute bottom-40 right-20 glass-panel glow-border p-5 rounded-2xl flex items-center space-x-5 animate-float opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/5 flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(0,80,203,0.3)]"></div>
            </div>
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <path className="text-primary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="71, 100" strokeWidth="2.5"></path>
            </svg>
          </div>
          <div>
            <p className="text-[9px] text-outline uppercase tracking-[0.25em] font-black">Slot khả dụng</p>
            <p className="text-xl font-display font-extrabold text-on-surface tracking-tighter">142 <span className="text-on-surface-variant/30 font-medium">/ 200</span></p>
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section className="flex flex-col items-center justify-center w-full lg:w-[45%] p-8 md:p-16 relative z-20">
        <div className="w-full max-w-[460px] bg-white/90 border border-white/60 backdrop-blur-xl p-10 md:p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05),0_0_40px_rgba(37,99,235,0.05)] relative overflow-hidden group/card">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80 group-hover/card:opacity-100 transition-opacity duration-500"></div>
          {/* Welcome Header */}
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight mb-3">Chào mừng trở lại</h2>
            <p className="text-slate-500 font-medium text-sm">Chưa có tài khoản? <Link to="/register" className="text-blue-600 hover:text-blue-700 transition-colors font-bold underline underline-offset-4 decoration-blue-500/30">Đăng ký ngay</Link></p>
          </div>

          {/* Form Wrapper */}
          <div className="w-full">
            {/* Form Fields */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1 block" htmlFor="email">Email or Username</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-blue-600 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <input
                    className="block w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all duration-300 text-sm font-semibold text-slate-700 focus:outline-none shadow-sm"
                    id="email"
                    type="text"
                    placeholder="Enter your email or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1 block" htmlFor="password">Password</label>
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-blue-600 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    className="block w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10 transition-all duration-300 text-sm font-semibold text-slate-700 focus:outline-none shadow-sm"
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-4.5 flex items-center cursor-pointer text-slate-400 hover:text-blue-600 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </div>
                </div>
                <div className="text-right mt-1.5">
                  <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Quên mật khẩu?</Link>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 rounded-2xl animate-shake">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-xs font-bold text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                className={`group relative overflow-hidden w-full py-4 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl transition-all duration-300 shadow-md shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-[0.98] text-[10px] uppercase tracking-[0.2em] cursor-pointer ${loading ? 'opacity-80 cursor-wait' : ''}`}
                type="submit"
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'ĐANG XỬ LÝ...' : 'Đăng nhập'}
                  {!loading && <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">arrow_forward</span>}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
              </button>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200/40"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400/80">Hoặc đăng nhập bằng</span>
                <div className="flex-grow border-t border-slate-200/40"></div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={() => loginGoogle()}
                className="group relative overflow-hidden w-full py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] text-[10px] uppercase tracking-[0.15em] cursor-pointer"
              >
                <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="relative z-10">Đăng nhập với Google</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
              </button>
            </form>
          </div>
        </div>

        <BrandLogo size="xs" className="lg:hidden mt-12 opacity-60" />
      </section>
    </main>
  );
};

export default LoginPage;
