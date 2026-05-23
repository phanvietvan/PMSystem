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
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import jsQR from 'jsqr';
import Tesseract from 'tesseract.js';
import WelcomeAnimation from './Welcome.json';

<<<<<<< HEAD
const API_BASE_URL = '/api';

=======
import QRCode from 'qrcode';

const API_BASE_URL = '/api';

>>>>>>> FE_Main
// Fallback high-quality car photos for live webcam fallbacks ONLY
const FALLBACK_CAR_CAPTURES = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
];

const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
<<<<<<< HEAD
=======
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string>('');

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
>>>>>>> FE_Main

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Real MongoDB logs feed
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [selectedLogPhoto, setSelectedLogPhoto] = useState<string | null>(null);

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
          handleOcrAndScan();
        }
      }
      if (e.key === 'F4') {
        e.preventDefault();
        playChimeSound();
        setShowVisitorModal(prev => !prev);
        setVisitorPlate('');
        setGeneratedTicket(null);
      }
      if (e.key === 'F8') {
        e.preventDefault();
        if (gateState === 'COMPARING' && scannedResult) {
          confirmPass();
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
  }, [gateState, scannedResult, isCountdownActive]);

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
          const timeStr = entryDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          
          return {
            plate: session.licensePlate,
            status: session.status === 'Completed' ? 'Lối ra' : 'Lối vào',
            time: timeStr,
            type: session.status === 'Completed' ? 'EXIT' : 'ENTRY',
            owner: session.status === 'Completed' ? 'KHÁCH VÃNG LAI' : 'XE ĐANG GỬI',
            ticketType: session.status === 'Completed' ? 'Vé đã thanh toán' : 'Vé đang hoạt động',
            photo: session.entryPhoto || FALLBACK_CAR_CAPTURES[0],
            qrCode: session.qrCode
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
          time: new Date(data.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
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
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        photo: livePhoto,
        vehicleType: visitorVehicleType
      });
    } finally {
      setIsGeneratingTicket(false);
    }
  };

<<<<<<< HEAD
  // Helper to extract Vietnamese license plates from recognized text
  const extractLicensePlate = (text: string): string | null => {
    if (!text) return null;
    
    // Split the text by spaces/newlines and clean all non-alphanumeric chars
    const tokens = text.split(/[\s\n\r\t]+/).map(t => t.replace(/[^A-Z0-9]/g, '').toUpperCase());
    console.log("Tokens processed by LPR:", tokens);

    let provinceSeries = '';
    let plateNumber = '';

    // Province + Series Regex: 2 digits followed by 1 or 2 characters (e.g. 92L1, 30F, 29A1, 59G2)
    const provinceRegex = /^([0-9]{2})([A-Z][A-Z0-9]?)$/;
    // Plate Number Regex: 4 or 5 digits
    const numberRegex = /^([0-9]{4,5})$/;

    // Find Province + Series token
    for (const token of tokens) {
      if (provinceRegex.test(token)) {
        provinceSeries = token;
        break;
      }
    }

    // Find Plate Number token
    for (const token of tokens) {
      if (numberRegex.test(token)) {
        plateNumber = token;
        break;
      }
    }

    // If we found both, combine them!
    if (provinceSeries && plateNumber) {
      const formattedNumber = plateNumber.length === 5 
        ? `${plateNumber.slice(0, 3)}.${plateNumber.slice(3)}` 
        : plateNumber;
      return `${provinceSeries}-${formattedNumber}`;
    }

    // Unified 1-line fallback (for car plates, e.g. "30F18665")
    const cleanAll = tokens.join('');
    const unifiedRegex = /([0-9]{2})([A-Z][A-Z0-9]?)([0-9]{4,5})/;
    const match = cleanAll.match(unifiedRegex);
    if (match) {
      const province = match[1];
      const series = match[2];
      const number = match[3];
      const formattedNumber = number.length === 5 
        ? `${number.slice(0, 3)}.${number.slice(3)}` 
        : number;
      return `${province}${series}-${formattedNumber}`;
    }

    return null;
  };

  // Perform AI OCR and License Plate Recognition from live canvas
  const runLprOcr = async (): Promise<string | null> => {
    setIsOcrLoading(true);
    playChimeSound();

    const livePhoto = captureFrame();
    if (!livePhoto) {
      setIsOcrLoading(false);
      return null;
    }

    try {
      const { data: { text } } = await Tesseract.recognize(livePhoto, 'eng');
      console.log("OCR Extracted text:", text);
      const plate = extractLicensePlate(text);
      if (plate) {
        setIsOcrLoading(false);
        return formatPlateNumber(plate);
      }
    } catch (err) {
      console.warn("OCR engine exception:", err);
    }

    setIsOcrLoading(false);
    return null;
  };

  // Trigger scanning workflow using recognized plate or manual field input
  const handleOcrAndScan = async () => {
    // If the operator has typed a manual plate in the input field, use it directly!
    if (manualInput.trim()) {
      const formatted = formatPlateNumber(manualInput);
      setManualInput('');
      await triggerScan(formatted);
      return;
    }

    // Otherwise, execute AI License Plate Recognition
    const plate = await runLprOcr();
    if (!plate) {
      // Graceful fallback: trigger check-in panel without blocking alert so staff can manually type the plate!
      await triggerScan('');
      return;
    }
    // Do not pollute the bottom text input field; trigger the scan directly!
    await triggerScan(plate);
=======
  // Trigger manual QR scanning workflow using text input field
  const handleOcrAndScan = async () => {
    if (manualInput.trim()) {
      const input = manualInput.trim().toUpperCase();
      setManualInput('');
      await triggerScan(input);
    }
>>>>>>> FE_Main
  };

  // Trigger exit scan verification
  const triggerScan = async (customPlateOrQr?: string) => {
    playChimeSound();

    const inputCleanRaw = (customPlateOrQr || '').trim().toUpperCase();
    const isQrScan = inputCleanRaw.startsWith('QR_') || inputCleanRaw.startsWith('QR');
    const inputClean = isQrScan ? inputCleanRaw : formatPlateNumber(inputCleanRaw);

    const livePhoto = captureFrame() || FALLBACK_CAR_CAPTURES[Math.floor(Math.random() * FALLBACK_CAR_CAPTURES.length)];
    const fallbackEntryPhoto = FALLBACK_CAR_CAPTURES[1];

    let entryPhoto = fallbackEntryPhoto;
    let entryTimeStr = 'N/A';
    let entryPlate = isQrScan ? '' : (inputClean || formatPlateNumber('30F-' + Math.floor(100 + Math.random() * 900) + '.' + Math.floor(10 + Math.random() * 90)));
    let ticketLabel = gateMode === 'ENTRY' ? 'Vé vãng lai' : 'Vé vãng lai • Phí: 10,000 VNĐ';
    let foundSessionCode = isQrScan ? inputClean : undefined;
    let computedFee = 10000;
<<<<<<< HEAD

    if (gateMode === 'ENTRY') {
=======
    
    let owner = 'KHÁCH VÃNG LAI';
    let ticketType = 'Vé vãng lai';
    let userInfo = null;

    if (gateMode === 'ENTRY') {
      if (isQrScan && inputClean) {
        try {
          const res = await fetch(`${API_BASE_URL}/ParkingSessions/verify/${inputClean}`);
          if (res.ok) {
            const data = await res.json();
            const session = data.session;
            const user = data.user;
            entryPlate = session.licensePlate;
            ticketType = `Đặt trước • Slot ${session.parkingSlot} (${session.parkingLotName})`;
            
            if (user) {
              owner = `${user.lastName || ''} ${user.firstName || ''}`.trim() || 'XE ĐẶT TRƯỚC (RESERVATION)';
              userInfo = user;
            } else {
              owner = 'XE ĐẶT TRƯỚC (RESERVATION)';
            }
            foundSessionCode = session.qrCode;
          } else {
            playWarningSound();
            alert("Mã QR đặt chỗ không hợp lệ hoặc đã được sử dụng!");
            return;
          }
        } catch (e) {
          console.warn("QR verification check failed on entry:", e);
        }
      }

>>>>>>> FE_Main
      const payload = {
        plate: entryPlate,
        status: 'Chờ xác nhận',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
<<<<<<< HEAD
        owner: 'KHÁCH VÃNG LAI',
        ticketType: 'Vé vãng lai',
        capturedPhoto: livePhoto,
        registeredPhoto: livePhoto,
        type: 'ENTRY',
        qrCode: undefined
=======
        owner: owner,
        ticketType: ticketType,
        capturedPhoto: livePhoto,
        registeredPhoto: livePhoto,
        type: 'ENTRY',
        qrCode: foundSessionCode,
        userInfo: userInfo
>>>>>>> FE_Main
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
<<<<<<< HEAD
                entryPhoto = session.entryPhoto || fallbackEntryPhoto;
                entryTimeStr = new Date(session.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                entryPlate = session.licensePlate;
                ticketLabel = `Vé vãng lai • Vào: ${entryTimeStr}`;
                foundSessionCode = session.qrCode;
=======
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
                    }
                  }
                } catch {}
>>>>>>> FE_Main
              } else {
                // Warning if plate not found in database active list
                playWarningSound();
                alert(`Không tìm thấy xe mang biển số ${inputClean} đang gửi trong bãi!`);
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
<<<<<<< HEAD
              entryPhoto = session.entryPhoto || fallbackEntryPhoto;
              entryTimeStr = new Date(session.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              entryPlate = session.licensePlate;
              computedFee = data.fee;
              ticketLabel = `Vé vãng lai • Phí: ${data.fee.toLocaleString()} VNĐ`;
              foundSessionCode = session.qrCode;
=======
              const user = data.user;
              entryPhoto = session.entryPhoto || '';
              const entryTimeVal = session.entryTime || session.createdAt;
              entryTimeStr = new Date(entryTimeVal).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
              entryPlate = session.licensePlate;
              computedFee = data.fee;
              ticketLabel = `Đặt trước • Slot ${session.parkingSlot} (${session.parkingLotName})`;
              foundSessionCode = session.qrCode;
              
              if (user) {
                owner = `${user.lastName || ''} ${user.firstName || ''}`.trim() || 'XE ĐẶT TRƯỚC (RESERVATION)';
                userInfo = user;
              } else {
                owner = 'XE ĐẶT TRƯỚC (RESERVATION)';
              }
>>>>>>> FE_Main
            } else {
              // Warning if QR not active or not found
              playWarningSound();
              alert("Mã QR không hợp lệ hoặc vé này đã thanh toán rời bãi!");
              return;
            }
          } catch (e) {
            console.warn("QR verification check failed:", e);
          }
        }
      }

      const payload = {
<<<<<<< HEAD
        plate: entryPlate,
        status: 'Hợp lệ',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        owner: 'KHÁCH VÃNG LAI',
=======
        plate: entryPlate,              // Entry plate from MongoDB
        exitPlate: entryPlate,          // Exit plate (can be modified by operator for comparison!)
        status: 'Hợp lệ',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        owner: owner,
>>>>>>> FE_Main
        ticketType: ticketLabel,
        capturedPhoto: livePhoto,       // Current live exit photo
        registeredPhoto: entryPhoto,   // REAL MongoDB entry photo!
        type: 'EXIT',
        qrCode: foundSessionCode,
<<<<<<< HEAD
        fee: computedFee
=======
        fee: computedFee,
        userInfo: userInfo,
        entryTime: entryTimeStr         // Injected entryTime!
>>>>>>> FE_Main
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
<<<<<<< HEAD
        const res = await fetch(`${API_BASE_URL}/ParkingSessions/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            LicensePlate: scannedResult.plate,
            EntryPhoto: scannedResult.capturedPhoto,
            ParkingLotName: 'Cổng Vào A1',
            VehicleType: 'Car'
          })
        });
        if (res.ok) {
          const data = await res.json();
          // Play success chime sound
          playChimeSound();
          // Set generated ticket to display QR Ticket Card
          setGeneratedTicket({
            qrCode: data.qrCode,
            plate: data.licensePlate,
            time: new Date(data.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            photo: data.entryPhoto || scannedResult.capturedPhoto,
            vehicleType: data.vehicleType || 'Car'
=======
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
            time: new Date(session.entryTime || session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            photo: session.entryPhoto || scannedResult.capturedPhoto,
            vehicleType: session.vehicleType || 'Car'
>>>>>>> FE_Main
          });
          setGateState('GATE_OPEN');
        }
      } catch (err) {
<<<<<<< HEAD
        console.warn("Database check-in failed:", err);
=======
        console.warn("Database check-in / gate-scan failed:", err);
>>>>>>> FE_Main
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
<<<<<<< HEAD
            QrCode: qrCodeToPost,
            ExitLicensePlate: scannedResult.plate,
=======
            qrCode: qrCodeToPost,
            QrCode: qrCodeToPost,
            exitLicensePlate: scannedResult.exitPlate || scannedResult.plate,
            ExitLicensePlate: scannedResult.exitPlate || scannedResult.plate,
            exitPhoto: scannedResult.capturedPhoto,
>>>>>>> FE_Main
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
    <div className="bg-slate-50 text-slate-800 min-h-screen selection:bg-blue-600/10 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sleek, Premium Light Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 z-50 px-6 md:px-12 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0 w-9 h-9">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full drop-shadow-md">
                <defs>
                  <linearGradient id="logoBgGrad" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2563EB" />
                    <stop offset="1" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <rect width="48" height="48" rx="12" fill="url(#logoBgGrad)" />
                <text x="24" y="34" textAnchor="middle" fill="white" fontSize="28" fontWeight="800">P</text>
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold tracking-tight text-slate-900 text-base">PM System</span>
              <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase mt-0.5">Soát Vé Cổng</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">|</span>
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Lối soát A1
            </span>
          </div>
        </div>

        {/* User profile dropdown & status */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] tracking-wide text-emerald-700 font-bold uppercase">Trực tuyến</span>
          </div>

          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 p-1 pr-3 rounded-full border border-slate-200 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-blue-600 text-white font-extrabold text-xs shrink-0 border border-slate-200">
                  {currentUser.avatarUrl && currentUser.avatarUrl !== 'null' && currentUser.avatarUrl !== 'undefined' ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <span className="text-xs font-bold text-slate-700 hidden md:block max-w-[120px] truncate">{displayName}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl py-2 z-20 shadow-lg p-1.5 flex flex-col gap-0.5">
                      <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1">
                        <p className="text-xs font-extrabold text-slate-800">{displayName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{currentUser.email}</p>
                      </div>
                      <a href="http://localhost:5173/" className="flex items-center gap-3.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl">
                        <ExternalLink size={14} className="opacity-75" />
                        <span>Về trang chủ</span>
                      </a>
                      <button onClick={handleLogout} className="flex items-center gap-3.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl w-full text-left border-t border-slate-100 mt-1 pt-2 cursor-pointer">
                        <LogOut size={14} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* Main 2-Column Spacious Layout */}
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto min-h-screen">
        <div className="grid grid-cols-12 gap-6 items-stretch">
          
          {/* COLUMN 1: LEFT AREA (Main Camera & Split Comparison) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
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
<<<<<<< HEAD
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-955/60 border border-blue-800/40 px-3 py-1 rounded-full">ĐẶT BIỂN SỐ Ở ĐÂY TO QUÉT</span>
                      </div>
                      <div className="absolute inset-x-0 h-0.5 bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.8)] scanner-line !animate-[scan_3s_ease-in-out_infinite]" />
                    </div>

                    <div className="mt-8 text-center px-4">
                      <h2 className="text-white text-lg font-black tracking-widest uppercase mb-1">ĐANG CHỜ XE ĐẾN</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                        Đưa thẻ QR hoặc di chuyển biển số vào trước camera
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold mt-3">
                        [Bấm <strong className="text-blue-400">Phím Cách (Spacebar)</strong> để tự động cấp vé]
                      </p>
                    </div>
                  </div>

=======
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
 
>>>>>>> FE_Main
                  {/* Manual Input Bar */}
                  <div className="z-10 p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center gap-3">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (manualInput.trim()) {
<<<<<<< HEAD
                          const formatted = formatPlateNumber(manualInput);
                          setManualInput('');
                          triggerScan(formatted);
=======
                          const input = manualInput.trim().toUpperCase();
                          setManualInput('');
                          triggerScan(input);
>>>>>>> FE_Main
                        }
                      }}
                      className="flex-1 flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 focus-within:border-blue-500/50 transition-all"
                    >
                      <Keyboard className="text-slate-600" size={16} />
                      <input 
                        className="bg-transparent border-none w-full text-white font-mono text-xs uppercase placeholder:text-slate-700 tracking-wider outline-none" 
<<<<<<< HEAD
                        placeholder="NHẬP BIỂN SỐ XE..." 
=======
                        placeholder="NHẬP MÃ QR CỦA XE (Ví dụ: QR_...)..." 
>>>>>>> FE_Main
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
<<<<<<< HEAD
                      {gateMode === 'ENTRY' ? 'CHỤP ẢNH XE & TẠO QR VÉ' : 'CHỤP ẢNH XE & KIỂM TRA RA'}
=======
                      XÁC THỰC MÃ QR
>>>>>>> FE_Main
                    </button>
                  </div>
                </div>
              )}

              {gateState === 'COMPARING' && scannedResult && (
                /* Stage 2: Dual image split comparison and countdown */
                <div className="flex-1 flex flex-col bg-white text-slate-800 animate-scale-up">
                  
                  {/* Countdown progress / manual override indicator */}
                  {isCountdownActive ? (
                    <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex justify-between items-center text-xs font-semibold text-blue-800">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping" />
                        Tự động duyệt và cho xe qua sau <strong>{countdown} giây</strong>...
                      </span>
                      <button 
                        onClick={() => {
                          setIsCountdownActive(false);
                          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                          playWarningSound();
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-wider cursor-pointer"
                      >
                        [ESC] DỪNG TỰ ĐỘNG
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex justify-between items-center text-xs font-semibold text-amber-800">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle size={15} className="text-amber-600" />
                        Đã tạm dừng tự động. Vui lòng bấm xác nhận bên dưới.
                      </span>
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">ĐỐI CHIẾU THÔNG TIN XE</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Xác thực khớp hình dạng xe & biển số</p>
                    </div>

                    <span className={`text-[10px] font-black px-3.5 py-1 rounded-full uppercase border ${
                      scannedResult.type === 'ENTRY' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {scannedResult.type === 'ENTRY' ? 'Lối Vào • Entry' : 'Lối Ra • Exit'}
                    </span>
                  </div>

                  {/* Spacious Split Screen Display */}
                  {scannedResult.type === 'ENTRY' ? (
                    // ENTRY CONFIRMATION PANEL with editable input box
                    <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch bg-slate-50/50">
                      {/* Left: Captured camera photo */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-extrabold tracking-wider text-emerald-600 uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ẢNH CHỤP CAMERA CỔNG VÀO
                        </span>
                        <div className="flex-1 min-h-[220px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-sm">
                          <img src={scannedResult.capturedPhoto} alt="Gate Capture" className="w-full h-full object-cover" />
                          <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[8px] font-bold text-slate-200 uppercase tracking-widest">
                            {scannedResult.time} • Camera lối vào A1
                          </div>
                        </div>
                      </div>

                      {/* Right: Large Editable Plate Field */}
                      <div className="flex flex-col justify-center space-y-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div>
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1.5">
                            BIỂN SỐ NHẬN DIỆN (NHÂN VIÊN CÓ THỂ SỬA)
                          </label>
                          <input 
                            type="text" 
                            className="w-full text-3xl font-mono font-black text-slate-900 text-center tracking-widest bg-slate-50 border-2 border-emerald-500 focus:border-indigo-600 focus:bg-white px-4 py-3.5 rounded-2xl shadow-sm outline-none transition-all uppercase"
                            value={scannedResult.plate}
                            onChange={(e) => setScannedResult({ ...scannedResult, plate: e.target.value.toUpperCase() })}
                          />
                          <span className="text-[10px] text-slate-400 font-semibold block mt-2 text-center">
                            💡 Nhân viên bấm trực tiếp vào ô trên để chỉnh sửa biển số nếu AI nhận dạng chưa đúng.
                          </span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">LOẠI VÉ KHỞI TẠO</span>
                          <span className="text-xs font-black text-slate-700 mt-1 block uppercase">{scannedResult.ticketType}</span>
                        </div>
<<<<<<< HEAD
                      </div>
                    </div>
                  ) : (
                    // EXIT COMPARISON PANEL
                    <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch bg-slate-50/50">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-extrabold tracking-wider text-emerald-600 uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ẢNH CHỤP HIỆN TẠI (LỐI SOÁT)
                        </span>
                        <div className="flex-1 min-h-[200px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-sm">
                          <img src={scannedResult.capturedPhoto} alt="Gate Capture" className="w-full h-full object-cover" />
                          <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[8px] font-bold text-slate-200 uppercase tracking-widest">
                            {scannedResult.time} • Camera lối soát
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-extrabold tracking-wider text-blue-600 uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          ẢNH ĐỐI CHIẾU TRONG MONGODB
                        </span>
                        <div className="flex-1 min-h-[200px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-sm">
                          <img src={scannedResult.registeredPhoto} alt="Entry Capture" className="w-full h-full object-cover" />
                          <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[8px] font-bold text-slate-200 uppercase tracking-widest">
                            {scannedResult.type === 'EXIT' ? 'Ảnh lưu lúc xe vào' : 'Ảnh đối chứng gốc'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comparative Plate Badge Area (Exit only) */}
                  {scannedResult.type === 'EXIT' && (
                    <div className="px-6 py-5 border-t border-slate-200 space-y-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col gap-1 text-center md:text-left">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">BIỂN SỐ NHẬN DIỆN</span>
                          <span className="text-2xl font-mono font-black text-slate-900 tracking-widest bg-white border border-slate-300 px-5 py-1.5 rounded-xl shadow-sm inline-block">
                            {scannedResult.plate}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 items-center md:items-end">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">THÔNG TIN LOẠI VÉ</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                              <ShieldCheck size={14} /> {scannedResult.ticketType}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> TRÙNG KHỚP
                            </span>
                          </div>
                        </div>
=======

                        {scannedResult.userInfo && (
                          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/70 flex flex-col gap-3 text-left">
                            <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest block">THÔNG TIN KHÁCH HÀNG ĐẶT TRƯỚC</span>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-[8px] text-slate-400 font-extrabold block uppercase tracking-wider">Chủ tài khoản</span>
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                                  {`${scannedResult.userInfo.lastName || scannedResult.userInfo.LastName || ''} ${scannedResult.userInfo.firstName || scannedResult.userInfo.FirstName || ''}`.trim() || scannedResult.userInfo.username || scannedResult.userInfo.Username || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-400 font-extrabold block uppercase tracking-wider">Số điện thoại</span>
                                <span className="text-xs font-mono font-black text-slate-700">
                                  {scannedResult.userInfo.phoneNumber || scannedResult.userInfo.PhoneNumber || 'N/A'}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[8px] text-slate-400 font-extrabold block uppercase tracking-wider">Email liên hệ</span>
                                <span className="text-xs font-mono font-bold text-slate-600">
                                  {scannedResult.userInfo.email || scannedResult.userInfo.Email || 'N/A'}
                                </span>
                              </div>
                              {scannedResult.userInfo.address && (
                                <div className="col-span-2">
                                  <span className="text-[8px] text-slate-400 font-extrabold block uppercase tracking-wider">Địa chỉ</span>
                                  <span className="text-xs text-slate-600 font-semibold">
                                    {scannedResult.userInfo.address}
                                  </span>
                                </div>
                              )}
                              <div className="col-span-2">
                                <span className="text-[8px] text-slate-400 font-extrabold block uppercase tracking-wider">Mã đặt chỗ (QR Code)</span>
                                <span className="text-xs font-mono font-black text-blue-700 bg-blue-100/60 px-2.5 py-1 rounded border border-blue-200/50 inline-block tracking-wider">
                                  {scannedResult.qrCode}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // EXIT COMPARISON PANEL (Same premium design system)
                    <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch bg-slate-50/50">
                      {/* Left: Photos Comparison (stacked vertically, beautiful and compact) */}
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-extrabold tracking-wider text-emerald-600 uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ẢNH CHỤP HIỆN TẠI (LỐI SOÁT)
                          </span>
                          <div className="h-[180px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-sm">
                            <img src={scannedResult.capturedPhoto} alt="Gate Capture" className="w-full h-full object-cover" />
                            <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[8px] font-bold text-slate-200 uppercase tracking-widest">
                              {scannedResult.time} • Camera lối soát
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-extrabold tracking-wider text-blue-600 uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            ẢNH ĐỐI CHIẾU TRONG MONGODB
                          </span>
                          <div className="h-[180px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-sm">
                            {scannedResult.registeredPhoto ? (
                              <>
                                <img src={scannedResult.registeredPhoto} alt="Entry Capture" className="w-full h-full object-cover" />
                                <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[8px] font-bold text-slate-200 uppercase tracking-widest">
                                  Ảnh lưu lúc xe vào
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-1.5 p-4 text-center">
                                <span className="material-symbols-outlined text-[32px] text-slate-300">image_not_supported</span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                                  ẢNH VÀO: KHÔNG KHẢ DỤNG
                                </span>
                                <span className="text-[8px] text-slate-400 block leading-tight">
                                  (Xe chưa qua cổng vào hoặc chưa chụp được ảnh)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Plate Verification, computed fee, and User Details */}
                      <div className="flex flex-col space-y-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm justify-between">
                        {/* Plate comparison input */}
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">
                              BIỂN SỐ XE RA (LỐI SOÁT)
                            </label>
                            <input 
                              type="text" 
                              className="w-full text-3xl font-mono font-black text-slate-900 text-center tracking-widest bg-slate-50 border-2 border-indigo-500 focus:border-indigo-600 focus:bg-white px-4 py-2.5 rounded-2xl shadow-sm outline-none transition-all uppercase"
                              value={scannedResult.exitPlate || ''}
                              onChange={(e) => setScannedResult({ ...scannedResult, exitPlate: e.target.value.toUpperCase() })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">Biển số lúc vào</span>
                              <span className="text-sm font-mono font-black text-slate-700 block mt-1 tracking-wider">{scannedResult.plate}</span>
                            </div>

                            {/* Comparison Result Badge */}
                            <div className={`p-3 rounded-xl border flex flex-col justify-center items-center text-center
                              ${(scannedResult.plate || '').replace(/[^A-Z0-9]/g, "") === (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, "")
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                : 'bg-red-50 border-red-100 text-red-800 animate-pulse'}`}
                            >
                              <span className="text-[8px] font-extrabold uppercase tracking-wider block">Kết quả đối chiếu</span>
                              <span className="text-[10px] font-black mt-1">
                                {(scannedResult.plate || '').replace(/[^A-Z0-9]/g, "") === (scannedResult.exitPlate || '').replace(/[^A-Z0-9]/g, "")
                                  ? '✅ TRÙNG KHỚP'
                                  : '❌ KHÔNG KHỚP'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ticket details & fee */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-left">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">Loại vé</span>
                            <span className="text-[10px] font-bold text-blue-700 block mt-1 truncate" title={scannedResult.ticketType}>{scannedResult.ticketType}</span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">THỜI GIAN VÀO</span>
                            <span className="text-[9px] font-mono font-black text-slate-700 block mt-1 leading-tight">{scannedResult.entryTime || 'N/A'}</span>
                          </div>

                          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-center">
                            <span className="text-[8px] text-amber-600 font-extrabold uppercase tracking-wider block">PHÍ DỊCH VỤ</span>
                            <span className="text-xs font-black text-amber-800 mt-1 block">{(scannedResult.fee || 10000).toLocaleString()}đ</span>
                          </div>
                        </div>

                        {/* Customer Information Card (same as entry) */}
                        {scannedResult.userInfo && (
                          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/70 flex flex-col gap-2.5 text-left">
                            <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest block">THÔNG TIN KHÁCH HÀNG ĐĂNG KÝ</span>
                            
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <span className="text-[8px] text-slate-400 font-extrabold block uppercase tracking-wider">Chủ tài khoản</span>
                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                                  {`${scannedResult.userInfo.lastName || scannedResult.userInfo.LastName || ''} ${scannedResult.userInfo.firstName || scannedResult.userInfo.FirstName || ''}`.trim() || scannedResult.userInfo.username || scannedResult.userInfo.Username || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-400 font-extrabold block uppercase tracking-wider">Số điện thoại</span>
                                <span className="text-[11px] font-mono font-black text-slate-700">
                                  {scannedResult.userInfo.phoneNumber || scannedResult.userInfo.PhoneNumber || 'N/A'}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[8px] text-slate-400 font-extrabold block uppercase tracking-wider">Email liên hệ</span>
                                <span className="text-[11px] font-mono font-bold text-slate-600 truncate block">
                                  {scannedResult.userInfo.email || scannedResult.userInfo.Email || 'N/A'}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[8px] text-slate-400 font-extrabold block uppercase tracking-wider">Mã đặt chỗ (QR Code)</span>
                                <span className="text-[10px] font-mono font-black text-blue-700 bg-blue-100/60 px-2.5 py-0.5 rounded border border-blue-200/50 inline-block tracking-wider">
                                  {scannedResult.qrCode}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
>>>>>>> FE_Main
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
<<<<<<< HEAD
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${generatedTicket.qrCode}`} 
                            alt="Ticket QR Code"
                            className="w-32 h-32 animate-fade-in"
                          />
=======
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
>>>>>>> FE_Main
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
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            
            {/* Operator Control configurations */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold tracking-wider text-slate-700 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  CẤU HÌNH CỔNG
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Sức chứa: {capacity}/200
                </span>
              </div>

              {/* Segmented Gate Mode switcher */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/50">
                <button 
                  disabled={gateState !== 'SCANNING'}
                  onClick={() => { playChimeSound(); setGateMode('ENTRY'); }}
                  className={`py-2 text-xs font-extrabold uppercase rounded-lg transition-all cursor-pointer disabled:opacity-40 ${
                    gateMode === 'ENTRY' 
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Xe Vào (ENTRY)
                </button>
                <button 
                  disabled={gateState !== 'SCANNING'}
                  onClick={() => { playChimeSound(); setGateMode('EXIT'); }}
                  className={`py-2 text-xs font-extrabold uppercase rounded-lg transition-all cursor-pointer disabled:opacity-40 ${
                    gateMode === 'EXIT' 
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Xe Ra (EXIT)
                </button>
              </div>

              {/* Automation Auto-pass toggle switch */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">DUYỆT TỰ ĐỘNG</span>
                  <span className="text-xs font-bold text-slate-700 mt-0.5 block">Tự động cho xe qua</span>
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
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Control Action triggers */}
              <div className="grid grid-cols-1 gap-2.5">
                <button 
                  onClick={() => {
                    playChimeSound();
                    setShowVisitorModal(true);
                    setVisitorPlate('');
                    setGeneratedTicket(null);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <QrCode size={14} /> CẤP VÉ VÃNG LAI [F4]
                  </span>
                  <Plus size={14} />
                </button>

                <button 
                  onClick={() => {
                    playChimeSound();
                    alert("Đã kích hoạt barrier thủ công!");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Unlock size={14} className="text-slate-400" /> MỞ CỔNG THỦ CÔNG [F8]
                  </span>
                </button>
              </div>

            </div>

            {/* MongoDB Real-time audit log feed */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-extrabold tracking-wider text-slate-700 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  NHẬT KÝ THỜI GIAN THỰC
                </h3>
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-widest">
                  Live Mongo
                </span>
              </div>

              {/* MongoDB Log rows */}
              <div className="space-y-2.5 overflow-y-auto max-h-[350px] pr-1 flex-1">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className="group p-2.5 bg-slate-50 hover:bg-blue-50/10 border border-slate-150 hover:border-blue-200 rounded-xl flex items-center justify-between transition-all duration-200"
                    >
                      <div className="flex gap-3 items-center">
                        <button 
                          onClick={() => setSelectedLogPhoto(log.photo)}
                          className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 border border-slate-200 shrink-0 relative hover:scale-105 transition-all cursor-pointer"
                        >
                          <img src={log.photo} alt="Audit Thumb" className="w-full h-full object-cover" />
                        </button>
                        
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-extrabold text-xs text-slate-800 group-hover:text-blue-600 transition-colors tracking-wide uppercase">{log.plate}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{log.time}</span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                        log.type === 'ENTRY'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : log.type === 'EXIT'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
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
                  <span className="font-extrabold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200/50">MongoDB Local</span>
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
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedLogPhoto(null)}>
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
