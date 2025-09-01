import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const CLIENT_PORT = Number(process.env.CLIENT_PORT) || 5173;
const SERVER_JS_PORT = Number(process.env.SERVER_JS_PORT) || 3000;

export default defineConfig({
  clearScreen: false,
  plugins: [react()],
  server: {
    port: CLIENT_PORT,
    proxy: {
      "/api": `http://localhost:${SERVER_JS_PORT}`,
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
