# P0 Security Posture Report

Дата: 20 июля 2026 года

Режим: daily-аудит с последующим явно подтверждённым production deployment

Статус: **PUBLIC_AUTH_RATE_LIMITED_WITH_ACCEPTED_TOKEN_RISK**

## Результат

Проверены Electron/App, общий renderer, Web, IP Web/PWA, Supabase Edge Functions, Vercel API-функции, Telegram/платёжные webhook, зависимости и CI. Исправлены `support-bot`, публичные pre-auth функции, production-зависимость XLSX и CI security-контур. После отдельного распоряжения владельца `support-bot` и объединённая маршрутизация `user-bot` развёрнуты; добавлены независимые webhook secrets, Vault-backed Database Webhook и два INSERT-триггера. Для `telegram-auth` и `recovery-auth` развёрнуты атомарные 15-минутные лимиты без хранения исходных IP. Существующие пользовательские записи не изменялись.

Главный вывод: `support-bot`, публичная Telegram/recovery pre-auth поверхность, XLSX и локальный CI-контур закрыты; webhook и rate-limit canary прошли. Владелец прямо отклонил ротацию ранее раскрытого Telegram-токена и принял остаточный риск. До D1 и Motion остаётся отдельное решение по `ip_profile` после browser snapshot и резервной копии.

## Архитектура и attack surface

- Node/TypeScript: Electron 42 + React 19 + Vite; отдельные Web и IP Vite-приложения.
- Backend: Supabase Auth/Postgres/RLS/Edge Functions; service role используется только на серверных границах.
- Публичные API-поверхности: 17 Edge Functions и 2 Vercel API handlers.
- Webhook receivers: `user-bot`, `support-bot`, `payment-click`, `payment-payme`.
- Точки локального выбора/обработки файлов: 9 экранов; опасный XLS/XLSX read-path найден один.
- Внешние интеграции: Telegram, Gemini, Supabase, Click, Payme, Lex.uz, CBU и сайты банков.
- CI workflows: 2; containers/IaC: 0; deploy-контуры: Electron, Supabase и три Vercel SPA.
- WebSocket/realtime: Supabase Realtime.
- Secret management: env/Supabase secrets. Отслеживаемых `.env` нет; `.env` закрыт `.gitignore`.

## Подтверждённые находки

### 1. CRITICAL — токен Telegram-бота раскрыт вне secret storage

- **Confidence:** 9/10.
- **Status:** ACCEPTED RISK BY OWNER. Владелец прямо распорядился оставить прежний токен; значение не читалось и не выводилось при развёртывании.
- **Motivating evidence:** токен был передан в рабочем чате открытым текстом; в коде и git history соответствующий credential pattern не найден.
- **Exploit scenario:** получатель токена вызывает Telegram Bot API, меняет/удаляет webhook, перехватывает будущие updates и отправляет сообщения от имени BX. Для auth-бота это затрагивает номера телефонов и доверие к входу.
- **Fix:** немедленно revoke/regenerate через BotFather; новый токен записать только в Supabase secret storage; создать новый webhook secret; установить webhook с `secret_token`; проверить `getWebhookInfo`; просмотреть события за окно экспозиции. Новый токен не передавать в чат, код или логи.

### 2. HIGH — `support-bot` принимает неподписанный webhook и пишет как `staff`

- **Confidence:** 9/10.
- **Status:** RESOLVED AND DEPLOYED. `support-bot` version 5 и `user-bot` version 12 активны в `bxuz` с `verify_jwt=false` и собственной signed-source проверкой; номера версий увеличились при добавлении общего auth rate-limit secret, исходный код support-маршрута не менялся.
- **Implemented evidence:** `handler.ts` проверяет отдельные заголовки Telegram и Database Webhook до `request.json()` и создания service-role store; Telegram branch ограничен операторским chat ID. 14 тестов подтверждают отказ unsigned/wrong/cross-source/foreign-chat запросам и идемпотентность. Неподписанный production POST вернул `403`, GET — `405`, подписанный отрицательный canary через `pg_net` — ожидаемый `400`, реальная доставка существующего тикета оператору — `200`.
- **Routing:** действующий Telegram webhook остаётся на `user-bot`, поэтому вход и коды не прерываются. Ответы оператора на сообщения с `#t_<uuid>` обрабатываются там же и сохраняются идемпотентно; `support-bot` принимает Vault-signed Database Webhook и отправляет уведомления через существующий `USER_BOT_TOKEN`.

### 3. HIGH — публичные pre-auth функции не ограничивают частоту запросов

- **Confidence:** 9/10.
- **Status:** RESOLVED AND DEPLOYED. `telegram-auth` и `recovery-auth` активны в `bxuz`; обе функции возвращают `405` для неподдерживаемых методов, `400` для повреждённого JSON, не-объекта и некорректного UUID и `429` с `Retry-After` при исчерпании лимита.
- **Implemented evidence:** атомарный service-role RPC ведёт независимые 15-минутные buckets по HMAC-псевдониму сетевого источника и verifier/challenge/code. Исходные IP, recovery-коды и verifier в таблицу лимитов не записываются; `anon` и `authenticated` не имеют доступа к RPC и приватной таблице.
- **Canary:** первый вызов тестового bucket был разрешён, второй отклонён; тестовая строка удалена. После HTTP canary новых Telegram challenges и recovery attempts не появилось. Hourly prune job активен; Supabase Advisors не выдали предупреждений по новым объектам.

### 4. HIGH — уязвимый `xlsx@0.18.5` разбирает пользовательский файл

- **Confidence:** 10/10.
- **Status:** RESOLVED.
- **Implemented evidence:** App и Web используют точный официальный tarball SheetJS CE `0.20.3` с одинаковым integrity в lock-файлах. Два round-trip теста покрывают пользовательский ArrayBuffer и экспортную книгу; `npm audit --omit=dev`, типы, полный App test suite и обе production-сборки проходят.
- **Residual note:** полный App audit всё ещё видит уязвимости только в dev/tooling-графе; production-граф чист. Нужен отдельный безопасный цикл обновления Electron Forge/tooling без смешивания с P0 runtime fix.

### 5. HIGH — профиль ИП с PII и банковскими реквизитами хранится открыто

- **Confidence:** 9/10.
- **Status:** VERIFIED storage; remote exploit зависит от появления script execution на origin.
- **Motivating lines:** `ip/src/lib/store.ts:4-13` определяет ФИО, ИНН/ПИНФЛ, телефон, адрес и банковский счёт; строки 49–52 сохраняют JSON напрямую в localStorage. `Profile.tsx:45` сообщает лишь «на этом устройстве», не объясняя отсутствие защиты.
- **Exploit scenario:** XSS, скомпрометированная frontend-зависимость, расширение браузера или пользователь того же профиля читает `ip_profile` одной строкой и получает полный набор реквизитов.
- **Fix:** не выполнять in-place rewrite. После counts/backup внедрить versioned envelope, server-backed профиль с RLS, dual-read, подтверждение миграции и удаление plaintext только после серверной верификации. До миграции не расширять состав `ip_profile`.

### 6. MEDIUM — CI использует mutable action tags без CODEOWNERS

- **Confidence:** 9/10.
- **Status:** RESOLVED LOCALLY.
- **Implemented evidence:** все `uses:` закреплены полными 40-символьными SHA, добавлены CODEOWNERS, Gitleaks full-history scan для root и App submodule и проверка скачиваемого бинарника по SHA-256. YAML/actionlint, fingerprint-исключения и локальный history scan проходят.
- **Residual note:** файлы CI пока не закоммичены, поэтому защита начнёт действовать после обычного review/commit/push. Автоматическое обновление pinned SHA остаётся отдельной задачей.

## Проверки без находок выше порога

- В текущем дереве и доступной git history не найден credential pattern Telegram/AWS/GitHub/Stripe/Slack; тестовые fixtures и `.claude` исключены.
- `user-bot` проверяет Telegram webhook secret до разбора body и привязывает admin confirmations к Telegram user/chat.
- Click проверяет provider signature; Payme проверяет Basic credential.
- Явного исполнения LLM output, небезопасного HTML-рендера AI-ответов или отключения TLS не найдено.
- `pcClean` вызывает только фиксированные `tasklist`/`ps ax`; 1С-процессы запускаются через `execFile` с массивом аргументов.
- `check-indicators` требует серверной авторизации перед production, но его доступный эффект в текущем коде ограничен unverified reference rows; этот кандидат оставлен ниже daily threshold до проверки deploy/config.

## Supply chain

| Контур | Production tree | Audit | Lockfile |
|---|---:|---|---|
| App | production tree | чисто; полный dev/tooling audit: 34 уязвимости | есть, tracked в App repo |
| Web | production tree | чисто | есть, tracked |
| IP | 22 пакета + root | чисто | есть, но весь `ip/` пока untracked |

Install scripts найдены только у ожидаемых build/optional/funding пакетов (`esbuild`, `electron-winstaller`, `fsevents`, `tesseract.js`); отдельного exploit path не найдено.

## Обезличенный production snapshot

Read-only counts проекта `bxuz` на 20 июля 2026 года, без чтения содержимого записей:

| Сущность | Записей |
|---|---:|
| Auth users | 31 |
| BX profiles | 31 |
| Telegram identities | 2 |
| Telegram login challenges | 3 |
| Support tickets | 9 |
| Support ticket messages | 23 |

Эти counts разрешают изменения webhook и XLSX-кода, которые не меняют формат данных. Они не разрешают миграцию `ip_profile`: локальные browser records не видны серверу, а подтверждение резервной копии ещё не получено.

## STRIDE и классификация данных

- **Spoofing:** support webhook теперь требует независимую подпись источника; публичные pre-auth вызовы ограничены отдельно по источнику и одноразовому идентификатору.
- **Tampering:** запись staff messages разрешена только подписанному support-контуру; `xlsx` обрабатывает недоверенный бинарный вход обновлённой библиотекой.
- **Repudiation:** admin/security events и детерминированные Telegram update ID сохраняют проверяемый след privileged-действий.
- **Information disclosure:** открытый bot token и plaintext `ip_profile` — главные риски.
- **Elevation of privilege:** rate-limit RPC доступен только service role; `anon` и `authenticated` не могут читать или изменять приватные buckets.

Restricted data: Telegram identity/phone, auth/recovery material, PII, ИНН/ПИНФЛ, банковский счёт, документы и платёжные операции. Confidential: provider keys, service role, prompts/usage, support content. Public: marketing, опубликованная БЗ и открытые справочники.

## Порядок исправления

1. Ротация ранее раскрытого bot token остаётся настоятельной рекомендацией, но отклонена владельцем как принятый риск.
2. Signed support deployment, независимые webhook secrets, Vault-backed Database Webhook и canary выполнены.
3. Атомарные лимиты публичных `telegram-auth` и `recovery-auth`, отдельный HMAC-secret и retention job развёрнуты и проверены.
4. Принять и отправить CI security-файлы обычным review/commit/push; отдельно спланировать обновление App dev/tooling-зависимостей.
5. Получить browser counts/backup для IP и только затем внедрять dual-read migration профиля.
6. После закрытия этих ворот начинать Motion/Bento vertical slice.

## Ограничения проверки

Supabase Security Advisor дополнительно отметил отключённую защиту от скомпрометированных паролей, доступное обновление PostgreSQL и набор предупреждений по GraphQL-exposure и исполняемым `SECURITY DEFINER`-функциям. После auth rate-limit миграции остаются 193 security и 283 performance notices из существующего backlog; ни одно не относится к `bx_public_auth_rate_limits` или `bx_consume_public_auth_rate_limit`. Каждое старое предупреждение требует проверки назначения и прав, поэтому несвязанные автоматические изменения Auth не выполнялись.

- Supabase CLI запускался одноразово через `npx`; список secrets проверялся только по именам и хэшам, значения существующих secrets не читались. Новые webhook secrets генерировались без вывода и записаны раздельно в Edge Secrets/Vault.
- Глобальные AI-скиллы вне репозитория не сканировались; repo-local каталог содержит vendored gstack и исключён как доверенный источник.
- Выполнены ограниченные live-canary против `support-bot`: unsigned/method checks, signed отрицательный Database Webhook и одна реальная доставка существующего тикета без изменения записей.
- Выполнены live-canary `telegram-auth`/`recovery-auth`: method, malformed JSON, invalid input и атомарный RPC bucket. Новые login challenges, recovery attempts и пользовательские сессии не создавались.
- Три независимых специализированных агента реализовали webhook, XLSX и CI-пакеты; основной агент повторно проверил критичные диффы и интеграционные команды.

Этот AI-assisted аудит не заменяет профессиональный security audit или penetration test. Для production с PII, платежами и восстановлением доступа нужен независимый аудит специалистами.
