import { useCallback, useEffect, useRef, useState } from "react";
import { personaBias, personaMeta, type Persona } from "@foodplay/core";

/**
 * 홈에서 고른 "어떤 분이세요?" — 로그인이 없으니 기기(localStorage)에 저장한다.
 * 추천 랭킹의 기본 기분(vibe)·인분을 슬쩍 당기는 용도. 안 골라도 서비스는 그대로.
 *
 * 이 훅은 여러 컴포넌트(PersonaChips, DailyHero, Landing 모드 카드…)에서 각자
 * 부른다. `storage` 이벤트는 다른 탭에서 바뀔 때만 울리고 **같은 문서 안**에서는
 * 안 울리므로, 커스텀 이벤트를 하나 더 쏴서 같은 페이지의 다른 인스턴스들도
 * 즉시 다시 읽게 한다. 이 브로드캐스트는 반드시 useEffect(커밋 이후)에서 해야
 * 한다 — 상태 업데이터 함수 안에서 다른 컴포넌트의 setState 를 유발하면 React가
 * "Cannot update a component while rendering a different component" 로 막는다.
 */

const KEY = "foodplay.persona.v1";
const CHANGE_EVENT = "foodplay:persona-change";

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
  const firstRun = useRef(true);

  // 다른 인스턴스(또는 다른 탭)가 바꾼 값을 반영.
  useEffect(() => {
    const sync = () => setPersona(load());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  // 이 인스턴스에서 값이 바뀌면(마운트 시 최초 1회는 제외) 저장하고 방송한다.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    try {
      if (persona) localStorage.setItem(KEY, persona);
      else localStorage.removeItem(KEY);
    } catch {
      /* 저장 불가 환경 — 세션 동안만 */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
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
