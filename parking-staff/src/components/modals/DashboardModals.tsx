import React from 'react';
import { AnimatePresence } from 'framer-motion';
import PhotoPreviewModal from './PhotoPreviewModal';
import LogDetailsModal from './LogDetailsModal';
import ReportModal from './ReportModal';

interface DashboardModalsProps {
  selectedLogPhoto: string | null;
  setSelectedLogPhoto: (photo: string | null) => void;
  selectedLogEntry: any;
  setSelectedLogEntry: (entry: any) => void;
  showReportModal: boolean;
  setShowReportModal: (show: boolean) => void;
  reportLogData: any;
  setReportLogData: (data: any) => void;
  reportPlate: string;
  setReportPlate: (plate: string) => void;
  reportReason: string;
  setReportReason: (reason: string) => void;
  handleReportVehicleSubmit: (e: React.FormEvent) => Promise<void> | void;
  FALLBACK_CAR_CAPTURES: string[];
}

export const DashboardModals: React.FC<DashboardModalsProps> = ({
  selectedLogPhoto,
  setSelectedLogPhoto,
  selectedLogEntry,
  setSelectedLogEntry,
  showReportModal,
  setShowReportModal,
  reportLogData,
  setReportLogData,
  reportPlate,
  setReportPlate,
  reportReason,
  setReportReason,
  handleReportVehicleSubmit,
  FALLBACK_CAR_CAPTURES,
}) => {
  return (
    <>
      {/* Photo Preview Overlay */}
      <AnimatePresence>
        {selectedLogPhoto && (
          <PhotoPreviewModal photo={selectedLogPhoto} onClose={() => setSelectedLogPhoto(null)} />
        )}
      </AnimatePresence>

      {/* Log Entry Details Overlay */}
      <AnimatePresence>
        {selectedLogEntry && (
          <LogDetailsModal
            selectedLogEntry={selectedLogEntry}
            onClose={() => setSelectedLogEntry(null)}
            setSelectedLogPhoto={setSelectedLogPhoto}
            FALLBACK_CAR_CAPTURES={FALLBACK_CAR_CAPTURES}
          />
        )}
      </AnimatePresence>

      {/* Incident / Violation Reporting Dialog */}
      <AnimatePresence>
        {showReportModal && (
          <ReportModal
            isOpen={showReportModal}
            onClose={() => {
              setShowReportModal(false);
              setReportLogData(null);
            }}
            reportLogData={reportLogData}
            reportPlate={reportPlate}
            setReportPlate={setReportPlate}
            reportReason={reportReason}
            setReportReason={setReportReason}
            handleReportVehicle={handleReportVehicleSubmit}
            FALLBACK_CAR_CAPTURES={FALLBACK_CAR_CAPTURES}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardModals;
