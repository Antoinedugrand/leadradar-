#!/bin/sh
# Réparation complète : arrêt des serveurs Next, cache, node_modules, réinstall propre.
set -e
cd "$(dirname "$0")/.."

echo "→ Arrêt des processus Next sur les ports 3000–3010..."
for PORT in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010; do
  PIDS=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "  kill port $PORT ($PIDS)"
    kill -9 $PIDS 2>/dev/null || true
  fi
done
sleep 1

echo "→ Suppression .next et node_modules..."
rm -rf .next node_modules

echo "→ npm ci (install déterministe depuis package-lock.json)..."
npm ci

echo "→ Vérification des dépendances..."
node scripts/verify-deps.mjs

echo ""
echo "✓ Repair terminé. Lance : npm run dev:fresh"
