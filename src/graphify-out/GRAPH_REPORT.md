# Graph Report - src  (2026-07-17)

## Corpus Check
- 240 files · ~320,286 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1342 nodes · 3173 edges · 66 communities (63 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6da74cb1`
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
- CalendarPage.tsx
- Currency.tsx
- Finance.tsx
- ListView.tsx
- numToWords.ts
- TaxCalculator.tsx
- errorReporter.ts
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
- Icon.tsx
- Settings.tsx
- Tools.tsx
- CurrencyHistory.tsx
- workbenchCatalog.ts
- InpsCalc.tsx
- todayISO
- Planner.tsx
- BxEvent
- MoneyInput.tsx
- RecyclingCalc.tsx
- DigestView.tsx
- onecCache.ts
- pcClean.ts
- FocusView.tsx
- pcClean.ts
- WidgetBoundary
- onecProcess.ts
- uiScale.ts
- Sidebar.tsx
- Transliterate.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- currency.ts
- vite-env.d.ts
- PLAN_LIMITS
- pcClean.ts
- News.tsx
- PdfCompress.tsx
- Icon.tsx
- plan.tsx
- pcClean.ts

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 49 edges
2. `useCompany()` - 33 edges
3. `supabase` - 32 edges
4. `BxEvent` - 32 edges
5. `useToast()` - 31 edges
6. `usePlan()` - 29 edges
7. `registerIpcHandlers()` - 26 edges
8. `Templates()` - 17 edges
9. `Translator()` - 16 edges
10. `EventStatus` - 16 edges

## Surprising Connections (you probably didn't know these)
- `CommandPalette()` --indirect_call--> `c()`  [INFERRED]
  src/renderer/components/CommandPalette.tsx → src/renderer/pages/planner/BoardKanban.tsx
- `TaskPanel()` --calls--> `useCompany()`  [EXTRACTED]
  src/renderer/components/dashboard/TaskPanel.tsx → src/renderer/lib/CompanyContext.tsx
- `CompanySwitcher()` --indirect_call--> `c()`  [INFERRED]
  src/renderer/components/layout/CompanySwitcher.tsx → src/renderer/pages/planner/BoardKanban.tsx
- `mergeSections()` --indirect_call--> `c()`  [INFERRED]
  src/renderer/lib/db/servicesRepo.ts → src/renderer/pages/planner/BoardKanban.tsx
- `ReferenceView()` --calls--> `usePlan()`  [EXTRACTED]
  src/renderer/pages/library/ReferenceView.tsx → src/renderer/lib/plan.tsx

## Import Cycles
- None detected.

## Communities (66 total, 3 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.27
Nodes (7): CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row()

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.07
Nodes (41): CompanyProfileWizard(), CompanyWizardInitial, defaultRuleIds(), initialProfile(), Props, WEEKDAYS, Props, statusMeta (+33 more)

### Community 3 - "useToast"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 4 - "Library.tsx"
Cohesion: 0.08
Nodes (42): Cmd, CommandPalette(), COMMANDS, KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle (+34 more)

### Community 5 - "App.tsx"
Cohesion: 0.26
Nodes (12): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+4 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.10
Nodes (32): useDocumentViewMode(), DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, CP_PREFIXES, DOCUMENT_KEYS (+24 more)

### Community 8 - "ipc.ts"
Cohesion: 0.20
Nodes (15): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, FontScale (+7 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.12
Nodes (27): indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode, ReferenceSection (+19 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.10
Nodes (11): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyExportRow (+3 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.12
Nodes (21): TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName() (+13 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.15
Nodes (14): event, EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today (+6 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 15 - "CalendarPage.tsx"
Cohesion: 0.22
Nodes (16): PinScreen(), Props, AttemptsData, getAttemptsData(), getAttemptsLeft(), isLocked(), LockStatus, pureDjb2() (+8 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.15
Nodes (19): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo() (+11 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.05
Nodes (63): CompareFieldRowProps, ConflictModal(), ConflictModalProps, Topbar(), parseBankStatement(), ParsedTransaction, BxCounterparty, BxTransaction (+55 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.14
Nodes (20): Item, Props, TYPE_BADGE, CalCard, PRI_COLOR, Props, TYPE_ICON, Props (+12 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.17
Nodes (18): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+10 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.07
Nodes (33): check(), fetch(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, ToastProvider() (+25 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.13
Nodes (12): ErrorBoundary, Props, State, root, rootElement, detectPlatform(), installGlobalErrorReporting(), reportError() (+4 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.05
Nodes (66): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), MONTHS, Props, TaxCalendar() (+58 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.17
Nodes (11): AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass() (+3 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.22
Nodes (11): getNewsItem(), LEGISLATION_NEWS, NewsItem, News(), NEWS_SOURCES, openLink(), buildAiPrompt(), buildTaskNote() (+3 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.18
Nodes (16): Button(), Props, styles, Variant, Props, BxBridge, formatBytes(), onecApi (+8 more)

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
Cohesion: 0.08
Nodes (41): uid(), Props, AddCardPayload, BoardKanban(), COLOR_MAP, fmtDate(), isOverdue(), PRIORITY_BAR (+33 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.15
Nodes (14): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+6 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 33 - "useCompany"
Cohesion: 0.24
Nodes (14): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+6 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.24
Nodes (13): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchRateOnDate(), fetchRates(), fetchText(), FLAGS (+5 more)

### Community 37 - "Settings.tsx"
Cohesion: 0.71
Nodes (5): applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, normalizeFontScale(), saveFontScale()

### Community 38 - "Tools.tsx"
Cohesion: 0.11
Nodes (14): readFavorites(), storageKey(), useWorkbenchFavorites(), ACCENT, CheckItem, INITIAL, FULL_HEIGHT_TOOLS, GROUPS (+6 more)

### Community 39 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 40 - "workbenchCatalog.ts"
Cohesion: 0.24
Nodes (10): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchKind, WorkbenchProposal (+2 more)

### Community 41 - "InpsCalc.tsx"
Cohesion: 0.25
Nodes (8): fmt(), InpsCalc(), fmt(), SalaryCalc(), calcPayroll(), DEFAULT_RATES, PayrollRates, PayrollResult

### Community 42 - "todayISO"
Cohesion: 0.26
Nodes (13): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), CurrencyConverter(), fmtNum() (+5 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.31
Nodes (11): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+3 more)

### Community 44 - "BxEvent"
Cohesion: 0.26
Nodes (10): Calc(), CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES (+2 more)

### Community 45 - "MoneyInput.tsx"
Cohesion: 0.17
Nodes (13): DividendCalc(), fmt(), TREATIES, TREATY_LABELS, format(), MoneyInput(), Props, fmt() (+5 more)

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
Cohesion: 0.17
Nodes (11): parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile(), fetchTrader(), TraderInfo, PcCleanResult, TempDirInfo (+3 more)

### Community 50 - "FocusView.tsx"
Cohesion: 0.24
Nodes (11): Props, buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), Props, STATUS_LABELS (+3 more)

### Community 51 - "pcClean.ts"
Cohesion: 0.25
Nodes (11): COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS, loadCompanyDetails(), saveCompanyDetails(), Counterparties() (+3 more)

### Community 53 - "WidgetBoundary"
Cohesion: 0.19
Nodes (10): EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props, COLUMNS, groupEventsByStatus(), PRIORITY_BORDER (+2 more)

### Community 54 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 55 - "uiScale.ts"
Cohesion: 0.29
Nodes (9): describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), EventActivity, EventActivityType (+1 more)

### Community 56 - "Sidebar.tsx"
Cohesion: 0.35
Nodes (9): AuthGate(), clearPin(), hasPin(), isPinEnabled(), setPinEnabled(), useAuth(), getIdleTimeout(), IdleTimeout (+1 more)

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 58 - "EimzoDiag.tsx"
Cohesion: 0.21
Nodes (18): registerIpcHandlers(), cleanup(), parseCertInfo(), pickFileToSign(), pickSigFile(), signFile(), SignResult, VerifyResult (+10 more)

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "currency.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 65 - "pcClean.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 67 - "News.tsx"
Cohesion: 0.22
Nodes (6): App(), applyTheme(), BxTheme, currentTheme(), Placeholder(), Props

### Community 71 - "Icon.tsx"
Cohesion: 0.12
Nodes (7): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps, DocumentWorkspace, STEPS, IconName, PATHS

### Community 72 - "plan.tsx"
Cohesion: 0.10
Nodes (21): CompanySwitcher(), OnboardingWizard(), Step, STEPS, PRO_PERKS, useCompany(), Ctx, DEFAULT_PLAN_LIMITS (+13 more)

### Community 73 - "pcClean.ts"
Cohesion: 0.48
Nodes (6): checkRunningBrowsers(), cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), rmDirContents(), scanPcTemp()

## Knowledge Gaps
- **303 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+298 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `CompanyContext.tsx` to `useToast`, `Library.tsx`, `App.tsx`, `plan.tsx`, `referenceRepo.ts`, `ipc.ts`, `Planner.tsx`, `useEvents.ts`, `Translator.tsx`, `TrayView.tsx`, `Finance.tsx`, `numToWords.ts`, `errorReporter.ts`, `uiScale.ts`, `Topbar.tsx`, `types.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `todayISO` to `EcpManager.tsx`, `CompanyContext.tsx`, `Templates.tsx`, `ipc.ts`, `referenceRepo.ts`, `Planner.tsx`, `useEvents.ts`, `TrayView.tsx`, `DigestView.tsx`, `Currency.tsx`, `Finance.tsx`, `ListView.tsx`, `FocusView.tsx`, `WidgetBoundary`, `CalendarView.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`, `types.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `useCompany()` connect `plan.tsx` to `useCompany`, `CompanyContext.tsx`, `useToast`, `Templates.tsx`, `ipc.ts`, `todayISO`, `Planner.tsx`, `Translator.tsx`, `Finance.tsx`, `numToWords.ts`, `pcClean.ts`, `TaxCalculator.tsx`, `CalendarView.tsx`, `Dashboard.tsx`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _303 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06948051948051948 - nodes in this community are weakly interconnected._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08069381598793364 - nodes in this community are weakly interconnected._