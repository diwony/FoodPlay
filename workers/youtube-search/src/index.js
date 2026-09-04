/**
 * FoodPlay 2층 — 실시간 유튜브 검색 프록시 (Cloudflare Workers).
 *
 * 앱(gh-pages 정적 사이트)은 API 키를 가질 수 없다. 그래서 이 Worker 가
 * 키를 시크릿으로 들고 대신 YouTube Data API v3 를 호출하고, 결과를 KV 에
 * 24시간 캐시해 무료 할당량(하루 10,000유닛)을 아낀다.
 *
 * 키는 소스에 없다:  wrangler secret / 대시보드 Secret 으로만 넣는다.
 *
 * GET /search?q=<검색어>&max=<1~20>  → { videos, cached?, quota?, rateLimited? }
 * GET /video?id=<11자>              → { id, title, channel, description, ... }
 * 오류·할당량 소진 시에도 200 + 빈 배열 → 앱은 조용히 1층(정적 풀)로 폴백한다.
 */

const YT = "https://www.googleapis.com/youtube/v3";
const CACHE_TTL = 60 * 60 * 24; // 24시간

// 브라우저에서 이 프록시를 부를 수 있는 출처. FoodPlay 사이트와 로컬 개발만
// 허용한다(다른 웹사이트가 우리 API 를 자기 페이지에 임베드하는 걸 막는다).
// 브라우저 밖(스크립트·직접 접속)은 CORS 와 무관하므로 그대로 응답한다 —
// 그쪽 남용은 Rate Limiting 이 담당한다.
const ALLOWED_ORIGINS = new Set([
  "https://diwony.github.io",
  "http://localhost:5173",
  "http://localhost:4173",
]);

function corsHeaders(req) {
  const origin = req.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow || "null",
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(req, env) {
    const cors = corsHeaders(req);
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(req.url);

    // 영상 하나의 상세(제목·채널·설명) — /yt/:id 화면에서 설명·타임스탬프 파싱용.
    if (url.pathname === "/video") {
      const id = (url.searchParams.get("id") || "").trim();
      if (!/^[\w-]{11}$/.test(id)) return json({ error: "bad id" }, 400, cors);

      const cacheKey = `v:${id}`;
      if (env.CACHE) {
        const hit = await env.CACHE.get(cacheKey, "json");
        if (hit) return json({ ...hit, cached: true }, 200, cors);
      }
      if (!env.YT_API_KEY) return json({ error: "no key configured" }, 200, cors);
      if (await rateLimited(req, env))
        return json({ rateLimited: true }, 429, cors);

      try {
        const v = new URL(`${YT}/videos`);
        v.searchParams.set("key", env.YT_API_KEY);
        v.searchParams.set("part", "snippet,statistics");
        v.searchParams.set("id", id);
        const vr = await fetch(v);
        if (!vr.ok) {
          const b = await vr.json().catch(() => ({}));
          const reason = b?.error?.errors?.[0]?.reason || "";
          return json(
            { quota: /quota|rateLimit|dailyLimit/i.test(reason) },
            200,
            cors,
          );
        }
        const it = (await vr.json()).items?.[0];
        if (!it) return json({ error: "not found" }, 404, cors);
        const out = {
          id,
          title: decodeEntities(it.snippet?.title || ""),
          channel: it.snippet?.channelTitle || "",
          description: it.snippet?.description || "",
          publishedAt: it.snippet?.publishedAt || "",
          views: Number(it.statistics?.viewCount || 0),
        };
        if (env.CACHE)
          await env.CACHE.put(cacheKey, JSON.stringify(out), {
            expirationTtl: CACHE_TTL,
          });
        return json(out, 200, cors);
      } catch (e) {
        console.error("video:", e);
        return json({ error: "internal error" }, 200, cors);
      }
    }

    // 영상 자막(CC) 텍스트 — /yt/:id 화면에서 "필요한 재료" 를 뽑을 때 설명글에
    // 재료가 없으면 자막에서 찾는다. innertube player → caption track → timedtext.
    // API 키 불필요. 실패·자막 없음이면 빈 텍스트.
    if (url.pathname === "/transcript") {
      const id = (url.searchParams.get("id") || "").trim();
      if (!/^[\w-]{11}$/.test(id)) return json({ error: "bad id" }, 400, cors);

      const cacheKey = `t:${id}`;
      if (env.CACHE) {
        const hit = await env.CACHE.get(cacheKey, "json");
        if (hit) return json({ ...hit, cached: true }, 200, cors);
      }
      if (await rateLimited(req, env))
        return json({ text: "", rateLimited: true }, 200, cors);

      try {
        const IK = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"; // 공개 웹 클라이언트 키
        const pr = await fetch(
          "https://www.youtube.com/youtubei/v1/player?key=" + IK,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              context: {
                client: {
                  clientName: "WEB",
                  clientVersion: "2.20240101.00.00",
                  hl: "ko",
                  gl: "KR",
                },
              },
              videoId: id,
            }),
          },
        );
        if (!pr.ok) return json({ text: "" }, 200, cors);
        const pj = await pr.json();
        const tracks =
          pj?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        if (!tracks.length)
          return json({ text: "", noCaptions: true }, 200, cors);

        const track =
          tracks.find((t) => (t.languageCode || "").startsWith("ko")) ||
          tracks[0];
        let base = track.baseUrl || "";
        if (!base) return json({ text: "" }, 200, cors);
        if (!/[?&]fmt=/.test(base)) base += "&fmt=json3";

        const tr = await fetch(base);
        if (!tr.ok) return json({ text: "" }, 200, cors);
        const tj = await tr.json();
        const text = (tj.events || [])
          .flatMap((e) => (e.segs || []).map((s) => s.utf8 || ""))
          .join("")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 20000);

        const out = { id, text, lang: track.languageCode || "" };
        if (env.CACHE)
          await env.CACHE.put(cacheKey, JSON.stringify(out), {
            expirationTtl: CACHE_TTL,
          });
        return json(out, 200, cors);
      } catch (e) {
        console.error("transcript:", e);
        return json({ text: "", error: "internal error" }, 200, cors);
      }
    }

    if (url.pathname !== "/search") return json({ error: "not found" }, 404, cors);

    const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
    if (q.length < 2) return json({ videos: [] }, 200, cors);
    const max = Math.min(
      20,
      Math.max(1, parseInt(url.searchParams.get("max"), 10) || 12),
    );

    const cacheKey = `s:${q}:${max}`;
    if (env.CACHE) {
      const hit = await env.CACHE.get(cacheKey, "json");
      if (hit) return json({ videos: hit, cached: true }, 200, cors);
    }

    if (!env.YT_API_KEY)
      return json({ videos: [], error: "no key configured" }, 200, cors);
    // 캐시 미스라 실제로 YouTube 를 부를 참이면 IP 상한을 확인한다.
    if (await rateLimited(req, env))
      return json({ videos: [], rateLimited: true }, 200, cors);

    try {
      const s = new URL(`${YT}/search`);
      s.searchParams.set("key", env.YT_API_KEY);
      s.searchParams.set("part", "snippet");
      s.searchParams.set("type", "video");
      s.searchParams.set("q", q);
      s.searchParams.set("maxResults", String(max));
      s.searchParams.set("regionCode", "KR");
      s.searchParams.set("relevanceLanguage", "ko");
      s.searchParams.set("videoEmbeddable", "true");
      s.searchParams.set("order", "relevance");

      const sr = await fetch(s);
      if (!sr.ok) {
        const b = await sr.json().catch(() => ({}));
        const reason = b?.error?.errors?.[0]?.reason || "";
        return json(
          { videos: [], quota: /quota|rateLimit|dailyLimit/i.test(reason) },
          200,
          cors,
        );
      }
      const sj = await sr.json();
      const videos = (sj.items || [])
        .filter((it) => it.id?.videoId && it.snippet?.title)
        .map((it) => ({
          id: it.id.videoId,
          title: decodeEntities(it.snippet.title),
          channel: it.snippet.channelTitle || "",
          views: 0,
        }));

      // 조회수 채우기 (videos.list — 1유닛)
      if (videos.length) {
        const v = new URL(`${YT}/videos`);
        v.searchParams.set("key", env.YT_API_KEY);
        v.searchParams.set("part", "statistics");
        v.searchParams.set("id", videos.map((x) => x.id).join(","));
        const vr = await fetch(v);
        if (vr.ok) {
          const vj = await vr.json();
          const byId = new Map(
            (vj.items || []).map((x) => [
              x.id,
              Number(x.statistics?.viewCount || 0),
            ]),
          );
          for (const it of videos) it.views = byId.get(it.id) || 0;
        }
      }

      if (env.CACHE)
        await env.CACHE.put(cacheKey, JSON.stringify(videos), {
          expirationTtl: CACHE_TTL,
        });

      return json({ videos }, 200, cors);
    } catch (e) {
      console.error("search:", e);
      return json({ videos: [], error: "internal error" }, 200, cors);
    }
  },
};

/**
 * IP 당 호출 상한 (RATE_LIMITER 바인딩). 바인딩이 없으면 그냥 통과시킨다.
 * 캐시 미스로 YouTube 를 실제 호출하기 직전에만 부르므로 캐시된 응답은
 * 상한에 카운트되지 않는다.
 */
async function rateLimited(req, env) {
  if (!env.RATE_LIMITER) return false;
  const ip = req.headers.get("CF-Connecting-IP") || "anon";
  try {
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    return !success;
  } catch {
    return false;
  }
}

function json(obj, status = 200, cors = {}) {
  // 오류·할당량·rate limit 응답은 엣지/브라우저에 캐시되면 안 된다
  // (복구된 뒤에도 낡은 실패가 1시간 동안 나가는 걸 막는다).
  const noCache = status >= 400 || obj?.error || obj?.quota || obj?.rateLimited;
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": noCache ? "no-store" : "public, max-age=3600",
      ...cors,
    },
  });
}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
}
