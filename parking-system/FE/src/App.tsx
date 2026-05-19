import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ParkingStatus from './pages/ParkingStatus';
import ReservationPage from './pages/ReservationPage';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import GateScanPage from './pages/GateScanPage';
import NavigationPage from './pages/NavigationPage';
import ActiveSessionPage from './pages/ActiveSessionPage';
import ContactPage from './pages/ContactPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminMonitoring from './pages/AdminMonitoring';
import AdminReservations from './pages/AdminReservations';
import AdminReports from './pages/AdminReports';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';
import AdminRoute from './components/auth/AdminRoute';
import './index.css';

function ProfileCheckWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const isForceUpdate = 
          !user.firstName || !user.lastName || 
          !user.phoneNumber || !user.licensePlate || 
          !user.vehicleType || !user.address ||
          user.firstName === 'Google' || user.lastName === 'User';
        const publicAuthPaths = ['/login', '/register', '/forgot-password', '/profile'];
        if (isForceUpdate && !publicAuthPaths.includes(location.pathname)) {
          navigate('/profile');
        }
      } catch (e) {
        console.error('Error parsing user in ProfileCheckWrapper', e);
      }
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <ProfileCheckWrapper>
        <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        {/* Admin Dashboard Routes — Admin role only */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/monitoring" element={<AdminRoute><AdminMonitoring /></AdminRoute>} />
        <Route path="/admin/reservations" element={<AdminRoute><AdminReservations /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

        <Route path="/" element={<LandingPage />} />
        <Route path="/status" element={<ParkingStatus />} />
        <Route path="/reserve" element={<ReservationPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/gate-scan" element={<GateScanPage />} />
        <Route path="/navigation" element={<NavigationPage />} />
        <Route path="/active-session" element={<ActiveSessionPage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Premium Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
      </ProfileCheckWrapper>
    </Router>
  );
}

export default App;
