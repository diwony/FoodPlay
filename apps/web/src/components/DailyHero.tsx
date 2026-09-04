import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { compactViews, dailyPicks, type DailyPick } from "@foodplay/core";
import {
  loadPool,
  looksCookable,
  searchPool,
  type PoolVideo,
} from "../lib/youtubePool";
import YtThumb from "./YtThumb";

/**
 * 홈 히어로 — "오늘은 이거 어때요?".
 * 계절/절기 시나리오를 접속마다 회전시키고, **바로 그 자리에서** 추천 영상 몇 개를
 * 띄운다(클릭해서 다른 화면으로 넘어가지 않아도 됨). 실시간 날씨 API 는 안 쓴다.
 */
export default function DailyHero() {
  const navigate = useNavigate();
  const [pool, setPool] = useState<PoolVideo[] | null>(null);

  const picks = useMemo<DailyPick[]>(() => {
    const all = dailyPicks();
    const start = Math.floor(Math.random() * all.length);
    return [...all.slice(start), ...all.slice(0, start)];
  }, []);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const pick = picks[i];

  useEffect(() => {
    let alive = true;
    loadPool().then((p) => alive && setPool(p));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % picks.length), 4000);
    return () => clearInterval(t);
  }, [picks.length, paused]);

  const [dead, setDead] = useState<Set<string>>(new Set());
  const markDead = useCallback(
    (id: string) => setDead((s) => new Set(s).add(id)),
    [],
  );

  // 이 추천에 맞는 영상: 검색어 토큰이 제목에 있는 것 우선, 없으면 기분 태그로.
  const videos = useMemo<PoolVideo[]>(() => {
    if (!pool) return [];
    const tokens = pick.query.split(/\s+/).filter((w) => w.length >= 2);
    const byTitle = pool
      .filter((v) => tokens.some((w) => v.title.includes(w)))
      .filter((v) => looksCookable(v.title))
      .sort((a, b) => b.views - a.views);
    const byVibe =
      byTitle.length >= 6
        ? []
        : searchPool(pool, {
            ingredients: [],
            vibes: pick.vibes,
            limit: 6,
            exclude: new Set(byTitle.map((v) => v.id)),
          });
    return [...byTitle, ...byVibe]
      .filter((v) => !dead.has(v.id))
      .slice(0, 4);
  }, [pool, pick, dead]);

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-gradient-to-br from-accent-soft to-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
          오늘은 이거 어때요?
        </p>
        <span className="-mr-1 -mt-1 flex gap-0.5">
          {picks.map((_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => setI(n)}
              aria-label={`추천 ${n + 1}번 보기`}
              aria-current={n === i}
              className="group flex h-5 items-center px-0.5"
            >
              <span
                className={
                  "h-1 rounded-full transition-all group-hover:bg-accent " +
                  (n === i ? "w-4 bg-accent" : "w-1.5 bg-line")
                }
              />
            </button>
          ))}
        </span>
      </div>

      <div key={i} className="fp-fade mt-2">
        <h2 className="flex items-start gap-2.5 text-[20px] font-bold leading-tight tracking-tight sm:text-[25px]">
          <span className="shrink-0 text-[24px] leading-none sm:text-[28px]">
            {pick.emoji}
          </span>
          {pick.headline}
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{pick.sub}</p>
      </div>

      {/* 추천 영상 — 바로 여기서 */}
      <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(videos.length > 0
          ? videos
          : (Array(4).fill(null) as (PoolVideo | null)[])
        ).map((v, n) =>
          v ? (
            <Link
              key={v.id}
              to={`/yt/${v.id}`}
              state={{
                title: v.title,
                channel: v.channel,
                query: pick.query,
                vibes: pick.vibes,
              }}
              className="group block overflow-hidden rounded-lg bg-surface"
            >
              <div className="relative aspect-video overflow-hidden bg-accent-soft">
                <YtThumb
                  id={v.id}
                  onDead={markDead}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="mt-1 line-clamp-2 px-0.5 text-[11px] font-semibold leading-tight">
                {v.title}
              </p>
              <p className="px-0.5 text-[10px] text-faint">
                ▶ {compactViews(v.views)}
              </p>
            </Link>
          ) : (
            <div
              key={n}
              className="aspect-video animate-pulse rounded-lg bg-line/40"
            />
          ),
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={() => {
            const top = videos[0];
            if (top)
              navigate(`/yt/${top.id}`, {
                state: {
                  title: top.title,
                  channel: top.channel,
                  query: pick.query,
                  vibes: pick.vibes,
                },
              });
          }}
          disabled={videos.length === 0}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent disabled:opacity-40"
        >
          바로 재생 <span>→</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/fridge", { state: { vibes: pick.vibes } })}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-ink"
        >
          재료 골라서 찾기
        </button>
      </div>
    </div>
  );
}
