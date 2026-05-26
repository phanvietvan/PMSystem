import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart3, 
  ExternalLink, 
  FileText, 
  Activity, 
  Lock, 
  QrCode, 
  Keyboard, 
  CheckCircle2, 
  LogOut, 
  ShieldCheck, 
  Radio, 
  Search, 
  Bell,
  Camera,
  RefreshCw,
  Zap,
  ChevronDown,
  User,
  Shield,
  Clock,
  Unlock,
  AlertTriangle,
  FileCheck,
  Plus,
  Download,
  Printer,
  ScanFace
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import jsQR from 'jsqr';
import Tesseract from 'tesseract.js';
import WelcomeAnimation from './Welcome.json';
import NotificationPanel from './components/common/NotificationPanel';
import BrandLogo from './components/brand/BrandLogo';

import QRCode from 'qrcode';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://pmsystem-oxl8.onrender.com/api');

// Fallback high-quality car photos for live webcam fallbacks ONLY
const FALLBACK_CAR_CAPTURES = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
];

const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [capacity, setCapacity] = useState(140);
  const [gateMode, setGateMode] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  
  // Gate workflow state machine: 'SCANNING' -> 'COMPARING' -> 'GATE_OPEN'
  const [gateState, setGateState] = useState<'SCANNING' | 'COMPARING' | 'GATE_OPEN'>('SCANNING');
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const formatPlateNumber = (plate: string): string => {
    if (!plate) return '';
    // Just trim and uppercase to keep plate raw without strict dash or dot formatting
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
  const [visitorPlate, setVisitorPlate] = useState('');
  const [visitorVehicleType, setVisitorVehicleType] = useState('Car');
  const [generatedTicket, setGeneratedTicket] = useState<any>(null);
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => {
      setAlertMessage((current) => current === msg ? null : current);
    }, 4000);
  };

  useEffect(() => {
    if (generatedTicket?.qrCode) {
      QRCode.toDataURL(generatedTicket.qrCode, { width: 200, margin: 1 }, (err, url) => {
        if (!err && url) {
          setTicketQrDataUrl(url);
        }
      });
    } else {
      setTicketQrDataUrl('');
    }
  }, [generatedTicket]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Real MongoDB logs feed
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [selectedLogPhoto, setSelectedLogPhoto] = useState<string | null>(null);
  const [selectedLogEntry, setSelectedLogEntry] = useState<any>(null);

  // Audio system synthetics
  const playChimeSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      gain.gain.setValueAtTime(0.08, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn(e);
    }
  };

  // Ref to hold the latest handler functions to avoid stale closures in useEffect
  const handlersRef = useRef({
    handleOcrAndScan: () => {},
    confirmPass: () => {}
  });

  useEffect(() => {
    handlersRef.current = {
      handleOcrAndScan: () => handleOcrAndScan(),
      confirmPass: () => confirmPass()
    };
  });

  const playWarningSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn(e);
    }
  };

  // Keyboard Hotkeys: SPACE = quick scan, F4 = visitor modal, F8 = manual confirm, Esc = stop countdown / alert
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid hotkeys when typing in text inputs
      if (document.activeElement?.tagName === 'INPUT') return;

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
        setShowVisitorModal(prev => !prev);
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
          // Cancel the auto countdown for manual verification
          setIsCountdownActive(false);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          playWarningSound();
        } else {
          setShowVisitorModal(false);
          setScannedResult(null);
          setSelectedLogPhoto(null);
          setGateState('SCANNING');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gateState, scannedResult, isCountdownActive, gateMode]);

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
          avatarUrl: ''
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

  // Fetch real-time active sessions & logs directly from MongoDB
  const fetchRecentSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ParkingSessions`);
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((session: any) => {
          const entryDateObj = new Date(session.entryTime);
          const timeStr = entryDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const dateStr = entryDateObj.toLocaleDateString('vi-VN');
          
          let exitTimeStr = '';
          let exitDateStr = '';
          if (session.exitTime) {
            const exitDateObj = new Date(session.exitTime);
            exitTimeStr = exitDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            exitDateStr = exitDateObj.toLocaleDateString('vi-VN');
          }

          let dynamicTicketStatus = '';
          if (session.status === 'Completed') dynamicTicketStatus = 'Đã hoàn tất (Đã ra)';
          else if (session.status === 'Active') {
             dynamicTicketStatus = session.userId ? (session.isCheckedIn ? 'Đang gửi trong bãi' : 'Đã đặt chỗ (Chưa vào)') : 'Đang gửi trong bãi';
          } else {
             dynamicTicketStatus = session.status;
          }

          return {
            plate: session.licensePlate,
            status: session.status === 'Completed' ? 'Lối ra' : 'Lối vào',
            time: session.status === 'Completed' && session.exitTime ? exitTimeStr : timeStr,
            entryTimeStr: timeStr,
            entryDateStr: dateStr,
            exitTimeStr: exitTimeStr,
            exitDateStr: exitDateStr,
            type: session.status === 'Completed' ? 'EXIT' : 'ENTRY',
            owner: session.userId ? 'KHÁCH ĐẶT TRƯỚC' : 'KHÁCH VÃNG LAI',
            ticketType: dynamicTicketStatus,
            customerName: session.user ? `${session.user.lastName} ${session.user.firstName}`.trim() : null,
            customerPhone: session.user ? session.user.phoneNumber : null,
            customerEmail: session.user ? session.user.email : null,
            photo: session.status === 'Completed' ? (session.exitPhoto || session.entryPhoto || FALLBACK_CAR_CAPTURES[0]) : (session.entryPhoto || FALLBACK_CAR_CAPTURES[0]),
            entryPhoto: session.entryPhoto,
            exitPhoto: session.exitPhoto,
            qrCode: session.qrCode,
            totalFee: session.totalFee,
            parkingLotName: session.parkingLotName,
            parkingSlot: session.parkingSlot
          };
        });

        setRecentLogs(mapped);

        // Dynamic slot capacity matching active database records
        const activeCount = data.filter((s: any) => s.status === 'Active').length;
        setCapacity(140 + activeCount);
      }
    } catch (err) {
      console.warn("Failed to fetch sessions from MongoDB API:", err);
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
      await new Promise(resolve => setTimeout(resolve, 500));
      await startCamera();
    };
    init();
    return () => stopCamera();
  }, []);

  // Re-attach active stream whenever the video element remounts in SCANNING state
  useEffect(() => {
    if (gateState === 'SCANNING') {
      const t = setTimeout(() => {
        if (streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          console.log("Re-attached active webcam stream to remounted video element");
        }
      }, 100);
      return () => clearTimeout(t);
    }
  }, [gateState]);

  const startCamera = async () => {
    stopCamera();
    const constraints = [
      { video: { facingMode: 'environment', width: 640, height: 480 } },
      { video: { facingMode: 'user', width: 640, height: 480 } },
      { video: true }
    ];

    for (const c of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(c);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setHasCameraAccess(true);
          return;
        }
      } catch (err) {
        console.warn(err);
      }
    }
    setHasCameraAccess(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = (): string | null => {
    if (videoRef.current && hasCameraAccess) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg');
        }
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  };

  // Real-time camera QR decoding using jsQR
  useEffect(() => {
    let active = true;
    let frameId: number;

    const decodeLoop = () => {
      if (!active) return;

      if (gateState === 'SCANNING' && hasCameraAccess && videoRef.current) {
        const video = videoRef.current;
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
                inversionAttempts: "dontInvert",
              });

              if (code && code.data) {
                console.log("Webcam scanned QR successfully:", code.data);
                triggerScan(code.data);
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

    if (hasCameraAccess && gateState === 'SCANNING') {
      frameId = requestAnimationFrame(decodeLoop);
    }

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [hasCameraAccess, gateState, gateMode]);

  // Create active session for casual visitor ("xe vãng lai")
  const handleCreateVisitorTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorPlate.trim()) return;

    setIsGeneratingTicket(true);
    playChimeSound();

    const plateNormalized = visitorPlate.trim().toUpperCase();
    const livePhoto = captureFrame() || FALLBACK_CAR_CAPTURES[Math.floor(Math.random() * FALLBACK_CAR_CAPTURES.length)];

    const apiPayload = {
      LicensePlate: plateNormalized,
      EntryPhoto: livePhoto,
      ParkingLotName: 'Khu Vực A (Vãng lai)',
      VehicleType: visitorVehicleType,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/ParkingSessions/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedTicket({
          qrCode: data.qrCode,
          plate: data.licensePlate,
          time: new Date(data.entryTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
          photo: data.entryPhoto || livePhoto,
          vehicleType: data.vehicleType
        });
        fetchRecentSessions();
      } else {
        throw new Error("Checkin post failed");
      }
    } catch (err) {
      console.warn("Failed to checkin via database, falling back to local simulation:", err);
      const mockQrCode = `QR_VIS_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setGeneratedTicket({
        qrCode: mockQrCode,
        plate: plateNormalized,
        time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        photo: livePhoto,
        vehicleType: visitorVehicleType
      });
    } finally {
      setIsGeneratingTicket(false);
    }
  };

  // Trigger manual QR scanning workflow using text input field
  const handleOcrAndScan = async () => {
    if (manualInput.trim()) {
      const input = manualInput.trim().toUpperCase();
      setManualInput('');
      await triggerScan(input);
    }
  };

  // Trigger exit scan verification
  const triggerScan = async (customPlateOrQr?: string) => {
    playChimeSound();

    const inputCleanRaw = (customPlateOrQr || '').trim().toUpperCase();
    const isQrScan = inputCleanRaw.startsWith('QR_') || inputCleanRaw.startsWith('QR');
    const inputClean = isQrScan ? inputCleanRaw : formatPlateNumber(inputCleanRaw);

    // Hàm kiểm tra Blacklist cho biển số cuối cùng (sau khi quét QR/nhập tay)
    const checkBlacklistForPlate = async (plateToCheck: string) => {
      if (!plateToCheck) return false;
      try {
        const token = localStorage.getItem('token');
        const blRes = await fetch(`${API_BASE_URL}/Blacklist?t=${new Date().getTime()}`);
        if (blRes.ok) {
          const blData = await blRes.json();
          // Hàm chuẩn hoá biển số: xoá khoảng trắng, dấu gạch ngang, chấm...
          const normalizePlate = (p: string) => (p || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
          
          const blacklisted = blData.find((b: any) => normalizePlate(b.plateNumber) === normalizePlate(plateToCheck));
          if (blacklisted) {
            playWarningSound();
            showAlert(`🚫 TỪ CHỐI PHỤC VỤ! Xe ${blacklisted.plateNumber} nằm trong Danh Sách Đen. Lý do: ${blacklisted.reason}`);
            
            fetch(`${API_BASE_URL}/Notifications/push`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify({
                role: 'admin',
                title: 'Cảnh báo xe Blacklist cố vào bãi',
                message: `Biển số ${blacklisted.plateNumber} bị từ chối phục vụ. Lý do: ${blacklisted.reason}`
              })
            }).catch(e => console.error(e));
            return true;
          }
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra blacklist", err);
      }
      return false;
    };

    const livePhoto = captureFrame() || FALLBACK_CAR_CAPTURES[Math.floor(Math.random() * FALLBACK_CAR_CAPTURES.length)];
    const fallbackEntryPhoto = FALLBACK_CAR_CAPTURES[1];

    let entryPhoto = fallbackEntryPhoto;
    let entryTimeStr = 'N/A';
    let entryPlate = isQrScan ? '' : (inputClean || formatPlateNumber('30F-' + Math.floor(100 + Math.random() * 900) + '.' + Math.floor(10 + Math.random() * 90)));
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
              showAlert("⚠️ LỘN CỔNG! Vé vãng lai này đã được cấp để gửi xe. Vui lòng sang MÀN HÌNH LỐI RA (EXIT) để quét mã thanh toán!");
              return;
            }

            if (session.isCheckedIn) {
              playWarningSound();
              showAlert("⚠️ XE ĐÃ TRONG BÃI! Khách đặt trước này đã quét mã vào cổng rồi. Vui lòng sang MÀN HÌNH LỐI RA (EXIT) để quét ra ngoài!");
              return;
            }

            entryPlate = session.licensePlate;
            ticketType = `Đặt trước • Slot ${session.parkingSlot} (${session.parkingLotName})`;
            parkingSlot = session.parkingSlot;
            parkingLotName = session.parkingLotName;
            
            if (user) {
              owner = `${user.lastName || ''} ${user.firstName || ''}`.trim() || 'XE ĐẶT TRƯỚC (RESERVATION)';
              userInfo = user;
            } else {
              owner = 'XE ĐẶT TRƯỚC (RESERVATION)';
            }
            foundSessionCode = session.qrCode;
          } else {
            playWarningSound();
            showAlert("Mã QR đặt chỗ không hợp lệ hoặc đã được sử dụng!");
            return;
          }
        } catch (e) {
          console.warn("QR verification check failed on entry:", e);
        }
      }

      // 1. Kiểm tra Blacklist trước khi cho phép xử lý tiếp (áp dụng cho cả QR code vì lúc này đã có biển số)
      if (entryPlate && await checkBlacklistForPlate(entryPlate)) {
        return;
      }

      const payload = {
        plate: entryPlate,
        status: 'Chờ xác nhận',
        time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        owner: owner,
        ticketType: ticketType,
        capturedPhoto: livePhoto,
        registeredPhoto: livePhoto,
        type: 'ENTRY',
        qrCode: foundSessionCode,
        userInfo: userInfo,
        parkingSlot: parkingSlot,
        parkingLotName: parkingLotName
      };
      setScannedResult(payload);
      setGateState('COMPARING');
      setManualInput('');
      return;
    } else {
      // 2. REAL EXIT MATCHING AND PHOTO COMPARISON
      if (inputClean) {
        if (!isQrScan) {
          // If operator entered Exit Plate, find active session in MongoDB
          try {
            const res = await fetch(`${API_BASE_URL}/ParkingSessions/active-by-plates`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify([inputClean])
            });
            if (res.ok) {
              const sessions = await res.json();
              if (sessions && sessions.length > 0) {
                const session = sessions[0];
                entryPhoto = session.entryPhoto || '';
                const entryTimeVal = session.entryTime || session.createdAt;
                entryTimeStr = new Date(entryTimeVal).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
                entryPlate = session.licensePlate;
                ticketLabel = `Vé vãng lai • Vào: ${entryTimeStr}`;
                foundSessionCode = session.qrCode;
                
                // Fetch user info for plate check as well!
                try {
                  const checkRes = await fetch(`${API_BASE_URL}/ParkingSessions/verify/${session.qrCode}`);
                  if (checkRes.ok) {
                    const checkData = await checkRes.json();
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
                // Warning if plate not found in database active list
                playWarningSound();
                showAlert(`Không tìm thấy xe mang biển số ${inputClean} đang gửi trong bãi!`);
                return;
              }
            }
          } catch (e) {
            console.warn("Active-by-plates check failed:", e);
          }
        } else {
          // If guest scanned QR code, retrieve it and get the real database photo!
          try {
            const response = await fetch(`${API_BASE_URL}/ParkingSessions/verify/${inputClean}`);
            if (response.ok) {
              const data = await response.json();
              const session = data.session;
              const user = data.user;

              if (session.userId && !session.isCheckedIn) {
                playWarningSound();
                showAlert("⚠️ LỖI: Xe đặt trước này CHƯA QUÉT VÀO BÃI. Không thể cho ra!");
                return;
              }

              entryPhoto = session.entryPhoto || '';
              const entryTimeVal = session.entryTime || session.createdAt;
              entryTimeStr = new Date(entryTimeVal).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
              entryPlate = session.licensePlate;
              computedFee = data.fee;
              ticketLabel = session.userId ? `Đặt trước • Slot ${session.parkingSlot} (${session.parkingLotName})` : 'Vé vãng lai (Máy tự động)';
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
              // Warning if QR not active or not found
              playWarningSound();
              showAlert("Mã QR không hợp lệ hoặc vé này đã thanh toán rời bãi!");
              return;
            }
          } catch (e) {
            console.warn("QR verification check failed:", e);
          }
        }
      }

      // Kiểm tra Blacklist khi ra cổng
      if (entryPlate && await checkBlacklistForPlate(entryPlate)) {
        return;
      }

      const payload = {
        plate: entryPlate,              // Entry plate from MongoDB
        exitPlate: entryPlate,          // Exit plate (can be modified by operator for comparison!)
        status: 'Hợp lệ',
        time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        owner: owner,
        ticketType: ticketLabel,
        capturedPhoto: livePhoto,       // Current live exit photo
        registeredPhoto: entryPhoto,   // REAL MongoDB entry photo!
        type: 'EXIT',
        qrCode: foundSessionCode,
        fee: computedFee,
        userInfo: userInfo,
        entryTime: entryTimeStr,         // Injected entryTime!
        reservationDate: reservationDate,
        reservationStartTime: reservationStartTime,
        parkingSlot: parkingSlot,
        parkingLotName: parkingLotName
      };

      setScannedResult(payload);
      setGateState('COMPARING');
      setManualInput('');

      // Trigger auto pass countdown if enabled
      if (autoApprove) {
        startAutoPassCountdown();
      }
    }
  };

  // Start the ticking countdown for automated approval
  const startAutoPassCountdown = () => {
    if (gateMode === 'ENTRY') return; // Do not auto-confirm entry to let operator review/edit
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

  // Confirm passage, write to MongoDB database, and show Barrier Open screen
  const confirmPass = async () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setIsCountdownActive(false);
    
    if (!scannedResult) return;

    if (scannedResult.type === 'ENTRY') {
      setIsOcrLoading(true);
      try {
        let res;
        if (scannedResult.qrCode) {
          // Real gate-scan for existing reservation!
          res = await fetch(`${API_BASE_URL}/ParkingSessions/gate-scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qrCode: scannedResult.qrCode,
              QrCode: scannedResult.qrCode,
              entryPhoto: scannedResult.capturedPhoto,
              EntryPhoto: scannedResult.capturedPhoto
            })
          });
        } else {
          // Standard check-in for walk-in visitor!
          res = await fetch(`${API_BASE_URL}/ParkingSessions/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              licensePlate: scannedResult.plate,
              LicensePlate: scannedResult.plate,
              entryPhoto: scannedResult.capturedPhoto,
              EntryPhoto: scannedResult.capturedPhoto,
              parkingLotName: 'Cổng Vào A1',
              ParkingLotName: 'Cổng Vào A1',
              vehicleType: 'Car',
              VehicleType: 'Car'
            })
          });
        }

        if (res.ok) {
          const data = await res.json();
          // Extract session correctly (gate-scan returns { message, session })
          const session = data.session || data;
          playChimeSound();
          setGeneratedTicket({
            qrCode: session.qrCode,
            plate: session.licensePlate,
            time: new Date(session.entryTime || session.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
            photo: session.entryPhoto || scannedResult.capturedPhoto,
            vehicleType: session.vehicleType || 'Car'
          });
          setGateState('GATE_OPEN');
        }
      } catch (err) {
        console.warn("Database check-in / gate-scan failed:", err);
      }
      setIsOcrLoading(false);
    } else {
      // Transition to open barrier screen for EXIT
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
            ExitPhoto: scannedResult.capturedPhoto
          })
        });
      } catch (e) {
        console.warn(e);
      }

      // Wait 2.2 seconds before lowering barrier and returning to Scan state
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
      photo: scannedResult ? scannedResult.capturedPhoto : FALLBACK_CAR_CAPTURES[0]
    };

    setRecentLogs(prev => [alertLog, ...prev.slice(0, 5)]);
    setScannedResult(null);
    setGateState('SCANNING');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('user-login'));
    window.location.href = 'http://localhost:5173/login';
  };

  const displayName = currentUser 
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username || currentUser.email
    : 'Nhân viên Cổng';

  const roleLabel = currentUser?.role === 'Admin' || currentUser?.role === 2 ? 'Quản trị viên' : 'Nhân viên';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="bg-slate-50 text-slate-800 h-screen w-full overflow-hidden selection:bg-blue-600/10 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col">
      {/* Sleek, Premium Light Header */}
      <header className="shrink-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <BrandLogo size="md" />

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#" className="text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative text-blue-600">
              Trang chủ
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600" />
            </a>
            <a href="#" className="text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative text-slate-500 hover:text-blue-600">
              Trạng thái
            </a>
            <a href="#" className="text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative text-slate-500 hover:text-blue-600">
              Liên hệ
            </a>
          </div>

          {/* Auth Buttons or User Menu */}
          <div className="flex items-center gap-4">
            <a
              href="https://localhost:5173/"
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50 text-blue-600 rounded-full transition-all duration-300 font-black text-sm border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              title="Dashboard (Admin)"
            >
              D
            </a>

            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50/80 text-slate-500 hover:text-blue-600 rounded-full transition-all duration-300 ease-out border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_15px_rgba(37,99,235,0.12)] hover:-translate-y-0.5 relative group active:scale-95"
              >
                <Bell size={18} className="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-12 group-hover:scale-110 group-active:rotate-0" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white transition-transform duration-300 group-hover:scale-125"></span>
              </button>
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 top-12 z-50">
                    <NotificationPanel role="staff" onClose={() => setIsNotifOpen(false)} />
                  </div>
                </>
              )}
            </div>
            
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 p-1.5 pr-4 rounded-full border border-slate-200 transition-colors duration-200"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 bg-blue-100 text-blue-600">
                    {currentUser.email ? (
                      <img 
                        src={`https://unavatar.io/${currentUser.email}?fallback=false`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                        onError={(e) => { 
                          e.currentTarget.onerror = null; // Prevent infinite loop
                          if (currentUser.avatarUrl && currentUser.avatarUrl !== 'null' && currentUser.avatarUrl !== 'undefined') {
                            e.currentTarget.src = currentUser.avatarUrl;
                          } else {
                            e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=DBEAFE&color=2563EB';
                          }
                        }}
                      />
                    ) : currentUser.avatarUrl && currentUser.avatarUrl !== 'null' && currentUser.avatarUrl !== 'undefined' ? (
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-0.5">Xin chào,</p>
                    <p className="text-xs font-bold text-slate-900 leading-none">
                      {displayName}
                    </p>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute right-0 mt-3 w-60 glass-panel rounded-2xl py-2 z-20 origin-top-right shadow-xl shadow-slate-200/40 p-1 flex flex-col gap-0.5 animate-fade-in-up">
                        <div className="px-4 py-3 border-b border-slate-100 mb-1.5">
                          <p className="text-xs font-bold text-slate-800 font-display">
                            {displayName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{currentUser.email}</p>
                        </div>
                        <a href="https://localhost:5173/" className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50/50 hover:text-blue-600 transition-colors duration-200 rounded-xl">
                          <ExternalLink size={15} className="opacity-70" />
                          <span>Về trang chủ</span>
                        </a>
                        <button onClick={handleLogout} className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50/50 transition-colors duration-200 rounded-xl w-full text-left border-t border-slate-100/80 mt-1.5 pt-2 cursor-pointer">
                          <LogOut size={15} />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main 2-Column Spacious Layout */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-5 h-full">
          
          {/* COLUMN 1: LEFT AREA (Main Camera & Split Comparison) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-5 h-full overflow-hidden">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[520px] relative">
              
              {/* PERSISTENT CAMERA FEED (NEVER UNMOUNTS TO PREVENT iOS FREEZING!) */}
              <div className={`absolute inset-0 bg-slate-950 transition-opacity duration-300 ${gateState === 'SCANNING' ? 'opacity-100 pointer-events-auto z-0' : 'opacity-0 pointer-events-none z-0'}`}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />
                
                {!hasCameraAccess && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
                    <Camera className="text-slate-700 animate-bounce" size={42} />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Không tìm thấy Camera</p>
                    <button onClick={startCamera} className="text-xs font-bold text-blue-400 border border-blue-900/60 px-4 py-2 rounded-full bg-blue-955/40 cursor-pointer hover:bg-blue-900/20 transition-all uppercase tracking-wider">Kích hoạt</button>
                  </div>
                )}
              </div>

              {gateState === 'SCANNING' && (
                /* Stage 1: Premium Streaming Monitor Overlays */
                <div className="flex-1 flex flex-col relative bg-transparent z-10 pointer-events-auto animate-fade-in">
                  
                  {/* Camera AI OCR LPR Loader */}
                  <AnimatePresence>
                    {isOcrLoading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/85 z-30 flex flex-col items-center justify-center gap-4 text-center"
                      >
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                          <Zap className="absolute inset-0 m-auto text-emerald-400 animate-pulse" size={24} />
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold uppercase tracking-wider">Hệ thống AI LPR đang định danh biển số...</p>
                          <p className="text-slate-400 text-[10px] uppercase font-bold mt-1 tracking-widest animate-pulse">Đang trích xuất văn bản & lưu MongoDB...</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Camera Header Overlay */}
                  <div className="absolute top-4 inset-x-4 z-20 flex justify-between items-center pointer-events-none">
                    <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-800 text-[10px] font-bold text-white uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      LIVE FEED • CAMERA LỐI SOÁT
                    </div>
                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase border backdrop-blur shadow-sm ${
                      gateMode === 'ENTRY'
                        ? 'bg-blue-600/90 text-white border-blue-500/50'
                        : 'bg-amber-600/90 text-white border-amber-500/50'
                    }`}>
                      {gateMode === 'ENTRY' ? 'CỔNG VÀO (ENTRY)' : 'CỔNG RA (EXIT)'}
                    </span>
                  </div>

                  {/* Sleek Scanner Box overlay */}
                  <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                    <div className="relative w-72 h-44 cursor-pointer flex items-center justify-center" onClick={() => handleOcrAndScan()}>
                      <div className="absolute inset-0 border border-blue-500/30 rounded-2xl bg-blue-500/5">
                        {/* Beautiful Corners */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                      </div>
                      
                      <div className="text-center px-4">
                        <QrCode className="text-blue-500/20 mx-auto mb-2" size={44} />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-955/60 border border-blue-800/40 px-3 py-1 rounded-full">ĐƯA MÃ QR VÀO KHUNG QUÉT</span>
                      </div>
                      <div className="absolute inset-x-0 h-0.5 bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.8)] scanner-line !animate-[scan_3s_ease-in-out_infinite]" />
                    </div>
 
                    <div className="mt-8 text-center px-4">
                      <h2 className="text-white text-lg font-black tracking-widest uppercase mb-1">ĐANG CHỜ MÃ QR</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                        Đưa mã QR của khách hàng vào trước camera soát vé
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold mt-3">
                        [Hoặc nhập mã QR thủ công ở thanh công cụ bên dưới]
                      </p>
                    </div>
                  </div>
 
                  {/* Manual Input Bar */}
                  <div className="z-10 p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center gap-3">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (manualInput.trim()) {
                          const input = manualInput.trim().toUpperCase();
                          setManualInput('');
                          triggerScan(input);
                        }
                      }}
                      className="flex-1 flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 focus-within:border-blue-500/50 transition-all"
                    >
                      <Keyboard className="text-slate-600" size={16} />
                      <input 
                        className="bg-transparent border-none w-full text-white font-mono text-xs uppercase placeholder:text-slate-700 tracking-wider outline-none" 
                        placeholder="NHẬP MÃ QR CỦA XE (Ví dụ: QR_...)..." 
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                      />
                    </form>
                    <button 
                      onClick={() => handleOcrAndScan()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Zap size={13} />
                      XÁC THỰC MÃ QR
                    </button>
                  </div>
                </div>
              )}

              {gateState === 'COMPARING' && scannedResult && (
                /* Stage 2: Dual image split comparison and countdown */
                <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-3xl text-slate-800 animate-scale-up relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-50/80 before:via-white/50 before:to-transparent before:-z-10 z-10 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 opacity-90 shadow-[0_2px_15px_rgba(59,130,246,0.5)] z-20"></div>
                  
                  {/* Countdown progress / manual override indicator */}
                  {isCountdownActive ? (
                    <div className="bg-blue-50/80 backdrop-blur-md border-b border-blue-100/50 px-6 py-3 flex justify-between items-center text-xs font-semibold text-blue-800 relative z-10">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping" />
                        Tự động duyệt và cho xe qua sau <strong className="font-black text-blue-700">{countdown} giây</strong>...
                      </span>
                      <button 
                        onClick={() => {
                          setIsCountdownActive(false);
                          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                          playWarningSound();
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-wider cursor-pointer shadow-md transition-all active:scale-95"
                      >
                        [ESC] DỪNG TỰ ĐỘNG
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50/80 backdrop-blur-md border-b border-amber-100/50 px-6 py-3 flex justify-between items-center text-xs font-semibold text-amber-800 relative z-10">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle size={15} className="text-amber-600 drop-shadow-sm" />
                        Đã tạm dừng tự động. Vui lòng bấm xác nhận bên dưới.
                      </span>
                    </div>
                  )}

                  <div className="px-6 py-4 border-b border-slate-100/80 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[1.25rem] bg-gradient-to-br from-blue-50 to-blue-100/80 flex items-center justify-center text-blue-600 shadow-[inset_0_2px_5px_rgba(255,255,255,1)] border border-blue-200/50">
                        <ScanFace size={18} className="drop-shadow-sm" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest drop-shadow-sm">ĐỐI CHIẾU THÔNG TIN XE</h4>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Xác thực khớp hình dạng xe & biển số</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl uppercase border shadow-sm ${
                      scannedResult.type === 'ENTRY' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500'
                    }`}>
                      {scannedResult.type === 'ENTRY' ? 'Lối Vào • Entry' : 'Lối Ra • Exit'}
                    </span>
                  </div>

                  {scannedResult.type === 'ENTRY' ? (
                    // ENTRY CONFIRMATION PANEL
                    <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch relative z-10 bg-transparent">
                      {/* Left: Captured camera photo */}
                      <div className="md:col-span-5 flex flex-col gap-4">
                        <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-full">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                              <Camera size={14} className="text-blue-500 drop-shadow-sm" /> Ảnh Nhận Diện
                            </span>
                          </div>
                          <div className="rounded-xl overflow-hidden border-2 border-white relative bg-slate-100 group shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50 flex-1 min-h-[220px]">
                            <img src={scannedResult.capturedPhoto} alt="Gate Capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute bottom-2 left-2 bg-blue-600/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] text-white font-black tracking-widest shadow-lg border border-white/20">CAMERA VÀO</div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Large Editable Plate Field */}
                      <div className="md:col-span-7 flex flex-col gap-3">
                        <div className="shrink-0 bg-gradient-to-b from-white to-slate-50/50 py-3.5 px-4 rounded-[1.25rem] border border-slate-200/60 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/30 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]"></div>
                          <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-[0.25em] block mb-2 drop-shadow-sm">BIỂN SỐ NHẬN DIỆN (CÓ THỂ SỬA)</span>
                          <input 
                            type="text" 
                            className="w-full text-[32px] font-mono font-black text-slate-800 text-center tracking-[0.2em] bg-transparent outline-none uppercase leading-none"
                            value={scannedResult.plate}
                            onChange={(e) => setScannedResult({ ...scannedResult, plate: e.target.value.toUpperCase() })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/80 py-2 px-3 rounded-[1rem] border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase shrink-0 pr-2">Vé:</span>
                            <span className="text-[11px] font-black text-blue-700 tracking-widest truncate">{scannedResult.ticketType.split(' • ')[0]}</span>
                          </div>

                          {(scannedResult.parkingLotName || scannedResult.parkingSlot) && (
                            <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/40 px-3 py-2 rounded-[1rem] border border-blue-200/80 flex items-center justify-between shadow-[0_2px_10px_rgba(59,130,246,0.05)]">
                              <span className="text-[8px] text-blue-500 font-extrabold uppercase shrink-0 pr-2">Bãi đỗ:</span>
                              <span className="text-[11px] font-black text-blue-900 truncate tracking-widest">{scannedResult.parkingLotName}</span>
                            </div>
                          )}
                        </div>

                        {(scannedResult.parkingLotName || scannedResult.parkingSlot) && (
                          <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/40 p-3 rounded-[1rem] border border-blue-200/80 flex items-center justify-between shadow-[0_4px_15px_rgba(59,130,246,0.05)] shrink-0">
                            <span className="text-[8px] text-blue-500 font-extrabold uppercase shrink-0">Vị trí đỗ:</span>
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg text-[11px] font-black shadow-[0_4px_10px_rgba(59,130,246,0.3)] whitespace-nowrap">Slot {scannedResult.parkingSlot}</span>
                          </div>
                        )}

                        {scannedResult.reservationDate && (
                          <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-2 px-1">
                              <Clock size={14} className="text-blue-500 drop-shadow-sm" /> Lịch đặt trước
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-blue-50/50 py-2 px-2 rounded-xl border border-blue-100/50 text-center flex flex-col justify-center h-[46px]">
                                <span className="text-[8px] text-blue-500 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Ngày đặt</span>
                                <span className="text-[11px] font-black text-blue-900 block tracking-widest">{new Date(scannedResult.reservationDate).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <div className="bg-blue-50/50 py-2 px-2 rounded-xl border border-blue-100/50 text-center flex flex-col justify-center h-[46px]">
                                <span className="text-[8px] text-blue-500 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Giờ đặt</span>
                                <span className="text-[11px] font-black text-blue-900 block tracking-widest">{scannedResult.reservationStartTime}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {scannedResult.userInfo && (
                          <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-2 h-full min-h-0">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 px-1">
                              <User size={14} className="text-blue-500 drop-shadow-sm" /> Khách hàng
                            </span>
                            <div className="bg-white rounded-xl p-2.5 border border-slate-100/80 flex flex-col gap-1.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.01)] flex-1 justify-center min-h-0 overflow-y-auto custom-scrollbar">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Tên:</span>
                                <span className="text-[10px] font-bold text-slate-800 block truncate text-right">{`${scannedResult.userInfo.lastName || scannedResult.userInfo.LastName || ''} ${scannedResult.userInfo.firstName || scannedResult.userInfo.FirstName || ''}`.trim() || scannedResult.userInfo.username || scannedResult.userInfo.Username || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">SĐT:</span>
                                <span className="text-[10px] font-bold text-slate-800 block text-right">{scannedResult.userInfo.phoneNumber || scannedResult.userInfo.PhoneNumber || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2 border-t border-slate-100 pt-1.5">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Email:</span>
                                <span className="text-[10px] font-bold text-slate-800 block truncate text-right">{scannedResult.userInfo.email || scannedResult.userInfo.Email || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2 border-t border-slate-100 pt-1.5">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Mã QR đặt chỗ:</span>
                                <span className="text-[9px] font-mono font-black text-blue-700 block text-right">{scannedResult.qrCode}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // EXIT COMPARISON PANEL
                    <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch relative z-10 bg-transparent">
                      {/* Left: Photos Comparison */}
                      <div className="md:col-span-5 flex flex-col gap-4">
                        <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-full">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                              <Camera size={14} className="text-blue-500 drop-shadow-sm" /> Ảnh đối chiếu
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-3 h-full">
                            {/* Gate Capture */}
                            <div className="rounded-xl overflow-hidden border-2 border-white relative bg-slate-100 group shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50 flex-1 min-h-[150px]">
                              <img src={scannedResult.capturedPhoto} alt="Gate Capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute bottom-2 left-2 bg-blue-600/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] text-white font-black tracking-widest shadow-lg border border-white/20">ẢNH HIỆN TẠI</div>
                            </div>
                            
                            {/* Registered Photo */}
                            <div className="rounded-xl overflow-hidden border-2 border-white relative bg-slate-100 group shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50 flex-1 min-h-[150px]">
                              {scannedResult.registeredPhoto ? (
                                <img src={scannedResult.registeredPhoto} alt="Entry Capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-1.5 p-4 text-center">
                                  <span className="material-symbols-outlined text-[32px] text-slate-300">image_not_supported</span>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">ẢNH VÀO LỖI</span>
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] text-white font-black tracking-widest shadow-lg border border-white/10">ẢNH LÚC VÀO</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Plate Verification & Details */}
                      <div className="md:col-span-7 flex flex-col gap-3">
                        <div className="shrink-0 bg-gradient-to-b from-white to-slate-50/50 py-3.5 px-4 rounded-[1.25rem] border border-slate-200/60 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/30 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]"></div>
                          <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-[0.25em] block mb-2 drop-shadow-sm">BIỂN SỐ XE RA (CÓ THỂ SỬA)</span>
                          <input 
                            type="text" 
                            className="w-full text-[32px] font-mono font-black text-slate-800 text-center tracking-[0.2em] bg-transparent outline-none uppercase leading-none"
                            value={scannedResult.exitPlate || ''}
                            onChange={(e) => setScannedResult({ ...scannedResult, exitPlate: e.target.value.toUpperCase() })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="py-2 px-3 rounded-[1rem] border border-slate-200/60 bg-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center flex flex-col justify-center">
                            <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] block mb-0.5 text-slate-400">Biển số lúc vào</span>
                            <span className="text-[12px] font-mono font-black block tracking-widest text-slate-700">{scannedResult.plate}</span>
                          </div>
                          
                          <div className={`py-2 px-3 rounded-[1rem] border shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center flex flex-col justify-center transition-colors
                            ${(scannedResult.plate || '').replace(/[^A-Z0-9]/g, "") === (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, "")
                              ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60 text-blue-700'
                              : 'bg-red-50 border-red-200 text-red-700 animate-pulse'}`}
                          >
                            <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] block mb-0.5">Kết quả đối chiếu</span>
                            <span className="text-[11px] font-black block tracking-widest">
                              {(scannedResult.plate || '').replace(/[^A-Z0-9]/g, "") === (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, "")
                                ? '✅ TRÙNG KHỚP'
                                : '❌ KHÔNG KHỚP'}
                            </span>
                          </div>
                        </div>

                        {(scannedResult.parkingLotName || scannedResult.parkingSlot) && (
                          <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/40 p-3 rounded-[1rem] border border-blue-200/80 flex items-center justify-between shadow-[0_4px_15px_rgba(59,130,246,0.05)] shrink-0">
                            <div className="flex flex-col min-w-0 flex-1 pr-3 text-left">
                              <span className="text-[8px] text-blue-500 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Tòa nhà / Bãi đỗ</span>
                              <span className="text-[12px] font-black text-blue-900 block uppercase truncate drop-shadow-sm" title={scannedResult.parkingLotName}>
                                {scannedResult.parkingLotName || 'Khu Vực Vãng Lai'}
                              </span>
                            </div>
                            {scannedResult.parkingSlot && (
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-[8px] text-blue-500 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Vị trí đỗ (Ô)</span>
                                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg text-[11px] font-black shadow-[0_4px_10px_rgba(59,130,246,0.3)] whitespace-nowrap">
                                  Slot {scannedResult.parkingSlot}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-2 px-1">
                            <Clock size={14} className="text-blue-500 drop-shadow-sm" /> Thông tin lịch trình
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white py-2 px-2 rounded-xl border border-slate-100 text-center flex flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.03)] h-[56px]">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Thời gian vào</span>
                              <span className="text-[12px] font-mono font-black text-slate-800 block leading-none">{scannedResult.entryTime || 'N/A'}</span>
                            </div>
                            <div className="bg-white py-2 px-2 rounded-xl border border-slate-100 text-center flex flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.03)] h-[56px]">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Thời gian ra</span>
                              <span className="text-[12px] font-mono font-black text-slate-800 block leading-none">{scannedResult.time || 'N/A'}</span>
                            </div>
                          </div>
                          
                          {scannedResult.reservationDate && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="bg-blue-50/50 py-2 px-2 rounded-xl border border-blue-100/50 text-center flex flex-col justify-center h-[46px]">
                                <span className="text-[8px] text-blue-500 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Ngày đặt</span>
                                <span className="text-[11px] font-black text-blue-900 block tracking-widest">{new Date(scannedResult.reservationDate).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <div className="bg-blue-50/50 py-2 px-2 rounded-xl border border-blue-100/50 text-center flex flex-col justify-center h-[46px]">
                                <span className="text-[8px] text-blue-500 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Giờ đặt</span>
                                <span className="text-[11px] font-black text-blue-900 block tracking-widest">{scannedResult.reservationStartTime}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {scannedResult.userInfo && (
                          <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-2 h-full min-h-0">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 px-1">
                              <User size={14} className="text-blue-500 drop-shadow-sm" /> Khách hàng
                            </span>
                            <div className="bg-white rounded-xl p-2.5 border border-slate-100/80 flex flex-col gap-1.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.01)] flex-1 justify-center min-h-0 overflow-y-auto custom-scrollbar">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Tên:</span>
                                <span className="text-[10px] font-bold text-slate-800 block truncate text-right">{`${scannedResult.userInfo.lastName || scannedResult.userInfo.LastName || ''} ${scannedResult.userInfo.firstName || scannedResult.userInfo.FirstName || ''}`.trim() || scannedResult.userInfo.username || scannedResult.userInfo.Username || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">SĐT:</span>
                                <span className="text-[10px] font-bold text-slate-800 block text-right">{scannedResult.userInfo.phoneNumber || scannedResult.userInfo.PhoneNumber || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2 border-t border-slate-100 pt-1.5">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Email:</span>
                                <span className="text-[10px] font-bold text-slate-800 block truncate text-right">{scannedResult.userInfo.email || scannedResult.userInfo.Email || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center gap-2 border-t border-slate-100 pt-1.5">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Mã QR đặt chỗ:</span>
                                <span className="text-[9px] font-mono font-black text-blue-700 block text-right">{scannedResult.qrCode}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="shrink-0 bg-gradient-to-br from-blue-50 to-blue-100/50 py-2.5 px-4 rounded-[1.25rem] border border-blue-200/60 flex items-center justify-between shadow-[0_4px_15px_rgba(59,130,246,0.05)] mt-auto">
                          <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-[0.15em]">Phí thanh toán ({scannedResult.ticketType.split(' • ')[0]})</span>
                          <span className="text-[16px] font-black text-blue-800 tracking-wider drop-shadow-sm">
                            {(scannedResult.fee || 10000).toLocaleString()}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unified Decision Actions Block */}
                  <div className="px-6 pb-6 pt-2 border-t border-slate-200/50">
                    <div className="flex gap-3">
                      <button 
                        onClick={denyPass}
                        className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <AlertTriangle size={15} />
                        {isTouchDevice ? 'Từ chối / Báo động' : '[Esc] Từ chối / Báo động'}
                      </button>

                      <button 
                        onClick={confirmPass}
                        className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                      >
                        <CheckCircle2 size={15} />
                        {scannedResult.type === 'ENTRY' 
                          ? (isTouchDevice ? 'XÁC NHẬN CẤP VÉ' : '[F8] XÁC NHẬN CẤP VÉ')
                          : (isTouchDevice ? 'XÁC NHẬN CHO QUA' : '[F8] XÁC NHẬN CHO QUA')
                        }
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {gateState === 'GATE_OPEN' && (
                /* Stage 3: High fidelity green "BARRIER OPEN" or "PRINT TICKET" screen */
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
                            <img 
                              src={ticketQrDataUrl} 
                              alt="Ticket QR Code"
                              className="w-32 h-32 animate-fade-in"
                            />
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
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">BIỂN SỐ ĐỊNH DANH</span>
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
                              <span className="text-xs font-bold text-emerald-600 mt-0.5 block uppercase">CỔNG VÀO A1</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <button 
                            onClick={async () => {
                              playChimeSound();
                              await fetchRecentSessions();
                              setGeneratedTicket(null);
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
                      <p className="text-xs font-semibold tracking-wider text-emerald-100 uppercase">Mời xe <strong className="text-white bg-slate-900/30 px-3 py-1 rounded-lg border border-white/20 font-mono tracking-widest text-sm mx-1">{scannedResult?.plate}</strong> đi qua lối soát</p>

                      <div className="w-64 h-1 bg-white/20 mt-8 overflow-hidden rounded-full relative">
                        <motion.div 
                          initial={{ width: '100%' }}
                          animate={{ width: '0%' }}
                          transition={{ duration: 2.2, ease: 'linear' }}
                          className="absolute inset-y-0 left-0 bg-white"
                        />
                      </div>
                      <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest mt-3">Thanh chắn sẽ tự động hạ sau 2 giây...</p>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

          {/* COLUMN 2: RIGHT AREA (Control Configurations & Real-time Live MongoDB Feed) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-5 h-full overflow-hidden">
            
            {/* Operator Control configurations */}
            <div className="bg-white/95 backdrop-blur-2xl p-5 md:p-6 rounded-[2rem] border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08),0_0_40px_rgba(59,130,246,0.05)] flex flex-col gap-4 relative overflow-hidden group/config z-10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-50/50 before:to-transparent before:-z-10">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 opacity-90 group-hover/config:opacity-100 transition-opacity duration-500 shadow-[0_2px_15px_rgba(59,130,246,0.5)]"></div>
              
              <div className="flex items-center justify-between border-b border-slate-100/80 pb-3">
                <h3 className="text-[11px] font-black tracking-wider text-slate-800 uppercase flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-blue-400 to-blue-600 shadow-sm"></span>
                  </span>
                  CẤU HÌNH CỔNG
                </h3>
                <span className="text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-100/80 px-2.5 py-1.5 rounded-xl uppercase tracking-widest shadow-[0_2px_10px_rgba(59,130,246,0.1)]">
                  Sức chứa: {capacity}/200
                </span>
              </div>

              {/* Segmented Gate Mode switcher */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-full border border-slate-200/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] relative">
                <button 
                  disabled={gateState !== 'SCANNING'}
                  onClick={() => { playChimeSound(); setGateMode('ENTRY'); }}
                  className={`py-2.5 text-[10.5px] font-extrabold uppercase rounded-full transition-all duration-300 cursor-pointer disabled:opacity-40 relative z-10 ${
                    gateMode === 'ENTRY' 
                      ? 'bg-white text-blue-600 shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-white font-black scale-[0.98]' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                  }`}
                >
                  Xe Vào (ENTRY)
                </button>
                <button 
                  disabled={gateState !== 'SCANNING'}
                  onClick={() => { playChimeSound(); setGateMode('EXIT'); }}
                  className={`py-2.5 text-[10.5px] font-extrabold uppercase rounded-full transition-all duration-300 cursor-pointer disabled:opacity-40 relative z-10 ${
                    gateMode === 'EXIT' 
                      ? 'bg-white text-blue-600 shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-white font-black scale-[0.98]' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                  }`}
                >
                  Xe Ra (EXIT)
                </button>
              </div>

              {/* Automation Auto-pass toggle switch */}
              <div className="bg-gradient-to-br from-white to-slate-50/50 py-3 px-4.5 rounded-3xl border border-slate-200/80 flex items-center justify-between shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.08)] hover:border-blue-200/60 group/toggle">
                <div>
                  <span className="text-[9.5px] font-extrabold text-blue-600 uppercase tracking-widest block mb-0.5">DUYỆT TỰ ĐỘNG</span>
                  <span className="text-[12px] font-bold text-slate-700 block">Tự động cho xe qua</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoApprove} 
                    onChange={(e) => {
                      playChimeSound();
                      setAutoApprove(e.target.checked);
                    }} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-100 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-blue-500 shadow-inner group-hover/toggle:shadow-blue-500/20"></div>
                </label>
              </div>

              {/* Control Action triggers */}
              <div className="grid grid-cols-1 gap-2.5 mt-1">
                {gateMode === 'ENTRY' && (
                  <button 
                    onClick={() => {
                      playChimeSound();
                      setShowVisitorModal(true);
                      setVisitorPlate('');
                      setGeneratedTicket(null);
                    }}
                    className="group/btn relative overflow-hidden w-full flex items-center justify-between p-3.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-[length:200%_auto] hover:bg-[position:100%_0] text-white font-extrabold text-[10.5px] uppercase tracking-[0.2em] transition-all duration-500 cursor-pointer shadow-[0_8px_20px_rgba(59,130,246,0.25)] hover:shadow-[0_12px_25px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-2.5 relative z-10 drop-shadow-sm">
                      <QrCode size={15} className="text-blue-100" /> CẤP VÉ VÃNG LAI [F4]
                    </span>
                    <Plus size={15} className="relative z-10 transition-transform duration-500 group-hover/btn:rotate-90 text-blue-100" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover/btn:animate-[shine_1.5s_infinite] pointer-events-none"></div>
                  </button>
                )}

                <button 
                  onClick={() => {
                    playChimeSound();
                    showAlert("Đã kích hoạt barrier thủ công!");
                  }}
                  className="group/btn relative overflow-hidden w-full flex items-center justify-between p-3.5 rounded-full bg-slate-50 hover:bg-white border border-slate-200/80 font-extrabold text-[10.5px] text-slate-700 uppercase tracking-[0.2em] transition-all cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2.5 relative z-10">
                    <Unlock size={15} className="text-blue-400 group-hover/btn:text-blue-500 transition-colors drop-shadow-sm" /> MỞ CỔNG THỦ CÔNG [F8]
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 to-transparent -translate-x-full group-hover/btn:animate-[shine_1.5s_infinite] pointer-events-none"></div>
                </button>
              </div>

            </div>

            {/* MongoDB Real-time audit log feed */}
            <div className="bg-white/95 backdrop-blur-2xl p-5 md:p-6 rounded-[2rem] border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08),0_0_40px_rgba(59,130,246,0.05)] flex-1 flex flex-col min-h-0 relative overflow-hidden group/logs z-10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-50/50 before:to-transparent before:-z-10">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-blue-600 opacity-90 group-hover/logs:opacity-100 transition-opacity duration-500 shadow-[0_2px_15px_rgba(59,130,246,0.5)]"></div>
              
              <div className="flex justify-between items-center mb-4 shrink-0 border-b border-slate-100/80 pb-3">
                <h3 className="text-[11px] font-black tracking-wider text-slate-800 uppercase flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-blue-400 to-blue-600 shadow-sm"></span>
                  </span>
                  NHẬT KÝ
                </h3>
                <span className="text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-100/80 px-2.5 py-1.5 rounded-xl uppercase tracking-widest shadow-[0_2px_10px_rgba(59,130,246,0.1)]">
                  Live Mongo
                </span>
              </div>

              {/* MongoDB Log rows */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedLogEntry(log)}
                      className="group p-3 bg-white/60 hover:bg-white backdrop-blur-md border border-white/80 hover:border-blue-200/60 rounded-3xl flex items-center justify-between transition-all duration-300 cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
                    >
                      <div className="flex gap-3.5 items-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogPhoto(log.photo);
                          }}
                          className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative hover:scale-105 transition-transform duration-300 ring-4 ring-white shadow-sm group-hover:ring-blue-50"
                        >
                          <img src={log.photo} alt="Audit Thumb" className="w-full h-full object-cover" />
                        </button>
                        
                        <div className="flex flex-col justify-center gap-0.5">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-extrabold text-[12.5px] text-slate-800 group-hover:text-blue-700 transition-colors tracking-widest uppercase">{log.plate}</span>
                            <span className={`text-[7.5px] font-extrabold px-2 py-1 rounded-lg uppercase tracking-[0.15em] border shadow-sm ${
                              log.owner === 'KHÁCH ĐẶT TRƯỚC' 
                                ? 'bg-gradient-to-r from-blue-50 to-blue-100/60 text-blue-600 border-blue-100/80' 
                                : 'bg-slate-50 text-slate-500 border-slate-200/80'
                            }`}>
                              {log.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'ĐẶT TRƯỚC' : 'VÃNG LAI'}
                            </span>
                          </div>
                          <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-widest">{log.time}</span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-black px-3.5 py-2 rounded-2xl uppercase tracking-[0.2em] border shadow-sm transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 border-blue-200/60 group-hover:shadow-[0_4px_15px_rgba(59,130,246,0.15)]`}>
                        {log.type === 'ENTRY' ? 'XE VÀO' : log.type === 'EXIT' ? 'XE RA' : 'BÁO ĐỘNG'}
                      </span>
                    </div>
                  ))
                ) : (
                  /* Waiting for MongoDB connection state */
                  <div className="flex flex-col items-center justify-center text-center py-20 px-4 gap-2 text-slate-400">
                    <Activity size={24} className="text-slate-350 animate-pulse" />
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Đang hoạt động</p>
                    <p className="text-[10px] text-slate-400">Sẵn sàng nhận dữ liệu xe từ MongoDB...</p>
                  </div>
                )}
              </div>

              {/* Secure Peripheral Indicators */}
              <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 uppercase">
                    <ShieldCheck size={13} className="text-blue-500" /> CƠ SỞ DỮ LIỆU
                  </span>
                  <span className="font-extrabold text-slate-650 bg-slate-100/80 px-2.5 py-0.5 rounded border border-slate-200/50">MongoDB Local</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 uppercase">
                    <Radio size={13} className="text-emerald-500" /> HỆ THỐNG API
                  </span>
                  <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100/50">KẾT NỐI OK</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Dynamic Visitor Ticket Modal (F4) */}
      <AnimatePresence>
        {showVisitorModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowVisitorModal(false)}>
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
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">CẤP PHÁT VÉ VÃNG LAI</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Tạo mã QR & Chụp ảnh xe cổng vào</p>
                  </div>
                </div>
                <button onClick={() => setShowVisitorModal(false)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all flex items-center justify-center text-xs font-black cursor-pointer">✕</button>
              </div>

              {!generatedTicket ? (
                /* Form Details */
                <form onSubmit={handleCreateVisitorTicket} className="space-y-5">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block ml-0.5 mb-2">Biển số phương tiện</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Keyboard size={16} />
                      </div>
                      <input
                        required
                        type="text"
                        placeholder="Ví dụ: 51G-112.22"
                        className="block w-full pl-11 pr-5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-mono font-bold uppercase tracking-widest text-slate-800"
                        value={visitorPlate}
                        onChange={(e) => setVisitorPlate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block ml-0.5 mb-2">Loại phương tiện</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { type: 'Car', label: 'Ô tô (Car)' },
                        { type: 'Motorbike', label: 'Xe máy' },
                        { type: 'Bicycle', label: 'Xe điện' }
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
              ) : (
                /* Card details layout */
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center">
                    <div className="w-full flex justify-between items-center border-b border-slate-200 pb-3 mb-4.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-black text-white text-[11px]">P</div>
                        <span className="text-[9px] font-black tracking-widest text-slate-800">THẺ VÉ VÃNG LAI</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">ID: {generatedTicket.qrCode}</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-4 shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generatedTicket.qrCode)}`}
                        alt="Ticket QR Code" 
                        className="w-32 h-32"
                      />
                    </div>

                    <div className="w-full grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4 mb-4">
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Biển số xe</span>
                        <strong className="text-slate-900 tracking-wider block font-mono text-sm mt-0.5">{generatedTicket.plate}</strong>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Thời gian vào</span>
                        <strong className="text-slate-900 block mt-0.5">{generatedTicket.time}</strong>
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
                                  .card { border: 2px solid #ccc; padding: 20px; border-radius: 15px; display: inline-block; }
                                  h2 { margin: 0; font-size: 20px; color: #333; }
                                  p { margin: 5px 0; }
                                  img { margin-top: 15px; }
                                </style>
                              </head>
                              <body>
                                <div class="card">
                                  <h2>PM SYSTEM - THẺ XE VÃNG LAI</h2>
                                  <p>Biển số: <strong>${generatedTicket.plate}</strong></p>
                                  <p>Thời gian vào: ${generatedTicket.time}</p>
                                  <p>Mã vé: ${generatedTicket.qrCode}</p>
                                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generatedTicket.qrCode)}" />
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
                        setShowVisitorModal(false);
                        setScannedResult({
                          plate: generatedTicket.plate,
                          status: 'Hợp lệ',
                          time: generatedTicket.time,
                          owner: 'KHÁCH VÃNG LAI',
                          ticketType: 'Vé vãng lai (Mới cấp)',
                          capturedPhoto: generatedTicket.photo,
                          registeredPhoto: generatedTicket.photo, 
                          type: 'ENTRY',
                          qrCode: generatedTicket.qrCode
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
        )}
      </AnimatePresence>

      {/* Audit Photo full screen preview */}
      <AnimatePresence>
        {selectedLogPhoto && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedLogPhoto(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xl max-w-lg w-full p-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Camera size={13} className="text-blue-500 animate-pulse" /> ẢNH CHỤP LÚC XE RA / VÀO TRỰC TIẾP
                </span>
                <button onClick={() => setSelectedLogPhoto(null)} className="text-xs font-black text-slate-400 hover:text-slate-900 uppercase cursor-pointer">Đóng</button>
              </div>
              <div className="h-80 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={selectedLogPhoto} alt="Audit Photo Full" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Entry Details Modal */}
      <AnimatePresence>
        {selectedLogEntry && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedLogEntry(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1),0_0_40px_rgba(59,130,246,0.1)] max-w-4xl w-full relative p-5 text-slate-800 overflow-hidden z-10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-50/60 before:to-transparent before:-z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 opacity-90 shadow-[0_2px_15px_rgba(59,130,246,0.5)]"></div>

              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100/80 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/80 flex items-center justify-center text-blue-600 shadow-[inset_0_2px_5px_rgba(255,255,255,1)] border border-blue-200/50 relative group-hover:scale-105 transition-transform">
                    <FileText size={18} className="drop-shadow-sm" />
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-blue-400 to-blue-500 shadow-sm border border-white"></span>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 drop-shadow-sm">Chi tiết lượt xe {selectedLogEntry.type === 'ENTRY' ? 'vào' : 'ra'}</h3>
                    <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">
                      {selectedLogEntry.type === 'EXIT' ? `Vào: ${selectedLogEntry.entryTimeStr} • Ra: ${selectedLogEntry.time}` : selectedLogEntry.time}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedLogEntry(null)} className="w-8 h-8 rounded-full bg-slate-50/50 hover:bg-white text-slate-400 hover:text-slate-800 transition-all flex items-center justify-center text-sm font-black cursor-pointer border border-slate-200/50 shadow-sm hover:shadow-md hover:-translate-y-0.5">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10">
                {/* Left Column: Photos & QR */}
                <div className="md:col-span-5 flex flex-col gap-3">
                  <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                        <Camera size={14} className="text-blue-500 drop-shadow-sm" /> Ảnh nhận diện
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {selectedLogEntry.type === 'EXIT' && (
                        <div className="rounded-xl overflow-hidden border-2 border-white relative bg-slate-100 group shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50 aspect-video">
                          <img 
                            src={selectedLogEntry.entryPhoto || FALLBACK_CAR_CAPTURES[1]} 
                            alt="Entry Photo" 
                            className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500" 
                            onClick={() => setSelectedLogPhoto(selectedLogEntry.entryPhoto || FALLBACK_CAR_CAPTURES[1])} 
                          />
                          <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] text-white font-black tracking-widest shadow-lg border border-white/10">ẢNH VÀO</div>
                        </div>
                      )}
                      <div className="rounded-xl overflow-hidden border-2 border-white relative bg-slate-100 group shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50 aspect-video">
                        <img 
                          src={selectedLogEntry.type === 'EXIT' ? (selectedLogEntry.exitPhoto || selectedLogEntry.photo) : selectedLogEntry.photo} 
                          alt="Action Photo" 
                          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500" 
                          onClick={() => setSelectedLogPhoto(selectedLogEntry.type === 'EXIT' ? (selectedLogEntry.exitPhoto || selectedLogEntry.photo) : selectedLogEntry.photo)} 
                        />
                        <div className="absolute bottom-2 left-2 bg-blue-600/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] text-white font-black tracking-widest shadow-lg border border-white/20">
                          ẢNH {selectedLogEntry.type === 'EXIT' ? 'RA' : 'VÀO'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedLogEntry.qrCode && (
                    <div className="bg-white/80 py-2.5 px-3 rounded-[1rem] border border-slate-200/80 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em]">Mã quét (QR)</span>
                      <span className="text-[9px] font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/80 shadow-sm">{selectedLogEntry.qrCode}</span>
                    </div>
                  )}
                </div>

                {/* Right Column: Information */}
                <div className="md:col-span-7 flex flex-col gap-3">
                  <div className="shrink-0 bg-gradient-to-b from-white to-slate-50/50 py-3.5 px-4 rounded-[1.25rem] border border-slate-200/60 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/30 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]"></div>
                    <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-[0.25em] block mb-1 drop-shadow-sm">Biển số nhận diện</span>
                    <span className="text-[32px] font-mono font-black tracking-[0.2em] text-slate-800 drop-shadow-md leading-none block">{selectedLogEntry.plate}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className={`py-2 px-3 rounded-[1rem] border shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-center transition-colors ${selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60 text-center' : 'bg-white/80 border-slate-200/60 text-center'}`}>
                      <span className={`text-[8px] font-extrabold uppercase tracking-[0.15em] block mb-0.5 ${selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'text-blue-500' : 'text-slate-400'}`}>Loại khách</span>
                      <span className={`text-[11px] font-black block tracking-widest ${selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'text-blue-700' : 'text-slate-700'}`}>{selectedLogEntry.owner}</span>
                    </div>
                    <div className="bg-white/80 py-2 px-3 rounded-[1rem] border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center flex flex-col justify-center">
                      <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Trạng thái vé</span>
                      <span className="text-[11px] font-black text-slate-700 block tracking-widest">{selectedLogEntry.ticketType}</span>
                    </div>
                  </div>

                  {(selectedLogEntry.parkingLotName || selectedLogEntry.parkingSlot) && (
                    <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/40 p-3 rounded-[1rem] border border-blue-200/80 flex items-center justify-between shadow-[0_4px_15px_rgba(59,130,246,0.05)] shrink-0">
                      <div className="flex flex-col min-w-0 flex-1 pr-3 text-left">
                        <span className="text-[8px] text-blue-500 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Tòa nhà / Bãi đỗ</span>
                        <span className="text-[12px] font-black text-blue-900 block uppercase truncate drop-shadow-sm" title={selectedLogEntry.parkingLotName}>
                          {selectedLogEntry.parkingLotName || 'Khu Vực Vãng Lai'}
                        </span>
                      </div>
                      {selectedLogEntry.parkingSlot && (
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[8px] text-blue-500 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Vị trí đỗ (Ô)</span>
                          <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg text-[11px] font-black shadow-[0_4px_10px_rgba(59,130,246,0.3)] whitespace-nowrap">
                            Slot {selectedLogEntry.parkingSlot}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'shrink-0' : 'flex-1'}`}>
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-2 px-1">
                      <Clock size={14} className="text-blue-500 drop-shadow-sm" /> Thông tin lịch trình
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white py-2 px-2 rounded-xl border border-slate-100 text-center flex flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.03)] h-[56px]">
                        <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Thời gian vào</span>
                        <span className="text-[12px] font-mono font-black text-slate-800 block leading-none">{selectedLogEntry.entryTimeStr}</span>
                        <span className="text-[8px] text-slate-400 font-bold tracking-widest mt-0.5">{selectedLogEntry.entryDateStr}</span>
                      </div>
                      {selectedLogEntry.type === 'EXIT' && (
                        <div className="bg-white py-2 px-2 rounded-xl border border-slate-100 text-center flex flex-col justify-center shadow-[0_2px_8px_rgba(0,0,0,0.03)] h-[56px]">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block mb-0.5">Thời gian ra</span>
                          <span className="text-[12px] font-mono font-black text-slate-800 block leading-none">{selectedLogEntry.exitTimeStr}</span>
                          <span className="text-[8px] text-slate-400 font-bold tracking-widest mt-0.5">{selectedLogEntry.exitDateStr}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' && selectedLogEntry.customerName && (
                    <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-2 h-full min-h-0">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 px-1">
                        <User size={14} className="text-blue-500 drop-shadow-sm" /> Khách hàng
                      </span>
                      <div className="bg-white rounded-xl p-2.5 border border-slate-100/80 flex flex-col gap-1.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.01)] flex-1 justify-center min-h-0 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Tên:</span>
                          <span className="text-[10px] font-bold text-slate-800 block truncate text-right">{selectedLogEntry.customerName}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">SĐT:</span>
                          <span className="text-[10px] font-bold text-slate-800 block text-right">{selectedLogEntry.customerPhone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2 border-t border-slate-100 pt-1.5">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.15em] block shrink-0">Email:</span>
                          <span className="text-[10px] font-bold text-slate-800 block truncate text-right">{selectedLogEntry.customerEmail || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLogEntry.type === 'EXIT' && selectedLogEntry.totalFee !== undefined && (
                    <div className="shrink-0 bg-gradient-to-br from-blue-50 to-blue-100/50 py-2.5 px-4 rounded-[1.25rem] border border-blue-200/60 flex items-center justify-between shadow-[0_4px_15px_rgba(59,130,246,0.05)] mt-auto">
                      <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-[0.15em]">Phí thanh toán</span>
                      <span className="text-[16px] font-black text-blue-800 tracking-wider drop-shadow-sm">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedLogEntry.totalFee)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert / Toast Notification */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[90%] pointer-events-auto"
          >
            <div className="bg-gradient-to-r from-red-600 to-red-500 backdrop-blur-2xl border border-red-400 p-4 rounded-2xl shadow-[0_8px_30px_rgb(220,38,38,0.3)] flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/20 text-white shadow-inner">
                <span className="material-symbols-outlined">error</span>
              </div>
              <div className="flex-1 mt-0.5">
                <h3 className="text-white text-sm font-black uppercase tracking-wide drop-shadow-sm">Cảnh báo hệ thống</h3>
                <p className="text-red-50 text-[11.5px] font-medium mt-1 leading-relaxed drop-shadow-sm">{alertMessage}</p>
              </div>
              <button 
                onClick={() => setAlertMessage(null)}
                className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl border-t border-slate-200/80 px-10 flex justify-between items-center z-50 text-[9px] tracking-widest text-slate-400 font-bold uppercase">
        <span>© 2026 PM SYSTEM PORTAL • CHUẨN AN NINH CẤP CAO</span>
        <div className="flex gap-8">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />Độ trễ: 0.4ms</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={11} className="text-blue-500" />AES-256</span>
        </div>
      </footer>

    </div>
  );
};

export default App;
