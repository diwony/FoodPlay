/**
 * @foodplay/core — 웹(Vite React)과 앱(Expo React Native)이 공유하는
 * 순수 로직·데이터. UI·플랫폼 의존성 없음.
 */

export * from "./src/data/types";
export { default as recipeDatabase } from "./src/data/recipes.json";

export * from "./src/lib/ingredients";
export * from "./src/lib/quickAdd";
export * from "./src/lib/foodVocab";
export * from "./src/lib/budget";
export * from "./src/lib/pricing";
export * from "./src/lib/match";
export * from "./src/lib/format";
export * from "./src/lib/vibes";
export * from "./src/lib/menuKinds";
export * from "./src/lib/persona";
export * from "./src/lib/suggest";
export * from "./src/lib/trends";
