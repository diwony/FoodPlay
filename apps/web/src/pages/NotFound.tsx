import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-24 text-center">
      <p className="text-[15px] text-muted">페이지를 찾을 수 없어요.</p>
      <Link
        to="/"
        className="mt-4 inline-block text-[14px] font-semibold text-accent"
      >
        ← 처음으로
      </Link>
    </main>
  );
}
