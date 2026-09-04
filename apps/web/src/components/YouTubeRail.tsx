import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadPool,
  searchPool,
  type PoolQuery,
  type PoolVideo,
} from "../lib/youtubePool";
import { compactViews } from "@foodplay/core";

interface Props {
  /** 고른 재료(정규화된 태그). 있으면 이걸로 먼저 거른다. */
  ingredients?: string[];
  /** 고른 기분/상황 vibe 키. */
  vibes?: string[];
  /** "유튜브에서 전체 결과" 링크에 쓸 검색어. */
  query: string;
  /** 이미 큐레이션에 있어 중복인 유튜브 ID */
  exclude?: string[];
  hint?: string;
  /** 칸 제목 (기본 "유튜브에서 더 찾기") */
  title?: string;
  /** 영상 종류 필터 — searchPool 참고 */
  kind?: PoolQuery["kind"];
  /** 반드시 있어야 하는 태그 (예: 베이킹 난이도) */
  require?: string[];
}

const STEP = 9;

/**
 * 큐레이션 결과 아래 "유튜브에서 더 찾기" 칸. 런타임 유튜브 호출 없이
 * 미리 수집한 정적 풀(1000+ 영상)에서 태그로 걸러 보여준다.
 */
export default function YouTubeRail({
  ingredients = [],
  vibes = [],
  query,
  exclude = [],
  hint,
  title = "유튜브에서 더 찾기",
  kind,
  require,
}: Props) {
  const [pool, setPool] = useState<PoolVideo[] | null>(null);
  const [shown, setShown] = useState(STEP);

  useEffect(() => {
    let alive = true;
    loadPool().then((p) => alive && setPool(p));
    return () => {
      alive = false;
    };
  }, []);

  const excludeSet = useMemo(() => new Set(exclude), [exclude]);
  const hits = useMemo(() => {
    if (!pool) return [];
    return searchPool(pool, {
      ingredients,
      vibes,
      limit: 60,
      exclude: excludeSet,
      kind,
      require,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, ingredients.join(","), vibes.join(","), excludeSet, kind, (require ?? []).join(",")]);

  useEffect(() => setShown(STEP), [ingredients.join(","), vibes.join(",")]);

  const ytSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const visible = hits.slice(0, shown);

  return (
    <section className="mt-10 border-t border-line pt-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[19px] font-bold tracking-tight">
          {title}
          {hits.length > 0 && (
            <span className="ml-2 text-[13px] font-semibold text-faint">
              {hits.length}+
            </span>
          )}
        </h2>
        <a
          href={ytSearch}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-[12px] font-semibold text-faint hover:text-good"
        >
          유튜브에서 직접 ↗
        </a>
      </div>
      <p className="mt-1 text-[13px] text-muted">
        {hint ??
          "큐레이션에 없는 채널까지, 미리 모아둔 관련 영상을 조회수 순으로 보여줘요."}
      </p>

      <div className="mt-4">
        {pool === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-video animate-pulse rounded-xl border border-line bg-line/40"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-5 py-6">
            <p className="text-[13px] text-muted">
              모아둔 영상 중엔 딱 맞는 게 없어요.{" "}
              <a
                href={ytSearch}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-good hover:underline"
              >
                유튜브에서 “{query}” 검색 ↗
              </a>
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visible.map((v) => (
                <Link
                  key={v.id}
                  to={`/yt/${v.id}`}
                  state={{
                    title: v.title,
                    channel: v.channel,
                    thumbnail: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
                  }}
                  className="group"
                >
                  <img
                    src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-full rounded-xl border border-line object-cover"
                  />
                  <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug group-hover:text-good">
                    {v.title}
                  </p>
                  <p className="text-[11px] text-faint">
                    {v.channel}
                    {v.views > 0 && ` · ▶ ${compactViews(v.views)}`}
                  </p>
                </Link>
              ))}
            </div>
            {shown < hits.length && (
              <button
                onClick={() => setShown((n) => n + STEP)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface py-3.5 text-[14px] font-semibold text-muted transition-colors hover:border-good/40 hover:text-ink"
              >
                <span className="text-[16px] leading-none text-good">＋</span>
                더보기 {Math.min(STEP, hits.length - shown)}개
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
