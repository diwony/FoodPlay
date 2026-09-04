import { Link } from "react-router-dom";
import { formatCookTime, type Recipe, type VideoFormat } from "@foodplay/core";
import { useDragScroll } from "../lib/useDragScroll";

interface Props {
  recipes: Recipe[];
  /** 현재 보고 있는 형식 — 쇼츠면 추천도 쇼츠로 연결·표시 */
  format?: VideoFormat;
}

export default function RelatedRail({ recipes, format = "long" }: Props) {
  const dragRef = useDragScroll<HTMLDivElement>();
  if (recipes.length === 0) return null;
  const short = format === "short";

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-[17px] font-bold tracking-tight">
        {short ? "추천 쇼츠" : "추천 영상"}
      </h2>
      <div
        ref={dragRef}
        className="no-scrollbar -mx-5 flex cursor-grab select-none snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1"
      >
        {recipes.map((r) => {
          const asShort = short && !!r.short;
          const isNaver = asShort && r.short!.provider === "naver";
          // 네이버 숏폼은 유튜브 썸네일이 없으니 롱폼 썸네일로 대체
          const vid =
            (asShort && !isNaver && r.short!.youtubeId) || r.long.youtubeId;
          return (
            <Link
              key={r.id}
              to={`/recipe/${r.id}${asShort ? "?v=short" : ""}`}
              className={
                "shrink-0 snap-start " + (asShort ? "w-[124px]" : "w-[168px]")
              }
            >
              <img
                src={`https://i.ytimg.com/vi/${vid}/${asShort ? "hqdefault" : "mqdefault"}.jpg`}
                alt=""
                loading="lazy"
                className={
                  "w-full rounded-xl border border-line object-cover " +
                  (asShort ? "aspect-[9/16]" : "aspect-video")
                }
              />
              <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug">
                {r.title}
              </p>
              <p className="text-[11px] text-faint">
                {asShort
                  ? isNaver
                    ? "네이버TV"
                    : "쇼츠"
                  : `${r.long.channel} · ${formatCookTime(r.cookMinutes)}`}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
