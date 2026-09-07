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
const YOLK = "#f6a609";
const SPARK = "#ffd43b";

// The logo mark (a fried egg in a pan seen from above, the pan doubling as a
// magnifying glass with a handle), drawn in a 128x128 box.
// `s` scales it, `x`/`y` translate it, colors are configurable. The egg white
// is stroked in `ring` so it stays legible on light backgrounds; pass
// egg/yolk/spark all equal to `ring` for a solid monochrome silhouette.
function mark({
  ring = INK,
  handle = INK,
  egg = PAPER,
  yolk = YOLK,
  spark = SPARK,
  s = 1,
  x = 0,
  y = 0,
}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="90" y="57" width="34" height="16" rx="8" fill="${handle}"/>
    <circle cx="56" cy="66" r="36" fill="none" stroke="${ring}" stroke-width="8"/>
    <g transform="translate(56 66) scale(1.12) translate(-56 -66)">
      <path d="M56 41C64 41 69 44 74 49 79 54 82 61 83 67 84 74 79 81 73 85 67 89 61 88 55 89 46 90 40 88 36 84 31 79 29 71 30 65 31 57 34 52 39 48 44 44 49 41 56 41Z" fill="${egg}" stroke="${ring}" stroke-width="3.6" stroke-linejoin="round"/>
      <circle cx="52" cy="68" r="13" fill="${yolk}"/>
      <circle cx="46" cy="62" r="4.5" fill="${spark}"/>
    </g>
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
      centeredMark(size, 0.78, { ring: PAPER, handle: PAPER }),
  );
}

// --- Expo app (root /assets) ---
render(
  svgDoc(
    1024,
    `<rect width="1024" height="1024" fill="${INK}"/>` +
      centeredMark(1024, 0.74, { ring: PAPER, handle: PAPER }),
  ),
  1024,
  "assets/icon.png",
);
render(
  svgDoc(1024, centeredMark(1024, 0.4, { ring: INK, handle: INK })),
  1024,
  "assets/splash-icon.png",
);
render(
  svgDoc(512, `<rect width="512" height="512" fill="${ACCENT_SOFT}"/>`),
  512,
  "assets/android-icon-background.png",
);
render(
  svgDoc(512, centeredMark(512, 0.56, { ring: INK, handle: INK })),
  512,
  "assets/android-icon-foreground.png",
);
render(
  svgDoc(
    432,
    centeredMark(432, 0.56, {
      ring: INK,
      handle: INK,
      egg: INK,
      yolk: INK,
      spark: INK,
    }),
  ),
  432,
  "assets/android-icon-monochrome.png",
);
render(tile(48), 48, "assets/favicon.png");

// --- Web (apps/web/public) ---
render(tile(180), 180, "apps/web/public/apple-touch-icon.png");
render(tile(48), 48, "apps/web/public/favicon.png");

console.log("done.");
