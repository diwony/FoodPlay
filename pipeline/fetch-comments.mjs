/**
 * 유튜브 영상의 상위 댓글을 가져온다. (Data API 키 불필요 — 공개 innertube 사용)
 *
 *   node pipeline/fetch-comments.mjs <videoId> [<videoId> ...]
 *   node pipeline/fetch-comments.mjs --all        # sources.json 전체
 *
 * 결과는 pipeline/comments/<videoId>.json 에 저장된다. 이 파일들을 build.mjs 가
 * Claude 에 넘겨 recipes.json 의 reception({summary, quotes}) 을 생성한다.
 *
 * 주의: 비공식 엔드포인트다. 스키마가 바뀌면 파싱이 깨질 수 있다.
 * 안정적인 운영에는 YouTube Data API commentThreads 로 교체하는 것을 권장한다.
 */

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"; // 공개 웹 클라이언트 키
const CONTEXT = {
  client: { clientName: "WEB", clientVersion: "2.20240101.00.00", hl: "ko", gl: "KR" },
};

async function post(body) {
  const res = await fetch(
    "https://www.youtube.com/youtubei/v1/next?key=" + INNERTUBE_KEY,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ context: CONTEXT, ...body }),
    },
  );
  if (!res.ok) throw new Error(`innertube ${res.status}`);
  return res.json();
}

function deepFind(root, predicate) {
  let found = null;
  const walk = (node) => {
    if (found || !node || typeof node !== "object") return;
    if (predicate(node)) {
      found = node;
      return;
    }
    for (const k of Object.keys(node)) walk(node[k]);
  };
  walk(root);
  return found;
}

export async function fetchComments(videoId, limit = 20) {
  const first = await post({ videoId });
  const cont = deepFind(
    first,
    (n) =>
      n.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token,
  );
  const token =
    cont?.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
  if (!token) return { videoId, comments: [] };

  const page = await post({ continuation: token });
  const comments = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.commentEntityPayload) {
      const p = node.commentEntityPayload;
      comments.push({
        text: p.properties?.content?.content ?? "",
        likes: Number(p.toolbar?.likeCountNotliked || 0) || undefined,
      });
    } else if (node.commentRenderer) {
      const c = node.commentRenderer;
      comments.push({
        text: (c.contentText?.runs ?? []).map((r) => r.text).join(""),
        likes: c.voteCount?.simpleText,
      });
    }
    for (const k of Object.keys(node)) walk(node[k]);
  };
  walk(page);

  return {
    videoId,
    fetchedAt: new Date().toISOString(),
    comments: comments.filter((c) => c.text.trim()).slice(0, limit),
  };
}

// ── CLI ────────────────────────────────────────────────────
const isMain =
  process.argv[1] &&
  (await import("node:url")).fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const ROOT = new URL("..", import.meta.url);
  const args = process.argv.slice(2);
  let ids = args.filter((a) => !a.startsWith("--"));
  if (args.includes("--all")) {
    const { sources } = JSON.parse(
      readFileSync(new URL("pipeline/sources.json", ROOT), "utf8"),
    );
    ids = sources.map((s) => s.youtubeId);
  }
  const outDir = new URL("pipeline/comments/", ROOT);
  mkdirSync(outDir, { recursive: true });

  for (const id of ids) {
    try {
      const data = await fetchComments(id);
      writeFileSync(
        new URL(`${id}.json`, outDir),
        JSON.stringify(data, null, 2) + "\n",
      );
      console.log(`✓ ${id}: ${data.comments.length} 댓글`);
    } catch (err) {
      console.error(`✗ ${id}: ${err.message}`);
    }
  }
}
