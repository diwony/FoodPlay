import { useCallback, useDeferredValue, useMemo, useState } from "react";
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
import ResultList from "../components/ResultList";
import { useMyIngredients } from "../lib/useMyIngredients";
import { CURATED_YT_IDS } from "../lib/curated";

export default function Fridge() {
  const [raw, setRaw] = useState("");
  const [vibeText, setVibeText] = useState("");
  const [manualVibes, setManualVibes] = useState<Vibe[]>([]);
  const myIngredients = useMyIngredients();

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

  // 재료가 있으면 재료 매칭, 없으면 (기분만 골라도) 둘러보기를 기분순으로.
  const matched = useMemo(
    () => (ingredients.length > 0 ? matchRecipes(ingredients, { vibes }) : []),
    [ingredients, vibes],
  );
  const browse = useMemo(() => browseRecipes(vibes), [vibes]);
  // "요즘 뜨는" 재료처럼 큐레이션 레시피가 아직 없는 재료를 골랐을 때:
  // 빈 화면 대신 둘러보기로 목록을 채우고, 유튜브·먹방 칸은 그대로 고른
  // 재료로 걸러 보여준다.
  const noCurated = ingredients.length > 0 && matched.length === 0;
  const list = ingredients.length > 0 && !noCurated ? matched : browse;

  const toggleIngredient = useCallback((item: string) => {
    setRaw((cur) => {
      const l = parseIngredients(cur);
      const next = l.includes(item) ? l.filter((i) => i !== item) : [...l, item];
      return next.join(", ");
    });
  }, []);

  const toggleVibe = useCallback((v: Vibe) => {
    setManualVibes((cur) =>
      cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
    );
  }, []);

  const hasIngredients = ingredients.length > 0;
  const youtubeQuery = hasIngredients
    ? `${ingredients.join(" ")} 레시피`
    : vibes.length > 0
      ? `${vibes.map(vibeLabel).join(" ")} 요리 레시피`
      : "요즘 인기 집밥 레시피";

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="pb-6 pt-12 sm:pt-16">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
          냉장고에 뭐 있어요?
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          가진 재료를 고르면 만들 수 있는 요리 영상을 찾아줘요. 재료 없이{" "}
          <b className="text-ink">오늘 기분·상황만 골라도</b> 추천이 떠요.
        </p>
      </section>

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

      <ResultList
        list={list}
        variant={hasIngredients && !noCurated ? "match" : "browse"}
        heading={
          noCurated
            ? `유튜브에서 찾아봤어요`
            : hasIngredients
              ? `만들 수 있는 요리 ${list.length}`
              : vibes.length > 0
                ? `이 기분엔 이런 요리 ${list.length}`
                : `이런 요리들이 있어요 · ${list.length}`
        }
        meta={
          hasIngredients
            ? `재료 ${ingredients.length}${vibes.length ? ` · 기분 ${vibes.length}` : ""}`
            : vibes.length > 0
              ? `기분 ${vibes.length}`
              : undefined
        }
        note={
          noCurated ? (
            <p className="rounded-xl border border-dashed border-line bg-surface/60 px-4 py-3 text-[13px] leading-relaxed text-muted">
              <b className="text-ink">{ingredients.join(", ")}</b> 로 만드는 큐레이션
              레시피(스텝 타임스탬프)는 아직 준비 중이에요. 대신 아래{" "}
              <b className="text-ink">유튜브에서 더 찾기</b>·
              <b className="text-ink">같이 보는 먹방</b> 칸을 고른 재료에 맞춰
              보여드릴게요. 그 사이 다른 요리도 둘러보세요.
            </p>
          ) : undefined
        }
        emptyText="매칭되는 레시피가 없어요. 재료를 더하거나 빼고, 아래에서 유튜브도 볼 수 있어요."
        youtubeQuery={youtubeQuery}
        youtubeIngredients={ingredients}
        youtubeVibes={vibes}
        youtubeExclude={CURATED_YT_IDS}
      />
    </main>
  );
}
