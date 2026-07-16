# Graph Report - src  (2026-07-17)

## Corpus Check
- 237 files · ~318,544 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1323 nodes · 3126 edges · 63 communities (60 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f2b01623`
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
- Tools.tsx
- CurrencyHistory.tsx
- workbenchCatalog.ts
- InpsCalc.tsx
- todayISO
- Planner.tsx
- BxEvent
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
- Sidebar.tsx
- Transliterate.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- currency.ts
- ecpParser.ts
- vite-env.d.ts
- PLAN_LIMITS
- News.tsx

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 48 edges
2. `useCompany()` - 33 edges
3. `supabase` - 32 edges
4. `BxEvent` - 32 edges
5. `useToast()` - 31 edges
6. `usePlan()` - 29 edges
7. `registerIpcHandlers()` - 25 edges
8. `Templates()` - 17 edges
9. `Translator()` - 16 edges
10. `EventStatus` - 16 edges

## Surprising Connections (you probably didn't know these)
- `CurrencyExportRow` --references--> `CurrencyRate`  [EXTRACTED]
  renderer/pages/Currency.tsx → shared/types.ts
- `Calc()` --calls--> `useToast()`  [EXTRACTED]
  src/renderer/pages/Calc.tsx → renderer/lib/ui/ToastContext.tsx
- `Calc()` --calls--> `useWorkbenchFavorites()`  [EXTRACTED]
  src/renderer/pages/Calc.tsx → renderer/lib/useWorkbenchFavorites.ts
- `CommandPalette()` --indirect_call--> `c()`  [INFERRED]
  renderer/components/CommandPalette.tsx → renderer/pages/planner/BoardKanban.tsx
- `Calc()` --calls--> `peekCalcPrefill()`  [EXTRACTED]
  src/renderer/pages/Calc.tsx → renderer/pages/calc/prefill.ts

## Import Cycles
- None detected.

## Communities (63 total, 3 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.17
Nodes (11): CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row(), DividendCalc() (+3 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.17
Nodes (17): CompanyWizardInitial, Props, WEEKDAYS, CompanyCtx, Ctx, companiesRepo, CalendarEvent, Company (+9 more)

### Community 3 - "useToast"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 4 - "Library.tsx"
Cohesion: 0.08
Nodes (43): PRO_PERKS, KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext() (+35 more)

### Community 5 - "App.tsx"
Cohesion: 0.24
Nodes (15): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+7 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.11
Nodes (30): ResourceEmpty(), DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, CP_PREFIXES, DOCUMENT_KEYS (+22 more)

### Community 8 - "ipc.ts"
Cohesion: 0.13
Nodes (28): registerIpcHandlers(), CbuItem, DEFAULT_CODES, fetchRateOnDate(), fetchRates(), FLAGS, parseCertificateText(), parsePfx() (+20 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.15
Nodes (23): indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode, ReferenceSection (+15 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.11
Nodes (9): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyRate (+1 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.12
Nodes (21): TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName() (+13 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.17
Nodes (14): PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS, subscribePlannerReload() (+6 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 14 - "Documents.tsx"
Cohesion: 0.33
Nodes (8): ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSidebar(), ResourceSidebarProps, RefTabId, tabs

### Community 15 - "CalendarPage.tsx"
Cohesion: 0.05
Nodes (59): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, root, rootElement (+51 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.16
Nodes (17): ALL_CODES, buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, CurrencyExportRow, daysAgo() (+9 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.12
Nodes (26): parseBankStatement(), ParsedTransaction, BxTransaction, exportTransactionsToExcel(), baseTx, filterPayments(), paymentDayDiff(), paymentSummary() (+18 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.15
Nodes (19): Props, CalCard, PRI_COLOR, Props, TYPE_ICON, Props, fmtDate(), ListView() (+11 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.05
Nodes (58): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, CompanyProvider(), canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS (+50 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.24
Nodes (6): DigestView(), dueChip(), EcpKey, fmtSum(), UnifiedDigestItem, UnpaidTx

### Community 22 - "CalendarView.tsx"
Cohesion: 0.24
Nodes (13): CompanyProfileWizard(), defaultRuleIds(), initialProfile(), addDaysISO(), buildTaxDeadlineEvents(), buildTaxDeadlineRuleOptions(), CompanyRegime, CompanyTaxProfile (+5 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.05
Nodes (40): App(), AboutModal(), Props, LoginScreen(), Props, Cmd, CommandPalette(), COMMANDS (+32 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.21
Nodes (17): db, ExchangeRate, supabase, detectAndRegisterConflict(), addToSyncQueue(), getSyncQueue(), isTransientError(), pushItem() (+9 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.17
Nodes (17): Button(), Props, styles, Variant, Props, BxBridge, formatBytes(), onecApi (+9 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (9): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+1 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.23
Nodes (9): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, GovTab(), LawTab() (+1 more)

### Community 28 - "main.ts"
Cohesion: 0.21
Nodes (14): broadcastUpdateStatus(), checkForUpdatesAndDownload(), createTray(), createTrayWindow(), downloadAsset(), gotLock, isNewerVersion(), loadTrayState() (+6 more)

### Community 29 - "types.ts"
Cohesion: 0.06
Nodes (51): uid(), Props, AddCardPayload, BoardKanban(), c(), COLOR_MAP, fmtDate(), isOverdue() (+43 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.13
Nodes (18): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+10 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 33 - "useCompany"
Cohesion: 0.18
Nodes (10): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps, useDocumentViewMode(), ResourceSectionTitle(), BxUserDocument, useDocuments(), CATEGORIES (+2 more)

### Community 34 - "SmartCalendar.tsx"
Cohesion: 0.06
Nodes (56): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+48 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.20
Nodes (4): DocumentWorkspace, STEPS, IconName, PATHS

### Community 36 - "App.tsx"
Cohesion: 0.40
Nodes (5): OnboardingWizard(), Step, STEPS, usePlan(), ReferenceView()

### Community 38 - "Tools.tsx"
Cohesion: 0.13
Nodes (15): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites(), ACCENT, FULL_HEIGHT_TOOLS, GROUPS, LANGUAGES (+7 more)

### Community 39 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 40 - "workbenchCatalog.ts"
Cohesion: 0.27
Nodes (9): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchProposal, WorkbenchSector (+1 more)

### Community 41 - "InpsCalc.tsx"
Cohesion: 0.15
Nodes (15): fmt(), InpsCalc(), format(), MoneyInput(), Props, fmt(), PenaltyCalc(), fmt() (+7 more)

### Community 42 - "todayISO"
Cohesion: 0.40
Nodes (8): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE

### Community 43 - "Planner.tsx"
Cohesion: 0.31
Nodes (10): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+2 more)

### Community 44 - "BxEvent"
Cohesion: 0.21
Nodes (12): FALLBACK_VALUES, useEconomicIndicators(), fmt(), NdflCalc(), CalcPrefill, takeCalcPrefill(), toMoneyString(), fmt() (+4 more)

### Community 46 - "RecyclingCalc.tsx"
Cohesion: 0.25
Nodes (8): AGE_COEFFS, COMMERCIAL_ENGINES, EngineGroup, fmt(), MOTO_ENGINES, PASSENGER_ENGINES, RecyclingCalc(), VehicleCategory

### Community 47 - "DigestView.tsx"
Cohesion: 0.21
Nodes (12): Topbar(), search(), buildTaskNotification(), BxNotification, ROW, formatDueDate(), GlobalNotificationRow, NotificationSource (+4 more)

### Community 48 - "onecCache.ts"
Cohesion: 0.44
Nodes (8): cleanCache(), copyFolderRecursive(), dirSize(), getCacheRoots(), getV8iPath(), parseV8i(), scanCache(), CacheEntry

### Community 49 - "pcClean.ts"
Cohesion: 0.19
Nodes (12): ParsedEcpInfo, TraderInfo, cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp() (+4 more)

### Community 50 - "FocusView.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 51 - "pcClean.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 52 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 53 - "WidgetBoundary"
Cohesion: 0.19
Nodes (14): Props, Props, EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props, COLUMNS (+6 more)

### Community 54 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 55 - "uiScale.ts"
Cohesion: 0.29
Nodes (9): describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), EventActivity, EventActivityType (+1 more)

### Community 56 - "Sidebar.tsx"
Cohesion: 0.27
Nodes (7): Props, statusMeta, TaskPanel(), TaskRow, tasksRepo, TaskPriority, TaskStatus

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "currency.ts"
Cohesion: 0.27
Nodes (9): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), TaxDeadline, taxDeadlines (+1 more)

### Community 61 - "ecpParser.ts"
Cohesion: 0.33
Nodes (8): CompanySwitcher(), useCompany(), fmtNum(), periodLabel(), RegimeId, REGIMES, TaxCalculator(), TaxRow()

### Community 67 - "News.tsx"
Cohesion: 0.32
Nodes (6): CompareFieldRowProps, ConflictModal(), ConflictModalProps, SyncConflict, getConflicts(), resolveConflict()

## Knowledge Gaps
- **301 isolated node(s):** `WorkbenchModeSwitchProps`, `WorkbenchActionsProps`, `WorkbenchCanvasProps`, `Tab`, `READY_TABS` (+296 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `todayISO()` connect `todayISO` to `CompanyContext.tsx`, `Templates.tsx`, `useEvents.ts`, `TrayView.tsx`, `CalendarPage.tsx`, `Currency.tsx`, `Finance.tsx`, `TaxCalculator.tsx`, `CalendarView.tsx`, `Topbar.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`, `types.ts`, `EcpManager.tsx`, `SmartCalendar.tsx`, `Planner.tsx`, `BxEvent`, `FocusView.tsx`, `WidgetBoundary`, `ecpParser.ts`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `supabase` connect `Topbar.tsx` to `CompanyContext.tsx`, `useToast`, `Library.tsx`, `App.tsx`, `referenceRepo.ts`, `Translator.tsx`, `useEvents.ts`, `TrayView.tsx`, `CalendarPage.tsx`, `Finance.tsx`, `numToWords.ts`, `CalendarView.tsx`, `Counterparties.tsx`, `types.ts`, `useCompany`, `Planner.tsx`, `DigestView.tsx`, `uiScale.ts`, `Sidebar.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `useToast()` connect `numToWords.ts` to `CompanyContext.tsx`, `useToast`, `Library.tsx`, `Templates.tsx`, `Planner.tsx`, `Translator.tsx`, `CalendarPage.tsx`, `Finance.tsx`, `types.ts`, `syncQueue.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `WorkbenchModeSwitchProps`, `WorkbenchActionsProps`, `WorkbenchCanvasProps` to the rest of the system?**
  _301 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08020050125313283 - nodes in this community are weakly interconnected._
- **Should `onecApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._