/**
 * 유튜브에서 "관련 영상 다 끌어오기" — 큐레이션 DB 밖의 실시간 검색.
 *
 * 큐레이션 레시피(스텝 타임스탬프)가 이 앱의 본체이고, 이건 그 아래에서
 * "더 많은 관련 영상"을 유튜브 전체에서 긁어오는 보조 기능이다.
 *
 * ── 키가 없을 때 ────────────────────────────────────────────────
 * 정적 사이트라 서버가 없다. YouTube Data API 키(`VITE_YT_API_KEY`)가
 * 빌드에 들어가 있지 않으면 검색 호출을 하지 않고, 대신 유튜브 검색
 * 페이지로 바로 보내는 링크(`youtubeSearchUrl`)만 쓴다. 이래도 "관련
 * 영상 전부"라는 목적은 달성된다 — 유튜브가 직접 보여주니까.
 *
 * 키를 넣으려면: apps/web/.env.local 에
 *   VITE_YT_API_KEY=AIza...
 * Google Cloud Console 에서 YouTube Data API v3 키를 만들고,
 * "애플리케이션 제한 → HTTP 리퍼러" 를 https://diwony.github.io/* 로 잠근다.
 * (키는 어차피 번들에 노출되므로 리퍼러 제한이 사실상의 방어선이다.)
 */

export interface YouTubeHit {
  videoId: string;
  title: string;
  channel: string;
  publishedAt: string;
  thumbnail: string;
}

const API_KEY = import.meta.env.VITE_YT_API_KEY as string | undefined;

/** 빌드에 키가 들어있으면 true. UI 분기에 쓴다. */
export const youtubeSearchEnabled = Boolean(API_KEY);

/** 유튜브 검색 결과 페이지 URL (키 없이도 항상 동작하는 대체 경로). */
export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export class YouTubeSearchError extends Error {
  constructor(
    message: string,
    readonly kind: "no-key" | "quota" | "http" | "network",
  ) {
    super(message);
    this.name = "YouTubeSearchError";
  }
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
  if (!API_KEY) {
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
  url.searchParams.set("key", API_KEY);

  let res: Response;
  try {
    res = await fetch(url, { signal: opts.signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new YouTubeSearchError("네트워크 오류", "network");
  }
  if (!res.ok) {
    const kind = res.status === 403 ? "quota" : "http";
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
