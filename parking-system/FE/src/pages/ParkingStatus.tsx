import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const ParkingStatus = () => {
  const [selectedLevel, setSelectedLevel] = useState(3);
  const levels = [6, 5, 4, 3, 2, 1];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Navigation Bar */}
      <nav className="bg-surface/40 backdrop-blur-xl border-b border-white/20 fixed full-width top-0 w-full z-50 h-20">
        <div className="flex justify-between items-center w-full max-w-container-max mx-auto px-margin-edge h-full">
          <div className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight">ParkIntel</div>
          <div className="hidden md:flex items-center gap-10 h-full">
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md font-medium" to="/">Home</Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md font-medium" to="#">Reserve</Link>
            <Link className="text-primary font-bold border-b-2 border-primary pb-1 font-body-md text-body-md" to="/status">Status</Link>

            <a className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md font-medium" href="#">Dashboard</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md font-medium" href="#">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-4 py-2 text-on-surface-variant font-medium text-body-md hover:text-primary transition-all">Login</Link>
            <Link to="/register" className="px-6 py-2.5 bg-primary text-on-primary font-semibold text-body-md rounded-xl hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all">Register</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-container-max mx-auto px-margin-edge py-16 pt-36">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.2em] mb-3 block font-bold">Live Operations</span>
            <h1 className="font-display-lg text-display-lg text-on-surface mb-3 tracking-tight">Parking Status</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">Real-time occupancy monitoring for the Central Plaza facility. Select a floor level to visualize current slot availability and metrics.</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-end"
          >
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-10 bg-white/60 backdrop-blur-xl border border-white/30 shadow-xl">
              <div className="text-center">
                <span className="block font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase font-bold opacity-70">Total Capacity</span>
                <span className="block font-headline-xl text-headline-xl text-on-surface">360</span>
              </div>
              <div className="w-px h-12 bg-outline-variant/40"></div>
              <div className="text-center">
                <span className="block font-label-caps text-[10px] text-on-surface-variant mb-1 uppercase font-bold opacity-70">Available Now</span>
                <span className="block font-headline-xl text-headline-xl text-primary font-bold">214</span>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Left Sidebar: Floor Selector */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="glass-panel rounded-2xl p-6 bg-white/60 backdrop-blur-xl border border-white/30 shadow-lg">
              <h3 className="font-headline-lg text-[20px] mb-8 font-bold text-on-surface">Floor Level</h3>
              <div className="space-y-3">
                {levels.map((level) => (
                  <button 
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 transform
                      ${selectedLevel === level 
                        ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.02] font-bold' 
                        : 'hover:bg-white/50 text-on-surface-variant font-medium'}`}
                  >
                    <span className="flex items-center gap-4 font-body-md">
                      <span className={`material-symbols-outlined ${selectedLevel === level ? 'text-white' : 'text-outline'}`}>layers</span>
                      Level {level}
                    </span>
                    {level === 6 && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${selectedLevel === level ? 'bg-white/20' : 'bg-outline-variant/30'}`}>Rooftop</span>}
                    {level === 1 && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${selectedLevel === level ? 'bg-white/20' : 'bg-outline-variant/30'}`}>Lobby</span>}
                    {selectedLevel === level && <span className="material-symbols-outlined text-sm">verified</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend Card */}
            <div className="glass-panel rounded-2xl p-6 bg-white/60 backdrop-blur-xl border border-white/30 shadow-lg">
              <h4 className="font-label-caps text-[10px] text-on-surface-variant mb-6 uppercase tracking-widest font-bold opacity-60">Status Legend</h4>
              <div className="space-y-4">
                {[
                  { label: 'Available', color: 'border-2 border-primary bg-primary/5' },
                  { label: 'Occupied', color: 'bg-outline-variant/40' },
                  { label: 'Reserved', color: 'bg-gradient-to-br from-primary-container to-primary shadow-sm' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-md ${item.color}`}></div>
                    <span className="font-body-sm text-body-sm font-medium">{item.label}</span>
                  </div>
                ))}
                <div className="pt-6 mt-2 border-t border-white/30 space-y-4">
                  <div className="flex items-center gap-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">ev_station</span>
                    <span className="font-body-sm text-body-sm font-medium">EV Charging</span>
                  </div>
                  <div className="flex items-center gap-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">accessible</span>
                    <span className="font-body-sm text-body-sm font-medium">ADA Accessible</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Content: Map & Grid */}
          <div className="lg:col-span-9 space-y-6">
            {/* Toolbar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/60 backdrop-blur-xl border border-white/30 shadow-lg"
            >
              <div className="flex items-center gap-4 text-on-surface">
                <span className="font-headline-lg text-headline-lg font-extrabold tracking-tight">Level {selectedLevel}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/40"></span>
                <span className="font-body-md font-medium text-primary">42 / 60 Slots Free</span>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-grow">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                  <input 
                    className="w-full md:w-72 pl-11 pr-4 py-2.5 bg-white/40 border border-white/20 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-body-sm transition-all" 
                    placeholder="Find slot ID (e.g. A1)..." 
                    type="text"
                  />
                </div>
                <button className="p-2.5 bg-white/40 border border-white/20 rounded-xl hover:bg-white/60 transition-all text-on-surface-variant shadow-sm active:scale-95">
                  <span className="material-symbols-outlined">tune</span>
                </button>
              </div>
            </motion.div>

            {/* Parking Grid Canvas */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedLevel}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="glass-panel rounded-3xl p-10 shadow-xl bg-white/60 backdrop-blur-xl border border-white/30"
              >
                <div className="grid grid-cols-5 md:grid-cols-10 gap-5">
                  {/* Zone A */}
                  <div className="col-span-full mb-4 border-b border-outline-variant/20 pb-3">
                    <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest font-bold">Zone A • Premium Bay</span>
                  </div>
                  {['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'].map((id, i) => {
                    const isOccupied = [1, 4, 8, 9].includes(i);
                    const isReserved = i === 2;
                    return (
                      <motion.div 
                        key={id}
                        whileHover={!isOccupied ? { y: -4, scale: 1.02 } : {}}
                        className={`group relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300
                          ${isOccupied ? 'bg-outline-variant/10 border border-white/30 cursor-not-allowed opacity-40' : 
                            isReserved ? 'bg-gradient-to-br from-primary-container to-primary shadow-lg shadow-primary/20 z-10' : 
                            'border-2 border-primary/40 bg-white/60 cursor-pointer hover:shadow-xl hover:shadow-primary/10'}`}
                      >
                        <span className={`font-data-mono font-bold text-lg ${isReserved ? 'text-on-primary' : isOccupied ? 'text-on-surface-variant' : 'text-primary'}`}>{id}</span>
                        {id === 'A1' && <span className="material-symbols-outlined text-primary text-[14px] absolute top-1.5 right-1.5 opacity-60">ev_station</span>}
                        {id === 'A6' && <span className="material-symbols-outlined text-primary text-[14px] absolute top-1.5 right-1.5 opacity-60">accessible</span>}
                      </motion.div>
                    );
                  })}

                  {/* Zone B */}
                  <div className="col-span-full mt-10 mb-4 border-b border-outline-variant/20 pb-3">
                    <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest font-bold">Zone B • Standard Bay</span>
                  </div>
                  {['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'].map((id, i) => {
                    const isOccupied = [2, 6, 7].includes(i);
                    return (
                      <motion.div 
                        key={id}
                        whileHover={!isOccupied ? { y: -4, scale: 1.02 } : {}}
                        className={`group aspect-square rounded-xl flex items-center justify-center transition-all duration-300
                          ${isOccupied ? 'bg-outline-variant/10 border border-white/30 cursor-not-allowed opacity-40' : 
                            'border-2 border-primary/40 bg-white/60 cursor-pointer hover:shadow-xl'}`}
                      >
                        <span className={`font-data-mono font-bold text-lg ${isOccupied ? 'text-on-surface-variant' : 'text-primary'}`}>{id}</span>
                      </motion.div>
                    );
                  })}

                  {/* Zone C */}
                  <div className="col-span-full mt-10 mb-4 border-b border-outline-variant/20 pb-3">
                    <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest font-bold">Zone C • General Bay</span>
                  </div>
                  {['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'].map((id, i) => {
                    const isOccupied = [1, 4, 7].includes(i);
                    const isReserved = i === 3;
                    return (
                      <motion.div 
                        key={id}
                        whileHover={!isOccupied ? { y: -4, scale: 1.02 } : {}}
                        className={`group aspect-square rounded-xl flex items-center justify-center transition-all duration-300
                          ${isOccupied ? 'bg-outline-variant/10 border border-white/30 cursor-not-allowed opacity-40' : 
                            isReserved ? 'bg-gradient-to-br from-primary-container to-primary shadow-lg shadow-primary/20' : 
                            'border-2 border-primary/40 bg-white/60 cursor-pointer hover:shadow-xl'}`}
                      >
                        <span className={`font-data-mono font-bold text-lg ${isReserved ? 'text-on-primary' : isOccupied ? 'text-on-surface-variant' : 'text-primary'}`}>{id}</span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Floor Plan Graphic Overlay */}
                <div className="mt-16 flex justify-center">
                  <div className="relative w-full max-w-4xl h-72 bg-slate-900/5 rounded-2xl overflow-hidden border border-white/40 blueprint-grid flex items-center justify-center group/blueprint shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent"></div>
                    <div className="relative z-10 text-center animate-pulse">
                      <span className="material-symbols-outlined text-7xl text-primary/30">map</span>
                      <p className="font-label-caps text-[11px] mt-4 tracking-[0.3em] font-bold text-primary opacity-60 uppercase">Architectural Data Stream Active</p>
                    </div>
                    {/* Decorative UI elements */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-primary/20"></div>
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r border-primary/20"></div>
                    <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
                    <img 
                      alt="Floor Plan Overlay" 
                      className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20 transition-opacity duration-700 group-hover/blueprint:opacity-30" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDK_KaBtNJ6OzrQVAXt0zIJJDvnrodPruko3R_Qr5Y6FTWXrV1WMtwArpqr_jwmlGE3GDmX_UIOZAhsVtfTmA8Gr4IvN1joPTxAqoqOMmq6tw4OvkWZC10QMqOY3EXjlFZ5WWXTejudIi-hvT3ivC-nviDgFMx5TwG7-s1FWV2HSbK8aZtnWBYyJcOwSn_BLpsG5oZryYWszDQEWO_AGEbASyeYZCN2SaU5aysHyFaTn1ivc8zFGIvLnIkHLNWER97efr0wy7jB_g"
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/30 backdrop-blur-md border-t border-white/20 mt-section-gap">
        <div className="w-full max-w-container-max mx-auto px-margin-edge py-16 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tight">ParkIntel</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant font-medium opacity-70">© 2024 ParkIntel Infrastructure Systems. Secure & Intelligent.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-10">
            {['Privacy Policy', 'Terms of Service', 'Accessibility', 'Cookie Settings'].map(link => (
              <a key={link} className="font-body-sm text-body-sm font-semibold text-on-surface-variant hover:text-primary transition-all" href="#">{link}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        .blueprint-grid {
          background-size: 30px 30px;
          background-image:
            linear-gradient(to right, rgba(0, 80, 203, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 80, 203, 0.05) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
};

export default ParkingStatus;
