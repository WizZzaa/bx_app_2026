# Graph Report - src  (2026-07-17)

## Corpus Check
- 233 files · ~316,628 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1303 nodes · 3081 edges · 64 communities (61 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6ee9f7c4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Settings.tsx
- Calc.tsx
- CompanyContext.tsx
- useToast
- Library.tsx
- App.tsx
- onecApi.ts
- Templates.tsx
- ipc.ts
- referenceRepo.ts
- widgetsApi.ts
- Translator.tsx
- useEvents.ts
- TrayView.tsx
- Documents.tsx
- CalendarPage.tsx
- Currency.tsx
- Finance.tsx
- ListView.tsx
- numToWords.ts
- TaxCalculator.tsx
- Services.tsx
- CalendarView.tsx
- Counterparties.tsx
- Topbar.tsx
- CacheCleaner.tsx
- Dashboard.tsx
- ReferenceView.tsx
- main.ts
- types.ts
- horoscope.ts
- syncQueue.ts
- EcpManager.tsx
- useCompany
- SmartCalendar.tsx
- Icon.tsx
- App.tsx
- MoneyInput.tsx
- Tools.tsx
- CurrencyHistory.tsx
- workbenchCatalog.ts
- InpsCalc.tsx
- todayISO
- Planner.tsx
- BxEvent
- EventActivityTimeline.tsx
- RecyclingCalc.tsx
- DigestView.tsx
- onecCache.ts
- pcClean.ts
- FocusView.tsx
- pcClean.ts
- newsFeed.ts
- WidgetBoundary
- onecProcess.ts
- uiScale.ts
- Transliterate.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- vite-env.d.ts
- PLAN_LIMITS
- NotificationsWidget.tsx
- weather.ts

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 48 edges
2. `useCompany()` - 33 edges
3. `supabase` - 32 edges
4. `BxEvent` - 32 edges
5. `useToast()` - 31 edges
6. `usePlan()` - 29 edges
7. `registerIpcHandlers()` - 25 edges
8. `Translator()` - 16 edges
9. `Templates()` - 16 edges
10. `EventStatus` - 16 edges

## Surprising Connections (you probably didn't know these)
- `CurrencyExportRow` --references--> `CurrencyRate`  [EXTRACTED]
  renderer/pages/Currency.tsx → shared/types.ts
- `Translator()` --calls--> `useCompany()`  [EXTRACTED]
  src/renderer/pages/Translator.tsx → renderer/lib/CompanyContext.tsx
- `Translator()` --calls--> `usePlan()`  [EXTRACTED]
  src/renderer/pages/Translator.tsx → renderer/lib/plan.tsx
- `Translator()` --calls--> `useToast()`  [EXTRACTED]
  src/renderer/pages/Translator.tsx → renderer/lib/ui/ToastContext.tsx
- `Translator()` --calls--> `useDocuments()`  [EXTRACTED]
  src/renderer/pages/Translator.tsx → renderer/lib/useDocuments.ts

## Import Cycles
- None detected.

## Communities (64 total, 3 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.20
Nodes (15): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, FontScale (+7 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.14
Nodes (17): ACCENT, CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row() (+9 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.11
Nodes (30): CompanyProfileWizard(), CompanyWizardInitial, defaultRuleIds(), initialProfile(), Props, WEEKDAYS, CompanyCtx, Ctx (+22 more)

### Community 3 - "useToast"
Cohesion: 0.07
Nodes (33): CompanyProvider(), check(), fetch(), STYLE, Toast, ToastApi, ToastCtx, ToastKind (+25 more)

### Community 4 - "Library.tsx"
Cohesion: 0.15
Nodes (29): KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, getAllArticlesSync(), mergeArticles() (+21 more)

### Community 5 - "App.tsx"
Cohesion: 0.13
Nodes (15): App(), AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection (+7 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.07
Nodes (46): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, capitalize(), RU_HUND, RU_ONES_F (+38 more)

### Community 8 - "ipc.ts"
Cohesion: 0.13
Nodes (28): registerIpcHandlers(), CbuItem, DEFAULT_CODES, fetchRateOnDate(), fetchRates(), FLAGS, parseCertificateText(), parsePfx() (+20 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.09
Nodes (34): getNewsItem(), LEGISLATION_NEWS, NewsItem, indicators, paymentCodes, taxes, DataMeta, Indicator (+26 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.12
Nodes (6): Condition, fetchRatesDirect(), FLAGS, mapRate(), widgetsApi, WMO

### Community 11 - "Translator.tsx"
Cohesion: 0.12
Nodes (21): TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName() (+13 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.11
Nodes (20): event, EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today (+12 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.20
Nodes (11): ChatMsg, Deadline, DRAG, fmtDay(), NODRAG, noticeStyle, openApp(), QUICK (+3 more)

### Community 14 - "Documents.tsx"
Cohesion: 0.23
Nodes (12): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSidebar(), ResourceSidebarProps, BxUserDocument (+4 more)

### Community 15 - "CalendarPage.tsx"
Cohesion: 0.13
Nodes (13): ErrorBoundary, Props, State, root, rootElement, detectPlatform(), installGlobalErrorReporting(), reportError() (+5 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.16
Nodes (17): ALL_CODES, buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, CurrencyExportRow, daysAgo() (+9 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.16
Nodes (19): parseBankStatement(), ParsedTransaction, BxTransaction, exportTransactionsToExcel(), baseTx, filterPayments(), paymentDayDiff(), paymentSummary() (+11 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.12
Nodes (27): Props, CalCard, Props, PRI_COLOR, Props, TYPE_ICON, Props, Props (+19 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.11
Nodes (27): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+19 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.14
Nodes (21): BxCounterparty, NewCounterparty, useCounterparties(), COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS (+13 more)

### Community 21 - "Services.tsx"
Cohesion: 0.22
Nodes (16): ResourceSectionTitle(), BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections() (+8 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.22
Nodes (16): PinScreen(), Props, AttemptsData, getAttemptsData(), getAttemptsLeft(), isLocked(), LockStatus, pureDjb2() (+8 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.35
Nodes (9): AuthGate(), clearPin(), hasPin(), isPinEnabled(), setPinEnabled(), useAuth(), getIdleTimeout(), IdleTimeout (+1 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.07
Nodes (46): CompareFieldRowProps, ConflictModal(), ConflictModalProps, Topbar(), buildLocalDataContext(), retrieveArticles(), RetrievedArticle, stem() (+38 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.20
Nodes (11): Button(), Props, styles, Variant, Props, formatBytes(), onecApi, CacheCleaner() (+3 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.24
Nodes (7): Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility, TONES, useEvents()

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.20
Nodes (11): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, RefTabId, tabs (+3 more)

### Community 28 - "main.ts"
Cohesion: 0.21
Nodes (14): broadcastUpdateStatus(), checkForUpdatesAndDownload(), createTray(), createTrayWindow(), downloadAsset(), gotLock, isNewerVersion(), loadTrayState() (+6 more)

### Community 29 - "types.ts"
Cohesion: 0.07
Nodes (44): uid(), Props, AddCardPayload, BoardKanban(), COLOR_MAP, fmtDate(), isOverdue(), PRIORITY_BAR (+36 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 33 - "useCompany"
Cohesion: 0.13
Nodes (13): CompanySwitcher(), OnboardingWizard(), Step, STEPS, PRO_PERKS, useCompany(), usePlan(), Ai() (+5 more)

### Community 34 - "SmartCalendar.tsx"
Cohesion: 0.05
Nodes (63): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), MONTHS, Props, TaxCalendar() (+55 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.14
Nodes (7): Cmd, CommandPalette(), COMMANDS, DocumentWorkspace, STEPS, IconName, PATHS

### Community 36 - "App.tsx"
Cohesion: 0.14
Nodes (11): Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan, PlanCtx, PlanLimits, PlanProvider() (+3 more)

### Community 37 - "MoneyInput.tsx"
Cohesion: 0.19
Nodes (12): useEconomicIndicators(), DividendCalc(), fmt(), TREATIES, TREATY_LABELS, format(), MoneyInput(), Props (+4 more)

### Community 38 - "Tools.tsx"
Cohesion: 0.13
Nodes (16): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites(), Calc(), ACCENT, FULL_HEIGHT_TOOLS, GROUPS (+8 more)

### Community 39 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 40 - "workbenchCatalog.ts"
Cohesion: 0.27
Nodes (9): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchProposal, WorkbenchSector (+1 more)

### Community 41 - "InpsCalc.tsx"
Cohesion: 0.25
Nodes (8): fmt(), InpsCalc(), fmt(), SalaryCalc(), calcPayroll(), DEFAULT_RATES, PayrollRates, PayrollResult

### Community 42 - "todayISO"
Cohesion: 0.24
Nodes (14): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE (+6 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.33
Nodes (10): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+2 more)

### Community 44 - "BxEvent"
Cohesion: 0.29
Nodes (9): CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES, fmt() (+1 more)

### Community 45 - "EventActivityTimeline.tsx"
Cohesion: 0.27
Nodes (7): Props, statusMeta, TaskPanel(), TaskRow, tasksRepo, TaskPriority, TaskStatus

### Community 46 - "RecyclingCalc.tsx"
Cohesion: 0.25
Nodes (8): AGE_COEFFS, COMMERCIAL_ENGINES, EngineGroup, fmt(), MOTO_ENGINES, PASSENGER_ENGINES, RecyclingCalc(), VehicleCategory

### Community 47 - "DigestView.tsx"
Cohesion: 0.24
Nodes (6): DigestView(), dueChip(), EcpKey, fmtSum(), UnifiedDigestItem, UnpaidTx

### Community 48 - "onecCache.ts"
Cohesion: 0.44
Nodes (8): cleanCache(), copyFolderRecursive(), dirSize(), getCacheRoots(), getV8iPath(), parseV8i(), scanCache(), CacheEntry

### Community 49 - "pcClean.ts"
Cohesion: 0.39
Nodes (7): cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp(), TempDirInfo

### Community 50 - "FocusView.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 51 - "pcClean.ts"
Cohesion: 0.20
Nodes (14): ParsedEcpInfo, TraderInfo, api, BxApi, BxBridge, WidgetBridge, IPC, BackupResult (+6 more)

### Community 52 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 53 - "WidgetBoundary"
Cohesion: 0.29
Nodes (3): Props, State, WidgetBoundary

### Community 54 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 55 - "uiScale.ts"
Cohesion: 0.71
Nodes (5): applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, normalizeFontScale(), saveFontScale()

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 66 - "NotificationsWidget.tsx"
Cohesion: 0.31
Nodes (8): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel

### Community 70 - "weather.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

## Knowledge Gaps
- **297 isolated node(s):** `TranslatorWorkspaceSwitchProps`, `DOCUMENT_CATEGORIES`, `ChangelogEntry`, `gotLock`, `TrayState` (+292 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `Topbar.tsx` to `Settings.tsx`, `CompanyContext.tsx`, `Library.tsx`, `App.tsx`, `referenceRepo.ts`, `Planner.tsx`, `useEvents.ts`, `EventActivityTimeline.tsx`, `Documents.tsx`, `CalendarPage.tsx`, `Translator.tsx`, `Finance.tsx`, `TrayView.tsx`, `numToWords.ts`, `Services.tsx`, `types.ts`, `syncQueue.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `todayISO` to `Settings.tsx`, `CompanyContext.tsx`, `Templates.tsx`, `referenceRepo.ts`, `useEvents.ts`, `TrayView.tsx`, `Currency.tsx`, `Finance.tsx`, `ListView.tsx`, `TaxCalculator.tsx`, `Topbar.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`, `types.ts`, `EcpManager.tsx`, `SmartCalendar.tsx`, `MoneyInput.tsx`, `Planner.tsx`, `DigestView.tsx`, `FocusView.tsx`, `NotificationsWidget.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `Settings.tsx`, `Calc.tsx`, `CompanyContext.tsx`, `Library.tsx`, `Tools.tsx`, `Templates.tsx`, `Planner.tsx`, `Translator.tsx`, `Finance.tsx`, `numToWords.ts`, `TaxCalculator.tsx`, `types.ts`, `syncQueue.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `TranslatorWorkspaceSwitchProps`, `DOCUMENT_CATEGORIES`, `ChangelogEntry` to the rest of the system?**
  _297 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10952380952380952 - nodes in this community are weakly interconnected._
- **Should `useToast` be split into smaller, more focused modules?**
  _Cohesion score 0.07198228128460686 - nodes in this community are weakly interconnected._