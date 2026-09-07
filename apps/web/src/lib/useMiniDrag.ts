import { useCallback, useEffect, useRef, useState } from "react";

interface Pos {
  left: number;
  top: number;
}

const EDGE = 8; // 화면 가장자리 여백
const TOP_MIN = 56; // 헤더(h-14) 아래
const MOVE_THRESHOLD = 4; // 이보다 덜 움직이면 클릭(펼치기)으로 본다

/**
 * 미니 플레이어를 손가락/마우스로 끌어 옮길 수 있게 한다 (유튜브 프리미엄식).
 * - 드래그 표면은 iframe 위에 덮인 오버레이(펼치기 버튼)다. iframe 자체는
 *   포인터 이벤트를 가로채므로 그 위 오버레이에서 처리해야 한다. pointerdown
 *   때 setPointerCapture 를 걸어 iframe 위로 끌고 가도 이벤트가 유지된다.
 * - 놓으면 가까운 좌/우 가장자리로 붙고(수평 스냅), 세로는 자유(화면 안 클램프).
 * - 살짝 눌렀다 뗀 건 이동으로 치지 않아(threshold) 기존 "탭 → 펼치기"가
 *   그대로 동작한다. 닫기(✕)는 별도 형제 요소라 드래그 로직을 안 탄다.
 *
 * @param active  미니 상태일 때만 true (펼쳐지면 위치 초기화)
 */
export function useMiniDrag(active: boolean) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);

  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const start = useRef({ px: 0, py: 0, left: 0, top: 0 });

  const clamp = useCallback(
    (left: number, top: number, w: number, h: number): Pos => ({
      left: Math.min(Math.max(EDGE, left), Math.max(EDGE, window.innerWidth - w - EDGE)),
      top: Math.min(Math.max(TOP_MIN, top), Math.max(TOP_MIN, window.innerHeight - h - EDGE)),
    }),
    [],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!active) return;
      const box = boxRef.current;
      if (!box) return;
      const r = box.getBoundingClientRect();
      start.current = { px: e.clientX, py: e.clientY, left: r.left, top: r.top };
      draggingRef.current = true;
      movedRef.current = false;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [active],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - start.current.px;
      const dy = e.clientY - start.current.py;
      if (!movedRef.current && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;
      if (!movedRef.current) {
        movedRef.current = true;
        setDragging(true);
      }
      const box = boxRef.current!;
      const r = box.getBoundingClientRect();
      setPos(clamp(start.current.left + dx, start.current.top + dy, r.width, r.height));
    },
    [clamp],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      if (movedRef.current) {
        // 가까운 좌/우 가장자리로 스냅
        const box = boxRef.current;
        if (box) {
          const r = box.getBoundingClientRect();
          const toLeft = r.left + r.width / 2 < window.innerWidth / 2;
          const left = toLeft ? EDGE : window.innerWidth - r.width - EDGE;
          setPos(clamp(left, r.top, r.width, r.height));
        }
      }
      setDragging(false);
      // click 이벤트가 뒤따라오므로 그 판정 후에 리셋
      setTimeout(() => {
        movedRef.current = false;
      }, 0);
    },
    [clamp],
  );

  // 화면 크기 바뀌면 다시 안으로
  useEffect(() => {
    if (!pos) return;
    const onResize = () => {
      const box = boxRef.current;
      if (!box) return;
      const r = box.getBoundingClientRect();
      setPos((p) => (p ? clamp(p.left, p.top, r.width, r.height) : p));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos, clamp]);

  // 펼쳐지면(미니 해제) 위치 초기화
  useEffect(() => {
    if (!active) {
      setPos(null);
      setDragging(false);
    }
  }, [active]);

  const boxStyle: React.CSSProperties = pos
    ? {
        left: pos.left,
        top: pos.top,
        right: "auto",
        bottom: "auto",
        transform: "none",
        transition: dragging ? "none" : "left .18s ease, top .18s ease",
      }
    : {};

  /** 방금 동작이 드래그였는지 — 오버레이 onClick 에서 펼치기를 막는 데 쓴다 */
  const wasDragged = useCallback(() => movedRef.current, []);

  return {
    boxRef,
    boxStyle,
    wasDragged,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
