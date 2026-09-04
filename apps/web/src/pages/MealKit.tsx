import { useMemo, useState } from "react";
import YouTubeRail from "../components/YouTubeRail";
import MukbangRail from "../components/MukbangRail";
import AddChipInput from "../components/AddChipInput";
import { useLocalList } from "../lib/useLocalList";
import { CURATED_YT_IDS } from "../lib/curated";

/** 자주 나오는 밀키트 종류. pipeline/collect-youtube.mjs 의 KITS 와 맞춘다. */
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
  "불닭볶음면",
  "우동",
];

/** 밀키트에 더하면 푸짐해지거나 다른 요리가 되는 재료 (토글 칩). */
const ADDS = [
  "치즈",
  "크림소스",
  "계란",
  "우유",
  "라면사리",
  "우동사리",
  "떡",
  "만두",
  "숙주",
  "대파",
  "베이컨",
  "마요네즈",
];

export default function MealKit() {
  const [kit, setKit] = useState<string | null>(null);
  const [adds, setAdds] = useState<Set<string>>(new Set());
  const myKits = useLocalList("foodplay.myMealkits.v1", (s) => s.trim());
  const myAdds = useLocalList("foodplay.myKitAdds.v1", (s) =>
    s.trim().replace(/\s+/g, ""),
  );

  const pickKit = (k: string) => setKit((cur) => (cur === k ? null : k));
  const toggleAdd = (a: string) =>
    setAdds((cur) => {
      const next = new Set(cur);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });

  const addList = [...adds];
  const ingredients = kit ? [kit, ...addList] : [];

  const query = useMemo(() => {
    if (!kit) return "밀키트 활용 요리";
    return addList.length > 0
      ? `${kit} ${addList.join(" ")} 활용 요리`
      : `${kit} 활용 요리`;
  }, [kit, adds]);

  const presetKits = new Set(KITS);
  const presetAdds = new Set(ADDS);

  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="pb-6 pt-12 sm:pt-16">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
          밀키트, 뭐 더해서 먹어요?
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
          이미 있는 밀키트에 <b className="text-ink">집에 있는 재료</b>를 더해서 더
          푸짐하게, 또는 아예 다른 요리로. (예: 불닭우동 + 크림소스 →
          불닭크림우동)
        </p>
      </section>

      <section className="grid gap-6 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7">
        <div>
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
                  type="button"
                  onClick={() => pickKit(k)}
                  aria-pressed={on}
                  className={chip(on)}
                >
                  {on ? "✓ " : ""}
                  {k}
                </button>
              );
            })}
            {myKits.items
              .filter((k) => !presetKits.has(k))
              .map((k) => (
                <RemovableChip
                  key={k}
                  label={k}
                  on={kit === k}
                  onToggle={() => pickKit(k)}
                  onRemove={() => {
                    myKits.remove(k);
                    if (kit === k) setKit(null);
                  }}
                />
              ))}
            <AddChipInput
              onAdd={(v) => {
                const clean = v.trim();
                if (!clean) return;
                myKits.add(clean);
                setKit(clean);
              }}
              placeholder="예) 불닭우동, 밀푀유 나베"
              ariaLabel="밀키트 직접 추가"
            />
          </div>
        </div>

        <div className="h-px bg-line" />

        <div>
          <p className="text-[13px] font-bold text-muted">
            집에 있는 재료 더하기{" "}
            <span className="font-medium text-faint">(냉장고·서랍 아무거나)</span>
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {ADDS.map((a) => {
              const on = adds.has(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAdd(a)}
                  aria-pressed={on}
                  className={chip(on)}
                >
                  {on ? "✓ " : "+ "}
                  {a}
                </button>
              );
            })}
            {myAdds.items
              .filter((a) => !presetAdds.has(a))
              .map((a) => (
                <RemovableChip
                  key={a}
                  label={a}
                  on={adds.has(a)}
                  onToggle={() => toggleAdd(a)}
                  onRemove={() => {
                    myAdds.remove(a);
                    if (adds.has(a)) toggleAdd(a);
                  }}
                />
              ))}
            <AddChipInput
              onAdd={(v) => {
                const clean = v.trim().replace(/\s+/g, "");
                if (!clean) return;
                myAdds.add(clean);
                toggleAdd(clean);
              }}
              placeholder="예) 청양고추, 참치"
              ariaLabel="더할 재료 직접 추가"
            />
          </div>
        </div>
      </section>

      <section className="py-10">
        {!kit ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
            <p className="text-[15px] text-muted">
              밀키트를 고르거나 직접 적으면, 그걸 활용한 요리 영상을 찾아드려요.
            </p>
          </div>
        ) : (
          <>
            <YouTubeRail
              title="이렇게 만들어 먹어요"
              query={query}
              ingredients={ingredients}
              exclude={CURATED_YT_IDS}
              hint={
                addList.length > 0
                  ? `${kit} + ${addList.join(" + ")} 조합 요리 위주로. 없으면 ${kit} 활용 영상.`
                  : `${kit}를 더 푸짐하게, 또는 다른 요리로 바꾸는 영상이에요.`
              }
            />
            <MukbangRail
              title={`${kit} 먹방`}
              hint={`${kit} 먹는 영상도 같이.`}
              ingredients={[kit]}
            />
          </>
        )}
      </section>
    </main>
  );
}

function chip(on: boolean) {
  return (
    "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors " +
    (on
      ? "border-ink bg-ink text-bg"
      : "border-line bg-surface text-ink hover:border-ink/30")
  );
}

function RemovableChip({
  label,
  on,
  onToggle,
  onRemove,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border py-1.5 pl-3 pr-1.5 text-[13px] font-medium transition-colors " +
        (on ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink")
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className="outline-none"
      >
        {on ? "✓ " : "+ "}
        {label}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} 삭제`}
        className={
          "grid h-4 w-4 place-items-center rounded-full text-[11px] leading-none transition-colors " +
          (on ? "bg-white/25 hover:bg-white/40" : "bg-line/70 text-muted hover:bg-line")
        }
      >
        ×
      </button>
    </span>
  );
}
