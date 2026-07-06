import React from 'react';
import { QrCode, Keyboard, Camera, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

interface VisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitorSnapshot: string | null;
  visitorPlate: string;
  setVisitorPlate: (plate: string) => void;
  visitorVehicleType: string;
  setVisitorVehicleType: (type: string) => void;
  parkingLots: any[];
  selectedParkingLot: string;
  setSelectedParkingLot: (lotName: string) => void;
  generatedTicket: any;
  isGeneratingTicket: boolean;
  hasCameraAccess: boolean;
  handleCreateVisitorTicket: (e: React.FormEvent) => void;
  setScannedResult: (result: any) => void;
  setGateState: (state: any) => void;
  autoApprove: boolean;
  startAutoPassCountdown: () => void;
}

const VisitorModal: React.FC<VisitorModalProps> = ({
  isOpen,
  onClose,
  visitorSnapshot,
  visitorPlate,
  setVisitorPlate,
  visitorVehicleType,
  setVisitorVehicleType,
  parkingLots,
  selectedParkingLot,
  setSelectedParkingLot,
  generatedTicket,
  isGeneratingTicket,
  hasCameraAccess,
  handleCreateVisitorTicket,
  setScannedResult,
  setGateState,
  autoApprove,
  startAutoPassCountdown,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full relative p-7 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
              <QrCode size={18} />
            </span>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                CẤP PHÁT VÉ VÃNG LAI
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                Tạo mã QR & Chụp ảnh xe cổng vào
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all flex items-center justify-center text-xs font-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {!generatedTicket ? (
          <>
            {visitorSnapshot && (
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                  Ảnh thu nhận (Tự động chụp khi bấm F4)
                </label>
                <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={visitorSnapshot} alt="Snapshot" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <form onSubmit={handleCreateVisitorTicket} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block ml-0.5 mb-2">
                    Biển số phương tiện
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Keyboard size={16} />
                    </div>
                    <input
                      required
                      type="text"
                      placeholder="51G-112.22"
                      className="block w-full pl-11 pr-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-mono font-bold uppercase tracking-widest text-slate-800"
                      value={visitorPlate}
                      onChange={(e) => setVisitorPlate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block ml-0.5 mb-2">
                    Ngày giờ cấp vé
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                    </div>
                    <input
                      readOnly
                      type="text"
                      className="block w-full pl-10 pr-2 py-3 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 pointer-events-none"
                      value={new Date().toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block ml-0.5 mb-2">
                  Loại phương tiện
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'Car', label: 'Ô tô (Car)' },
                    { type: 'Motorbike', label: 'Xe máy' },
                    { type: 'Bicycle', label: 'Xe điện' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setVisitorVehicleType(item.type)}
                      className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        visitorVehicleType === item.type
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block ml-0.5 mb-2">
                  Tòa / Khu vực (Bãi đỗ)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">location_city</span>
                  </div>
                  <select
                    required
                    className="block w-full pl-11 pr-10 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-bold text-slate-800 appearance-none cursor-pointer"
                    value={selectedParkingLot}
                    onChange={(e) => setSelectedParkingLot(e.target.value)}
                  >
                    {parkingLots.map((lot, idx) => (
                      <option key={idx} value={lot.name}>
                        {lot.name} {lot.capacity ? `(Sức chứa: ${lot.capacity})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-500">
                  <Camera size={16} className={hasCameraAccess ? 'text-emerald-500 animate-pulse' : 'text-slate-400'} />
                  <span className="font-semibold text-slate-600">Ảnh chụp trước khi vào bãi</span>
                </div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  {hasCameraAccess ? 'READY' : 'MOCK'}
                </span>
              </div>

              <button
                disabled={isGeneratingTicket}
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
              >
                {isGeneratingTicket ? 'Đang tạo vé...' : 'Tạo vé & Ghi nhận xe vào'}
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center">
              <div className="w-full flex justify-between items-center border-b border-slate-200 pb-3 mb-4.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-black text-white text-[11px]">
                    P
                  </div>
                  <span className="text-[9px] font-black tracking-widest text-slate-800">THẺ VÉ VÃNG LAI</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400">ID: {generatedTicket.qrCode}</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-4 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    generatedTicket.qrCode
                  )}`}
                  alt="Ticket QR Code"
                  className="w-32 h-32"
                />
              </div>

              <div className="w-full grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4 mb-4">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Biển số xe</span>
                  <strong className="text-slate-900 tracking-wider block font-mono text-sm mt-0.5">
                    {generatedTicket.plate}
                  </strong>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Thời gian vào</span>
                  <strong className="text-slate-900 block mt-0.5">{generatedTicket.time}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest block">
                    Tòa / Khu vực (Bãi đỗ)
                  </span>
                  <strong className="text-slate-900 block mt-0.5">
                    {generatedTicket.parkingLotName || 'Khu Vực A (Vãng lai)'}
                  </strong>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Loại xe</span>
                  <strong className="text-blue-600 block mt-0.5">
                    {generatedTicket.vehicleType === 'Car' ? 'Ô tô' : 'Xe máy'}
                  </strong>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Phương án phí</span>
                  <strong className="text-emerald-600 block mt-0.5">Theo thời gian</strong>
                </div>
              </div>

              <div className="w-full flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-200 border border-slate-200 shrink-0">
                  <img src={generatedTicket.photo} alt="Car Captured" className="w-full h-full object-cover" />
                </div>
                <div className="text-[9px] text-slate-400 font-bold leading-tight">
                  <p className="text-slate-600">ẢNH CHỤP CAMERA CỔNG VÀO</p>
                  <p className="text-[8px] text-slate-400 uppercase mt-0.5">Đã ghi nhận trực tiếp vào MongoDB</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Vé xe Vãng lai</title>
                          <style>
                            body { font-family: sans-serif; text-align: center; padding: 40px; }
                            .card { border: 2px dashed #000; padding: 20px; border-radius: 10px; display: inline-block; width: 300px; }
                            h2 { margin: 0 0 10px 0; font-size: 18px; color: #000; text-transform: uppercase; }
                            p { margin: 8px 0; font-size: 14px; text-align: left; }
                            .divider { border-bottom: 1px dashed #000; margin: 15px 0; }
                            img { margin-top: 10px; width: 150px; height: 150px; }
                          </style>
                        </head>
                        <body>
                          <div class="card">
                            <h2>PM SYSTEM<br/><small style="font-size: 12px">THẺ GỬI XE VÃNG LAI</small></h2>
                            <div class="divider"></div>
                            <p><strong>Biển số:</strong> ${generatedTicket.plate}</p>
                            <p><strong>Tòa / Khu:</strong> ${generatedTicket.parkingLotName || 'Khu Vực A'}</p>
                            <p><strong>Giờ vào:</strong> ${generatedTicket.time}</p>
                            <div class="divider"></div>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                              generatedTicket.qrCode
                            )}" />
                            <p style="text-align: center; font-size: 10px; margin-top: 10px; font-family: monospace;">${
                              generatedTicket.qrCode
                            }</p>
                          </div>
                          <script>window.print();</script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Printer size={14} />
                In vé giấy
              </button>

              <button
                onClick={() => {
                  onClose();
                  setScannedResult({
                    plate: generatedTicket.plate,
                    status: 'Hợp lệ',
                    time: generatedTicket.time,
                    owner: 'KHÁCH VÃNG LAI',
                    ticketType: 'Vé vãng lai (Mới cấp)',
                    capturedPhoto: generatedTicket.photo,
                    registeredPhoto: generatedTicket.photo,
                    type: 'ENTRY',
                    qrCode: generatedTicket.qrCode,
                  });
                  setGateState('COMPARING');
                  if (autoApprove) {
                    startAutoPassCountdown();
                  }
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-blue-600/10"
              >
                Cho xe vào (ENTRY)
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VisitorModal;
