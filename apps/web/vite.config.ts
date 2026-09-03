import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const coreRoot = fileURLToPath(new URL("../../packages/core", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.FOODPLAY_BASE ?? "/",
  resolve: {
    alias: {
      "@foodplay/core": `${coreRoot}/index.ts`,
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [fileURLToPath(new URL("../..", import.meta.url))] },
  },
});
