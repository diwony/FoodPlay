import { Link } from "react-router-dom";
import { useYouTubeSearch } from "../lib/useYouTubeSearch";
import { youtubeSearchEnabled, youtubeSearchUrl } from "../lib/youtube";

interface Props {
  /** 유튜브에 던질 검색어. 보통 "재료 + 레시피". 비어 있으면 렌더 안 함. */
  query: string;
  /** 섹션 부제 (예: "김치볶음밥 · 참치김치찌개 …" 대신 맥락 한 줄) */
  hint?: string;
}

/**
 * 큐레이션 결과 아래에 붙는 "유튜브에서 더 찾기" 칸.
 * 큐레이션 DB 를 넘어서 유튜브 전체에서 관련 영상을 끌어온다.
 */
export default function YouTubeRail({ query, hint }: Props) {
  const { state, run } = useYouTubeSearch();
  const q = query.trim();
  if (!q) return null;

  const openSearch = (
    <a
      href={youtubeSearchUrl(q)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-[13px] font-semibold text-good hover:underline"
    >
      유튜브에서 “{q}” 검색 열기 ↗
    </a>
  );

  return (
    <section className="mt-10 border-t border-line pt-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[19px] font-bold tracking-tight">유튜브에서 더 찾기</h2>
        {state.status === "done" && (
          <a
            href={youtubeSearchUrl(q)}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-[12px] font-semibold text-faint hover:text-good"
          >
            전체 결과 ↗
          </a>
        )}
      </div>
      <p className="mt-1 text-[13px] text-muted">
        {hint ?? "큐레이션에 없는 채널까지, 유튜브 전체에서 관련 영상을 끌어와요."}
      </p>

      <div className="mt-4">
        {!youtubeSearchEnabled ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-5 py-6">
            <p className="text-[13px] text-muted">
              이 데모에는 YouTube API 키가 연결돼 있지 않아 앱 안에서 바로
              불러오지는 못해요. 아래 버튼으로 유튜브의 전체 관련 영상을 볼 수
              있어요.
            </p>
            <div className="mt-3">{openSearch}</div>
          </div>
        ) : state.status === "idle" ? (
          <button
            onClick={() => run(q)}
            className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-card)] border border-line bg-surface py-3.5 text-[14px] font-semibold text-muted transition-colors hover:border-good/40 hover:text-ink"
          >
            <span className="text-good">▶</span> 유튜브에서 관련 영상 불러오기
          </button>
        ) : state.status === "loading" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-video animate-pulse rounded-xl border border-line bg-line/40"
              />
            ))}
          </div>
        ) : state.status === "error" ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-5 py-6">
            <p className="text-[13px] text-muted">
              {state.kind === "quota"
                ? "오늘 유튜브 검색 한도를 다 썼어요. 잠시 후 다시 시도하거나 아래에서 유튜브로 바로 보세요."
                : "유튜브 검색을 불러오지 못했어요. 아래에서 유튜브로 바로 볼 수 있어요."}
            </p>
            <div className="mt-3">{openSearch}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {state.hits.map((h) => (
              <Link
                key={h.videoId}
                to={`/yt/${h.videoId}`}
                state={{ title: h.title, channel: h.channel, thumbnail: h.thumbnail }}
                className="group"
              >
                <img
                  src={h.thumbnail}
                  alt=""
                  loading="lazy"
                  className="aspect-video w-full rounded-xl border border-line object-cover"
                />
                <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug group-hover:text-good">
                  {h.title}
                </p>
                <p className="text-[11px] text-faint">{h.channel}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
