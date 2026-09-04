import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useYouTube } from "../lib/useYouTube";
import {
  liveTranscript,
  liveVideoMeta,
  parseChapters,
  parseIngredientBlock,
  parseRecipeSteps,
  type Chapter,
  type LiveVideoMeta,
} from "../lib/youtubeLive";
import {
  loadPool,
  looksCookable,
  searchPool,
  type PoolVideo,
} from "../lib/youtubePool";
import { compactViews, findIngredients, normalizeIngredient } from "@foodplay/core";
import { useMyIngredients } from "../lib/useMyIngredients";
import YtThumb from "../components/YtThumb";

interface NavState {
  title?: string;
  channel?: string;
  thumbnail?: string;
  /** 홈 추천 등에서 넘어왔을 때: 이 검색어/기분과 관련된 영상을 아래에 보여준다 */
  query?: string;
  vibes?: string[];
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
 * 사람이 붙인 스텝 타임스탬프는 없지만, 영상 설명글에서 최대한 뽑아 보여준다:
 * (1) 챕터(타임스탬프) 있으면 눌러 이동, (2) 없으면 번호 매긴 조리 순서,
 * (3) 그것도 없으면 "재료" 블록이라도. 디저트·베이킹 영상도 같은 화면을 쓴다.
 * 설명글 전문도 함께 표시. (일부 채널은 조리 과정을 영상 자막에만 담는다.)
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

  // 관련 영상 — 미리 모아둔 풀에서. 홈에서 넘어왔으면 그 검색어/기분으로,
  // 아니면 이 영상이 풀에 있으면 그 태그로.
  const [pool, setPool] = useState<PoolVideo[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadPool().then((p) => alive && setPool(p));
    return () => {
      alive = false;
    };
  }, []);

  const related = useMemo<PoolVideo[]>(() => {
    if (!pool) return [];
    const self = pool.find((v) => v.id === id);
    const tokens = (state?.query ?? "")
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    const byTitle = tokens.length
      ? pool
          .filter(
            (v) =>
              v.id !== id &&
              tokens.some((w) => v.title.includes(w)) &&
              looksCookable(v.title),
          )
          .sort((a, b) => b.views - a.views)
      : [];
    const byTag = searchPool(pool, {
      ingredients: self?.tags.filter((t) => /[가-힣]/.test(t)) ?? [],
      vibes: state?.vibes ?? self?.tags.filter((t) => !/[가-힣]/.test(t)) ?? [],
      limit: 12,
      exclude: new Set([id, ...byTitle.map((v) => v.id)]),
    });
    return [...byTitle, ...byTag].slice(0, 8);
  }, [pool, id, state?.query, state?.vibes]);

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
  // 스텝도 없으면 최소한 "재료" 목록이라도 (설명글의 "::재료" 블록, 계량 포함).
  const ingredientBlock = useMemo(
    () => (meta ? parseIngredientBlock(meta.description) : []),
    [meta],
  );

  // 자막(CC) — 설명글에 재료가 안 적혀 있어도 말로 언급했으면 잡아낸다.
  const [transcript, setTranscript] = useState("");
  useEffect(() => {
    if (!valid) return;
    let alive = true;
    liveTranscript(id).then((t) => alive && setTranscript(t));
    return () => {
      alive = false;
    };
  }, [id, valid]);

  // 이 영상이 미리 모아둔 풀에 있으면, 수집 때 붙은 재료 태그도 더한다.
  const poolIngredientTags = useMemo(() => {
    const self = pool?.find((v) => v.id === id);
    return self ? self.tags.filter((t) => /[가-힣]/.test(t)) : [];
  }, [pool, id]);

  // "냉장고에 있어야 할 재료" — 설명글 + 자막 + 풀 태그를 합쳐 뽑는다.
  const myIngredients = useMyIngredients();
  const needIngredients = useMemo(() => {
    const text = `${meta?.description ?? ""}\n${transcript}`;
    const fromText = findIngredients(text, { limit: 18 }).map((f) => f.name);
    const names = Array.from(
      new Set([...poolIngredientTags.map(normalizeIngredient), ...fromText]),
    );
    return names
      .map((name) => ({ name, have: myIngredients.has(name) }))
      .sort((a, b) => Number(b.have) - Number(a.have))
      .slice(0, 16);
  }, [meta?.description, transcript, poolIngredientTags, myIngredients]);

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

      {/* 냉장고에 있어야 할 재료 — 설명글 + 자막 + (풀에 있으면) 수집 태그를 합쳐 뽑는다 */}
      {needIngredients.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[17px] font-bold tracking-tight text-ink">
            냉장고에 이런 게 있어야 해요
          </h2>
          <p className="mb-3 mt-0.5 text-[13px] text-faint">
            영상 설명·자막에서 뽑았어요. 초록색은 내가 등록한 재료예요.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {needIngredients.map(({ name, have }) => (
              <span
                key={name}
                className={
                  "rounded-full px-2.5 py-1 text-[13px] font-semibold " +
                  (have
                    ? "bg-good-soft text-good"
                    : "bg-surface text-muted ring-1 ring-line")
                }
              >
                {have ? "✓ " : ""}
                {name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 재료 (영상 설명글의 "::재료" 블록 — 정확한 계량이 있으면 그대로 보여준다) */}
      {!loading && ingredientBlock.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[17px] font-bold tracking-tight text-ink">
            정확한 계량
          </h2>
          <p className="mb-3 mt-0.5 text-[13px] text-faint">
            영상 설명글에 적힌 그대로예요.
          </p>
          <ul className="grid gap-1.5">
            {ingredientBlock.map((line, i) =>
              /\d|약간|적당|조금|한\s?줌/.test(line) ? (
                <li
                  key={i}
                  className="rounded-xl border border-line bg-surface px-3.5 py-2 text-[14px] leading-relaxed"
                >
                  {line}
                </li>
              ) : (
                <li
                  key={i}
                  className="pt-2 text-[12px] font-bold uppercase tracking-wider text-faint"
                >
                  {line}
                </li>
              ),
            )}
          </ul>
        </section>
      )}

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
            영상 설명글의 구간 표시예요. 시간을 누르면 그 장면으로 이동해요.
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
            영상 설명글에 적힌 순서예요.
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
            {needIngredients.length > 0
              ? "이 영상엔 스텝별 타임스탬프가 없어요. 위 재료 체크리스트를 참고해서 영상을 보며 따라 해 보세요."
              : "이 영상엔 설명글·자막에 조리 순서·재료가 뚜렷하지 않아요. 큐레이션 레시피가 아니라 유튜브 검색에서 바로 가져온 영상이라, 조리 과정은 영상을 직접 보며 확인하세요."}
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

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[17px] font-bold tracking-tight text-ink">
            이어서 볼 만한 영상
          </h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
            {related.map((v) => (
              <Link
                key={v.id}
                to={`/yt/${v.id}`}
                state={{ title: v.title, channel: v.channel, query: state?.query, vibes: state?.vibes }}
                className="group block"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg bg-accent-soft">
                  <YtThumb
                    id={v.id}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-tight">
                  {v.title}
                </p>
                <p className="truncate text-[10px] text-faint">
                  {v.channel}
                  {v.views > 0 && ` · ▶ ${compactViews(v.views)}`}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Link
        to="/"
        className="mt-8 block text-center text-[13px] font-medium text-muted hover:text-ink"
      >
        ← 처음으로
      </Link>
    </main>
  );
}
