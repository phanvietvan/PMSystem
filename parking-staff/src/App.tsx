import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { AnimatePresence } from 'framer-motion';

// Imports from local files
import { playChimeSound, playWarningSound } from './utils/audio';
import { useCamera } from './hooks/useCamera';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PhotoPreviewModal from './components/modals/PhotoPreviewModal';
import LogDetailsModal from './components/modals/LogDetailsModal';
import ReportModal from './components/modals/ReportModal';
import VisitorModal from './components/modals/VisitorModal';
import HistoryTab from './components/parking/HistoryTab';
import LiveFeed from './components/parking/home/LiveFeed';
import ComparisonPanel from './components/parking/home/ComparisonPanel';
import GateOpenPanel from './components/parking/home/GateOpenPanel';
import ControlPanel from './components/parking/home/ControlPanel';
import BillingPanel from './components/parking/home/BillingPanel';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api'
    : 'https://pmsystem-oxl8.onrender.com/api');

// Fallback high-quality car photos for live webcam fallbacks ONLY
const FALLBACK_CAR_CAPTURES = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
];

const App = () => {
  const camera = useCamera();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasSeenUnread, setHasSeenUnread] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(200);
  const [currentOccupied, setCurrentOccupied] = useState(0);
  const [gateMode, setGateMode] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // Báo cáo xe states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLogData, setReportLogData] = useState<any>(null);
  const [reportPlate, setReportPlate] = useState('');
  const [reportReason, setReportReason] = useState('');

  // Gate workflow state machine: 'SCANNING' -> 'COMPARING' -> 'GATE_OPEN'
  const [gateState, setGateState] = useState<'SCANNING' | 'COMPARING' | 'GATE_OPEN'>('SCANNING');
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const formatPlateNumber = (plate: string): string => {
    if (!plate) return '';
    return plate.trim().toUpperCase();
  };

  const [autoApprove, setAutoApprove] = useState(false);
  const [scannedResult, setScannedResult] = useState<any>(null);

  // Auto-pass countdown details
  const [countdown, setCountdown] = useState<number>(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const countdownTimerRef = useRef<any>(null);

  // Visitor Ticket Modal states
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitorSnapshot, setVisitorSnapshot] = useState<string | null>(null);
  const [visitorPlate, setVisitorPlate] = useState('');
  const [visitorVehicleType, setVisitorVehicleType] = useState('Car');
  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [selectedParkingLot, setSelectedParkingLot] = useState<string>('');
  const [generatedTicket, setGeneratedTicket] = useState<any>(null);
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [extraFees, setExtraFees] = useState<{ id: string; name: string; amount: number }[]>([]);
  const [isAddingSurcharge, setIsAddingSurcharge] = useState(false);
  const [surchargeDraft, setSurchargeDraft] = useState({ name: 'Phụ thu khác', amount: '' });
  const [activeTab, setActiveTab] = useState<'home' | 'history'>(() => {
    return window.location.pathname === '/history' ? 'history' : 'home';
  });

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(window.location.pathname === '/history' ? 'history' : 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tab: 'home' | 'history') => {
    setActiveTab(tab);
    window.history.pushState({}, '', tab === 'history' ? '/history' : '/');
  };

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => {
      setAlertMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  useEffect(() => {
    if (generatedTicket?.qrCode) {
      import('qrcode').then(({ default: QRCode }) => {
        QRCode.toDataURL(generatedTicket.qrCode, { width: 200, margin: 1 }, (err, url) => {
          if (!err && url) {
            setTicketQrDataUrl(url);
          }
        });
      });
    } else {
      setTicketQrDataUrl('');
    }
  }, [generatedTicket]);

  // Real MongoDB logs feed
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [selectedLogPhoto, setSelectedLogPhoto] = useState<string | null>(null);
  const [selectedLogEntry, setSelectedLogEntry] = useState<any>(null);

  // Ref to hold the latest handler functions to avoid stale closures in useEffect
  const handlersRef = useRef({
    handleOcrAndScan: () => {},
    confirmPass: () => {},
    captureFrame: (): string | null => null,
    triggerScan: async (customPlateOrQr?: string) => {},
  });

  useEffect(() => {
    handlersRef.current = {
      handleOcrAndScan: () => handleOcrAndScan(),
      confirmPass: () => confirmPass(),
      captureFrame: () => camera.captureFrame(),
      triggerScan: (customPlateOrQr?: string) => triggerScan(customPlateOrQr),
    };
  });

  // Keyboard Hotkeys: SPACE = quick scan, F4 = visitor modal, F8 = manual confirm, Esc = stop countdown / alert
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (gateState === 'SCANNING') {
          handlersRef.current.handleOcrAndScan();
        }
      }
      if (e.key === 'F4') {
        e.preventDefault();
        if (gateMode === 'EXIT') return;
        playChimeSound();
        if (!showVisitorModal) {
          setVisitorSnapshot(handlersRef.current.captureFrame());
        }
        setShowVisitorModal((prev) => !prev);
        setVisitorPlate('');
        setGeneratedTicket(null);
      }
      if (e.key === 'F8') {
        e.preventDefault();
        if (gateState === 'COMPARING' && scannedResult) {
          handlersRef.current.confirmPass();
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isCountdownActive) {
          setIsCountdownActive(false);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          playWarningSound();
        } else {
          setShowVisitorModal(false);
          setScannedResult(null);
          setExtraFees([]);
          setIsAddingSurcharge(false);
          setSelectedLogPhoto(null);
          setGateState('SCANNING');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gateState, scannedResult, isCountdownActive, gateMode, showVisitorModal]);

  // Sync user details from parent domain localStorage
  useEffect(() => {
    const syncUser = () => {
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          setCurrentUser(JSON.parse(raw));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser({
          firstName: 'Văn Phan',
          lastName: 'Việt',
          role: 'Staff',
          email: 'vietvanphan04@gmail.com',
          avatarUrl: '',
        });
      }
    };
    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('user-login', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('user-login', syncUser);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/Notifications`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          const count = data.filter((n: any) => !n.read).length;
          setUnreadCount(count);
        }
      } catch (err) {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id || currentUser.email || 'staff';
    const lastSeen = Number(localStorage.getItem(`lastSeenNotifCount_${userId}`) || '0');
    if (unreadCount > lastSeen) {
      setHasSeenUnread(false);
    } else {
      setHasSeenUnread(true);
    }
  }, [unreadCount, currentUser]);

  const handleOpenNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && currentUser) {
      setHasSeenUnread(true);
      const userId = currentUser.id || currentUser.email || 'staff';
      localStorage.setItem(`lastSeenNotifCount_${userId}`, unreadCount.toString());
    }
  };

  // Fetch parking lots
  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ParkingLots`);
        if (res.ok) {
          const data = await res.json();
          setParkingLots(data);
          const totalCap = data.reduce((sum: number, lot: any) => sum + (lot.capacity || 50), 0);
          setMaxCapacity(totalCap > 0 ? totalCap : 200);
          if (data && data.length > 0) {
            setSelectedParkingLot(data[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch parking lots', err);
      }
    };
    fetchParkingLots();
  }, []);

  // Fetch real-time active sessions & logs directly from MongoDB
  const fetchRecentSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ParkingSessions`);
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((session: any) => {
          const createdDateObj = session.createdAt ? new Date(session.createdAt) : new Date(session.entryTime);
          const createdTimeStr = createdDateObj.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          const createdDateStr = createdDateObj.toLocaleDateString('vi-VN');

          const entryDateObj = new Date(session.entryTime);
          const timeStr = entryDateObj.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          const dateStr = entryDateObj.toLocaleDateString('vi-VN');

          let exitTimeStr = '';
          let exitDateStr = '';
          if (session.exitTime) {
            const exitDateObj = new Date(session.exitTime);
            exitTimeStr = exitDateObj.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            exitDateStr = exitDateObj.toLocaleDateString('vi-VN');
          }

          let dynamicTicketStatus = '';
          if (session.status === 'Completed') dynamicTicketStatus = 'Đã hoàn tất (Đã ra)';
          else if (session.status === 'Active') {
            dynamicTicketStatus = session.userId
              ? session.isCheckedIn
                ? 'Đang gửi trong bãi'
                : 'Đã đặt chỗ (Chưa vào)'
              : 'Đang gửi trong bãi';
          } else {
            dynamicTicketStatus = session.status;
          }

          return {
            plate: session.licensePlate,
            status: session.status === 'Completed' ? 'Lối ra' : 'Lối vào',
            time: session.status === 'Completed' && session.exitTime ? exitTimeStr : timeStr,
            createdTimeStr: createdTimeStr,
            createdDateStr: createdDateStr,
            entryTimeStr: timeStr,
            entryDateStr: dateStr,
            exitTimeStr: exitTimeStr,
            exitDateStr: exitDateStr,
            isCheckedIn: session.isCheckedIn,
            type:
              session.status === 'Cancelled'
                ? 'CANCELLED'
                : session.status === 'Completed'
                ? 'EXIT'
                : session.userId && !session.isCheckedIn
                ? 'PENDING'
                : 'ENTRY',
            owner: session.userId ? 'KHÁCH ĐẶT TRƯỚC' : 'KHÁCH VÃNG LAI',
            ticketType: dynamicTicketStatus,
            customerName: session.user ? `${session.user.lastName} ${session.user.firstName}`.trim() : null,
            customerPhone: session.user ? session.user.phoneNumber : null,
            customerEmail: session.user ? session.user.email : null,
            photo:
              session.status === 'Completed'
                ? session.exitPhoto || session.entryPhoto || FALLBACK_CAR_CAPTURES[0]
                : session.entryPhoto || FALLBACK_CAR_CAPTURES[0],
            entryPhoto: session.entryPhoto,
            exitPhoto: session.exitPhoto,
            qrCode: session.qrCode,
            totalFee: session.totalFee,
            parkingLotName: session.parkingLotName,
            parkingSlot: session.parkingSlot,
          };
        });

        setRecentLogs(mapped);

        const activeCount = data.filter((s: any) => s.status === 'Active').length;
        setCurrentOccupied(activeCount);
      }
    } catch (err) {
      console.warn('Failed to fetch sessions from MongoDB API:', err);
      setRecentLogs([]);
    }
  };

  useEffect(() => {
    fetchRecentSessions();
    const interval = setInterval(fetchRecentSessions, 8000);
    return () => clearInterval(interval);
  }, []);

  // Initialize camera stream
  useEffect(() => {
    const init = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await camera.startCamera();
    };
    init();
    return () => camera.stopCamera();
  }, []);

  // Re-attach active stream whenever the video element remounts in SCANNING state
  useEffect(() => {
    if (gateState === 'SCANNING') {
      const t = setTimeout(() => {
        camera.reattachStream();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [gateState]);

  // Real-time camera QR decoding using jsQR
  useEffect(() => {
    let active = true;
    let frameId: number;
    let isProcessing = false;

    const decodeLoop = () => {
      if (!active) return;

      if (gateState === 'SCANNING' && camera.hasCameraAccess && camera.videoRef.current && !isProcessing) {
        const video = camera.videoRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (code && code.data) {
                isProcessing = true;
                console.log('Webcam scanned QR successfully:', code.data);
                handlersRef.current.triggerScan(code.data);
                setTimeout(() => {
                  isProcessing = false;
                }, 1500);
              }
            }
          } catch (err) {
            console.error(err);
          }
        }
      }

      if (gateState === 'SCANNING') {
        frameId = requestAnimationFrame(decodeLoop);
      } else {
        setTimeout(() => {
          if (active) frameId = requestAnimationFrame(decodeLoop);
        }, 1000);
      }
    };

    if (camera.hasCameraAccess && gateState === 'SCANNING') {
      frameId = requestAnimationFrame(decodeLoop);
    }

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [camera.hasCameraAccess, gateState, gateMode]);

  // Create active session for casual visitor ("xe vãng lai")
  const handleCreateVisitorTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorPlate.trim()) return;

    setIsGeneratingTicket(true);
    playChimeSound();

    const plateNormalized = visitorPlate.trim().toUpperCase();
    const livePhoto =
      visitorSnapshot ||
      camera.captureFrame() ||
      FALLBACK_CAR_CAPTURES[Math.floor(Math.random() * FALLBACK_CAR_CAPTURES.length)];

    const apiPayload = {
      LicensePlate: plateNormalized,
      EntryPhoto: livePhoto,
      ParkingLotName: selectedParkingLot || 'Khu Vực A (Vãng lai)',
      VehicleType: visitorVehicleType,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/ParkingSessions/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedTicket({
          qrCode: data.qrCode,
          plate: data.licensePlate,
          time: new Date(data.entryTime).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          photo: data.entryPhoto || livePhoto,
          vehicleType: data.vehicleType,
          parkingLotName: data.parkingLotName || apiPayload.ParkingLotName,
        });
        fetchRecentSessions();
      } else {
        throw new Error('Checkin post failed');
      }
    } catch (err) {
      console.warn('Failed to checkin via database, falling back to local simulation:', err);
      const mockQrCode = `QR_VIS_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setGeneratedTicket({
        qrCode: mockQrCode,
        plate: plateNormalized,
        time: new Date().toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        photo: livePhoto,
        vehicleType: visitorVehicleType,
        parkingLotName: apiPayload.ParkingLotName,
      });
    } finally {
      setIsGeneratingTicket(false);
    }
  };

  const handleReportVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const plateToSend = reportLogData ? reportLogData.plate : reportPlate.trim().toUpperCase();
    if (!plateToSend || !reportReason.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/Incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'BlacklistReport',
          title: `Báo cáo xe vi phạm: ${plateToSend}`,
          description: JSON.stringify({
            reason: reportReason.trim(),
            photo: reportLogData?.photo || '',
            customerName: reportLogData?.customerName || '',
            customerPhone: reportLogData?.customerPhone || '',
            entryTime: reportLogData?.entryTimeStr || '',
            parkingLot: reportLogData?.parkingLotName
              ? `${reportLogData.parkingLotName} • Slot ${reportLogData.parkingSlot || '--'}`
              : '',
          }),
          reporter: currentUser?.email || 'Nhân viên cổng',
          role: 'Staff',
        }),
      });
      if (res.ok) {
        setShowReportModal(false);
        setReportPlate('');
        setReportReason('');
        setReportLogData(null);
        showAlert('✅ Đã gửi báo cáo cho Admin xem xét!');
      }
    } catch (err) {
      console.error(err);
      showAlert('❌ Lỗi gửi báo cáo!');
    }
  };

  const handleOcrAndScan = async () => {
    if (manualInput.trim()) {
      const input = manualInput.trim().toUpperCase();
      setManualInput('');
      await triggerScan(input);
    }
  };

  const triggerScan = async (customPlateOrQr?: string) => {
    playChimeSound();

    const inputCleanRaw = (customPlateOrQr || '').trim().toUpperCase();
    const isQrScan = inputCleanRaw.startsWith('QR_') || inputCleanRaw.startsWith('QR');
    const inputClean = isQrScan ? inputCleanRaw : formatPlateNumber(inputCleanRaw);

    const checkBlacklistForPlate = async (plateToCheck: string) => {
      if (!plateToCheck) return false;
      try {
        const token = localStorage.getItem('token');
        const blRes = await fetch(`${API_BASE_URL}/Blacklist?t=${new Date().getTime()}`);
        if (blRes.ok) {
          const blData = await blRes.json();
          const normalizePlate = (p: string) => (p || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();

          const blacklisted = blData.find((b: any) => normalizePlate(b.plateNumber) === normalizePlate(plateToCheck));
          if (blacklisted) {
            playWarningSound();
            showAlert(`🚫 TỪ CHỐI PHỤC VỤ! Xe ${blacklisted.plateNumber} nằm trong Danh Sách Đen. Lý do: ${blacklisted.reason}`);

            fetch(`${API_BASE_URL}/Notifications/push`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                role: 'admin',
                title: 'Cảnh báo xe Blacklist cố vào bãi',
                message: `Biển số ${blacklisted.plateNumber} bị từ chối phục vụ. Lý do: ${blacklisted.reason}`,
              }),
            }).catch((e) => console.error(e));
            return true;
          }
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra blacklist', err);
      }
      return false;
    };

    const livePhoto =
      camera.captureFrame() || FALLBACK_CAR_CAPTURES[Math.floor(Math.random() * FALLBACK_CAR_CAPTURES.length)];
    const fallbackEntryPhoto = FALLBACK_CAR_CAPTURES[1];

    let entryPhoto = fallbackEntryPhoto;
    let entryTimeStr = 'N/A';
    let entryPlate = isQrScan
      ? ''
      : inputClean ||
        formatPlateNumber(
          '30F-' +
            Math.floor(100 + Math.random() * 900) +
            '.' +
            Math.floor(10 + Math.random() * 90)
        );
    let ticketLabel = gateMode === 'ENTRY' ? 'Vé vãng lai' : 'Vé vãng lai • Phí: 10,000 VNĐ';
    let foundSessionCode = isQrScan ? inputClean : undefined;
    let computedFee = 10000;

    let owner = 'KHÁCH VÃNG LAI';
    let ticketType = 'Vé vãng lai';
    let userInfo: any = undefined;
    let reservationDate = '';
    let reservationStartTime = '';
    let parkingSlot: string | undefined = undefined;
    let parkingLotName: string | undefined = undefined;
    let depositFee: number = 0;

    if (gateMode === 'ENTRY') {
      if (isQrScan && inputClean) {
        try {
          const res = await fetch(`${API_BASE_URL}/ParkingSessions/verify/${inputClean}`);
          if (res.ok) {
            const data = await res.json();
            const session = data.session;
            const user = data.user;

            if (!session.userId) {
              playWarningSound();
              showAlert(
                '⚠️ LỘN CỔNG! Vé vãng lai này đã được cấp để gửi xe. Vui lòng sang MÀN HÌNH LỐI RA (EXIT) để quét mã thanh toán!'
              );
              return;
            }

            if (session.isCheckedIn) {
              playWarningSound();
              showAlert(
                '⚠️ XE ĐÃ TRONG BÃI! Khách đặt trước này đã quét mã vào cổng rồi. Vui lòng sang MÀN HÌNH LỐI RA (EXIT) để quét ra ngoài!'
              );
              return;
            }

            if (selectedParkingLot && session.parkingLotName && session.parkingLotName !== selectedParkingLot) {
              playWarningSound();
              showAlert(
                `⚠️ LỘN TÒA! Khách hàng đặt chỗ tại [${session.parkingLotName}], nhưng đây là cổng của [${selectedParkingLot}]. Yêu cầu khách di chuyển sang đúng tòa!`
              );
              return;
            }

            entryPlate = session.licensePlate;
            ticketType = `Đặt trước • Slot ${session.parkingSlot} (${session.parkingLotName})`;
            parkingSlot = session.parkingSlot;
            parkingLotName = session.parkingLotName;
            depositFee = data.prepaidAmount || 0;

            if (user) {
              owner = `${user.lastName || ''} ${user.firstName || ''}`.trim() || 'XE ĐẶT TRƯỚC (RESERVATION)';
              userInfo = user;
            } else {
              owner = 'XE ĐẶT TRƯỚC (RESERVATION)';
            }
            foundSessionCode = session.qrCode;
          } else {
            playWarningSound();
            showAlert('Mã QR đặt chỗ không hợp lệ hoặc đã được sử dụng!');
            return;
          }
        } catch (e) {
          console.warn('QR verification check failed on entry:', e);
        }
      }

      if (entryPlate && (await checkBlacklistForPlate(entryPlate))) {
        return;
      }

      const payload = {
        plate: entryPlate,
        status: 'Chờ xác nhận',
        time: new Date().toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        owner: owner,
        ticketType: ticketType,
        capturedPhoto: livePhoto,
        registeredPhoto: livePhoto,
        type: 'ENTRY',
        qrCode: foundSessionCode,
        userInfo: userInfo,
        parkingSlot: parkingSlot,
        parkingLotName: parkingLotName,
        depositFee: depositFee,
      };
      setScannedResult(payload);
      setGateState('COMPARING');
      setManualInput('');
      return;
    } else {
      // REAL EXIT MATCHING AND PHOTO COMPARISON
      if (inputClean) {
        if (!isQrScan) {
          try {
            const res = await fetch(`${API_BASE_URL}/ParkingSessions/active-by-plates`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify([inputClean]),
            });
            if (res.ok) {
              const sessions = await res.json();
              if (sessions && sessions.length > 0) {
                const session = sessions[0];
                entryPhoto = session.entryPhoto || '';
                const entryTimeVal = session.entryTime || session.createdAt;
                entryTimeStr = new Date(entryTimeVal).toLocaleString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
                entryPlate = session.licensePlate;
                ticketLabel = `Vé vãng lai • Vào: ${entryTimeStr}`;
                foundSessionCode = session.qrCode;

                try {
                  const checkRes = await fetch(`${API_BASE_URL}/ParkingSessions/verify/${session.qrCode}`);
                  if (checkRes.ok) {
                    const checkData = await checkRes.json();
                    computedFee = checkData.fee || 10000;
                    depositFee = checkData.prepaidAmount || 0;
                    if (checkData.user) {
                      owner = `${checkData.user.lastName || ''} ${checkData.user.firstName || ''}`.trim();
                      userInfo = checkData.user;
                      ticketLabel = `Đặt trước • Slot ${session.parkingSlot} (${session.parkingLotName})`;
                      parkingSlot = session.parkingSlot;
                      parkingLotName = session.parkingLotName;
                    }
                  }
                } catch {}
              } else {
                playWarningSound();
                showAlert(`Không tìm thấy xe mang biển số ${inputClean} đang gửi trong bãi!`);
                return;
              }
            }
          } catch (e) {
            console.warn('Active-by-plates check failed:', e);
          }
        } else {
          try {
            const response = await fetch(`${API_BASE_URL}/ParkingSessions/verify/${inputClean}`);
            if (response.ok) {
              const data = await response.json();
              const session = data.session;
              const user = data.user;

              if (session.userId && !session.isCheckedIn) {
                playWarningSound();
                showAlert('⚠️ LỖI: Xe đặt trước này CHƯA QUÉT VÀO BÃI. Không thể cho ra!');
                return;
              }

              entryPhoto = session.entryPhoto || '';
              const entryTimeVal = session.entryTime || session.createdAt;
              entryTimeStr = new Date(entryTimeVal).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
              entryPlate = session.licensePlate;
              computedFee = data.fee || 0;
              depositFee = data.prepaidAmount || 0;
              ticketLabel = session.userId
                ? `Đặt trước • Slot ${session.parkingSlot} (${session.parkingLotName})`
                : 'Vé vãng lai (Máy tự động)';
              parkingSlot = session.parkingSlot;
              parkingLotName = session.parkingLotName;
              foundSessionCode = session.qrCode;
              reservationDate = session.reservationDate || '';
              reservationStartTime = session.reservationStartTime || '';

              if (user) {
                owner = `${user.lastName || ''} ${user.firstName || ''}`.trim() || 'KHÁCH ĐẶT TRƯỚC (APP)';
                userInfo = user;
              } else {
                owner = 'KHÁCH VÃNG LAI';
                userInfo = undefined;
              }
            } else {
              playWarningSound();
              showAlert('Mã QR không hợp lệ hoặc vé này đã thanh toán rời bãi!');
              return;
            }
          } catch (e) {
            console.warn('QR verification check failed:', e);
          }
        }
      }

      if (entryPlate && (await checkBlacklistForPlate(entryPlate))) {
        return;
      }

      const payload = {
        plate: entryPlate,
        exitPlate: entryPlate,
        status: 'Hợp lệ',
        time: new Date().toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        owner: owner,
        ticketType: ticketLabel,
        capturedPhoto: livePhoto,
        registeredPhoto: entryPhoto,
        type: 'EXIT',
        qrCode: foundSessionCode,
        fee: computedFee,
        userInfo: userInfo,
        entryTime: entryTimeStr,
        reservationDate: reservationDate,
        reservationStartTime: reservationStartTime,
        parkingSlot: parkingSlot,
        parkingLotName: parkingLotName,
        depositFee: depositFee,
      };

      setScannedResult(payload);
      setGateState('COMPARING');
      setManualInput('');

      if (autoApprove) {
        startAutoPassCountdown();
      }
    }
  };

  const startAutoPassCountdown = () => {
    if (gateMode === 'ENTRY') return;
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    const initialSecs = 2.5;
    setCountdown(initialSecs);
    setIsCountdownActive(true);

    let current = initialSecs;
    countdownTimerRef.current = setInterval(() => {
      current -= 0.5;
      if (current <= 0) {
        clearInterval(countdownTimerRef.current);
        confirmPass();
      } else {
        setCountdown(current);
      }
    }, 500);
  };

  const confirmPass = async () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setIsCountdownActive(false);

    if (!scannedResult) return;

    if (scannedResult.type === 'ENTRY') {
      setIsOcrLoading(true);
      try {
        let res;
        if (scannedResult.qrCode) {
          res = await fetch(`${API_BASE_URL}/ParkingSessions/gate-scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qrCode: scannedResult.qrCode,
              QrCode: scannedResult.qrCode,
              entryPhoto: scannedResult.capturedPhoto,
              EntryPhoto: scannedResult.capturedPhoto,
            }),
          });
        } else {
          res = await fetch(`${API_BASE_URL}/ParkingSessions/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              licensePlate: scannedResult.plate,
              LicensePlate: scannedResult.plate,
              entryPhoto: scannedResult.capturedPhoto,
              EntryPhoto: scannedResult.capturedPhoto,
              parkingLotName: selectedParkingLot || 'Khu Vực A (Vãng lai)',
              ParkingLotName: selectedParkingLot || 'Khu Vực A (Vãng lai)',
              vehicleType: 'Car',
              VehicleType: 'Car',
            }),
          });
        }

        if (res.ok) {
          const data = await res.json();
          const session = data.session || data;
          playChimeSound();
          setGeneratedTicket({
            qrCode: session.qrCode,
            plate: session.licensePlate,
            time: new Date(session.entryTime || session.createdAt).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }),
            photo: session.entryPhoto || scannedResult.capturedPhoto,
            vehicleType: session.vehicleType || 'Car',
            parkingLotName: session.parkingLotName || selectedParkingLot || 'Khu Vực A',
          });
          setGateState('GATE_OPEN');
        } else {
          try {
            const errData = await res.json();
            setAlertMessage(errData.message || 'Lỗi xác thực QR code. Vui lòng kiểm tra lại.');
          } catch {
            setAlertMessage('Lỗi xác thực từ máy chủ!');
          }
          setTimeout(() => setAlertMessage(null), 3000);
        }
      } catch (err) {
        console.warn('Database check-in / gate-scan failed:', err);
        setAlertMessage('Lỗi kết nối đến máy chủ.');
        setTimeout(() => setAlertMessage(null), 3000);
      }
      setIsOcrLoading(false);
    } else {
      setGateState('GATE_OPEN');
      playChimeSound();

      try {
        const qrCodeToPost = scannedResult.qrCode || `QR_MOCK_${scannedResult.plate}`;
        await fetch(`${API_BASE_URL}/ParkingSessions/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qrCode: qrCodeToPost,
            QrCode: qrCodeToPost,
            exitLicensePlate: scannedResult.exitPlate || scannedResult.plate,
            ExitLicensePlate: scannedResult.exitPlate || scannedResult.plate,
            exitPhoto: scannedResult.capturedPhoto,
            ExitPhoto: scannedResult.capturedPhoto,
            extraFees: extraFees.map((f) => ({ name: f.name, amount: f.amount })),
            ExtraFees: extraFees.map((f) => ({ Name: f.name, Amount: f.amount })),
          }),
        });
      } catch (e) {
        console.warn(e);
      }

      setTimeout(async () => {
        await fetchRecentSessions();
        setScannedResult(null);
        setGateState('SCANNING');
      }, 2200);
    }
  };

  const denyPass = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setIsCountdownActive(false);
    playWarningSound();

    const alertLog = {
      plate: scannedResult ? scannedResult.plate : 'CẢNH BÁO',
      status: 'Từ chối / Báo động',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'ALERT',
      owner: scannedResult ? scannedResult.owner : 'N/A',
      ticketType: scannedResult ? scannedResult.ticketType : 'Kẻ lạ',
      photo: scannedResult ? scannedResult.capturedPhoto : FALLBACK_CAR_CAPTURES[0],
    };

    setRecentLogs((prev) => [alertLog, ...prev.slice(0, 5)]);
    setScannedResult(null);
    setExtraFees([]);
    setIsAddingSurcharge(false);
    setGateState('SCANNING');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('user-login'));
    window.location.href = 'http://localhost:5173/login';
  };

  const displayName = currentUser
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
      currentUser.username ||
      currentUser.email
    : 'Nhân viên Cổng';

  return (
    <div className="bg-slate-50 text-slate-800 h-screen w-full overflow-hidden selection:bg-blue-600/10 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col">
      {/* Header Layout */}
      <Header
        currentUser={currentUser}
        displayName={displayName}
        activeTab={activeTab}
        navigateTo={navigateTo}
        handleLogout={handleLogout}
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
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 overflow-hidden flex flex-col">
          <div className="grid grid-cols-12 gap-5 h-full">
            {/* COLUMN 1: LEFT AREA (Main Camera & Split Comparison) */}
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-5 h-full overflow-hidden">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[520px] relative">
                {/* PERSISTENT CAMERA FEED */}
                <LiveFeed
                  gateState={gateState}
                  videoRef={camera.videoRef}
                  hasCameraAccess={camera.hasCameraAccess}
                  startCamera={camera.startCamera}
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
            </div>

            {/* COLUMN 2: RIGHT AREA (Control Configurations & Billing Panel) */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-5 h-full overflow-hidden">
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
                captureFrame={camera.captureFrame}
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
            </div>
          </div>
        </main>
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
      <AnimatePresence>
        {alertMessage && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[90%] pointer-events-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-500 backdrop-blur-2xl border border-red-400 p-4 rounded-2xl shadow-[0_8px_30px_rgb(220,38,38,0.3)] flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/20 text-white shadow-inner">
                <span className="material-symbols-outlined">error</span>
              </div>
              <div className="flex-1 mt-0.5 animate-pulse">
                <h3 className="text-white text-sm font-black uppercase tracking-wide drop-shadow-sm">
                  Cảnh báo hệ thống
                </h3>
                <p className="text-red-50 text-[11.5px] font-medium mt-1 leading-relaxed drop-shadow-sm">
                  {alertMessage}
                </p>
              </div>
              <button
                onClick={() => setAlertMessage(null)}
                className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

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
            handleReportVehicle={handleReportVehicle}
            FALLBACK_CAR_CAPTURES={FALLBACK_CAR_CAPTURES}
          />
        )}
      </AnimatePresence>

      {/* Issue Casual Guest Ticket Dialog */}
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
    </div>
  );
};

export default App;
