import { useState, useEffect } from "react";
import { Alert, BtnPrimary, BtnSecondary, BackLink } from "../../components/ui/SharedUI";

export default function LockedScreen({ onNavigate }) {
  const [secs, setSecs] = useState(899);
  
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");

  return (
    <div className="slide-in">
      <BackLink onClick={() => onNavigate("login")} />
      <Alert type="error">
        🔒 <span>Tài khoản tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau <strong>{m}:{s}</strong> hoặc đặt lại mật khẩu.</span>
      </Alert>
      <BtnPrimary onClick={() => onNavigate("forgot")}>Đặt lại mật khẩu ngay</BtnPrimary>
      <BtnSecondary onClick={() => onNavigate("login")}>Thử lại sau</BtnSecondary>
    </div>
  );
}