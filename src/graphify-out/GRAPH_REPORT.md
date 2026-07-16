# Graph Report - src  (2026-07-17)

## Corpus Check
- 242 files · ~320,428 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1346 nodes · 3187 edges · 78 communities (75 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e93cc360`
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
- News.tsx
- ToastContext.tsx
- PdfCompress.tsx
- settingsBackup.ts
- Icon.tsx
- plan.tsx
- pcClean.ts
- QuickNotes.tsx
- onecBackupScheduler.ts
- EimzoDiag.tsx
- DividendCalc.tsx

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
- `OnboardingWizard()` --calls--> `usePlan()`  [EXTRACTED]
  src/renderer/components/OnboardingWizard.tsx → src/renderer/lib/plan.tsx
- `TaskPanel()` --calls--> `useCompany()`  [EXTRACTED]
  src/renderer/components/dashboard/TaskPanel.tsx → src/renderer/lib/CompanyContext.tsx
- `CurrencyConverter()` --calls--> `todayISO()`  [EXTRACTED]
  src/renderer/pages/tools/CurrencyConverter.tsx → src/renderer/lib/dates.ts
- `mergeSections()` --indirect_call--> `c()`  [INFERRED]
  src/renderer/lib/db/servicesRepo.ts → src/renderer/pages/planner/BoardKanban.tsx

## Import Cycles
- None detected.

## Communities (78 total, 3 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.27
Nodes (7): CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row()

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.05
Nodes (53): CompanyProfileWizard(), CompanyWizardInitial, defaultRuleIds(), initialProfile(), Props, WEEKDAYS, Props, statusMeta (+45 more)

### Community 3 - "useToast"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 4 - "Library.tsx"
Cohesion: 0.20
Nodes (22): KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, ArticleReader(), inline(), Props (+14 more)

### Community 5 - "App.tsx"
Cohesion: 0.29
Nodes (11): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+3 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.11
Nodes (29): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META (+21 more)

### Community 8 - "ipc.ts"
Cohesion: 0.24
Nodes (13): SettingsBackupPayload, applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, FontScale, normalizeFontScale(), saveFontScale(), DashboardWidgets (+5 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.15
Nodes (23): indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode, ReferenceSection (+15 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.11
Nodes (10): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, BankExchangeRate (+2 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.12
Nodes (21): TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName() (+13 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.13
Nodes (18): EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS (+10 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.15
Nodes (20): NotificationsWidget(), styleByLevel, todayISO(), buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice (+12 more)

### Community 14 - "CalendarPage.tsx"
Cohesion: 0.18
Nodes (18): CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, subscribePlannerReload(), cacheKey(), ChecklistItem (+10 more)

### Community 15 - "CalendarPage.tsx"
Cohesion: 0.22
Nodes (16): PinScreen(), Props, AttemptsData, getAttemptsData(), getAttemptsLeft(), isLocked(), LockStatus, pureDjb2() (+8 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.14
Nodes (20): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, CurrencyExportRow (+12 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.12
Nodes (26): parseBankStatement(), ParsedTransaction, BxTransaction, exportTransactionsToExcel(), baseTx, filterPayments(), paymentDayDiff(), paymentSummary() (+18 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.16
Nodes (21): Props, CalCard, PRI_COLOR, Props, TYPE_ICON, Props, Props, fmtDate() (+13 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.17
Nodes (17): CompanyRoleGuide(), ROLE_TONES, INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE, COMPANY_ROLE_LABELS (+9 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.15
Nodes (17): check(), fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), CheckResult (+9 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.14
Nodes (10): ErrorBoundary, Props, State, detectPlatform(), installGlobalErrorReporting(), reportError(), seen, isDev (+2 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.13
Nodes (22): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+14 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.15
Nodes (17): SpecialDay, UZ_PRODUCTION_CALENDAR_2026_SOURCES, CalBoard, CalendarView(), formatCalendarDate(), formatFullDate(), formatShortDate(), formatWeekday() (+9 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.05
Nodes (40): App(), AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection (+32 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.17
Nodes (17): Button(), Props, styles, Variant, Props, BxBridge, formatBytes(), onecApi (+9 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (9): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+1 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.16
Nodes (12): PRO_PERKS, dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, RefTabId (+4 more)

### Community 28 - "main.ts"
Cohesion: 0.21
Nodes (14): broadcastUpdateStatus(), checkForUpdatesAndDownload(), createTray(), createTrayWindow(), downloadAsset(), gotLock, isNewerVersion(), loadTrayState() (+6 more)

### Community 29 - "types.ts"
Cohesion: 0.14
Nodes (18): uid(), Props, AddCardPayload, BoardKanban(), COLOR_MAP, fmtDate(), isOverdue(), PRIORITY_BAR (+10 more)

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
Cohesion: 0.19
Nodes (16): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+8 more)

### Community 34 - "Topbar.tsx"
Cohesion: 0.19
Nodes (13): Topbar(), search(), SearchItem, buildTaskNotification(), BxNotification, ROW, formatDueDate(), GlobalNotificationRow (+5 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.24
Nodes (13): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchRateOnDate(), fetchRates(), fetchText(), FLAGS (+5 more)

### Community 36 - "supabase.ts"
Cohesion: 0.26
Nodes (14): supabase, detectAndRegisterConflict(), addToSyncQueue(), getSyncQueue(), isTransientError(), pushItem(), PushResult, removeFromSyncQueue() (+6 more)

### Community 37 - "Settings.tsx"
Cohesion: 0.25
Nodes (9): CompareFieldRowProps, ConflictModal(), ConflictModalProps, db, ExchangeRate, SyncConflict, getConflicts(), resolveConflict() (+1 more)

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
Cohesion: 0.25
Nodes (8): fmt(), InpsCalc(), fmt(), SalaryCalc(), calcPayroll(), DEFAULT_RATES, PayrollRates, PayrollResult

### Community 42 - "todayISO"
Cohesion: 0.38
Nodes (7): daysFromNowISO(), nextRecurrenceISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE

### Community 43 - "Planner.tsx"
Cohesion: 0.33
Nodes (10): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+2 more)

### Community 44 - "BxEvent"
Cohesion: 0.26
Nodes (10): Calc(), CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES (+2 more)

### Community 45 - "MoneyInput.tsx"
Cohesion: 0.19
Nodes (12): useEconomicIndicators(), format(), MoneyInput(), Props, fmt(), NdflCalc(), fmt(), PenaltyCalc() (+4 more)

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
Nodes (12): ParsedEcpInfo, fetchTrader(), TraderInfo, BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem (+4 more)

### Community 50 - "FocusView.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 51 - "pcClean.ts"
Cohesion: 0.21
Nodes (14): BxCounterparty, NewCounterparty, useCounterparties(), COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS (+6 more)

### Community 52 - "knowledgeRepo.ts"
Cohesion: 0.25
Nodes (12): KB_ARTICLES, retrieveArticles(), RetrievedArticle, stem(), STOP, tokenize(), getAllArticlesSync(), mergeArticles() (+4 more)

### Community 53 - "WidgetBoundary"
Cohesion: 0.32
Nodes (5): EVENT_TYPE_LABELS, COLUMNS, groupEventsByStatus(), PRIORITY_BORDER, SystemTaskBoard()

### Community 54 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 55 - "uiScale.ts"
Cohesion: 0.24
Nodes (11): Props, describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), CompanyMember (+3 more)

### Community 56 - "Sidebar.tsx"
Cohesion: 0.28
Nodes (10): AuthGate(), clearPin(), hasPin(), isPinEnabled(), setPinEnabled(), AuthState, useAuth(), getIdleTimeout() (+2 more)

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 58 - "EimzoDiag.tsx"
Cohesion: 0.22
Nodes (16): registerIpcHandlers(), parseCertificateText(), parsePfx(), pickPfxFile(), cleanup(), parseCertInfo(), pickFileToSign(), pickSigFile() (+8 more)

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "currency.ts"
Cohesion: 0.26
Nodes (12): BoardModal(), DOT, Props, baseBoardDefs(), BOARD_ICONS, col(), COLUMN_COLORS, defaultColumns() (+4 more)

### Community 61 - "useCompany"
Cohesion: 0.23
Nodes (11): CompanyTeamPanel(), CompanySwitcher(), CompanyProvider(), useCompany(), usePlan(), useToast(), ReferenceView(), c() (+3 more)

### Community 65 - "pcClean.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 66 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.23
Nodes (7): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps, useDocumentViewMode(), loadDocumentWorkspaceMode(), loadTranslatorWorkspaceMode(), Documents()

### Community 67 - "News.tsx"
Cohesion: 0.35
Nodes (9): isWorkday(), addCalendarDays(), addWorkdays(), DateCalc(), diffDays(), diffWorkdays(), fmt(), fmtLong() (+1 more)

### Community 68 - "ToastContext.tsx"
Cohesion: 0.22
Nodes (8): root, rootElement, STYLE, Toast, ToastApi, ToastCtx, ToastKind, ToastProvider()

### Community 69 - "PdfCompress.tsx"
Cohesion: 0.27
Nodes (7): DEFAULT_SITES, loadSites(), msColor(), NetworkChecker(), PingTarget, saveSites(), TestResult

### Community 70 - "settingsBackup.ts"
Cohesion: 0.46
Nodes (6): parseSettingsBackup(), settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME

### Community 71 - "Icon.tsx"
Cohesion: 0.14
Nodes (7): Cmd, CommandPalette(), COMMANDS, DocumentWorkspace, STEPS, IconName, PATHS

### Community 72 - "plan.tsx"
Cohesion: 0.21
Nodes (9): buildLocalDataContext(), AiChat, AiMessage, useAi(), Ai(), ChatItem, MessageItem, QUICK_QUESTIONS (+1 more)

### Community 73 - "pcClean.ts"
Cohesion: 0.33
Nodes (8): checkRunningBrowsers(), cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp(), TempDirInfo

### Community 74 - "QuickNotes.tsx"
Cohesion: 0.43
Nodes (4): emitPlannerReload(), loadNotes(), Note, QuickNotes()

### Community 75 - "onecBackupScheduler.ts"
Cohesion: 0.60
Nodes (5): BackupScheduleConfig, getConfigPath(), initBackupScheduler(), readBackupConfig(), writeBackupConfig()

### Community 77 - "DividendCalc.tsx"
Cohesion: 0.50
Nodes (4): DividendCalc(), fmt(), TREATIES, TREATY_LABELS

## Knowledge Gaps
- **302 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `supabase.ts` to `CompanyContext.tsx`, `useToast`, `App.tsx`, `ipc.ts`, `referenceRepo.ts`, `Translator.tsx`, `useEvents.ts`, `TrayView.tsx`, `CalendarPage.tsx`, `Finance.tsx`, `numToWords.ts`, `errorReporter.ts`, `Topbar.tsx`, `types.ts`, `useCompany`, `Topbar.tsx`, `Settings.tsx`, `Planner.tsx`, `knowledgeRepo.ts`, `uiScale.ts`, `Sidebar.tsx`, `currency.ts`, `plan.tsx`, `QuickNotes.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `TrayView.tsx` to `CompanyContext.tsx`, `Templates.tsx`, `ipc.ts`, `referenceRepo.ts`, `useEvents.ts`, `Currency.tsx`, `Finance.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`, `types.ts`, `EcpManager.tsx`, `Settings.tsx`, `todayISO`, `Planner.tsx`, `MoneyInput.tsx`, `DigestView.tsx`, `FocusView.tsx`, `WidgetBoundary`, `useCompany`, `News.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `useCompany()` connect `useCompany` to `useCompany`, `CompanyContext.tsx`, `Topbar.tsx`, `DocumentViewModeSwitch.tsx`, `useToast`, `Templates.tsx`, `ipc.ts`, `Planner.tsx`, `Translator.tsx`, `CalendarPage.tsx`, `Finance.tsx`, `pcClean.ts`, `numToWords.ts`, `TaxCalculator.tsx`, `Dashboard.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05487269534679543 - nodes in this community are weakly interconnected._
- **Should `onecApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._