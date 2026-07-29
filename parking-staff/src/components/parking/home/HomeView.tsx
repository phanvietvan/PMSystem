import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

// Hooks
import { useCamera } from '../../../hooks/useCamera';
import { useBlacklist } from '../../../hooks/useBlacklist';
import { useVisitorTicket } from '../../../hooks/useVisitorTicket';
import { useGateWorkflow } from '../../../hooks/useGateWorkflow';
import { useHotkeys } from '../../../hooks/useHotkeys';
import { useQrScanner } from '../../../hooks/useQrScanner';

// Components
import GateWorkArea from './GateWorkArea';
import ControlSidebar from './ControlSidebar';
import VisitorModal from '../../modals/VisitorModal';

interface HomeViewProps {
  currentUser: any;
  parkingLots: any[];
  selectedParkingLot: string;
  setSelectedParkingLot: (name: string) => void;
  recentLogs: any[];
  setRecentLogs: React.Dispatch<React.SetStateAction<any[]>>;
  fetchRecentSessions: () => Promise<void>;
  currentOccupied: number;
  maxCapacity: number;
  showAlert: (msg: string) => void;
  setSelectedLogPhoto: (photo: string | null) => void;
}

const HomeView: React.FC<HomeViewProps> = ({
  parkingLots,
  selectedParkingLot,
  setSelectedParkingLot,
  recentLogs,
  setRecentLogs,
  fetchRecentSessions,
  currentOccupied,
  maxCapacity,
  showAlert,
  setSelectedLogPhoto,
}) => {
  const camera = useCamera();

  // Initialize camera stream (reattach if <video> mounts after getUserMedia)
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (cancelled) return;
      await camera.startCamera();
      // Video node may mount a tick later — re-bind stream
      requestAnimationFrame(() => camera.reattachStream());
      setTimeout(() => {
        if (!cancelled) camera.reattachStream();
      }, 400);
    };
    init();
    return () => {
      cancelled = true;
      camera.stopCamera();
    };
  }, []);

  const { checkBlacklistForPlate } = useBlacklist(showAlert);

  const {
    showVisitorModal,
    setShowVisitorModal,
    visitorSnapshot,
    setVisitorSnapshot,
    visitorPlate,
    setVisitorPlate,
    visitorVehicleType,
    setVisitorVehicleType,
    generatedTicket,
    setGeneratedTicket,
    isGeneratingTicket,
    ticketQrDataUrl,
    handleCreateVisitorTicket,
  } = useVisitorTicket(selectedParkingLot, fetchRecentSessions, camera.captureFrame, parkingLots);

  const {
    gateState,
    setGateState,
    gateMode,
    setGateMode,
    manualInput,
    setManualInput,
    autoApprove,
    scannedResult,
    setScannedResult,
    countdown,
    isCountdownActive,
    setIsCountdownActive,
    extraFees,
    setExtraFees,
    isAddingSurcharge,
    setIsAddingSurcharge,
    surchargeDraft,
    setSurchargeDraft,
    isOcrLoading,
    triggerScan,
    handleOcrAndScan,
    confirmPass,
    denyPass,
    startAutoPassCountdown,
    countdownTimerRef,
  } = useGateWorkflow(
    selectedParkingLot,
    fetchRecentSessions,
    camera.captureFrame,
    checkBlacklistForPlate,
    showAlert,
    setRecentLogs,
    setGeneratedTicket,
    parkingLots
  );

  // QR Frame scan listener
  useQrScanner(gateState, camera.hasCameraAccess, camera.videoRef, triggerScan);

  // Keyboard hotkeys listener
  useHotkeys({
    gateState,
    gateMode,
    scannedResult,
    isCountdownActive,
    setIsCountdownActive,
    countdownTimerRef,
    showVisitorModal,
    setShowVisitorModal,
    setVisitorSnapshot,
    setVisitorPlate,
    setGeneratedTicket,
    setExtraFees,
    setIsAddingSurcharge,
    setSelectedLogPhoto,
    setGateState,
    setScannedResult,
    handleOcrAndScan,
    confirmPass,
    captureFrame: camera.captureFrame,
  });

  // Re-attach camera when video element remounts in SCANNING state
  useEffect(() => {
    if (gateState === 'SCANNING') {
      const t = setTimeout(() => {
        camera.reattachStream();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [gateState]);

  return (
    <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 overflow-hidden flex flex-col">
      <div className="grid grid-cols-12 gap-5 h-full">
        {/* COLUMN 1: LEFT AREA (Main Camera & Split Comparison) */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-5 h-full overflow-hidden">
          <GateWorkArea
            gateState={gateState}
            setGateState={setGateState}
            videoRef={camera.videoRef}
            hasCameraAccess={camera.hasCameraAccess}
            startCamera={camera.startCamera}
            reattachStream={camera.reattachStream}
            isOcrLoading={isOcrLoading}
            gateMode={gateMode}
            manualInput={manualInput}
            setManualInput={setManualInput}
            handleOcrAndScan={handleOcrAndScan}
            triggerScan={triggerScan}
            scannedResult={scannedResult}
            setScannedResult={setScannedResult}
            isCountdownActive={isCountdownActive}
            countdown={countdown}
            setIsCountdownActive={setIsCountdownActive}
            countdownTimerRef={countdownTimerRef}
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
            generatedTicket={generatedTicket}
            ticketQrDataUrl={ticketQrDataUrl}
            setGeneratedTicket={setGeneratedTicket}
            fetchRecentSessions={fetchRecentSessions}
          />
        </div>

        {/* COLUMN 2: RIGHT AREA (Control Configurations & Billing Panel) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-5 h-full overflow-hidden">
          <ControlSidebar
            currentOccupied={currentOccupied}
            maxCapacity={maxCapacity}
            parkingLots={parkingLots}
            selectedParkingLot={selectedParkingLot}
            setSelectedParkingLot={setSelectedParkingLot}
            gateState={gateState}
            gateMode={gateMode}
            setGateMode={setGateMode}
            captureFrame={camera.captureFrame}
            setVisitorSnapshot={setVisitorSnapshot}
            setShowVisitorModal={setShowVisitorModal}
            setVisitorPlate={setVisitorPlate}
            setGeneratedTicket={setGeneratedTicket}
            extraFees={extraFees}
            setExtraFees={setExtraFees}
            isAddingSurcharge={isAddingSurcharge}
            setIsAddingSurcharge={setIsAddingSurcharge}
            surchargeDraft={surchargeDraft}
            setSurchargeDraft={setSurchargeDraft}
            confirmPass={confirmPass}
            scannedResult={scannedResult}
          />
        </div>
      </div>

      {/* Visitor Ticket Modal */}
      <AnimatePresence>
        {showVisitorModal && (
          <VisitorModal
            isOpen={showVisitorModal}
            onClose={() => setShowVisitorModal(false)}
            visitorSnapshot={visitorSnapshot}
            visitorPlate={visitorPlate}
            setVisitorPlate={setVisitorPlate}
            visitorVehicleType={visitorVehicleType}
            setVisitorVehicleType={setVisitorVehicleType}
            parkingLots={parkingLots}
            selectedParkingLot={selectedParkingLot}
            setSelectedParkingLot={setSelectedParkingLot}
            generatedTicket={generatedTicket}
            isGeneratingTicket={isGeneratingTicket}
            hasCameraAccess={camera.hasCameraAccess}
            handleCreateVisitorTicket={handleCreateVisitorTicket}
            setScannedResult={setScannedResult}
            setGateState={setGateState}
            autoApprove={autoApprove}
            startAutoPassCountdown={startAutoPassCountdown}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default HomeView;
