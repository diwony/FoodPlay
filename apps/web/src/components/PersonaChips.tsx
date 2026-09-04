import { PERSONAS } from "@foodplay/core";
import { usePersona } from "../lib/usePersona";

/**
 * "어떤 분이세요?" — 고르면 추천이 그 대상에 맞게 기울어진다(기기 저장).
 * 안 골라도 그만. 홈에서만 노출한다.
 */
export default function PersonaChips() {
  const { persona, set, meta } = usePersona();

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-[13px] font-bold text-muted">어떤 분이세요?</p>
        <p className="text-[12px] text-faint">
          {meta ? `${meta.label} — ${meta.blurb}` : "고르면 추천이 맞춰져요 (선택)"}
        </p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {PERSONAS.map((p) => {
          const on = persona === p.persona;
          return (
            <button
              key={p.persona}
              type="button"
              aria-pressed={on}
              onClick={() => set(p.persona)}
              className={
                "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors " +
                (on
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-surface text-ink hover:border-accent/40")
              }
            >
              {p.emoji} {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
