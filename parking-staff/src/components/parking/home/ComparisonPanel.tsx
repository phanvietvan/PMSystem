import React from 'react';
import { Camera, AlertTriangle } from 'lucide-react';

interface ComparisonPanelProps {
  scannedResult: any;
  setScannedResult: (result: any) => void;
  isCountdownActive: boolean;
  countdown: number;
  setIsCountdownActive: (active: boolean) => void;
  countdownTimerRef: React.MutableRefObject<any>;
  gateMode: 'ENTRY' | 'EXIT';
  isTouchDevice: boolean;
  denyPass: () => void;
  confirmPass: () => void;
  extraFees: any[];
  setExtraFees: (fees: any[]) => void;
  isAddingSurcharge: boolean;
  setIsAddingSurcharge: (val: boolean) => void;
  surchargeDraft: any;
  setSurchargeDraft: (draft: any) => void;
  parkingLots: any[];
  selectedParkingLot: string;
  setSelectedParkingLot: (val: string) => void;
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  scannedResult,
  setScannedResult,
  isCountdownActive,
  countdown,
  setIsCountdownActive,
  countdownTimerRef,
  gateMode,
  isTouchDevice,
  denyPass,
  confirmPass,
  extraFees,
  setExtraFees,
  isAddingSurcharge,
  setIsAddingSurcharge,
  surchargeDraft,
  setSurchargeDraft,
  parkingLots,
  selectedParkingLot,
  setSelectedParkingLot,
}) => {
  if (!scannedResult) return null;

  return (
    <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-3xl text-slate-800 animate-scale-up relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-50/80 before:via-white/50 before:to-transparent before:-z-10 z-10 overflow-hidden">
      {/* Countdown progress / manual override indicator */}
      {isCountdownActive ? (
        <div className="bg-blue-50/80 backdrop-blur-md border-b border-blue-100/50 px-6 py-3 flex justify-between items-center text-xs font-semibold text-blue-800 relative z-10">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping" />
            Tự động duyệt và cho xe qua sau <strong className="font-black text-blue-700">{countdown} giây</strong>...
          </span>
          <button
            onClick={() => {
              setIsCountdownActive(false);
              if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-wider cursor-pointer shadow-md transition-all active:scale-95"
          >
            [ESC] DỪNG TỰ ĐỘNG
          </button>
        </div>
      ) : (
        <div className="bg-amber-50/80 backdrop-blur-md border-b border-amber-100/50 px-6 py-3 flex justify-between items-center text-xs font-semibold text-amber-800 relative z-10">
          <span className="flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-600 drop-shadow-sm" />
            Đã tạm dừng tự động. Vui lòng bấm xác nhận bên dưới.
          </span>
        </div>
      )}

      {scannedResult.type === 'ENTRY' ? (
        // ENTRY CONFIRMATION PANEL
        <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch relative z-10 bg-transparent min-h-0">
          {/* Left: Captured camera photo */}
          <div className="md:col-span-5 flex flex-col gap-4 min-h-0">
            <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-fit">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Camera size={14} className="text-blue-500 drop-shadow-sm" /> Ảnh Nhận Diện
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border-2 border-white relative bg-slate-100 group shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50 aspect-video w-full">
                <img
                  src={scannedResult.capturedPhoto}
                  alt="Gate Capture"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-2 bg-blue-600/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] text-white font-black tracking-widest shadow-lg border border-white/20">
                  CAMERA VÀO
                </div>
              </div>
            </div>
          </div>

          {/* Right: Editable Plate + Info */}
          <div className="md:col-span-7 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 h-full min-h-0">
            <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-slate-100 shrink-0 relative overflow-hidden flex flex-col gap-8">
              {/* 1. Biển số xe & Trạng thái */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">pin</span>
                    Biển số nhận diện
                  </span>
                  <div className="flex gap-2">
                    <span className="bg-blue-50 text-blue-600 px-3.5 py-1.5 rounded-full text-[10px] uppercase font-bold border border-blue-100/50 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
                      {scannedResult.ticketType.split(' • ')[0]}
                    </span>
                    {(scannedResult.depositFee > 0 || scannedResult.ticketType.includes('Đặt trước')) && (
                      <span className="bg-emerald-50 text-emerald-600 px-3.5 py-1.5 rounded-full text-[10px] uppercase font-bold border border-emerald-100/50 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">payments</span>
                        Đã cọc: {(scannedResult.depositFee || 0).toLocaleString()} VNĐ
                      </span>
                    )}
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full text-center text-4xl font-black tracking-[0.1em] text-slate-800 bg-white border border-slate-200/80 rounded-[2.5rem] py-4 px-6 focus:ring-4 focus:ring-blue-100/50 focus:border-blue-300 transition-all outline-none"
                    value={scannedResult.plate}
                    onChange={(e) => setScannedResult({ ...scannedResult, plate: e.target.value.toUpperCase() })}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 opacity-60 hover:opacity-100 cursor-pointer transition-opacity bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full border border-slate-100">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </div>
                </div>
              </div>

              {/* 1.5 Chọn bãi đỗ cho xe vãng lai (không có đặt trước) */}
              {!scannedResult.reservationDate && !scannedResult.parkingLotName && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[14px]">location_city</span>
                    Tòa / Khu vực (Bãi đỗ)
                  </label>
                  <div className="relative">
                    <select
                      className="w-full text-sm font-bold tracking-wider text-slate-700 bg-slate-50 border border-slate-200/80 rounded-[2rem] py-3.5 px-5 focus:ring-4 focus:ring-blue-100/50 focus:border-blue-300 transition-all outline-none appearance-none cursor-pointer"
                      value={selectedParkingLot}
                      onChange={(e) => setSelectedParkingLot(e.target.value)}
                    >
                      {parkingLots.map((lot, idx) => (
                        <option key={idx} value={lot.name}>
                          {lot.name} {lot.capacity ? `(Sức chứa: ${lot.capacity})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Ô đậu nếu có */}
              {scannedResult.parkingSlot && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ô đậu</label>
                  <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-[2rem] px-5 py-3">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">local_parking</span>
                    <span className="text-sm font-semibold text-slate-700">{scannedResult.parkingSlot}</span>
                  </div>
                </div>
              )}

              {/* 3. Chủ xe */}
              {scannedResult.userInfo && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      Chủ xe
                    </h3>
                  </div>
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Họ & Tên</label>
                      <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-[2rem] px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-slate-400 text-[20px]">account_circle</span>
                          <span className="text-sm font-bold text-slate-700">
                            {`${
                              scannedResult.userInfo.lastName || scannedResult.userInfo.LastName || ''
                            } ${
                              scannedResult.userInfo.firstName || scannedResult.userInfo.FirstName || ''
                            }`.trim() ||
                              scannedResult.userInfo.username ||
                              scannedResult.userInfo.Username ||
                              'N/A'}
                          </span>
                        </div>
                        <span className="bg-blue-50 text-blue-600 px-3.5 py-1 rounded-full text-[9px] font-bold border border-blue-100/50">
                          Khách hàng
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          Số điện thoại
                        </label>
                        <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-[2rem] px-5 py-3">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">call</span>
                          <span className="text-sm font-semibold text-slate-700 truncate">
                            {scannedResult.userInfo.phoneNumber || scannedResult.userInfo.PhoneNumber || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                        <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-[2rem] px-5 py-3">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">mail</span>
                          <span className="text-sm font-semibold text-slate-700 truncate">
                            {scannedResult.userInfo.email || scannedResult.userInfo.Email || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // EXIT COMPARISON PANEL
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 relative z-10 bg-transparent min-h-0 overflow-y-auto custom-scrollbar">
          {/* Left: Photos */}
          <section className="lg:col-span-5 flex flex-col gap-4 min-h-0">
            {/* Current Photo */}
            <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-[1.75rem] overflow-hidden flex flex-col shadow-[0_12px_40px_-12px_rgba(0,0,0,0.04)] shrink-0">
              <div className="px-4 py-2.5 bg-white/40 flex justify-between items-center border-b border-white/60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">videocam</span>
                  <h3 className="text-[10px] font-bold tracking-widest text-slate-700 uppercase">Ảnh hiện tại</h3>
                </div>
                <span className="flex items-center gap-1.5 text-red-500 text-[9px] font-bold uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full border border-red-100/50">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                  Live
                </span>
              </div>
              <div className="relative group aspect-video w-full bg-slate-100">
                {scannedResult.capturedPhoto ? (
                  <img
                    src={scannedResult.capturedPhoto}
                    alt="Gate Capture"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                    <span className="material-symbols-outlined text-[32px] text-slate-300">videocam_off</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      Không chụp được camera
                    </span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-white/50 backdrop-blur-md border border-white/70 px-3 py-1 rounded-xl text-[9px] text-slate-800 font-semibold tracking-widest shadow-sm">
                  GATE-OUT
                </div>
              </div>
            </div>
            {/* Entry Photo */}
            <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-[1.75rem] overflow-hidden flex flex-col shadow-[0_12px_40px_-12px_rgba(0,0,0,0.04)] shrink-0">
              <div className="px-4 py-2.5 bg-white/40 flex justify-between items-center border-b border-white/60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">history</span>
                  <h3 className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">Ảnh lúc vào</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  {scannedResult.entryTime || ''}
                </span>
              </div>
              <div className="relative group aspect-video w-full bg-slate-100">
                {scannedResult.registeredPhoto ? (
                  <img
                    src={scannedResult.registeredPhoto}
                    alt="Entry Capture"
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-1.5 p-4 text-center">
                    <span className="material-symbols-outlined text-[32px] text-slate-300">image_not_supported</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                      Không có ảnh lúc vào
                    </span>
                    <span className="text-[8px] text-slate-400 font-medium">
                      Phiên chưa lưu EntryPhoto khi check-in
                    </span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-slate-800/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-xl text-[9px] text-white font-medium tracking-widest">
                  GATE-IN
                </div>
              </div>
            </div>
          </section>

          {/* Right: Details */}
          <div className="md:col-span-7 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 h-full min-h-0">
            <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-slate-100 shrink-0 relative overflow-hidden flex flex-col gap-8">
              {/* 1. Header & Biển số xe */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 tracking-wide uppercase">
                      Đối chiếu thông tin xe
                    </h2>
                    <p className="text-[10px] font-medium text-slate-500">
                      Xác thực khớp hình dạng xe & biển số hệ thống
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-sm ${
                      (scannedResult.plate || '').replace(/[^A-Z0-9]/g, '') ===
                      (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, '')
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                        : 'bg-rose-50 text-rose-600 border-rose-100/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {(scannedResult.plate || '').replace(/[^A-Z0-9]/g, '') ===
                      (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, '')
                        ? 'check_circle'
                        : 'cancel'}
                    </span>
                    <span className="font-bold text-[10px] uppercase tracking-widest">
                      {(scannedResult.plate || '').replace(/[^A-Z0-9]/g, '') ===
                      (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, '')
                        ? 'Trùng khớp'
                        : 'Không khớp'}
                    </span>
                  </div>
                </div>

                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1 mt-2">
                  <span className="material-symbols-outlined text-[14px]">pin</span>
                  Biển số xe ra (có thể sửa)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full text-center text-4xl font-black tracking-[0.1em] text-slate-800 bg-white border border-slate-200/80 rounded-[2.5rem] py-4 px-6 focus:ring-4 focus:ring-blue-100/50 focus:border-blue-300 transition-all outline-none"
                    value={scannedResult.exitPlate || ''}
                    onChange={(e) => setScannedResult({ ...scannedResult, exitPlate: e.target.value.toUpperCase() })}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 opacity-60 hover:opacity-100 cursor-pointer transition-opacity bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full border border-slate-100">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 mt-1">
                {/* Thông tin gửi xe */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Thông tin gửi xe
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Biển số vào
                      </label>
                      <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                        <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">pin</span>
                        <span className="text-[12px] font-bold text-slate-700 tracking-wider">
                          {scannedResult.plate || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giờ vào</label>
                      <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                        <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">login</span>
                        <span className="text-[12px] font-semibold text-slate-700">
                          {scannedResult.entryTime || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giờ ra</label>
                      <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                        <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">logout</span>
                        <span className="text-[12px] font-semibold text-slate-700">
                          {scannedResult.time?.split(' ')[0] || 'N/A'}
                        </span>
                      </div>
                    </div>
                    {scannedResult.parkingLotName && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          Tòa / Khu
                        </label>
                        <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                          <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">apartment</span>
                          <span className="text-[12px] font-semibold text-slate-700">
                            {scannedResult.parkingLotName}
                          </span>
                        </div>
                      </div>
                    )}
                    {scannedResult.parkingSlot && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ô đậu</label>
                        <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                          <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">
                            local_parking
                          </span>
                          <span className="text-[12px] font-semibold text-slate-700">{scannedResult.parkingSlot}</span>
                        </div>
                      </div>
                    )}
                    {scannedResult.reservationDate && (
                      <>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Ngày đặt
                          </label>
                          <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                            <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">event</span>
                            <span className="text-[12px] font-semibold text-slate-700">
                              {new Date(scannedResult.reservationDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Giờ đặt
                          </label>
                          <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                            <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">schedule</span>
                            <span className="text-[12px] font-semibold text-slate-700">
                              {scannedResult.reservationStartTime}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mã vé</label>
                      <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                        <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">qr_code</span>
                        <span className="text-[11px] font-bold text-slate-600 font-mono tracking-wider break-all">
                          {scannedResult.qrCode}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chủ xe */}
                {scannedResult.userInfo && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        Chủ xe
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          Họ & Tên
                        </label>
                        <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-slate-400 text-[18px] shrink-0">
                              account_circle
                            </span>
                            <span className="text-[12px] font-bold text-slate-700">
                              {`${
                                scannedResult.userInfo.lastName || scannedResult.userInfo.LastName || ''
                              } ${
                                scannedResult.userInfo.firstName || scannedResult.userInfo.FirstName || ''
                              }`.trim() ||
                                scannedResult.userInfo.username ||
                                scannedResult.userInfo.Username ||
                                'N/A'}
                            </span>
                          </div>
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-slate-200/80 shrink-0 ml-1.5 hidden sm:inline-block">
                            Khách
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          Số điện thoại
                        </label>
                        <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                          <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">call</span>
                          <span className="text-[12px] font-semibold text-slate-700">
                            {scannedResult.userInfo.phoneNumber || scannedResult.userInfo.PhoneNumber || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                        <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                          <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">mail</span>
                          <span className="text-[12px] font-semibold text-slate-700">
                            {scannedResult.userInfo.email || scannedResult.userInfo.Email || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Decision Actions Block */}
      <div className="px-6 pb-5 pt-3 bg-white/30 border-t border-white/50 shrink-0">
        <div className="flex gap-4">
          <button
            onClick={denyPass}
            className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 py-3.5 px-6 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all duration-300 font-bold text-[11px] tracking-wider shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">report</span>
            {isTouchDevice ? 'TỪ CHỐI / BÁO ĐỘNG' : '[ESC] TỪ CHỐI / BÁO ĐỘNG'}
          </button>

          {scannedResult.type === 'ENTRY' && (
            <button
              onClick={confirmPass}
              className="flex-[2] bg-blue-600 text-white hover:bg-blue-700 py-3.5 px-6 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all duration-300 font-bold text-[11px] tracking-wider shadow-[0_8px_24px_-6px_rgba(37,99,235,0.35)] hover:shadow-[0_12px_28px_-6px_rgba(37,99,235,0.45)] transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              {isTouchDevice ? 'XÁC NHẬN CẤP VÉ' : '[F8] XÁC NHẬN CẤP VÉ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonPanel;
