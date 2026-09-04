import { useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  formatCookTime,
  formatDifficulty,
  formatServes,
  formatTimestamp,
  getRecipe,
  relatedRecipes,
  shortEmbedUrl,
  shortWatchUrl,
  type VideoFormat,
} from "@foodplay/core";
import { useMiniPlayer } from "../lib/useMiniPlayer";
import { useYouTube } from "../lib/useYouTube";
import RelatedRail from "../components/RelatedRail";
import ReceptionBlock from "../components/ReceptionBlock";
import BlogRail from "../components/BlogRail";

export default function Recipe() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const recipe = getRecipe(id);
  const hostRef = useRef<HTMLDivElement>(null);

  const [fmt, setFmt] = useState<VideoFormat>(
    searchParams.get("v") === "short" ? "short" : "long",
  );
  const useShort = fmt === "short" && !!recipe?.short;
  const short = recipe?.short;
  // 네이버TV 등 비유튜브 숏폼은 iframe 임베드로, 유튜브는 IFrame Player API로 붙인다
  const naverEmbed = useShort && short ? shortEmbedUrl(short) : null;
  const ytVideoId = naverEmbed
    ? ""
    : useShort
      ? short?.youtubeId ?? ""
      : recipe?.long.youtubeId ?? "";

  // 쇼츠(세로 영상)·네이버 임베드일 땐 미니 플레이어 비활성
  const { slotRef, mini, expand } = useMiniPlayer(!useShort);
  const player = useYouTube(hostRef, ytVideoId);

  if (!recipe) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-muted">레시피를 찾을 수 없어요.</p>
        <Link to="/" className="mt-4 inline-block text-[14px] font-semibold text-accent">
          ← 처음으로
        </Link>
      </main>
    );
  }

  const related = relatedRecipes(recipe.id);
  const activeChannel = useShort ? recipe.short!.channel : recipe.long.channel;
  const isNaver = useShort && recipe.short!.provider === "naver";
  const watchUrl = useShort
    ? shortWatchUrl(recipe.short!)
    : `https://www.youtube.com/watch?v=${recipe.long.youtubeId}`;
  const watchLabel = !useShort
    ? "유튜브에서 전체 영상 보기"
    : isNaver
      ? "네이버TV에서 보기"
      : "유튜브에서 쇼츠 보기";

  const jump = (s: number) => {
    player.seekTo(s);
    if (mini) expand();
  };

  return (
    <main className="mx-auto max-w-2xl px-5 pb-20">
      {/* 단일 플레이어 — 롱폼은 스크롤 시 우상단 미니로, 쇼츠는 세로 프레임 */}
      <div
        ref={slotRef}
        className={"player-slot mt-5" + (useShort ? " is-portrait" : "")}
      >
        <div className={"player" + (mini ? " is-mini" : "")}>
          <div className="yt-frame">
            {naverEmbed ? (
              <iframe
                src={naverEmbed}
                title={recipe.title}
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <div ref={hostRef} />
            )}
          </div>
          {mini && (
            <>
              <button
                onClick={expand}
                aria-label="영상 펼치기"
                className="absolute inset-0"
              />
              <button
                onClick={player.pause}
                aria-label="미니 영상 닫기"
                className="absolute right-1 top-1 z-10 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-[11px] font-bold text-white"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* 롱폼 / 숏폼 선택 */}
      {recipe.short && (
        <div className="mt-4 inline-flex rounded-full border border-line bg-surface p-0.5 text-[13px] font-semibold">
          {(["long", "short"] as VideoFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFmt(f)}
              aria-pressed={fmt === f}
              className={
                "rounded-full px-3.5 py-1.5 transition-colors " +
                (fmt === f ? "bg-ink text-bg" : "text-muted hover:text-ink")
              }
            >
              {f === "long"
                ? "롱폼 · 자세히"
                : isNaver
                  ? "네이버TV · 빠르게"
                  : "쇼츠 · 빠르게"}
            </button>
          ))}
        </div>
      )}

      <h1 className="mt-4 text-[24px] font-bold leading-tight tracking-tight">
        {recipe.title}
      </h1>
      <p className="mt-1 text-[13px] text-faint">
        {activeChannel ?? (isNaver ? "네이버TV" : useShort ? "YouTube Shorts" : "")}
        {useShort && activeChannel ? (isNaver ? " · 네이버TV" : " · 쇼츠") : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[
          `⏱ ${formatCookTime(recipe.cookMinutes)}`,
          `🔥 ${formatDifficulty(recipe.difficulty)}`,
          ...(recipe.serves ? [formatServes(recipe.serves)] : []),
          `🧺 추가 재료 ${recipe.extraIngredients.length}`,
        ].map((t) => (
          <span
            key={t}
            className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-semibold text-muted ring-1 ring-line"
          >
            {t}
          </span>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-2 text-[17px] font-bold tracking-tight">필요한 추가 재료</h2>
        <div className="flex flex-wrap gap-1.5">
          {recipe.extraIngredients.map((i) => (
            <span
              key={i}
              className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent"
            >
              {i}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[17px] font-bold tracking-tight">조리 순서</h2>
        <p className="mb-3 mt-0.5 text-[13px] text-faint">
          {useShort
            ? "쇼츠는 타임스탬프 없이 한 번에 훑어요. 구간 이동은 롱폼에서."
            : "시간을 누르면 영상의 그 장면으로 이동해요."}
        </p>
        <ol className="grid gap-2">
          {recipe.long.steps.map((step) => (
            <li
              key={step.order}
              className="flex gap-3 rounded-xl border border-line bg-surface p-3.5"
            >
              {useShort ? (
                <span className="h-fit shrink-0 rounded-lg bg-surface px-2 py-1 text-[12px] font-bold text-faint tabular ring-1 ring-line">
                  {step.order}
                </span>
              ) : (
                <button
                  onClick={() => jump(step.start)}
                  className="h-fit shrink-0 rounded-lg bg-accent-soft px-2 py-1 text-[12px] font-bold text-accent tabular transition-colors hover:bg-accent hover:text-white"
                >
                  ▶ {formatTimestamp(step.start)}
                </button>
              )}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                  Step {step.order}
                </p>
                <p className="mt-0.5 text-[15px] leading-relaxed">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {recipe.reception && <ReceptionBlock reception={recipe.reception} />}

      {recipe.blogs && recipe.blogs.length > 0 && <BlogRail blogs={recipe.blogs} />}

      <RelatedRail recipes={related} format={fmt} />

      <Link
        to="/dessert?level=easy"
        className="mt-10 flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-good/40"
      >
        <span className="text-[26px] leading-none">🧁</span>
        <span className="flex-1">
          <span className="block text-[14px] font-bold tracking-tight">
            밥 다 먹었으면, 디저트?
          </span>
          <span className="mt-0.5 block text-[12px] text-muted">
            오븐 없이 만드는 간단 디저트부터 골라볼 수 있어요.
          </span>
        </span>
        <span className="text-[13px] font-semibold text-good">→</span>
      </Link>

      <a
        href={watchUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-8 flex items-center justify-center rounded-xl border border-line py-3 text-[14px] font-semibold text-good transition-colors hover:border-good/40"
      >
        {watchLabel} ↗
      </a>
    </main>
  );
}
