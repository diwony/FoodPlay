import type {
  BlogLink,
  Cuisine,
  Difficulty,
  Serves,
  ShortVideo,
} from "../data/types";

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

/**
 * 조회수 → 한국어 축약. 예: 1234 → "조회수 1,234회",
 * 32000 → "조회수 3.2만회", 1_200_000 → "조회수 120만회".
 */
export function formatViews(views: number): string {
  const n = compactViews(views);
  return n ? `조회수 ${n}회` : "";
}

/** 조회수 숫자만 축약. 예: 32000 → "3.2만", 1_200_000 → "120만". */
export function compactViews(views: number): string {
  if (!Number.isFinite(views) || views < 0) return "";
  if (views < 10_000) return views.toLocaleString("ko-KR");
  const man = views / 10_000;
  const rounded = man >= 100 ? Math.round(man) : Math.round(man * 10) / 10;
  return `${rounded.toLocaleString("ko-KR")}만`;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

export function formatDifficulty(d: Difficulty): string {
  return DIFFICULTY_LABEL[d];
}

const SERVES_META: Record<Serves, { emoji: string; label: string; short: string }> = {
  solo: { emoji: "🧑", label: "혼밥 1인", short: "혼밥" },
  couple: { emoji: "🧑‍🤝‍🧑", label: "연인·둘이 2인", short: "둘이" },
  family: { emoji: "👨‍👩‍👧", label: "가족 3~4인", short: "가족" },
  party: { emoji: "👥", label: "여럿이 4인 이상", short: "여럿이" },
};

/** "🧑 혼밥 1인" 처럼 이모지+라벨. `short` 면 "혼밥"만. */
export function formatServes(s: Serves, short = false): string {
  const m = SERVES_META[s];
  return `${m.emoji} ${short ? m.short : m.label}`;
}

/** Shop 필터 칩 순서 */
export const SERVES_ALL: Serves[] = ["solo", "couple", "family", "party"];

export function servesEmoji(s: Serves): string {
  return SERVES_META[s].emoji;
}

export function servesLabel(s: Serves, short = false): string {
  return short ? SERVES_META[s].short : SERVES_META[s].label;
}

const CUISINE_META: Record<Cuisine, { emoji: string; label: string }> = {
  korean: { emoji: "🍚", label: "한식" },
  japanese: { emoji: "🍥", label: "일식" },
  western: { emoji: "🍝", label: "양식" },
  chinese: { emoji: "🥢", label: "중식" },
};

/** "🍚 한식". `bare` 면 라벨만. */
export function cuisineLabel(c: Cuisine, bare = false): string {
  const m = CUISINE_META[c];
  return bare ? m.label : `${m.emoji} ${m.label}`;
}

/** Shop 필터 칩 순서 */
export const CUISINES: Cuisine[] = ["korean", "japanese", "western", "chinese"];

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
