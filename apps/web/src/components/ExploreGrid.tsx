import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { allRecipes, compactViews } from "@foodplay/core";
import { loadPool, looksCookable, type PoolVideo } from "../lib/youtubePool";
import { usePersona } from "../lib/usePersona";

/**
 * "이런 것도 있어요" — 인스타 돋보기 피드처럼 훑어보다 발견하는 칸.
 * 검색·필터 없이, 미리 모아둔 영상 풀 + 큐레이션 레시피를 조회수 순으로
 * 섞어 보여준다. 접속마다 순서가 살짝 달라지고, 페르소나를 고르면 그쪽으로 기운다.
 */

type Tile =
  | { kind: "recipe"; id: string; title: string; views?: number; big: boolean }
  | { kind: "video"; id: string; title: string; channel: string; views: number; big: boolean };

const SHOWN_STEP = 18;

/** 시드 기반 셔플 — 접속마다 조금씩 다르게, 하지만 렌더 중엔 안정적. */
function shuffled<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ExploreGrid() {
  const { bias } = usePersona();
  const [pool, setPool] = useState<PoolVideo[] | null>(null);
  const [shown, setShown] = useState(SHOWN_STEP);
  const seed = useMemo(() => Math.floor(Math.random() * 233280), []);

  useEffect(() => {
    let alive = true;
    loadPool().then((p) => alive && setPool(p));
    return () => {
      alive = false;
    };
  }, []);

  const tiles = useMemo<Tile[]>(() => {
    const wantVibes = new Set(bias.vibes);

    const recipeTiles: Tile[] = allRecipes().map((r) => ({
      kind: "recipe",
      id: r.id,
      title: r.title,
      views: r.long.views ?? undefined,
      big: false,
    }));

    const videoTiles: Tile[] = (pool ?? [])
      .filter(
        (v) =>
          v.views > 30_000 &&
          !v.tags.includes("mukbang") &&
          looksCookable(v.title),
      )
      .map((v) => ({
        v,
        vibeHit: [...wantVibes].filter((t) => v.tags.includes(t)).length,
      }))
      // 페르소나에 맞는 태그가 있으면 앞으로, 그 다음 조회수
      .sort((a, b) => b.vibeHit - a.vibeHit || b.v.views - a.v.views)
      .slice(0, 80)
      .map(({ v }) => ({
        kind: "video" as const,
        id: v.id,
        title: v.title,
        channel: v.channel,
        views: v.views,
        big: false,
      }));

    // 레시피(스텝 O)를 앞쪽에 조금 섞고, 나머지는 영상으로 채운다.
    const mixed = [
      ...shuffled(recipeTiles, seed).slice(0, 8),
      ...videoTiles,
    ];
    const deduped: Tile[] = [];
    const seen = new Set<string>();
    for (const t of shuffled(mixed, seed + 1)) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      deduped.push(t);
    }
    // 일정 간격마다 큰 타일 (돋보기 피드 느낌)
    return deduped.map((t, n) => ({ ...t, big: n % 7 === 2 }));
  }, [pool, bias.vibes, seed]);

  const visible = tiles.slice(0, shown);
  const more = tiles.length - visible.length;

  return (
    <section className="py-4">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-[19px] font-bold tracking-tight">이런 것도 있어요</h2>
        <span className="text-[12px] text-faint">훑어보다 발견하는 칸</span>
      </div>

      {pool === null && tiles.length === 0 ? (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-line/40"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid auto-rows-[1fr] grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
            {visible.map((t) => (
              <Link
                key={`${t.kind}-${t.id}`}
                to={t.kind === "recipe" ? `/recipe/${t.id}` : `/yt/${t.id}`}
                className={
                  "group relative overflow-hidden rounded-lg bg-accent-soft " +
                  (t.big ? "col-span-2 row-span-2" : "")
                }
              >
                <img
                  src={`https://i.ytimg.com/vi/${t.id}/mqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  className="aspect-square h-full w-full scale-[1.35] object-cover transition-transform duration-300 group-hover:scale-[1.45]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 pt-6">
                  <p
                    className={
                      "font-semibold leading-tight text-white " +
                      (t.big ? "text-[13px] line-clamp-2" : "text-[11px] line-clamp-2")
                    }
                  >
                    {t.title}
                  </p>
                  {t.kind === "video" && (
                    <p className="mt-0.5 text-[10px] text-white/70">
                      {t.channel} · ▶ {compactViews(t.views)}
                    </p>
                  )}
                </div>
                {t.kind === "recipe" && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-good/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    📖 스텝
                  </span>
                )}
              </Link>
            ))}
          </div>
          {more > 0 && (
            <button
              onClick={() => setShown((n) => n + SHOWN_STEP)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface py-3 text-[14px] font-semibold text-muted transition-colors hover:border-accent/40 hover:text-ink"
            >
              <span className="text-[16px] leading-none text-accent">＋</span>
              더 보기
            </button>
          )}
        </>
      )}
    </section>
  );
}
