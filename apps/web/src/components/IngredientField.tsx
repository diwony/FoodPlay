import { memo } from "react";

const QUICK_ADD = [
  "계란", "김치", "대파", "양파", "두부", "감자", "당근", "애호박",
  "양배추", "부추", "미역", "콩나물", "어묵", "참치캔", "떡볶이떡", "버섯",
  "돼지고기", "소고기", "닭", "된장", "고추장", "밥",
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  selected: Set<string>;
  onToggle: (item: string) => void;
}

function IngredientField({ value, onChange, selected, onToggle }: Props) {
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
    </div>
  );
}

export default memo(IngredientField);
