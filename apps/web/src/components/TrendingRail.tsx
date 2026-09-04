import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { compactViews } from "@foodplay/core";
import { rankTrends, type RankedTrend } from "../lib/trends";
import { useDragScroll } from "../lib/useDragScroll";
import YtThumb from "./YtThumb";

/**
 * "요즘 뜨는" — 마라·로제·두바이 초콜릿·생새우처럼 지금 급상승 중인 요리/디저트.
 * 영상 풀 조회수로 뽑고, 프록시가 있으면 실시간 유튜브로 갱신해 "실시간" 배지를 단다.
 */
export default function TrendingRail() {
  const dragRef = useDragScroll<HTMLDivElement>();
  const [trends, setTrends] = useState<RankedTrend[] | null>(null);

  useEffect(() => {
    let alive = true;
    rankTrends({ risingOnly: true, liveTop: 5 }).then((t) => {
      if (alive) setTrends(t.slice(0, 10));
    });
    return () => {
      alive = false;
    };
  }, []);

  const [dead, setDead] = useState<Set<string>>(new Set());
  const markDead = useCallback(
    (id: string) => setDead((s) => new Set(s).add(id)),
    [],
  );
  // 대표 영상이 살아있는 트렌드만
  const live = useMemo(
    () =>
      (trends ?? [])
        .map((t) => ({
          ...t,
          videos: t.videos.filter((v) => !dead.has(v.id)),
        }))
        .filter((t) => t.videos.length > 0),
    [trends, dead],
  );

  if (trends && live.length === 0) return null;

  return (
    <section className="py-4">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-[19px] font-bold tracking-tight">🔥 요즘 뜨는</h2>
        <span className="text-[12px] text-faint">
          지금 급상승 중인 요리 · 디저트
        </span>
      </div>

      {trends === null ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[132px] w-[168px] shrink-0 animate-pulse rounded-xl bg-line/40"
            />
          ))}
        </div>
      ) : (
        <div
          ref={dragRef}
          className="no-scrollbar -mx-1 flex cursor-grab select-none gap-3 overflow-x-auto px-1 pb-1"
        >
          {live.map((t) => {
            const top = t.videos[0];
            return (
              <Link
                key={t.name}
                to={top ? `/yt/${top.id}` : "/dessert"}
                state={
                  top
                    ? { title: top.title, channel: top.channel, query: t.query }
                    : undefined
                }
                className="group w-[168px] shrink-0"
              >
                <div className="relative aspect-video overflow-hidden rounded-xl bg-accent-soft">
                  {top && (
                    <YtThumb
                      id={top.id}
                      onDead={markDead}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {t.emoji} {t.kind === "dessert" ? "디저트" : "요리"}
                  </span>
                  {t.live && (
                    <span className="absolute right-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                      실시간
                    </span>
                  )}
                </div>
                <p className="mt-1.5 truncate text-[13px] font-bold tracking-tight">
                  {t.name}
                </p>
                <p className="text-[11px] text-faint">
                  관련 영상 ▶ {compactViews(t.headlineViews)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
