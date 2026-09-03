import { recipeDatabase } from "@foodplay/core";

/** 큐레이션에 이미 있는 유튜브 영상 ID — 풀 결과에서 중복 제거용. */
export const CURATED_YT_IDS: string[] = recipeDatabase.recipes.flatMap((r) => {
  const ids = [r.long.youtubeId];
  if (r.short?.youtubeId) ids.push(r.short.youtubeId);
  return ids;
});
