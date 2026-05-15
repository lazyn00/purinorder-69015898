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
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500, // Tăng giới hạn cảnh báo để không bị báo đỏ
    rollupOptions: {
      output: {
        // Thay vì tự động xé nhỏ mọi thứ bằng manualChunks, chúng ta dùng cơ chế gom nhóm lớn an toàn của Rollup
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        }
      },
    },
  },
}));
