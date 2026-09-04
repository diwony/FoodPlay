import { useCallback, useEffect, useState } from "react";
import { personaBias, personaMeta, type Persona } from "@foodplay/core";

/**
 * 홈에서 고른 "어떤 분이세요?" (앱 버전). 추천 랭킹의 기본 기분·인분을 당긴다.
 * myIngredients.ts 와 같은 저장 방식 — 웹은 localStorage, 네이티브는 실행 중 메모리.
 */

const KEY = "foodplay.persona.v1";
const VALUES = new Set<Persona>([
  "student",
  "solo",
  "worker",
  "couple",
  "homemaker",
  "diet",
]);

const memory: { value: string } = { value: "" };
const store =
  typeof localStorage !== "undefined"
    ? {
        get: () => {
          try {
            return localStorage.getItem(KEY) ?? "";
          } catch {
            return "";
          }
        },
        set: (v: string) => {
          try {
            if (v) localStorage.setItem(KEY, v);
            else localStorage.removeItem(KEY);
          } catch {
            /* ignore */
          }
        },
      }
    : {
        get: () => memory.value,
        set: (v: string) => {
          memory.value = v;
        },
      };

function load(): Persona | null {
  const raw = store.get();
  return VALUES.has(raw as Persona) ? (raw as Persona) : null;
}

export function usePersona() {
  const [persona, setPersona] = useState<Persona | null>(load);

  useEffect(() => {
    store.set(persona ?? "");
  }, [persona]);

  const set = useCallback((next: Persona | null) => {
    setPersona((cur) => (cur === next ? null : next));
  }, []);

  return {
    persona,
    set,
    meta: persona ? personaMeta(persona) : undefined,
    bias: personaBias(persona),
  };
}
