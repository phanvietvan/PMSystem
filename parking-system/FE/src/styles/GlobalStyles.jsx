import { useEffect } from "react";
import { C, FONT_URL } from "../config/theme";

export default function GlobalStyles() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URL;
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', sans-serif; background: ${C.bg}; color: ${C.text}; }
      input { font-family: 'DM Sans', sans-serif; }
      button { font-family: 'DM Sans', sans-serif; cursor: pointer; }
      a { cursor: pointer; }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-8px); }
      }
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.3); }
        50%      { box-shadow: 0 0 0 12px rgba(52,211,153,0); }
      }
      @keyframes shine {
        100% { transform: translateX(100%); }
      }

      .slide-in { animation: slideIn 0.35s ease both; }
      .float-1  { animation: float 4s ease-in-out infinite; }
      .float-2  { animation: float 4s ease-in-out 1.5s infinite; }
      .pulse-icon { animation: pulse 2s ease-in-out infinite; }

      .grid-bg {
        position: absolute; inset: 0; pointer-events: none;
        background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
        background-size: 40px 40px;
      }
      .radial-bg {
        position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(ellipse 60% 50% at 20% 20%, rgba(59,130,246,0.18) 0%, transparent 60%),
                    radial-gradient(ellipse 40% 60% at 80% 80%, rgba(6,182,212,0.12) 0%, transparent 60%);
      }

      input[type=text]:focus, input[type=email]:focus, input[type=password]:focus, input[type=tel]:focus {
        border-color: ${C.accent} !important;
        box-shadow: 0 0 0 3px ${C.accentGlow} !important;
        outline: none;
      }

      .btn-primary:hover  { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(59,130,246,0.45) !important; }
      .btn-primary:active { transform: translateY(0); }
      .btn-secondary:hover { border-color: ${C.accent} !important; color: ${C.accent2} !important; }
      .tab-btn:hover { background: rgba(59,130,246,0.1); }
      .back-link:hover { color: ${C.text} !important; }
      .right-panel::-webkit-scrollbar { width: 4px; }
      .right-panel::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }

      .bg-mesh-gradient {
        background-color: #f8fafc;
        background-image: 
          radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.1) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.1) 0px, transparent 50%);
      }
      
      .glass-card {
        background: rgba(255, 255, 255, 0.45);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
      }

      .glow-border {
        position: relative;
      }
      .glow-border::after {
        content: "";
        position: absolute;
        inset: -1px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(99, 102, 241, 0.5), transparent 70%);
        border-radius: inherit;
        z-index: -1;
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: exclude;
        pointer-events: none;
      }

      .otp-input {
        width: 52px !important; height: 56px !important;
        text-align: center !important;
        font-family: 'Syne', sans-serif !important;
        font-size: 22px !important; font-weight: 700 !important;
        padding: 0 !important; border-radius: 10px !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);
  return null;
}