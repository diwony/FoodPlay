import { useEffect, useRef } from "react";

/**
 * 가로 스크롤 레일(요즘 뜨는, 추천 영상 등)을 PC에서 마우스로 잡고 끌면
 * 스크롤되게 한다. 모바일은 원래 손가락 스와이프가 되니 건드리지 않고,
 * 트랙패드/휠 가로 스크롤도 그대로 둔다 — 마우스 드래그만 얹는다.
 *
 * 드래그로 몇 px 이상 움직였으면 그 뒤에 오는 클릭(카드 링크 이동)은 막아서,
 * "끌었을 뿐인데 딴 페이지로 이동" 하는 걸 방지한다.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let down = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      el.scrollLeft = startScroll - dx;
    };
    const endDrag = () => {
      down = false;
      el.style.cursor = "";
    };
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    // <img> 는 기본적으로 브라우저 자체 드래그(고스트 이미지)가 걸려 있어서,
    // 썸네일 위에서 끌기 시작하면 그 네이티브 드래그가 pointermove 를 먹어버려
    // 스크롤이 안 된다. 이 레일 안에서는 이미지 드래그를 아예 막는다.
    const onDragStart = (e: DragEvent) => e.preventDefault();

    // 일반 마우스 휠(세로)은 가로 스크롤 컨테이너를 못 움직인다 — 세로 휠량을
    // 가로 스크롤로 옮겨준다. 트랙패드의 실제 가로 제스처(deltaX 가 이미 큰
    // 경우)는 브라우저 기본 동작 그대로 둔다.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("dragstart", onDragStart);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  return ref;
}
