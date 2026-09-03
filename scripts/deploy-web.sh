#!/usr/bin/env bash
# apps/web (Vite React) 를 GitHub Pages(gh-pages 브랜치)로 배포한다.
# 사용: bash scripts/deploy-web.sh
set -euo pipefail

REPO_URL="$(git config --get remote.origin.url)"
ROOT="$(git rev-parse --show-toplevel)"

cd "$ROOT/apps/web"

# 유튜브 실시간 검색 키: apps/web/.env.local 의 VITE_YT_API_KEY 가 있으면
# 빌드에 박혀 배포본 방문자 전체가 인앱 검색을 쓰게 된다. 없으면 링크아웃 대체.
if [ -f .env.local ] && grep -q '^VITE_YT_API_KEY=.\+' .env.local; then
  echo "· YouTube API 키 감지됨 → 방문자 전체가 인앱 검색 사용"
else
  echo "· YouTube API 키 없음 → '유튜브에서 더 찾기' 는 링크아웃으로 동작"
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
