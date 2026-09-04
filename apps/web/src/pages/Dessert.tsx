import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import YouTubeRail from "../components/YouTubeRail";
import MukbangRail from "../components/MukbangRail";
import AddChipInput from "../components/AddChipInput";
import { useLocalList } from "../lib/useLocalList";

type Level = "full" | "easy" | "cold";

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
  {
    key: "cold",
    label: "음료 · 아이스크림",
    desc: "안 굽는 것. 아이스크림·주스·스무디·빙수·홈카페",
    emoji: "🥤",
  },
];

const LEVEL_TAG: Record<Level, string> = {
  full: "baking-full",
  easy: "baking-easy",
  cold: "dessert-cold",
};

/** 칩 라벨 = 유튜브 풀의 태그(파이프라인 DESSERT_ING 과 맞춤).
 *  베이킹 재료만이 아니라 냉장고·서랍에 흔한 것도 — "집에 있는 재료로"가 핵심. */
const ING_GROUPS: { label: string; emoji: string; items: string[] }[] = [
  {
    label: "베이킹 가루 · 재료",
    emoji: "🌾",
    items: ["박력분", "강력분", "코코아가루", "젤라틴"],
  },
  {
    label: "냉장고",
    emoji: "🧊",
    items: ["우유", "계란", "버터", "생크림", "크림치즈", "마스카포네", "요거트", "두유"],
  },
  {
    label: "서랍 · 팬트리",
    emoji: "🍯",
    items: ["설탕", "꿀", "초콜릿", "커피가루", "견과류", "오레오", "시리얼", "미숫가루", "식빵", "잼", "연유", "마시멜로"],
  },
  {
    label: "과일 · 얼음",
    emoji: "🍓",
    items: ["딸기", "바나나", "사과", "블루베리", "레몬", "귤", "포도", "냉동과일", "얼음"],
  },
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
  const [params] = useSearchParams();
  const p = params.get("level");
  const initialLevel: Level | null =
    p === "easy" || p === "full" || p === "cold" ? p : null;
  const [level, setLevel] = useState<Level | null>(initialLevel);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [trend, setTrend] = useState<string | null>(null);
  const mine = useLocalList("foodplay.myBakingItems.v1", (s) =>
    s.trim().replace(/\s+/g, ""),
  );
  const myTrends = useLocalList("foodplay.myDessertTrends.v1", (s) => s.trim());

  const toggleIng = (item: string) =>
    setPicked((cur) => {
      const next = new Set(cur);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });

  const addMine = (name: string) => {
    const clean = name.trim().replace(/\s+/g, "");
    if (!clean) return;
    mine.add(clean);
    toggleIng(clean); // 추가하면서 바로 선택
  };
  // 기본 칩에 이미 있는 건 "내 재료"에서 중복 표시하지 않는다
  const presetItems = new Set(ING_GROUPS.flatMap((g) => g.items));

  const ingredients = trend ? [trend] : [...picked];
  // 요즘 뜨는 디저트를 콕 집으면 종류 필터는 무시(그 디저트 전부 보여줌).
  // 종류를 안 골랐으면(null) 다 보여준다.
  const require = trend || !level ? [] : [LEVEL_TAG[level]];

  const query = useMemo(() => {
    if (trend) return `${TREND.find((t) => t.tag === trend)?.label ?? trend} 만들기`;
    const base =
      level === "full"
        ? "홈베이킹"
        : level === "easy"
          ? "노오븐 디저트"
          : level === "cold"
            ? "아이스크림 음료"
            : "디저트";
    return picked.size > 0 ? `${[...picked].join(" ")} ${base}` : `${base} 레시피`;
  }, [trend, level, picked]);

  const heading = trend
    ? `${TREND.find((t) => t.tag === trend)?.label ?? trend} 만드는 영상`
    : level
      ? `${LEVELS.find((l) => l.key === level)?.label} 영상`
      : "디저트 만드는 영상";

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="pb-6 pt-12 sm:pt-16">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
          밥 다 먹었으면, 디저트?
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          만드는 방식을 고르고, <b className="text-ink">집에 있는 재료</b>나{" "}
          <b className="text-ink">요즘 뜨는 디저트</b>를 누르면 만드는 영상을 모아줘요.
          케이크만이 아니라 아이스크림·주스·음료까지.
        </p>
      </section>

      <section className="grid gap-6 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7">
        <div>
          <p className="text-[13px] font-bold text-muted">
            어떻게 만들까요?{" "}
            <span className="font-medium text-faint">
              (선택 안 하면 둘 다 보여줘요)
            </span>
          </p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
            {LEVELS.map((l) => {
              const on = level === l.key;
              return (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLevel((cur) => (cur === l.key ? null : l.key))}
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
            집에 있는 재료 <span className="font-medium text-faint">(냉장고·서랍 아무거나, 선택)</span>
          </p>
          {trend && (
            <p className="mt-1 text-[12px] text-faint">
              &lsquo;{TREND.find((t) => t.tag === trend)?.label ?? trend}&rsquo;를 고르는 동안은
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

            <div>
              <p className="text-[12px] font-bold text-faint">
                <span className="mr-1">✏️</span>내가 넣을 재료
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {mine.items
                  .filter((i) => !presetItems.has(i))
                  .map((item) => {
                    const on = picked.has(item);
                    return (
                      <span
                        key={item}
                        className={
                          "inline-flex items-center gap-1 rounded-full border py-1.5 pl-3 pr-1.5 text-[13px] font-medium transition-colors " +
                          (on
                            ? "border-ink bg-ink text-bg"
                            : "border-line bg-surface text-ink")
                        }
                      >
                        <button
                          type="button"
                          onClick={() => toggleIng(item)}
                          aria-pressed={on}
                          className="outline-none"
                        >
                          {on ? "✓ " : "+ "}
                          {item}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            mine.remove(item);
                            if (picked.has(item)) toggleIng(item);
                          }}
                          aria-label={`${item} 삭제`}
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
                  onAdd={addMine}
                  placeholder="예) 연유, 한천, 인절미"
                  ariaLabel="베이킹 재료 직접 추가"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-line" />

        <div>
          <p className="text-[13px] font-bold text-muted">🔥 요즘 뜨는 디저트</p>
          <p className="mt-0.5 text-[11px] text-faint/80">
            SNS·유튜브에서 요즘 자주 보이는 것들. 누르면 바로 그 디저트 영상으로.
            없으면 직접 적어요.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {TREND.map((t) => {
              const on = trend === t.tag;
              return (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => setTrend(on ? null : t.tag)}
                  aria-pressed={on}
                  className={trendChip(on)}
                >
                  {on ? "✓ " : ""}
                  {t.label}
                </button>
              );
            })}
            {myTrends.items.map((t) => {
              const on = trend === t;
              return (
                <span
                  key={t}
                  className={
                    "inline-flex items-center gap-1 rounded-full border py-1.5 pl-3 pr-1.5 text-[13px] font-medium transition-colors " +
                    (on
                      ? "border-good bg-good text-white"
                      : "border-line bg-surface text-ink")
                  }
                >
                  <button
                    type="button"
                    onClick={() => setTrend(on ? null : t)}
                    aria-pressed={on}
                    className="outline-none"
                  >
                    {on ? "✓ " : ""}
                    {t}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      myTrends.remove(t);
                      if (trend === t) setTrend(null);
                    }}
                    aria-label={`${t} 삭제`}
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
                myTrends.add(clean);
                setTrend(clean);
              }}
              placeholder="예) 약과 아이스크림"
              ariaLabel="요즘 뜨는 디저트 직접 추가"
            />
          </div>
        </div>
      </section>

      <section className="pb-4">
        <YouTubeRail
          title={heading}
          query={query}
          ingredients={ingredients}
          kind="dessert"
          require={require}
          hint="유튜브에서 미리 모아둔 디저트 영상이에요. 고른 방식·재료에 맞춰 거르고, 딱 맞는 게 없으면 검색 링크로."
        />
        <MukbangRail
          title="디저트 먹방"
          hint="달달하게 같이 보는 디저트 먹방이에요."
          ingredients={ingredients}
          kind="dessert-mukbang"
          query={`${query} 먹방`}
        />
      </section>
    </main>
  );
}

function trendChip(on: boolean) {
  return (
    "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors " +
    (on
      ? "border-good bg-good text-white"
      : "border-line bg-surface text-ink hover:border-good/40")
  );
}
