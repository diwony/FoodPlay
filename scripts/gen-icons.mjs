// Regenerate all app/web icons from the FoodPlay logo mark.
// Run:  node scripts/gen-icons.mjs
// Requires devDependency @resvg/resvg-js.
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const INK = "#1b1b1b"; // near-black icon ground
const YOLK = "#f2a70c";
const SPARK = "#ffd23d";

// The logo mark: a fried egg sitting in a frying pan seen from above, the pan
// doubling as a magnifying glass (thick metal rim, handle to the lower-right
// with a rivet dot). Drawn in a 1024x1024 box, centred on (512, 476).
//
//   tone "dark"  – on the near-black icon ground: grey metal pan, white egg
//   tone "light" – on a pale ground (splash / adaptive fg): same, egg outlined
//   tone "mono"  – one flat colour (`solid`): silhouette for themed icons
function mark({ tone = "dark", solid = "#1b1b1b", scale = 1 } = {}) {
  const cx = 512;
  const cy = 476;

  const rim =
    tone === "mono"
      ? solid
      : "url(#rimGrad)";
  const handle =
    tone === "mono" ? solid : "url(#handleGrad)";
  const lens = tone === "mono" ? solid : "#171717";
  const eggFill = tone === "mono" ? solid : "#fafafa";
  const eggStroke =
    tone === "light" ? '#c9c9c9" stroke-width="6' : 'none" stroke-width="0';
  const yolk = tone === "mono" ? solid : YOLK;
  const spark = tone === "mono" ? solid : SPARK;

  const egg = `M486 356c34 0 59 10 80 32 20 20 24 42 22 64-2 26-10 48-32 66-22 18-44 24-70 24-30 0-56-6-76-28-18-20-24-44-22-66 2-26 10-48 32-68 22-20 40-24 66-24Z`;

  const defs =
    tone === "mono"
      ? ""
      : `<defs>
      <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#8a8a8e"/>
        <stop offset="0.5" stop-color="#5c5c60"/>
        <stop offset="1" stop-color="#37373b"/>
      </linearGradient>
      <linearGradient id="handleGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#67676e"/>
        <stop offset="1" stop-color="#3c3c40"/>
      </linearGradient>
      <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>`;

  // egg group sized/placed to nearly fill the lens
  const eggXf = "translate(502 472) scale(1.52) translate(-486 -452)";

  const shadows =
    tone === "mono"
      ? ""
      : `<ellipse cx="${cx}" cy="${cy + 236}" rx="212" ry="64" fill="#000" opacity="0.33" filter="url(#soft)"/>
         <g transform="${eggXf}"><path d="${egg}" fill="#000" opacity="0.20" filter="url(#soft)" transform="translate(0 16)"/></g>`;

  return `<g transform="translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})">
    ${defs}
    ${shadows}
    <path d="M646 610 796 760" stroke="${handle}" stroke-width="98" stroke-linecap="round"/>
    <circle cx="694" cy="676" r="14" fill="${tone === "mono" ? solid : "#f0f0f0"}"/>
    <circle cx="${cx}" cy="${cy}" r="206" fill="${lens}" stroke="${rim}" stroke-width="70"/>
    ${tone === "mono" ? "" : `<circle cx="${cx}" cy="${cy}" r="172" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="6"/>`}
    <g transform="${eggXf}">
      <path d="${egg}" fill="${eggFill}" stroke="${eggStroke}"/>
      <circle cx="486" cy="448" r="30" fill="${yolk}"/>
      ${tone === "mono" ? "" : `<circle cx="476" cy="438" r="10" fill="${spark}"/>`}
    </g>
  </g>`;
}

function svgDoc(size, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${inner}</svg>`;
}

function render(svg, width, outRel) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } })
    .render()
    .asPng();
  const out = resolve(root, outRel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  console.log("✓", outRel, `(${width}px)`);
}

function writeSvg(svg, outRel) {
  const out = resolve(root, outRel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, svg.trim() + "\n");
  console.log("✓", outRel, "(svg)");
}

// full-bleed dark square + pan (OS masks the corners itself)
function iconSquare() {
  return svgDoc(
    1024,
    `<rect width="1024" height="1024" fill="${INK}"/>` + mark({ scale: 0.9 }),
  );
}

// rounded dark tile — browser tab / apple-touch (no OS masking there)
function tile(size) {
  const r = Math.round(size * 0.22);
  return svgDoc(
    size,
    `<rect width="1024" height="1024" rx="${Math.round(1024 * 0.22)}" fill="${INK}"/>` +
      mark({ scale: 0.92 }),
  );
}

// --- Expo app (root /assets) ---
render(iconSquare(), 1024, "assets/icon.png");
render(
  svgDoc(1024, mark({ tone: "light", scale: 0.72 })),
  1024,
  "assets/splash-icon.png",
);
render(
  svgDoc(1024, `<rect width="1024" height="1024" fill="${INK}"/>`),
  512,
  "assets/android-icon-background.png",
);
render(
  svgDoc(1024, mark({ tone: "dark", scale: 0.62 })),
  512,
  "assets/android-icon-foreground.png",
);
render(
  svgDoc(1024, mark({ tone: "mono", solid: "#000000", scale: 0.62 })),
  432,
  "assets/android-icon-monochrome.png",
);
render(tile(48), 48, "assets/favicon.png");

// --- Web (apps/web/public) ---
render(tile(180), 180, "apps/web/public/apple-touch-icon.png");
render(tile(48), 48, "apps/web/public/favicon.png");

// --- PWA / Android APK(TWA) 아이콘 (apps/web/public) ---
// "any" 아이콘: 둥근 타일. "maskable": OS 가 잘라내므로 안전영역(80%) 안에 마크를 둔다.
render(tile(192), 192, "apps/web/public/pwa-192.png");
render(tile(512), 512, "apps/web/public/pwa-512.png");
render(
  svgDoc(1024, `<rect width="1024" height="1024" fill="${INK}"/>` + mark({ scale: 0.62 })),
  512,
  "apps/web/public/pwa-maskable-512.png",
);

// --- Vector sources ---
writeSvg(tile(64), "apps/web/public/favicon.svg");
writeSvg(
  svgDoc(1024, mark({ tone: "light", scale: 0.9 })),
  "apps/web/public/logo-mark.svg",
);

console.log("done.");
