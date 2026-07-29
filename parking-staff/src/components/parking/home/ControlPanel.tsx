import React from 'react';
import { playChimeSound } from '../../../utils/audio';

interface ControlPanelProps {
  currentOccupied: number;
  maxCapacity: number;
  parkingLots: any[];
  selectedParkingLot: string;
  setSelectedParkingLot: (val: string) => void;
  gateState: 'SCANNING' | 'COMPARING' | 'GATE_OPEN';
  gateMode: 'ENTRY' | 'EXIT';
  setGateMode: (mode: 'ENTRY' | 'EXIT') => void;
  captureFrame: () => string | null;
  setVisitorSnapshot: (snapshot: string | null) => void;
  setShowVisitorModal: (show: boolean) => void;
  setVisitorPlate: (plate: string) => void;
  setGeneratedTicket: (ticket: any) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentOccupied,
  maxCapacity,
  parkingLots,
  selectedParkingLot,
  setSelectedParkingLot,
  gateState,
  gateMode,
  setGateMode,
  captureFrame,
  setVisitorSnapshot,
  setShowVisitorModal,
  setVisitorPlate,
  setGeneratedTicket,
}) => {
  return (
    <div className="bg-white/75 backdrop-blur-2xl p-6 rounded-[1.5rem] border border-white/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col gap-5 relative z-10 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600" />
          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">CẤU HÌNH CỔNG</span>
        </div>
        <div className="bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/50">
          <span className="text-[10px] font-bold text-blue-600">
            SỨC CHỨA: {currentOccupied}/{maxCapacity}
          </span>
        </div>
      </div>

      {/* Building selector for Staff */}
      <div className="flex flex-col gap-1.5 mb-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">location_city</span>
          Đang trực tại
        </label>
        <div className="relative">
          <select
            className="w-full text-sm font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200/80 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none cursor-pointer shadow-sm"
            value={selectedParkingLot}
            onChange={(e) => setSelectedParkingLot(e.target.value)}
          >
            {parkingLots.map((lot, idx) => (
              <option key={idx} value={lot.name}>
                {lot.name}
                {lot.isAcceptingEntries === false ? ' (chỉ cho xe ra)' : ''}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none flex items-center">
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
        </div>
        {parkingLots.find((p) => p.name === selectedParkingLot)?.isAcceptingEntries === false && (
          <div className="mt-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800 leading-snug">
            Bãi đang đóng nhận xe — chỉ cho xe RA, không nhận xe VÀO / vé vãng lai.
          </div>
        )}
      </div>

      {/* Segmented Gate Mode switcher */}
      <div className="flex bg-slate-100/80 rounded-full p-1 border border-slate-200/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] relative">
        <button
          disabled={gateState !== 'SCANNING'}
          onClick={() => {
            playChimeSound();
            setGateMode('ENTRY');
          }}
          className={`flex-1 py-2 text-[11px] font-bold uppercase rounded-full transition-all duration-300 cursor-pointer disabled:opacity-40 relative z-10 text-center ${
            gateMode === 'ENTRY'
              ? 'bg-white text-blue-600 shadow-sm border border-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
          }`}
        >
          XE VÀO (ENTRY)
        </button>
        <button
          disabled={gateState !== 'SCANNING'}
          onClick={() => {
            playChimeSound();
            setGateMode('EXIT');
          }}
          className={`flex-1 py-2 text-[11px] font-bold uppercase rounded-full transition-all duration-300 cursor-pointer disabled:opacity-40 relative z-10 text-center ${
            gateMode === 'EXIT'
              ? 'bg-white text-blue-600 shadow-sm border border-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
          }`}
        >
          XE RA (EXIT)
        </button>
      </div>

      {/* Control Action triggers */}
      {gateMode === 'ENTRY' && (
        <button
          onClick={() => {
            const lot = parkingLots.find((p) => p.name === selectedParkingLot);
            if (lot?.isAcceptingEntries === false) {
              alert(`Bãi "${selectedParkingLot}" đang đóng nhận xe — chỉ cho xe RA.`);
              return;
            }
            playChimeSound();
            setVisitorSnapshot(captureFrame());
            setShowVisitorModal(true);
            setVisitorPlate('');
            setGeneratedTicket(null);
          }}
          className="w-full bg-blue-600 text-white rounded-lg py-3 flex items-center justify-between px-4 shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] active:scale-95 transition-transform mt-2 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">confirmation_number</span>
            <span className="text-[11px] font-bold uppercase">CẤP VÉ VÃNG LAI [F4]</span>
          </div>
          <span className="material-symbols-outlined text-sm">add</span>
        </button>
      )}
    </div>
  );
};

export default ControlPanel;
