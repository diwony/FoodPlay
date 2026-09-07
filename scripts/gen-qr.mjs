// README 용 QR 코드를 만든다.
// Run:  node scripts/gen-qr.mjs
// Requires devDependency qrcode.
//
//  docs/qr.png / qr.svg      → 웹/PWA 데모 (모든 기기: 브라우저로 열기, iOS·Android 설치 가능)
//  docs/qr-apk.png / .svg    → Android APK 다운로드 (GitHub Releases 최신 버전)
import QRCode from "qrcode";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docs = resolve(root, "docs");
mkdirSync(docs, { recursive: true });

const INK = "#1b1b1b";
const BG = "#ffffff";

const targets = [
  { name: "qr", url: "https://diwony.github.io/FoodPlay/" },
  { name: "qr-apk", url: "https://github.com/diwony/FoodPlay/releases/latest" },
];

for (const { name, url } of targets) {
  const opts = { margin: 1, color: { dark: INK, light: BG } };
  await QRCode.toFile(resolve(docs, `${name}.png`), url, { ...opts, width: 600 });
  const svg = await QRCode.toString(url, { ...opts, type: "svg" });
  writeFileSync(resolve(docs, `${name}.svg`), svg);
  console.log("✓", name, "→", url);
}

console.log("done.");
