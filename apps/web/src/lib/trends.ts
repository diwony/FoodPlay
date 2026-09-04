/**
 * 트렌드 목록(core/trends.ts)을 실제 데이터로 재정렬한다.
 *
 * - 1층: 미리 모아둔 영상 풀(11,000+개) 제목에 키워드를 매칭해 조회수 합으로 랭킹.
 *   특정 유튜버가 아니라 "요리(메뉴)" 단위라 백종원 쏠림이 없다.
 * - 2층: 프록시(VITE_YT_PROXY_URL)가 있으면 대표 항목을 실시간 유튜브로도 확인해
 *   조회수를 갱신한다. 없거나 실패하면 1층 값 그대로.
 */

import {
  TREND_ITEMS,
  trendKeywords,
  type TrendItem,
} from "@foodplay/core";
import { loadPool, looksCookable, type PoolVideo } from "./youtubePool";
import { liveEnabled, liveSearch } from "./youtubeLive";

export interface RankedTrend extends TrendItem {
  /** 이 요리로 나온 대표 영상 (조회수 순) */
  videos: PoolVideo[];
  /** 풀에서 이 요리 관련 영상 조회수 합 */
  poolViews: number;
  /** 화면에 보여줄 대표 조회수 (실시간이 있으면 그 값) */
  headlineViews: number;
  live: boolean;
}

function matchVideos(pool: PoolVideo[], item: TrendItem): PoolVideo[] {
  const kws = trendKeywords(item);
  return pool
    .filter((v) => kws.some((k) => v.title.includes(k)))
    .filter((v) => item.kind === "dessert" || looksCookable(v.title))
    .sort((a, b) => b.views - a.views);
}

/** 1층만으로 랭킹 (동기). */
export function rankTrendsFromPool(
  pool: PoolVideo[],
  opts: { risingOnly?: boolean } = {},
): RankedTrend[] {
  const items = opts.risingOnly
    ? TREND_ITEMS.filter((t) => t.rising)
    : TREND_ITEMS;

  return items
    .map((item): RankedTrend => {
      const videos = matchVideos(pool, item).slice(0, 6);
      const poolViews = videos.reduce((s, v) => s + v.views, 0);
      return {
        ...item,
        videos,
        poolViews,
        headlineViews: poolViews,
        live: false,
      };
    })
    .filter((t) => t.videos.length > 0)
    .sort((a, b) => b.poolViews - a.poolViews);
}

/**
 * 1층 랭킹 + (가능하면) 상위 몇 개를 실시간으로 확인.
 * 실시간이 꺼져 있으면 rankTrendsFromPool 과 같다.
 */
export async function rankTrends(
  opts: { risingOnly?: boolean; liveTop?: number } = {},
): Promise<RankedTrend[]> {
  const pool = await loadPool();
  const ranked = rankTrendsFromPool(pool, opts);
  if (!liveEnabled || ranked.length === 0) return ranked;

  const liveTop = opts.liveTop ?? 4;
  const checked = await Promise.all(
    ranked.slice(0, liveTop).map(async (t) => {
      try {
        const hits = await liveSearch(t.query, 5);
        if (!hits.length) return t;
        const live = hits.filter((v) => !t.videos.some((p) => p.id === v.id));
        const merged = [...live.slice(0, 2), ...t.videos].slice(0, 6);
        const liveViews = hits.reduce((s, v) => s + (v.views || 0), 0);
        return {
          ...t,
          videos: merged,
          headlineViews: Math.max(t.poolViews, liveViews),
          live: true,
        };
      } catch {
        return t;
      }
    }),
  );
  return [...checked, ...ranked.slice(liveTop)];
}
