# BX — Помощник Бухгалтера

Electron-приложение для бухгалтеров Республики Узбекистан: планировщик с налоговым
календарём, калькуляторы, справочники, шаблоны документов, HR/финансы, AI-консультант.

## Стек

- **Electron Forge + Vite** (main/preload/renderer), React 19, TypeScript, Tailwind CSS
- **Данные**: Supabase (проект bxuz, таблицы с префиксом `bx_`, RLS по user_id)
  + локальный кэш Dexie/IndexedDB + localStorage для настроек и мелких кэшей
- **AI**: Supabase Edge Function `ai-consultant` → Google Gemini (секрет GEMINI_API_KEY);
  альтернативный провайдер — локальная Ollama

## Команды

```bash
npm start        # запуск приложения (electron-forge + vite dev)
npx tsc --noEmit # проверка типов — обязательна перед коммитом
npm run lint     # eslint
npm run make     # сборка дистрибутива
```

## Обязательные правила

1. **Версия + чейнджлог на каждое улучшение.** Бамп через
   `npm version X.Y.Z --no-git-tag-version` + запись в `CHANGELOG`
   в `src/shared/version.ts` (APP_VERSION читается из package.json).
2. **Даты — только через `src/renderer/lib/dates.ts`** (`toLocalISO`/`todayISO`).
   Паттерн `new Date(...).toISOString().slice(0,10)` запрещён: в поясе
   Asia/Tashkent (UTC+5) он сдвигает дату на день.
3. **Справочные значения (БРВ, МРОТ, ставки)** — единый источник
   `useEconomicIndicators` (облачный `bx_ref_indicator_values` + локальный фолбэк
   `data/reference/finance.ts`). Никаких новых хардкодов сумм; при изменении —
   сверять с lex.uz/soliq.uz/cbu.uz и помечать `verified` с основанием.
4. **Внешние HTTP-запросы** (госсайты, RSS, курсы) — через main-процесс
   (`src/main/services/*` + IPC + preload `window.bx.*`), иначе CORS.
5. **Миграции Supabase** — только через MCP `apply_migration` с явного одобрения
   пользователя; edge-функции так же.
6. **Не коммитить** временные обходы авторизации (AuthGate) и секреты.

## Структура

```
src/main/            main-процесс: ipc.ts + services/ (1С, погода, курсы, ИНН, RSS)
src/preload.ts       мост window.bx (типы дублируются в renderer/lib/onecApi.ts)
src/shared/          version.ts (чейнджлог), ipc-channels.ts
src/renderer/
  pages/             страницы разделов (+ подпапки planner/, calc/, hr/, finance/…)
  components/        layout, widgets, dashboard, auth
  lib/               dates.ts, dб/ (supabase, dexie, репозитории), ai/, validation
  data/              справочники, налоговый календарь, праздники РУз, шаблоны, БЗ
```

## Тестирование вживую

Запуск с CDP: `npm start -- -- --remote-debugging-port=92XX`, подключение
`playwright-core` → `chromium.connectOverCDP`. Ловушки: PIN-лок после reload;
правки main-процесса требуют полного перезапуска (HMR — только renderer);
скриншоты виснут при скрытом окне — проверять через DOM/evaluate.
Один экземпляр: приложение держит single-instance lock (второй запуск отдаёт фокус первому).
