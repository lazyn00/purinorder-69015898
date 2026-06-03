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
// Thay thế hàm playClickSound cũ bằng đoạn này:

const playClickSound = () => {
  if (localStorage.getItem('sfx') === 'off') return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx;
    
    // Tạo 2 lớp sóng để tiếng nghe "dày" và dễ thương hơn
    const createTone = (freq: number, time: number, type: OscillatorType) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq / 2, ctx.currentTime + time);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + time);
    };

    // Tiếng búng cao (độ cao 1200Hz)
    createTone(1200, 0.05, 'sine');
    // Tiếng trầm nhẹ tạo độ ấm (độ cao 600Hz)
    createTone(600, 0.08, 'triangle');
  } catch {}
};
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t?.closest('button, a, [role="button"]')) playClickSound();
}, { passive: true });

createRoot(document.getElementById("root")!).render(<App />);
