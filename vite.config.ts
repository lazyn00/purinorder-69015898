import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
 build: {
    chunkSizeWarningLimit: 1000, // Vẫn giữ giới hạn cao để tránh warning nhỏ
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
             // Tách tất cả thư viện trong node_modules ra thành file vendor.js riêng
             return 'vendor';
          }
        },
      },
    },
  },
}));
