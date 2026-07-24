# Apple-style редизайн BX App — маршрут от оболочки до последней формы

Дата начала: 23 июля 2026 года
Статус: A0–A8 UI завершены; A9 foundation, системные overlay и миграция browser alert/confirm/prompt завершены, продолжается поэтапная миграция оставшихся route-local форм. Для support-вложений отдельно требуется серверный контракт.

## Неподвижные границы

- Редизайн не меняет Supabase schema/data, RPC, RLS, Edge Functions и Secrets.
- Не переименовываются и не очищаются `localStorage`, Dexie/IndexedDB, offline queue, документы, задачи и пользовательские настройки.
- Канонический реестр маршрутов остаётся в `components/layout/navigation.ts`.
- Одинаковая оболочка работает в Electron, широком Web и мобильном Web.
- Каждый пакет обязан пройти lint, typecheck, tests, production build, bundle/Motion budgets и browser QA.
- Интерактивные цели — не меньше 44×44 px; поддерживаются keyboard, reduced motion, reduced transparency, повышенный контраст и forced colors.

## Общий дизайн-контракт

- Платформенная системная типографика и размерозависимые tracking/leading.
- Спокойный нейтральный canvas с мягким лавандовым акцентом.
- Translucent material используется только для навигации, toolbar, popover и sheet.
- Один основной CTA на экран; вторичные действия не спорят с ним.
- Нажатие получает feedback на pointer-down; переходы обратимы и пространственно согласованы.
- Основной desktop canvas — до 1600 px, reading canvas — до 72ch; mobile не масштабирует desktop-композицию.
- Bento показывает приоритет, а не превращает каждый текст в отдельную карточку.

## A0 — оболочка и навигация

- [x] Проведена graphify-инвентаризация `App`, `Sidebar`, `Topbar`, `MobileNavigation`, маршрутов, страниц и форм.
- [x] Сайдбар переведён на Apple-style material, системную типографику и спокойное активное состояние.
- [x] Сохранены `bx_sidebar_collapsed`, collapse rail и канонические группы маршрутов.
- [x] В постоянную нижнюю область возвращены отдельные входы в Поддержку, Настройки и Личный кабинет.
- [x] Добавлены plan/version context, 44 px targets, press feedback и accessibility media modes.
- [x] Mobile navigation подготовлена как плавающий dock с safe-area.
- [x] Sidebar проверен на desktop `1440×1000` и mobile `390×844`: ширина `264↔80 px`, horizontal overflow `0`, mobile main padding `96 px`.
- [x] Контракт оболочки подтверждён lint, typecheck, `359/359` тестами, production build, bundle budget и Motion Mini budget.
- [x] Topbar: поиск сведён к одному глобальному входу; статусы синхронизации, company switcher, уведомления, быстрые заметки и профиль сохранены.
- [x] Command Palette: добавлены Apple-style material, keyboard loop, focus restoration, loading и empty states.
- [x] Titlebar Electron: геометрия согласована с shell, оконные действия сохранены.
- [x] Onboarding/Auth/PIN: применён общий визуальный, interaction и accessibility-контракт без изменения auth-flow.

## A1 — Главная

- [x] `/dashboard`: новый task-first daily control center без дублирующих пустых блоков.
- [x] Фокус дня, рабочий ритм и ближайший срок объединены в одну понятную иерархию.
- [x] Новый бухгалтерский календарь сохраняет официальный редакционный статус данных и создаёт задачу только по действующему контракту.
- [x] Погода и курсы оформлены как компактные сигналы; рабочие инструменты не обрезают названия.
- [x] Бухгороскоп вынесен в спокойную полноширинную необязательную паузу.
- [x] Loading, empty, offline, stale, permission, locked, exhausted и error states сохранены и проверены.

## A2 — Планировщик и все формы задач

- [x] `/planner`: календарь, список, фокус, доски, архив и системные задачи.
- [x] Новая задача/событие: `EventModal`.
- [x] Карточка задачи: `CardModal`.
- [x] Доска: `BoardModal`.
- [x] Задачи дня: `DailyTasksModal`.
- [x] Timeline и summary события.
- [x] Drag/drop, keyboard, mobile sheet и reduced-motion.

## A3 — Документы

- [x] `/documents/templates`: каталог, категории, поиск и текстовый preview.
- [x] Создание личного шаблона и редактирование содержимого до сохранения.
- [x] `/documents/my`: карточный архив, загрузка, совместные фильтры и понятные состояния.
- [x] PDF/изображения открываются по временной signed-ссылке; DOC/DOCX экспорт и DOCX demand-loading сохранены; XLSX остаётся в профильных утилитах и не имитируется архивом.
- [x] Ошибки файлов, состояние загрузки, отмена sheet, storage rollback и безопасное восстановление сохранены.

## A4 — AI и переводчик

- [x] `/ai`: новый широкий разговорный workspace, источники, история, квота и recovery.
- [x] Composer получил явное согласие на внешний AI, cancel/retry и честный связанный контекст компании; неподдерживаемая загрузка вложений не имитируется.
- [x] `/translator`: финальная унификация с Apple-style shell и общей шириной приложения.
- [x] Первый запуск переводчика показывается один раз без постоянной кнопки «Показывать обучение».
- [x] Загрузка документа, языки, настройки, результат, повтор, объяснение, экспорт и сохранение в Документы сохранены.
- [x] История AI и архивирование перевода используют доступные viewport-level sheets с focus trap и возвратом фокуса.
- [x] Desktop `1280×720` и mobile `390×844`: интерактивные состояния проверены, horizontal overflow `0`.

## A5 — Знания, справочники и новости

- [x] `/knowledge`: библиотека, категории, поиск и сохранённое.
- [x] Страница статьи, источники, дата проверки и связанные действия.
- [x] `/reference`: финансовые, бухгалтерские и прочие справочники.
- [x] `/news`: лента без дублирования справочных показателей.
- [x] `/news/:id`: широкий reading layout, источник, влияние и следующие действия.

## A6 — Организации, финансы и валюты

- [x] `/counterparties`, `/counterparties/:id`, `/companies/:id`.
- [x] Создание/редактирование компании и контрагента.
- [x] Company profile wizard, team, роли и activity.
- [x] `/finance`, `/finance/:id`: реестр и карточка обязательства.
- [x] `TxModal` и `ImportModal`.
- [x] `/currency`: курсы, банки, converter, history и export.

## A7 — Калькуляторы и утилиты

- [x] `/calc`: только категории → инструменты; без дублей «работают/идеи» и без переключателя обучения.
- [x] Все налоговые, зарплатные и отраслевые расчётные формы.
- [x] `/tools`: отдельная информационная архитектура утилит.
- [x] PDF, OCR, 1С, E-Imzo, сеть, кэш, заметки, транслитерация и проверки.
- [x] Regulatory gates, progress, warning, result и export states.
- [x] Формулы, regulatory RPC, PDF/OCR demand-loading и прежние ключи истории/настроек сохранены; App typecheck, lint, `386/386` тестов, production build, bundle budget и Motion Mini budget — PASS.

## A8 — Сервисы, поддержка и настройки

- [x] `/services`: task-first каталог внешних сервисов.
- [x] `/support`: отправка обращения за минимальное число действий.
- [x] Автосохраняемый черновик, история, статус и ответ оператора.
- [ ] Вложения обращения: нужен отдельный Storage/DB/RLS-контракт и явное одобрение backend-изменений; фиктивная загрузка в UI не добавляется.
- [x] `/settings` и `/account`: ясное разделение приложения и аккаунта.
- [x] Тема, плотность, масштаб, уведомления, устройства, тариф и лимиты.
- [x] Payment остаётся визуальным preview до отдельного платёжного релиза.
- [x] Desktop `1280×720` и mobile `390×844`: task filters, direct composer, responsive navigation и horizontal overflow проверены; App typecheck, lint, `392/392` тестов, production build, bundle `349,7 KiB gzip` и Motion Mini `3,9 KiB` — PASS.

## A9 — Общие формы и overlay

- [ ] Единые `Button`, `Field`, `Select`, `Date`, `Money`, `Upload` и inline validation.
  - [x] A9 foundation: общие native-контролы, visible labels, hint/error IDs, blur-oriented validation, 44px target и семантические disabled/invalid states.
  - [x] Первые production-сценарии: конвертер валют и загрузка документов переведены без изменения расчётного или Storage-контракта.
  - [x] Пакет 2.84.0: `/support`, полный мастер профиля компании и приглашение команды переведены на общие `Field`, `Select`, `DateField`, `Textarea`; добавлены semantic input types, autocomplete/inputMode, inline errors и фокус на первую ошибку.
  - [x] Пакет 2.85.0: финансовая карточка и импорт выписки, денежные поля девяти калькуляторов, пени, сравнение режимов, банковские реквизиты, число прописью и калькулятор дат переведены на общий foundation без изменения persistence, ставок и формул.
  - [ ] Оставшиеся route-local формы мигрируются пакетами; глобальный CSS override не применяется, чтобы не ломать пользовательские сценарии.
- [x] `OverlayPanel`, modal, popover, context menu, bottom sheet и confirmation.
- [x] `PaywallModal`, `ConflictModal`, `AboutModal`.
- [x] Skeleton, empty, offline, permission, limit, stale и fatal error.
- [ ] Одинаковые focus ring, destructive hierarchy и undo policy.
  - [x] Общий focus ring и safe-first destructive confirmation применены к документам; календарное context menu получило единый keyboard-контракт.
  - [x] Все продуктовые `window.confirm`/`window.alert`/`window.prompt` заменены: необратимые операции используют общий safe-first dialog, обратимые локальные удаления — доступный Undo toast на 6 секунд.
  - [x] Общий текстовый prompt использует visible label, native Enter-submit, focus trap, Escape и возврат фокуса; применён к шаблонам чек-листа Планировщика.
- [x] Desktop `1280×720` и mobile `390×844`: upload sheet, system dialog, 44px targets и horizontal overflow проверены в живом browser preview.
- [x] App typecheck, lint, `401/401` тест, production build, bundle `347,7 KiB gzip` и Motion Mini `3,9 KiB` — PASS.
- [x] A9-слои вынесены в demand-loaded chunks; лимит bundle не повышался, initial closure уменьшен с `349,7` до `346,8 KiB gzip`.
- [x] Confirmation и Prompt загружаются только по требованию; после завершения legacy-миграции initial closure остаётся ниже лимита — `347,7 KiB gzip`.
- [x] Browser QA 2.83.0: desktop `1280×720` и mobile `390×844`, translator confirmation `480×321` / mobile bottom sheet `390×353`, все dialog actions `44px`, horizontal overflow `0`; отмена сохраняет исходник и результат, Undo восстанавливает локальную заметку.
- [x] Browser QA 2.84.0: `/support` и мастер компании проверены на `1280×720` и `390×844`; horizontal overflow `0`, форма поддержки `768→357 px`, мобильный мастер `358×844`, поля и действия не меньше `44px`, фокус после ошибки переходит в первое неверное поле.
- [x] App 2.84.0: typecheck, lint, `404/404` теста, production build и все bundle budgets — PASS; demand-loading мастера компании снизил initial closure до `341,4 KiB gzip`, Motion Mini остался `3,9 KiB gzip`.
- [x] Browser QA 2.85.0: `/finance`, `/calc` и `/tools` проверены на `1280×720` и `390×844`; horizontal overflow `0`, transaction sheet `390 px`, все проверенные действия и поля не меньше `44px`, inline error и перевод фокуса на сумму подтверждены.
- [x] App 2.85.0: typecheck, lint, `116/116` suites и `411/411` тестов, production build, initial bundle `341,7 KiB gzip`, demand budgets и Motion Mini `3,9 KiB gzip` — PASS.
- [x] Graphify обновлён после пакета 2.83.0: `2156` узлов, `4935` связей, `125` сообществ; результат сохранён как useful memory.
- [x] Graphify обновлён после пакета 2.84.0: `2171` узел, `4961` связь, `133` сообщества; маршрут миграции форм сохранён как useful memory.
- [x] Graphify обновлён после пакета 2.85.0: `2182` узла, `5011` связей, `138` сообществ; безопасная граница Finance/Calc/Tools сохранена как useful memory.
- [x] Supabase schema/data, RPC/RLS, Edge Functions, Secrets, payment и пользовательские записи не менялись.

## A10 — Финальная приёмка

- [ ] Все рабочие маршруты открываются напрямую и через Back/Forward.
- [ ] Desktop: 1280, 1440, 1600 и ultrawide.
- [ ] Mobile: 375, 390, 768 и landscape.
- [ ] Нет horizontal overflow, пустых интерактивных зон и наложения fixed chrome.
- [ ] Keyboard-only, screen reader labels и focus restoration.
- [ ] Reduced motion/transparency, contrast и forced colors.
- [ ] Data-retention smoke: localStorage, Dexie, offline queue, Supabase session.
- [ ] Bundle budgets, Motion Mini budget, production build и canary.
