import { useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useYouTube } from "../lib/useYouTube";

interface NavState {
  title?: string;
  channel?: string;
  thumbnail?: string;
}

/**
 * 유튜브 검색 결과에서 넘어온 영상을 앱 안에서 재생한다.
 * 큐레이션 레시피가 아니라 스텝 타임스탬프는 없고, 영상 + 원본 링크만 준다.
 */
export default function Watch() {
  const { id = "" } = useParams();
  const { state } = useLocation() as { state: NavState | null };
  const hostRef = useRef<HTMLDivElement>(null);
  useYouTube(hostRef, id);

  const valid = /^[\w-]{11}$/.test(id);

  if (!valid) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-muted">영상을 찾을 수 없어요.</p>
        <Link to="/" className="mt-4 inline-block text-[14px] font-semibold text-accent">
          ← 처음으로
        </Link>
      </main>
    );
  }

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
        {state?.title ?? "유튜브 영상"}
      </h1>
      {state?.channel && (
        <p className="mt-1 text-[13px] text-faint">{state.channel}</p>
      )}

      <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-5 py-4">
        <p className="text-[13px] text-muted">
          이 영상은 큐레이션 레시피가 아니라 유튜브에서 바로 가져온 거예요. 조리
          스텝·타임스탬프는 원본 영상에서 확인하세요.
        </p>
      </div>

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
