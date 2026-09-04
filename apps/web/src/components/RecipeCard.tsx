import { memo } from "react";
import { Link } from "react-router-dom";
import {
  BUDGET_LABEL,
  compactViews,
  estimateBudget,
  estimateCost,
  formatCookTime,
  formatDifficulty,
  formatWon,
  servesLabel,
  shoppingItems,
  vibeLabel,
  type RecipeMatch,
} from "@foodplay/core";

interface Props {
  match: RecipeMatch;
  rank: number;
  /** 홈 "둘러보기" 모드 — 재료 매칭 정보 없이 레시피만 보여준다 */
  browse?: boolean;
  /** 장보기 모드 — 예산과 "살 것" 목록을 보여준다 */
  shopping?: boolean;
}

function RecipeCardBase({ match, rank, browse = false, shopping = false }: Props) {
  const { recipe, have, missing, score, matchedVibes } = match;
  const pct = Math.round(score * 100);
  const buy = shopping ? shoppingItems(recipe) : [];
  const cost = estimateCost(recipe);
  const views = recipe.long.views ?? null;
  const hot = views != null && views >= 1_000_000;

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="group grid grid-cols-[104px_1fr] gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-3.5 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(23,20,15,.05),0_16px_36px_-14px_rgba(23,20,15,.2)] sm:grid-cols-[128px_1fr]"
    >
      <div className="relative overflow-hidden rounded-xl bg-accent-soft">
        <img
          src={`https://i.ytimg.com/vi/${recipe.long.youtubeId}/mqdefault.jpg`}
          alt=""
          loading="lazy"
          className="aspect-square h-full w-full scale-[1.35] object-cover transition-transform duration-300 group-hover:scale-[1.45]"
        />
        {recipe.short && (
          <span className="absolute bottom-1 right-1 rounded bg-ink/80 px-1 py-0.5 text-[9px] font-bold text-white">
            숏폼
          </span>
        )}
        <span className="absolute bottom-1 left-1 rounded bg-good/90 px-1 py-0.5 text-[9px] font-bold text-white">
          📖 스텝
        </span>
        {!browse && !shopping && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-ink/85 px-1.5 py-0.5 text-[10px] font-bold tabular text-white">
            {rank <= 3 ? `TOP ${rank}` : `${pct}%`}
          </span>
        )}
        {browse && hot && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-accent/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
            🔥 인기
          </span>
        )}
        {shopping && rank <= 3 && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-good/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
            추천 {rank}
          </span>
        )}
      </div>

      <div className="min-w-0 py-0.5">
        <h3 className="text-[16px] font-semibold leading-snug tracking-tight">
          {recipe.title}
        </h3>
        <p className="mt-0.5 text-[12px] text-faint">
          {recipe.long.channel} · {formatCookTime(recipe.cookMinutes)} ·{" "}
          {formatDifficulty(recipe.difficulty)}
          {recipe.serves && <> · {servesLabel(recipe.serves, true)}</>}
          {views != null && (
            <>
              {" · "}
              <span className="font-bold text-accent">
                ▶ 조회수 {compactViews(views)}
              </span>
            </>
          )}
        </p>

        {shopping ? (
          <>
            <p className="mt-1.5 text-[12px] font-semibold text-good">
              장바구니 {BUDGET_LABEL[estimateBudget(recipe)]}
              {matchedVibes.length > 0 && (
                <span className="text-muted">
                  {"  "}
                  {matchedVibes.map((v) => `#${vibeLabel(v)}`).join(" ")}
                </span>
              )}
            </p>
            <p className="mt-1 text-[12px] text-muted">
              🛒 {buy.length > 0 ? buy.slice(0, 5).join(" · ") : "집에 있는 걸로 가능"}
            </p>
          </>
        ) : browse ? (
          <p className="mt-2 text-[12px] font-semibold text-muted">
            {recipe.coreIngredients.slice(0, 4).join(" · ")}
            {matchedVibes.length > 0 && (
              <span className="text-good">
                {"  "}
                {matchedVibes.map((v) => `#${vibeLabel(v)}`).join(" ")}
              </span>
            )}
          </p>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap gap-1">
              {have.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-good-soft px-2 py-0.5 text-[11px] font-semibold text-good"
                >
                  {h}
                </span>
              ))}
              {missing.slice(0, 3).map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent"
                >
                  +{m}
                </span>
              ))}
            </div>

            <p className="mt-2 text-[12px] font-semibold text-muted">
              {missing.length === 0
                ? "지금 재료로 바로 가능"
                : `${missing.length}개만 더 있으면 완성`}
              {matchedVibes.length > 0 && (
                <span className="text-good">
                  {"  "}
                  {matchedVibes.map((v) => `#${vibeLabel(v)}`).join(" ")}
                </span>
              )}
            </p>
          </>
        )}

        {cost.save > 0 && (
          <p className="mt-1.5 text-[12px] font-semibold text-good">
            💸 사 먹으면 {formatWon(cost.eatOut)} → 만들면 {formatWon(cost.make)}
            <span className="text-muted">
              {" "}
              ({formatWon(cost.save)} 아낌)
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}

export default memo(RecipeCardBase);
