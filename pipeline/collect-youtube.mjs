/**
 * 유튜브 관련 영상을 미리 최대한 많이 긁어와 정적 풀로 만든다.
 * (Data API 키 불필요 — fetch-comments 와 같은 공개 innertube 사용)
 *
 *   node pipeline/collect-youtube.mjs            # 기존 풀에 이어서 수집(병합)
 *   node pipeline/collect-youtube.mjs --fresh    # 처음부터 다시
 *
 * 결과: apps/web/public/youtube-pool.json  (배포 시 정적 파일로 서빙)
 * 앱의 "유튜브에서 더 찾기" 칸은 런타임에 유튜브를 안 부르고 이 풀만 읽는다.
 * 정기적으로 다시 돌리면 풀이 계속 커진다("계속 수집").
 *
 * 주의: 비공식 엔드포인트다. 스키마가 바뀌면 파싱이 깨질 수 있다.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ROOT = new URL("..", import.meta.url);
const OUT = new URL("apps/web/public/youtube-pool.json", ROOT);
const fresh = process.argv.includes("--fresh");

const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const CONTEXT = {
  client: { clientName: "WEB", clientVersion: "2.20240101.00.00", hl: "ko", gl: "KR" },
};
// 검색 필터 params: 타입=동영상. (base64 of `\x12\x02\x10\x01`)
const VIDEO_ONLY = "EgIQAQ%3D%3D";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchOnce(query, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(
        "https://www.youtube.com/youtubei/v1/search?key=" + INNERTUBE_KEY,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ context: CONTEXT, query, params: VIDEO_ONLY }),
        },
      );
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(600 * (i + 1));
    }
  }
}

function* walkVideoRenderers(node) {
  if (!node || typeof node !== "object") return;
  if (node.videoRenderer?.videoId) yield node.videoRenderer;
  for (const k of Object.keys(node)) yield* walkVideoRenderers(node[k]);
}

/** "조회수 1,234,567회" / "조회수 2.1만회" / "조회수 3.4천회" → 숫자 */
function parseViews(text) {
  if (!text) return 0;
  const t = text.replace(/조회수|회|,|\s/g, "");
  const m = t.match(/^([\d.]+)(만|천)?/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (m[2] === "만") return Math.round(n * 10_000);
  if (m[2] === "천") return Math.round(n * 1_000);
  return Math.round(n);
}

const ING = [
  "계란", "김치", "대파", "양파", "두부", "감자", "당근", "애호박", "양배추",
  "부추", "미역", "콩나물", "어묵", "참치캔", "떡볶이떡", "버섯", "돼지고기",
  "소고기", "닭", "된장", "고추장", "밥", "스팸", "순두부", "새우", "오징어",
  "가지", "브로콜리", "시금치", "무",
];

const VIBES = [
  ["convenience", "편의점 요리 꿀조합"],
  ["side", "밀키트에 곁들이는 반찬"],
  ["spicy", "매콤한 밥반찬"],
  ["warm", "뜨끈한 국물요리"],
  ["hearty", "든든한 한그릇 요리"],
  ["light", "가볍고 담백한 요리"],
  ["quick", "10분 초간단 자취요리"],
  ["homey", "엄마표 집밥 반찬"],
  ["guests", "손님상 요리 한상차림"],
];

const THEMES = [
  "백종원 레시피", "자취요리 레시피", "에어프라이어 요리", "오늘 저녁 메뉴",
  "밑반찬 만들기", "초간단 요리", "한식 레시피", "혼밥 레시피",
];

// 레시피 결과 옆에 곁들여 보는 "먹방" 칸용. tag 에 "mukbang" 이 붙고,
// 재료·기분 태그도 함께 붙어 고른 조건에 맞게 걸러진다.
const MUKBANG_INGREDIENTS = [
  "김치", "계란", "대파", "두부", "감자", "라면", "떡볶이떡", "돼지고기",
  "소고기", "닭", "어묵", "참치캔", "스팸", "콩나물", "버섯", "청양고추",
];
const MUKBANG_VIBES = [
  ["spicy", "매운 음식 먹방"],
  ["warm", "국물 요리 먹방"],
  ["hearty", "많이 먹는 먹방"],
  ["convenience", "편의점 먹방"],
  ["homey", "집밥 먹방"],
  ["guests", "한상차림 먹방"],
  ["quick", "간단한 한끼 먹방"],
  ["light", "샐러드 먹방"],
  ["side", "반찬 먹방"],
];
const MUKBANG_THEMES = [
  "한식 먹방", "리얼사운드 먹방", "집밥 먹방", "야식 먹방",
];

function buildQueries() {
  const src = JSON.parse(readFileSync(new URL("pipeline/sources.json", ROOT), "utf8"));
  const db = JSON.parse(
    readFileSync(new URL("packages/core/src/data/recipes.json", ROOT), "utf8"),
  );
  const coreByDish = Object.fromEntries(
    db.recipes.map((r) => [r.id, r.coreIngredients]),
  );

  const q = [];
  for (const i of ING) {
    q.push({ query: `${i} 요리`, tags: [i] });
    q.push({ query: `${i} 레시피 만들기`, tags: [i] });
  }
  for (const s of src.sources) {
    const tags = coreByDish[s.id] ?? [];
    q.push({ query: `${s.dish} 만들기`, tags });
    q.push({ query: `${s.dish} 황금레시피`, tags });
  }
  for (const [vibe, phrase] of VIBES) q.push({ query: phrase, tags: [vibe] });
  for (const t of THEMES) q.push({ query: t, tags: [] });

  // 먹방 — "mukbang" 태그 + 재료/기분 태그
  for (const i of MUKBANG_INGREDIENTS)
    q.push({ query: `${i} 먹방`, tags: ["mukbang", i] });
  for (const [vibe, phrase] of MUKBANG_VIBES)
    q.push({ query: phrase, tags: ["mukbang", vibe] });
  for (const t of MUKBANG_THEMES) q.push({ query: t, tags: ["mukbang"] });

  return q;
}

async function main() {
  const pool = new Map();
  if (!fresh && existsSync(OUT)) {
    for (const v of JSON.parse(readFileSync(OUT, "utf8")).videos) {
      pool.set(v.id, { ...v, tags: new Set(v.tags) });
    }
    console.log(`기존 풀 ${pool.size}개에 이어서 수집`);
  }

  const queries = buildQueries();
  let added = 0;
  for (let i = 0; i < queries.length; i++) {
    const { query, tags } = queries[i];
    try {
      const json = await searchOnce(query);
      let n = 0;
      for (const v of walkVideoRenderers(json)) {
        if (n >= 12) break;
        n++;
        const id = v.videoId;
        const title = (v.title?.runs ?? []).map((r) => r.text).join("");
        const channel =
          v.ownerText?.runs?.[0]?.text ??
          v.longBylineText?.runs?.[0]?.text ??
          "";
        const views = parseViews(v.viewCountText?.simpleText);
        if (!id || !title) continue;
        const cur = pool.get(id);
        if (cur) {
          tags.forEach((t) => cur.tags.add(t));
          if (views > cur.views) cur.views = views;
        } else {
          pool.set(id, { id, title, channel, views, tags: new Set(tags) });
          added++;
        }
      }
      process.stdout.write(
        `\r[${i + 1}/${queries.length}] "${query}" → 풀 ${pool.size}   `,
      );
    } catch (e) {
      process.stdout.write(`\r! "${query}" 실패: ${e.message}\n`);
    }
    await sleep(250);
  }

  const videos = [...pool.values()]
    .map((v) => ({
      id: v.id,
      title: v.title,
      channel: v.channel,
      views: v.views,
      tags: [...v.tags].sort(),
    }))
    .sort((a, b) => b.views - a.views);

  writeFileSync(
    OUT,
    JSON.stringify({ collectedAt: new Date().toISOString().slice(0, 10), videos }, null, 1) +
      "\n",
  );
  console.log(`\n📝 ${videos.length}개 영상 (이번에 +${added})`);
}

main();
