import { Link } from "react-router-dom";
import { formatCookTime, type Recipe } from "@foodplay/core";

export default function RelatedRail({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-[17px] font-bold tracking-tight">추천 영상</h2>
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
        {recipes.map((r) => (
          <Link
            key={r.id}
            to={`/recipe/${r.id}`}
            className="w-[168px] shrink-0 snap-start"
          >
            <img
              src={`https://i.ytimg.com/vi/${r.youtubeId}/mqdefault.jpg`}
              alt=""
              loading="lazy"
              className="aspect-video w-full rounded-xl border border-line object-cover"
            />
            <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug">
              {r.title}
            </p>
            <p className="text-[11px] text-faint">
              {r.channel} · {formatCookTime(r.cookMinutes)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
