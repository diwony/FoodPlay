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
  estimateBudget,
  vibeLabel,
  WEATHER_CHIPS,
  weatherVibes,
  type Budget,
  type Vibe,
  type Weather,
} from "@foodplay/core";
import ResultList from "../components/ResultList";

const BUDGETS: Budget[] = ["low", "mid", "high"];

export default function Shop() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [budgets, setBudgets] = useState<Set<Budget>>(new Set());
  const [cravings, setCravings] = useState<Set<Vibe>>(new Set());

  function toggle<T>(setFn: Dispatch<SetStateAction<Set<T>>>, v: T) {
    setFn((cur) => {
      const next = new Set(cur);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  const list = useMemo(() => {
    const vibes = Array.from(
      new Set([...(weather ? weatherVibes(weather) : []), ...cravings]),
    );
    let out = browseRecipes(vibes);
    // 맛/날씨를 골랐으면 그와 겹치는 레시피만 남긴다.
    if (vibes.length > 0) out = out.filter((m) => m.matchedVibes.length > 0);
    if (budgets.size > 0) {
      out = out.filter((m) => budgets.has(estimateBudget(m.recipe)));
    }
    return out;
  }, [weather, budgets, cravings]);

  const picked =
    (weather ? 1 : 0) + budgets.size + cravings.size;

  const youtubeQuery = useMemo(() => {
    const bits = [
      weather ? WEATHER_CHIPS.find((w) => w.weather === weather)?.label : null,
      ...Array.from(cravings).map(vibeLabel),
    ].filter(Boolean);
    return bits.length > 0
      ? `${bits.join(" ")} 집밥 레시피`
      : "장보기 저녁 메뉴 추천";
  }, [weather, cravings]);

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="pb-6 pt-12 sm:pt-16">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
          오늘 장 봐서 뭐 해먹지?
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
          예산·날씨·땡기는 맛을 고르면 오늘 저녁을 정해주고, 카드마다{" "}
          <b className="text-ink">장 볼 목록</b>을 뽑아줘요.
        </p>
      </section>

      <section className="grid gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7">
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
      </section>

      <ResultList
        list={list}
        variant="shopping"
        heading={picked > 0 ? `오늘 저녁 후보 ${list.length}` : `이런 메뉴들이 있어요 · ${list.length}`}
        meta={picked > 0 ? `조건 ${picked}` : undefined}
        emptyText="조건이 너무 좁아요. 예산이나 맛을 줄여 보세요."
        youtubeQuery={youtubeQuery}
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
