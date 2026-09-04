import { useMemo, useState } from "react";
import YouTubeRail from "../components/YouTubeRail";
import MukbangRail from "../components/MukbangRail";

type Level = "full" | "easy";

const LEVELS: { key: Level; label: string; desc: string; emoji: string }[] = [
  {
    key: "full",
    label: "본격 베이킹",
    desc: "오븐·계량 제대로. 파운드케이크·스콘·마들렌",
    emoji: "🧑‍🍳",
  },
  {
    key: "easy",
    label: "간단 베이킹",
    desc: "노오븐·전자레인지·에어프라이어. 푸딩·티라미수·크로플",
    emoji: "⚡",
  },
];

/** 칩 라벨 = 유튜브 풀의 태그(파이프라인 DESSERT_ING 과 맞춤). */
const ING_GROUPS: { label: string; emoji: string; items: string[] }[] = [
  { label: "가루", emoji: "🌾", items: ["박력분", "강력분", "코코아가루"] },
  {
    label: "유제품 · 냉장",
    emoji: "🧈",
    items: ["버터", "생크림", "우유", "크림치즈", "마스카포네", "계란"],
  },
  {
    label: "단맛 · 향",
    emoji: "🍫",
    items: ["초콜릿", "커피가루"],
  },
  { label: "과일 · 토핑", emoji: "🍓", items: ["딸기", "바나나", "오레오", "견과류"] },
];

/** 요즘 뜨는 / 뜰 것 같은 디저트 — 재료가 아니라 디저트 이름으로 바로 찾기.
 *  파이프라인 DESSERT_TREND 의 태그와 맞춘다. */
const TREND: { tag: string; label: string }[] = [
  { tag: "두바이초콜릿", label: "두바이 초콜릿" },
  { tag: "크로플", label: "크로플" },
  { tag: "마리토쪼", label: "마리토쪼" },
  { tag: "밤티라미수", label: "밤 티라미수" },
  { tag: "약과쿠키", label: "약과 쿠키" },
  { tag: "뚱카롱", label: "뚱카롱" },
  { tag: "소금빵", label: "소금빵" },
  { tag: "바스크치즈케이크", label: "바스크 치즈케이크" },
  { tag: "개성주악", label: "개성주악" },
];

export default function Dessert() {
  const [level, setLevel] = useState<Level>("easy");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [trend, setTrend] = useState<string | null>(null);

  const toggleIng = (item: string) =>
    setPicked((cur) => {
      const next = new Set(cur);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });

  const levelTag = level === "full" ? "baking-full" : "baking-easy";
  const ingredients = trend ? [trend] : [...picked];
  // 요즘 뜨는 디저트를 콕 집으면 난이도 필터는 무시(그 디저트 전부 보여줌).
  const require = trend ? [] : [levelTag];

  const query = useMemo(() => {
    if (trend) return `${TREND.find((t) => t.tag === trend)?.label ?? trend} 만들기`;
    const base = level === "full" ? "홈베이킹" : "노오븐 디저트";
    return picked.size > 0 ? `${[...picked].join(" ")} ${base}` : `${base} 레시피`;
  }, [trend, level, picked]);

  const heading = trend
    ? `${TREND.find((t) => t.tag === trend)?.label} 영상`
    : level === "full"
      ? "본격 베이킹 영상"
      : "간단 베이킹 영상";

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="pb-6 pt-12 sm:pt-16">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
          밥 다 먹었으면, 디저트?
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
          <b className="text-ink">본격 / 간단</b>을 고르고, 집에 있는 베이킹 재료나{" "}
          <b className="text-ink">요즘 뜨는 디저트</b>를 누르면 만드는 영상을 모아줘요.
        </p>
      </section>

      <section className="grid gap-6 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7">
        <div>
          <p className="text-[13px] font-bold text-muted">어떻게 만들까요?</p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            {LEVELS.map((l) => {
              const on = level === l.key;
              return (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLevel(l.key)}
                  aria-pressed={on}
                  className={
                    "rounded-xl border p-3.5 text-left transition-colors " +
                    (on
                      ? "border-ink bg-ink text-bg"
                      : "border-line bg-surface hover:border-ink/30")
                  }
                >
                  <span className="text-[15px] font-bold">
                    {l.emoji} {l.label}
                  </span>
                  <span
                    className={
                      "mt-0.5 block text-[12px] " +
                      (on ? "text-bg/70" : "text-faint")
                    }
                  >
                    {l.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-line" />

        <div>
          <p className="text-[13px] font-bold text-muted">
            집에 있는 베이킹 재료 <span className="font-medium text-faint">(선택)</span>
          </p>
          {trend && (
            <p className="mt-1 text-[12px] text-faint">
              &lsquo;{TREND.find((t) => t.tag === trend)?.label}&rsquo;를 고르는 동안은
              재료 필터가 잠깐 꺼져요.
            </p>
          )}
          <div
            className={
              "mt-2 grid gap-3 " + (trend ? "pointer-events-none opacity-40" : "")
            }
          >
            {ING_GROUPS.map((g) => (
              <div key={g.label}>
                <p className="text-[12px] font-bold text-faint">
                  <span className="mr-1">{g.emoji}</span>
                  {g.label}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {g.items.map((item) => {
                    const on = picked.has(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleIng(item)}
                        aria-pressed={on}
                        className={
                          "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors " +
                          (on
                            ? "border-ink bg-ink text-bg"
                            : "border-line bg-surface text-ink hover:border-ink/30")
                        }
                      >
                        {on ? "✓ " : "+ "}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-line" />

        <div>
          <p className="text-[13px] font-bold text-muted">🔥 요즘 뜨는 디저트</p>
          <p className="mt-0.5 text-[11px] text-faint/80">
            SNS·유튜브에서 요즘 자주 보이는 것들. 누르면 바로 그 디저트 영상으로.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TREND.map((t) => {
              const on = trend === t.tag;
              return (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => setTrend(on ? null : t.tag)}
                  aria-pressed={on}
                  className={
                    "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors " +
                    (on
                      ? "border-good bg-good text-white"
                      : "border-line bg-surface text-ink hover:border-good/40")
                  }
                >
                  {on ? "✓ " : ""}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10">
        <h2 className="text-[19px] font-bold tracking-tight">{heading}</h2>
        <p className="mt-1 text-[13px] text-muted">
          유튜브에서 미리 모아둔 디저트·베이킹 영상이에요. 영상을 누르면 재생
          화면으로 넘어가요.
        </p>

        <YouTubeRail
          title="만드는 영상"
          query={query}
          ingredients={ingredients}
          kind="dessert"
          require={require}
          hint="난이도와 재료에 맞춰 걸러 보여줘요. 딱 맞는 게 없으면 검색 링크로."
        />
        <MukbangRail
          title="디저트 먹방"
          hint="달달하게 같이 보는 디저트 먹방이에요."
          ingredients={ingredients}
          kind="dessert-mukbang"
        />
      </section>
    </main>
  );
}
