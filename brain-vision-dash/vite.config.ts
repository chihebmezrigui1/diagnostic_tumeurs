import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // tout ce qui commence par /api ira vers Django
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        // si tu avais besoin de réécrire /api -> /, décommente la ligne suivante
        // rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
