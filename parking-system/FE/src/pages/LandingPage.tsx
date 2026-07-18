/**
 * TRANG CHỦ — chỉ lắp ráp.
 *
 * Tìm chữ UI: components/parking/landing/*
 */
import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import LandingHero from '../components/parking/landing/LandingHero';
import LandingStats from '../components/parking/landing/LandingStats';
import LandingFeatures from '../components/parking/landing/LandingFeatures';
import LandingHow from '../components/parking/landing/LandingHow';
import LandingCta from '../components/parking/landing/LandingCta';
import LandingFooter from '../components/parking/landing/LandingFooter';
import ActiveSessionModal from '../components/parking/landing/ActiveSessionModal';
import { useMySession } from '../hooks/useMySession';

const LandingPage = () => {
  const [showActiveWarning, setShowActiveWarning] = useState(false);
  useMySession({ onCleared: () => setShowActiveWarning(false) });

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
