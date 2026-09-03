import { memo } from "react";
import { VIBE_CHIPS, type Vibe } from "@foodplay/core";

interface Props {
  text: string;
  onText: (v: string) => void;
  picked: Set<Vibe>;
  onToggle: (v: Vibe) => void;
  detected: Vibe[];
}

function VibeField({ text, onText, picked, onToggle, detected }: Props) {
  return (
    <div>
      <label className="text-[13px] font-bold text-muted">
        오늘 기분 · 상황 <span className="font-medium text-faint">(선택)</span>
      </label>
      <input
        value={text}
        onChange={(e) => onText(e.target.value)}
        placeholder="예) 비 와서 으슬으슬해 / 집들이 하는데 / 엄마밥 생각남"
        className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-ink/40"
      />
      {detected.length > 0 && (
        <p className="mt-1.5 text-[12px] text-good">
          인식됨: {detected.map((v) => `#${VIBE_CHIPS.find((c) => c.vibe === v)?.label ?? v}`).join("  ")}
        </p>
      )}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {VIBE_CHIPS.map((c) => {
          const on = picked.has(c.vibe);
          return (
            <button
              key={c.vibe}
              type="button"
              onClick={() => onToggle(c.vibe)}
              aria-pressed={on}
              className={
                "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors " +
                (on
                  ? "border-good bg-good text-white"
                  : "border-line bg-surface text-ink hover:border-good/40")
              }
            >
              {c.emoji} {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(VibeField);
