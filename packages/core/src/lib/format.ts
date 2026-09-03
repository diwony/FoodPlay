import type { BlogLink, Difficulty, ShortVideo } from "../data/types";

/** 초 → "m:ss" 또는 "h:mm:ss" */
export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

export function formatCookTime(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

export function formatDifficulty(d: Difficulty): string {
  return DIFFICULTY_LABEL[d];
}

/** 숏폼이 네이버TV 소스인지 */
export function isNaverShort(s: ShortVideo): boolean {
  return s.provider === "naver";
}

/** 숏폼을 원본 사이트에서 여는 URL */
export function shortWatchUrl(s: ShortVideo): string {
  return isNaverShort(s)
    ? `https://tv.naver.com/v/${s.naverClipId}`
    : `https://www.youtube.com/watch?v=${s.youtubeId}`;
}

/**
 * iframe 으로 임베드할 URL. 네이버TV만 반환한다.
 * 유튜브는 IFrame Player API 로 붙이므로 null.
 */
export function shortEmbedUrl(s: ShortVideo): string | null {
  return isNaverShort(s)
    ? `https://tv.naver.com/embed/${s.naverClipId}?autoPlay=false`
    : null;
}

const BLOG_SOURCE_LABEL: Record<string, string> = {
  naver: "네이버 블로그",
  tistory: "티스토리",
  brunch: "브런치",
  "10000recipe": "만개의레시피",
  wtable: "우리의식탁",
  etc: "블로그",
};

/** 블로그 출처 태그 → 한국어 라벨 */
export function blogSourceLabel(source: BlogLink["source"]): string {
  return BLOG_SOURCE_LABEL[source] ?? source;
}
