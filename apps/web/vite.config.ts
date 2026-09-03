import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const coreRoot = fileURLToPath(new URL("../../packages/core", import.meta.url));
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

// GitHub Pages project site → https://diwony.github.io/FoodPlay/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === "build" ? "/FoodPlay/" : "/",
  resolve: {
    alias: {
      "@foodplay/core": `${coreRoot}/index.ts`,
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [repoRoot] },
  },
}));
