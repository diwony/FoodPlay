import { Link } from "react-router-dom";
import { seasonalItems } from "@foodplay/core";

/**
 * "이번 달 제철" — 냉장고에 늘 있는 재료는 아니라서 아주 짧게, 곁다리로만.
 * 칩을 누르면 그 재료 + 내가 저장해둔 재료를 합쳐 냉장고 모드로 바로 넘어간다
 * (재료 하나만으로 뜬금없는 영상 하나 대신, "이걸로 뭘 만들 수 있는지"를 보여준다).
 */
export default function SeasonalPicks() {
  const month = new Date().getMonth() + 1;
  const items = seasonalItems();

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
      <span className="text-[12px] font-bold text-muted">🍂 {month}월 제철</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((it) => (
          <Link
            key={it.name}
            to="/fridge"
            state={{ ingredients: [it.name] }}
            className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent hover:bg-accent hover:text-white"
          >
            {it.emoji} {it.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
