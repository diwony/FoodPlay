import { useMemo, useState } from "react";
import { browseRecipes } from "@foodplay/core";
import ResultList from "../components/ResultList";

/** 밀키트 종류 — 큐레이션 매칭보다는 맥락(유튜브 검색어·곁들임 제안)에 쓴다. */
const KITS = [
  "밀푀유나베",
  "부대찌개",
  "마라탕",
  "감바스",
  "샤브샤브",
  "곱창전골",
  "파스타",
  "떡볶이",
];

/** 밀키트에 더 넣으면 푸짐해지는 것들 (안내용, 토글 아님). */
const BOOSTERS = [
  "숙주",
  "청경채",
  "팽이버섯",
  "만두",
  "라면사리",
  "우동사리",
  "떡",
  "계란",
  "대파",
  "슬라이스치즈",
];

export default function MealKit() {
  const [kit, setKit] = useState<string | null>(null);

  // 곁들일 반찬 = side 태그가 실제로 붙은 레시피만
  const list = useMemo(
    () => browseRecipes(["side"]).filter((m) => m.matchedVibes.includes("side")),
    [],
  );

  const youtubeQuery = kit
    ? `${kit} 밀키트 곁들이는 반찬`
    : "밀키트에 곁들이는 반찬 레시피";

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="pb-6 pt-12 sm:pt-16">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
          밀키트, 뭐 데워요?
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
          밀키트는 그대로 끓이고, 옆에 낼 <b className="text-ink">반찬 한 접시</b>와
          더 넣을 재료를 채워 드려요.
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7">
        <p className="text-[13px] font-bold text-muted">어떤 밀키트예요?</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {KITS.map((k) => {
            const on = kit === k;
            return (
              <button
                key={k}
                onClick={() => setKit(on ? null : k)}
                aria-pressed={on}
                className={
                  "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors " +
                  (on
                    ? "border-ink bg-ink text-bg"
                    : "border-line bg-surface text-ink hover:border-ink/30")
                }
              >
                {on ? "✓ " : ""}
                {k}
              </button>
            );
          })}
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[13px] font-bold text-muted">
            🧊 밀키트에 더 넣으면 푸짐해요
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BOOSTERS.map((b) => (
              <span
                key={b}
                className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      <ResultList
        list={list}
        variant="browse"
        heading={`곁들일 반찬 ${list.length}`}
        note={
          <p className="text-[13px] text-muted">
            {kit ? `${kit}에` : "밀키트에"} 곁들이기 좋은 빠른 반찬이에요. 아래
            유튜브에서 더 찾을 수도 있어요.
          </p>
        }
        youtubeQuery={youtubeQuery}
      />
    </main>
  );
}
