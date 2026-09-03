// Expo(Metro) 설정 — 공유 패키지(packages/core)를 소스로 직접 참조한다.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// packages/core 를 Metro 감시 폴더에 추가 (심링크/설치 없이 소스 사용)
config.watchFolders = [path.resolve(projectRoot, "packages")];

// tsconfig 의 paths("@foodplay/core")를 Metro 도 해석하도록
config.resolver.extraNodeModules = {
  "@foodplay/core": path.resolve(projectRoot, "packages/core"),
};

module.exports = config;
