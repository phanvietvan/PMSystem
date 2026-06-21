import { useState } from "react";
import { C } from "../../../config/theme";
import { InputField, BtnPrimary, Alert, StepDots, BackLink, StrengthBar, OtpInputRow, ResendTimer } from "../../../components/ui/SharedUI";
import { useSettings } from "../../../hooks/useSettings";

interface RegisterScreenProps {
  onNavigate: (screen: string) => void;
}

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pw: string;
  pw2: string;
  terms: boolean;
}

export default function RegisterScreen({ onNavigate }: RegisterScreenProps) {
  const [step, setStep] = useState<number>(0);
  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    pw: "",
    pw2: "",
    terms: false
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const { language } = useSettings();

  const set = <K extends keyof RegisterForm>(k: K, v: RegisterForm[K]) => {
    setForm(f => ({ ...f, [k]: v }));
  };
  const setErr = <K extends keyof RegisterForm>(k: K, v: string) => {
    setErrors(e => ({ ...e, [k]: v }));
  };

  const next1 = () => {
    if (!form.email) {
      setErr("email", language === "en" ? "Please enter your email." : "Vui lòng nhập email.");
      return;
    }
    if (form.email === "test@test.com") {
      setErr("email", language === "en" ? "This email is already registered." : "Email này đã được sử dụng.");
      return;
    }
    setErrors({});
    setStep(1);
  };

  const next2 = () => {
    if (!form.pw) {
      setErr("pw", language === "en" ? "Please enter a password." : "Vui lòng nhập mật khẩu.");
      return;
    }
    if (form.pw !== form.pw2) {
      setErr("pw2", language === "en" ? "Passwords do not match." : "Mật khẩu không khớp.");
      return;
    }
    if (!form.terms) {
      setErr("terms", language === "en" ? "Please agree to the terms." : "Vui lòng đồng ý với điều khoản.");
      return;
    }
    setErrors({});
    setStep(2);
  };

  return (
    <div className="slide-in">
      <BackLink onClick={() => step === 0 ? onNavigate("login") : setStep(s => s - 1)} />
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.5px", marginBottom: 6 }}>
          {language === "en" ? "Create Account 🚗" : "Tạo tài khoản 🚗"}
        </h2>
        <p style={{ fontSize: 13, color: C.muted, fontWeight: 300 }}>
          {language === "en" ? "Already have an account? " : "Đã có tài khoản? "}{" "}
          <a onClick={() => onNavigate("login")} style={{ color: C.accent2, fontWeight: 500, cursor: "pointer" }}>
            {language === "en" ? "Login" : "Đăng nhập"}
          </a>
        </p>
      </div>

      <StepDots total={3} current={step} />

      {step === 0 && (
        <div className="slide-in">
          <div style={{ display: "flex", gap: 14 }}>
            <InputField label={language === "en" ? "Last Name" : "Họ"} placeholder={language === "en" ? "Doe" : "Nguyễn"} value={form.lastName} onChange={v => set("lastName", v)} icon="👤" />
            <InputField label={language === "en" ? "First Name" : "Tên"} placeholder={language === "en" ? "John" : "Văn A"} value={form.firstName} onChange={v => set("firstName", v)} icon="✏" />
          </div>
          <InputField label="Email" type="email" placeholder="email@example.com" value={form.email} onChange={v => { set("email", v); setErr("email", ""); }} icon="✉" error={errors.email} />
          <InputField label={language === "en" ? "Phone Number" : "Số điện thoại"} type="tel" placeholder="0912 345 678" value={form.phone} onChange={v => set("phone", v)} icon="📱" />
          <BtnPrimary onClick={next1}>
            {language === "en" ? "Next →" : "Tiếp theo →"}
          </BtnPrimary>
        </div>
      )}

      {step === 1 && (
        <div className="slide-in">
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.soft, marginBottom: 7, letterSpacing: "0.3px", textTransform: "uppercase" }}>
              {language === "en" ? "Password" : "Mật khẩu"}
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.muted }}>🔒</span>
              <InputField type="password" placeholder={language === "en" ? "Minimum 8 characters" : "Tối thiểu 8 ký tự"} value={form.pw} onChange={v => { set("pw", v); setErr("pw", ""); }} icon="🔒" showToggle />
            </div>
            <StrengthBar password={form.pw} />
            {errors.pw && <div style={{ fontSize: 11, color: C.error, marginTop: 4 }}>{errors.pw}</div>}
          </div>

          <InputField label={language === "en" ? "Confirm Password" : "Xác nhận mật khẩu"} type="password" placeholder={language === "en" ? "Re-enter password" : "Nhập lại mật khẩu"} value={form.pw2} onChange={v => { set("pw2", v); setErr("pw2", ""); }} icon="🔒" showToggle error={errors.pw2} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
            <input type="checkbox" checked={form.terms} onChange={e => { set("terms", e.target.checked); setErr("terms", ""); }} style={{ marginTop: 2, accentColor: C.accent, width: 16, height: 16, cursor: "pointer" }} />
            <label style={{ fontSize: 12, color: C.muted, fontWeight: 400, cursor: "pointer", lineHeight: 1.5 }}>
              {language === "en" ? (
                <>I agree to the <a style={{ color: C.accent2 }}>Terms of Service</a> and <a style={{ color: C.accent2 }}>Privacy Policy</a> of ParkVault</>
              ) : (
                <>Tôi đồng ý với <a style={{ color: C.accent2 }}>Điều khoản sử dụng</a> và <a style={{ color: C.accent2 }}>Chính sách bảo mật</a> của ParkVault</>
              )}
            </label>
          </div>
          {errors.terms && <div style={{ fontSize: 11, color: C.error, marginBottom: 12 }}>{errors.terms}</div>}

          <BtnPrimary onClick={next2}>
            {language === "en" ? "Create Account" : "Tạo tài khoản"}
          </BtnPrimary>
        </div>
      )}

      {step === 2 && (
        <div className="slide-in">
          <Alert type="info">
            📬{" "}
            <span>
              {language === "en" ? (
                <>Verification code sent to <strong>{form.email}</strong>. Check inbox/spam.</>
              ) : (
                <>Mã xác thực đã gửi đến <strong>{form.email}</strong>. Kiểm tra hộp thư (cả Spam).</>
              )}
            </span>
          </Alert>
          <OtpInputRow onComplete={() => {}} />
          <BtnPrimary onClick={() => onNavigate("reg-success")}>
            {language === "en" ? "Verify & Finish" : "Xác thực & Hoàn tất"}
          </BtnPrimary>
          <ResendTimer />
        </div>
      )}
    </div>
  );
}
