# E2E-смоук BX

Дымовой тест десктопного приложения через Chrome DevTools Protocol
(`playwright-core` → `chromium.connectOverCDP`). Проверяет, что после старта:

- главное окно и трей-окно рендерят контент (непустой `#root`);
- в консоли нет ошибок / необработанных исключений;
- отображается строка версии;
- переключение светлой темы меняет CSS-переменную `--bx-bg`.

## Запуск

```bash
# Автономно: поднимет приложение в отдельном user-data-dir, прогонит смоук, погасит
npm run e2e

# Против уже запущенного экземпляра с открытым CDP-портом
npm start -- -- --remote-debugging-port=9245
CDP_PORT=9245 node scripts/e2e/smoke.js
```

## Почему отдельный user-data-dir

Приложение держит single-instance lock и общий IndexedDB. Два экземпляра на
одном `user-data-dir` дают `DexieError2` и «Could not open the quota database».
`run-smoke.sh` создаёт временный `user-data-dir` в `/tmp`, поэтому смоук не
конфликтует с рабочим dev-экземпляром и не трогает боевые данные.

## Зависимости

`playwright-core` (без браузеров Playwright — подключаемся к Electron по CDP).
Установка: `npm install` в каталоге `app/`.
