# Graph Report - src  (2026-07-17)

## Corpus Check
- 225 files · ~313,514 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1274 nodes · 3018 edges · 65 communities (61 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ab613d2a`
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
- localDb.ts
- SmartCalendar.tsx
- Icon.tsx
- DateCalc.tsx
- useCompany
- Tools.tsx
- CurrencyHistory.tsx
- workbenchCatalog.ts
- uzHolidays.ts
- todayISO
- Planner.tsx
- BxEvent
- EventActivityTimeline.tsx
- plan.tsx
- DigestView.tsx
- onecCache.ts
- validation.ts
- FocusView.tsx
- pcClean.ts
- TxModal.tsx
- newsFeed.ts
- onecProcess.ts
- ImportModal.tsx
- InnCheckTool.tsx
- Transliterate.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- useWorkbenchFavorites.ts
- PdfCompress.tsx
- vite-env.d.ts
- PLAN_LIMITS

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 48 edges
2. `useCompany()` - 33 edges
3. `supabase` - 32 edges
4. `BxEvent` - 32 edges
5. `useToast()` - 31 edges
6. `usePlan()` - 29 edges
7. `registerIpcHandlers()` - 25 edges
8. `Templates()` - 16 edges
9. `EventStatus` - 16 edges
10. `Translator()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `CurrencyExportRow` --references--> `CurrencyRate`  [EXTRACTED]
  renderer/pages/Currency.tsx → shared/types.ts
- `CommandPalette()` --indirect_call--> `c()`  [INFERRED]
  renderer/components/CommandPalette.tsx → renderer/pages/planner/BoardKanban.tsx
- `WidgetBridge` --references--> `CurrencyRate`  [EXTRACTED]
  renderer/lib/widgetsApi.ts → shared/types.ts
- `listProcessesWindows()` --references--> `ONEC_PROCESS_NAMES`  [EXTRACTED]
  main/services/onecProcess.ts → shared/types.ts
- `LoginScreen()` --references--> `CHANGELOG`  [EXTRACTED]
  renderer/components/auth/LoginScreen.tsx → shared/version.ts

## Import Cycles
- None detected.

## Communities (65 total, 4 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.05
Nodes (58): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, root, rootElement (+50 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.05
Nodes (55): useEconomicIndicators(), ACCENT, Calc(), CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc() (+47 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.06
Nodes (52): CompanyProfileWizard(), CompanyWizardInitial, defaultRuleIds(), initialProfile(), Props, WEEKDAYS, CompanyTeamPanel(), INVITABLE_ROLES (+44 more)

### Community 3 - "useToast"
Cohesion: 0.05
Nodes (50): CompanyProvider(), check(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, ToastProvider() (+42 more)

### Community 4 - "Library.tsx"
Cohesion: 0.07
Nodes (49): KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext(), retrieveArticles() (+41 more)

### Community 5 - "App.tsx"
Cohesion: 0.06
Nodes (31): App(), AboutModal(), Props, LoginScreen(), Props, Cmd, CommandPalette(), COMMANDS (+23 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.11
Nodes (29): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META (+21 more)

### Community 8 - "ipc.ts"
Cohesion: 0.13
Nodes (28): registerIpcHandlers(), CbuItem, DEFAULT_CODES, fetchRateOnDate(), fetchRates(), FLAGS, parseCertificateText(), parsePfx() (+20 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.15
Nodes (23): indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode, ReferenceSection (+15 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.09
Nodes (12): Condition, describe(), fetchWeather(), WMO, Condition, fetchRatesDirect(), FLAGS, mapRate() (+4 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.21
Nodes (17): buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName(), modeName(), normalizeArchiveFileName(), translatedFileName(), TRANSLATION_LANGUAGES (+9 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.13
Nodes (19): EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS (+11 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 14 - "Documents.tsx"
Cohesion: 0.17
Nodes (16): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+8 more)

### Community 15 - "CalendarPage.tsx"
Cohesion: 0.18
Nodes (18): CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, emitPlannerReload(), subscribePlannerReload(), cacheKey() (+10 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.16
Nodes (17): ALL_CODES, buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, CurrencyExportRow, daysAgo() (+9 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.23
Nodes (14): BxTransaction, exportTransactionsToExcel(), baseTx, filterPayments(), paymentDayDiff(), paymentSummary(), paymentTiming(), PaymentView (+6 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.16
Nodes (18): Props, CalCard, PRI_COLOR, Props, TYPE_ICON, Props, fmtDate(), ListView() (+10 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.18
Nodes (15): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), TaxDeadline, taxDeadlines (+7 more)

### Community 21 - "Services.tsx"
Cohesion: 0.24
Nodes (15): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+7 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.16
Nodes (16): UZ_PRODUCTION_CALENDAR_2026_SOURCES, CalBoard, CalendarView(), formatCalendarDate(), formatFullDate(), formatShortDate(), formatWeekday(), mondayOf() (+8 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.21
Nodes (14): BxCounterparty, NewCounterparty, useCounterparties(), COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS (+6 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.19
Nodes (13): Topbar(), search(), SearchItem, buildTaskNotification(), BxNotification, ROW, formatDueDate(), GlobalNotificationRow (+5 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.22
Nodes (10): Button(), Props, styles, Variant, Props, formatBytes(), onecApi, CacheCleaner() (+2 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (9): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+1 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.18
Nodes (12): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, ReferenceView(), RefTabId (+4 more)

### Community 28 - "main.ts"
Cohesion: 0.21
Nodes (14): broadcastUpdateStatus(), checkForUpdatesAndDownload(), createTray(), createTrayWindow(), downloadAsset(), gotLock, isNewerVersion(), loadTrayState() (+6 more)

### Community 29 - "types.ts"
Cohesion: 0.23
Nodes (12): ParsedEcpInfo, TraderInfo, api, BxApi, BxBridge, IPC, BackupResult, CacheScanResult (+4 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.30
Nodes (13): detectAndRegisterConflict(), addToSyncQueue(), getSyncQueue(), isTransientError(), pushItem(), PushResult, removeFromSyncQueue(), saveSyncQueue() (+5 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 33 - "localDb.ts"
Cohesion: 0.25
Nodes (9): CompareFieldRowProps, ConflictModal(), ConflictModalProps, db, ExchangeRate, SyncConflict, getConflicts(), resolveConflict() (+1 more)

### Community 34 - "SmartCalendar.tsx"
Cohesion: 0.25
Nodes (10): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), getSpecialDay(), isNonWorkingSpecialDay() (+2 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.15
Nodes (5): DocumentWorkspace, STEPS, TranslatorTutorial(), IconName, PATHS

### Community 36 - "DateCalc.tsx"
Cohesion: 0.24
Nodes (12): holidayName(), isWorkday(), UZ_HOLIDAYS, workdayStats(), addCalendarDays(), addWorkdays(), DateCalc(), diffDays() (+4 more)

### Community 37 - "useCompany"
Cohesion: 0.22
Nodes (9): CompanySwitcher(), OnboardingWizard(), Step, STEPS, PRO_PERKS, useCompany(), usePlan(), Documents() (+1 more)

### Community 38 - "Tools.tsx"
Cohesion: 0.18
Nodes (9): ACCENT, FULL_HEIGHT_TOOLS, GROUPS, LANGUAGES, PdfConvert(), PROPOSAL_TOOLS, READY_TOOLS, Tool (+1 more)

### Community 39 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 40 - "workbenchCatalog.ts"
Cohesion: 0.27
Nodes (9): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchProposal, WorkbenchSector (+1 more)

### Community 41 - "uzHolidays.ts"
Cohesion: 0.21
Nodes (10): DayType, getMonthNorms(), MONTH_NORMS_2026, MonthNorms, SPECIAL_DAYS_2026, SpecialDay, _specialDayMap, specialDaysForMonth() (+2 more)

### Community 42 - "todayISO"
Cohesion: 0.35
Nodes (9): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE (+1 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.33
Nodes (10): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+2 more)

### Community 44 - "BxEvent"
Cohesion: 0.29
Nodes (9): Props, Props, COLUMNS, groupEventsByStatus(), PRIORITY_BORDER, Props, SystemTaskBoard(), CompanyMember (+1 more)

### Community 45 - "EventActivityTimeline.tsx"
Cohesion: 0.29
Nodes (9): describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), EventActivity, EventActivityType (+1 more)

### Community 46 - "plan.tsx"
Cohesion: 0.27
Nodes (9): Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan, PlanCtx, PlanLimits, PlanProvider() (+1 more)

### Community 47 - "DigestView.tsx"
Cohesion: 0.24
Nodes (6): DigestView(), dueChip(), EcpKey, fmtSum(), UnifiedDigestItem, UnpaidTx

### Community 48 - "onecCache.ts"
Cohesion: 0.44
Nodes (8): cleanCache(), copyFolderRecursive(), dirSize(), getCacheRoots(), getV8iPath(), parseV8i(), scanCache(), CacheEntry

### Community 49 - "validation.ts"
Cohesion: 0.47
Nodes (6): BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), BankCheck()

### Community 50 - "FocusView.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 51 - "pcClean.ts"
Cohesion: 0.39
Nodes (7): cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp(), TempDirInfo

### Community 52 - "TxModal.tsx"
Cohesion: 0.32
Nodes (7): useExchangeRates(), EXPENSE_CATS, INCOME_CATS, Props, today, TxModal(), NewTransaction

### Community 53 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 54 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 55 - "ImportModal.tsx"
Cohesion: 0.43
Nodes (5): parseBankStatement(), ParsedTransaction, fmt(), ImportModal(), ImportModalProps

### Community 56 - "InnCheckTool.tsx"
Cohesion: 0.33
Nodes (6): fetch(), CheckResult, DEMO_RESULTS, InnCheckTool(), State, statusLabel()

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "useWorkbenchFavorites.ts"
Cohesion: 0.70
Nodes (4): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites()

## Knowledge Gaps
- **292 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+287 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `CompanyContext.tsx` to `Settings.tsx`, `localDb.ts`, `useToast`, `Library.tsx`, `App.tsx`, `referenceRepo.ts`, `Planner.tsx`, `useEvents.ts`, `EventActivityTimeline.tsx`, `plan.tsx`, `Documents.tsx`, `CalendarPage.tsx`, `Finance.tsx`, `Translator.tsx`, `TrayView.tsx`, `Services.tsx`, `Topbar.tsx`, `syncQueue.ts`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `todayISO` to `Settings.tsx`, `Calc.tsx`, `CompanyContext.tsx`, `Library.tsx`, `Templates.tsx`, `referenceRepo.ts`, `useEvents.ts`, `TrayView.tsx`, `Currency.tsx`, `Finance.tsx`, `TaxCalculator.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`, `EcpManager.tsx`, `localDb.ts`, `DateCalc.tsx`, `Planner.tsx`, `BxEvent`, `DigestView.tsx`, `FocusView.tsx`, `TxModal.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `Settings.tsx`, `Calc.tsx`, `CompanyContext.tsx`, `Library.tsx`, `useCompany`, `Templates.tsx`, `Planner.tsx`, `Translator.tsx`, `Documents.tsx`, `Finance.tsx`, `Counterparties.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _292 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05328005328005328 - nodes in this community are weakly interconnected._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.052982456140350874 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06233538191395961 - nodes in this community are weakly interconnected._