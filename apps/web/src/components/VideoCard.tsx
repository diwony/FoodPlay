import { memo } from "react";
import { Link } from "react-router-dom";
import { compactViews } from "@foodplay/core";
import type { PoolVideo } from "../lib/youtubePool";

interface Props {
  video: PoolVideo;
  /** 실시간 검색에서 새로 얹힌 영상 — "실시간" 배지 */
  live?: boolean;
}

/** 재료 태그만 보여준다 — 풀의 분류·기분 태그는 전부 영문이라 걸러진다. */
const isIngredientTag = (t: string) => /[가-힣]/.test(t);

/**
 * 큐레이션 레시피(RecipeCard)와 **같은 목록·같은 카드 모양**으로 섞어 보여주는
 * 유튜브 영상 카드. 사람이 붙인 조리 스텝은 없지만, /yt/:id 상세에서 영상 설명
 * 타임라인(챕터)을 눌러 이동할 수 있다.
 */
function VideoCardBase({ video, live = false }: Props) {
  const tags = video.tags.filter(isIngredientTag).slice(0, 4);

  return (
    <Link
      to={`/yt/${video.id}`}
      state={{
        title: video.title,
        channel: video.channel,
        thumbnail: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
      }}
      className="group grid grid-cols-[104px_1fr] gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-3.5 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(23,20,15,.05),0_16px_36px_-14px_rgba(23,20,15,.2)] sm:grid-cols-[128px_1fr]"
    >
      <div className="relative overflow-hidden rounded-xl bg-accent-soft">
        <img
          src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
          alt=""
          loading="lazy"
          className="aspect-square h-full w-full scale-[1.35] object-cover transition-transform duration-300 group-hover:scale-[1.45]"
        />
        <span className="absolute bottom-1 left-1 rounded bg-ink/80 px-1 py-0.5 text-[9px] font-bold text-white">
          ▶ 영상
        </span>
        {live && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-good/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
            실시간
          </span>
        )}
      </div>

      <div className="min-w-0 py-0.5">
        <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug tracking-tight">
          {video.title}
        </h3>
        <p className="mt-0.5 text-[12px] text-faint">
          {video.channel}
          {video.views > 0 && <> · ▶ {compactViews(video.views)}</>}
        </p>
        {tags.length > 0 && (
          <p className="mt-2 text-[12px] font-semibold text-muted">
            {tags.join(" · ")}
          </p>
        )}
        <p className="mt-1.5 text-[11px] text-faint">
          스텝 정리는 없지만, 영상 설명에 타임스탬프가 있으면 눌러서 이동돼요.
        </p>
      </div>
    </Link>
  );
}

export default memo(VideoCardBase);
