import { useMemo, useState } from "react";
import { browseRecipes } from "@foodplay/core";
import ResultList from "../components/ResultList";
import AddChipInput from "../components/AddChipInput";
import { useLocalList } from "../lib/useLocalList";
import { CURATED_YT_IDS } from "../lib/curated";

/** 자주 나오는 밀키트 종류. 맥락(유튜브 검색어·곁들임 제안)에 쓴다.
 *  pipeline/collect-youtube.mjs 의 KITS 와 맞춰 둔다. */
const KITS = [
  "밀푀유나베",
  "부대찌개",
  "마라탕",
  "감바스",
  "샤브샤브",
  "곱창전골",
  "파스타",
  "떡볶이",
  "순두부찌개",
  "김치찌개",
  "된장찌개",
  "야끼우동",
  "짬뽕",
  "로제파스타",
  "스키야키",
  "어묵탕",
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
  const mine = useLocalList("foodplay.myMealkits.v1", (s) => s.trim());

  // 곁들일 반찬 = side 태그가 실제로 붙은 레시피만
  const list = useMemo(
    () => browseRecipes(["side"]).filter((m) => m.matchedVibes.includes("side")),
    [],
  );

  const pick = (k: string) => setKit((cur) => (cur === k ? null : k));

  const youtubeQuery = kit
    ? `${kit} 밀키트 곁들이는 반찬`
    : "밀키트에 곁들이는 반찬 레시피";

  const presetSet = new Set(KITS);

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="pb-6 pt-12 sm:pt-16">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
          밀키트, 뭐 곁들여요?
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
          밀키트는 그대로 끓이고, 옆에 낼 <b className="text-ink">반찬 한 접시</b>와
          더 넣을 재료를 채워 드려요.
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7">
        <p className="text-[13px] font-bold text-muted">
          어떤 밀키트예요?{" "}
          <span className="font-medium text-faint">
            (없으면 직접 적어요 — 컬리·쿠팡·이마트몰에서 산 이름 그대로)
          </span>
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {KITS.map((k) => {
            const on = kit === k;
            return (
              <button
                key={k}
                onClick={() => pick(k)}
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

          {mine.items
            .filter((k) => !presetSet.has(k))
            .map((k) => {
              const on = kit === k;
              return (
                <span
                  key={k}
                  className={
                    "inline-flex items-center gap-1 rounded-full border py-1.5 pl-3 pr-1.5 text-[13px] font-medium transition-colors " +
                    (on
                      ? "border-ink bg-ink text-bg"
                      : "border-line bg-surface text-ink")
                  }
                >
                  <button
                    type="button"
                    onClick={() => pick(k)}
                    aria-pressed={on}
                    className="outline-none"
                  >
                    {on ? "✓ " : ""}
                    {k}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      mine.remove(k);
                      if (kit === k) setKit(null);
                    }}
                    aria-label={`${k} 삭제`}
                    className={
                      "grid h-4 w-4 place-items-center rounded-full text-[11px] leading-none transition-colors " +
                      (on
                        ? "bg-white/25 hover:bg-white/40"
                        : "bg-line/70 text-muted hover:bg-line")
                    }
                  >
                    ×
                  </button>
                </span>
              );
            })}

          <AddChipInput
            onAdd={(v) => {
              const clean = v.trim();
              if (!clean) return;
              mine.add(clean);
              setKit(clean);
            }}
            placeholder="예) 밀푀유 나베, 야끼우동"
            ariaLabel="밀키트 직접 추가"
          />
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
            {kit ? `${kit}에` : "밀키트에"} 곁들이기 좋은 빠른 반찬이에요.
            {!kit
              ? " 밀키트 종류를 고르거나 직접 적으면 그에 맞는 영상으로 바뀌어요."
              : presetSet.has(kit)
                ? " 아래 유튜브·먹방 칸은 고른 밀키트에 맞춰 보여드려요."
                : ` ‘${kit}’ 관련 영상은 아직 적어서, 곁들임 반찬 영상 + 위 “유튜브에서 직접” 검색으로 채워요.`}
          </p>
        }
        youtubeQuery={youtubeQuery}
        youtubeIngredients={kit ? [kit] : []}
        youtubeVibes={["side"]}
        youtubeExclude={CURATED_YT_IDS}
      />
    </main>
  );
}
