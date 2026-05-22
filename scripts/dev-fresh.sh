#!/bin/sh
# Démarre next dev sur le premier port libre entre 3000 et 3010.
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
echo ""
exec npx next dev -p "$PORT"
