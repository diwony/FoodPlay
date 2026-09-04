import { useMemo } from "react";
import { Link } from "react-router-dom";
import { allRecipes, averageSaving, formatWon } from "@foodplay/core";
import DailyHero from "../components/DailyHero";
import PersonaChips from "../components/PersonaChips";
import PopularTicker from "../components/PopularTicker";
import ExploreGrid from "../components/ExploreGrid";

const MODES = [
  {
    to: "/fridge",
    emoji: "🥬",
    title: "냉장고 재료로 만들기",
    desc: "있는 재료(또는 오늘 기분만)를 고르면 만들 수 있는 요리 영상을 찾아줘요.",
    cta: "재료 고르기",
  },
  {
    to: "/mealkit",
    emoji: "🍜",
    title: "밀키트 푸짐하게 보충",
    desc: "냉동실 밀키트는 그대로, 곁들일 반찬 한 접시와 더 넣을 재료를 영상으로.",
    cta: "밀키트 고르기",
  },
  {
    to: "/shop",
    emoji: "🛒",
    title: "장보기 추천",
    desc: "예산·날씨·땡기는 맛으로 오늘 저녁을 정하고, 장 볼 목록까지 뽑아요.",
    cta: "조건 고르기",
  },
  {
    to: "/dessert",
    emoji: "🧁",
    title: "디저트 · 베이킹",
    desc: "본격 / 간단 베이킹을 고르고, 재료나 요즘 뜨는 디저트로 만드는 영상을 찾아요.",
    cta: "디저트 고르기",
  },
];

export default function Landing() {
  const avgSave = useMemo(() => averageSaving(allRecipes()), []);

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="pb-6 pt-10 sm:pt-14">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
          냉장고 → 유튜브 레시피
        </p>
        <h1 className="mt-3 max-w-3xl text-[30px] font-bold leading-[1.12] sm:text-[42px]">
          뭐 먹을지 고민,<br className="sm:hidden" /> 여기서 끝내요.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          지금 상황만 고르면 조리 스텝마다 타임스탬프가 붙은 유튜브 요리 영상으로
          바로 이어줘요. <b className="text-good">사 먹을 때보다 평균 {formatWon(avgSave)}</b>{" "}
          아끼는 건 덤이고요.
        </p>
      </section>

      <div className="grid gap-4 pb-4 lg:grid-cols-[1.5fr_1fr]">
        <DailyHero />
        <div className="flex flex-col justify-between gap-4">
          <PopularTicker />
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
            <PersonaChips />
          </div>
        </div>
      </div>

      <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(23,20,15,.05),0_20px_44px_-16px_rgba(23,20,15,.24)]"
          >
            <span className="text-[32px] leading-none">{m.emoji}</span>
            <h2 className="mt-4 text-[18px] font-bold tracking-tight">{m.title}</h2>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">
              {m.desc}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
              {m.cta}
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </Link>
        ))}
      </section>

      <div className="border-t border-line pt-2">
        <ExploreGrid />
      </div>
    </main>
  );
}
