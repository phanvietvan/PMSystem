import { useState } from "react";
import GlobalStyles from "./styles/GlobalStyles";
import AuthLayout from "./components/layout/AuthLayout";
import LoginScreen from "./pages/auth/LoginScreen";
import RegisterScreen from "./pages/auth/RegisterScreen";
import ForgotScreen from "./pages/auth/ForgotScreen";
import LockedScreen from "./pages/auth/LockedScreen";
import { SuccessScreen } from "./components/ui/SharedUI";

export default function App() {
  const [screen, setScreen] = useState("login");

  const renderScreen = () => {
    switch (screen) {
      case "login":
        return <LoginScreen onNavigate={setScreen} />;
      case "register":
        return <RegisterScreen onNavigate={setScreen} />;
      case "forgot":
        return <ForgotScreen onNavigate={setScreen} />;
      case "locked":
        return <LockedScreen onNavigate={setScreen} />;
      case "reg-success":
        return (
          <SuccessScreen 
            icon="✓" 
            title="Đăng ký thành công!" 
            desc="Tài khoản của bạn đã được kích hoạt. Bắt đầu sử dụng ParkVault ngay." 
            btnText="Đăng nhập ngay →" 
            onBtn={() => setScreen("login")} 
          />
        );
      case "fp-success":
        return (
          <SuccessScreen 
            icon="🔓" 
            title="Đặt lại thành công!" 
            desc="Mật khẩu mới đã được cập nhật. Tất cả phiên đăng nhập cũ đã bị hủy." 
            btnText="Đăng nhập lại →" 
            onBtn={() => setScreen("login")} 
          />
        );
      default:
        return <LoginScreen onNavigate={setScreen} />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <AuthLayout>
        {renderScreen()}
      </AuthLayout>
    </>
  );
}