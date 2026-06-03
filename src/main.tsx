// 1. CHÈN THÊM 3 DÒNG NÀY VÀO ĐẦU TIÊN
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

// 2. ĐOẠN CODE CŨ CỦA BẠN GIỮ NGUYÊN PHÍA DƯỚI
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
