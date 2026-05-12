import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/login');
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join ParkIntel for a seamless parking experience"
    >
      <form onSubmit={handleRegister} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface-variant block px-1">Full Name</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-md"
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface-variant block px-1">Email Address</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-md"
            placeholder="name@company.com"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface-variant block px-1">Password</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-md"
            placeholder="Min. 8 characters"
          />
        </div>

        <div className="flex items-center gap-3 px-1">
          <input type="checkbox" required className="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary" id="terms" />
          <label htmlFor="terms" className="text-xs text-on-surface-variant leading-tight">
            I agree to the <a href="#" className="text-primary font-bold">Terms of Service</a> and <a href="#" className="text-primary font-bold">Privacy Policy</a>
          </label>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary-container text-on-primary py-4 rounded-xl font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Get Started'}
        </button>

        <div className="text-center">
          <p className="text-on-surface-variant text-body-sm">
            Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;
