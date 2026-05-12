import { C } from "../../config/theme";

function LeftPanel() {
  return (
    <div style={{ width: "42%", minHeight: "100vh", background: C.surface, position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 40, overflow: "hidden", flexShrink: 0 }}>
      <div className="radial-bg" />
      <div className="grid-bg" />
      
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 60 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 0 20px ${C.accentGlow}` }}>🅿️</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>Park<span style={{ color: C.accent2 }}>Vault</span></span>
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36, lineHeight: 1.15, letterSpacing: "-1px", marginBottom: 16 }}>
          Quản lý bãi xe<br /><span style={{ background: "linear-gradient(90deg, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>thông minh hơn.</span>
        </h1>
        <p style={{ fontSize: 14, color: C.soft, lineHeight: 1.7, maxWidth: 340, fontWeight: 300 }}>Hệ thống vận hành toàn bộ tòa nhà gửi xe — từ cổng vào đến slot, phí và báo cáo — trong một nền tảng duy nhất.</p>
      </div>

      {/* Floating cards */}
      <div className="float-1" style={{ position: "absolute", bottom: 180, right: 30, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", zIndex: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, boxShadow: `0 0 6px ${C.success}` }} /><span style={{ fontSize: 11, color: C.soft }}>Slot khả dụng</span></div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginTop: 4 }}>142 / 200</div>
      </div>

      <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 24 }}>
        {[["98%", "Uptime hệ thống"], ["4s", "Thời gian xử lý xe"], ["AI", "Phân bổ slot tự động"]].map(([num, label]) => (
          <div key={label}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, background: "linear-gradient(90deg, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{num}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuthLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", overflow: "hidden" }}>
      <LeftPanel />
      <div className="right-panel" style={{ flex: 1, minHeight: "100vh", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {children}
        </div>
      </div>
    </div>
  );
}