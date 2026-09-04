import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useYouTube } from "../lib/useYouTube";
import {
  liveVideoMeta,
  parseChapters,
  parseRecipeSteps,
  type Chapter,
  type LiveVideoMeta,
} from "../lib/youtubeLive";
import { compactViews } from "@foodplay/core";

interface NavState {
  title?: string;
  channel?: string;
  thumbnail?: string;
}

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

/**
 * 유튜브 검색 결과에서 넘어온 영상을 앱 안에서 재생한다. 큐레이션 레시피처럼
 * 사람이 붙인 스텝 타임스탬프는 없지만, 영상 설명글에서 (1) 챕터(타임스탬프)가
 * 있으면 눌러 이동할 수 있게, (2) 없으면 번호 매긴 조리 순서라도 뽑아서
 * 보여준다. 디저트·베이킹 영상도 같은 화면을 쓴다. 설명글 전문도 함께 표시.
 */
export default function Watch() {
  const { id = "" } = useParams();
  const { state } = useLocation() as { state: NavState | null };
  const hostRef = useRef<HTMLDivElement>(null);
  const { seekTo } = useYouTube(hostRef, id);

  const valid = /^[\w-]{11}$/.test(id);

  const [meta, setMeta] = useState<LiveVideoMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [descOpen, setDescOpen] = useState(false);

  useEffect(() => {
    if (!valid) return;
    let alive = true;
    setLoading(true);
    liveVideoMeta(id).then((m) => {
      if (!alive) return;
      setMeta(m);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id, valid]);

  const chapters: Chapter[] = useMemo(
    () => (meta ? parseChapters(meta.description) : []),
    [meta],
  );
  // 타임스탬프가 없으면 설명글의 번호 매긴 조리 순서라도 뽑아 쓴다.
  const steps = useMemo(
    () =>
      meta && chapters.length === 0 ? parseRecipeSteps(meta.description) : [],
    [meta, chapters.length],
  );

  if (!valid) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-muted">영상을 찾을 수 없어요.</p>
        <Link
          to="/"
          className="mt-4 inline-block text-[14px] font-semibold text-accent"
        >
          ← 처음으로
        </Link>
      </main>
    );
  }

  const title = meta?.title ?? state?.title ?? "유튜브 영상";
  const channel = meta?.channel ?? state?.channel ?? "";

  return (
    <main className="mx-auto max-w-2xl px-5 pb-20">
      <div className="player-slot mt-5">
        <div className="player">
          <div className="yt-frame">
            <div ref={hostRef} />
          </div>
        </div>
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-faint">
        같은 재료로 나온 유튜브 영상
      </p>
      <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-tight">
        {title}
      </h1>
      <p className="mt-1 text-[13px] text-faint">
        {channel}
        {meta && meta.views > 0 && ` · ▶ ${compactViews(meta.views)}`}
      </p>

      {/* 타임라인 (영상 설명글에서 뽑은 챕터) */}
      {loading ? (
        <div className="mt-6 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-lg border border-line bg-line/40"
            />
          ))}
        </div>
      ) : chapters.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-[17px] font-bold tracking-tight text-ink">
            조리 순서 · 타임라인
          </h2>
          <p className="mb-3 mt-0.5 text-[13px] text-faint">
            큐레이션 레시피처럼 사람이 붙인 스텝은 아니고, 영상 설명글의 구간
            표시예요. 시간을 누르면 그 장면으로 이동해요.
          </p>
          <ol className="grid gap-2">
            {chapters.map((c, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-line bg-surface p-3.5"
              >
                <button
                  onClick={() => seekTo(c.seconds)}
                  className="h-fit shrink-0 rounded-lg bg-accent-soft px-2 py-1 text-[12px] font-bold tabular text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  ▶ {fmt(c.seconds)}
                </button>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                    Step {i + 1}
                  </p>
                  <p className="mt-0.5 text-[15px] leading-relaxed">{c.label}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : steps.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-[17px] font-bold tracking-tight text-ink">
            조리 순서
          </h2>
          <p className="mb-3 mt-0.5 text-[13px] text-faint">
            영상 설명글에 적힌 순서예요. 시간 표시가 없어 구간 이동은 안 되지만,
            순서대로 따라 하면 돼요.
          </p>
          <ol className="grid gap-2">
            {steps.map((t, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-line bg-surface p-3.5"
              >
                <span className="h-fit shrink-0 rounded-lg bg-surface px-2 py-1 text-[12px] font-bold tabular text-faint ring-1 ring-line">
                  {i + 1}
                </span>
                <p className="text-[15px] leading-relaxed">{t}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-5 py-4">
          <p className="text-[13px] text-muted">
            이 영상엔 구간 타임스탬프도, 설명글에 적힌 조리 순서도 없어요.
            큐레이션 레시피가 아니라 유튜브 검색에서 바로 가져온 영상이라, 조리
            스텝은 영상을 직접 보며 확인하세요.
          </p>
        </div>
      )}

      {/* 영상 설명글 */}
      {meta?.description?.trim() && (
        <section className="mt-6">
          <button
            onClick={() => setDescOpen((v) => !v)}
            className="flex w-full items-center justify-between text-[13px] font-bold text-ink"
          >
            영상 설명
            <span className="text-[12px] font-medium text-faint">
              {descOpen ? "접기 ▲" : "펼치기 ▼"}
            </span>
          </button>
          {descOpen && (
            <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-muted">
              {meta.description}
            </p>
          )}
        </section>
      )}

      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noreferrer"
        className="mt-6 flex items-center justify-center rounded-xl border border-line py-3 text-[14px] font-semibold text-good transition-colors hover:border-good/40"
      >
        유튜브에서 보기 ↗
      </a>

      <Link
        to="/"
        className="mt-3 block text-center text-[13px] font-medium text-muted hover:text-ink"
      >
        ← 재료 다시 고르기
      </Link>
    </main>
  );
}
