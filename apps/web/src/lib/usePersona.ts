import { useCallback, useEffect, useState } from "react";
import { personaBias, personaMeta, type Persona } from "@foodplay/core";

/**
 * 홈에서 고른 "어떤 분이세요?" — 로그인이 없으니 기기(localStorage)에 저장한다.
 * 추천 랭킹의 기본 기분(vibe)·인분을 슬쩍 당기는 용도. 안 골라도 서비스는 그대로.
 */

const KEY = "foodplay.persona.v1";

const PERSONA_VALUES = new Set<Persona>([
  "student",
  "solo",
  "worker",
  "couple",
  "homemaker",
  "diet",
]);

function load(): Persona | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw && PERSONA_VALUES.has(raw as Persona) ? (raw as Persona) : null;
  } catch {
    return null;
  }
}

export function usePersona() {
  const [persona, setPersona] = useState<Persona | null>(load);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setPersona(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const set = useCallback((next: Persona | null) => {
    setPersona((cur) => {
      const value = cur === next ? null : next;
      try {
        if (value) localStorage.setItem(KEY, value);
        else localStorage.removeItem(KEY);
      } catch {
        /* 저장 불가 환경 — 세션 동안만 */
      }
      return value;
    });
  }, []);

  return {
    persona,
    set,
    meta: persona ? personaMeta(persona) : undefined,
    bias: personaBias(persona),
  };
}
