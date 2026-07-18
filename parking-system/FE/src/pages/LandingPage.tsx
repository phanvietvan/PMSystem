/**
 * TRANG CHỦ — chỉ lắp ráp (~70 dòng).
 *
 * Tìm chữ UI (vd. "Đặt chỗ"): KHÔNG search trong file này.
 * Mở các file dưới đây (Ctrl+P rồi gõ tên):
 *
 *   components/parking/landing/LandingHero.tsx      → "Đặt chỗ ngay"
 *   components/parking/landing/LandingCta.tsx       → "Bắt đầu Đặt chỗ"
 *   components/parking/landing/LandingHow.tsx       → "Đặt chỗ trước"
 *   components/parking/landing/LandingStats.tsx
 *   components/parking/landing/LandingFeatures.tsx
 *   components/parking/landing/LandingFooter.tsx
 *   components/parking/landing/ActiveSessionModal.tsx
 */
import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import LandingHero from '../components/parking/landing/LandingHero';
import LandingStats from '../components/parking/landing/LandingStats';
import LandingFeatures from '../components/parking/landing/LandingFeatures';
import LandingHow from '../components/parking/landing/LandingHow';
import LandingCta from '../components/parking/landing/LandingCta';
import LandingFooter from '../components/parking/landing/LandingFooter';
import ActiveSessionModal from '../components/parking/landing/ActiveSessionModal';
import { addActiveQr } from '../utils/auth';
import { parkingService } from '../services/parking.service';

const LandingPage = () => {
  const [showActiveWarning, setShowActiveWarning] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    parkingService.getMySession()
      .then((res) => {
        if (!res.data) return;
        if (res.data.hasActiveSession && res.data.session) {
          const sQrCode = res.data.session.qrCode || res.data.session.QrCode;
          if (sQrCode) addActiveQr(sQrCode);
        } else {
          localStorage.removeItem('activeSessionQrs');
          localStorage.removeItem('activeSessionQr');
          setShowActiveWarning(false);
        }
      })
      .catch((err) => console.log('Error syncing active session:', err));
  }, []);

  const warn = () => setShowActiveWarning(true);

  return (
    <>
      <div className="bg-mesh-gradient text-slate-900 antialiased min-h-screen selection:bg-blue-100 font-['Inter'] overflow-x-hidden">
        <Navbar />
        <main className="pt-40 relative">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
          <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-indigo-100/20 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

          <LandingHero onNeedActiveWarning={warn} />
          <LandingStats />
          <LandingFeatures />
          <LandingHow />
          <LandingCta onNeedActiveWarning={warn} />
        </main>
        <LandingFooter />
      </div>
      <ActiveSessionModal open={showActiveWarning} onClose={() => setShowActiveWarning(false)} />
    </>
  );
};

export default LandingPage;
