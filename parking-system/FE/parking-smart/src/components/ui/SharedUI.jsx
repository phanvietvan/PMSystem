import { useState, useEffect, useRef } from "react";
import { C } from "../../config/theme";

export function InputField({ label, type = "text", placeholder, value, onChange, icon, error, showToggle, id }) {
  const [show, setShow] = useState(false);
  const inputType = showToggle ? (show ? "text" : "password") : type;

  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.soft, marginBottom: 7, letterSpacing: "0.3px", textTransform: "uppercase" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.muted, pointerEvents: "none" }}>
          {icon}
        </span>
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%", background: C.surface,
            border: `1px solid ${error ? C.error : C.border}`,
            borderRadius: 8, color: C.text, fontSize: 14, fontWeight: 400,
            padding: "12px 14px 12px 42px", transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
        {showToggle && (
          <button onClick={() => setShow(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, fontSize: 14, padding: 0, transition: "color 0.2s" }}>
            {show ? "🙈" : "👁"}
          </button>
        )}
      </div>
      {error && <div style={{ fontSize: 11, color: C.error, marginTop: 5 }}>{error}</div>}
    </div>
  );
}

export function BtnPrimary({ children, onClick, style = {} }) {
  return (
    <button className="btn-primary" onClick={onClick} style={{
      width: "100%", padding: "14px", background: "linear-gradient(135deg, #3b82f6, #2563eb)",
      border: "none", borderRadius: 8, color: "white", fontSize: 14, fontWeight: 600,
      transition: "all 0.2s", boxShadow: `0 4px 20px ${C.accentGlow}`,
      letterSpacing: "0.2px", position: "relative", overflow: "hidden", ...style,
    }}>
      {children}
    </button>
  );
}

export function BtnSecondary({ children, onClick }) {
  return (
    <button className="btn-secondary" onClick={onClick} style={{
      width: "100%", padding: "13px", background: "transparent",
      border: `1px solid ${C.border}`, borderRadius: 8, color: C.soft,
      fontSize: 14, fontWeight: 500, transition: "all 0.2s", marginTop: 10,
    }}>
      {children}
    </button>
  );
}

export function Alert({ type = "info", children }) {
  const colors = {
    info:    { bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.2)",  color: "#93c5fd" },
    success: { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)",  color: "#6ee7b7" },
    error:   { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.2)", color: "#fca5a5" },
    warn:    { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)",  color: "#fde68a" },
  };
  const c = colors[type];
  return (
    <div style={{ borderRadius: 8, padding: "12px 14px", fontSize: 12, display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20, lineHeight: 1.5, background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      {children}
    </div>
  );
}

export function StepDots({ total, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 8, borderRadius: 4,
          width: i === current ? 24 : 8,
          background: i < current ? C.success : i === current ? C.accent : C.border,
          boxShadow: i === current ? `0 0 8px ${C.accentGlow}` : "none",
          transition: "all 0.3s",
        }} />
      ))}
    </div>
  );
}

export function BackLink({ onClick }) {
  return (
    <button className="back-link" onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 13, marginBottom: 28, background: "none", border: "none", padding: 0, transition: "color 0.2s" }}>
      ← Quay lại
    </button>
  );
}

export function StrengthBar({ password, prefix = "s" }) {
  const calc = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const score = calc(password);
  const colors = ["#f87171", "#fbbf24", "#60a5fa", "#34d399"];
  const labels = ["Rất yếu", "Trung bình", "Khá mạnh", "Rất mạnh"];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score - 1] : C.border, transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: password ? colors[score - 1] : C.muted, marginTop: 4 }}>
        {password ? labels[score - 1] : "Nhập mật khẩu để kiểm tra độ mạnh"}
      </div>
    </div>
  );
}

export function OtpInputRow({ onComplete }) {
  const [vals, setVals] = useState(["", "", "", "", "", ""]);
  const refs = useRef([]);

  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...vals];
    next[i] = v;
    setVals(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (next.every(x => x) && onComplete) onComplete(next.join(""));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !vals[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "24px 0" }}>
      {vals.map((v, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          className="otp-input"
          type="text"
          maxLength={1}
          value={v}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
        />
      ))}
    </div>
  );
}

export function ResendTimer({ onResend }) {
  const [secs, setSecs] = useState(0);

  const start = () => {
    setSecs(60);
    onResend?.();
  };

  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  return (
    <div style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: 16 }}>
      Chưa nhận được?{" "}
      <button onClick={start} disabled={secs > 0} style={{ background: "none", border: "none", color: secs > 0 ? C.muted : C.accent2, fontSize: 12, fontWeight: 500, cursor: secs > 0 ? "default" : "pointer" }}>
        {secs > 0 ? `Gửi lại (${secs}s)` : "Gửi lại"}
      </button>
    </div>
  );
}

export function SuccessScreen({ icon, title, desc, btnText, onBtn }) {
  return (
    <div className="slide-in" style={{ textAlign: "center" }}>
      <div className="pulse-icon" style={{ width: 72, height: 72, background: "rgba(52,211,153,0.12)", border: "2px solid rgba(52,211,153,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px" }}>
        {icon}
      </div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.5px", marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: 13, color: C.soft, marginBottom: 28, lineHeight: 1.6 }}>{desc}</p>
      <BtnPrimary onClick={onBtn}>{btnText}</BtnPrimary>
    </div>
  );
}