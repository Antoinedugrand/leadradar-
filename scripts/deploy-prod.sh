#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."

echo "→ Build local..."
npm run build

echo "→ Déploiement Vercel production..."
echo "  (Si erreur token: lance d'abord « npx vercel login »)"
npx vercel --prod

echo "→ Vérifie https://www.leadradar.us/map-search"
