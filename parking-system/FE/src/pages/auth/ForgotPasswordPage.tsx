import React, { useState } from 'react';
import BrandLogo from '../../components/brand/BrandLogo';
import { Link, useNavigate } from 'react-router-dom';


const ForgotPasswordPage = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
    } else {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        navigate('/login');
      }, 1500);
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
            Khôi phục<br/>
            <span className="text-primary">tài khoản của bạn.</span>
          </h2>
          <p className="text-on-surface-variant text-xl leading-relaxed max-w-lg font-medium">
            Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại mật khẩu chỉ trong vài phút thông qua quy trình xác thực an toàn.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="flex flex-col items-center justify-center w-full lg:w-[45%] p-8 md:p-16 relative z-20">
        <div className="w-full max-w-[460px] glass-panel p-10 md:p-12 rounded-[2.5rem] glow-border">
          {/* Back Button */}
          <Link to="/login" className="flex items-center gap-2 text-outline hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest mb-6">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Về trang đăng nhập
          </Link>

          {/* Welcome Header */}
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-display font-extrabold text-on-surface tracking-tight mb-3">Quên mật khẩu</h2>
            <p className="text-on-surface-variant font-medium">Nhập thông tin bên dưới để tiếp tục.</p>
          </div>

          {/* Form Wrapper */}
          <div className="w-full">
            <form onSubmit={handleNext} className="space-y-7">
              {step === 0 && (
                <div className="space-y-7 animate-fade-in-up">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Email khôi phục</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                      </div>
                      <input className="premium-input block w-full pl-14 pr-5 py-5 rounded-2xl border border-outline-variant focus:outline-none transition-all text-[15px] font-medium" type="email" placeholder="email@example.com" required />
                    </div>
                  </div>
                  <button className="w-full py-5 bg-primary hover:bg-primary-container text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-primary/10 tracking-wider uppercase text-xs" type="submit">
                    Gửi mã xác thực
                  </button>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-7 animate-fade-in-up">
                  <div className="text-center p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                    <p className="text-xs text-on-surface-variant">Mã OTP đã được gửi. Vui lòng nhập mã để đặt lại mật khẩu.</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    {[0,1,2,3,4,5].map(i => (
                      <input key={i} className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white" maxLength={1} required />
                    ))}
                  </div>
                  <button className="w-full py-5 bg-primary hover:bg-primary-container text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-primary/10 tracking-wider uppercase text-xs" type="submit">
                    Xác nhận mã OTP
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-7 animate-fade-in-up">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Mật khẩu mới</label>
                    <input className="premium-input block w-full px-5 py-5 rounded-2xl border border-outline-variant focus:outline-none transition-all text-[15px] font-medium" type="password" placeholder="••••••••" required />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70 ml-1">Xác nhận mật khẩu mới</label>
                    <input className="premium-input block w-full px-5 py-5 rounded-2xl border border-outline-variant focus:outline-none transition-all text-[15px] font-medium" type="password" placeholder="••••••••" required />
                  </div>
                  <button 
                    className={`w-full py-5 bg-primary hover:bg-primary-container text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-primary/10 tracking-wider uppercase text-xs ${loading ? 'opacity-80 cursor-wait' : ''}`} 
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
