/**
 * "유튜브에서 더 찾기" 는 런타임에 유튜브 API 를 안 부른다.
 * pipeline/collect-youtube.mjs 가 미리 긁어 둔 정적 풀(public/youtube-pool.json)
 * 을 한 번 받아서, 고른 재료·기분 태그로 걸러 보여준다.
 *
 * 풀을 키우려면: node pipeline/collect-youtube.mjs (다시 돌리면 병합)
 */

export interface PoolVideo {
  id: string;
  title: string;
  channel: string;
  views: number;
  tags: string[];
}

interface Pool {
  collectedAt: string;
  videos: PoolVideo[];
}

/**
 * 요리 콘텐츠가 아닌 게 명백한 제목 — 뮤직비디오·노래·웹툰·예능·리뷰 등.
 * 어느 칸에도(먹방 포함) 넣지 않는다. 수집 파이프라인이 "마라탕 밀키트" 같은
 * 검색어로 긁을 때 딸려온 것들.
 */
const NOT_FOOD_RE =
  /뮤직비디오|뮤비|\bM\/?V\b|\bMV\b|lyric|가사집|공식.{0,6}(뮤|MV)|웹툰|만화영화|애니메이션|\[애니|예고편|트레일러|무한도전|놀면\s?뭐하니|런닝맨|라디오\s?스타|^[가-힣]{1,4}송$|주제가|\bOST\b/i;

/**
 * "이렇게 만들어 먹어요"·레시피 칸에 넣을 자격 — 제목에 조리 신호가 있어야.
 * (먹방·디저트 칸엔 적용 안 함.)
 */
const COOKABLE_RE =
  /만들|만든|만드는|레시피|recipe|끓이|볶|부치|굽|구이|튀기|조리|손질|썰|데치|삶|무침|절임|담그|비법|비결|황금|내는\s?법|맛\s?내는|만드는?\s?법|따라\s?하기|따라하기|집밥|반찬|요리(?!\s?사|왕|연구소)/i;

/** 레시피 칸에서 빼야 하는 제목 — 먹방·예능·후기·근황 등. */
const NOT_RECIPE_RE =
  /먹방|mukbang|asmr|이팅|리얼\s?사운드|eating\s?show|리뷰|후기|근황|브이로그|vlog|언박싱|챌린지|challenge|밀키트\s?출시|가게의?\s?비밀|사장이?\s?(밝히|알려)/i;

/** 일반 요리(레시피) 칸에 어울리는 영상인지. */
export const looksCookable = (title: string) =>
  COOKABLE_RE.test(title) && !NOT_RECIPE_RE.test(title);

let cache: Promise<PoolVideo[]> | null = null;

export function loadPool(): Promise<PoolVideo[]> {
  if (cache) return cache;
  const url = `${import.meta.env.BASE_URL}youtube-pool.json`;
  cache = fetch(url)
    .then((r) => (r.ok ? (r.json() as Promise<Pool>) : { videos: [] as PoolVideo[] }))
    .then((p) => (p.videos ?? []).filter((v) => !NOT_FOOD_RE.test(v.title)))
    .catch(() => []);
  return cache;
}

/** 조회수를 0~1 로 눌러 정렬 보조로. (1000만회 ≈ 1.0) */
const viewSignal = (v: PoolVideo) =>
  Math.min(1, Math.log10(v.views + 1) / 7);

export interface PoolQuery {
  ingredients: string[];
  vibes: string[];
  limit: number;
  /** 이미 큐레이션에 있는 유튜브 ID — 중복 제거용 */
  exclude?: Set<string>;
  /**
   * 영상 종류 (태그 조합으로 거른다):
   * - "recipe"(기본): 먹방·디저트 아닌 일반 요리 영상.
   * - "mukbang": 먹방(`mukbang`)이면서 디저트 아닌 것 — "같이 보는 먹방" 칸.
   * - "dessert": 디저트(`dessert`)이면서 먹방 아닌 것 — 디저트·베이킹 화면.
   * - "dessert-mukbang": 디저트 먹방.
   */
  kind?: "recipe" | "mukbang" | "dessert" | "dessert-mukbang";
  /** 이 태그가 모두 있는 영상만 (예: 베이킹 난이도 "baking-easy"). */
  require?: string[];
}

/**
 * 재료가 있으면 재료 태그가 겹치는 영상, 없으면 기분 태그가 겹치는 영상,
 * 둘 다 없으면 조회수 상위. 같은 채널이 몰리지 않게 흩뿌린다.
 */
export function searchPool(all: PoolVideo[], q: PoolQuery): PoolVideo[] {
  const ing = new Set(q.ingredients);
  const vibes = new Set(q.vibes);
  const wantMukbang = q.kind === "mukbang" || q.kind === "dessert-mukbang";
  const wantDessert = q.kind === "dessert" || q.kind === "dessert-mukbang";
  const require = q.require ?? [];

  const scored = all
    .filter((v) => !q.exclude?.has(v.id))
    .filter(
      (v) =>
        v.tags.includes("mukbang") === wantMukbang &&
        v.tags.includes("dessert") === wantDessert &&
        require.every((t) => v.tags.includes(t)),
    )
    // 일반 요리 칸: 제목에 조리 신호가 있는 것만. (먹방·디저트 칸은 통과)
    .filter((v) => wantMukbang || wantDessert || looksCookable(v.title))
    .map((v) => {
      const tagHit = v.tags.filter((t) => ing.has(t)).length;
      // 태그 사전에 없는 재료(제철 재료처럼 recipes.json·INGREDIENT_GROUPS 밖의
      // 말)는 태그로는 못 잡는다. 제목에 그 재료 이름이 실제로 들어있으면
      // "상관없는 영상"이 아니라 진짜 관련 영상이므로 같이 히트로 친다.
      const titleHit = [...ing].filter(
        (i) => i.length >= 2 && v.title.includes(i),
      ).length;
      const ingHit = tagHit + titleHit;
      const vibeHit = v.tags.filter((t) => vibes.has(t)).length;
      return { v, ingHit, vibeHit };
    });

  let pool: typeof scored;
  if (ing.size > 0) {
    pool = scored.filter((s) => s.ingHit > 0);
    // 고른 재료가 풀에 없으면(직접 입력한 밀키트·재료 등) 기분 태그로 폴백.
    // 그마저 없으면 **빈 배열로 둔다** — 재료와 상관없는 인기 영상을 "이 재료로
    // 나온 요리"처럼 보여주면 안 되므로. 호출부(YouTubeRail 등)가 "유튜브에서
    // 직접 검색" 안내를 대신 띄운다.
    if (pool.length === 0 && vibes.size > 0)
      pool = scored.filter((s) => s.vibeHit > 0);
  } else if (vibes.size > 0) {
    pool = scored.filter((s) => s.vibeHit > 0);
    if (pool.length === 0) pool = scored;
  } else pool = scored;

  pool.sort(
    (a, b) =>
      b.ingHit * 3 + b.vibeHit * 2 + viewSignal(b.v) -
      (a.ingHit * 3 + a.vibeHit * 2 + viewSignal(a.v)),
  );

  // 채널 분산: 같은 채널이 연달아 나오면 감점하며 다시 고른다.
  const out: PoolVideo[] = [];
  const seen = new Map<string, number>();
  const rest = pool.map((s, i) => ({
    s,
    base: s.ingHit * 3 + s.vibeHit * 2 + viewSignal(s.v) - i * 0.001,
  }));
  while (out.length < q.limit && rest.length > 0) {
    let bi = 0;
    let bv = -Infinity;
    for (let i = 0; i < rest.length; i++) {
      const pen = (seen.get(rest[i].s.v.channel) ?? 0) * 0.5;
      const val = rest[i].base - pen;
      if (val > bv) {
        bv = val;
        bi = i;
      }
    }
    const [picked] = rest.splice(bi, 1);
    out.push(picked.s.v);
    seen.set(picked.s.v.channel, (seen.get(picked.s.v.channel) ?? 0) + 1);
  }
  return out;
}
