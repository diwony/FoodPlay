/** 디자인 토큰. 모바일 우선 — 웹도 대부분 모바일에서 열린다고 가정. */

export const colors = {
  bg: "#FFFDF9",
  surface: "#FFFFFF",
  surfaceAlt: "#FFF3E6",
  border: "#EFE6DA",
  text: "#231A12",
  textMuted: "#7A6A58",
  primary: "#FF6B35",
  primaryText: "#FFFFFF",
  accent: "#2A9D8F",
  danger: "#D64545",
  chipHave: "#E4F5EC",
  chipHaveText: "#1F7A54",
  chipMissing: "#FDEDE6",
  chipMissingText: "#C0532B",
};

export const spacing = (n: number) => n * 4;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const font = {
  h1: 24,
  h2: 19,
  body: 15,
  small: 13,
  tiny: 11,
};

/** 웹에서 콘텐츠 최대 폭 — 데스크톱에서도 모바일 레이아웃 유지 */
export const CONTENT_MAX_WIDTH = 560;
