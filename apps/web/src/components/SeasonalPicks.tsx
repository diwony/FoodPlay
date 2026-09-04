import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { compactViews } from "@foodplay/core";
import { rankSeasonal, type RankedSeasonal } from "../lib/seasonal";
import YtThumb from "./YtThumb";

/** "실검" 아래 — 이번 달 제철 재료 + 그걸로 나온 영상 하나씩. */
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
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <p className="text-[13px] font-bold text-muted">🍂 {month}월 제철</p>
      <p className="mt-1 text-[12px] text-faint">
        지금 맛있고 저렴한 재료로 만드는 영상이에요.
      </p>

      <ul className="mt-3 grid gap-2">
        {(items ?? Array.from({ length: 4 })).map((it, i) =>
          it ? (
            <li key={it.name}>
              <Link
                to={it.video ? `/yt/${it.video.id}` : "/fridge"}
                state={
                  it.video
                    ? {
                        title: it.video.title,
                        channel: it.video.channel,
                        query: it.query,
                      }
                    : undefined
                }
                className="flex h-11 items-center gap-2.5 rounded-lg p-1 hover:bg-bg"
              >
                <div className="relative grid h-9 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-accent-soft text-[16px]">
                  {it.video ? (
                    <YtThumb
                      id={it.video.id}
                      className="h-full w-full scale-[1.35] object-cover"
                    />
                  ) : (
                    <span aria-hidden>{it.emoji}</span>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                  <span aria-hidden>{it.emoji}</span> {it.name}
                </span>
                <span className="shrink-0 text-[11px] font-medium text-faint">
                  {it.video ? `▶ ${compactViews(it.video.views)}` : "영상 찾는 중"}
                </span>
              </Link>
            </li>
          ) : (
            <li
              key={i}
              className="h-[44px] animate-pulse rounded-lg bg-line/40"
            />
          ),
        )}
      </ul>
    </div>
  );
}
