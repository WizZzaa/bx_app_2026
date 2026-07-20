# D1: вертикальный срез дизайн-системы BX

Дата решения: 20 июля 2026 года
Статус: спецификация готова к реализации после прохождения перечисленных ворот; продуктовый код, зависимости и пользовательские данные этим документом не изменяются.

Связанные документы: [D0-аудит](./redesign-d0-audit.md), [Security P0](./security-p0-posture-2026-07-20.md), [продуктовый план](./product-work-plan.md).

## 1. Решение

D1 реализуется не как одномоментная перекраска всего продукта, а как общий вертикальный срез `Home / Overview` через все интерфейсные контуры:

| Поверхность | Канонический маршрут среза | Что входит в D1 |
|---|---|---|
| Windows/Desktop | `#/dashboard` | новая оболочка, боковая навигация, Topbar, Bento-главная и базовые компоненты |
| BX Web Desktop/Tablet | `/app/dashboard` | тот же renderer после Web Auth Gate, адаптивная оболочка и сохранение deep link |
| BX Web Mobile | `/app/dashboard` | самостоятельная мобильная композиция, нижняя навигация из пяти пунктов и Sheet для «Ещё» |
| Публичный сайт | `/` | новый header, первый экран, один доказательный Bento-блок и CTA без загрузки Workspace |
| Админка | `/admin/overview`, совместимый вход `/admin` | новая оболочка и Overview; панель получает URL вместо состояния только в памяти |
| BX для ИП Web/PWA | `/app` | новая оболочка и Home, без изменения `ip_*`-ключей, профиля, service worker или cache name |

Остальные маршруты продолжают использовать существующее представление. Новые примитивы допускается подключать к ним позже, только после приёмки среза. D1 не меняет таблицы Supabase, RPC, Dexie schema, `localStorage`, URL документов, тарифы, права, auth gates или формат offline queue.

### Не входит в D1

- массовая миграция страниц D2–D5;
- изменение бизнес-логики Dashboard, Admin или ИП;
- защита/перенос `ip_profile` — для неё сохраняется отдельный Security P0 gate;
- удаление старых CSS, компонентов и fallback UI;
- создание миграций или deployment Supabase;
- автоматическое включение нового UI всем пользователям.

## 2. Основание решения

Канонический Graphify-граф связал `App`, `Dashboard`, `Sidebar`, `MobileNavigation`, `Button`, `Card`, `DataTable`, `Settings`, `Support` и другие страницы общего renderer. Вывод проверен по текущему коду, так как граф не покрывает CSS и может отставать от параллельных изменений. Текущие точки входа и code-splitting подтверждены непосредственно в [Desktop App](../src/renderer/App.tsx), [Web App](../../web/src/App.tsx), [PublicSite](../../web/src/routes/PublicSite.tsx), [WebWorkspace](../../web/src/routes/WebWorkspace.tsx), [AdminPortal](../../web/src/routes/AdminPortal.tsx) и [ИП App](../../ip/src/App.tsx).

`ui-ux-pro-max` предложил Bento Grid, Financial Dashboard, 150–300 мс для микровзаимодействий, WCAG AA и mobile-first. Предложение «Vibrant & Block-based» и внешний Plus Jakarta Sans не принимаются: они конфликтуют со спокойным B2B-направлением мастер-спецификации, офлайн-контуром Desktop/PWA, текущим Inter/Segoe UI стеком и предсказуемой кириллицей. Из рекомендации принимаются модульная Bento-иерархия, нейтральные поверхности, один акцент, явные финансовые статусы, адаптивный reflow и строгие accessibility/performance gates.

## 3. Целевой визуальный язык

BX выглядит как спокойный профессиональный рабочий инструмент бухгалтера:

- нейтральная канва и светлые/тёмные поверхности;
- канонический лавандовый брендовый акцент без неона;
- Bento показывает приоритет, но не превращает таблицы и формы в набор вложенных карточек;
- один главный CTA на экран;
- Lucide или существующий BX SVG-набор, единая толщина штриха; emoji не используются как структурные иконки;
- blur применяется только к scrim/overlay, а не как постоянная декорация;
- данные и статусы читаются без зависимости от цвета;
- числа, суммы и даты используют tabular figures.

## 4. Канонические дизайн-токены

### 4.1. Расположение и контракт

Целевой framework-neutral источник — `app/src/shared/design/tokens.css`. Его импортируют `app/src/renderer/styles/globals.css` и `web/src/index.css`; текущие объявления `--bx-*` удаляются из этих файлов только после parity-теста. ИП получает те же семантические роли через mapping в `ip/src/index.css`, сохраняя `--ip-*` aliases на один стабильный выпуск.

Компоненты используют только семантические токены. Raw hex допускается в источнике токенов, иллюстрациях и данных графиков, но не в TSX-классах компонентов.

### 4.2. Светлая и тёмная темы

Контраст указанных пар рассчитан по WCAG contrast formula и должен перепроверяться автоматическим тестом.

| Роль | Light | Dark | Контракт |
|---|---|---|---|
| `--bx-canvas` | `#F7F5FA` | `#111018` | общий фон |
| `--bx-surface` | `#FFFFFF` | `#181621` | рабочая панель/карточка |
| `--bx-surface-subtle` | `#F0EDF5` | `#211E2B` | secondary control, selected row |
| `--bx-surface-strong` | `#E5DFEC` | `#2A2636` | raised/pressed surface |
| `--bx-text-primary` | `#1B1723` | `#F7F4FB` | 16.25:1 / 17.36:1 к canvas |
| `--bx-text-secondary` | `#5F586B` | `#C2BACD` | 6.27:1 / 10.08:1 к canvas |
| `--bx-border` | `#D8D1E2` | `#3D374A` | разделитель, не единственный сигнал |
| `--bx-brand` | `#68528F` | `#B9A2E2` | основной акцент |
| `--bx-on-brand` | `#FFFFFF` | `#1B1329` | 6.58:1 / 7.96:1 |
| `--bx-success` | `#18794E` | `#57CC8A` | всегда с текстом/иконкой |
| `--bx-warning` | `#8A5A00` | `#F0B45A` | всегда с текстом/иконкой |
| `--bx-danger` | `#B42318` | `#FF8A80` | destructive/error |
| `--bx-info` | `#1D5FA7` | `#75B8FF` | информационный статус |
| `--bx-focus` | `#68528F` | `#D3C1F2` | focus ring 3 px + offset 2 px |
| `--bx-scrim` | `rgb(17 16 24 / 0.56)` | `rgb(0 0 0 / 0.64)` | только modal/sheet |

`high-contrast` остаётся самостоятельным отображением: чёрный canvas, белый текст/границы, жёлтый focus/brand и отсутствие полупрозрачных информационных слоёв. `system` следует `prefers-color-scheme`, но явный пользовательский выбор имеет приоритет.

### 4.3. Геометрия, типографика и слои

| Группа | Токены |
|---|---|
| Шрифт | `Inter, "Segoe UI", Roboto, Arial, sans-serif`; mono — текущий системный стек |
| Размеры | `12 / 14 / 16 / 18 / 24 / 32 / 40`; body mobile не меньше 16 px |
| Line-height | labels `1.25`, headings `1.2`, body `1.5`, long text `1.65` |
| Spacing | `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64` px |
| Radius | `8 / 12 / 16 / 24 / pill`; control 12, card 16, Bento hero 24 |
| Control | высота 44 px desktop/web, 48 px touch-first; расстояние между targets не меньше 8 px |
| Shadow | `none`, `0 1px 2px rgb(27 23 35 / .06)`, `0 12px 32px rgb(27 23 35 / .12)` |
| Z-index | base `0`, sticky `10`, nav `20`, popover `30`, scrim `40`, dialog/sheet `50`, toast `60` |
| Measure | рабочий max `1320px`, текстовый max `72ch` |

Текущие пользовательские `font scale` и `density` сохраняются. Compact меняет внутренние отступы и высоту строк таблицы на широком экране, но не уменьшает touch target ниже 44 px и не применяется принудительно на 375/390.

## 5. Bento-иерархия вертикального среза

### 5.1. Сетка

- 1440: 12 колонок, max-width 1320 px, gutter 32 px, gap 16 px.
- 1024: 8 колонок, gutter 24–32 px, gap 16 px.
- 768: 4 колонки, gutter 24 px, gap 16 px.
- 390 и 375: одна визуальная колонка, gutter 16 px, gap 12 px.
- Spans меняются только через именованные варианты `hero`, `primary`, `supporting`, `full`; произвольные page-specific spans запрещены.
- DOM-порядок равен мобильному приоритету; CSS не должен визуально переставлять focus order.

### 5.2. Authenticated Dashboard

Порядок DOM и mobile:

1. Page header: компания, дата, одно главное действие «Создать задачу».
2. «Ближайший обязательный срок» — primary Bento; причина, дата, источник и действие.
3. «Сегодня» — задачи и события из канонического планировщика.
4. «Быстрые действия» — максимум четыре, без второго primary CTA.
5. «Важные уведомления» — только требующие действия.
6. Secondary row: курсы/справочная сводка и вход в AI.

На 1440 primary deadline занимает 8 колонок, quick actions 4; Today — 8, alerts/AI — 4. На 1024 — 5/3, на 768 и ниже — последовательный stack. Погода, гороскоп, полный календарь и декоративные статистические карточки не входят в новый Dashboard; они не удаляются из кода в D1, а остаются в старой ветке до утверждённой миграции.

### 5.3. Public Home

1. Header: возможности, Web/Windows, тарифы, FAQ, RU/O‘Z, вход.
2. Hero: одно обещание, один primary CTA с platform-aware назначением, вторичная текстовая ссылка.
3. Bento proof: ближайший срок, документ, AI-ответ — как продуктовые доказательства, не масштабированный screenshot Desktop.
4. Trust row: официальный источник, локальность ЭЦП/1С, прозрачность тарифов.

На мобильном hero и proof строятся заново в одну колонку. Автопрокрутка, marquee, parallax и бесконечные декоративные blob-анимации не переносятся.

### 5.4. Admin Overview

1. Состояние системы и требующие решения события.
2. Критичные операции/инциденты.
3. Тарифы, пользователи, платежи и поддержка как четыре supporting blocks.
4. Audit summary и переход в журнал.

Overview не выполняет mutation из карточки без подтверждения. Роль определяет доступность, но недоступный destination объясняется, а не исчезает молча.

### 5.5. ИП Home

1. Следующий налог/дедлайн и одно главное действие.
2. Быстрый расчёт.
3. Документы.
4. База знаний/AI.

Значения читаются существующими функциями. D1 не читает `ip_profile` новым способом, не переименовывает `ip_*`, не пишет новую версию cache и не меняет PWA update flow.

## 6. Навигация

### Desktop и Web ≥ 1024

- Sidebar: 248 px expanded, 72 px collapsed; канонические семь разделов остаются из [navigation.ts](../src/renderer/components/layout/navigation.ts).
- Active state: surface + left indicator + weight; не только цвет.
- Topbar: company switcher, global search, notifications, account; page-specific action находится в page header.
- Collapse choice продолжает использовать текущий ключ, без переименования.

### Tablet 768–1023

- Navigation rail 72 px при достаточной ширине; при 200% zoom — drawer вместо rail.
- Drawer modal, закрывается Escape/scrim, trap focus, после закрытия возвращает focus trigger.
- Никакого второго horizontal scroll у основного content.

### Mobile Web 375/390

- Bottom navigation: `Главная`, `AI`, `База`, `Переводчик`, `Ещё`; иконка всегда имеет видимую подпись.
- «Ещё» открывает bottom Sheet с `Справочники`, `Календарь`, `Все сервисы`, `Поддержка`, `Личный кабинет`, `Настройки`.
- Bar учитывает `env(safe-area-inset-bottom)`; content получает соответствующий padding.
- Back закрывает Sheet до смены маршрута. Возврат восстанавливает scroll, фильтры и введённый текст.

### Public

- На 1024+ — header navigation; ниже — кнопка меню и Sheet.
- Язык и вход доступны без открытия глубокого меню.
- Все ключевые страницы сохраняют существующие URL; RU/O‘Z URL вводятся отдельным SEO-решением, не скрытым redirect в D1.

### Admin

- `web/src/App.tsx` принимает `/admin/*`; панель становится URL `/admin/:panel`.
- `/admin` делает replace на role-aware default, старые ссылки не ломаются.
- Недоступный role route показывает объяснение и безопасный переход, не рендерит панель до проверки роли.

### ИП

- На mobile сохраняются пять текущих bottom destinations; AI и Profile доступны из header.
- На 768+ используется sidebar. Все icon-only header actions получают accessible name и target 44×44.

После любого route change focus переводится на `<main>`/`h1`, кроме Back: Back восстанавливает предыдущий логический focus и scroll.

## 7. Компонентный контракт

Текущие [Button](../src/renderer/components/ui/Button.tsx), [Card](../src/renderer/components/ui/Card.tsx), [FormField](../src/renderer/components/ui/FormField.tsx), [ListPanel](../src/renderer/components/ui/ListPanel.tsx) и [DataTable](../src/renderer/components/ui/DataTable.tsx) расширяются без изменения существующих props в первом выпуске.

### Button

- Variants: `primary`, `secondary`, `ghost`, `danger`; `success` не используется как общий CTA.
- Sizes: `sm`, `md`, `lg`, `icon`; любой interactive box не меньше 44×44.
- States: default, hover, pressed, focus-visible, loading, disabled.
- Loading сохраняет ширину label, ставит `aria-busy`, блокирует повторную отправку.
- Icon-only требует `aria-label`; destructive отделён от primary spatially.

### Card и Bento

- `Card` — семантическая surface, не обязательно кликабельная.
- Кликабельная Card рендерится ссылкой/кнопкой, получает focus/pressed state и полное accessible name.
- `BentoGrid` и `BentoItem` управляют только layout/span/priority; они не добавляют вложенную карточку автоматически.
- На одном viewport не больше одного `hero/primary` item.

### Form

- Видимый label, optional hint, required marker с текстовой семантикой, error рядом с полем.
- Валидация на blur/submit, не на каждую клавишу; первая ошибка получает focus, summary с anchor появляется при 2+ ошибках.
- Async submit: loading → success/error с recovery path; error объявляется через `role="alert"`/`aria-live`.
- Длинные формы сохраняют draft существующим механизмом; закрытие dirty Dialog/Sheet требует подтверждения.

### List

- `ul/ol` для наборов, `nav` для переходов, `dl` для label/value.
- Empty/loading/error — отдельные состояния, не пустая белая область.
- 50+ интерактивных строк виртуализируются только после измерения; keyboard/reader остаются доступны.

### Table

- `caption` или labelled region; sortable header использует button + `aria-sort`.
- Sticky header только внутри одного понятного scroll region.
- Суммы/даты — tabular figures и locale-aware formatting.
- На 375/390 операционные таблицы становятся list cards с тем же набором действий; сравнительные таблицы могут иметь один labelled horizontal scroller.
- Выбор строки и status не обозначаются одним цветом.

### Dialog и Sheet

- Одна API-модель: Desktop `Dialog`, mobile `Sheet`; breakpoint не меняет смысл действия.
- Focus trap, initial focus, Escape, явная Close, restoration trigger, `aria-modal`, title/description IDs.
- Dialog max-width 640/880; Sheet на mobile поднимается снизу, имеет max-height `calc(100dvh - safe-area)`.
- Destructive confirmation называет объект и последствие. Закрытие при pending mutation запрещено, но UI остаётся читаемым.

### Сопутствующие состояния

`Skeleton`, `EmptyState`, `ErrorState`, `Toast` и `Paywall` используют те же токены. Skeleton резервирует финальную геометрию и появляется только после 300 мс; Toast не забирает focus и имеет `aria-live="polite"`.

## 8. Центральный Motion-контракт

После отдельного dependency/bundle gate в App и Web фиксируется проверенная на D0 версия `motion@12.42.2` через `--save-exact`; импорт — из `motion/react`, не смешивается с `framer-motion`. Lock entries проверяются отдельно, потому что Web собирает общий renderer через alias. IP подключает ту же точную версию только перед своим срезом. Пакет не обновляется одновременно с Vite, React или test tooling.

Framework-neutral значения находятся в `app/src/shared/design/motion.ts`; React adapter — в `app/src/renderer/lib/ui/BxMotion.tsx`. Public/Admin импортируют presets через `@shared`. ИП до появления общего workspace зеркалит только типизированные значения и проходит parity-test; создание root workspace является отдельным архитектурным решением.

### Пресеты

| Preset | Enter | Exit | Назначение |
|---|---|---|---|
| `feedback` | 120 мс, opacity | 80 мс | press/status feedback |
| `fade` | 180 мс, opacity | 120 мс | замена контента |
| `raise` | 220 мс, `y: 8→0`, opacity | 140 мс, `y: 0→4` | panel/card entrance |
| `dialog` | 240 мс, opacity + `scale: .98→1` | 160 мс | modal |
| `sheet` | spring `stiffness 380`, `damping 34`, `mass .8` | 180 мс ease-in | mobile sheet |
| `route` | 200 мс crossfade; без animate presence всего shell | 120 мс | route content only |
| `stagger` | 30 мс, максимум 6 children | — | короткий Bento/list reveal |

Стандартная кривая enter `[0.22, 1, 0.36, 1]`, exit `[0.4, 0, 1, 1]`. Анимируются только `transform` и `opacity`; width, height, top, left, box-shadow blur и layout-affecting свойства запрещены. Анимация прерываема и никогда не блокирует обработчик.

Adapter использует `LazyMotion` + `domAnimation` и `m`, если bundle spike подтверждает выигрыш. На экране не больше двух заметных motion-акцентов. Бесконечная анимация допустима только для реального progress/loading indicator.

### Reduced motion

`useReducedMotion()` и `prefers-reduced-motion` являются частью одного контракта:

- translate/scale/stagger отключаются;
- route, dialog и sheet меняют состояние без пространственного движения;
- skeleton shimmer становится статичным;
- progress остаётся понятным по тексту/значению;
- функция и focus sequence полностью совпадают с обычным режимом.

Глобальное правило `0.01ms !important` остаётся safety net, но компонент обязан выбрать reduced preset сам — тест не должен зависеть только от CSS.

## 9. Responsive и доступность

| Viewport | Обязательная приёмка |
|---|---|
| 375×667 | одна колонка, 16 px gutter, bottom nav + safe area, без horizontal scroll |
| 390×844 | тот же контент и функции, Sheet не перекрывает focused control |
| 768×1024 | 4-column content, drawer/rail по доступному месту, portrait и landscape |
| 1024×768 | 8-column content, keyboard-first shell, нет обрезки при compact height |
| 1440×900 | 12-column Bento, max-width 1320, стабильный Sidebar |

Дополнительно обязательны 200% browser zoom, Windows scale 125/150/200%, text scale 130%, `prefers-reduced-motion`, light/dark/system/high-contrast и offline ИП. Ни один breakpoint не скрывает функцию без доступного альтернативного пути.

Accessibility gates:

- WCAG 2.2 AA: текст 4.5:1, large text/UI graphics 3:1;
- последовательные `h1 → h2`, один `h1` на route;
- skip link к main content;
- визуальный focus 3 px, logical Tab order, никаких positive `tabIndex`;
- target 44×44 и gap 8 px;
- icon-only controls имеют name; image имеет alt или `alt=""` для decorative;
- status дополняется icon/text, chart получает summary/table alternative;
- Dialog/Sheet, More menu и route focus проходят keyboard и screen-reader сценарий;
- zoom не отключается, viewport meta сохраняет user scaling.

## 10. Бюджеты производительности

Бюджеты измеряются на production build, одинаковой машине/сети и по route graph, а не суммой всех lazy chunks:

| Метрика | D1 gate |
|---|---:|
| Public `/` initial JS | ≤ 110 КБ gzip |
| `/app` до успешной авторизации | ≤ 160 КБ gzip |
| Dashboard increment после auth/cache | ≤ 100 КБ gzip |
| Admin Overview increment | ≤ 90 КБ gzip |
| IP `/` initial JS | ≤ 150 КБ gzip; сначала требуется route split от текущего монолитного entry |
| Motion impact на использующий route | ≤ 25 КБ gzip; 0 КБ на route без motion |
| Initial CSS любой поверхности | ≤ 45 КБ gzip |
| LCP p75 mobile | ≤ 2.5 с |
| INP p75 | ≤ 200 мс |
| CLS p75 | < 0.1 |
| Один main-thread task | < 50 мс; frame work при motion ≈ 16 мс |

Public entry не импортирует Auth Gate, общий Desktop renderer, Supabase workspace repositories, PDF/OCR/XLSX/Mammoth или Бикс assets. `/app` до auth не импортирует Dashboard. Dashboard не импортирует тяжёлые инструменты до явного действия. Изображения имеют width/height или aspect-ratio, AVIF/WebP fallback и lazy loading ниже первого экрана.

Bundle gate сравнивает новый `stats.json`/manifest с последней зелёной сборкой и падает при превышении, а не полагается на ручное чтение Vite warning.

## 11. Карта реализации по файлам

### Общая основа App/Web

| Действие | Файлы |
|---|---|
| Создать tokens/motion contract | `app/src/shared/design/tokens.css`, `app/src/shared/design/motion.ts` |
| Подключить темы без дублей | `app/src/renderer/styles/globals.css`, `web/src/index.css`, `app/src/renderer/lib/theme.ts` |
| Расширить primitives | `app/src/renderer/components/ui/Button.tsx`, `Card.tsx`, `FormField.tsx`, `ListPanel.tsx`, `DataTable.tsx` |
| Добавить layout/overlay/states | `BentoGrid.tsx`, `Dialog.tsx`, `Sheet.tsx`, `Skeleton.tsx`, `StatePanel.tsx`, `app/src/renderer/lib/ui/BxMotion.tsx` |
| Оболочка и route boundary | `app/src/renderer/App.tsx`, `components/layout/Sidebar.tsx`, `MobileNavigation.tsx`, `Topbar.tsx`, `Titlebar.tsx` |
| Dashboard slice | `app/src/renderer/pages/Dashboard.tsx` и его текущие `components/dashboard/*` |

### Web/Public/Admin

| Действие | Файлы |
|---|---|
| Сохранить route group isolation | `web/src/App.tsx`, `web/src/routes/PublicSite.tsx`, `WebWorkspace.tsx`, `AdminPortal.tsx` |
| Public slice | `web/src/pages/LandingV2.tsx`, `landing-v2.css`; старый `Landing.tsx` не удалять в D1 |
| Admin deep link/shell | `web/src/pages/admin/Dashboard.tsx`, `web/src/admin/admin.css`, `web/src/App.tsx` |
| Lazy/error parity | `web/src/components/ChunkLoadBoundary.tsx`, `RouteLoadingScreen.tsx`, `web/src/admin/AdminPanelBoundary.tsx` |

### ИП

| Действие | Файлы |
|---|---|
| Тема и alias tokens | `ip/src/index.css` |
| Route split | `ip/src/App.tsx` |
| Shell/Home slice | `ip/src/pages/app/Shell.tsx`, `ip/src/pages/app/Home.tsx` |
| Storage/PWA regression only | текущие storage helpers, `ip/public/sw.js`; поведение и cache name не менять |

Новый код не начинает работу до повторной проверки package/lock и наличия незакоммиченных пользовательских изменений в перечисленных файлах.

## 12. Acceptance tests

### Автоматические контракты

Точные тестовые точки:

- `app/src/shared/design/tokens.contract.test.ts`: обязательные tokens, отсутствие дублей, contrast pairs, parity тем.
- `app/src/shared/design/motion.test.ts`: duration/exit ratio, transform/opacity allowlist, reduced presets без движения.
- расширить `app/src/renderer/components/ui/uiPrimitives.test.tsx`: variants/states, label/error, `aria-sort`, Dialog/Sheet focus restoration.
- расширить `app/src/renderer/components/layout/Sidebar.test.tsx` и `MobileNavigation.test.tsx`: IA, five destinations, Escape/Back, focus и сохранение текущих storage keys.
- `app/src/renderer/pages/Dashboard.redesign.test.tsx`: один primary CTA, DOM priority, старый/новый вариант по flag, одинаковые data calls.
- расширить `web/src/routing.test.ts`: `/app` boundary, `/admin/*`, public fallback и отсутствие Workspace import до auth.
- `web/src/pages/admin/adminRouting.test.tsx`: role-aware default, deep link, forbidden panel до render.
- `web/src/pages/LandingV2.redesign.test.tsx`: один primary CTA, mobile menu Sheet, Public не импортирует heavy workspace modules.
- `ip/src/storage.contract.test.ts`: неизменность `ip_profile`, `ip_reminders`, `ip_calc_history`, `ip_hidden_presets` и PWA cache name.
- `ip/src/navigation.test.tsx`: route preservation, пять bottom destinations, names/targets.

Для Web и ИП сначала добавляется минимальный проверенный test/typecheck/lint harness; dependency diff и lock review являются отдельным gate. Тесты не добавляются «через» незапланированный framework upgrade.

### Visual/E2E matrix

Создать `tools/visual-regression/redesign-d1.spec.ts` и baseline только после ручного утверждения первого референсного screenshot. Для каждой поверхности проверяются 375, 390, 768, 1024, 1440; light/dark/high-contrast; normal/reduced motion. Маскированию подлежат только время и подтверждённые live values, не layout blocks.

Сценарии:

1. direct deep link → auth gate → исходный route;
2. keyboard skip link, sidebar/bottom nav, More Sheet, Back и focus restoration;
3. loading >300 мс, empty, recoverable error, chunk error/retry;
4. form invalid → error summary → first invalid field;
5. Dialog desktop и Sheet mobile с Escape/scrim/dirty state;
6. table sort и mobile card representation;
7. 200% zoom, landscape, no horizontal document scroll;
8. IP offline/reload/update без потери `ip_*` и без смешанного PWA shell;
9. feature flag off возвращает прежний UI без reload/migration side effect.

### Команды ворот

После реализации запускаются из соответствующих каталогов:

```bash
cd app
npm run lint
npm run typecheck
npm test
npm run build:web

cd ../web
npm run lint
npm run test
npm run typecheck
npm run build

cd ../ip
npm run lint
npm run test
npm run typecheck
npm run build
```

`test`/`typecheck`/`lint` для Web/IP добавляются как часть первого quality gate, если отсутствуют. Затем выполняются Playwright visual/E2E, bundle-budget check и `git diff --check`.

## 13. Поэтапное внедрение и rollback

1. **D1-A — contract, без визуального изменения.** Tokens, motion values, component tests; старые aliases продолжают работать.
2. **D1-B — preview.** Новый Dashboard/Public/Admin/IP Home доступен только локально и в CI screenshot harness; production flag fail-closed в старый UI.
3. **D1-C — internal canary.** Desktop и Web для команды/тестовых аккаунтов; затем Admin; затем ИП offline canary. Не объединять все поверхности в один canary.
4. **D1-D — 5%.** Одна поверхность за раз, минимум 48 часов без роста chunk errors, auth redirects, INP/CLS и support incidents.
5. **D1-E — 25%.** Минимум 72 часа; сравнение выполнения главного сценария и возвратов на старый UI.
6. **D1-F — 100%.** Только после отдельного sign-off Desktop/Web/Mobile/Public/Admin/IP. Старый вариант остаётся один стабильный выпуск.
7. **Cleanup.** Старые CSS/components удаляются отдельным diff после подтверждения телеметрии и rollback window; storage keys и data contracts не удаляются вместе с UI.

Rollout flag должен быть поверхностным (`desktop`, `workspace_web`, `public`, `admin`, `ip`) и детерминированным для пользователя. До утверждения серверного контракта он не создаётся миграцией: preview работает локально, production остаётся off. Flag failure, timeout или неизвестное значение выбирает старый UI.

Rollback — выключение surface flag. Он не требует database rollback, cache purge, downgrade данных или повторной авторизации. Auth Gate, entitlement, RPC и repository code находятся вне variant boundary.

## 14. Definition of Done D1

D1 завершён только если одновременно выполнено следующее:

- все шесть route/surface вариантов vertical slice прошли automated и visual matrix;
- маршруты/deep links, auth gates, storage keys, offline данные и права не изменены без отдельной миграции;
- общие tokens и Motion presets имеют один проверяемый источник, а raw component colors не увеличились;
- один primary CTA и корректный Bento priority подтверждены на каждом viewport;
- keyboard, screen reader, reduced motion, high contrast, 200% zoom и safe area приняты;
- initial/route bundle, LCP, INP и CLS находятся в бюджете;
- production rollout управляется отдельно по поверхности и имеет проверенный fail-closed rollback;
- старый UI не удалён до конца rollback window;
- изменения версии/changelog выполнены в том релизе, где появится продуктовый код, а не в рамках этой документации.
