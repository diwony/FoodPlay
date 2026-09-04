import { seasonalItems, type SeasonalItem } from "@foodplay/core";
import { loadPool, looksCookable, type PoolVideo } from "./youtubePool";

export interface RankedSeasonal extends SeasonalItem {
  video: PoolVideo | null;
}

/** 이번 달 제철 재료를, 그 재료로 나온 영상 풀 조회수 1위와 짝지어 돌려준다. */
export async function rankSeasonal(limit = 4): Promise<RankedSeasonal[]> {
  const pool = await loadPool();
  const items = seasonalItems().slice(0, limit);
  return items.map((item) => {
    const kws = [item.name, ...item.aliases];
    const top = pool
      .filter((v) => kws.some((k) => v.title.includes(k)) && looksCookable(v.title))
      .sort((a, b) => b.views - a.views)[0];
    return { ...item, video: top ?? null };
  });
}
