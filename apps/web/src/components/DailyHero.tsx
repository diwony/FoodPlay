import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dailyPicks, type DailyPick } from "@foodplay/core";

/**
 * 홈 히어로 — "오늘은 이거 어때요?".
 * 접속 시각 + 세션 난수로 시작점을 잡고, 몇 초마다 다음 시나리오로 넘어간다.
 * (계절/절기 기반. 실시간 날씨 API 는 부르지 않는다 — suggest.ts 참고)
 */
export default function DailyHero() {
  const navigate = useNavigate();
  const picks = useMemo<DailyPick[]>(() => {
    const all = dailyPicks();
    // 접속마다 순서를 살짝 섞어 "매번 조금씩 다르게".
    const start = Math.floor(Math.random() * all.length);
    return [...all.slice(start), ...all.slice(0, start)];
  }, []);

  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % picks.length), 6000);
    return () => clearInterval(t);
  }, [picks.length]);

  const pick = picks[i];

  return (
    <button
      type="button"
      onClick={() => navigate("/fridge", { state: { vibes: pick.vibes } })}
      className="group relative block w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-gradient-to-br from-accent-soft to-surface p-6 text-left shadow-[var(--shadow-card)] transition-shadow hover:shadow-[0_2px_4px_rgba(23,20,15,.05),0_20px_44px_-16px_rgba(23,20,15,.22)] sm:p-8"
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
        오늘은 이거 어때요?
      </p>
      <div key={i} className="fp-fade mt-2">
        <h2 className="flex items-start gap-2.5 text-[22px] font-bold leading-tight tracking-tight sm:text-[27px]">
          <span className="shrink-0 text-[26px] leading-none sm:text-[30px]">
            {pick.emoji}
          </span>
          {pick.headline}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{pick.sub}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
        이걸로 영상 찾기
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>

      <span className="pointer-events-none absolute right-4 top-4 flex gap-1">
        {picks.map((_, n) => (
          <span
            key={n}
            className={
              "h-1 rounded-full transition-all " +
              (n === i ? "w-4 bg-accent" : "w-1 bg-line")
            }
          />
        ))}
      </span>
    </button>
  );
}
