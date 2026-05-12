import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Reserve Parking', path: '#' },
    { name: 'Parking Status', path: '/status' },
    { name: 'Dashboard', path: '#' },
    { name: 'Contact', path: '#' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 h-20 bg-surface/40 backdrop-blur-2xl border-b border-primary/5">
      <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 h-full">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 logo-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:rotate-6">
              <span className="text-white font-display font-extrabold text-xl tracking-tighter">P</span>
            </div>
            <span className="text-xl font-display font-extrabold tracking-tight text-on-surface">ParkIntel</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-bold transition-all duration-300 relative py-1
                    ${isActive 
                      ? 'text-primary' 
                      : 'text-on-surface-variant hover:text-primary'}`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div 
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="text-xs font-bold text-on-surface-variant hover:text-primary px-4 py-2 transition-colors"
          >
            ĐĂNG NHẬP
          </Link>
          <Link 
            to="/register" 
            className="bg-primary text-white text-[11px] font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all tracking-wider uppercase"
          >
            Đăng ký ngay
          </Link>
        </div>
      </nav>
    </header>
  );
};

// Wrap with motion if needed, but for simplicity let's keep it clean
import { motion } from 'framer-motion';

export default Navbar;
