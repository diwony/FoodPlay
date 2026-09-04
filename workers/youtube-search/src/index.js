/**
 * FoodPlay 2층 — 실시간 유튜브 검색 프록시 (Cloudflare Workers).
 *
 * 앱(gh-pages 정적 사이트)은 API 키를 가질 수 없다. 그래서 이 Worker 가
 * 키를 시크릿으로 들고 대신 YouTube Data API v3 를 호출하고, 결과를 KV 에
 * 24시간 캐시해 무료 할당량(하루 10,000유닛)을 아낀다.
 *
 * 키는 소스에 없다:  npx wrangler secret put YT_API_KEY   (배포 후 1회)
 * 로컬 개발:          workers/youtube-search/.dev.vars 에 YT_API_KEY=... (gitignore)
 *
 * GET /search?q=<검색어>&max=<1~20>
 *   → { videos: [{ id, title, channel, views }], cached?, quota? }
 * 할당량 소진·오류 시에도 200 + 빈 배열 → 앱은 조용히 1층(정적 풀)로 폴백한다.
 */

const YT = "https://www.googleapis.com/youtube/v3";
const CACHE_TTL = 60 * 60 * 24; // 24시간

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(req.url);

    // 영상 하나의 상세(제목·채널·설명) — /yt/:id 화면에서 설명·타임스탬프 파싱용.
    if (url.pathname === "/video") {
      const id = (url.searchParams.get("id") || "").trim();
      if (!/^[\w-]{11}$/.test(id)) return json({ error: "bad id" }, 400);

      const cacheKey = `v:${id}`;
      if (env.CACHE) {
        const hit = await env.CACHE.get(cacheKey, "json");
        if (hit) return json({ ...hit, cached: true });
      }
      if (!env.YT_API_KEY) return json({ error: "no key configured" });
      if (await rateLimited(req, env)) return json({ rateLimited: true }, 429);

      try {
        const v = new URL(`${YT}/videos`);
        v.searchParams.set("key", env.YT_API_KEY);
        v.searchParams.set("part", "snippet,statistics");
        v.searchParams.set("id", id);
        const vr = await fetch(v);
        if (!vr.ok) {
          const b = await vr.json().catch(() => ({}));
          const reason = b?.error?.errors?.[0]?.reason || "";
          return json({ quota: /quota|rateLimit|dailyLimit/i.test(reason) });
        }
        const it = (await vr.json()).items?.[0];
        if (!it) return json({ error: "not found" }, 404);
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
        return json(out);
      } catch (e) {
        return json({ error: String(e) });
      }
    }

    if (url.pathname !== "/search") return json({ error: "not found" }, 404);

    const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
    if (q.length < 2) return json({ videos: [] });
    const max = Math.min(
      20,
      Math.max(1, parseInt(url.searchParams.get("max"), 10) || 12),
    );

    const cacheKey = `s:${q}:${max}`;
    if (env.CACHE) {
      const hit = await env.CACHE.get(cacheKey, "json");
      if (hit) return json({ videos: hit, cached: true });
    }

    if (!env.YT_API_KEY) return json({ videos: [], error: "no key configured" });
    // 캐시 미스라 실제로 YouTube 를 부를 참이면 IP 상한을 확인한다.
    if (await rateLimited(req, env))
      return json({ videos: [], rateLimited: true });

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
        return json({
          videos: [],
          quota: /quota|rateLimit|dailyLimit/i.test(reason),
        });
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

      return json({ videos });
    } catch (e) {
      return json({ videos: [], error: String(e) });
    }
  },
};

/**
 * IP 당 호출 상한 (wrangler.toml 의 RATE_LIMITER 바인딩). 바인딩이 없으면
 * (예: 옛 배포) 그냥 통과시킨다. 캐시 미스로 YouTube 를 실제 호출하기 직전에만
 * 부르므로 캐시된 응답은 상한에 카운트되지 않는다.
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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      ...CORS,
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
