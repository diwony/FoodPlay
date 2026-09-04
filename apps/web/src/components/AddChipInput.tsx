import { useState } from "react";

interface Props {
  /** 입력 후 Enter/버튼 → 이 콜백 (정규화는 호출측 훅에서) */
  onAdd: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

/** 자유 입력으로 칩을 추가하는 작은 인풋. 재료·밀키트 등에서 재사용. */
export default function AddChipInput({
  onAdd,
  placeholder = "직접 추가",
  ariaLabel = "직접 추가",
}: Props) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };

  return (
    <span className="inline-flex items-center rounded-full border border-dashed border-line bg-surface pl-1">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-28 bg-transparent px-2 py-1.5 text-[13px] outline-none placeholder:text-faint"
      />
      <button
        type="button"
        onClick={submit}
        aria-label="추가"
        className="grid h-6 w-6 place-items-center rounded-full text-muted transition-colors hover:bg-line/60 hover:text-ink"
      >
        +
      </button>
    </span>
  );
}
