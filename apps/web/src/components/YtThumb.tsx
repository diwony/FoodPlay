import { useState } from "react";

/**
 * 유튜브 썸네일(16:9, mqdefault). 삭제·비공개된 영상은 대개 404 를 뱉으므로
 * onError 로 잡아 부모에게 알린다(그 타일을 목록에서 빼도록).
 */
export default function YtThumb({
  id,
  className,
  onDead,
}: {
  id: string;
  className?: string;
  onDead?: (id: string) => void;
}) {
  const [dead, setDead] = useState(false);
  if (dead) return null;
  return (
    <img
      src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`}
      alt=""
      loading="lazy"
      className={className}
      onError={() => {
        setDead(true);
        onDead?.(id);
      }}
    />
  );
}
