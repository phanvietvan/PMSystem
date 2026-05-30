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
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasSeenUnread, setHasSeenUnread] = useState(true);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(200);
  const [currentOccupied, setCurrentOccupied] = useState(0);
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
  const [visitorSnapshot, setVisitorSnapshot] = useState<string | null>(null);
  const [visitorPlate, setVisitorPlate] = useState('');
  const [visitorVehicleType, setVisitorVehicleType] = useState('Car');
  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [selectedParkingLot, setSelectedParkingLot] = useState<string>('');
  const [generatedTicket, setGeneratedTicket] = useState<any>(null);
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [extraFees, setExtraFees] = useState<{id: string, name: string, amount: number}[]>([]);
  const [isAddingSurcharge, setIsAddingSurcharge] = useState(false);
  const [surchargeDraft, setSurchargeDraft] = useState({ name: 'Phụ thu khác', amount: '' });
  const [activeTab, setActiveTab] = useState<"home" | "history">(() => {
    return window.location.pathname === '/history' ? 'history' : 'home';
  });

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(window.location.pathname === '/history' ? 'history' : 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tab: "home" | "history") => {
    setActiveTab(tab);
    window.history.pushState({}, '', tab === 'history' ? '/history' : '/');
  };

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

// Global audio context to prevent initialization delay
let globalAudioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
};

  // Audio system synthetics
  const playChimeSound = () => {
    try {
      const ctx = getAudioContext();
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
    confirmPass: () => {},
    captureFrame: (): string | null => null,
    triggerScan: async (customPlateOrQr?: string) => {}
  });

  useEffect(() => {
    handlersRef.current = {
      handleOcrAndScan: () => handleOcrAndScan(),
      confirmPass: () => confirmPass(),
      captureFrame: () => captureFrame(),
      triggerScan: (customPlateOrQr?: string) => triggerScan(customPlateOrQr)
    };
  });

  const playWarningSound = () => {
    try {
      const ctx = getAudioContext();
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
        if (!showVisitorModal) {
          setVisitorSnapshot(handlersRef.current.captureFrame());
        }
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
          setExtraFees([]);
          setIsAddingSurcharge(false);
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

  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/Notifications`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
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
    // using user email or fallback to generic key if no id
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
        console.error("Failed to fetch parking lots", err);
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
          const createdTimeStr = createdDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const createdDateStr = createdDateObj.toLocaleDateString('vi-VN');

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
            createdTimeStr: createdTimeStr,
            createdDateStr: createdDateStr,
            entryTimeStr: timeStr,
            entryDateStr: dateStr,
            exitTimeStr: exitTimeStr,
            exitDateStr: exitDateStr,
            isCheckedIn: session.isCheckedIn,
            type: session.status === 'Cancelled' ? 'CANCELLED' : session.status === 'Completed' ? 'EXIT' : (session.userId && !session.isCheckedIn ? 'PENDING' : 'ENTRY'),
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
        setCurrentOccupied(activeCount);
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
        if (video.readyState < 2 || video.videoWidth === 0) return null; // Ensure video is ready

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.85);
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
    let isProcessing = false;

    const decodeLoop = () => {
      if (!active) return;

      if (gateState === 'SCANNING' && hasCameraAccess && videoRef.current && !isProcessing) {
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
                isProcessing = true;
                console.log("Webcam scanned QR successfully:", code.data);
                handlersRef.current.triggerScan(code.data);
                // Allow scanning again after 1.5 seconds if state didn't change
                setTimeout(() => { isProcessing = false; }, 1500);
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
    const livePhoto = visitorSnapshot || captureFrame() || FALLBACK_CAR_CAPTURES[Math.floor(Math.random() * FALLBACK_CAR_CAPTURES.length)];

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
        body: JSON.stringify(apiPayload)
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedTicket({
          qrCode: data.qrCode,
          plate: data.licensePlate,
          time: new Date(data.entryTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
          photo: data.entryPhoto || livePhoto,
          vehicleType: data.vehicleType,
          parkingLotName: data.parkingLotName || apiPayload.ParkingLotName
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
        vehicleType: visitorVehicleType,
        parkingLotName: apiPayload.ParkingLotName
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
              showAlert("⚠️ LỘN CỔNG! Vé vãng lai này đã được cấp để gửi xe. Vui lòng sang MÀN HÌNH LỐI RA (EXIT) để quét mã thanh toán!");
              return;
            }

            if (session.isCheckedIn) {
              playWarningSound();
              showAlert("⚠️ XE ĐÃ TRONG BÃI! Khách đặt trước này đã quét mã vào cổng rồi. Vui lòng sang MÀN HÌNH LỐI RA (EXIT) để quét ra ngoài!");
              return;
            }

            // KIỂM TRA TÒA KHÁCH ĐẶT VS TÒA NHÂN VIÊN ĐANG TRỰC
            if (selectedParkingLot && session.parkingLotName && session.parkingLotName !== selectedParkingLot) {
              playWarningSound();
              showAlert(`⚠️ LỘN TÒA! Khách hàng đặt chỗ tại [${session.parkingLotName}], nhưng đây là cổng của [${selectedParkingLot}]. Yêu cầu khách di chuyển sang đúng tòa!`);
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
        parkingLotName: parkingLotName,
        depositFee: depositFee
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
              computedFee = data.fee || 0;
              depositFee = data.prepaidAmount || 0;
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
        parkingLotName: parkingLotName,
        depositFee: depositFee
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
              parkingLotName: selectedParkingLot || 'Khu Vực A (Vãng lai)',
              ParkingLotName: selectedParkingLot || 'Khu Vực A (Vãng lai)',
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
            vehicleType: session.vehicleType || 'Car',
            parkingLotName: session.parkingLotName || selectedParkingLot || 'Khu Vực A'
          });
          setGateState('GATE_OPEN');
        } else {
          try {
            const errData = await res.json();
            setAlertMessage(errData.message || "Lỗi xác thực QR code. Vui lòng kiểm tra lại.");
          } catch {
            setAlertMessage("Lỗi xác thực từ máy chủ!");
          }
          setTimeout(() => setAlertMessage(null), 3000);
        }
      } catch (err) {
        console.warn("Database check-in / gate-scan failed:", err);
        setAlertMessage("Lỗi kết nối đến máy chủ.");
        setTimeout(() => setAlertMessage(null), 3000);
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
            ExitPhoto: scannedResult.capturedPhoto,
            extraFees: extraFees.map(f => ({ name: f.name, amount: f.amount })),
            ExtraFees: extraFees.map(f => ({ Name: f.name, Amount: f.amount }))
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
            <button onClick={() => navigateTo("home")} className={`text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative ${activeTab === "home" ? "text-blue-600" : "text-slate-500 hover:text-blue-600"} cursor-pointer`}>
              Trang chủ
              {activeTab === "home" && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600" />}
            </button>
            <button onClick={() => navigateTo("history")} className={`text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative ${activeTab === "history" ? "text-blue-600" : "text-slate-500 hover:text-blue-600"} cursor-pointer`}>
              Lịch sử
              {activeTab === "history" && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600" />}
            </button>
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
                onClick={handleOpenNotif}
                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50/80 text-slate-500 hover:text-blue-600 rounded-full transition-all duration-300 ease-out border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_15px_rgba(37,99,235,0.12)] hover:-translate-y-0.5 relative group active:scale-95"
              >
                <Bell size={18} className="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-12 group-hover:scale-110 group-active:rotate-0" />
                {unreadCount > 0 && !hasSeenUnread && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white transition-transform duration-300 group-hover:scale-125"></span>
                )}
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
                    {currentUser.avatarUrl && currentUser.avatarUrl !== 'null' && currentUser.avatarUrl !== 'undefined' ? (
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=DBEAFE&color=2563EB`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
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
      {activeTab === "home" ? (
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-5 h-full">
          
          {/* COLUMN 1: LEFT AREA (Main Camera & Split Comparison) */}
          <div className="col-span-12 lg:col-span-9 flex flex-col gap-5 h-full overflow-hidden">
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
                    <div className="flex items-center gap-2 bg-white/50 backdrop-blur-xl border border-white/70 px-4 py-2 rounded-full shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">LIVE FEED • CAMERA LỐI SOÁT</span>
                    </div>
                    <div className={`px-4 py-2 rounded-full backdrop-blur-xl border-none shadow-sm ${
                      gateMode === 'ENTRY'
                        ? 'bg-blue-600/90 text-white'
                        : 'bg-amber-600/90 text-white'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wide">{gateMode === 'ENTRY' ? 'CỔNG VÀO (ENTRY)' : 'CỔNG RA (EXIT)'}</span>
                    </div>
                  </div>

                  {/* Scanner Box + Bottom Overlay */}
                  <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                    {/* Scanner frame */}
                    <div className="relative w-80 h-56 cursor-pointer flex flex-col items-center justify-center" onClick={() => handleOcrAndScan()} style={{ boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.2)' }}>
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl animate-[pulse-border_2s_ease-in-out_infinite]" />
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl animate-[pulse-border_2s_ease-in-out_infinite]" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl animate-[pulse-border_2s_ease-in-out_infinite]" />
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-3xl animate-[pulse-border_2s_ease-in-out_infinite]" />
                      <span className="material-symbols-outlined text-6xl text-blue-500/40 mb-3">qr_code_scanner</span>
                      <span className="text-sm font-extrabold text-white drop-shadow-md text-center uppercase tracking-widest leading-relaxed">ĐƯA MÃ QR VÀO<br/>KHUNG QUÉT</span>
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)] scanner-line !animate-[scan_3s_ease-in-out_infinite]" />
                    </div>
                  </div>

                  {/* Bottom gradient overlay with status text */}
                  <div className="absolute bottom-0 w-full z-10 flex flex-col items-center justify-end bg-gradient-to-t from-black/60 to-transparent pt-24 pb-24 pointer-events-none">
                    <h2 className="text-white text-xl font-bold tracking-wide mb-1.5">ĐANG CHỜ MÃ QR</h2>
                    <p className="text-white/80 text-xs font-medium">ĐƯA MÃ QR CỦA KHÁCH HÀNG VÀO TRƯỚC CAMERA SOÁT VÉ</p>
                    <p className="text-[10px] text-white/50 font-medium mt-1">(Hoặc nhập mã QR thủ công ở thanh công cụ bên dưới)</p>
                  </div>
 
                  {/* Manual Input Bar - Glass Pill */}
                  <div className="absolute bottom-4 left-4 right-4 z-30 bg-white/75 backdrop-blur-2xl border border-white/90 rounded-full p-2 flex items-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)]">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (manualInput.trim()) {
                          const input = manualInput.trim().toUpperCase();
                          setManualInput('');
                          triggerScan(input);
                        }
                      }}
                      className="flex-1 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-slate-400 ml-3 text-[20px]">keyboard</span>
                      <input 
                        className="bg-transparent border-none w-full text-slate-800 font-semibold text-sm placeholder:text-slate-400 tracking-wide outline-none px-2" 
                        placeholder="NHẬP MÃ QR CỦA XE (VÍ DỤ: QR_...)..." 
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                      />
                    </form>
                    <button 
                      onClick={() => handleOcrAndScan()}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      XÁC THỰC MÃ QR
                    </button>
                  </div>
                </div>
              )}

              {gateState === 'COMPARING' && scannedResult && (
                /* Stage 2: Dual image split comparison and countdown */
                <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-3xl text-slate-800 animate-scale-up relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-50/80 before:via-white/50 before:to-transparent before:-z-10 z-10 overflow-hidden">
                  
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



                  {scannedResult.type === 'ENTRY' ? (
                    // ENTRY CONFIRMATION PANEL
                    <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch relative z-10 bg-transparent min-h-0">
                      {/* Left: Captured camera photo */}
                      <div className="md:col-span-5 flex flex-col gap-4 min-h-0">
                        <div className="bg-white/60 border border-slate-200/80 rounded-[1rem] p-3 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-fit">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                              <Camera size={14} className="text-blue-500 drop-shadow-sm" /> Ảnh Nhận Diện
                            </span>
                          </div>
                          <div className="rounded-xl overflow-hidden border-2 border-white relative bg-slate-100 group shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50 aspect-video w-full">
                            <img src={scannedResult.capturedPhoto} alt="Gate Capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute bottom-2 left-2 bg-blue-600/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] text-white font-black tracking-widest shadow-lg border border-white/20">CAMERA VÀO</div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Editable Plate + Info */}
                      <div className="md:col-span-7 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 h-full min-h-0">
                        <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-slate-100 shrink-0 relative overflow-hidden flex flex-col gap-8">
                          
                          {/* 1. Biển số xe & Trạng thái */}
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-1">
                              <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">pin</span>
                                Biển số nhận diện
                              </span>
                              <div className="flex gap-2">
                                <span className="bg-blue-50 text-blue-600 px-3.5 py-1.5 rounded-full text-[10px] uppercase font-bold border border-blue-100/50 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
                                  {scannedResult.ticketType.split(' • ')[0]}
                                </span>
                                {(scannedResult.depositFee > 0 || scannedResult.ticketType.includes('Đặt trước')) && (
                                  <span className="bg-emerald-50 text-emerald-600 px-3.5 py-1.5 rounded-full text-[10px] uppercase font-bold border border-emerald-100/50 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px]">payments</span>
                                    Đã cọc: {(scannedResult.depositFee || 0).toLocaleString()} VNĐ
                                  </span>
                                )}
                              </div>
                            </label>
                            <div className="relative">
                              <input 
                                type="text" 
                                className="w-full text-center text-4xl font-black tracking-[0.1em] text-slate-800 bg-white border border-slate-200/80 rounded-[2.5rem] py-4 px-6 focus:ring-4 focus:ring-blue-100/50 focus:border-blue-300 transition-all outline-none"
                                value={scannedResult.plate}
                                onChange={(e) => setScannedResult({ ...scannedResult, plate: e.target.value.toUpperCase() })}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 opacity-60 hover:opacity-100 cursor-pointer transition-opacity bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full border border-slate-100">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </div>
                            </div>
                          </div>

                          {/* 1.5 Chọn bãi đỗ cho xe vãng lai (không có đặt trước) */}
                          {(!scannedResult.reservationDate && !scannedResult.parkingLotName) && (
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                <span className="material-symbols-outlined text-[14px]">location_city</span>
                                Tòa / Khu vực (Bãi đỗ)
                              </label>
                              <div className="relative">
                                <select
                                  className="w-full text-sm font-bold tracking-wider text-slate-700 bg-slate-50 border border-slate-200/80 rounded-[2rem] py-3.5 px-5 focus:ring-4 focus:ring-blue-100/50 focus:border-blue-300 transition-all outline-none appearance-none cursor-pointer"
                                  value={selectedParkingLot}
                                  onChange={(e) => setSelectedParkingLot(e.target.value)}
                                >
                                  {parkingLots.map((lot, idx) => (
                                    <option key={idx} value={lot.name}>
                                      {lot.name} {lot.capacity ? `(Sức chứa: ${lot.capacity})` : ''}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                  <span className="material-symbols-outlined">expand_more</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. Thông tin đặt chỗ */}
                          {(scannedResult.reservationDate || scannedResult.parkingSlot || scannedResult.parkingLotName) && (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[14px]">info</span>
                                  Thông tin đặt chỗ
                                </h3>
                              </div>
                              <div className="grid grid-cols-2 gap-5">
                                {scannedResult.reservationDate && (
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ngày đặt</label>
                                    <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-[2rem] px-5 py-3">
                                      <span className="material-symbols-outlined text-slate-400 text-[18px]">event</span>
                                      <span className="text-sm font-semibold text-slate-700">{new Date(scannedResult.reservationDate).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                  </div>
                                )}
                                {scannedResult.reservationStartTime && (
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giờ đặt</label>
                                    <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-[2rem] px-5 py-3">
                                      <span className="material-symbols-outlined text-slate-400 text-[18px]">schedule</span>
                                      <span className="text-sm font-semibold text-slate-700">{scannedResult.reservationStartTime}</span>
                                    </div>
                                  </div>
                                )}
                                {scannedResult.parkingLotName && (
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tòa / Khu</label>
                                    <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-[2rem] px-5 py-3">
                                      <span className="material-symbols-outlined text-slate-400 text-[18px]">apartment</span>
                                      <span className="text-sm font-semibold text-slate-700 truncate">{scannedResult.parkingLotName}</span>
                                    </div>
                                  </div>
                                )}
                                {scannedResult.parkingSlot && (
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ô đậu</label>
                                    <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-[2rem] px-5 py-3">
                                      <span className="material-symbols-outlined text-slate-400 text-[18px]">local_parking</span>
                                      <span className="text-sm font-semibold text-slate-700">{scannedResult.parkingSlot}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 3. Chủ xe */}
                          {scannedResult.userInfo && (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[14px]">person</span>
                                  Chủ xe
                                </h3>
                              </div>
                              <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Họ & Tên</label>
                                  <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-[2rem] px-5 py-3">
                                    <div className="flex items-center gap-3">
                                      <span className="material-symbols-outlined text-slate-400 text-[20px]">account_circle</span>
                                      <span className="text-sm font-bold text-slate-700">{`${scannedResult.userInfo.lastName || scannedResult.userInfo.LastName || ''} ${scannedResult.userInfo.firstName || scannedResult.userInfo.FirstName || ''}`.trim() || scannedResult.userInfo.username || scannedResult.userInfo.Username || 'N/A'}</span>
                                    </div>
                                    <span className="bg-blue-50 text-blue-600 px-3.5 py-1 rounded-full text-[9px] font-bold border border-blue-100/50">
                                      Khách hàng
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                                    <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-[2rem] px-5 py-3">
                                      <span className="material-symbols-outlined text-slate-400 text-[18px]">call</span>
                                      <span className="text-sm font-semibold text-slate-700 truncate">{scannedResult.userInfo.phoneNumber || scannedResult.userInfo.PhoneNumber || 'N/A'}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                    <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-[2rem] px-5 py-3">
                                      <span className="material-symbols-outlined text-slate-400 text-[18px]">mail</span>
                                      <span className="text-sm font-semibold text-slate-700 truncate">{scannedResult.userInfo.email || scannedResult.userInfo.Email || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                        </div>
                      </div>
                    </div>
                  ) : (
                    // EXIT COMPARISON PANEL
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 relative z-10 bg-transparent min-h-0 overflow-y-auto custom-scrollbar">
                      {/* Left: Photos */}
                      <section className="lg:col-span-5 flex flex-col gap-4 min-h-0">
                        {/* Current Photo */}
                        <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-[1.75rem] overflow-hidden flex flex-col shadow-[0_12px_40px_-12px_rgba(0,0,0,0.04)] shrink-0">
                          <div className="px-4 py-2.5 bg-white/40 flex justify-between items-center border-b border-white/60">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-blue-600 text-[18px]">videocam</span>
                              <h3 className="text-[10px] font-bold tracking-widest text-slate-700 uppercase">Ảnh hiện tại</h3>
                            </div>
                            <span className="flex items-center gap-1.5 text-red-500 text-[9px] font-bold uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full border border-red-100/50">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                              Live
                            </span>
                          </div>
                          <div className="relative group aspect-video w-full bg-slate-100">
                            <img src={scannedResult.capturedPhoto} alt="Gate Capture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute bottom-3 left-3 bg-white/50 backdrop-blur-md border border-white/70 px-3 py-1 rounded-xl text-[9px] text-slate-800 font-semibold tracking-widest shadow-sm">GATE-OUT</div>
                          </div>
                        </div>
                        {/* Entry Photo */}
                        <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-[1.75rem] overflow-hidden flex flex-col shadow-[0_12px_40px_-12px_rgba(0,0,0,0.04)] shrink-0">
                          <div className="px-4 py-2.5 bg-white/40 flex justify-between items-center border-b border-white/60">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-slate-400 text-[18px]">history</span>
                              <h3 className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">Ảnh lúc vào</h3>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wide">{scannedResult.entryTime || ''}</span>
                          </div>
                          <div className="relative group aspect-video w-full bg-slate-100">
                            {scannedResult.registeredPhoto ? (
                              <img src={scannedResult.registeredPhoto} alt="Entry Capture" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-1.5 p-4 text-center">
                                <span className="material-symbols-outlined text-[32px] text-slate-300">image_not_supported</span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">ẢNH VÀO LỖI</span>
                              </div>
                            )}
                            <div className="absolute bottom-3 left-3 bg-slate-800/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-xl text-[9px] text-white font-medium tracking-widest">GATE-IN</div>
                          </div>
                        </div>
                      </section>

                      {/* Right: Details */}
                      <div className="md:col-span-7 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 h-full min-h-0">
                        <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-slate-100 shrink-0 relative overflow-hidden flex flex-col gap-8">
                          
                          {/* 1. Header & Biển số xe */}
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h2 className="text-base font-bold text-slate-800 tracking-wide uppercase">Đối chiếu thông tin xe</h2>
                                <p className="text-[10px] font-medium text-slate-500">Xác thực khớp hình dạng xe & biển số hệ thống</p>
                              </div>
                              <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-sm ${
                                (scannedResult.plate || '').replace(/[^A-Z0-9]/g, "") === (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, "")
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                                  : 'bg-rose-50 text-rose-600 border-rose-100/50'
                              }`}>
                                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  {(scannedResult.plate || '').replace(/[^A-Z0-9]/g, "") === (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, "") ? 'check_circle' : 'cancel'}
                                </span>
                                <span className="font-bold text-[10px] uppercase tracking-widest">
                                  {(scannedResult.plate || '').replace(/[^A-Z0-9]/g, "") === (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, "") ? 'Trùng khớp' : 'Không khớp'}
                                </span>
                              </div>
                            </div>
                            
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1 mt-2">
                              <span className="material-symbols-outlined text-[14px]">pin</span>
                              Biển số xe ra (có thể sửa)
                            </label>
                            <div className="relative">
                              <input 
                                type="text" 
                                className="w-full text-center text-4xl font-black tracking-[0.1em] text-slate-800 bg-white border border-slate-200/80 rounded-[2.5rem] py-4 px-6 focus:ring-4 focus:ring-blue-100/50 focus:border-blue-300 transition-all outline-none"
                                value={scannedResult.exitPlate || ''}
                                onChange={(e) => setScannedResult({ ...scannedResult, exitPlate: e.target.value.toUpperCase() })}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 opacity-60 hover:opacity-100 cursor-pointer transition-opacity bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full border border-slate-100">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-5 mt-1">
                            {/* Thông tin gửi xe */}
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                                  Thông tin gửi xe
                                </h3>
                              </div>
                              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Biển số vào</label>
                                  <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                                    <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">pin</span>
                                    <span className="text-[12px] font-bold text-slate-700 tracking-wider">{scannedResult.plate || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giờ vào</label>
                                  <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                                    <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">login</span>
                                    <span className="text-[12px] font-semibold text-slate-700">{scannedResult.entryTime?.split(' ')[0] || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giờ ra</label>
                                  <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                                    <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">logout</span>
                                    <span className="text-[12px] font-semibold text-slate-700">{scannedResult.time?.split(' ')[0] || 'N/A'}</span>
                                  </div>
                                </div>
                                {scannedResult.parkingLotName && (
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tòa / Khu</label>
                                    <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                                      <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">apartment</span>
                                      <span className="text-[12px] font-semibold text-slate-700">{scannedResult.parkingLotName}</span>
                                    </div>
                                  </div>
                                )}
                                {scannedResult.parkingSlot && (
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ô đậu</label>
                                    <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                                      <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">local_parking</span>
                                      <span className="text-[12px] font-semibold text-slate-700">{scannedResult.parkingSlot}</span>
                                    </div>
                                  </div>
                                )}
                                {scannedResult.reservationDate && (
                                  <>
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ngày đặt</label>
                                      <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                                        <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">event</span>
                                        <span className="text-[12px] font-semibold text-slate-700">{new Date(scannedResult.reservationDate).toLocaleDateString('vi-VN')}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giờ đặt</label>
                                      <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                                        <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">schedule</span>
                                        <span className="text-[12px] font-semibold text-slate-700">{scannedResult.reservationStartTime}</span>
                                      </div>
                                    </div>
                                  </>
                                )}
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mã vé</label>
                                  <div className="flex items-center gap-2 bg-slate-50/50 border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                                    <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">qr_code</span>
                                    <span className="text-[11px] font-bold text-slate-600 font-mono tracking-wider break-all">{scannedResult.qrCode}</span>
                                  </div>
                                </div>
                              </div>
                            </div>


                            {/* Chủ xe */}
                            {scannedResult.userInfo && (
                              <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between mb-0.5">
                                  <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">person</span>
                                    Chủ xe
                                  </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Họ & Tên</label>
                                    <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="material-symbols-outlined text-slate-400 text-[18px] shrink-0">account_circle</span>
                                        <span className="text-[12px] font-bold text-slate-700">{`${scannedResult.userInfo.lastName || scannedResult.userInfo.LastName || ''} ${scannedResult.userInfo.firstName || scannedResult.userInfo.FirstName || ''}`.trim() || scannedResult.userInfo.username || scannedResult.userInfo.Username || 'N/A'}</span>
                                      </div>
                                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-slate-200/80 shrink-0 ml-1.5 hidden sm:inline-block">
                                        Khách
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                                    <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                                      <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">call</span>
                                      <span className="text-[12px] font-semibold text-slate-700">{scannedResult.userInfo.phoneNumber || scannedResult.userInfo.PhoneNumber || 'N/A'}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1 md:col-span-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                    <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-[1.25rem] px-3.5 py-2 min-w-0">
                                      <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">mail</span>
                                      <span className="text-[12px] font-semibold text-slate-700">{scannedResult.userInfo.email || scannedResult.userInfo.Email || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unified Decision Actions Block */}
                  <div className="px-6 pb-5 pt-3 bg-white/30 border-t border-white/50">
                    <div className="flex gap-4">
                      <button 
                        onClick={denyPass}
                        className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 py-3.5 px-6 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all duration-300 font-bold text-[11px] tracking-wider shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">report</span>
                        {isTouchDevice ? 'TỪ CHỐI / BÁO ĐỘNG' : '[ESC] TỪ CHỐI / BÁO ĐỘNG'}
                      </button>

                      {scannedResult.type === 'ENTRY' && (
                        <button 
                          onClick={confirmPass}
                          className="flex-[2] bg-blue-600 text-white hover:bg-blue-700 py-3.5 px-6 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all duration-300 font-bold text-[11px] tracking-wider shadow-[0_8px_24px_-6px_rgba(37,99,235,0.35)] hover:shadow-[0_12px_28px_-6px_rgba(37,99,235,0.45)] transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          {isTouchDevice ? 'XÁC NHẬN CẤP VÉ' : '[F8] XÁC NHẬN CẤP VÉ'}
                        </button>
                      )}
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
                              <span className="text-xs font-bold text-emerald-600 mt-0.5 block uppercase">Cổng Vào chính</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">TÒA NHÀ / BÃI ĐỖ</span>
                              <span className="text-sm font-black text-emerald-600 mt-0.5 block uppercase truncate">{generatedTicket.parkingLotName || 'Khu Vực A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <button 
                            onClick={async () => {
                              playChimeSound();
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
                      
                      <button 
                        onClick={() => {
                          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            const nowStr = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
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
              )}

            </div>
          </div>

          {/* COLUMN 2: RIGHT AREA (Control Configurations & Real-time Live MongoDB Feed) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-5 h-full overflow-hidden">
            
            {/* Operator Control configurations */}
            <div className="bg-white/75 backdrop-blur-2xl p-6 rounded-[1.5rem] border border-white/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col gap-5 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">CẤU HÌNH CỔNG</span>
                </div>
                <div className="bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/50">
                  <span className="text-[10px] font-bold text-blue-600">SỨC CHỨA: {currentOccupied}/{maxCapacity}</span>
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
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none flex items-center">
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Segmented Gate Mode switcher */}
              <div className="flex bg-slate-100/80 rounded-full p-1 border border-slate-200/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] relative">
                <button 
                  disabled={gateState !== 'SCANNING'}
                  onClick={() => { playChimeSound(); setGateMode('ENTRY'); }}
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
                  onClick={() => { playChimeSound(); setGateMode('EXIT'); }}
                  className={`flex-1 py-2 text-[11px] font-bold uppercase rounded-full transition-all duration-300 cursor-pointer disabled:opacity-40 relative z-10 text-center ${
                    gateMode === 'EXIT' 
                      ? 'bg-white text-blue-600 shadow-sm border border-white' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                  }`}
                >
                  XE RA (EXIT)
                </button>
              </div>

              {/* Automation Auto-pass toggle switch */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-800 uppercase">DUYỆT TỰ ĐỘNG</span>
                  <span className="text-[11px] text-slate-500">Tự động cho xe qua</span>
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
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Control Action triggers */}
              {gateMode === 'ENTRY' && (
                <button 
                  onClick={() => {
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

              <button 
                onClick={() => {
                  playChimeSound();
                  showAlert("Đã kích hoạt barrier thủ công!");
                }}
                className={`w-full bg-white/50 border border-white/80 text-slate-800 rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-white/80 transition-colors active:scale-95 cursor-pointer ${gateMode === 'ENTRY' ? 'mt-[-10px]' : 'mt-2'}`}
              >
                <span className="material-symbols-outlined text-sm">lock_open</span>
                <span className="text-[11px] font-bold uppercase">MỞ CỔNG THỦ CÔNG [F8]</span>
              </button>

            </div>
            {/* Billing / Fee Calculation Panel */}
            <div className="bg-white/75 backdrop-blur-2xl p-6 rounded-[1.5rem] border border-white/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col gap-5 relative z-10 flex-1">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">THÔNG TIN THU PHÍ</span>
                </div>
                {gateMode === 'EXIT' && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">CHỜ THANH TOÁN</span>}
              </div>

              {gateMode === 'ENTRY' ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">payments</span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Không thu phí tại<br/>chiều vào</p>
                </div>
              ) : (
                gateState === 'COMPARING' && scannedResult ? (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tổng phí</span>
                        <span className="text-sm font-black text-slate-700">{(scannedResult.fee || 0).toLocaleString()} ₫</span>
                      </div>
                      <div className="flex justify-between items-center bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                        <span className="text-xs font-bold text-amber-600/80 uppercase tracking-widest">Đã cọc (App)</span>
                        <span className="text-sm font-black text-amber-600">-{(scannedResult.depositFee || 0).toLocaleString()} ₫</span>
                      </div>
                      
                      {extraFees.map((fee) => (
                        <div key={fee.id} className="flex justify-between items-center bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                          <span className="text-xs font-bold text-indigo-600/80 uppercase tracking-widest max-w-[120px] truncate" title={fee.name}>{fee.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-indigo-600">+{fee.amount.toLocaleString()} ₫</span>
                            <button onClick={() => setExtraFees(extraFees.filter(f => f.id !== fee.id))} className="text-indigo-300 hover:text-rose-500 transition-colors cursor-pointer flex items-center justify-center">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {isAddingSurcharge ? (
                        <div className="bg-white p-3 rounded-[1rem] border border-slate-200 shadow-sm flex flex-col gap-2 mt-2">
                          <input 
                            type="text" 
                            className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:bg-white transition-colors"
                            placeholder="Tên phụ thu (VD: Quá giờ)"
                            value={surchargeDraft.name}
                            onChange={(e) => setSurchargeDraft({...surchargeDraft, name: e.target.value})}
                          />
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              className="flex-1 w-0 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:bg-white transition-colors"
                              placeholder="Số tiền (VNĐ)"
                              value={surchargeDraft.amount}
                              onChange={(e) => setSurchargeDraft({...surchargeDraft, amount: e.target.value})}
                            />
                            <button 
                              onClick={() => {
                                const amt = parseInt(surchargeDraft.amount) || 0;
                                if (amt > 0) {
                                  setExtraFees([...extraFees, { id: Math.random().toString(), name: surchargeDraft.name || 'Phụ thu khác', amount: amt }]);
                                  setIsAddingSurcharge(false);
                                  setSurchargeDraft({ name: 'Phụ thu khác', amount: '' });
                                } else {
                                  setIsAddingSurcharge(false);
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                            >
                              Lưu
                            </button>
                            <button 
                              onClick={() => setIsAddingSurcharge(false)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsAddingSurcharge(true)}
                          className="w-full flex items-center justify-center gap-1.5 bg-slate-50/50 hover:bg-slate-100 text-blue-600 p-2.5 rounded-xl border border-dashed border-slate-200 transition-colors text-[10px] font-black tracking-widest uppercase cursor-pointer mt-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          THÊM PHỤ THU
                        </button>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                      {(() => {
                        const extraFeesTotal = extraFees.reduce((sum, f) => sum + f.amount, 0);
                        const netPayable = Math.max(0, (scannedResult.fee || 0) - (scannedResult.depositFee || 0) + extraFeesTotal);
                        return (
                          <>
                            <div className="flex justify-between items-end mb-4">
                              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Cần thanh toán</span>
                              <span className={`text-3xl font-black tracking-tighter ${netPayable === 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                                {netPayable.toLocaleString()} <span className="text-lg">₫</span>
                              </span>
                            </div>
                            
                            <button 
                              onClick={() => {
                                playChimeSound();
                                confirmPass();
                              }}
                              className={`w-full text-white rounded-xl py-4 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer font-bold uppercase text-sm tracking-wider ${netPayable === 0 ? 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]' : 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_20px_-5px_rgba(225,29,72,0.4)]'}`}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {netPayable === 0 ? 'check_circle' : 'price_check'}
                              </span>
                              {netPayable === 0 ? 'Đã Thanh Toán & Mở Cổng' : 'Đã Thu Tiền & Mở Cổng'}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">qr_code_scanner</span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Đang chờ quét<br/>xe ra...</p>
                  </div>
                )
              )}
            </div>

            
          </div>

        </div>
      </main>
      ) : (
        <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8 overflow-hidden flex flex-col animate-fade-in">
            <div className="bg-white/75 backdrop-blur-2xl rounded-[1.5rem] border border-white/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden h-[85vh]">
              <div className="p-5 border-b border-slate-200/30 flex justify-between items-center shrink-0 bg-white/50">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">LỊCH SỬ</span>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-600/10 px-2 py-1 rounded-md">LIVE MONGO</span>
              </div>

              {/* MongoDB Log rows */}
              <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 custom-scrollbar">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedLogEntry(log)}
                      className="bg-white/60 p-4 rounded-[1.25rem] flex flex-col md:flex-row items-start md:items-center gap-5 border border-white/80 hover:bg-white transition-all cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] group"
                    >
                      {/* 1. Photo & Plate */}
                      <div className="flex items-center gap-4 w-full md:w-[280px] shrink-0">
                        <div 
                          className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner ring-1 ring-slate-200/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogPhoto(log.photo);
                          }}
                        >
                          <img src={log.photo} alt="Thumb" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <span className="material-symbols-outlined text-white text-[20px]">zoom_in</span>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-slate-800 tracking-wide uppercase">{log.plate}</span>
                            {log.type === 'ENTRY' ? (
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Đang trong bãi"></span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-300" title="Đã ra khỏi bãi"></span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                              log.owner === 'KHÁCH ĐẶT TRƯỚC' 
                                ? 'bg-blue-100/50 text-blue-600 border border-blue-200/50' 
                                : 'bg-slate-200/50 text-slate-500 border border-slate-300/50'
                            }`}>
                              {log.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'ĐẶT TRƯỚC' : 'VÃNG LAI'}
                            </span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${
                              log.type === 'ENTRY' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' : 
                              log.type === 'EXIT' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
                              log.type === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200/50' :
                              log.type === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-200/50' :
                              'bg-red-50 text-red-600 border-red-200'
                            }`}>
                              {log.type === 'ENTRY' ? 'XE VÀO' : 
                               log.type === 'EXIT' ? 'XE RA' : 
                               log.type === 'PENDING' ? 'CHƯA VÀO' : 
                               log.type === 'CANCELLED' ? 'ĐÃ HỦY' : 'BÁO ĐỘNG'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Customer Info */}
                      <div className="flex flex-col gap-1 w-full md:w-[220px] shrink-0 border-l border-slate-100 pl-5">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">{log.customerName || 'KHÁCH VÃNG LAI'}</span>
                        </div>
                        {log.customerPhone && (
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                            <span className="text-[11px] font-semibold text-slate-500">{log.customerPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="material-symbols-outlined text-[14px] text-blue-400">pin_drop</span>
                          <span className="text-[10px] font-bold text-blue-600 truncate">{log.parkingLotName || 'Khu Vực Chung'} • Slot {log.parkingSlot || '--'}</span>
                        </div>
                      </div>

                      {/* 3. Time Info */}
                      <div className="flex flex-col gap-2 w-full md:flex-1 border-l border-slate-100 pl-5">
                        {/* THỜI GIAN ĐẶT CHỖ (Only for reservations) */}
                        {log.owner === 'KHÁCH ĐẶT TRƯỚC' && (
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                THỜI GIAN ĐẶT
                              </span>
                              <div className="flex items-center gap-1.5 text-blue-600">
                                <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                <span className="text-xs font-bold">{log.createdTimeStr}</span>
                                <span className="text-[10px] text-blue-400">{log.createdDateStr}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                              THỜI GIAN VÀO
                            </span>
                            {log.isCheckedIn || log.owner === 'KHÁCH VÃNG LAI' ? (
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <span className="material-symbols-outlined text-[14px] text-emerald-500">login</span>
                                <span className="text-xs font-bold">{log.entryTimeStr}</span>
                                <span className="text-[10px] text-slate-500">{log.entryDateStr}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                                <span className="text-[10px] font-semibold italic">Chưa vào bãi</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">THỜI GIAN RA</span>
                            {log.exitTimeStr ? (
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <span className="material-symbols-outlined text-[14px] text-rose-500">logout</span>
                                <span className="text-xs font-bold">{log.exitTimeStr}</span>
                                <span className="text-[10px] text-slate-500">{log.exitDateStr}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                                <span className="text-[10px] font-semibold italic">Chưa ra bãi</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 4. Action / Status */}
                      <div className="flex flex-col items-end gap-2 shrink-0 border-l border-slate-100 pl-5 min-w-[120px]">
                        {log.totalFee != null ? (
                          <>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TỔNG PHÍ</span>
                            <span className="text-sm font-black text-amber-600">{(log.totalFee).toLocaleString()} ₫</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TRẠNG THÁI</span>
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">{log.ticketType}</span>
                          </>
                        )}
                      </div>
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

              {/* Footer Status */}
              <div className="p-3 border-t border-slate-200/30 bg-white/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-blue-600">cloud_done</span>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">HỆ THỐNG API</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">KẾT NỐI OK</span>
              </div>
            </div>
        </main>
      )}

      
      

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
                <>
                  {visitorSnapshot && (
                    <div className="mb-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Ảnh thu nhận (Tự động chụp khi bấm F4)</label>
                      <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={visitorSnapshot} alt="Snapshot" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                <form onSubmit={handleCreateVisitorTicket} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block ml-0.5 mb-2">Biển số phương tiện</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <Keyboard size={16} />
                        </div>
                        <input
                          required
                          type="text"
                          placeholder="51G-112.22"
                          className="block w-full pl-11 pr-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-mono font-bold uppercase tracking-widest text-slate-800"
                          value={visitorPlate}
                          onChange={(e) => setVisitorPlate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block ml-0.5 mb-2">Ngày giờ cấp vé</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                        </div>
                        <input
                          readOnly
                          type="text"
                          className="block w-full pl-10 pr-2 py-3 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 pointer-events-none"
                          value={new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        />
                      </div>
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

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block ml-0.5 mb-2">Tòa / Khu vực (Bãi đỗ)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">location_city</span>
                      </div>
                      <select
                        required
                        className="block w-full pl-11 pr-10 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-bold text-slate-800 appearance-none cursor-pointer"
                        value={selectedParkingLot}
                        onChange={(e) => setSelectedParkingLot(e.target.value)}
                      >
                        {parkingLots.map((lot, idx) => (
                          <option key={idx} value={lot.name}>
                            {lot.name} {lot.capacity ? `(Sức chứa: ${lot.capacity})` : ''}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                      </div>
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
                </>
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
                      <div className="col-span-2">
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Tòa / Khu vực (Bãi đỗ)</span>
                        <strong className="text-slate-900 block mt-0.5">{generatedTicket.parkingLotName || 'Khu Vực A (Vãng lai)'}</strong>
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
                                  .card { border: 2px dashed #000; padding: 20px; border-radius: 10px; display: inline-block; width: 300px; }
                                  h2 { margin: 0 0 10px 0; font-size: 18px; color: #000; text-transform: uppercase; }
                                  p { margin: 8px 0; font-size: 14px; text-align: left; }
                                  .divider { border-bottom: 1px dashed #000; margin: 15px 0; }
                                  img { margin-top: 10px; width: 150px; height: 150px; }
                                </style>
                              </head>
                              <body>
                                <div class="card">
                                  <h2>PM SYSTEM<br/><small style="font-size: 12px">THẺ GỬI XE VÃNG LAI</small></h2>
                                  <div class="divider"></div>
                                  <p><strong>Biển số:</strong> ${generatedTicket.plate}</p>
                                  <p><strong>Tòa / Khu:</strong> ${generatedTicket.parkingLotName || 'Khu Vực A'}</p>
                                  <p><strong>Giờ vào:</strong> ${generatedTicket.time}</p>
                                  <div class="divider"></div>
                                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generatedTicket.qrCode)}" />
                                  <p style="text-align: center; font-size: 10px; margin-top: 10px; font-family: monospace;">${generatedTicket.qrCode}</p>
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
              className="bg-slate-50/95 backdrop-blur-2xl rounded-[2rem] border border-white shadow-2xl max-w-4xl w-full relative p-6 md:p-8 text-slate-800 overflow-hidden z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 opacity-90"></div>

              {/* Header */}
              <div className="flex items-start justify-between pb-4 mb-6 border-b border-slate-200/60 relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 relative shadow-sm">
                    <FileText size={20} />
                    <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-blue-400 border-2 border-white"></span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-slate-900">Chi tiết lượt xe {selectedLogEntry.type === 'ENTRY' ? 'vào' : 'ra'}</h3>
                    <p className="text-xs font-bold text-blue-600 tracking-wider mt-1">
                      {selectedLogEntry.type === 'EXIT' ? `Vào: ${selectedLogEntry.entryTimeStr} • Ra: ${selectedLogEntry.time}` : selectedLogEntry.time}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedLogEntry(null)} className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all flex items-center justify-center border border-slate-200 shadow-sm cursor-pointer">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                {/* Left Column: Photos & QR */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div className="bg-white border border-slate-100 rounded-[1.5rem] p-4 flex flex-col gap-4 shadow-sm">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Camera size={16} /> ẢNH NHẬN DIỆN
                    </span>
                    <div className="flex flex-col gap-4">
                      {selectedLogEntry.type === 'EXIT' && (
                        <div className="rounded-[1.5rem] overflow-hidden relative bg-slate-100 group aspect-video cursor-pointer" onClick={() => setSelectedLogPhoto(selectedLogEntry.entryPhoto || FALLBACK_CAR_CAPTURES[1])}>
                          <img 
                            src={selectedLogEntry.entryPhoto || FALLBACK_CAR_CAPTURES[1]} 
                            alt="Entry Photo" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute bottom-3 left-3 bg-blue-500 px-3 py-1.5 rounded-full text-[10px] text-white font-bold tracking-widest shadow-sm">ẢNH VÀO</div>
                        </div>
                      )}
                      <div className="rounded-[1.5rem] overflow-hidden relative bg-slate-100 group aspect-video cursor-pointer" onClick={() => setSelectedLogPhoto(selectedLogEntry.type === 'EXIT' ? (selectedLogEntry.exitPhoto || selectedLogEntry.photo) : selectedLogEntry.photo)}>
                        <img 
                          src={selectedLogEntry.type === 'EXIT' ? (selectedLogEntry.exitPhoto || selectedLogEntry.photo) : selectedLogEntry.photo} 
                          alt="Action Photo" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute bottom-3 left-3 bg-blue-500 px-3 py-1.5 rounded-full text-[10px] text-white font-bold tracking-widest shadow-sm">
                          ẢNH {selectedLogEntry.type === 'EXIT' ? 'RA' : 'VÀO'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedLogEntry.qrCode && (
                    <div className="bg-white py-3 px-4 rounded-full border border-slate-100 flex items-center justify-between shadow-sm">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">MÃ QUÉT (QR)</span>
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">{selectedLogEntry.qrCode}</span>
                    </div>
                  )}
                </div>

                {/* Right Column: Information */}
                <div className="md:col-span-7 flex flex-col gap-4">
                  {/* Plate Display */}
                  <div className="bg-white py-6 px-4 rounded-[1.5rem] border border-slate-100 shadow-sm text-center">
                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block mb-2">BIỂN SỐ NHẬN DIỆN</span>
                    <span className="text-4xl font-mono font-black tracking-[0.25em] text-slate-800 leading-none block">{selectedLogEntry.plate}</span>
                  </div>

                  {/* Customer Type & Ticket Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`py-4 px-3 rounded-[1.5rem] border shadow-sm flex flex-col justify-center text-center ${selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100'}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'text-blue-500' : 'text-slate-400'}`}>LOẠI KHÁCH</span>
                      <span className={`text-[12px] font-black block tracking-widest ${selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'text-blue-700' : 'text-slate-700'}`}>{selectedLogEntry.owner}</span>
                    </div>
                    <div className="bg-white py-4 px-3 rounded-[1.5rem] border border-slate-100 shadow-sm text-center flex flex-col justify-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">TRẠNG THÁI VÉ</span>
                      <span className="text-[12px] font-black text-slate-700 block tracking-widest">{selectedLogEntry.ticketType}</span>
                    </div>
                  </div>

                  {/* Location Info */}
                  {(selectedLogEntry.parkingLotName || selectedLogEntry.parkingSlot) && (
                    <div className="bg-blue-50/50 p-4 rounded-[1.5rem] border border-blue-100/50 flex items-center justify-between shadow-sm">
                      <div className="flex flex-col min-w-0 flex-1 text-left">
                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block mb-1">TÒA NHÀ / BÃI ĐỖ</span>
                        <span className="text-sm font-black text-slate-800 block uppercase truncate">
                          {selectedLogEntry.parkingLotName || 'Khu Vực Vãng Lai'}
                        </span>
                      </div>
                      {selectedLogEntry.parkingSlot && (
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest block mb-1">VỊ TRÍ ĐỖ (Ô)</span>
                          <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[11px] font-bold shadow-sm">
                            Slot {selectedLogEntry.parkingSlot}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Schedule Info */}
                  <div className={`bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm ${selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' ? 'shrink-0' : 'flex-1'}`}>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-3 px-1">
                      <Clock size={16} /> THÔNG TIN LỊCH TRÌNH
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white py-3 px-2 rounded-full border border-slate-100 text-center flex flex-col justify-center shadow-sm col-span-2 md:col-span-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">THỜI GIAN VÀO</span>
                        <span className="text-sm font-black text-slate-800 block">{selectedLogEntry.entryTimeStr}</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">{selectedLogEntry.entryDateStr}</span>
                      </div>
                      {selectedLogEntry.type === 'EXIT' && (
                        <div className="bg-white py-3 px-2 rounded-full border border-slate-100 text-center flex flex-col justify-center shadow-sm col-span-2 md:col-span-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">THỜI GIAN RA</span>
                          <span className="text-sm font-black text-slate-800 block">{selectedLogEntry.exitTimeStr}</span>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5">{selectedLogEntry.exitDateStr}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Details */}
                  {selectedLogEntry.owner === 'KHÁCH ĐẶT TRƯỚC' && selectedLogEntry.customerName && (
                    <div className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 px-1">
                        <User size={16} /> KHÁCH HÀNG
                      </span>
                      <div className="px-1 flex flex-col gap-3">
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block shrink-0">TÊN:</span>
                          <span className="text-xs font-bold text-slate-800 block truncate text-right">{selectedLogEntry.customerName}</span>
                        </div>
                        <div className="w-full border-t border-slate-100 border-dashed"></div>
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block shrink-0">SĐT:</span>
                          <span className="text-xs font-bold text-slate-800 block text-right">{selectedLogEntry.customerPhone || 'N/A'}</span>
                        </div>
                        <div className="w-full border-t border-slate-100 border-dashed"></div>
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block shrink-0">EMAIL:</span>
                          <span className="text-xs font-bold text-slate-800 block truncate text-right">{selectedLogEntry.customerEmail || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Fee for Exit */}
                  {selectedLogEntry.type === 'EXIT' && selectedLogEntry.totalFee !== undefined && (
                    <div className="shrink-0 bg-blue-50 py-4 px-6 rounded-[1.5rem] border border-blue-100 flex items-center justify-between shadow-sm mt-auto">
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Phí thanh toán</span>
                      <span className="text-xl font-black text-blue-700 tracking-wide">
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
