import { useCallback, useEffect, useState } from "react";

/**
 * 로그인·서버 없는 데모에서 "사용자가 직접 추가한 목록"을 브라우저
 * localStorage 에 저장하는 범용 훅. (재료·밀키트 종류 등에 재사용)
 *
 * - 기기(브라우저 프로필)별로 유지되고 새로고침·재방문에도 남는다.
 * - 시크릿 모드 등 접근이 막힌 환경에서도 죽지 않도록 try/catch.
 * - 나중에 계정이 생기면 이 훅만 서버 동기화 버전으로 바꾸면 된다.
 */

const MAX = 30;

function load(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX);
  } catch {
    return [];
  }
}

function persist(key: string, items: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* 저장 불가 환경 — 세션 동안만 유지 */
  }
}

export interface LocalList {
  items: string[];
  add: (name: string) => void;
  remove: (name: string) => void;
  has: (name: string) => boolean;
}

/**
 * @param key      localStorage 키
 * @param normalize  저장 전 정규화 (예: 공백 제거). 기본은 trim.
 */
export function useLocalList(
  key: string,
  normalize: (s: string) => string = (s) => s.trim(),
): LocalList {
  const [items, setItems] = useState<string[]>(() => load(key));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setItems(load(key));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const add = useCallback(
    (name: string) => {
      const clean = normalize(name);
      if (!clean) return;
      setItems((cur) => {
        if (cur.includes(clean)) return cur;
        const next = [...cur, clean].slice(0, MAX);
        persist(key, next);
        return next;
      });
    },
    [key, normalize],
  );

  const remove = useCallback(
    (name: string) => {
      setItems((cur) => {
        const next = cur.filter((x) => x !== name);
        if (next.length === cur.length) return cur;
        persist(key, next);
        return next;
      });
    },
    [key],
  );

  const has = useCallback((name: string) => items.includes(name), [items]);

  return { items, add, remove, has };
}
