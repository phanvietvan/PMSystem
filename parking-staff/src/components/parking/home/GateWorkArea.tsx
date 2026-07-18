import React from 'react';
import LiveFeed from './LiveFeed';
import ComparisonPanel from './ComparisonPanel';
import GateOpenPanel from './GateOpenPanel';

interface GateWorkAreaProps {
  gateState: 'SCANNING' | 'COMPARING' | 'GATE_OPEN';
  setGateState: (state: 'SCANNING' | 'COMPARING' | 'GATE_OPEN') => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hasCameraAccess: boolean;
  startCamera: () => Promise<void>;
  isOcrLoading: boolean;
  gateMode: 'ENTRY' | 'EXIT';
  manualInput: string;
  setManualInput: (val: string) => void;
  handleOcrAndScan: () => void;
  triggerScan: (customPlateOrQr?: string) => Promise<void>;
  scannedResult: any;
  setScannedResult: (result: any) => void;
  isCountdownActive: boolean;
  countdown: number;
  setIsCountdownActive: (val: boolean) => void;
  countdownTimerRef: React.MutableRefObject<any>;
  denyPass: () => void;
  confirmPass: () => Promise<void>;
  extraFees: any[];
  setExtraFees: (val: any[]) => void;
  isAddingSurcharge: boolean;
  setIsAddingSurcharge: (val: boolean) => void;
  surchargeDraft: { name: string; amount: string };
  setSurchargeDraft: (val: any) => void;
  parkingLots: any[];
  selectedParkingLot: string;
  setSelectedParkingLot: (name: string) => void;
  generatedTicket: any;
  ticketQrDataUrl: string;
  setGeneratedTicket: (val: any) => void;
  fetchRecentSessions: () => Promise<void>;
}

const GateWorkArea: React.FC<GateWorkAreaProps> = ({
  gateState,
  setGateState,
  videoRef,
  hasCameraAccess,
  startCamera,
  isOcrLoading,
  gateMode,
  manualInput,
  setManualInput,
  handleOcrAndScan,
  triggerScan,
  scannedResult,
  setScannedResult,
  isCountdownActive,
  countdown,
  setIsCountdownActive,
  countdownTimerRef,
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
  generatedTicket,
  ticketQrDataUrl,
  setGeneratedTicket,
  fetchRecentSessions,
}) => {
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[520px] relative">
      {/* PERSISTENT CAMERA FEED */}
      <LiveFeed
        gateState={gateState}
        videoRef={videoRef}
        hasCameraAccess={hasCameraAccess}
        startCamera={startCamera}
        isOcrLoading={isOcrLoading}
        gateMode={gateMode}
        manualInput={manualInput}
        setManualInput={setManualInput}
        handleOcrAndScan={handleOcrAndScan}
        triggerScan={triggerScan}
      />

      {/* DUAL IMAGE COMPARISON PANEL */}
      {gateState === 'COMPARING' && scannedResult && (
        <ComparisonPanel
          scannedResult={scannedResult}
          setScannedResult={setScannedResult}
          isCountdownActive={isCountdownActive}
          countdown={countdown}
          setIsCountdownActive={setIsCountdownActive}
          countdownTimerRef={countdownTimerRef}
          gateMode={gateMode}
          isTouchDevice={isTouchDevice}
          denyPass={denyPass}
          confirmPass={confirmPass}
          extraFees={extraFees}
          setExtraFees={setExtraFees}
          isAddingSurcharge={isAddingSurcharge}
          setIsAddingSurcharge={setIsAddingSurcharge}
          surchargeDraft={surchargeDraft}
          setSurchargeDraft={setSurchargeDraft}
          parkingLots={parkingLots}
          selectedParkingLot={selectedParkingLot}
          setSelectedParkingLot={setSelectedParkingLot}
        />
      )}

      {/* GATE OPEN / SUCCESS SCREEN */}
      {gateState === 'GATE_OPEN' && (
        <GateOpenPanel
          generatedTicket={generatedTicket}
          ticketQrDataUrl={ticketQrDataUrl}
          isTouchDevice={isTouchDevice}
          setGeneratedTicket={setGeneratedTicket}
          setExtraFees={setExtraFees}
          setIsAddingSurcharge={setIsAddingSurcharge}
          setGateState={setGateState}
          fetchRecentSessions={fetchRecentSessions}
          scannedResult={scannedResult}
          countdownTimerRef={countdownTimerRef}
        />
      )}
    </div>
  );
};

export default GateWorkArea;
