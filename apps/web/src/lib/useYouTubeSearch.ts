import { useCallback, useEffect, useRef, useState } from "react";
import {
  searchYouTube,
  YouTubeSearchError,
  type YouTubeHit,
} from "./youtube";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; hits: YouTubeHit[]; query: string }
  | { status: "error"; kind: YouTubeSearchError["kind"] };

const cache = new Map<string, YouTubeHit[]>();

function readSession(key: string): YouTubeHit[] | null {
  try {
    const raw = sessionStorage.getItem("yt:" + key);
    return raw ? (JSON.parse(raw) as YouTubeHit[]) : null;
  } catch {
    return null;
  }
}
function writeSession(key: string, hits: YouTubeHit[]) {
  try {
    sessionStorage.setItem("yt:" + key, JSON.stringify(hits));
  } catch {
    /* 용량 초과 등은 무시 */
  }
}

/**
 * 유튜브 검색을 "요청할 때만" 실행한다. 검색 1회가 쿼터 100units 라
 * 자동 호출하지 않고, run(query) 를 눌러야 돈다. 같은 쿼리는 세션 캐시에서
 * 즉시 돌려준다.
 */
export function useYouTubeSearch() {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;

    const hit = cache.get(q) ?? readSession(q);
    if (hit) {
      cache.set(q, hit);
      setState({ status: "done", hits: hit, query: q });
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setState({ status: "loading" });

    searchYouTube(q, { signal: ac.signal })
      .then((hits) => {
        cache.set(q, hits);
        writeSession(q, hits);
        setState({ status: "done", hits, query: q });
      })
      .catch((e: unknown) => {
        if ((e as Error).name === "AbortError") return;
        const kind =
          e instanceof YouTubeSearchError ? e.kind : "http";
        setState({ status: "error", kind });
      });
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, run, reset };
}
