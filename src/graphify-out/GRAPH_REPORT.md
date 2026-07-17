# Graph Report - src  (2026-07-17)

## Corpus Check
- 246 files · ~321,195 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1360 nodes · 3239 edges · 70 communities (67 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e571f077`
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
- Topbar.tsx
- Icon.tsx
- supabase.ts
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
- knowledgeRepo.ts
- WidgetBoundary
- onecProcess.ts
- uiScale.ts
- Sidebar.tsx
- Transliterate.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- currency.ts
- useCompany
- vite-env.d.ts
- PLAN_LIMITS
- pcClean.ts
- DocumentViewModeSwitch.tsx
- ToastContext.tsx
- Icon.tsx
- EimzoDiag.tsx

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 49 edges
2. `useCompany()` - 33 edges
3. `supabase` - 32 edges
4. `BxEvent` - 32 edges
5. `useToast()` - 31 edges
6. `usePlan()` - 29 edges
7. `registerIpcHandlers()` - 26 edges
8. `Templates()` - 17 edges
9. `Translator()` - 17 edges
10. `EventStatus` - 16 edges

## Surprising Connections (you probably didn't know these)
- `CommandPalette()` --indirect_call--> `c()`  [INFERRED]
  src/renderer/components/CommandPalette.tsx → src/renderer/pages/planner/BoardKanban.tsx
- `TaskPanel()` --calls--> `useCompany()`  [EXTRACTED]
  src/renderer/components/dashboard/TaskPanel.tsx → src/renderer/lib/CompanyContext.tsx
- `useDocumentViewMode()` --indirect_call--> `loadDocumentWorkspaceMode()`  [INFERRED]
  src/renderer/components/documents/DocumentViewModeSwitch.tsx → src/renderer/lib/workspaceModes.ts
- `CompanySwitcher()` --indirect_call--> `c()`  [INFERRED]
  src/renderer/components/layout/CompanySwitcher.tsx → src/renderer/pages/planner/BoardKanban.tsx
- `CompanyProvider()` --indirect_call--> `c()`  [INFERRED]
  src/renderer/lib/CompanyContext.tsx → src/renderer/pages/planner/BoardKanban.tsx

## Import Cycles
- None detected.

## Communities (70 total, 3 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.14
Nodes (17): ACCENT, CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row() (+9 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.13
Nodes (16): Props, statusMeta, TaskPanel(), TaskRow, tasksRepo, CalendarEvent, CompanyLanguage, CompanyLegalForm (+8 more)

### Community 3 - "useToast"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 4 - "Library.tsx"
Cohesion: 0.09
Nodes (42): KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext(), retrieveArticles() (+34 more)

### Community 5 - "App.tsx"
Cohesion: 0.18
Nodes (5): Cmd, CommandPalette(), COMMANDS, Placeholder(), Props

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.12
Nodes (28): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META, getFieldGroup() (+20 more)

### Community 8 - "ipc.ts"
Cohesion: 0.18
Nodes (16): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, FontScale (+8 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.12
Nodes (27): indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode, ReferenceSection (+19 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.18
Nodes (15): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), TaxDeadline, taxDeadlines (+7 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.11
Nodes (23): TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName() (+15 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.10
Nodes (23): EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS (+15 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 14 - "CalendarPage.tsx"
Cohesion: 0.36
Nodes (10): App(), Topbar(), search(), applyTheme(), BX_THEMES, BxTheme, currentTheme(), nextTheme() (+2 more)

### Community 15 - "CalendarPage.tsx"
Cohesion: 0.14
Nodes (26): AuthGate(), PinScreen(), Props, AttemptsData, clearPin(), getAttemptsData(), getAttemptsLeft(), hasPin() (+18 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.05
Nodes (36): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+28 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.05
Nodes (66): CompareFieldRowProps, ConflictModal(), ConflictModalProps, parseBankStatement(), ParsedTransaction, BusinessBxDatabase, BxCounterparty, BxTransaction (+58 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.14
Nodes (25): Item, Props, TYPE_BADGE, CalCard, Props, PRI_COLOR, Props, TYPE_ICON (+17 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.11
Nodes (26): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+18 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.23
Nodes (12): fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), BankCheck(), CheckResult (+4 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.13
Nodes (13): ErrorBoundary, Props, State, root, rootElement, detectPlatform(), installGlobalErrorReporting(), reportError() (+5 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.07
Nodes (48): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+40 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.17
Nodes (11): AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass() (+3 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.17
Nodes (11): useDocumentViewMode(), CompanySwitcher(), OnboardingWizard(), Step, STEPS, PRO_PERKS, useCompany(), usePlan() (+3 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.23
Nodes (10): Button(), Props, styles, Variant, Props, formatBytes(), onecApi, CacheCleaner() (+2 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (9): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+1 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.23
Nodes (9): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, GovTab(), LawTab() (+1 more)

### Community 28 - "main.ts"
Cohesion: 0.17
Nodes (20): broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), createTray(), createTrayWindow(), downloadAsset(), gotLock, loadTrayState() (+12 more)

### Community 29 - "types.ts"
Cohesion: 0.09
Nodes (33): uid(), CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, Props, Props (+25 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.22
Nodes (11): getNewsItem(), LEGISLATION_NEWS, NewsItem, News(), NEWS_SOURCES, openLink(), buildAiPrompt(), buildTaskNote() (+3 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 33 - "useCompany"
Cohesion: 0.24
Nodes (12): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+4 more)

### Community 34 - "Topbar.tsx"
Cohesion: 0.27
Nodes (9): CompanyWizardInitial, Props, WEEKDAYS, CompanyCtx, Ctx, buildCompanyInsert(), companiesRepo, Company (+1 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.29
Nodes (11): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchText(), FLAGS, numeric(), parseAloqabankRates() (+3 more)

### Community 36 - "supabase.ts"
Cohesion: 0.21
Nodes (16): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+8 more)

### Community 37 - "Settings.tsx"
Cohesion: 0.26
Nodes (12): BoardModal(), DOT, Props, baseBoardDefs(), BOARD_ICONS, col(), COLUMN_COLORS, defaultColumns() (+4 more)

### Community 38 - "Tools.tsx"
Cohesion: 0.10
Nodes (19): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+11 more)

### Community 39 - "CurrencyHistory.tsx"
Cohesion: 0.24
Nodes (9): buildTaskNotification(), BxNotification, ROW, formatDueDate(), GlobalNotificationRow, NotificationSource, NotificationTarget, TaskNotificationRow (+1 more)

### Community 40 - "workbenchCatalog.ts"
Cohesion: 0.27
Nodes (9): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchProposal, WorkbenchSector (+1 more)

### Community 41 - "InpsCalc.tsx"
Cohesion: 0.17
Nodes (13): fmt(), InpsCalc(), format(), MoneyInput(), Props, fmt(), PenaltyCalc(), fmt() (+5 more)

### Community 42 - "todayISO"
Cohesion: 0.17
Nodes (20): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), AddCardPayload, BoardKanban() (+12 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.31
Nodes (11): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+3 more)

### Community 44 - "BxEvent"
Cohesion: 0.26
Nodes (10): Calc(), CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES (+2 more)

### Community 45 - "MoneyInput.tsx"
Cohesion: 0.50
Nodes (4): DividendCalc(), fmt(), TREATIES, TREATY_LABELS

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
Cohesion: 0.20
Nodes (15): TraderInfo, UpdateSnapshot, api, BxApi, BxBridge, WidgetBridge, IPC, BackupResult (+7 more)

### Community 50 - "FocusView.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 51 - "pcClean.ts"
Cohesion: 0.27
Nodes (9): Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan, PlanCtx, PlanLimits, PlanProvider() (+1 more)

### Community 52 - "knowledgeRepo.ts"
Cohesion: 0.71
Nodes (5): applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, normalizeFontScale(), saveFontScale()

### Community 53 - "WidgetBoundary"
Cohesion: 0.27
Nodes (7): DEFAULT_SITES, loadSites(), msColor(), NetworkChecker(), PingTarget, saveSites(), TestResult

### Community 54 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 55 - "uiScale.ts"
Cohesion: 0.39
Nodes (7): cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp(), TempDirInfo

### Community 56 - "Sidebar.tsx"
Cohesion: 0.70
Nodes (4): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites()

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 58 - "EimzoDiag.tsx"
Cohesion: 0.14
Nodes (26): registerIpcHandlers(), fetchRateOnDate(), fetchRates(), parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile(), cleanup() (+18 more)

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "currency.ts"
Cohesion: 0.36
Nodes (7): CompanyProfileWizard(), defaultRuleIds(), initialProfile(), buildTaxDeadlineEvents(), buildTaxDeadlineRuleOptions(), datesForDeadline(), OSN_PROFILE

### Community 61 - "useCompany"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 65 - "pcClean.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 66 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.33
Nodes (3): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps

### Community 68 - "ToastContext.tsx"
Cohesion: 0.15
Nodes (14): CompanyProvider(), check(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, useToast() (+6 more)

### Community 71 - "Icon.tsx"
Cohesion: 0.20
Nodes (4): DocumentWorkspace, STEPS, IconName, PATHS

## Knowledge Gaps
- **302 isolated node(s):** `Props`, `NotifyDays`, `IdleLock`, `TabType`, `DashboardWidgets` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `Finance.tsx` to `CompanyContext.tsx`, `useToast`, `Library.tsx`, `ipc.ts`, `referenceRepo.ts`, `widgetsApi.ts`, `Translator.tsx`, `useEvents.ts`, `TrayView.tsx`, `CalendarPage.tsx`, `numToWords.ts`, `errorReporter.ts`, `types.ts`, `syncQueue.ts`, `Topbar.tsx`, `supabase.ts`, `Settings.tsx`, `CurrencyHistory.tsx`, `Planner.tsx`, `pcClean.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `todayISO` to `EcpManager.tsx`, `Topbar.tsx`, `Templates.tsx`, `ipc.ts`, `referenceRepo.ts`, `widgetsApi.ts`, `Planner.tsx`, `useEvents.ts`, `TrayView.tsx`, `DigestView.tsx`, `Currency.tsx`, `Finance.tsx`, `ListView.tsx`, `FocusView.tsx`, `CalendarView.tsx`, `Dashboard.tsx`, `currency.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `useToast()` connect `ToastContext.tsx` to `Calc.tsx`, `Topbar.tsx`, `useToast`, `Library.tsx`, `Templates.tsx`, `ipc.ts`, `Planner.tsx`, `BxEvent`, `Translator.tsx`, `Finance.tsx`, `numToWords.ts`, `WidgetBoundary`, `types.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `Props`, `NotifyDays`, `IdleLock` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12857142857142856 - nodes in this community are weakly interconnected._