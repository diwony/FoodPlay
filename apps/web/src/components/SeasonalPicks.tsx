import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { compactViews } from "@foodplay/core";
import { rankSeasonal, type RankedSeasonal } from "../lib/seasonal";
import YtThumb from "./YtThumb";

/** "오늘은 이거 어때요?" 아래 — 이번 달 제철 재료 + 그 재료로 나온 인기 영상. */
export default function SeasonalPicks() {
  const [items, setItems] = useState<RankedSeasonal[] | null>(null);
  const month = new Date().getMonth() + 1;

  useEffect(() => {
    let alive = true;
    rankSeasonal(8).then((r) => alive && setItems(r));
    return () => {
      alive = false;
    };
  }, []);

  const [dead, setDead] = useState<Set<string>>(new Set());
  const markDead = useCallback(
    (id: string) => setDead((s) => new Set(s).add(id)),
    [],
  );
  // 영상을 아예 못 찾은(또는 죽은) 항목은 카드째로 뺀다 — 이 자리는 찾은 것만.
  const live = useMemo(
    () => (items ?? []).filter((it) => it.video && !dead.has(it.video.id)),
    [items, dead],
  );

  if (items && live.length === 0) return null;

  return (
    <section className="py-4">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-[19px] font-bold tracking-tight">🍂 {month}월 제철</h2>
        <span className="text-[12px] text-faint">
          지금 맛있고 저렴한 재료로 만드는 영상
        </span>
      </div>

      {items === null ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[132px] w-[168px] shrink-0 animate-pulse rounded-xl bg-line/40"
            />
          ))}
        </div>
      ) : (
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {live.map((it) => {
            const v = it.video!;
            return (
              <Link
                key={it.name}
                to={`/yt/${v.id}`}
                state={{ title: v.title, channel: v.channel, query: it.query }}
                className="group w-[168px] shrink-0"
              >
                <div className="relative aspect-video overflow-hidden rounded-xl bg-accent-soft">
                  <YtThumb
                    id={v.id}
                    onDead={markDead}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-1.5 top-1.5 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {it.emoji} {it.name}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-[13px] font-bold tracking-tight">
                  {it.name} 요리
                </p>
                <p className="text-[11px] text-faint">
                  관련 영상 ▶ {compactViews(v.views)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
