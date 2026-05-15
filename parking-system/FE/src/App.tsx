import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ParkingStatus from './pages/ParkingStatus';
import ReservationPage from './pages/ReservationPage';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import GateScanPage from './pages/GateScanPage';
import NavigationPage from './pages/NavigationPage';
import ActiveSessionPage from './pages/ActiveSessionPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminMonitoring from './pages/AdminMonitoring';
import AdminReservations from './pages/AdminReservations';
import AdminReports from './pages/AdminReports';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/monitoring" element={<AdminMonitoring />} />
        <Route path="/admin/reservations" element={<AdminReservations />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        <Route path="/" element={<LandingPage />} />
        <Route path="/status" element={<ParkingStatus />} />
        <Route path="/reserve" element={<ReservationPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/gate-scan" element={<GateScanPage />} />
        <Route path="/navigation" element={<NavigationPage />} />
        <Route path="/active-session" element={<ActiveSessionPage />} />
        
        {/* Premium Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
