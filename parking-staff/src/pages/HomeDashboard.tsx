import React, { useState } from 'react';

// Layout & Components
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HistoryTab from '../components/parking/HistoryTab';
import HomeView from '../components/parking/home/HomeView';
import GlobalAlert from '../components/common/GlobalAlert';
import DashboardModals from '../components/modals/DashboardModals';

// Hooks
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useDashboardNavigation } from '../hooks/useDashboardNavigation';
import { useNotifications } from '../hooks/useNotifications';
import { useAlert } from '../hooks/useAlert';
import { useParkingLots } from '../hooks/useParkingLots';
import { useParkingSessions } from '../hooks/useParkingSessions';
import { useReportIncident } from '../hooks/useReportIncident';

const FALLBACK_CAR_CAPTURES = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
];

const HomeDashboard = () => {
  // Global hooks
  const {
    currentUser,
    isDropdownOpen,
    setIsDropdownOpen,
    logout,
    displayName,
  } = useCurrentUser();

  const { activeTab, navigateTo } = useDashboardNavigation();

  const {
    isNotifOpen,
    setIsNotifOpen,
    unreadCount,
    hasSeenUnread,
    handleOpenNotif,
  } = useNotifications(currentUser);

  const { alertMessage, setAlertMessage, showAlert } = useAlert();

  // Domain data hooks
  const {
    parkingLots,
    selectedParkingLot,
    setSelectedParkingLot,
    maxCapacity,
  } = useParkingLots();

  const {
    recentLogs,
    setRecentLogs,
    currentOccupied,
    fetchRecentSessions,
  } = useParkingSessions();

  const { reportVehicle } = useReportIncident(currentUser, showAlert);

  // Modal / Selection states
  const [selectedLogPhoto, setSelectedLogPhoto] = useState<string | null>(null);
  const [selectedLogEntry, setSelectedLogEntry] = useState<any>(null);

  // Blacklist Reporting states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLogData, setReportLogData] = useState<any>(null);
  const [reportPlate, setReportPlate] = useState('');
  const [reportReason, setReportReason] = useState('');

  const handleReportVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await reportVehicle(reportPlate, reportReason, reportLogData);
    if (success) {
      setShowReportModal(false);
      setReportPlate('');
      setReportReason('');
      setReportLogData(null);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 h-screen w-full overflow-hidden selection:bg-blue-600/10 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col">
      {/* Header Layout */}
      <Header
        currentUser={currentUser}
        displayName={displayName}
        activeTab={activeTab}
        navigateTo={navigateTo}
        handleLogout={logout}
        unreadCount={unreadCount}
        hasSeenUnread={hasSeenUnread}
        isNotifOpen={isNotifOpen}
        setIsNotifOpen={setIsNotifOpen}
        handleOpenNotif={handleOpenNotif}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        setShowReportModal={setShowReportModal}
        setReportLogData={setReportLogData}
        setReportPlate={setReportPlate}
        setReportReason={setReportReason}
      />

      {/* Main Content Area */}
      {activeTab === 'home' ? (
        <HomeView
          currentUser={currentUser}
          parkingLots={parkingLots}
          selectedParkingLot={selectedParkingLot}
          setSelectedParkingLot={setSelectedParkingLot}
          recentLogs={recentLogs}
          setRecentLogs={setRecentLogs}
          fetchRecentSessions={fetchRecentSessions}
          currentOccupied={currentOccupied}
          maxCapacity={maxCapacity}
          showAlert={showAlert}
          setSelectedLogPhoto={setSelectedLogPhoto}
        />
      ) : (
        /* History tab records log */
        <HistoryTab
          recentLogs={recentLogs}
          setSelectedLogEntry={setSelectedLogEntry}
          setSelectedLogPhoto={setSelectedLogPhoto}
          setReportPlate={setReportPlate}
          setReportLogData={setReportLogData}
          setShowReportModal={setShowReportModal}
        />
      )}

      {/* Footer Layout */}
      <Footer />

      {/* Global Alerts / Toasts */}
      <GlobalAlert alertMessage={alertMessage} setAlertMessage={setAlertMessage} />

      {/* All Dashboard Modals */}
      <DashboardModals
        selectedLogPhoto={selectedLogPhoto}
        setSelectedLogPhoto={setSelectedLogPhoto}
        selectedLogEntry={selectedLogEntry}
        setSelectedLogEntry={setSelectedLogEntry}
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        reportLogData={reportLogData}
        setReportLogData={setReportLogData}
        reportPlate={reportPlate}
        setReportPlate={setReportPlate}
        reportReason={reportReason}
        setReportReason={setReportReason}
        handleReportVehicleSubmit={handleReportVehicleSubmit}
        FALLBACK_CAR_CAPTURES={FALLBACK_CAR_CAPTURES}
      />
    </div>
  );
};

export default HomeDashboard;
