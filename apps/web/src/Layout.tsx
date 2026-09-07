import { Link, Outlet, ScrollRestoration, useLocation } from "react-router-dom";

export default function Layout() {
  const { pathname } = useLocation();
  const onHome = pathname === "/";
  const onSubPage = ["/fridge", "/mealkit", "/shop", "/dessert"].includes(
    pathname,
  );

  return (
    <div className="min-h-dvh">
      <ScrollRestoration />
      <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link to="/" className="group flex items-center gap-2">
            <svg
              viewBox="0 0 128 128"
              className="h-7 w-7 text-ink"
              role="img"
              aria-label="FoodPlay"
            >
              <path d="M46 45 L46 87 L81 66 Z" fill="#e8590c" />
              <rect x="90" y="57" width="34" height="16" rx="8" fill="currentColor" />
              <circle
                cx="56"
                cy="66"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
              />
            </svg>
            <span className="text-[15px] font-semibold tracking-tight">
              FoodPlay
            </span>
          </Link>
          {!onHome && (
            <Link
              to="/"
              className="text-[13px] font-medium text-muted transition-colors hover:text-ink"
            >
              {onSubPage ? "← 다른 방식으로" : "← 처음으로"}
            </Link>
          )}
        </div>
      </header>

      <Outlet />

      <footer className="mx-auto max-w-5xl px-5 py-16">
        <p className="text-[12px] leading-relaxed text-faint">
          © {new Date().getFullYear()} FoodPlay (diwony) · 개인 포트폴리오
          프로젝트. All rights reserved — 사전 서면 허가 없이 무단 복제·재배포·
          상업적 이용을 금합니다. 레시피 영상·댓글은 유튜브의 공개 콘텐츠이며
          각 채널에 저작권이 있습니다. 큐레이션 데이터는 빌드 타임에 생성됩니다.
        </p>
      </footer>
    </div>
  );
}
