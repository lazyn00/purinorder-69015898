// 1. CHÈN THÊM 3 DÒNG NÀY VÀO ĐẦU TIÊN
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

// 2. ĐOẠN CODE CŨ CỦA BẠN GIỮ NGUYÊN PHÍA DƯỚI
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Hiệu ứng âm thanh click nhỏ nhẹ (toggle qua localStorage 'sfx' = 'off' để tắt)
let audioCtx: AudioContext | null = null;
const playClickSound = () => {
  if (localStorage.getItem('sfx') === 'off') return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } catch {}
};
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t?.closest('button, a, [role="button"]')) playClickSound();
}, { passive: true });

createRoot(document.getElementById("root")!).render(<App />);
