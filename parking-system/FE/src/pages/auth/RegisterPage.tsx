import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AlertCircle } from 'lucide-react';

const RegisterPage = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step < 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      
      // Auto-generate username from email
      const username = email.split('@')[0];

      try {
        const response = await api.post('/auth/register', {
          firstName,
          lastName,
          email,
          username,
          password
        });

        console.log('Registration Success:', response.data);
        setLoading(false);
        navigate('/login');
      } catch (err: any) {
        setLoading(false);
        console.error('Registration Error Details:', err.response?.data);
        
        // Trích xuất lỗi chi tiết từ Backend (nếu có)
        const beErrors = err.response?.data?.errors;
        let errorMessage = 'Đăng ký thất bại.';
        
        if (beErrors) {
          // Lấy tất cả các lỗi validation gộp lại thành 1 chuỗi
          errorMessage = Object.values(beErrors).flat().join(' | ');
        } else {
          errorMessage = err.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.';
        }
        
        setError(errorMessage);
      }
    }
  };

  return (
    <main className="flex min-h-screen w-full relative overflow-hidden mesh-bg font-sans antialiased text-on-surface">
      {/* Decoration Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-container/20 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Hero Section */}
      <section className="hidden lg:flex flex-col justify-between w-[55%] p-20 relative z-10">
        <div className="flex items-center space-x-3 group">
          <div className="w-12 h-12 logo-gradient rounded-xl flex items-center justify-center shadow-[0_8px_25px_rgba(0,102,255,0.25)] transition-transform duration-500 group-hover:rotate-12">
            <span className="text-white font-display font-extrabold text-2xl tracking-tighter">P</span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-extrabold tracking-tight text-on-surface">ParkIntel</h1>
            <div className="h-0.5 w-4 bg-primary-container rounded-full mt-[-2px]"></div>
          </div>
        </div>

        <div className="max-w-2xl opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Join the Community</span>
          </div>
          <h2 className="text-[72px] font-display font-extrabold leading-[1.05] tracking-tight mb-8 text-on-surface">
            Bắt đầu hành trình<br/>
            <span className="text-primary">với ParkIntel.</span>
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

        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-80">
        <div className="w-full h-full bg-primary/5 rounded-3xl border border-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-primary/20">directions_car</span>
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

            <form onSubmit={handleNext} className="space-y-7">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-shake">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-xs font-bold text-red-600">{error}</p>
                </div>
              )}

              {step === 0 && (
                <div className="space-y-7 animate-fade-in-up">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Họ</label>
                      <input className="premium-input block w-full px-5 py-5 rounded-2xl border border-outline-variant focus:outline-none transition-all text-[15px] font-medium" placeholder="Nguyễn" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Tên</label>
                      <input className="premium-input block w-full px-5 py-5 rounded-2xl border border-outline-variant focus:outline-none transition-all text-[15px] font-medium" placeholder="Văn A" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Email</label>
                    <input className="premium-input block w-full px-5 py-5 rounded-2xl border border-outline-variant focus:outline-none transition-all text-[15px] font-medium" type="email" placeholder="email@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <button className="w-full py-5 bg-primary hover:bg-primary-container text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-primary/10 tracking-wider uppercase text-xs" type="submit">
                    Tiếp theo
                  </button>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-7 animate-fade-in-up">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Mật khẩu</label>
                    <input className="premium-input block w-full px-5 py-5 rounded-2xl border border-outline-variant focus:outline-none transition-all text-[15px] font-medium" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Xác nhận mật khẩu</label>
                    <input className="premium-input block w-full px-5 py-5 rounded-2xl border border-outline-variant focus:outline-none transition-all text-[15px] font-medium" type="password" placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <div className="flex items-start gap-3 px-1">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20" required id="terms" />
                    <label htmlFor="terms" className="text-xs text-on-surface-variant leading-relaxed">
                      Tôi đồng ý với <Link to="/terms" className="text-primary font-bold">Điều khoản sử dụng</Link> và <Link to="/privacy" className="text-primary font-bold">Chính sách bảo mật</Link>.
                    </label>
                  </div>
                  <button 
                    className={`w-full py-5 bg-primary hover:bg-primary-container text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-primary/10 tracking-wider uppercase text-xs ${loading ? 'opacity-80 cursor-wait' : ''}`} 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'ĐANG XỬ LÝ...' : 'Hoàn tất đăng ký'}
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
