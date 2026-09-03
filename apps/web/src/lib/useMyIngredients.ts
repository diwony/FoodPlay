import { useCallback, useEffect, useState } from "react";
import { normalizeIngredient } from "@foodplay/core";

/**
 * "내가 자주 쓰는 재료" — 사용자가 직접 등록한 재료 칩 목록.
 *
 * 이 데모에는 로그인·서버가 없으므로 브라우저별 localStorage 에 저장한다.
 * 즉 "사용자마다 다르게" = 브라우저(기기) 프로필마다 다르게 이며, 새로고침·
 * 재방문에도 유지된다. 나중에 실제 계정이 생기면 이 훅 하나만 서버 동기화
 * 버전으로 바꾸면 된다.
 *
 * - 저장 값은 normalizeIngredient 로 정규화해 기본 칩·매칭 로직과 형식을 맞춘다.
 * - 시크릿 모드 등 localStorage 접근이 막힌 환경에서도 죽지 않도록 try/catch.
 */

const KEY = "foodplay.myIngredients.v1";
const MAX = 30;

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX);
  } catch {
    return [];
  }
}

function save(items: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* 저장 불가 환경 — 세션 동안만 유지 */
  }
}

export interface MyIngredients {
  items: string[];
  add: (name: string) => void;
  remove: (name: string) => void;
  has: (name: string) => boolean;
}

export function useMyIngredients(): MyIngredients {
  const [items, setItems] = useState<string[]>(load);

  // 다른 탭에서 바꾼 내용 반영
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((name: string) => {
    const clean = normalizeIngredient(name);
    if (!clean) return;
    setItems((cur) => {
      if (cur.includes(clean)) return cur;
      const next = [...cur, clean].slice(0, MAX);
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((name: string) => {
    setItems((cur) => {
      const next = cur.filter((x) => x !== name);
      if (next.length === cur.length) return cur;
      save(next);
      return next;
    });
  }, []);

  const has = useCallback((name: string) => items.includes(name), [items]);

  return { items, add, remove, has };
}
