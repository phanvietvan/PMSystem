import { useState } from "react";
import { C } from "../../../config/theme";
import { InputField, BtnPrimary, Alert, StepDots, BackLink, StrengthBar, OtpInputRow, ResendTimer } from "../../../components/ui/SharedUI";
import { useSettings } from "../../../hooks/useSettings";

interface ForgotScreenProps {
  onNavigate: (screen: string) => void;
}

export default function ForgotScreen({ onNavigate }: ForgotScreenProps) {
  const [step, setStep] = useState<number>(0);
  const [email, setEmail] = useState<string>("");
  const [emailErr, setEmailErr] = useState<string>("");
  const [pw1, setPw1] = useState<string>("");
  const [pw2, setPw2] = useState<string>("");
  const [pwErr, setPwErr] = useState<string>("");
  const { language } = useSettings();

  const next1 = () => {
    if (!email) {
      setEmailErr(language === "en" ? "Please enter your email." : "Vui lòng nhập email.");
      return;
    }
    setEmailErr("");
    setStep(1);
  };

  const next2 = () => setStep(2);

  const finish = () => {
    if (!pw1 || pw1 !== pw2) {
      setPwErr(language === "en" ? "Passwords do not match." : "Mật khẩu không khớp.");
      return;
    }
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
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.5px", marginBottom: 6 }}>
              {language === "en" ? "Forgot Password? 🔑" : "Quên mật khẩu? 🔑"}
            </h2>
            <p style={{ fontSize: 13, color: C.muted, fontWeight: 300 }}>
              {language === "en" ? "Enter your registered email, we will send an OTP code." : "Nhập email đăng ký, chúng tôi sẽ gửi mã xác thực."}
            </p>
          </div>
          <InputField
            label={language === "en" ? "Registered Email" : "Email đăng ký"}
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={v => { setEmail(v); setEmailErr(""); }}
            icon="✉"
            error={emailErr}
          />
          <BtnPrimary onClick={next1}>
            {language === "en" ? "Send verification code" : "Gửi mã xác thực"}
          </BtnPrimary>
        </div>
      )}

      {step === 1 && (
        <div className="slide-in">
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.5px", marginBottom: 6 }}>
              {language === "en" ? "Enter OTP Code 📨" : "Nhập mã OTP 📨"}
            </h2>
            <p style={{ fontSize: 13, color: C.muted }}>
              {language === "en" ? (
                <>OTP code sent to <strong style={{ color: C.accent2 }}>{email}</strong></>
              ) : (
                <>Mã 6 số đã gửi đến <strong style={{ color: C.accent2 }}>{email}</strong></>
              )}
            </p>
          </div>
          <Alert type="info">
            ⏱{" "}
            <span>
              {language === "en" ? (
                <>Code is valid for <strong>15 minutes</strong>. Do not share this code with anyone.</>
              ) : (
                <>Mã có hiệu lực trong <strong>15 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</>
              )}
            </span>
          </Alert>
          <OtpInputRow onComplete={() => {}} />
          <BtnPrimary onClick={next2}>
            {language === "en" ? "Verify OTP" : "Xác nhận mã OTP"}
          </BtnPrimary>
          <ResendTimer />
        </div>
      )}

      {step === 2 && (
        <div className="slide-in">
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.5px", marginBottom: 6 }}>
              {language === "en" ? "Set New Password 🛡️" : "Đặt mật khẩu mới 🛡️"}
            </h2>
            <p style={{ fontSize: 13, color: C.muted, fontWeight: 300 }}>
              {language === "en" ? "Your new password must be different from previous password." : "Mật khẩu mới phải khác mật khẩu cũ."}
            </p>
          </div>

          <div style={{ marginBottom: 18 }}>
            <InputField
              label={language === "en" ? "New Password" : "Mật khẩu mới"}
              type="password"
              placeholder={language === "en" ? "Minimum 8 characters" : "Tối thiểu 8 ký tự"}
              value={pw1}
              onChange={v => { setPw1(v); setPwErr(""); }}
              icon="🔒"
              showToggle
            />
            <StrengthBar password={pw1} prefix="f" />
          </div>

          <InputField
            label={language === "en" ? "Confirm New Password" : "Xác nhận mật khẩu mới"}
            type="password"
            placeholder={language === "en" ? "Re-enter password" : "Nhập lại mật khẩu"}
            value={pw2}
            onChange={v => { setPw2(v); setPwErr(""); }}
            icon="🔒"
            showToggle
            error={pwErr}
          />
          <BtnPrimary onClick={finish}>
            {language === "en" ? "Reset password" : "Đặt lại mật khẩu"}
          </BtnPrimary>
        </div>
      )}
    </div>
  );
}
