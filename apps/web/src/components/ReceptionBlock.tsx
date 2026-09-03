import type { Reception } from "@foodplay/core";

export default function ReceptionBlock({ reception }: { reception: Reception }) {
  return (
    <section className="mt-10">
      <h2 className="mb-2 text-[17px] font-bold tracking-tight">영상 댓글 반응</h2>
      <p className="text-[14px] leading-relaxed text-ink">{reception.summary}</p>
      <ul className="mt-3 grid gap-2">
        {reception.quotes.map((q, i) => (
          <li
            key={i}
            className="rounded-xl bg-accent-soft/60 px-4 py-3 text-[13px] leading-relaxed text-ink"
          >
            <span className="text-faint">“</span>
            {q.text}
            <span className="text-faint">”</span>
            {typeof q.likes === "number" && q.likes > 0 && (
              <span className="ml-2 whitespace-nowrap text-[11px] font-semibold text-faint">
                👍 {q.likes.toLocaleString()}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-faint">
        유튜브 공개 댓글에서 발췌 · 파이프라인이 상위 댓글을 요약
      </p>
    </section>
  );
}
