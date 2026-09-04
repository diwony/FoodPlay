import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { RecipeMatch } from "@foodplay/core";
import RecipeCard from "./RecipeCard";
import VideoCard from "./VideoCard";
import MukbangRail from "./MukbangRail";
import { loadPool, searchPool, type PoolVideo } from "../lib/youtubePool";
import { useLiveMerge } from "../lib/youtubeLive";

interface Props {
  list: RecipeMatch[];
  heading: string;
  /** 헤딩 오른쪽 작은 메타 (선택) */
  meta?: ReactNode;
  /** 카드 스타일: 매칭(재료) / 둘러보기 / 장보기 */
  variant?: "match" | "browse" | "shopping";
  /** 관련 유튜브 영상 — 검색어(있어야 영상 칸이 뜬다) + 태그 필터. */
  youtubeQuery?: string;
  youtubeIngredients?: string[];
  youtubeVibes?: string[];
  youtubeExclude?: string[];
  /** 결과가 0개일 때 문구 */
  emptyText?: string;
  /** 결과 위에 붙일 안내 (선택) */
  note?: ReactNode;
}

const PAGE = 8;

type Item =
  | { kind: "recipe"; m: RecipeMatch }
  | { kind: "video"; v: PoolVideo };

/**
 * 재료·장보기 모드가 공유하는 결과. "직접 정리한 레시피(스텝 O)" 와
 * "같은 재료로 나온 유튜브 영상(스텝 X, 설명 타임라인)" 을 나누지 않고
 * **한 목록·한 그리드**로 이어서 보여준다 — 큐레이션 레시피가 먼저,
 * 이어서 관련 영상, 맨 아래 "같이 보는 먹방".
 */
export default function ResultList({
  list,
  heading,
  meta,
  variant = "browse",
  youtubeQuery,
  youtubeIngredients = [],
  youtubeVibes = [],
  youtubeExclude = [],
  emptyText,
  note,
}: Props) {
  const [shown, setShown] = useState(PAGE);

  // 관련 유튜브 영상 — 런타임 유튜브 호출 없이 미리 수집한 정적 풀에서 태그로
  // 거른다. (프록시가 있으면 useLiveMerge 가 실시간 결과를 얹는다.)
  const [pool, setPool] = useState<PoolVideo[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadPool().then((p) => alive && setPool(p));
    return () => {
      alive = false;
    };
  }, []);

  const excludeSet = useMemo(
    () =>
      new Set([
        ...youtubeExclude,
        ...list.map((m) => m.recipe.long.youtubeId),
      ]),
    [youtubeExclude, list],
  );
  const depKey = `${youtubeIngredients.join(",")}|${youtubeVibes.join(",")}`;
  const hits = useMemo(() => {
    if (!pool || !youtubeQuery) return [];
    return searchPool(pool, {
      ingredients: youtubeIngredients,
      vibes: youtubeVibes,
      limit: 60,
      exclude: excludeSet,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, depKey, excludeSet, youtubeQuery]);

  const { merged: videos, liveIds } = useLiveMerge(
    youtubeQuery ?? "",
    hits,
    excludeSet,
  );

  const items = useMemo<Item[]>(
    () => [
      ...list.map((m) => ({ kind: "recipe" as const, m })),
      ...videos.map((v) => ({ kind: "video" as const, v })),
    ],
    [list, videos],
  );

  useEffect(() => setShown(PAGE), [list, depKey]);

  const visible = items.slice(0, shown);
  const more = items.length - visible.length;
  const total = items.length;
  const poolLoading = Boolean(youtubeQuery) && pool === null;

  return (
    <section className="py-10">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-[19px] font-bold tracking-tight">
          {heading}
          {total > 0 && (
            <span className="ml-2 text-[14px] font-semibold text-faint">
              · {total}
            </span>
          )}
        </h2>
        {meta && <span className="shrink-0 text-[12px] text-faint">{meta}</span>}
      </div>

      {note && <div className="mb-4">{note}</div>}

      {items.length > 0 ? (
        <>
          {list.length > 0 && videos.length > 0 && (
            <p className="mb-3 text-[13px] leading-relaxed text-faint">
              <b className="text-good">📖 스텝</b> 정리된 레시피와{" "}
              <b className="text-ink">▶ 영상</b>(설명 타임라인)을 한 목록으로
              보여줘요. 둘 다 고른 재료를 쓰는 요리예요.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((it) =>
              it.kind === "recipe" ? (
                <RecipeCard
                  key={`r-${it.m.recipe.id}`}
                  match={it.m}
                  rank={list.indexOf(it.m) + 1}
                  browse={variant === "browse"}
                  shopping={variant === "shopping"}
                />
              ) : (
                <VideoCard
                  key={`v-${it.v.id}`}
                  video={it.v}
                  live={liveIds.has(it.v.id)}
                />
              ),
            )}
          </div>
          {more > 0 && (
            <button
              onClick={() => setShown((n) => n + PAGE)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface py-3.5 text-[14px] font-semibold text-muted transition-colors hover:border-accent/40 hover:text-ink"
            >
              <span className="text-[16px] leading-none text-accent">＋</span>
              더보기 {more}개
            </button>
          )}
        </>
      ) : poolLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-[var(--radius-card)] border border-line bg-line/40"
            />
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted">
          {emptyText ??
            "조건에 맞는 게 없어요. 필터를 줄여 보세요."}
        </p>
      )}

      {youtubeQuery && (
        <MukbangRail
          ingredients={youtubeIngredients}
          vibes={youtubeVibes}
          query={`${youtubeQuery} 먹방`}
        />
      )}
    </section>
  );
}
