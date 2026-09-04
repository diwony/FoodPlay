import { useEffect, useState, type ReactNode } from "react";
import type { RecipeMatch } from "@foodplay/core";
import RecipeCard from "./RecipeCard";
import YouTubeRail from "./YouTubeRail";
import MukbangRail from "./MukbangRail";

interface Props {
  list: RecipeMatch[];
  heading: string;
  /** 헤딩 오른쪽 작은 메타 (선택) */
  meta?: ReactNode;
  /** 카드 스타일: 매칭(재료) / 둘러보기 / 장보기 */
  variant?: "match" | "browse" | "shopping";
  /** 유튜브 "더 찾기" — 검색어(링크아웃용) + 태그 필터. query 없으면 칸 숨김. */
  youtubeQuery?: string;
  youtubeIngredients?: string[];
  youtubeVibes?: string[];
  youtubeExclude?: string[];
  /** 결과가 0개일 때 문구 */
  emptyText?: string;
  /** 결과 위에 붙일 안내 (선택) */
  note?: ReactNode;
}

const PAGE = 6;

/** 재료·밀키트·장보기 세 모드가 공유하는 결과 목록 + "유튜브에서 더 찾기". */
export default function ResultList({
  list,
  heading,
  meta,
  variant = "browse",
  youtubeQuery,
  youtubeIngredients,
  youtubeVibes,
  youtubeExclude,
  emptyText = "조건에 맞는 레시피가 없어요. 조건을 바꿔 보세요.",
  note,
}: Props) {
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [list]);

  const visible = list.slice(0, shown);
  const more = list.length - visible.length;

  return (
    <section className="py-10">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-[19px] font-bold tracking-tight">{heading}</h2>
        {meta && <span className="shrink-0 text-[12px] text-faint">{meta}</span>}
      </div>

      {note && <div className="mb-4">{note}</div>}

      {list.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
          <p className="text-[15px] text-muted">{emptyText}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((m, i) => (
              <RecipeCard
                key={m.recipe.id}
                match={m}
                rank={i + 1}
                browse={variant === "browse"}
                shopping={variant === "shopping"}
              />
            ))}
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
      )}

      {youtubeQuery && (
        <>
          <YouTubeRail
            query={youtubeQuery}
            ingredients={youtubeIngredients}
            vibes={youtubeVibes}
            exclude={youtubeExclude}
          />
          <MukbangRail
            ingredients={youtubeIngredients}
            vibes={youtubeVibes}
            query={`${youtubeQuery} 먹방`}
          />
        </>
      )}
    </section>
  );
}
