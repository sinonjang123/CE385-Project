import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Admin back office runs on its own port, separate from the user site (5173).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  preview: {
    port: 4174,
  },
});
