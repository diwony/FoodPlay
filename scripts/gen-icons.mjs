// Regenerate all app/web icons from the FoodPlay logo mark.
// Run:  node scripts/gen-icons.mjs
// Requires devDependency @resvg/resvg-js.
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const INK = "#17140f";
const ACCENT = "#e8590c";
const PAPER = "#fbfaf7";
const ACCENT_SOFT = "#fff1e8";

// The logo mark (pan seen from above + play triangle), drawn in a 128x128 box.
// `s` scales it, `x`/`y` translate it, colors are configurable.
function mark({ ring = INK, tri = ACCENT, handle = INK, s = 1, x = 0, y = 0 }) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M46 45 L46 87 L81 66 Z" fill="${tri}"/>
    <rect x="90" y="57" width="34" height="16" rx="8" fill="${handle}"/>
    <circle cx="56" cy="66" r="36" fill="none" stroke="${ring}" stroke-width="8"/>
  </g>`;
}

// Center the 128-box mark inside a `size` canvas, scaled to `frac` of it.
// The handle sticks out to the right, so nudge left a touch to sit on the
// optical centre (the pan circle) rather than the geometric bounding box.
function centeredMark(size, frac, colors) {
  const s = (size * frac) / 128;
  const off = (size - 128 * s) / 2;
  return mark({ ...colors, s, x: off - 7 * s, y: off });
}

function svgDoc(size, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${inner}</svg>`;
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

// tile: rounded dark square + reversed mark — used for favicons / tab icon
function tile(size) {
  const r = Math.round(size * 0.22);
  return svgDoc(
    size,
    `<rect width="${size}" height="${size}" rx="${r}" fill="${INK}"/>` +
      centeredMark(size, 0.62, { ring: PAPER, tri: ACCENT, handle: PAPER }),
  );
}

// --- Expo app (root /assets) ---
render(
  svgDoc(
    1024,
    `<rect width="1024" height="1024" fill="${INK}"/>` +
      centeredMark(1024, 0.6, { ring: PAPER, tri: ACCENT, handle: PAPER }),
  ),
  1024,
  "assets/icon.png",
);
render(
  svgDoc(1024, centeredMark(1024, 0.34, { ring: INK, tri: ACCENT, handle: INK })),
  1024,
  "assets/splash-icon.png",
);
render(
  svgDoc(512, `<rect width="512" height="512" fill="${ACCENT_SOFT}"/>`),
  512,
  "assets/android-icon-background.png",
);
render(
  svgDoc(512, centeredMark(512, 0.52, { ring: INK, tri: ACCENT, handle: INK })),
  512,
  "assets/android-icon-foreground.png",
);
render(
  svgDoc(432, centeredMark(432, 0.52, { ring: INK, tri: INK, handle: INK })),
  432,
  "assets/android-icon-monochrome.png",
);
render(tile(48), 48, "assets/favicon.png");

// --- Web (apps/web/public) ---
render(tile(180), 180, "apps/web/public/apple-touch-icon.png");
render(tile(48), 48, "apps/web/public/favicon.png");

console.log("done.");
