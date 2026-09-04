import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { allRecipes, compactViews } from "@foodplay/core";
import { loadPool, looksCookable, type PoolVideo } from "../lib/youtubePool";
import { usePersona } from "../lib/usePersona";
import YtThumb from "./YtThumb";

/**
 * "이런 것도 있어요" — 인스타 돋보기 피드처럼 훑어보다 발견하는 칸.
 * 검색·필터 없이, 미리 모아둔 영상 풀 + 큐레이션 레시피를 조회수 순으로
 * 섞어 보여준다. 접속마다 순서가 살짝 달라지고, 페르소나를 고르면 그쪽으로 기운다.
 */

interface Tile {
  kind: "recipe" | "video";
  /** 라우팅용 id (레시피 slug 또는 영상 id) */
  key: string;
  /** 썸네일용 유튜브 영상 id */
  thumbId: string;
  to: string;
  title: string;
  sub?: string;
}

const SHOWN_STEP = 16;

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
      key: r.id,
      thumbId: r.long.youtubeId,
      to: `/recipe/${r.id}`,
      title: r.title,
      sub: r.long.channel,
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
      .sort((a, b) => b.vibeHit - a.vibeHit || b.v.views - a.v.views)
      .slice(0, 90)
      .map(({ v }) => ({
        kind: "video" as const,
        key: v.id,
        thumbId: v.id,
        to: `/yt/${v.id}`,
        title: v.title,
        sub: `${v.channel} · ▶ ${compactViews(v.views)}`,
      }));

    const mixed = [...shuffled(recipeTiles, seed).slice(0, 6), ...videoTiles];
    const deduped: Tile[] = [];
    const seen = new Set<string>();
    for (const t of shuffled(mixed, seed + 1)) {
      if (seen.has(t.thumbId)) continue;
      seen.add(t.thumbId);
      deduped.push(t);
    }
    return deduped;
  }, [pool, bias.vibes, seed]);

  // 삭제·비공개된 영상(썸네일 404)은 목록에서 뺀다.
  const [dead, setDead] = useState<Set<string>>(new Set());
  const markDead = useCallback(
    (id: string) => setDead((s) => new Set(s).add(id)),
    [],
  );

  const live = useMemo(
    () => tiles.filter((t) => !dead.has(t.thumbId)),
    [tiles, dead],
  );
  const visible = live.slice(0, shown);
  const more = live.length - visible.length;

  return (
    <section className="py-4">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-[19px] font-bold tracking-tight">이런 것도 있어요</h2>
        <span className="text-[12px] text-faint">훑어보다 발견하는 칸</span>
      </div>

      {pool === null && tiles.length === 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video animate-pulse rounded-lg bg-line/40"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-3 md:grid-cols-4">
            {visible.map((t) => (
              <Link key={t.key} to={t.to} className="group block">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-accent-soft">
                  <YtThumb
                    id={t.thumbId}
                    onDead={markDead}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {t.kind === "recipe" && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-good/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      📖 스텝
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-tight">
                  {t.title}
                </p>
                {t.sub && (
                  <p className="truncate text-[10px] text-faint">{t.sub}</p>
                )}
              </Link>
            ))}
          </div>
          {more > 0 && (
            <button
              onClick={() => setShown((n) => n + SHOWN_STEP)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface py-3 text-[14px] font-semibold text-muted transition-colors hover:border-accent/40 hover:text-ink"
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
