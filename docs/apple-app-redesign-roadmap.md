# Apple-style редизайн BX App — маршрут от оболочки до последней формы

Дата начала: 23 июля 2026 года
Статус: A0–A4 завершены; следующий пакет — A5, знания, справочники и новости.

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

- [ ] `/knowledge`: библиотека, категории, поиск и сохранённое.
- [ ] Страница статьи, источники, дата проверки и связанные действия.
- [ ] `/reference`: финансовые, бухгалтерские и прочие справочники.
- [ ] `/news`: лента без дублирования справочных показателей.
- [ ] `/news/:id`: широкий reading layout, источник, влияние и следующие действия.

## A6 — Организации, финансы и валюты

- [ ] `/counterparties`, `/counterparties/:id`, `/companies/:id`.
- [ ] Создание/редактирование компании и контрагента.
- [ ] Company profile wizard, team, роли и activity.
- [ ] `/finance`, `/finance/:id`: реестр и карточка обязательства.
- [ ] `TxModal` и `ImportModal`.
- [ ] `/currency`: курсы, банки, converter, history и export.

## A7 — Калькуляторы и утилиты

- [ ] `/calc`: только категории → инструменты; без дублей «работают/идеи» и без переключателя обучения.
- [ ] Все налоговые, зарплатные и отраслевые расчётные формы.
- [ ] `/tools`: отдельная информационная архитектура утилит.
- [ ] PDF, OCR, 1С, E-Imzo, сеть, кэш, заметки, транслитерация и проверки.
- [ ] Regulatory gates, progress, warning, result и export states.

## A8 — Сервисы, поддержка и настройки

- [ ] `/services`: task-first каталог внешних сервисов.
- [ ] `/support`: отправка обращения за минимальное число действий.
- [ ] Черновик, вложения, история, статус и ответ оператора.
- [ ] `/settings` и `/account`: ясное разделение приложения и аккаунта.
- [ ] Тема, плотность, масштаб, уведомления, устройства, тариф и лимиты.
- [ ] Payment остаётся визуальным preview до отдельного платёжного релиза.

## A9 — Общие формы и overlay

- [ ] Единые `Button`, `Field`, `Select`, `Date`, `Money`, `Upload` и inline validation.
- [ ] `OverlayPanel`, modal, popover, context menu, bottom sheet и confirmation.
- [ ] `PaywallModal`, `ConflictModal`, `AboutModal`.
- [ ] Skeleton, empty, offline, permission, limit, stale и fatal error.
- [ ] Одинаковые focus ring, destructive hierarchy и undo policy.

## A10 — Финальная приёмка

- [ ] Все рабочие маршруты открываются напрямую и через Back/Forward.
- [ ] Desktop: 1280, 1440, 1600 и ultrawide.
- [ ] Mobile: 375, 390, 768 и landscape.
- [ ] Нет horizontal overflow, пустых интерактивных зон и наложения fixed chrome.
- [ ] Keyboard-only, screen reader labels и focus restoration.
- [ ] Reduced motion/transparency, contrast и forced colors.
- [ ] Data-retention smoke: localStorage, Dexie, offline queue, Supabase session.
- [ ] Bundle budgets, Motion Mini budget, production build и canary.
