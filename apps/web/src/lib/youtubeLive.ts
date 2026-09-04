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

export interface LiveVideoMeta {
  id: string;
  title: string;
  channel: string;
  description: string;
  publishedAt: string;
  views: number;
}

const metaCache = new Map<string, Promise<LiveVideoMeta | null>>();

/** 영상 하나의 상세(제목·채널·설명). 프록시 없으면 null. */
export function liveVideoMeta(id: string): Promise<LiveVideoMeta | null> {
  if (!PROXY || !/^[\w-]{11}$/.test(id)) return Promise.resolve(null);
  let p = metaCache.get(id);
  if (!p) {
    p = fetch(`${PROXY}/video?id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: (LiveVideoMeta & { error?: string }) | null) =>
        d && !d.error && d.title ? d : null,
      )
      .catch(() => null);
    metaCache.set(id, p);
  }
  return p;
}

export interface Chapter {
  seconds: number;
  label: string;
}

/**
 * 유튜브 영상 설명글에서 타임스탬프 목록(챕터)을 뽑아낸다.
 * "0:00 인트로", "[1:23] 양념", "12:34 - 마무리" 같은 줄을 인식한다.
 * 2개 미만이면 챕터로 안 친다(빈 배열).
 */
export function parseChapters(description: string): Chapter[] {
  const out: Chapter[] = [];
  for (const raw of (description || "").split(/\r?\n/)) {
    const line = raw.trim();
    const m = line.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!m) continue;
    const [h, mm, ss] =
      m[3] != null ? [+m[1], +m[2], +m[3]] : [0, +m[1], +m[2]];
    const seconds = h * 3600 + mm * 60 + ss;
    let label = line
      .replace(m[0], "")
      .replace(/^[\s\-–—:.)\]}·|►▶*]+/, "")
      .replace(/[\s\-–—:.([{·|]+$/, "")
      .trim();
    if (!label || label.length > 90) label = label.slice(0, 90) || "구간";
    out.push({ seconds, label });
  }
  return out.length >= 2 ? out : [];
}

const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";

/**
 * 타임스탬프가 없는 영상이라도, 설명글에 번호 매긴 조리 순서
 * ("1. 밀가루와 물을 섞는다", "2) 반죽을 냉장 6시간", "①…") 가 있으면 뽑아낸다.
 * 시간 이동은 안 되지만 순서 목록으로는 보여줄 수 있다.
 * 1부터 순차적으로 이어지는 묶음만 인정한다(광고·링크 목록 오탐 방지). 2개 미만이면 빈 배열.
 */
export function parseRecipeSteps(description: string): string[] {
  const found: Array<{ n: number; text: string }> = [];
  for (const raw of (description || "").split(/\r?\n/)) {
    const line = raw.trim();
    const m = line.match(
      new RegExp(`^(?:\\[?(\\d{1,2})\\]?[.)]|([${CIRCLED}]))\\s*(.+)$`),
    );
    if (!m) continue;
    const n = m[1] ? Number(m[1]) : CIRCLED.indexOf(m[2]!) + 1;
    const text = m[3].replace(/https?:\/\/\S+/g, "").trim();
    if (!text || text.length > 200) continue;
    found.push({ n, text });
  }

  const seq: string[] = [];
  let expect = 1;
  for (const s of found) {
    if (s.n === expect) {
      seq.push(s.text);
      expect += 1;
    }
  }
  return seq.length >= 2 ? seq : [];
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
