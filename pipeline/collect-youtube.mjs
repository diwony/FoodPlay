/**
 * 유튜브 요리·먹방·디저트 영상을 미리 긁어 정적 풀로 만든다.
 * 배포된 앱은 이 풀 파일만 읽고 런타임에 유튜브를 안 부른다.
 *
 * 수집 통로는 두 가지 — 키가 있으면 공식, 없으면 비공식으로 자동 폴백:
 *   • 공식  YouTube Data API v3 (search.list + videos.list)
 *       pipeline/.env 에  YT_API_KEY=AIza...   (또는 환경변수 YT_API_KEY)
 *       무료 하루 10,000유닛, search.list 는 100유닛/회 → 하루 약 95검색.
 *       전체 쿼리는 그보다 많으니 진행 위치를 pipeline/.youtube-progress.json
 *       에 저장하고, 매일 돌리면 남은 지점부터 이어서 풀이 커진다.
 *       403 quotaExceeded 면 그때까지분을 저장하고 깔끔히 멈춘다.
 *   • 비공식 innertube 검색 (키 불필요, fetch-comments 와 같은 엔드포인트)
 *       키가 없으면 이 통로를 쓴다. 비공식이라 스키마가 바뀌면 깨질 수 있다.
 *
 *   node pipeline/collect-youtube.mjs              # 남은 지점부터 이어서(병합)
 *   node pipeline/collect-youtube.mjs --max=120    # 이번 실행 검색 상한(공식 모드)
 *   node pipeline/collect-youtube.mjs --fresh      # 풀·진행상태 초기화
 *
 * 결과: apps/web/public/youtube-pool.json
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ROOT = new URL("..", import.meta.url);
const OUT = new URL("apps/web/public/youtube-pool.json", ROOT);
const PROGRESS = new URL("pipeline/.youtube-progress.json", ROOT);

const argv = process.argv.slice(2);
const fresh = argv.includes("--fresh");
const maxArg = argv.find((a) => a.startsWith("--max="));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 공식 API 키 로드 (있으면 공식 모드, 없으면 innertube 폴백) --------------
function loadApiKey() {
  if (process.env.YT_API_KEY) return process.env.YT_API_KEY.trim();
  const envUrl = new URL("pipeline/.env", ROOT);
  if (existsSync(envUrl)) {
    for (const line of readFileSync(envUrl, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*YT_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  }
  return null;
}
const API_KEY = loadApiKey();
const MODE = API_KEY ? "공식 API" : "innertube";
// 공식 모드 기본 상한은 40 — 하루 10,000유닛 중 ~4,000 만 풀 수집에 쓰고
// 나머지는 실시간 검색 프록시(workers/youtube-search)가 쓰도록 남겨둔다.
// 풀만 빨리 키우고 싶으면 --max=90 처럼 올린다(그날 실시간은 그만큼 준다).
const MAX_SEARCHES = maxArg
  ? Math.max(1, parseInt(maxArg.slice(6), 10) || 1)
  : API_KEY
    ? 40
    : Infinity;

class QuotaError extends Error {}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
}

// --- 공식 YouTube Data API v3 ----------------------------------------------
async function apiSearch(query, tries = 3) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "50");
  url.searchParams.set("regionCode", "KR");
  url.searchParams.set("relevanceLanguage", "ko");
  url.searchParams.set("videoEmbeddable", "true"); // 앱은 iframe 으로 재생
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      return (json.items ?? [])
        .filter((it) => it.id?.videoId && it.snippet?.title)
        .map((it) => ({
          id: it.id.videoId,
          title: decodeEntities(it.snippet.title),
          channel: it.snippet.channelTitle ?? "",
          views: 0, // videos.list 로 따로 채운다
        }));
    }
    const body = await res.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason ?? "";
    // 하루 할당량 소진 — 오늘은 더 못 한다. 저장 후 중단.
    if (res.status === 403 && /quotaExceeded|dailyLimitExceeded/i.test(reason))
      throw new QuotaError(reason);
    // 순간 요청이 몰림 — 100초쯤 쉬면 풀린다. 몇 번 더 시도한다.
    if (res.status === 429 || /rateLimitExceeded|userRateLimitExceeded/i.test(reason)) {
      if (i === tries - 1) throw new QuotaError(reason || "rateLimitExceeded");
      process.stdout.write(`\r… 요청 한도 — ${45 * (i + 1)}초 대기 후 재시도\n`);
      await sleep(45_000 * (i + 1));
      continue;
    }
    if (res.status === 403) throw new Error(`403 ${reason || "forbidden"}`);
    if (i === tries - 1) throw new Error(`${res.status} ${reason}`);
    await sleep(700 * (i + 1));
  }
}

/** videos.list?part=statistics — 1유닛/회, id 50개씩. 새 영상 조회수를 채운다. */
async function apiFillViews(ids, pool) {
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("key", API_KEY);
    url.searchParams.set("part", "statistics");
    url.searchParams.set("id", batch.join(","));
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const reason = body?.error?.errors?.[0]?.reason ?? "";
      if (res.status === 403 && /quota|dailyLimit/i.test(reason))
        throw new QuotaError(reason);
      return; // 통계 실패는 치명적이지 않다 — 조회수 0 으로 둔다
    }
    const json = await res.json();
    for (const it of json.items ?? []) {
      const v = pool.get(it.id);
      if (v) v.views = Number(it.statistics?.viewCount ?? 0);
    }
    await sleep(120);
  }
}

// --- 비공식 innertube (키가 없을 때 폴백) ----------------------------------
const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const CONTEXT = {
  client: { clientName: "WEB", clientVersion: "2.20240101.00.00", hl: "ko", gl: "KR" },
};
const VIDEO_ONLY = "EgIQAQ%3D%3D"; // 검색 필터 params: 타입=동영상

async function innertubeRaw(query, tries = 3) {
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

async function innertubeSearch(query) {
  const json = await innertubeRaw(query);
  const out = [];
  let n = 0;
  for (const v of walkVideoRenderers(json)) {
    if (n >= 12) break;
    n++;
    const id = v.videoId;
    const title = (v.title?.runs ?? []).map((r) => r.text).join("");
    if (!id || !title) continue;
    const channel =
      v.ownerText?.runs?.[0]?.text ?? v.longBylineText?.runs?.[0]?.text ?? "";
    out.push({
      id,
      title,
      channel,
      views: parseViews(v.viewCountText?.simpleText),
    });
  }
  return out;
}

const ING = [
  "계란", "김치", "대파", "양파", "두부", "감자", "당근", "애호박", "양배추",
  "부추", "미역", "콩나물", "어묵", "참치캔", "떡볶이떡", "버섯", "돼지고기",
  "소고기", "닭", "된장", "고추장", "밥", "스팸", "순두부", "새우", "오징어",
  "가지", "브로콜리", "시금치", "무",
];

// 큐레이션 레시피엔 없지만 요즘 유튜브에서 많이 찾는 재료. 칩으로도 노출된다
// (packages/core/src/lib/quickAdd.ts 의 "요즘 뜨는" 그룹과 맞춰 둔다).
const TREND_ING = [
  "분모자", "두부면", "곤약", "쫄면", "대패삼겹살", "우삼겹", "냉동만두",
  "숙주", "청경채", "팽이버섯", "라면사리", "차돌박이", "훈제오리", "가래떡",
  "떡국떡", "알배추", "명란", "부라타치즈", "리코타치즈", "베이컨", "소시지",
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

// 밀키트 종류 — apps/web/src/pages/MealKit.tsx 의 KITS 와 맞춰 둔다.
// 종류를 고르면 그 종류에 맞는 곁들임 반찬·먹방 영상이 나오도록 태그를 붙인다.
const KITS = [
  "밀푀유나베", "부대찌개", "마라탕", "감바스", "샤브샤브", "곱창전골",
  "파스타", "떡볶이", "순두부찌개", "김치찌개", "된장찌개", "야끼우동",
  "짬뽕", "로제파스타", "스키야키", "어묵탕", "불닭볶음면", "우동",
];
// 밀키트에 넣어 푸짐하게/변형하는 흔한 재료. MealKit.tsx BOOSTERS 와 맞춘다.
const KIT_ADDS = [
  "치즈", "크림소스", "계란", "우유", "라면사리", "우동사리", "떡",
  "만두", "숙주", "대파", "베이컨", "마요네즈",
];

// 디저트·베이킹 (apps/web/src/pages/Dessert.tsx). "dessert" 태그가 기본,
// 난이도는 "baking-full"(오븐·계량) / "baking-easy"(노오븐·전자레인지·에어프라이어).
const DESSERT_FULL = [
  ["파운드케이크", "파운드케이크 만들기"],
  ["마들렌", "마들렌 만들기"],
  ["휘낭시에", "휘낭시에 만들기"],
  ["스콘", "스콘 만들기"],
  ["브라우니", "브라우니 만들기"],
  ["컵케이크", "컵케이크 만들기"],
  ["까눌레", "까눌레 만들기"],
  ["시폰케이크", "시폰케이크 만들기"],
  ["바스크치즈케이크", "바스크 치즈케이크 만들기"],
  ["당근케이크", "당근케이크 만들기"],
  ["에그타르트", "에그타르트 만들기"],
  ["버터쿠키", "버터 쿠키 만들기"],
  ["카스텔라", "카스텔라 만들기"],
  ["애플파이", "애플파이 만들기"],
  ["초코칩쿠키", "초코칩 쿠키 만들기"],
];
const DESSERT_EASY = [
  ["우유푸딩", "우유 푸딩 만들기"],
  ["노오븐치즈케이크", "노오븐 치즈케이크 만들기"],
  ["티라미수", "노오븐 티라미수 만들기"],
  ["판나코타", "판나코타 만들기"],
  ["오레오케이크", "전자레인지 오레오 케이크"],
  ["바나나빵", "전자레인지 바나나빵"],
  ["초코무스", "초코 무스 만들기"],
  ["달고나", "달고나 만들기"],
  ["요거트아이스크림", "요거트 아이스크림 만들기"],
  ["딸기라떼", "생딸기 라떼 만들기"],
  ["에어프라이어쿠키", "에어프라이어 쿠키"],
  ["약과", "약과 만들기"],
];
// 요즘 뜨는 / 뜰 것 같은 디저트 (탐색용 칩). 난이도 태그는 안 붙인다.
const DESSERT_TREND = [
  ["두바이초콜릿", "두바이 초콜릿 만들기"],
  ["크로플", "크로플 만들기"],
  ["마리토쪼", "마리토쪼 만들기"],
  ["밤티라미수", "밤 티라미수 만들기"],
  ["약과쿠키", "약과 쿠키 만들기"],
  ["뚱카롱", "뚱카롱 만들기"],
  ["스콘", "겉바속촉 스콘 만들기"],
  ["바스크치즈케이크", "바스크 치즈케이크"],
  ["소금빵", "소금빵 만들기"],
  ["개성주악", "개성주악 만들기"],
];
// 케이크만이 아니라 아이스크림·주스·음료도. "dessert-cold" 태그.
const DESSERT_COLD = [
  ["아이스크림", "집에서 아이스크림 만들기"],
  ["젤라또", "젤라또 만들기"],
  ["소프트아이스크림", "수제 소프트아이스크림"],
  ["생과일주스", "생과일 주스 만들기"],
  ["스무디", "과일 스무디 만들기"],
  ["밀크쉐이크", "밀크쉐이크 만들기"],
  ["팥빙수", "팥빙수 만들기"],
  ["과일빙수", "과일 빙수 만들기"],
  ["에이드", "홈카페 에이드 만들기"],
  ["수제청", "과일청 만들기"],
  ["딸기라떼", "생딸기 라떼 만들기"],
  ["아포가토", "아포가토 만들기"],
  ["요거트볼", "그릭요거트 볼 만들기"],
  ["과일화채", "화채 만들기"],
];
const DESSERT_ING = [
  // 베이킹 재료
  "박력분", "강력분", "버터", "생크림", "크림치즈", "마스카포네", "초콜릿",
  "코코아가루", "커피가루", "견과류", "오레오",
  // 냉장고·서랍에 흔한 것 — "집에 있는 재료로" 가 핵심
  "우유", "계란", "설탕", "꿀", "요거트", "두유", "식빵", "시리얼",
  "미숫가루", "얼음", "잼", "연유", "마시멜로", "젤라틴",
  // 과일
  "딸기", "바나나", "사과", "블루베리", "레몬", "귤", "포도", "냉동과일",
];
const DESSERT_MUKBANG = [
  "디저트 먹방", "베이커리 먹방", "케이크 먹방", "빵 먹방", "마카롱 먹방",
  "쿠키 먹방", "아이스크림 먹방", "빙수 먹방",
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
  for (const i of TREND_ING) {
    q.push({ query: `${i} 요리`, tags: [i] });
    q.push({ query: `${i} 레시피`, tags: [i] });
    q.push({ query: `${i} 먹방`, tags: ["mukbang", i] });
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

  // 밀키트 종류별 — 곁들임 반찬 + 그 밀키트 먹방. 종류 이름을 태그로 붙여
  // MealKit 화면에서 고른 종류로 거를 수 있게 한다.
  for (const k of KITS) {
    q.push({ query: `${k} 밀키트`, tags: [k] });
    q.push({ query: `${k} 먹방`, tags: ["mukbang", k] });
    // 핵심: 이미 있는 밀키트 + 집 재료 → 푸짐하게 / 다른 요리로 변형
    q.push({ query: `${k} 활용 요리`, tags: [k] });
    q.push({ query: `${k} 남은거 활용`, tags: [k] });
    q.push({ query: `${k} 더 맛있게 먹는 법`, tags: [k] });
    q.push({ query: `${k} 푸짐하게`, tags: [k] });
    q.push({ query: `${k} 곁들이는 반찬`, tags: [k, "side"] });
  }
  // 대표 조합 (불닭우동 + 크림소스 → 불닭크림우동 같은)
  for (const k of ["불닭볶음면", "우동", "마라탕", "부대찌개", "짬뽕", "파스타"])
    for (const a of ["치즈", "크림소스", "라면사리", "계란", "우유"])
      q.push({ query: `${k} ${a}`, tags: [k, a] });

  // 디저트·베이킹
  for (const [tag, phrase] of DESSERT_FULL)
    q.push({ query: phrase, tags: ["dessert", "baking-full", tag] });
  for (const [tag, phrase] of DESSERT_EASY)
    q.push({ query: phrase, tags: ["dessert", "baking-easy", tag] });
  for (const [tag, phrase] of DESSERT_TREND)
    q.push({ query: phrase, tags: ["dessert", tag] });
  for (const [tag, phrase] of DESSERT_COLD)
    q.push({ query: phrase, tags: ["dessert", "dessert-cold", tag] });
  for (const i of DESSERT_ING) {
    q.push({ query: `${i} 베이킹`, tags: ["dessert", "baking-full", i] });
    q.push({ query: `${i} 노오븐 디저트`, tags: ["dessert", "baking-easy", i] });
    q.push({ query: `${i} 음료 디저트`, tags: ["dessert", "dessert-cold", i] });
  }
  for (const p of DESSERT_MUKBANG)
    q.push({ query: p, tags: ["dessert", "mukbang"] });
  q.push({ query: "오븐 없이 만드는 디저트", tags: ["dessert", "baking-easy"] });
  q.push({ query: "홈베이킹 초보 레시피", tags: ["dessert", "baking-full"] });
  q.push({ query: "에어프라이어 베이킹", tags: ["dessert", "baking-easy"] });
  q.push({ query: "노오븐 디저트 만들기", tags: ["dessert", "baking-easy"] });
  q.push({ query: "집에서 만드는 음료", tags: ["dessert", "dessert-cold"] });
  q.push({ query: "홈카페 음료 레시피", tags: ["dessert", "dessert-cold"] });

  return q;
}

function savePool(pool) {
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
    JSON.stringify(
      { collectedAt: new Date().toISOString().slice(0, 10), videos },
      null,
      1,
    ) + "\n",
  );
  return videos.length;
}

async function main() {
  const pool = new Map();
  if (!fresh && existsSync(OUT)) {
    for (const v of JSON.parse(readFileSync(OUT, "utf8")).videos)
      pool.set(v.id, { ...v, tags: new Set(v.tags) });
    console.log(`기존 풀 ${pool.size}개에 이어서 수집`);
  }

  const queries = buildQueries();

  // 공식 API 모드는 쿼터 때문에 하루에 다 못 돈다 → 진행 위치를 기억한다.
  let start = 0;
  if (MODE === "공식 API" && !fresh && existsSync(PROGRESS))
    start = JSON.parse(readFileSync(PROGRESS, "utf8")).next ?? 0;
  if (start >= queries.length) {
    start = 0;
    console.log("쿼리 한 바퀴 완료 — 처음부터 다시 돌며 갱신");
  }

  console.log(
    `[${MODE}] 쿼리 ${start + 1}/${queries.length} 부터` +
      (MAX_SEARCHES !== Infinity ? `, 이번 실행 최대 ${MAX_SEARCHES}검색` : ""),
  );

  const newIds = [];
  let searches = 0;
  let quotaHit = false;
  let i = start;
  for (; i < queries.length && searches < MAX_SEARCHES; i++) {
    const { query, tags } = queries[i];
    try {
      const items =
        MODE === "공식 API"
          ? await apiSearch(query)
          : await innertubeSearch(query);
      searches++;
      for (const it of items) {
        const cur = pool.get(it.id);
        if (cur) {
          tags.forEach((t) => cur.tags.add(t));
          if (it.views > cur.views) cur.views = it.views;
        } else {
          pool.set(it.id, { ...it, tags: new Set(tags) });
          newIds.push(it.id);
        }
      }
      process.stdout.write(
        `\r[${i + 1}/${queries.length}] "${query}" → 풀 ${pool.size}   `,
      );
    } catch (e) {
      if (e instanceof QuotaError) {
        quotaHit = true;
        process.stdout.write(`\r⚠ 쿼터 소진 (${e.message}) — 저장 후 중단\n`);
        break;
      }
      process.stdout.write(`\r! "${query}" 실패: ${e.message}\n`);
    }
    await sleep(MODE === "공식 API" ? 150 : 250);
  }

  // 공식 모드: 새로 담은 영상 조회수 채우기 (innertube 는 검색에서 바로 옴)
  if (MODE === "공식 API" && newIds.length) {
    console.log(`\n새 영상 ${newIds.length}개 조회수 조회...`);
    try {
      await apiFillViews(newIds, pool);
    } catch (e) {
      console.log(`조회수 조회 중단: ${e.message} (조회수 0 으로 둠)`);
    }
  }

  const total = savePool(pool);

  if (MODE === "공식 API") {
    writeFileSync(
      PROGRESS,
      JSON.stringify(
        {
          next: i >= queries.length ? 0 : i,
          total: queries.length,
          updatedAt: new Date().toISOString(),
        },
        null,
        2,
      ) + "\n",
    );
  }

  console.log(
    `\n📝 ${total}개 영상 (이번에 +${newIds.length}), 검색 ${searches}회` +
      (MODE === "공식 API" ? ` ≈ ${searches * 100} 유닛` : ""),
  );
  if (MODE === "공식 API") {
    if (quotaHit)
      console.log("내일 다시 실행하면 멈춘 지점부터 이어서 수집합니다.");
    else if (i < queries.length)
      console.log(`다음 실행은 ${i + 1}/${queries.length} 번째 쿼리부터.`);
    else console.log("전체 쿼리 완주 — 다음 실행은 처음부터 갱신합니다.");
  }
}

main();
