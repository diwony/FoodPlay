import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useYouTube } from "../lib/useYouTube";
import {
  liveVideoMeta,
  parseChapters,
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
 * 사람이 붙인 스텝 타임스탬프는 없지만, 영상 설명글에 챕터(타임스탬프)가 있으면
 * 뽑아서 눌러 이동할 수 있게 보여주고, 설명글도 함께 표시한다.
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
        유튜브 검색 결과
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
          <h2 className="text-[13px] font-bold text-ink">
            타임라인
            <span className="ml-1.5 text-[12px] font-medium text-faint">
              영상 설명 기준 · 눌러서 이동
            </span>
          </h2>
          <ol className="mt-2 divide-y divide-line/70 overflow-hidden rounded-[var(--radius-card)] border border-line">
            {chapters.map((c, i) => (
              <li key={i}>
                <button
                  onClick={() => seekTo(c.seconds)}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface"
                >
                  <span className="mt-px shrink-0 rounded bg-ink px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-bg">
                    {fmt(c.seconds)}
                  </span>
                  <span className="text-[13px] leading-snug">{c.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-5 py-4">
          <p className="text-[13px] text-muted">
            이 영상엔 구간 타임스탬프가 없어요. 큐레이션 레시피가 아니라 유튜브
            검색에서 바로 가져온 영상이라, 조리 스텝은 영상을 직접 보며 확인하세요.
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
