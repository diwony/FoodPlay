import { useCallback, useEffect, useState } from "react";
import { normalizeIngredient } from "@foodplay/core";

/**
 * "내가 자주 쓰는 재료" — 사용자가 직접 등록한 재료 목록. (앱 버전)
 *
 * 이 데모에는 로그인·서버가 없으므로 기기 로컬에 저장한다. 즉 "사용자마다
 * 다르게" = 기기마다 다르게.
 *
 * 저장소:
 * - Expo 웹 빌드에서는 브라우저 localStorage 를 그대로 쓴다 (새로고침 유지).
 * - 네이티브(Expo Go/APK)에서는 아직 영구 저장소를 붙이지 않아 앱 실행 중에만
 *   유지된다. 영구화가 필요하면 @react-native-async-storage/async-storage 를
 *   설치해 load/save 만 교체하면 된다.
 */

const KEY = "foodplay.myIngredients.v1";
const MAX = 30;

type Store = { get(): string; set(v: string): void };

const memory: { value: string } = { value: "" };

const store: Store =
  typeof localStorage !== "undefined"
    ? {
        get: () => {
          try {
            return localStorage.getItem(KEY) ?? "";
          } catch {
            return "";
          }
        },
        set: (v) => {
          try {
            localStorage.setItem(KEY, v);
          } catch {
            /* ignore */
          }
        },
      }
    : {
        get: () => memory.value,
        set: (v) => {
          memory.value = v;
        },
      };

function load(): string[] {
  try {
    const parsed = JSON.parse(store.get() || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX);
  } catch {
    return [];
  }
}

function save(items: string[]) {
  store.set(JSON.stringify(items));
}

export interface MyIngredients {
  items: string[];
  add: (name: string) => void;
  remove: (name: string) => void;
}

export function useMyIngredients(): MyIngredients {
  const [items, setItems] = useState<string[]>(load);

  useEffect(() => {
    save(items);
  }, [items]);

  const add = useCallback((name: string) => {
    const clean = normalizeIngredient(name);
    if (!clean) return;
    setItems((cur) => (cur.includes(clean) ? cur : [...cur, clean].slice(0, MAX)));
  }, []);

  const remove = useCallback((name: string) => {
    setItems((cur) => cur.filter((x) => x !== name));
  }, []);

  return { items, add, remove };
}
