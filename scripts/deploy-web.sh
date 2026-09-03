#!/usr/bin/env bash
# 웹 빌드를 GitHub Pages(gh-pages 브랜치)로 배포한다.
# 사용: bash scripts/deploy-web.sh
set -euo pipefail

REPO_URL="$(git config --get remote.origin.url)"
ROOT="$(git rev-parse --show-toplevel)"

cd "$ROOT"
rm -rf dist
npx expo export --platform web

cd dist
cp index.html 404.html          # SPA 딥링크가 404 대신 앱으로 라우팅되게
touch .nojekyll                  # _expo/ 폴더를 Jekyll 이 무시하지 않게
git init -q
git checkout -q -b gh-pages
git add -A
git commit -q -m "Deploy FoodPlay web build $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q -f "$REPO_URL" gh-pages
rm -rf .git

echo "배포 완료 → https://diwony.github.io/FoodPlay/"
