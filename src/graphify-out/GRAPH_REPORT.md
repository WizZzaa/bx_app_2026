# Graph Report - src  (2026-07-17)

## Corpus Check
- 235 files · ~317,345 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1311 nodes · 3098 edges · 69 communities (65 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `13dc7310`
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
- Sidebar.tsx
- Transliterate.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- currency.ts
- ecpParser.ts
- vite-env.d.ts
- PLAN_LIMITS
- DividendCalc.tsx
- NotificationsWidget.tsx
- News.tsx
- weather.ts

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
- `CommandPalette()` --indirect_call--> `c()`  [INFERRED]
  renderer/components/CommandPalette.tsx → renderer/pages/planner/BoardKanban.tsx
- `WidgetBridge` --references--> `WeatherData`  [EXTRACTED]
  renderer/lib/widgetsApi.ts → shared/types.ts
- `CurrencyExportRow` --references--> `CurrencyRate`  [EXTRACTED]
  renderer/pages/Currency.tsx → shared/types.ts
- `listProcessesWindows()` --references--> `ONEC_PROCESS_NAMES`  [EXTRACTED]
  main/services/onecProcess.ts → shared/types.ts
- `OnboardingWizard()` --calls--> `usePlan()`  [EXTRACTED]
  renderer/components/OnboardingWizard.tsx → renderer/lib/plan.tsx

## Import Cycles
- None detected.

## Communities (69 total, 4 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.27
Nodes (7): CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row()

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.17
Nodes (17): CompanyWizardInitial, Props, WEEKDAYS, CompanyCtx, Ctx, companiesRepo, CalendarEvent, Company (+9 more)

### Community 3 - "useToast"
Cohesion: 0.07
Nodes (37): CompanyProvider(), check(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, useToast() (+29 more)

### Community 4 - "Library.tsx"
Cohesion: 0.09
Nodes (42): KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext(), retrieveArticles() (+34 more)

### Community 5 - "App.tsx"
Cohesion: 0.31
Nodes (6): AboutModal(), Props, LoginScreen(), Props, CHANGELOG, ChangelogEntry

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.11
Nodes (29): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META (+21 more)

### Community 8 - "ipc.ts"
Cohesion: 0.23
Nodes (12): fetchTrader(), TraderInfo, backupDatabase(), pickBackupDir(), pickDatabaseFile(), timestamp(), BackupScheduleConfig, getConfigPath() (+4 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.08
Nodes (39): Topbar(), indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode (+31 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.11
Nodes (9): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyExportRow (+1 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.12
Nodes (21): TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName() (+13 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.15
Nodes (14): event, EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today (+6 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 14 - "Documents.tsx"
Cohesion: 0.36
Nodes (8): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps

### Community 15 - "CalendarPage.tsx"
Cohesion: 0.05
Nodes (58): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, root, rootElement (+50 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.17
Nodes (16): ALL_CODES, buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo(), downloadCsv() (+8 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.15
Nodes (20): parseBankStatement(), ParsedTransaction, BxTransaction, exportTransactionsToExcel(), filterPayments(), paymentDayDiff(), paymentSummary(), paymentTiming() (+12 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.15
Nodes (24): Props, CalCard, Props, PRI_COLOR, Props, TYPE_ICON, Props, Props (+16 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.11
Nodes (27): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+19 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.14
Nodes (20): BxCounterparty, NewCounterparty, useCounterparties(), baseTx, COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth() (+12 more)

### Community 21 - "Services.tsx"
Cohesion: 0.23
Nodes (12): fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), BankCheck(), CheckResult (+4 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.24
Nodes (13): CompanyProfileWizard(), defaultRuleIds(), initialProfile(), addDaysISO(), buildTaxDeadlineEvents(), buildTaxDeadlineRuleOptions(), CompanyRegime, CompanyTaxProfile (+5 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.30
Nodes (8): getNewsItem(), LEGISLATION_NEWS, NewsItem, buildAiPrompt(), buildTaskNote(), formatDate(), NewsDetail(), openExternal()

### Community 24 - "Topbar.tsx"
Cohesion: 0.06
Nodes (46): CompareFieldRowProps, ConflictModal(), ConflictModalProps, Props, statusMeta, TaskPanel(), BUNDLED_SECTION_IDS, SECTIONS (+38 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.22
Nodes (10): Button(), Props, styles, Variant, Props, formatBytes(), onecApi, CacheCleaner() (+2 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (9): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+1 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.12
Nodes (15): PRO_PERKS, dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, IconName (+7 more)

### Community 28 - "main.ts"
Cohesion: 0.21
Nodes (14): broadcastUpdateStatus(), checkForUpdatesAndDownload(), createTray(), createTrayWindow(), downloadAsset(), gotLock, isNewerVersion(), loadTrayState() (+6 more)

### Community 29 - "types.ts"
Cohesion: 0.07
Nodes (46): uid(), Props, AddCardPayload, BoardKanban(), c(), COLOR_MAP, fmtDate(), isOverdue() (+38 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.21
Nodes (12): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites(), ACCENT, Calc(), GROUPS, peekCalcPrefill() (+4 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 33 - "useCompany"
Cohesion: 0.18
Nodes (12): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps, useDocumentViewMode(), CompanySwitcher(), useCompany(), usePlan(), BxUserDocument (+4 more)

### Community 34 - "SmartCalendar.tsx"
Cohesion: 0.05
Nodes (63): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), MONTHS, Props, TaxCalendar() (+55 more)

### Community 36 - "App.tsx"
Cohesion: 0.18
Nodes (12): OnboardingWizard(), Step, STEPS, Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan (+4 more)

### Community 37 - "MoneyInput.tsx"
Cohesion: 0.24
Nodes (9): format(), MoneyInput(), Props, fmt(), PenaltyCalc(), fmt(), RegimeCompareCalc(), fmt() (+1 more)

### Community 38 - "Tools.tsx"
Cohesion: 0.15
Nodes (11): ACCENT, FULL_HEIGHT_TOOLS, GROUPS, LANGUAGES, base64ToArrayBuffer(), PdfCompress(), PdfConvert(), PROPOSAL_TOOLS (+3 more)

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
Cohesion: 0.22
Nodes (15): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE (+7 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.33
Nodes (10): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+2 more)

### Community 44 - "BxEvent"
Cohesion: 0.32
Nodes (8): CalcPrefill, takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES, fmt(), VacationCalc()

### Community 45 - "EventActivityTimeline.tsx"
Cohesion: 0.22
Nodes (6): App(), applyTheme(), BxTheme, currentTheme(), Placeholder(), Props

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
Cohesion: 0.33
Nodes (8): checkRunningBrowsers(), cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp(), TempDirInfo

### Community 50 - "FocusView.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 51 - "pcClean.ts"
Cohesion: 0.36
Nodes (9): api, BxApi, BxBridge, BackupResult, CacheScanResult, CleanResult, KillResult, ProcessEntry (+1 more)

### Community 52 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 53 - "WidgetBoundary"
Cohesion: 0.21
Nodes (9): EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props, COLUMNS, groupEventsByStatus(), PRIORITY_BORDER (+1 more)

### Community 54 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 55 - "uiScale.ts"
Cohesion: 0.31
Nodes (9): registerIpcHandlers(), cleanup(), parseCertInfo(), pickFileToSign(), pickSigFile(), signFile(), SignResult, VerifyResult (+1 more)

### Community 56 - "Sidebar.tsx"
Cohesion: 0.32
Nodes (5): initialCollapsed(), MenuItem, MenuSection, navItemClass(), Sidebar()

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "currency.ts"
Cohesion: 0.33
Nodes (5): CbuItem, DEFAULT_CODES, fetchRateOnDate(), fetchRates(), FLAGS

### Community 61 - "ecpParser.ts"
Cohesion: 0.50
Nodes (4): parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile()

### Community 65 - "DividendCalc.tsx"
Cohesion: 0.50
Nodes (4): DividendCalc(), fmt(), TREATIES, TREATY_LABELS

### Community 66 - "NotificationsWidget.tsx"
Cohesion: 0.50
Nodes (3): Cmd, CommandPalette(), COMMANDS

### Community 67 - "News.tsx"
Cohesion: 0.67
Nodes (3): News(), NEWS_SOURCES, openLink()

### Community 70 - "weather.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

## Knowledge Gaps
- **299 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+294 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `Topbar.tsx` to `useCompany`, `CompanyContext.tsx`, `News.tsx`, `Library.tsx`, `App.tsx`, `useToast`, `referenceRepo.ts`, `Planner.tsx`, `useEvents.ts`, `Translator.tsx`, `TrayView.tsx`, `CalendarPage.tsx`, `Finance.tsx`, `numToWords.ts`, `CalendarView.tsx`, `types.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `todayISO` to `CompanyContext.tsx`, `Templates.tsx`, `referenceRepo.ts`, `useEvents.ts`, `TrayView.tsx`, `CalendarPage.tsx`, `Currency.tsx`, `Finance.tsx`, `TaxCalculator.tsx`, `CalendarView.tsx`, `Topbar.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`, `types.ts`, `EcpManager.tsx`, `SmartCalendar.tsx`, `Planner.tsx`, `DigestView.tsx`, `FocusView.tsx`, `WidgetBoundary`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `CompanyContext.tsx`, `Library.tsx`, `Templates.tsx`, `Planner.tsx`, `Translator.tsx`, `CalendarPage.tsx`, `Finance.tsx`, `numToWords.ts`, `TaxCalculator.tsx`, `types.ts`, `syncQueue.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _299 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `useToast` be split into smaller, more focused modules?**
  _Cohesion score 0.07227891156462585 - nodes in this community are weakly interconnected._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08665269042627533 - nodes in this community are weakly interconnected._