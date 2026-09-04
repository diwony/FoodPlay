import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  compactViews,
  estimateCost,
  formatWon,
  getRecipe,
  popularRecipes,
  type Recipe,
} from "@foodplay/core";
import { useRecentRecipes } from "../lib/useRecentRecipes";
import YtThumb from "./YtThumb";

/**
 * "만들어 먹기 통장" — 레시피를 열어볼 때마다 "사 먹을 때 대비 아낀 금액"이 쌓인다.
 * 로그인·서버 없이 기기(localStorage)에 최근 본 레시피를 기록해 계산한다.
 * 처음 방문(기록 없음)이면 인기 레시피로 채워 빈 칸을 피한다.
 */
export default function SavingsWallet() {
  const recentIds = useRecentRecipes();

  const recent = useMemo<Recipe[]>(
    () =>
      recentIds
        .map((id) => getRecipe(id))
        .filter((r): r is Recipe => Boolean(r)),
    [recentIds],
  );

  const total = useMemo(
    () => recent.reduce((s, r) => s + estimateCost(r).save, 0),
    [recent],
  );

  const empty = recent.length === 0;
  const fallback = useMemo(() => (empty ? popularRecipes(3) : []), [empty]);
  const rows = empty ? fallback : recent.slice(0, 3);

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-bold text-muted">💰 만들어 먹기 통장</p>
        {!empty && (
          <span className="text-[11px] text-faint">레시피 {recent.length}개</span>
        )}
      </div>

      {empty ? (
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          레시피를 열어볼 때마다,{" "}
          <b className="text-ink">사 먹을 때와 비교한 절약액</b>이 여기 쌓여요.
        </p>
      ) : (
        <p className="mt-1.5 text-[13px] text-muted">
          지금까지 본 레시피를 다 만들면{" "}
          <b className="text-[16px] font-extrabold text-good">
            약 {formatWon(total)}
          </b>{" "}
          아껴요.
        </p>
      )}

      <ul className="mt-3 grid gap-2">
        {rows.map((r) => {
          const save = estimateCost(r).save;
          return (
            <li key={r.id}>
              <Link
                to={`/recipe/${r.id}`}
                className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-bg"
              >
                <div className="h-9 w-14 shrink-0 overflow-hidden rounded-md bg-accent-soft">
                  <YtThumb
                    id={r.long.youtubeId}
                    className="h-full w-full scale-[1.35] object-cover"
                  />
                </div>
                <span className="flex-1 truncate text-[12px] font-semibold">
                  {r.title}
                </span>
                <span className="shrink-0 text-[11px] font-bold text-good">
                  {empty
                    ? `▶ ${compactViews(r.long.views ?? 0)}`
                    : `${formatWon(save)} 절약`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {empty && (
        <p className="mt-2 text-[11px] text-faint">
          위는 지금 인기 레시피예요. 하나 열어보면 통장이 시작돼요.
        </p>
      )}
    </div>
  );
}
