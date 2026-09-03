import { Link, Outlet, ScrollRestoration, useLocation } from "react-router-dom";

export default function Layout() {
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  return (
    <div className="min-h-dvh">
      <ScrollRestoration />
      <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link to="/" className="group flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-ink text-[13px] leading-none">
              🍳
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              FoodPlay
            </span>
          </Link>
          {!onHome && (
            <Link
              to="/"
              className="text-[13px] font-medium text-muted transition-colors hover:text-ink"
            >
              ← 재료 다시 고르기
            </Link>
          )}
        </div>
      </header>

      <Outlet />

      <footer className="mx-auto max-w-5xl px-5 py-16">
        <p className="text-[12px] leading-relaxed text-faint">
          FoodPlay — 개인 프로젝트. 레시피 영상·댓글은 유튜브의 공개 콘텐츠이며
          각 채널에 저작권이 있습니다. 큐레이션 데이터는 빌드 타임에 생성됩니다.
        </p>
      </footer>
    </div>
  );
}
