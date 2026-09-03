import { useEffect, useRef, useState } from "react";

const DOCK_OUT = 40; // 슬롯 상단이 헤더 밑(이 값)보다 위로 올라가면 미니 전환

/**
 * 영상 슬롯이 화면 위로 스크롤되면 미니 플레이어로 전환한다.
 * scroll 리스너에서 슬롯의 위치만 읽어 상태를 토글하며, iframe 은 DOM 에서
 * 이동하지 않으므로(같은 노드의 CSS 클래스만 변경) 재생이 끊기지 않는다.
 */
export function useMiniPlayer() {
  const slotRef = useRef<HTMLDivElement>(null);
  const [mini, setMini] = useState(false);

  useEffect(() => {
    const check = () => {
      const el = slotRef.current;
      if (!el) return;
      setMini(el.getBoundingClientRect().top < DOCK_OUT);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const expand = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return { slotRef, mini, expand };
}
