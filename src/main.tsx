// Thêm 3 dòng này lên ĐẦU TIÊN của file src/main.tsx
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
