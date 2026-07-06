#!/usr/bin/env bash
# Поднимает BX в отдельном user-data-dir (чтобы не конфликтовать с рабочим
# экземпляром и его single-instance lock / IndexedDB), ждёт CDP, гоняет смоук,
# затем гасит приложение. Возвращает код смоука.
#
#   ./scripts/e2e/run-smoke.sh
set -uo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${CDP_PORT:-9245}"
USER_DATA_DIR="$(mktemp -d /tmp/bx-e2e-XXXXXX)"
LOG="$(mktemp /tmp/bx-e2e-run-XXXXXX.log)"

cleanup() {
  [[ -n "${APP_PID:-}" ]] && kill "$APP_PID" 2>/dev/null
  # electron-forge порождает дочерние процессы — добиваем по user-data-dir
  pkill -f "$USER_DATA_DIR" 2>/dev/null
  rm -rf "$USER_DATA_DIR"
}
trap cleanup EXIT

echo "▶ Запуск BX (порт CDP $PORT, user-data-dir $USER_DATA_DIR)…"
cd "$APP_DIR"
ELECTRON_ENABLE_LOGGING=1 npm start -- -- \
  --remote-debugging-port="$PORT" \
  --user-data-dir="$USER_DATA_DIR" >"$LOG" 2>&1 &
APP_PID=$!

echo "▶ Ожидание CDP на :$PORT…"
for i in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
    echo "  CDP готов (через ${i}s)"
    break
  fi
  if ! kill -0 "$APP_PID" 2>/dev/null; then
    echo "✗ Процесс приложения умер до готовности CDP. Лог:"; tail -30 "$LOG"; exit 1
  fi
  sleep 1
done

if ! curl -sf "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
  echo "✗ CDP так и не поднялся за 60s. Лог:"; tail -30 "$LOG"; exit 1
fi

CDP_PORT="$PORT" node "$APP_DIR/scripts/e2e/smoke.js"
RC=$?
echo "▶ Смоук завершён с кодом $RC (лог приложения: $LOG)"
exit $RC
