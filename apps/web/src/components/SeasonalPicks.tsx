import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { rankSeasonal, type RankedSeasonal } from "../lib/seasonal";

/**
 * "이번 달 제철" — 냉장고에 늘 있는 재료는 아니라서 아주 짧게, 곁다리로만.
 * 사이드바에 칩 한 줄로. 각 칩은 그 재료로 나온 영상 하나로 이어진다.
 */
export default function SeasonalPicks() {
  const [items, setItems] = useState<RankedSeasonal[] | null>(null);
  const month = new Date().getMonth() + 1;

  useEffect(() => {
    let alive = true;
    rankSeasonal(4).then((r) => alive && setItems(r));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
      <span className="text-[12px] font-bold text-muted">🍂 {month}월 제철</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {(items ?? Array.from({ length: 4 })).map((it, i) =>
          it ? (
            <Link
              key={it.name}
              to={it.video ? `/yt/${it.video.id}` : "/fridge"}
              state={
                it.video
                  ? { title: it.video.title, channel: it.video.channel, query: it.query }
                  : undefined
              }
              className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent hover:bg-accent hover:text-white"
            >
              {it.emoji} {it.name}
            </Link>
          ) : (
            <span
              key={i}
              className="h-[26px] w-14 animate-pulse rounded-full bg-line/40"
            />
          ),
        )}
      </div>
    </div>
  );
}
