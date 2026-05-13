import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Trạng thái', path: '/status' },
    { name: 'Liên hệ', path: '#' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 transition-transform group-hover:rotate-6">
            <span className="text-white font-black text-xl">P</span>
          </div>
          <span className="text-2xl font-['Plus_Jakarta_Sans'] font-extrabold tracking-tighter text-slate-900">ParkIntel</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-semibold transition-all hover:scale-105 transform duration-200 relative
                  ${isActive 
                    ? 'text-blue-600' 
                    : 'text-slate-500 hover:text-blue-600'}`}
              >
                {link.name}
                {isActive && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="hidden sm:block text-sm font-bold text-slate-700 hover:text-blue-600 uppercase tracking-wider px-4 py-2 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link 
            to="/register" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 px-6 rounded-xl shadow-xl shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 active:scale-95 uppercase tracking-wider"
          >
            Đăng ký ngay
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
