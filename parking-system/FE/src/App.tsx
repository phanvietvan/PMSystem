import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { SettingsProvider } from './hooks/useSettings.tsx';

/* ── Trang mở ── */
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';

/* ── Đặt chỗ / gửi xe ── */
import ParkingStatus from './pages/ParkingStatus';
import ReservationPage from './pages/ReservationPage';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import GateScanPage from './pages/GateScanPage';
import NavigationPage from './pages/NavigationPage';
import ActiveSessionPage from './pages/ActiveSessionPage';
import ReportIncidentPage from './pages/ReportIncidentPage';
import VnPayReturnPage from './pages/VnPayReturnPage';

/* ── Tài khoản & đăng nhập ── */
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

/* ── Quản trị ── */
import AdminDashboard from './pages/AdminDashboard';
import AdminMonitoring from './pages/AdminMonitoring';
import AdminReservations from './pages/AdminReservations';
import AdminReports from './pages/AdminReports';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';
import AdminBlacklist from './pages/AdminBlacklist';
import AdminIncidents from './pages/AdminIncidents';

import AdminRoute from './components/auth/AdminRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './index.css';

/** Bắt buộc cập nhật hồ sơ đủ trước khi dùng các trang khác */
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
    <SettingsProvider>
      <Router>
        <ProfileCheckWrapper>
          <Routes>
            {/* Tài khoản */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Admin — chỉ role Admin */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/monitoring" element={<AdminRoute><AdminMonitoring /></AdminRoute>} />
            <Route path="/admin/reservations" element={<AdminRoute><AdminReservations /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/incidents" element={<AdminRoute><AdminIncidents /></AdminRoute>} />
            <Route path="/admin/blacklist" element={<AdminRoute><AdminBlacklist /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

            {/* Trang mở + đặt chỗ */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/status" element={<ProtectedRoute><ParkingStatus /></ProtectedRoute>} />
            <Route path="/reserve" element={<ProtectedRoute><ReservationPage /></ProtectedRoute>} />
            <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            <Route path="/payment/vnpay-return" element={<VnPayReturnPage />} />
            <Route path="/success" element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
            <Route path="/gate-scan" element={<ProtectedRoute><GateScanPage /></ProtectedRoute>} />
            <Route path="/navigation" element={<ProtectedRoute><NavigationPage /></ProtectedRoute>} />
            <Route path="/active-session" element={<ProtectedRoute><ActiveSessionPage /></ProtectedRoute>} />
            <Route path="/report-incident" element={<ProtectedRoute><ReportIncidentPage /></ProtectedRoute>} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Đăng nhập */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="*" element={<LandingPage />} />
          </Routes>
        </ProfileCheckWrapper>
      </Router>
    </SettingsProvider>
  );
}

export default App;
