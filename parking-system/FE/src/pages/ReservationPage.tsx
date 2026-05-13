import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReservationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: '2024-05-13',
    startTime: '',
    licensePlate: '',
    vehicleType: 'car'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/status');
  };

  return (
    <div className="bg-parkintel-light font-sans text-slate-900 min-h-screen selection:bg-parkintel-blue/10">
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        input:focus, select:focus {
          outline: none !important;
          box-shadow: none !important;
          border-color: #0055D4 !important;
        }

        input {
          appearance: none;
        }

        /* Custom radio styling for vehicle types */
        .vehicle-option input:checked + div {
          border-color: #0055D4;
          background-color: #ffffff;
        }
        
        .vehicle-option input:checked + div .radio-indicator {
          border-color: #0055D4;
          background-color: #0055D4;
        }
      `}} />

      {/* BEGIN: Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-8 py-5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-9 h-9 bg-parkintel-blue rounded-lg flex items-center justify-center shadow-lg shadow-parkintel-blue/20">
                <span className="text-white font-extrabold text-lg">P</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-800">ParkIntel</span>
            </div>
            {/* Links */}
            <div className="hidden md:flex items-center space-x-10 text-[13px] font-bold text-slate-400 uppercase tracking-widest">
              <a className="hover:text-parkintel-blue transition-colors" href="/">Home</a>
              <a className="text-parkintel-blue relative" href="/reserve">
                Đặt chỗ ngay
                <span className="absolute -bottom-8 left-0 w-full h-[3px] bg-parkintel-blue"></span>
              </a>
              <a className="hover:text-parkintel-blue transition-colors" href="/status">Dashboard</a>
              <a className="hover:text-parkintel-blue transition-colors" href="#">Contact</a>
            </div>
          </div>
          <div className="flex items-center space-x-8">
            <button className="text-[13px] font-bold text-slate-600 hover:text-parkintel-blue transition-colors tracking-widest uppercase">ĐĂNG NHẬP</button>
            <button className="bg-parkintel-blue text-white px-8 py-3 rounded-full text-[13px] font-bold tracking-widest shadow-lg shadow-parkintel-blue/20 hover:bg-parkintel-blue-dark transition-all">
              ĐĂNG KÝ
            </button>
          </div>
        </div>
      </nav>
      {/* END: Navigation */}

      {/* BEGIN: Main Content Area */}
      <main className="max-w-[1440px] mx-auto px-8 pt-32 pb-16 grid grid-cols-12 gap-16">
        {/* LEFT COLUMN: Reservation Form */}
        <section className="col-span-12 lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-[40px] p-8 shadow-premium border border-slate-50 relative">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Thông tin đặt chỗ</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Bước 1: Khởi tạo thông tin</p>
            </header>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Date Input */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Ngày gửi xe
                </label>
                <input 
                  className="w-full bg-slate-50 border-transparent border-b-slate-200 focus:border-b-parkintel-blue rounded-none py-4 px-1 text-slate-700 font-semibold text-lg transition-all" 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              {/* Time Input */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Giờ bắt đầu
                </label>
                <input 
                  className="w-full bg-slate-50 border-transparent border-b-slate-200 focus:border-b-parkintel-blue rounded-none py-4 px-1 text-slate-700 font-semibold text-lg transition-all" 
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                />
              </div>
              {/* Plate Number Input */}
              <div className="space-y-3">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Biển số xe
                </label>
                <input 
                  className="w-full bg-slate-50 border-transparent border-b-slate-200 focus:border-b-parkintel-blue rounded-none py-4 px-1 text-slate-700 font-bold text-xl tracking-wider placeholder:text-slate-300 transition-all uppercase" 
                  placeholder="51F-123.45" 
                  type="text"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                />
              </div>
              {/* Vehicle Selection */}
              <div className="space-y-5 pt-4">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Loại xe
                </label>
                <div className="space-y-2">
                  {/* Option: Car */}
                  <label className="vehicle-option block cursor-pointer">
                    <input 
                      checked={formData.vehicleType === 'car'} 
                      className="hidden" 
                      name="vehicle" 
                      type="radio"
                      onChange={() => setFormData({...formData, vehicleType: 'car'})}
                    />
                    <div className="flex items-center justify-between py-4 px-6 rounded-2xl border border-slate-100 bg-white hover:border-parkintel-blue transition-all">
                      <span className="font-bold text-slate-800 text-base">Ô tô (4-7 chỗ)</span>
                      <div className="radio-indicator w-3 h-3 rounded-full border border-slate-200 transition-all"></div>
                    </div>
                  </label>
                  {/* Option: SUV */}
                  <label className="vehicle-option block cursor-pointer">
                    <input 
                      checked={formData.vehicleType === 'suv'} 
                      className="hidden" 
                      name="vehicle" 
                      type="radio"
                      onChange={() => setFormData({...formData, vehicleType: 'suv'})}
                    />
                    <div className="flex items-center justify-between py-4 px-6 rounded-2xl border border-slate-100 bg-white hover:border-parkintel-blue transition-all">
                      <span className="font-bold text-slate-800 text-base">SUV / Bán tải</span>
                      <div className="radio-indicator w-3 h-3 rounded-full border border-slate-200 transition-all"></div>
                    </div>
                  </label>
                  {/* Option: Bike */}
                  <label className="vehicle-option block cursor-pointer">
                    <input 
                      checked={formData.vehicleType === 'bike'} 
                      className="hidden" 
                      name="vehicle" 
                      type="radio"
                      onChange={() => setFormData({...formData, vehicleType: 'bike'})}
                    />
                    <div className="flex items-center justify-between py-4 px-6 rounded-2xl border border-slate-100 bg-white hover:border-parkintel-blue transition-all">
                      <span className="font-bold text-slate-800 text-base">Xe máy</span>
                      <div className="radio-indicator w-3 h-3 rounded-full border border-slate-200 transition-all"></div>
                    </div>
                  </label>
                </div>
              </div>
              {/* Submit Action */}
              <button 
                className="w-full mt-8 bg-parkintel-blue text-white py-5 rounded-2xl font-bold text-base tracking-widest uppercase shadow-xl shadow-parkintel-blue/30 hover:bg-parkintel-blue-dark transition-all transform hover:-translate-y-1 active:translate-y-0" 
                type="submit"
              >
                Tiếp theo: Chọn vị trí
              </button>
            </form>
          </div>
        </section>
        {/* RIGHT COLUMN: Visualization & Marketing */}
        <section className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col space-y-12">
          {/* Copy Block */}
          <div className="flex-1 flex flex-col">
            <header className="mb-12">
              <div className="flex items-center space-x-3 text-parkintel-blue mb-6">
                <span className="w-2 h-2 bg-parkintel-blue rounded-full"></span>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.25em]">Vị trí trung tâm: Landmark 81 Bãi đỗ A1</span>
              </div>
              <h2 className="text-[56px] leading-[1.1] font-bold text-slate-800 max-w-2xl tracking-tight">
                Trải nghiệm <br/>
                <span className="text-parkintel-blue">đỗ xe thông minh</span><br/>
                một chạm.
              </h2>
              <p className="text-slate-400 mt-8 text-xl max-w-lg leading-relaxed font-medium">
                Sau khi cung cấp thông tin, hệ thống AI sẽ tự động đề xuất các vị trí tối ưu dựa trên thời gian và kích thước thực tế của xe.
              </p>
            </header>
            {/* Feature Chips */}
            <div className="grid grid-cols-2 gap-8 mb-16 max-w-2xl">
              <div className="border-l-2 border-slate-100 pl-8 py-2">
                <span className="text-[10px] font-extrabold text-parkintel-blue uppercase tracking-[0.25em] mb-2 block">An Toàn</span>
                <p className="text-slate-800 font-bold text-lg">Giám sát Camera AI 24/7</p>
              </div>
              <div className="border-l-2 border-slate-100 pl-8 py-2">
                <span className="text-[10px] font-extrabold text-parkintel-blue uppercase tracking-[0.25em] mb-2 block">Tiện Lợi</span>
                <p className="text-slate-800 font-bold text-lg">Thanh toán tự động</p>
              </div>
            </div>
            {/* 3D Visualization Placeholder */}
            <div className="flex-1 relative bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-soft group">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Simplified Visual Core */}
                <div className="w-[80%] h-[60%] border border-slate-50 rounded-2xl flex flex-col items-center justify-center space-y-4">
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>
                  <p className="text-slate-300 font-extrabold uppercase tracking-[0.3em] text-[10px]">Digital Twin Active</p>
                  <p className="text-slate-300 text-sm font-medium italic opacity-60">Cung cấp thông tin để xem bản đồ</p>
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>
                </div>
              </div>
              {/* Bottom Overlay Info */}
              <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center">
                <div className="flex space-x-12">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-widest mb-1">Hệ thống</span>
                    <span className="text-xs font-bold text-slate-400">V2.4.81</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-widest mb-1">Trạng thái</span>
                    <span className="text-xs font-bold text-slate-400">Đang chờ...</span>
                  </div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* END: Main Content Area */}

      {/* BEGIN: Footer Progress / Stats (Subtle) */}
      <footer className="max-w-[1440px] mx-auto px-8 pb-16">
        <div className="flex items-center justify-between border-t border-slate-100 pt-12">
          <div className="flex items-center space-x-16">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em] mb-1">Trạng thái bãi</span>
              <span className="text-slate-800 font-bold text-sm">84% Trống</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em] mb-1">Giờ cao điểm</span>
              <span className="text-slate-800 font-bold text-sm">17:00 - 19:00</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em] mb-1">Hỗ trợ</span>
              <span className="text-parkintel-blue font-bold text-sm tracking-wide">1900 8888</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Powered by ParkIntel AI</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
          </div>
        </div>
      </footer>
      {/* END: Footer Progress / Stats */}
    </div>
  );
};

export default ReservationPage;
