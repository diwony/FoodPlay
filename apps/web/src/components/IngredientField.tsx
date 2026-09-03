import { memo, useState } from "react";

const QUICK_ADD = [
  "계란", "김치", "대파", "양파", "두부", "감자", "당근", "애호박",
  "양배추", "부추", "미역", "콩나물", "어묵", "참치캔", "떡볶이떡", "버섯",
  "돼지고기", "소고기", "닭", "된장", "고추장", "밥",
];

const DEFAULT_SET = new Set(QUICK_ADD);

interface Props {
  value: string;
  onChange: (v: string) => void;
  selected: Set<string>;
  onToggle: (item: string) => void;
  /** 사용자가 등록한 "자주 쓰는 재료" */
  myItems: string[];
  onAddMine: (name: string) => void;
  onRemoveMine: (name: string) => void;
}

function IngredientField({
  value,
  onChange,
  selected,
  onToggle,
  myItems,
  onAddMine,
  onRemoveMine,
}: Props) {
  const [draft, setDraft] = useState("");

  const submitDraft = () => {
    const name = draft.trim();
    if (!name) return;
    onAddMine(name);
    onToggle(name); // 등록하면서 바로 선택
    setDraft("");
  };

  // 기본 칩에 이미 있는 건 "내 재료"에서 중복 표시하지 않는다
  const mine = myItems.filter((i) => !DEFAULT_SET.has(i));

  return (
    <div>
      <label className="text-[13px] font-bold text-muted">냉장고 재료</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예) 김치, 계란, 대파, 두부"
        rows={2}
        className="mt-2 w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-ink/40"
      />

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {QUICK_ADD.map((item) => {
          const on = selected.has(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
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

      {/* 내가 자주 쓰는 재료 */}
      <div className="mt-4">
        <p className="text-[12px] font-bold text-faint">내가 자주 쓰는 재료</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {mine.map((item) => {
            const on = selected.has(item);
            return (
              <span
                key={item}
                className={
                  "inline-flex items-center gap-1 rounded-full border py-1.5 pl-3 pr-1.5 text-[13px] font-medium transition-colors " +
                  (on
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-surface text-ink")
                }
              >
                <button
                  type="button"
                  onClick={() => onToggle(item)}
                  aria-pressed={on}
                  className="outline-none"
                >
                  {on ? "✓ " : "+ "}
                  {item}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveMine(item)}
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

          <span className="inline-flex items-center rounded-full border border-dashed border-line bg-surface pl-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitDraft();
                }
              }}
              placeholder="직접 추가"
              aria-label="자주 쓰는 재료 추가"
              className="w-24 bg-transparent px-2 py-1.5 text-[13px] outline-none placeholder:text-faint"
            />
            <button
              type="button"
              onClick={submitDraft}
              aria-label="추가"
              className="grid h-6 w-6 place-items-center rounded-full text-muted transition-colors hover:bg-line/60 hover:text-ink"
            >
              +
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(IngredientField);
