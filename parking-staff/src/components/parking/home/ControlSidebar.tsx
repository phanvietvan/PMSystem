import React from 'react';
import ControlPanel from './ControlPanel';
import BillingPanel from './BillingPanel';

interface ControlSidebarProps {
  currentOccupied: number;
  maxCapacity: number;
  parkingLots: any[];
  selectedParkingLot: string;
  setSelectedParkingLot: (name: string) => void;
  gateState: 'SCANNING' | 'COMPARING' | 'GATE_OPEN';
  gateMode: 'ENTRY' | 'EXIT';
  setGateMode: (mode: 'ENTRY' | 'EXIT') => void;
  autoApprove: boolean;
  setAutoApprove: (approve: boolean) => void;
  captureFrame: () => string | null;
  setVisitorSnapshot: (snap: string | null) => void;
  setShowVisitorModal: (show: boolean) => void;
  setVisitorPlate: (plate: string) => void;
  setGeneratedTicket: (ticket: any) => void;
  showAlert: (msg: string) => void;
  extraFees: any[];
  setExtraFees: (val: any[]) => void;
  isAddingSurcharge: boolean;
  setIsAddingSurcharge: (val: boolean) => void;
  surchargeDraft: { name: string; amount: string };
  setSurchargeDraft: (val: any) => void;
  confirmPass: () => Promise<void>;
  scannedResult: any;
}

const ControlSidebar: React.FC<ControlSidebarProps> = ({
  currentOccupied,
  maxCapacity,
  parkingLots,
  selectedParkingLot,
  setSelectedParkingLot,
  gateState,
  gateMode,
  setGateMode,
  autoApprove,
  setAutoApprove,
  captureFrame,
  setVisitorSnapshot,
  setShowVisitorModal,
  setVisitorPlate,
  setGeneratedTicket,
  showAlert,
  extraFees,
  setExtraFees,
  isAddingSurcharge,
  setIsAddingSurcharge,
  surchargeDraft,
  setSurchargeDraft,
  confirmPass,
  scannedResult,
}) => {
  return (
    <>
      <ControlPanel
        currentOccupied={currentOccupied}
        maxCapacity={maxCapacity}
        parkingLots={parkingLots}
        selectedParkingLot={selectedParkingLot}
        setSelectedParkingLot={setSelectedParkingLot}
        gateState={gateState}
        gateMode={gateMode}
        setGateMode={setGateMode}
        autoApprove={autoApprove}
        setAutoApprove={setAutoApprove}
        captureFrame={captureFrame}
        setVisitorSnapshot={setVisitorSnapshot}
        setShowVisitorModal={setShowVisitorModal}
        setVisitorPlate={setVisitorPlate}
        setGeneratedTicket={setGeneratedTicket}
        showAlert={showAlert}
      />

      <BillingPanel
        gateMode={gateMode}
        gateState={gateState}
        scannedResult={scannedResult}
        extraFees={extraFees}
        setExtraFees={setExtraFees}
        isAddingSurcharge={isAddingSurcharge}
        setIsAddingSurcharge={setIsAddingSurcharge}
        surchargeDraft={surchargeDraft}
        setSurchargeDraft={setSurchargeDraft}
        confirmPass={confirmPass}
      />
    </>
  );
};

export default ControlSidebar;
