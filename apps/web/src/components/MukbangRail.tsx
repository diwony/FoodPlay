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
  /** 고른 재료(정규화된 태그). */
  ingredients?: string[];
  /** 고른 기분/상황 vibe 키. */
  vibes?: string[];
  /** 칸 제목 (기본 "같이 보는 먹방") */
  title?: string;
  /** 안내 문구 */
  hint?: string;
  /** 먹방 종류 (기본 "mukbang"). 디저트 화면은 "dessert-mukbang". */
  kind?: PoolQuery["kind"];
  /** 반드시 있어야 하는 태그 */
  require?: string[];
}

const STEP = 6;

/**
 * 레시피 결과 옆 "같이 보는 먹방" 칸. 유튜브 풀에서 `mukbang` 태그가 붙은
 * 영상만, 고른 재료·기분에 맞춰 보여준다. 조건에 맞는 게 없으면 인기 먹방으로
 * 폴백한다. (런타임 유튜브 호출 없음 — 미리 수집한 정적 풀만 읽는다.)
 */
export default function MukbangRail({
  ingredients = [],
  vibes = [],
  title = "같이 보는 먹방",
  hint = "요리하는 김에 곁들여 볼, 고른 재료·기분에 맞는 먹방 영상이에요.",
  kind = "mukbang",
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

  const depKey = `${ingredients.join(",")}|${vibes.join(",")}|${kind ?? ""}|${(
    require ?? []
  ).join(",")}`;

  const hits = useMemo(() => {
    if (!pool) return [];
    const scoped = searchPool(pool, {
      ingredients,
      vibes,
      limit: 30,
      kind,
      require,
    });
    if (scoped.length > 0) return scoped;
    // 고른 조건에 맞는 먹방이 없으면 인기 먹방으로 채운다.
    return searchPool(pool, {
      ingredients: [],
      vibes: [],
      limit: 30,
      kind,
      require,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, depKey]);

  useEffect(() => setShown(STEP), [depKey]);

  if (pool !== null && hits.length === 0) return null;

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
      </div>
      <p className="mt-1 text-[13px] text-muted">{hint}</p>

      <div className="mt-4">
        {pool === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="aspect-video animate-pulse rounded-xl border border-line bg-line/40"
              />
            ))}
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
