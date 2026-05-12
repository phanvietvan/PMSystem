import { useState } from "react";
import { C } from "../../config/theme";
import { InputField, BtnPrimary, Alert, StepDots, BackLink, StrengthBar, OtpInputRow, ResendTimer } from "../../components/ui/SharedUI";

export default function RegisterScreen({ onNavigate }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", pw: "", pw2: "", terms: false });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setErr = (k, v) => setErrors(e => ({ ...e, [k]: v }));

  const next1 = () => {
    if (!form.email) { setErr("email", "Vui lòng nhập email."); return; }
    if (form.email === "test@test.com") { setErr("email", "Email này đã được sử dụng."); return; }
    setErrors({});
    setStep(1);
  };

  const next2 = () => {
    if (!form.pw) { setErr("pw", "Vui lòng nhập mật khẩu."); return; }
    if (form.pw !== form.pw2) { setErr("pw2", "Mật khẩu không khớp."); return; }
    if (!form.terms) { setErr("terms", "Vui lòng đồng ý với điều khoản."); return; }
    setErrors({});
    setStep(2);
  };

  return (
    <div className="slide-in">
      <BackLink onClick={() => step === 0 ? onNavigate("login") : setStep(s => s - 1)} />
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.5px", marginBottom: 6 }}>Tạo tài khoản 🚗</h2>
        <p style={{ fontSize: 13, color: C.muted, fontWeight: 300 }}>
          Đã có tài khoản?{" "}
          <a onClick={() => onNavigate("login")} style={{ color: C.accent2, fontWeight: 500 }}>Đăng nhập</a>
        </p>
      </div>

      <StepDots total={3} current={step} />

      {step === 0 && (
        <div className="slide-in">
          <div style={{ display: "flex", gap: 14 }}>
            <InputField label="Họ" placeholder="Nguyễn" value={form.lastName} onChange={v => set("lastName", v)} icon="👤" />
            <InputField label="Tên" placeholder="Văn A" value={form.firstName} onChange={v => set("firstName", v)} icon="✏" />
          </div>
          <InputField label="Email" type="email" placeholder="email@example.com" value={form.email} onChange={v => { set("email", v); setErr("email", ""); }} icon="✉" error={errors.email} />
          <InputField label="Số điện thoại" type="tel" placeholder="0912 345 678" value={form.phone} onChange={v => set("phone", v)} icon="📱" />
          <BtnPrimary onClick={next1}>Tiếp theo →</BtnPrimary>
        </div>
      )}

      {step === 1 && (
        <div className="slide-in">
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.soft, marginBottom: 7, letterSpacing: "0.3px", textTransform: "uppercase" }}>Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.muted }}>🔒</span>
              <InputField type="password" placeholder="Tối thiểu 8 ký tự" value={form.pw} onChange={v => { set("pw", v); setErr("pw", ""); }} icon="🔒" showToggle />
            </div>
            <StrengthBar password={form.pw} />
            {errors.pw && <div style={{ fontSize: 11, color: C.error, marginTop: 4 }}>{errors.pw}</div>}
          </div>

          <InputField label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu" value={form.pw2} onChange={v => { set("pw2", v); setErr("pw2", ""); }} icon="🔒" showToggle error={errors.pw2} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
            <input type="checkbox" checked={form.terms} onChange={e => { set("terms", e.target.checked); setErr("terms", ""); }} style={{ marginTop: 2, accentColor: C.accent, width: 16, height: 16 }} />
            <label style={{ fontSize: 12, color: C.muted, fontWeight: 400, cursor: "pointer", lineHeight: 1.5 }}>
              Tôi đồng ý với <a style={{ color: C.accent2 }}>Điều khoản sử dụng</a> và <a style={{ color: C.accent2 }}>Chính sách bảo mật</a> của ParkVault
            </label>
          </div>
          {errors.terms && <div style={{ fontSize: 11, color: C.error, marginBottom: 12 }}>{errors.terms}</div>}

          <BtnPrimary onClick={next2}>Tạo tài khoản</BtnPrimary>
        </div>
      )}

      {step === 2 && (
        <div className="slide-in">
          <Alert type="info">
            📬 <span>Mã xác thực đã gửi đến <strong>{form.email}</strong>. Kiểm tra hộp thư (cả Spam).</span>
          </Alert>
          <OtpInputRow onComplete={() => {}} />
          <BtnPrimary onClick={() => onNavigate("reg-success")}>Xác thực & Hoàn tất</BtnPrimary>
          <ResendTimer />
        </div>
      )}
    </div>
  );
}