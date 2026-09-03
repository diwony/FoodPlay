/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** YouTube Data API v3 키 (선택). 없으면 유튜브 검색은 링크아웃으로 대체. */
  readonly VITE_YT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
