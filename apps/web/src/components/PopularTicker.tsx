import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { compactViews } from "@foodplay/core";
import { loadPool } from "../lib/youtubePool";
import { rankTrendsFromPool, type RankedTrend } from "../lib/trends";

/**
 * "지금 많이 보는 요리" — 특정 유튜버가 아니라 **요리(메뉴) 단위** 인기.
 * 평소엔 한 줄씩 넘어가고(실검 느낌), 마우스를 올리거나 탭하면 전체 순위를 펼친다.
 */
export default function PopularTicker() {
  const [ranked, setRanked] = useState<RankedTrend[]>([]);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    loadPool().then((pool) => {
      if (alive) setRanked(rankTrendsFromPool(pool).slice(0, 8));
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ranked.length < 2 || open) return;
    const t = setInterval(() => setI((n) => (n + 1) % ranked.length), 2800);
    return () => clearInterval(t);
  }, [ranked.length, open]);

  const list = useMemo(() => ranked, [ranked]);
  if (list.length === 0) return null;

  const href = (t: RankedTrend) =>
    t.videos[0] ? `/yt/${t.videos[0].id}` : "/fridge";

  return (
    <div
      className="relative rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 shadow-[var(--shadow-card)]"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-accent">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          실시간 인기 요리
        </span>
        <div className="fp-ticker min-w-0 flex-1 text-[14px]">
          <div
            className="fp-ticker-row"
            style={{ transform: `translateY(-${(open ? 0 : i) * 1.6}em)` }}
          >
            {list.map((t, n) => (
              <span
                key={t.name}
                className="flex h-[1.6em] items-center gap-2 truncate"
              >
                <span className="w-4 shrink-0 text-[13px] font-bold tabular text-accent">
                  {n + 1}
                </span>
                <span className="truncate font-semibold">
                  {t.emoji} {t.name}
                </span>
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-[11px] text-faint">{open ? "▲" : "▼"}</span>
      </button>

      {/* 예전 네이버 실검처럼: 칸을 밀지 않고 위에 잠깐 떠서 겹친다 */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-[var(--radius-card)] border border-line bg-surface p-2 shadow-[var(--shadow-float)]">
          <ol>
            {list.map((t, n) => (
              <li key={t.name}>
                <Link
                  to={href(t)}
                  className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[13px] hover:bg-bg"
                >
                  <span className="w-4 shrink-0 text-center font-bold tabular text-accent">
                    {n + 1}
                  </span>
                  <span className="flex-1 truncate font-semibold">
                    {t.emoji} {t.name}
                    {t.rising && (
                      <span className="ml-1.5 rounded bg-accent-soft px-1 py-0.5 text-[10px] font-bold text-accent">
                        상승
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-faint">
                    ▶ {compactViews(t.headlineViews)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
