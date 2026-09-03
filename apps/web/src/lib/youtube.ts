/**
 * 유튜브에서 "관련 영상 다 끌어오기" — 큐레이션 DB 밖의 실시간 검색.
 *
 * 큐레이션 레시피(스텝 타임스탬프)가 이 앱의 본체이고, 이건 그 아래에서
 * "더 많은 관련 영상"을 유튜브 전체에서 긁어오는 보조 기능이다.
 *
 * ── API 키 ─────────────────────────────────────────────────────
 * 정적 사이트라 서버가 없다. YouTube Data API v3 키가 있어야 검색이 된다.
 * 키는 두 군데서 읽는다(로컬 우선):
 *   1. localStorage["yt_api_key"] — 앱 안 "키 연결" 입력창에서 저장. 이 브라우저
 *      에서만 쓰인다. 재빌드·재배포 필요 없음.
 *   2. import.meta.env.VITE_YT_API_KEY — 빌드에 박은 키. 배포본 방문자 전체가
 *      쓰게 하려면 이 방법. apps/web/.env.local 참고.
 * 둘 다 없으면 검색을 호출하지 않고 유튜브 검색 페이지 링크로 대체한다.
 *
 * 정적 사이트라 키는 어차피 노출되므로, Google Cloud Console 에서
 * "애플리케이션 제한 → HTTP 리퍼러" 를 https://diwony.github.io/* 로 잠근다.
 */

const LS_KEY = "yt_api_key";

export function getApiKey(): string | undefined {
  try {
    const local = localStorage.getItem(LS_KEY);
    if (local && local.trim()) return local.trim();
  } catch {
    /* localStorage 접근 불가(프라이빗 모드 등) — env 로 폴백 */
  }
  const env = import.meta.env.VITE_YT_API_KEY;
  return env && env.trim() ? env.trim() : undefined;
}

/** 사용자가 앱에서 입력한 키를 이 브라우저에 저장. */
export function setUserApiKey(key: string): void {
  try {
    const v = key.trim();
    if (v) localStorage.setItem(LS_KEY, v);
    else localStorage.removeItem(LS_KEY);
  } catch {
    /* 무시 */
  }
}

export function hasYouTubeKey(): boolean {
  return Boolean(getApiKey());
}

/** 유튜브 검색 결과 페이지 URL (키 없이도 항상 동작하는 대체 경로). */
export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export class YouTubeSearchError extends Error {
  constructor(
    message: string,
    readonly kind: "no-key" | "quota" | "bad-key" | "http" | "network",
  ) {
    super(message);
    this.name = "YouTubeSearchError";
  }
}

export interface YouTubeHit {
  videoId: string;
  title: string;
  channel: string;
  publishedAt: string;
  thumbnail: string;
}

interface RawItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
}

/**
 * 유튜브 영상 검색. 쿼터가 아까우니(검색 1회 = 100units) 호출부에서
 * 반드시 캐시/디바운스하고, 사용자가 명시적으로 요청할 때만 부른다.
 */
export async function searchYouTube(
  query: string,
  opts: { signal?: AbortSignal; order?: "relevance" | "viewCount" } = {},
): Promise<YouTubeHit[]> {
  const key = getApiKey();
  if (!key) {
    throw new YouTubeSearchError("YouTube API 키가 없습니다.", "no-key");
  }
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("maxResults", "12");
  url.searchParams.set("regionCode", "KR");
  url.searchParams.set("relevanceLanguage", "ko");
  url.searchParams.set("order", opts.order ?? "relevance");
  url.searchParams.set("q", query);
  url.searchParams.set("key", key);

  let res: Response;
  try {
    res = await fetch(url, { signal: opts.signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new YouTubeSearchError("네트워크 오류", "network");
  }
  if (!res.ok) {
    // 400 = 키 형식 오류, 403 = 쿼터 초과 또는 리퍼러/권한 거부
    const kind =
      res.status === 400
        ? "bad-key"
        : res.status === 403
          ? "quota"
          : "http";
    throw new YouTubeSearchError(`YouTube API ${res.status}`, kind);
  }
  const json = (await res.json()) as { items?: RawItem[] };
  return (json.items ?? [])
    .map((it): YouTubeHit | null => {
      const videoId = it.id?.videoId;
      const s = it.snippet;
      if (!videoId || !s?.title) return null;
      return {
        videoId,
        title: decodeEntities(s.title),
        channel: decodeEntities(s.channelTitle ?? ""),
        publishedAt: s.publishedAt ?? "",
        thumbnail:
          s.thumbnails?.medium?.url ??
          s.thumbnails?.default?.url ??
          `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      };
    })
    .filter((x): x is YouTubeHit => x !== null);
}

/** 유튜브 API 는 제목에 &amp; &#39; 같은 엔티티를 그대로 준다. */
function decodeEntities(s: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}
