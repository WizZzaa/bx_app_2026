# Graph Report - src  (2026-07-17)

## Corpus Check
- 227 files · ~314,401 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1280 nodes · 3031 edges · 72 communities (68 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d18f89fe`
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
- NetworkChecker.tsx
- NotificationsWidget.tsx
- QuickNotes.tsx
- RecyclingCalc.tsx
- BoardKanban.tsx
- weather.ts
- DividendCalc.tsx

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
- `CompanyMember` --references--> `CompanyRole`  [EXTRACTED]
  renderer/pages/planner/useCompanyMembers.ts → src/renderer/lib/companyTeam.ts
- `Counterparties()` --calls--> `useCompany()`  [EXTRACTED]
  src/renderer/pages/Counterparties.tsx → renderer/lib/CompanyContext.tsx
- `Counterparties()` --calls--> `useToast()`  [EXTRACTED]
  src/renderer/pages/Counterparties.tsx → renderer/lib/ui/ToastContext.tsx
- `CounterpartyDetail()` --calls--> `counterpartyHealth()`  [EXTRACTED]
  src/renderer/pages/Counterparties.tsx → renderer/lib/organizationInsights.ts

## Import Cycles
- None detected.

## Communities (72 total, 4 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.05
Nodes (58): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, root, rootElement (+50 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.25
Nodes (8): fmt(), InpsCalc(), fmt(), SalaryCalc(), calcPayroll(), DEFAULT_RATES, PayrollRates, PayrollResult

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.17
Nodes (17): CompanyWizardInitial, Props, WEEKDAYS, CompanyCtx, Ctx, companiesRepo, CalendarEvent, Company (+9 more)

### Community 3 - "useToast"
Cohesion: 0.14
Nodes (15): CompanyProvider(), check(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, ToastProvider() (+7 more)

### Community 4 - "Library.tsx"
Cohesion: 0.10
Nodes (38): KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext(), retrieveArticles() (+30 more)

### Community 5 - "App.tsx"
Cohesion: 0.06
Nodes (31): App(), AboutModal(), Props, LoginScreen(), Props, Cmd, CommandPalette(), COMMANDS (+23 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.07
Nodes (46): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, capitalize(), RU_HUND, RU_ONES_F (+38 more)

### Community 8 - "ipc.ts"
Cohesion: 0.12
Nodes (29): registerIpcHandlers(), CbuItem, DEFAULT_CODES, fetchRateOnDate(), fetchRates(), FLAGS, parseCertificateText(), ParsedEcpInfo (+21 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.11
Nodes (31): Topbar(), indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode (+23 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.11
Nodes (9): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyRate (+1 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.21
Nodes (17): buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName(), modeName(), normalizeArchiveFileName(), translatedFileName(), TRANSLATION_LANGUAGES (+9 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.12
Nodes (20): EventModal(), PRIORITY_LABELS, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS, fmtDate() (+12 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.18
Nodes (12): Notice, ChatMsg, Deadline, DRAG, fmtDay(), NODRAG, noticeStyle, openApp() (+4 more)

### Community 14 - "Documents.tsx"
Cohesion: 0.17
Nodes (16): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+8 more)

### Community 15 - "CalendarPage.tsx"
Cohesion: 0.19
Nodes (17): CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, subscribePlannerReload(), cacheKey(), DatedCard (+9 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.16
Nodes (17): ALL_CODES, buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, CurrencyExportRow, daysAgo() (+9 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.06
Nodes (62): CompareFieldRowProps, ConflictModal(), ConflictModalProps, parseBankStatement(), ParsedTransaction, BxCounterparty, BxTransaction, db (+54 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.27
Nodes (10): Props, CalCard, PRI_COLOR, Props, TYPE_ICON, Props, Props, BxBoard (+2 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.17
Nodes (18): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+10 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.18
Nodes (15): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), TaxDeadline, taxDeadlines (+7 more)

### Community 21 - "Services.tsx"
Cohesion: 0.24
Nodes (15): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+7 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.16
Nodes (16): specialDaysForMonth(), CalBoard, CalendarView(), formatCalendarDate(), formatFullDate(), formatShortDate(), formatWeekday(), mondayOf() (+8 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.24
Nodes (13): CompanyProfileWizard(), defaultRuleIds(), initialProfile(), addDaysISO(), buildTaxDeadlineEvents(), buildTaxDeadlineRuleOptions(), CompanyRegime, CompanyTaxProfile (+5 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.27
Nodes (8): buildTaskNotification(), ROW, formatDueDate(), GlobalNotificationRow, NotificationSource, NotificationTarget, TaskNotificationRow, BASE_ROW

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.18
Nodes (16): Button(), Props, styles, Variant, Props, BxBridge, formatBytes(), onecApi (+8 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (9): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+1 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.20
Nodes (11): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, RefTabId, tabs (+3 more)

### Community 28 - "main.ts"
Cohesion: 0.21
Nodes (14): broadcastUpdateStatus(), checkForUpdatesAndDownload(), createTray(), createTrayWindow(), downloadAsset(), gotLock, isNewerVersion(), loadTrayState() (+6 more)

### Community 29 - "types.ts"
Cohesion: 0.19
Nodes (12): Props, Props, BUILT_IN_CHECKLIST_TEMPLATES, CardModal(), fmtDateTime(), LABEL_PALETTE, PRIORITY_OPTS, Props (+4 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.26
Nodes (12): BoardModal(), DOT, Props, baseBoardDefs(), BOARD_ICONS, col(), COLUMN_COLORS, defaultColumns() (+4 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 33 - "localDb.ts"
Cohesion: 0.24
Nodes (9): format(), MoneyInput(), Props, fmt(), PenaltyCalc(), fmt(), RegimeCompareCalc(), fmt() (+1 more)

### Community 34 - "SmartCalendar.tsx"
Cohesion: 0.13
Nodes (23): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+15 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.15
Nodes (5): DocumentWorkspace, STEPS, TranslatorTutorial(), IconName, PATHS

### Community 36 - "DateCalc.tsx"
Cohesion: 0.35
Nodes (9): isWorkday(), addCalendarDays(), addWorkdays(), DateCalc(), diffDays(), diffWorkdays(), fmt(), fmtLong() (+1 more)

### Community 37 - "useCompany"
Cohesion: 0.12
Nodes (15): CompanySwitcher(), OnboardingWizard(), Step, STEPS, PRO_PERKS, useCompany(), usePlan(), useDocuments() (+7 more)

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
Cohesion: 0.32
Nodes (8): CalcPrefill, takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES, fmt(), VacationCalc()

### Community 42 - "todayISO"
Cohesion: 0.21
Nodes (14): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE (+6 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.25
Nodes (12): supabase, checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner() (+4 more)

### Community 44 - "BxEvent"
Cohesion: 0.27
Nodes (10): Props, Props, Props, COLUMNS, groupEventsByStatus(), PRIORITY_BORDER, Props, SystemTaskBoard() (+2 more)

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
Cohesion: 0.21
Nodes (11): TraderInfo, cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp(), TempDirInfo (+3 more)

### Community 52 - "TxModal.tsx"
Cohesion: 0.27
Nodes (7): Props, statusMeta, TaskPanel(), TaskRow, tasksRepo, TaskPriority, TaskStatus

### Community 53 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 54 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 55 - "ImportModal.tsx"
Cohesion: 0.27
Nodes (7): CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row()

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
Cohesion: 0.21
Nodes (12): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites(), ACCENT, Calc(), GROUPS, peekCalcPrefill() (+4 more)

### Community 65 - "NetworkChecker.tsx"
Cohesion: 0.27
Nodes (7): DEFAULT_SITES, loadSites(), msColor(), NetworkChecker(), PingTarget, saveSites(), TestResult

### Community 66 - "NotificationsWidget.tsx"
Cohesion: 0.36
Nodes (7): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, NoticeLevel

### Community 67 - "QuickNotes.tsx"
Cohesion: 0.36
Nodes (5): uid(), emitPlannerReload(), loadNotes(), Note, QuickNotes()

### Community 68 - "RecyclingCalc.tsx"
Cohesion: 0.25
Nodes (8): AGE_COEFFS, COMMERCIAL_ENGINES, EngineGroup, fmt(), MOTO_ENGINES, PASSENGER_ENGINES, RecyclingCalc(), VehicleCategory

### Community 69 - "BoardKanban.tsx"
Cohesion: 0.38
Nodes (6): AddCardPayload, BoardKanban(), COLOR_MAP, fmtDate(), isOverdue(), PRIORITY_BAR

### Community 70 - "weather.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 71 - "DividendCalc.tsx"
Cohesion: 0.50
Nodes (4): DividendCalc(), fmt(), TREATIES, TREATY_LABELS

## Knowledge Gaps
- **294 isolated node(s):** `ROLE_TONES`, `CompanyMemberStatus`, `CompanyRoleGuideItem`, `OrganizationView`, `EMPTY_COUNTERPARTY` (+289 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `Planner.tsx` to `Settings.tsx`, `CompanyContext.tsx`, `Library.tsx`, `App.tsx`, `referenceRepo.ts`, `Translator.tsx`, `useEvents.ts`, `TrayView.tsx`, `Documents.tsx`, `CalendarPage.tsx`, `Finance.tsx`, `numToWords.ts`, `Services.tsx`, `Counterparties.tsx`, `Topbar.tsx`, `types.ts`, `syncQueue.ts`, `EventActivityTimeline.tsx`, `plan.tsx`, `TxModal.tsx`, `QuickNotes.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `todayISO` to `Settings.tsx`, `CompanyContext.tsx`, `Templates.tsx`, `referenceRepo.ts`, `useEvents.ts`, `TrayView.tsx`, `Currency.tsx`, `Finance.tsx`, `TaxCalculator.tsx`, `Counterparties.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`, `EcpManager.tsx`, `DateCalc.tsx`, `Planner.tsx`, `BxEvent`, `DigestView.tsx`, `FocusView.tsx`, `NotificationsWidget.tsx`, `BoardKanban.tsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `useCompany()` connect `useCompany` to `Settings.tsx`, `CompanyContext.tsx`, `useToast`, `Templates.tsx`, `referenceRepo.ts`, `Planner.tsx`, `Translator.tsx`, `Documents.tsx`, `CalendarPage.tsx`, `Finance.tsx`, `numToWords.ts`, `TxModal.tsx`, `TaxCalculator.tsx`, `Topbar.tsx`, `Dashboard.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `ROLE_TONES`, `CompanyMemberStatus`, `CompanyRoleGuideItem` to the rest of the system?**
  _294 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05328005328005328 - nodes in this community are weakly interconnected._
- **Should `useToast` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10372340425531915 - nodes in this community are weakly interconnected._