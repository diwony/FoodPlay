import {
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  BUDGET_LABEL,
  browseRecipes,
  CRAVING_VIBES,
  CUISINES,
  cuisineLabel,
  estimateBudget,
  MENU_KINDS,
  menuKeywords,
  menuKind,
  parseVibes,
  SERVES_ALL,
  servesLabel,
  vibeLabel,
  WEATHER_CHIPS,
  weatherVibes,
  type Budget,
  type Cuisine,
  type Recipe,
  type Serves,
  type Vibe,
  type Weather,
} from "@foodplay/core";
import ResultList from "../components/ResultList";
import { CURATED_YT_IDS } from "../lib/curated";

const BUDGETS: Budget[] = ["low", "mid", "high"];

/** 자유 입력 · 메뉴 종류 매칭에 쓸 레시피 텍스트 (제목 + 재료). */
function recipeText(r: Recipe): string {
  return [r.title, ...r.coreIngredients, ...r.extraIngredients].join(" ");
}

export default function Shop() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [budgets, setBudgets] = useState<Set<Budget>>(new Set());
  const [cravings, setCravings] = useState<Set<Vibe>>(new Set());
  const [serves, setServes] = useState<Set<Serves>>(new Set());
  const [cuisines, setCuisines] = useState<Set<Cuisine>>(new Set());
  const [menus, setMenus] = useState<Set<string>>(new Set());
  const [keyword, setKeyword] = useState("");

  function toggle<T>(setFn: Dispatch<SetStateAction<Set<T>>>, v: T) {
    setFn((cur) => {
      const next = new Set(cur);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  const kw = keyword.trim();
  const kwTokens = useMemo(
    () => kw.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean),
    [kw],
  );
  const detectedVibes = useMemo(() => parseVibes(kw), [kw]);

  const list = useMemo(() => {
    const vibes = Array.from(
      new Set([
        ...(weather ? weatherVibes(weather) : []),
        ...cravings,
        ...detectedVibes,
      ]),
    );
    let out = browseRecipes(vibes);
    // 맛/날씨를 골랐으면 그와 겹치는 레시피만 남긴다.
    if (vibes.length > 0) out = out.filter((m) => m.matchedVibes.length > 0);
    if (budgets.size > 0) {
      out = out.filter((m) => budgets.has(estimateBudget(m.recipe)));
    }
    if (serves.size > 0) {
      out = out.filter((m) => m.recipe.serves && serves.has(m.recipe.serves));
    }
    if (cuisines.size > 0) {
      out = out.filter((m) => m.recipe.cuisine && cuisines.has(m.recipe.cuisine));
    }
    // 메뉴 종류 · 자유 입력은 부드러운 필터 — 큐레이션이 비면 아래 유튜브가 받는다.
    if (menus.size > 0) {
      const kws = Array.from(menus).flatMap((id) => menuKind(id)?.keywords ?? []);
      out = out.filter((m) => {
        const t = recipeText(m.recipe);
        return kws.some((k) => t.includes(k));
      });
    }
    // 짧게 넣은 키워드(1~2개)는 큐레이션도 좁힌다. 문장으로 길게 쓰면
    // 위에서 감지한 vibe 로만 반영하고 하드 필터는 하지 않는다.
    if (kwTokens.length > 0 && kwTokens.length <= 2) {
      out = out.filter((m) => {
        const t = recipeText(m.recipe);
        return kwTokens.every((k) => t.includes(k));
      });
    }
    return out;
  }, [weather, budgets, cravings, serves, cuisines, menus, kwTokens, detectedVibes]);

  const picked =
    (weather ? 1 : 0) +
    budgets.size +
    cravings.size +
    serves.size +
    cuisines.size +
    menus.size +
    (kw ? 1 : 0);

  const youtubeQuery = useMemo(() => {
    const bits = [
      kw,
      ...Array.from(cuisines).map((c) => cuisineLabel(c, true)),
      ...menuKeywords(menus),
      weather ? WEATHER_CHIPS.find((w) => w.weather === weather)?.label : null,
      ...Array.from(cravings).map(vibeLabel),
      ...Array.from(serves).map((s) => servesLabel(s, true)),
    ].filter(Boolean);
    return bits.length > 0
      ? `${bits.join(" ")} 레시피`
      : "장보기 저녁 메뉴 추천";
  }, [kw, weather, cravings, serves, cuisines, menus]);

  const youtubeVibes = useMemo(
    () =>
      Array.from(
        new Set([
          ...(weather ? weatherVibes(weather) : []),
          ...cravings,
          ...detectedVibes,
        ]),
      ),
    [weather, cravings, detectedVibes],
  );

  const softMiss =
    list.length === 0 && (cuisines.size > 0 || menus.size > 0 || kw.length > 0);

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="pb-6 pt-12 sm:pt-16">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
          오늘 장 봐서 뭐 해먹지?
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          예산·날씨·땡기는 맛·메뉴 종류를 고르거나 직접 입력하면 오늘 저녁을
          정해주고, 카드마다 <b className="text-ink">장 볼 목록</b>을 뽑아줘요.
        </p>
      </section>

      <section className="grid gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7">
        <div>
          <label
            htmlFor="shop-keyword"
            className="text-[13px] font-bold text-muted"
          >
            직접 입력{" "}
            <span className="font-medium text-faint">
              (재료·메뉴·상황 아무거나)
            </span>
          </label>
          <input
            id="shop-keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예) 두부 새우 / 비 오는데 얼큰한 국물 / 손님상 파스타"
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-ink/40"
          />
          {detectedVibes.length > 0 && (
            <p className="mt-1.5 text-[12px] text-good">
              인식됨: {detectedVibes.map((v) => `#${vibeLabel(v)}`).join("  ")}
            </p>
          )}
        </div>

        <div className="h-px bg-line" />

        <Field label="날씨">
          {WEATHER_CHIPS.map((w) => (
            <Chip
              key={w.weather}
              on={weather === w.weather}
              onClick={() =>
                setWeather((cur) => (cur === w.weather ? null : w.weather))
              }
            >
              {w.emoji} {w.label}
            </Chip>
          ))}
        </Field>

        <div className="h-px bg-line" />

        <Field label="예산 (장바구니)">
          {BUDGETS.map((b) => (
            <Chip key={b} on={budgets.has(b)} onClick={() => toggle(setBudgets, b)}>
              {BUDGET_LABEL[b]}
            </Chip>
          ))}
        </Field>

        <div className="h-px bg-line" />

        <Field label="땡기는 맛">
          {CRAVING_VIBES.map((v) => (
            <Chip key={v} on={cravings.has(v)} onClick={() => toggle(setCravings, v)}>
              #{vibeLabel(v)}
            </Chip>
          ))}
        </Field>

        <div className="h-px bg-line" />

        <Field label="누구랑 · 몇 인분">
          {SERVES_ALL.map((s) => (
            <Chip key={s} on={serves.has(s)} onClick={() => toggle(setServes, s)}>
              {servesLabel(s)}
            </Chip>
          ))}
        </Field>

        <div className="h-px bg-line" />

        <Field label="요리 계열">
          {CUISINES.map((c) => (
            <Chip key={c} on={cuisines.has(c)} onClick={() => toggle(setCuisines, c)}>
              {cuisineLabel(c)}
            </Chip>
          ))}
        </Field>

        <div className="h-px bg-line" />

        <Field label="메뉴 종류">
          {MENU_KINDS.map((m) => (
            <Chip
              key={m.id}
              on={menus.has(m.id)}
              onClick={() => toggle(setMenus, m.id)}
            >
              {m.emoji} {m.label}
            </Chip>
          ))}
        </Field>
      </section>

      <ResultList
        list={list}
        variant="shopping"
        heading={picked > 0 ? `오늘 저녁 후보` : `이런 메뉴들이 있어요`}
        meta={picked > 0 ? `조건 ${picked}` : undefined}
        note={
          softMiss ? (
            <p className="rounded-xl border border-dashed border-line bg-surface/60 px-4 py-3 text-[13px] leading-relaxed text-muted">
              고른 조건에 맞는 <b className="text-ink">큐레이션 레시피</b>는 아직
              없어요. 대신 아래 <b className="text-ink">유튜브</b>에서 같은
              조건으로 찾아드릴게요.
            </p>
          ) : undefined
        }
        emptyText="조건이 너무 좁아요. 예산·인분·분류를 줄여 보세요."
        youtubeQuery={youtubeQuery}
        youtubeVibes={youtubeVibes}
        youtubeExclude={CURATED_YT_IDS}
      />
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-bold text-muted">{label}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={
        "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors " +
        (on
          ? "border-good bg-good text-white"
          : "border-line bg-surface text-ink hover:border-good/40")
      }
    >
      {children}
    </button>
  );
}
