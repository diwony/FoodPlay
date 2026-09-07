import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const coreRoot = fileURLToPath(new URL("../../packages/core", import.meta.url));
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

// GitHub Pages project site → https://diwony.github.io/FoodPlay/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // 설치형 웹앱(PWA): iOS 는 Safari "홈 화면에 추가", Android 는 "앱 설치" 배너.
    // 이 매니페스트를 재료로 PWABuilder 가 Android APK(TWA) 를 만든다 — docs/ANDROID-APK.md.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "FoodPlay — 냉장고 재료로 요리 영상 찾기",
        short_name: "FoodPlay",
        description:
          "냉장고에 있는 재료를 넣으면 만들 수 있는 유튜브 요리 영상을 찾아주고, 조리 스텝 타임스탬프로 영상의 그 장면으로 바로 이동하는 앱.",
        lang: "ko",
        dir: "ltr",
        theme_color: "#FBFAF7",
        background_color: "#FBFAF7",
        display: "standalone",
        orientation: "portrait",
        categories: ["food", "lifestyle", "utilities"],
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // youtube-pool.json(1층 풀)은 크고 자주 바뀌므로 프리캐시 대상에서 제외
        globIgnores: ["**/youtube-pool.json"],
        // 모든 딥링크(/yt/:id 포함)를 SPA 셸로 폴백 → React Router 가 처리
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith("youtube-pool.json"),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "youtube-pool" },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
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
