import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';

import { AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Danh sách tài khoản giả lập (Mock)
    const mockUsers = [
      {
        email: 'user@example.com',
        password: 'user123',
        data: {
          id: "usr_user_01",
          fullName: "Trần Thị B",
          email: "user@example.com",
          role: "user",
          avatar: "https://ui-avatars.com/api/?name=TT+B&background=10B981&color=fff"
        }
      },
      {
        email: 'admin@parkintel.com',
        password: 'admin123',
        data: {
          id: "usr_admin_01",
          fullName: "Nguyễn Văn A",
          email: "admin@parkintel.com",
          role: "admin",
          avatar: "https://ui-avatars.com/api/?name=NV+A&background=0066FF&color=fff"
        }
      }
    ];

    setTimeout(() => {
      const foundUser = mockUsers.find(u => u.email === email && u.password === password);

      if (foundUser) {
        setLoading(false);
        // Lưu vào localStorage
        localStorage.setItem('user', JSON.stringify(foundUser.data));
        // Thông báo cho Navbar cập nhật
        window.dispatchEvent(new Event('user-login'));
        navigate('/');
      } else {
        setLoading(false);
        setError('Email hoặc mật khẩu không chính xác. Vui lòng thử lại.');
      }
    }, 1200);
  };

  return (
    <main className="flex min-h-screen w-full relative overflow-hidden mesh-bg font-sans antialiased text-on-surface">
      {/* Decoration Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-container/20 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Hero Section */}
      <section className="hidden lg:flex flex-col justify-between w-[55%] p-20 relative z-10">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 group">
          <div className="w-12 h-12 logo-gradient rounded-xl flex items-center justify-center shadow-[0_8px_25px_rgba(0,102,255,0.25)] transition-transform duration-500 group-hover:rotate-12">
            <span className="text-white font-display font-extrabold text-2xl tracking-tighter">P</span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-extrabold tracking-tight text-on-surface">ParkIntel</h1>
            <div className="h-0.5 w-4 bg-primary-container rounded-full mt-[-2px]"></div>
          </div>
        </div>

        {/* Main Headline */}
        <div className="max-w-2xl opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Next-Gen Management Platform</span>
          </div>
          <h2 className="text-[72px] font-display font-extrabold leading-[1.05] tracking-tight mb-8 text-on-surface drop-shadow-sm">
            Quản lý bãi xe<br/>
            <span className="text-primary">thông minh hơn.</span>
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
        <div className="w-full max-w-[460px] glass-panel p-10 md:p-12 rounded-[2.5rem] glow-border">
          {/* Welcome Header */}
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-display font-extrabold text-on-surface tracking-tight mb-3">Chào mừng trở lại</h2>
            <p className="text-on-surface-variant font-medium">Chưa có tài khoản? <Link to="/register" className="text-primary hover:text-primary-container transition-all font-bold underline underline-offset-4 decoration-primary/30">Đăng ký ngay</Link></p>
          </div>

          {/* Form Wrapper */}
          <div className="w-full">
            {/* Form Fields */}
            <form onSubmit={handleLogin} className="space-y-7">
              {/* Email Input */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input 
                    className="premium-input block w-full pl-14 pr-5 py-5 rounded-2xl border border-outline-variant focus:outline-none transition-all text-[15px] font-medium" 
                    id="email" 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1" htmlFor="password">Password</label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input 
                    className="premium-input block w-full pl-14 pr-14 py-5 rounded-2xl border border-outline-variant focus:outline-none transition-all text-[15px] font-medium" 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <div className="absolute inset-y-0 right-0 pr-5 flex items-center cursor-pointer text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </div>
                </div>
                <div className="text-right mt-2">
                  <Link to="/forgot-password" size="sm" className="text-xs font-bold text-primary hover:text-primary-container transition-colors">Quên mật khẩu?</Link>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-shake">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-xs font-bold text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button 
                className={`w-full py-5 bg-primary hover:bg-primary-container text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-primary/10 hover:shadow-primary/20 transform hover:-translate-y-0.5 active:scale-[0.98] tracking-wider uppercase text-xs ${loading ? 'opacity-80 cursor-wait' : ''}`} 
                type="submit"
                disabled={loading}
              >
                {loading ? 'ĐANG XỬ LÝ...' : 'Đăng nhập hệ thống'}
              </button>

              {/* Security Notice */}
              <div className="mt-10 flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low">
                <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Demo: Khóa tài khoản sau 5 lần sai</span>
              </div>
            </form>
          </div>
        </div>

        {/* Mobile Brand Footer */}
        <div className="lg:hidden mt-12 flex items-center space-x-3 opacity-60">
          <div className="w-7 h-7 logo-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-display font-extrabold text-[12px]">P</span>
          </div>
          <h1 className="text-sm font-display font-bold tracking-tight text-on-surface">ParkIntel</h1>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
