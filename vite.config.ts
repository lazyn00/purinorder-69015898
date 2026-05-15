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
  optimizeDeps: {
    include: ['@aws-crypto/sha256-js', '@aws-crypto/sha256-browser']
  },
  build: {
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // NẾU LÀ THƯ VIỆN CRYPTO: Ép gộp chung vào 1 file duy nhất, không xé nhỏ
            if (id.includes("@aws-crypto") || id.includes("crypto")) {
              return "crypto-vendor";
            }
            // Các thư viện khác vẫn tự động tách bình thường
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
  },
}));
