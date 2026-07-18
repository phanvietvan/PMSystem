import React from 'react';
import { Printer, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

interface GateOpenPanelProps {
  generatedTicket: any;
  ticketQrDataUrl: string;
  isTouchDevice: boolean;
  setGeneratedTicket: (ticket: any) => void;
  setExtraFees: (fees: any[]) => void;
  setIsAddingSurcharge: (val: boolean) => void;
  setGateState: (state: any) => void;
  fetchRecentSessions: () => void;
  scannedResult: any;
  countdownTimerRef: React.MutableRefObject<any>;
}

const GateOpenPanel: React.FC<GateOpenPanelProps> = ({
  generatedTicket,
  ticketQrDataUrl,
  isTouchDevice,
  setGeneratedTicket,
  setExtraFees,
  setIsAddingSurcharge,
  setGateState,
  fetchRecentSessions,
  scannedResult,
  countdownTimerRef,
}) => {
  return (
    <div className="flex-1 bg-emerald-600 text-white flex flex-col items-center justify-center p-3 md:p-6 text-center animate-fade-in relative min-h-[500px]">
      {generatedTicket ? (
        /* Display REAL print-ready Entry Ticket for the guest */
        <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6 bg-white text-slate-800 p-4 md:p-6 rounded-3xl shadow-2xl max-w-xl w-full border border-emerald-100 animate-scale-up">
          {/* Ticket Left: QR and Core Details */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
            <span className="text-[9px] font-black tracking-widest text-emerald-600 uppercase bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full mb-3">
              PHIẾU GỬI XE - VÉ VÀO
            </span>

            {/* Real dynamic QR Code from API */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-md">
              {ticketQrDataUrl ? (
                <img src={ticketQrDataUrl} alt="Ticket QR Code" className="w-32 h-32 animate-fade-in" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                  Đang tạo QR...
                </div>
              )}
            </div>

            <span className="text-[10px] font-mono font-bold text-slate-400 mt-2 tracking-wider">
              {generatedTicket.qrCode}
            </span>
          </div>

          {/* Ticket Right: Metadata & Printing controls */}
          <div className="flex-1 flex flex-col justify-between text-left pt-4 md:pt-0 md:pl-6">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  BIỂN SỐ ĐỊNH DANH
                </span>
                <span className="text-xl font-mono font-black text-slate-900 tracking-widest bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl shadow-sm inline-block mt-1">
                  {generatedTicket.plate}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">GIỜ VÀO</span>
                  <span className="text-xs font-bold text-slate-700 mt-0.5 block">{generatedTicket.time}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">LỐI SOÁT</span>
                  <span className="text-xs font-bold text-emerald-600 mt-0.5 block uppercase">Cổng Vào chính</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">
                    TÒA NHÀ / BÃI ĐỖ
                  </span>
                  <span className="text-sm font-black text-emerald-600 mt-0.5 block uppercase truncate">
                    {generatedTicket.parkingLotName || 'Khu Vực A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={async () => {
                  await fetchRecentSessions();
                  setGeneratedTicket(null);
                  setExtraFees([]);
                  setIsAddingSurcharge(false);
                  setGateState('SCANNING');
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer size={14} /> {isTouchDevice ? 'TIẾP TỤC' : 'TIẾP TỤC [SPACE]'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Display Standard Exit / Gate Open screen */
        <div className="flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white mb-6"
          >
            <Unlock size={38} className="text-white animate-pulse" />
          </motion.div>

          <h1 className="text-2xl font-black tracking-wider uppercase mb-1">CỔNG ĐANG MỞ</h1>
          <p className="text-xs font-semibold tracking-wider text-emerald-100 uppercase">
            Mới xe{' '}
            <strong className="text-white bg-slate-900/30 px-3 py-1 rounded-lg border border-white/20 font-mono tracking-widest text-sm mx-1">
              {scannedResult?.plate}
            </strong>{' '}
            đi qua lối soát
          </p>

          <div className="w-64 h-1 bg-white/20 mt-8 overflow-hidden rounded-full relative">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 2.2, ease: 'linear' }}
              className="absolute inset-y-0 left-0 bg-white"
            />
          </div>
          <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest mt-3">
            Thanh chắn sẽ tự động hạ sau 2 giây...
          </p>

          <button
            onClick={() => {
              if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                const nowStr = new Date().toLocaleString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Hóa đơn thanh toán</title>
                      <style>
                        body { font-family: sans-serif; text-align: center; padding: 40px; }
                        .card { border: 2px dashed #000; padding: 20px; border-radius: 10px; display: inline-block; width: 300px; }
                        h2 { margin: 0 0 10px 0; font-size: 18px; color: #000; text-transform: uppercase; }
                        p { margin: 8px 0; font-size: 14px; text-align: left; }
                        .divider { border-bottom: 1px dashed #000; margin: 15px 0; }
                      </style>
                    </head>
                    <body>
                      <div class="card">
                        <h2>PM SYSTEM<br/><small style="font-size: 12px">HÓA ĐƠN THANH TOÁN</small></h2>
                        <div class="divider"></div>
                        <p><strong>Biển số:</strong> ${scannedResult?.plate}</p>
                        <p><strong>Loại vé:</strong> ${scannedResult?.ticketType}</p>
                        <p><strong>Giờ vào:</strong> ${scannedResult?.entryTime || 'N/A'}</p>
                        <p><strong>Giờ ra:</strong> ${nowStr}</p>
                        <div class="divider"></div>
                        <p style="text-align: center; font-weight: bold; font-size: 16px;">CẢM ƠN QUÝ KHÁCH!</p>
                      </div>
                      <script>window.print();</script>
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }
            }}
            className="mt-6 py-2.5 px-6 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Printer size={14} /> In hóa đơn ra
          </button>
        </div>
      )}
    </div>
  );
};

export default GateOpenPanel;
