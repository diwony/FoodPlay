import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { compactViews, popularRecipes } from "@foodplay/core";

/**
 * "지금 인기" — 조회수 상위 레시피를 실시간 검색어처럼 한 줄씩 위로 넘긴다.
 * 클릭하면 그 레시피로 이동. 조회수 높은 걸 먼저 보여주는 발견 장치.
 */
export default function PopularTicker() {
  const list = useMemo(() => popularRecipes(8), []);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % list.length), 2800);
    return () => clearInterval(t);
  }, [list.length]);

  if (list.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
      <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-accent">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        지금 인기
      </span>
      <div className="fp-ticker min-w-0 flex-1 text-[14px]">
        <div
          className="fp-ticker-row"
          style={{ transform: `translateY(-${i * 1.6}em)` }}
        >
          {list.map((r, n) => (
            <Link
              key={r.id}
              to={`/recipe/${r.id}`}
              className="flex h-[1.6em] items-center gap-2 truncate hover:text-accent"
              aria-hidden={n !== i}
              tabIndex={n === i ? 0 : -1}
            >
              <span className="w-4 shrink-0 text-[13px] font-bold tabular text-accent">
                {n + 1}
              </span>
              <span className="truncate font-semibold">{r.title}</span>
              {r.long.views != null && (
                <span className="shrink-0 text-[12px] font-medium text-faint">
                  ▶ {compactViews(r.long.views)}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
