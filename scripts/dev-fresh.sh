#!/bin/sh
# Démarre next dev sur le premier port libre entre 3000 et 3010.
# IMPORTANT : arrête d'abord les vieux serveurs et ne supprime .next que lorsqu'aucun next dev ne tourne.
set -e
cd "$(dirname "$0")/.."

echo "→ Arrêt des processus sur les ports 3000–3010..."
for PORT in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010; do
  PIDS=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "  kill port $PORT ($PIDS)"
    kill -9 $PIDS 2>/dev/null || true
  fi
done
sleep 1

PORT=3000
while lsof -ti :"$PORT" >/dev/null 2>&1; do
  echo "Port $PORT occupé, essai du suivant..."
  PORT=$((PORT + 1))
  if [ "$PORT" -gt 3010 ]; then
    echo "Erreur : aucun port libre entre 3000 et 3010."
    exit 1
  fi
done

rm -rf .next
echo ""
echo "→ Ouvre http://localhost:$PORT"
echo "  (si erreur CSS/enhanced-resolve : npm run repair puis relance dev:fresh)"
echo ""
exec npx next dev -p "$PORT"
