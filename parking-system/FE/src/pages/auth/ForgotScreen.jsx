import { useState } from "react";
import { C } from "../../config/theme";
import { InputField, BtnPrimary, Alert, StepDots, BackLink, StrengthBar, OtpInputRow, ResendTimer } from "../../components/ui/SharedUI";

export default function ForgotScreen({ onNavigate }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwErr, setPwErr] = useState("");

  const next1 = () => {
    if (!email) { setEmailErr("Vui lòng nhập email."); return; }
    setEmailErr("");
    setStep(1);
  };

  const next2 = () => setStep(2);

  const finish = () => {
    if (!pw1 || pw1 !== pw2) { setPwErr("Mật khẩu không khớp."); return; }
    setPwErr("");
    onNavigate("fp-success");
  };

  return (
    <div className="slide-in">
      <BackLink onClick={() => step === 0 ? onNavigate("login") : setStep(s => s - 1)} />
      <StepDots total={3} current={step} />

      {step === 0 && (
        <div className="slide-in">
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.5px", marginBottom: 6 }}>Quên mật khẩu? 🔑</h2>
            <p style={{ fontSize: 13, color: C.muted, fontWeight: 300 }}>Nhập email đăng ký, chúng tôi sẽ gửi mã xác thực.</p>
          </div>
          <InputField label="Email đăng ký" type="email" placeholder="email@example.com" value={email} onChange={v => { setEmail(v); setEmailErr(""); }} icon="✉" error={emailErr} />
          <BtnPrimary onClick={next1}>Gửi mã xác thực</BtnPrimary>
        </div>
      )}

      {step === 1 && (
        <div className="slide-in">
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.5px", marginBottom: 6 }}>Nhập mã OTP 📨</h2>
            <p style={{ fontSize: 13, color: C.muted }}>Mã 6 số đã gửi đến <strong style={{ color: C.accent2 }}>{email}</strong></p>
          </div>
          <Alert type="info">⏱ <span>Mã có hiệu lực trong <strong>15 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</span></Alert>
          <OtpInputRow onComplete={() => {}} />
          <BtnPrimary onClick={next2}>Xác nhận mã OTP</BtnPrimary>
          <ResendTimer />
        </div>
      )}

      {step === 2 && (
        <div className="slide-in">
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.5px", marginBottom: 6 }}>Đặt mật khẩu mới 🛡️</h2>
            <p style={{ fontSize: 13, color: C.muted }}>Mật khẩu mới phải khác mật khẩu cũ.</p>
          </div>

          <div style={{ marginBottom: 18 }}>
            <InputField label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" value={pw1} onChange={v => { setPw1(v); setPwErr(""); }} icon="🔒" showToggle />
            <StrengthBar password={pw1} prefix="f" />
          </div>

          <InputField label="Xác nhận mật khẩu mới" type="password" placeholder="Nhập lại mật khẩu" value={pw2} onChange={v => { setPw2(v); setPwErr(""); }} icon="🔒" showToggle error={pwErr} />
          <BtnPrimary onClick={finish}>Đặt lại mật khẩu</BtnPrimary>
        </div>
      )}
    </div>
  );
}