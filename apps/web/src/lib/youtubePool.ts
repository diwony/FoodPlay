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

let cache: Promise<PoolVideo[]> | null = null;

export function loadPool(): Promise<PoolVideo[]> {
  if (cache) return cache;
  const url = `${import.meta.env.BASE_URL}youtube-pool.json`;
  cache = fetch(url)
    .then((r) => (r.ok ? (r.json() as Promise<Pool>) : { videos: [] as PoolVideo[] }))
    .then((p) => p.videos ?? [])
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
    .map((v) => {
      const ingHit = v.tags.filter((t) => ing.has(t)).length;
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
