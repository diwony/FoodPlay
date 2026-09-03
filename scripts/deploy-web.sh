#!/usr/bin/env bash
# apps/web (Vite React) 를 GitHub Pages(gh-pages 브랜치)로 배포한다.
# 사용: bash scripts/deploy-web.sh
set -euo pipefail

REPO_URL="$(git config --get remote.origin.url)"
ROOT="$(git rev-parse --show-toplevel)"

cd "$ROOT/apps/web"

# "유튜브에서 더 찾기" 풀 확인 (pipeline/collect-youtube.mjs 산출물)
if [ -f public/youtube-pool.json ]; then
  echo "· youtube-pool.json $(node -e "process.stdout.write(String(require('./public/youtube-pool.json').videos.length))")개 영상 포함"
else
  echo "· youtube-pool.json 없음 → node pipeline/collect-youtube.mjs 먼저 실행 권장"
fi

npm install --no-audit --no-fund
rm -rf dist
npx vite build          # base "/FoodPlay/" 는 vite.config 의 command==="build" 분기

cd dist
cp index.html 404.html          # SPA 딥링크가 404 대신 라우터로
touch .nojekyll                  # assets/ 를 Jekyll 이 무시하지 않게
git init -q
git checkout -q -b gh-pages
git add -A
git commit -q -m "Deploy FoodPlay web (Vite) $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q -f "$REPO_URL" gh-pages
rm -rf .git

echo "배포 완료 → https://diwony.github.io/FoodPlay/"
