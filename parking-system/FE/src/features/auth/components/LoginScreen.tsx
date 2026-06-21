import { useState } from "react";
import { C } from "../../../config/theme";
import { InputField, BtnPrimary, BtnSecondary } from "../../../components/ui/SharedUI";
import { useSettings } from "../../../hooks/useSettings";

interface LoginScreenProps {
  onNavigate: (screen: string) => void;
}

export default function LoginScreen({ onNavigate }: LoginScreenProps) {
  const [tab, setTab] = useState<number>(0);
  const [email, setEmail] = useState<string>("");
  const [pw, setPw] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { language } = useSettings();

  const handleLogin = () => {
    if (!email || !pw) {
      setError(language === "en" ? "Please enter both email and password." : "Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(language === "en" 
        ? "✅ Login successful!\n→ Navigating to Dashboard based on Role." 
        : "✅ Đăng nhập thành công!\n→ Điều hướng đến Dashboard theo Role."
      );
    }, 900);
  };

  return (
    <div className="slide-in">
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 32, letterSpacing: "-0.8px", marginBottom: 8 }}>
          {language === "en" ? "Welcome Back 👋" : "Chào mừng trở lại 👋"}
        </h2>
        <p style={{ fontSize: 15, color: C.muted, fontWeight: 300 }}>
          {language === "en" ? "Don't have an account? " : "Chưa có tài khoản? "}{" "}
          <a onClick={() => onNavigate("register")} style={{ color: C.accent2, fontWeight: 500, textDecoration: "none", cursor: "pointer" }}>
            {language === "en" ? "Register now" : "Đăng ký ngay"}
          </a>
        </p>
      </div>

      <div style={{ display: "flex", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, marginBottom: 28, gap: 4 }}>
        {[
          language === "en" ? "Personal Account" : "Tài khoản cá nhân",
          language === "en" ? "Staff / Manager" : "Nhân viên / Quản lý"
        ].map((t, i) => (
          <button key={i} className="tab-btn" onClick={() => setTab(i)} style={{
            flex: 1, padding: "10px 14px", border: "none", borderRadius: 7, fontSize: 14, fontWeight: 500,
            background: tab === i ? C.accent : "transparent", color: tab === i ? "white" : C.muted,
            boxShadow: tab === i ? `0 2px 12px ${C.accentGlow}` : "none",
            cursor: "pointer"
          }}>{t}</button>
        ))}
      </div>

      <InputField label="Email" type="email" placeholder="ten@email.com" value={email} onChange={setEmail} icon="✉" />
      <InputField label="Mật khẩu" type="password" placeholder="••••••••" value={pw} onChange={setPw} icon="🔒" showToggle error={error} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <a onClick={() => onNavigate("forgot")} style={{ fontSize: 12, color: C.accent2, textDecoration: "none", cursor: "pointer" }}>
          {language === "en" ? "Forgot password?" : "Quên mật khẩu?"}
        </a>
      </div>

      <BtnPrimary onClick={handleLogin}>{loading ? (language === "en" ? "Logging in..." : "Đang đăng nhập...") : (language === "en" ? "Login" : "Đăng nhập")}</BtnPrimary>

      <BtnSecondary onClick={() => onNavigate("locked")}>
        {language === "en" ? "🔒 Demo: Locked Account (5 wrong attempts)" : "🔒 Demo: Khóa tài khoản (sai 5 lần)"}
      </BtnSecondary>
    </div>
  );
}
