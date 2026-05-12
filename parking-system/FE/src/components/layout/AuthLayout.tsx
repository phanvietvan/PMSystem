import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface">ParkIntel</span>
          </Link>
          <h2 className="font-headline-xl text-headline-xl text-on-surface mb-2">{title}</h2>
          <p className="text-on-surface-variant font-body-md">{subtitle}</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-3xl shadow-xl shadow-on-surface/5 backdrop-blur-sm">
          {children}
        </div>

        <p className="text-center mt-8 text-on-surface-variant text-body-sm">
          © 2024 ParkIntel Infrastructure. Secure & Intelligent.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
