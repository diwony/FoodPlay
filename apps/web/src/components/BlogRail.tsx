import { blogSourceLabel, type BlogLink } from "@foodplay/core";

/**
 * "블로그 레시피" 칸 — 영상과 별개로 글로 된 레시피를 곁들인다.
 * 유튜브가 기본 베이스이고, 여기서 네이버 블로그·티스토리·만개의레시피 등
 * 다른 소스를 비중 적게 추천한다.
 */
export default function BlogRail({ blogs }: { blogs: BlogLink[] }) {
  if (blogs.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-1 text-[17px] font-bold tracking-tight">블로그 레시피</h2>
      <p className="mb-3 text-[13px] text-faint">
        영상 말고 글로 차근차근 보고 싶을 때. 다른 사이트로 이동해요.
      </p>
      <ul className="grid gap-2">
        {blogs.map((b) => {
          const label = blogSourceLabel(b.source);
          const showAuthor = b.author && b.author !== label;
          return (
            <li key={b.url}>
              <a
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-good/40"
              >
                <span className="shrink-0 rounded-md bg-accent-soft px-2 py-1 text-[11px] font-bold text-accent">
                  {label}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">
                    {b.title}
                  </span>
                  {showAuthor && (
                    <span className="block truncate text-[12px] text-faint">
                      {b.author}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-good">↗</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
