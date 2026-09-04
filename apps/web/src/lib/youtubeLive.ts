/**
 * 2층 — 실시간 유튜브 검색.
 *
 * 앱은 API 키를 갖지 않는다. Cloudflare Workers 프록시(workers/youtube-search)가
 * 키를 시크릿으로 숨긴 채 YouTube Data API 를 대신 호출하고 24시간 캐시한다.
 * 프록시 URL(`VITE_YT_PROXY_URL`)이 없거나, 호출이 실패/할당량 소진이면 빈
 * 배열을 돌려준다 → 호출부는 미리 수집한 정적 풀(1층, youtubePool.ts)만 쓰면 된다.
 */
import { useEffect, useState } from "react";
import type { PoolVideo } from "./youtubePool";

const PROXY = (import.meta.env.VITE_YT_PROXY_URL as string | undefined)?.replace(
  /\/+$/,
  "",
);

/** 프록시가 설정돼 있어야 실시간 층이 켜진다. */
export const liveEnabled = Boolean(PROXY);

const inflight = new Map<string, Promise<PoolVideo[]>>();

interface ProxyResponse {
  videos?: Array<Omit<PoolVideo, "tags">>;
  quota?: boolean;
}

/** 프록시로 실시간 검색. 실패는 전부 빈 배열로 흡수한다(throw 안 함). */
export function liveSearch(query: string, max = 12): Promise<PoolVideo[]> {
  const q = query.trim();
  if (!PROXY || q.length < 2) return Promise.resolve([]);

  const key = `${q}#${max}`;
  let p = inflight.get(key);
  if (!p) {
    const url = `${PROXY}/search?q=${encodeURIComponent(q)}&max=${max}`;
    p = fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<ProxyResponse>) : null))
      .then((d) =>
        d?.videos?.length
          ? d.videos.map((v) => ({ ...v, tags: [] as string[] }))
          : [],
      )
      .catch(() => [] as PoolVideo[]);
    inflight.set(key, p);
  }
  return p;
}

/**
 * 정적 풀 결과(`hits`) 위에 실시간 결과를 얹어 돌려준다.
 * - 이미 풀에 있거나 제외 목록에 있는 영상은 겹치지 않게 걸러낸다.
 * - 새로 올라온 몇 개는 앞쪽에, 나머지는 뒤에 붙인다.
 * - `liveIds` 는 "실시간" 배지 표시에 쓴다.
 */
export function useLiveMerge(
  query: string,
  hits: PoolVideo[],
  exclude?: Set<string>,
): { merged: PoolVideo[]; liveIds: Set<string> } {
  const [live, setLive] = useState<PoolVideo[]>([]);

  useEffect(() => {
    if (!liveEnabled) return;
    let alive = true;
    liveSearch(query).then((v) => {
      if (alive) setLive(v);
    });
    return () => {
      alive = false;
    };
  }, [query]);

  if (!live.length) return { merged: hits, liveIds: new Set() };

  const have = new Set(hits.map((v) => v.id));
  const fresh = live.filter(
    (v) => !have.has(v.id) && !(exclude?.has(v.id) ?? false),
  );
  if (!fresh.length) return { merged: hits, liveIds: new Set() };

  const liveIds = new Set(fresh.map((v) => v.id));
  const merged = [...fresh.slice(0, 4), ...hits, ...fresh.slice(4)];
  return { merged, liveIds };
}
