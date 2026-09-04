import { useCallback, useEffect, useState } from "react";

/**
 * "최근 본 레시피" — 로그인이 없으니 기기(localStorage)에 최근 순으로 저장한다.
 * 홈의 "만들어 먹기 통장" 위젯이 이걸 읽어 누적 절약액을 보여준다.
 */

const KEY = "foodplay.recent.v1";
const MAX = 12;

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

/** 레시피 상세를 열 때 호출 — 훅 없이도 쓸 수 있게 별도 함수로. */
export function pushRecentRecipe(id: string) {
  if (!id) return;
  try {
    const cur = load().filter((x) => x !== id);
    localStorage.setItem(KEY, JSON.stringify([id, ...cur].slice(0, MAX)));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {
    /* 저장 불가 환경 — 무시 */
  }
}

export function useRecentRecipes(): string[] {
  const [ids, setIds] = useState<string[]>(load);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) setIds(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return ids;
}

/** 개발용/설정: 기록 비우기 */
export function useClearRecent() {
  return useCallback(() => {
    try {
      localStorage.removeItem(KEY);
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    } catch {
      /* 무시 */
    }
  }, []);
}
