import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  browseRecipes,
  matchRecipes,
  parseIngredients,
  parseVibes,
  vibeLabel,
  type Vibe,
} from "@foodplay/core";
import IngredientField from "../components/IngredientField";
import VibeField from "../components/VibeField";
import RecipeCard from "../components/RecipeCard";
import YouTubeRail from "../components/YouTubeRail";
import { useMyIngredients } from "../lib/useMyIngredients";

export default function Home() {
  const [raw, setRaw] = useState("");
  const [vibeText, setVibeText] = useState("");
  const [manualVibes, setManualVibes] = useState<Vibe[]>([]);
  const myIngredients = useMyIngredients();

  // 입력 중 매칭이 매 키 입력마다 돌지 않도록 지연값 사용
  const deferredRaw = useDeferredValue(raw);
  const deferredVibeText = useDeferredValue(vibeText);

  const ingredients = useMemo(
    () => parseIngredients(deferredRaw),
    [deferredRaw],
  );
  const selectedSet = useMemo(() => new Set(ingredients), [ingredients]);

  const detectedVibes = useMemo(
    () => parseVibes(deferredVibeText),
    [deferredVibeText],
  );
  const vibes = useMemo(
    () => Array.from(new Set([...manualVibes, ...detectedVibes])),
    [manualVibes, detectedVibes],
  );
  const manualSet = useMemo(() => new Set(manualVibes), [manualVibes]);

  const matches = useMemo(
    () => matchRecipes(ingredients, { vibes }),
    [ingredients, vibes],
  );
  const browse = useMemo(() => browseRecipes(vibes), [vibes]);

  const toggleIngredient = useCallback((item: string) => {
    setRaw((cur) => {
      const list = parseIngredients(cur);
      const next = list.includes(item)
        ? list.filter((i) => i !== item)
        : [...list, item];
      return next.join(", ");
    });
  }, []);

  const toggleVibe = useCallback((v: Vibe) => {
    setManualVibes((cur) =>
      cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
    );
  }, []);

  const active = ingredients.length > 0 || vibes.length > 0;
  const list = active ? matches : browse;

  // "더보기" — 처음엔 조금만, 누를 때마다 늘린다.
  const PAGE = 6;
  const [shown, setShown] = useState(PAGE);
  useEffect(() => {
    setShown(PAGE);
  }, [active, ingredients, vibes]);
  const visible = list.slice(0, shown);
  const more = list.length - visible.length;

  // "유튜브에서 더 찾기" 검색어 — 재료가 있으면 재료로, 없으면 고른 기분으로.
  const youtubeQuery = useMemo(() => {
    if (ingredients.length > 0) return `${ingredients.join(" ")} 레시피`;
    if (vibes.length > 0) return `${vibes.map(vibeLabel).join(" ")} 요리 레시피`;
    return "요즘 인기 집밥 레시피";
  }, [ingredients, vibes]);

  return (
    <main className="mx-auto max-w-5xl px-5">
      {/* Hero */}
      <section className="pb-8 pt-14 sm:pt-20">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
          냉장고 → 유튜브 레시피
        </p>
        <h1 className="mt-3 max-w-2xl text-[34px] font-bold leading-[1.12] sm:text-[46px]">
          있는 재료로 뭘 해먹지,
          <br />
          영상으로 바로 보여줄게요.
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
          가진 재료와 오늘 기분을 적으면 만들 수 있는 요리 영상을 찾아주고,
          조리 스텝마다 타임스탬프를 눌러 그 장면으로 건너뜁니다.
        </p>
      </section>

      {/* Input card */}
      <section className="grid gap-6 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7">
        <IngredientField
          value={raw}
          onChange={setRaw}
          selected={selectedSet}
          onToggle={toggleIngredient}
          myItems={myIngredients.items}
          onAddMine={myIngredients.add}
          onRemoveMine={myIngredients.remove}
        />
        <div className="h-px bg-line" />
        <VibeField
          text={vibeText}
          onText={setVibeText}
          picked={manualSet}
          onToggle={toggleVibe}
          detected={detectedVibes}
        />
      </section>

      {/* Results */}
      <section className="py-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[19px] font-bold tracking-tight">
            {active
              ? `만들 수 있는 요리 ${matches.length}`
              : `이런 요리들이 있어요 · ${browse.length}`}
          </h2>
          {active && (
            <span className="text-[12px] text-faint">
              재료 {ingredients.length}
              {vibes.length > 0 ? ` · 기분 ${vibes.length}` : ""}
            </span>
          )}
        </div>

        {active && matches.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
            <p className="text-[15px] text-muted">
              큐레이션 레시피 중엔 딱 맞는 게 없어요. 재료를 조절하거나, 아래에서
              유튜브 관련 영상을 바로 볼 수 있어요.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {visible.map((m, i) => (
                <RecipeCard
                  key={m.recipe.id}
                  match={m}
                  rank={i + 1}
                  browse={!active}
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

        <YouTubeRail query={youtubeQuery} />
      </section>
    </main>
  );
}
