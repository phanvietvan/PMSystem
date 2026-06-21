import { useState, useEffect } from "react";
import { Alert, BtnPrimary, BtnSecondary, BackLink } from "../../../components/ui/SharedUI";
import { useSettings } from "../../../hooks/useSettings";

interface LockedScreenProps {
  onNavigate: (screen: string) => void;
}

export default function LockedScreen({ onNavigate }: LockedScreenProps) {
  const [secs, setSecs] = useState<number>(899);
  const { language } = useSettings();
  
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
        🔒{" "}
        <span>
          {language === "en" ? (
            <>
              Account temporarily locked due to 5 failed password attempts. Please try again after <strong>{m}:{s}</strong> or reset your password.
            </>
          ) : (
            <>
              Tài khoản tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau <strong>{m}:{s}</strong> hoặc đặt lại mật khẩu.
            </>
          )}
        </span>
      </Alert>
      <BtnPrimary onClick={() => onNavigate("forgot")}>
        {language === "en" ? "Reset password now" : "Đặt lại mật khẩu ngay"}
      </BtnPrimary>
      <BtnSecondary onClick={() => onNavigate("login")}>
        {language === "en" ? "Try again later" : "Thử lại sau"}
      </BtnSecondary>
    </div>
  );
}
