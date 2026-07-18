import { useEffect, useRef } from 'react';
import { playChimeSound, playWarningSound } from '../utils/audio';

export const useHotkeys = (params: {
  gateState: 'SCANNING' | 'COMPARING' | 'GATE_OPEN';
  gateMode: 'ENTRY' | 'EXIT';
  scannedResult: any;
  isCountdownActive: boolean;
  setIsCountdownActive: (active: boolean) => void;
  countdownTimerRef: React.MutableRefObject<any>;
  showVisitorModal: boolean;
  setShowVisitorModal: (show: boolean) => void;
  setVisitorSnapshot: (snap: string | null) => void;
  setVisitorPlate: (plate: string) => void;
  setGeneratedTicket: (ticket: any) => void;
  setExtraFees: (fees: any[]) => void;
  setIsAddingSurcharge: (adding: boolean) => void;
  setSelectedLogPhoto: (photo: string | null) => void;
  setGateState: (state: 'SCANNING' | 'COMPARING' | 'GATE_OPEN') => void;
  setScannedResult: (result: any) => void;
  handleOcrAndScan: () => void;
  confirmPass: () => void;
  captureFrame: () => string | null;
}) => {
  const handlersRef = useRef(params);

  useEffect(() => {
    handlersRef.current = params;
  }, [params]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (handlersRef.current.gateState === 'SCANNING') {
          handlersRef.current.handleOcrAndScan();
        }
      }
      if (e.key === 'F4') {
        e.preventDefault();
        if (handlersRef.current.gateMode === 'EXIT') return;
        playChimeSound();
        if (!handlersRef.current.showVisitorModal) {
          handlersRef.current.setVisitorSnapshot(handlersRef.current.captureFrame());
        }
        handlersRef.current.setShowVisitorModal(!handlersRef.current.showVisitorModal);
        handlersRef.current.setVisitorPlate('');
        handlersRef.current.setGeneratedTicket(null);
      }
      if (e.key === 'F8') {
        e.preventDefault();
        if (handlersRef.current.gateState === 'COMPARING' && handlersRef.current.scannedResult) {
          handlersRef.current.confirmPass();
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (handlersRef.current.isCountdownActive) {
          handlersRef.current.setIsCountdownActive(false);
          if (handlersRef.current.countdownTimerRef.current) {
            clearInterval(handlersRef.current.countdownTimerRef.current);
          }
          playWarningSound();
        } else {
          handlersRef.current.setShowVisitorModal(false);
          handlersRef.current.setScannedResult(null);
          handlersRef.current.setExtraFees([]);
          handlersRef.current.setIsAddingSurcharge(false);
          handlersRef.current.setSelectedLogPhoto(null);
          handlersRef.current.setGateState('SCANNING');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
