# Graph Report - src  (2026-07-18)

## Corpus Check
- 261 files · ~5,063,463 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1511 nodes · 3604 edges · 82 communities (78 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `98ac4000`
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
- widgetsApi.ts
- localDb.ts
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
- App.tsx
- Topbar.tsx
- Icon.tsx
- supabase.ts
- Settings.tsx
- InnCheckTool.tsx
- taxSeeder.ts
- workbenchCatalog.ts
- InpsCalc.tsx
- todayISO
- Planner.tsx
- BxEvent
- MoneyInput.tsx
- newsFeed.ts
- onecProcess.ts
- onecCache.ts
- pcClean.ts
- FocusView.tsx
- CurrencyHistory.tsx
- uiScale.ts
- InnCheck.tsx
- onecProcess.ts
- uiScale.ts
- PdfConvert.tsx
- Transliterate.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- EimzoDiag.tsx
- uzHolidays.ts
- vite-env.d.ts
- PLAN_LIMITS
- servicesRepo.ts
- OcrTool.tsx
- useBoards.ts
- Icon.tsx
- DateCalc.tsx
- taxCalendar.ts
- newsFeed.ts
- taxSeeder.ts
- DailyTasksModal.tsx
- tasksRepo.ts
- QuickNotes.tsx
- Sidebar.tsx
- TxModal.tsx
- SystemTaskBoard.tsx
- NetworkChecker.tsx
- useToast
- loadCycle

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 51 edges
2. `useCompany()` - 37 edges
3. `supabase` - 35 edges
4. `BxEvent` - 34 edges
5. `useToast()` - 33 edges
6. `usePlan()` - 29 edges
7. `registerIpcHandlers()` - 28 edges
8. `BixWidget()` - 27 edges
9. `EventStatus` - 18 edges
10. `Templates()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `CurrencyExportRow` --references--> `CurrencyRate`  [EXTRACTED]
  renderer/pages/Currency.tsx → shared/types.ts
- `BxBridge` --references--> `UpdateSnapshot`  [EXTRACTED]
  renderer/lib/onecApi.ts → main/services/updatePolicy.ts
- `BxBridge` --references--> `SiteResetMode`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts
- `BxBridge` --references--> `SiteSessionResult`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts
- `WidgetBridge` --references--> `BankExchangeRate`  [EXTRACTED]
  renderer/lib/widgetsApi.ts → shared/types.ts

## Import Cycles
- None detected.

## Communities (82 total, 4 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.17
Nodes (18): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+10 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.08
Nodes (38): getNewsItem(), LEGISLATION_NEWS, NewsItem, indicators, paymentCodes, taxes, DataMeta, Indicator (+30 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.12
Nodes (24): CompanyProfileWizard(), CompanyWizardInitial, defaultRuleIds(), EMPTY_DETAILS, formCalendarHint(), formLabel(), initialProfile(), LEGAL_FORMS (+16 more)

### Community 3 - "useToast"
Cohesion: 0.06
Nodes (54): CompareFieldRowProps, ConflictModal(), ConflictModalProps, parseBankStatement(), ParsedTransaction, BxTransaction, db, ExchangeRate (+46 more)

### Community 4 - "Library.tsx"
Cohesion: 0.10
Nodes (37): KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext(), retrieveArticles() (+29 more)

### Community 5 - "App.tsx"
Cohesion: 0.13
Nodes (17): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+9 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.11
Nodes (29): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META (+21 more)

### Community 8 - "ipc.ts"
Cohesion: 0.15
Nodes (24): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, BxTheme (+16 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.11
Nodes (24): DocumentViewMode, TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords() (+16 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.39
Nodes (9): App(), Topbar(), search(), applyTheme(), BX_THEMES, currentTheme(), nextTheme(), normalizeTheme() (+1 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.06
Nodes (35): AccuracyKind, ACTIONS, AnimationSpeed, BIX_JOKES, BIX_PHRASES, BixAchievement, BixAchievementProgress, BixActivity (+27 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.18
Nodes (12): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, ReferenceView(), RefTabId (+4 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.14
Nodes (26): AuthGate(), PinScreen(), Props, AttemptsData, clearPin(), getAttemptsData(), getAttemptsLeft(), hasPin() (+18 more)

### Community 14 - "widgetsApi.ts"
Cohesion: 0.21
Nodes (14): BxCounterparty, NewCounterparty, useCounterparties(), COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS (+6 more)

### Community 15 - "localDb.ts"
Cohesion: 0.11
Nodes (9): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyRate (+1 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.13
Nodes (22): DEFAULT_BANK_DIRECTORY, ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode (+14 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.13
Nodes (19): uid(), Props, AddCardPayload, BoardKanban(), COLOR_MAP, fmtDate(), isOverdue(), PRIORITY_BAR (+11 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.15
Nodes (14): activityLabel(), CompanyProfileActivityPanel(), dateTime(), LEGAL_FORM_LABELS, canShowReminder(), OnboardingProfile, OnboardingState, OnboardingWizard() (+6 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.53
Nodes (5): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites(), Calc()

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.22
Nodes (14): toastError, SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate(), SUPPORT_CATEGORIES (+6 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.09
Nodes (19): ErrorBoundary, Props, State, isBixWidget, root, rootElement, detectPlatform(), installGlobalErrorReporting() (+11 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.07
Nodes (48): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+40 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.18
Nodes (17): CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, emitPlannerReload(), subscribePlannerReload(), cacheKey() (+9 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.14
Nodes (11): Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan, PlanCtx, PlanLimits, PlanProvider() (+3 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.16
Nodes (16): Button(), Props, styles, Variant, Props, BxBridge, formatBytes(), onecApi (+8 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.15
Nodes (17): check(), fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), CheckResult (+9 more)

### Community 28 - "main.ts"
Cohesion: 0.13
Nodes (31): appAsset(), broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), constrainTrayPosition(), constrainTrayWindowToDisplay(), createTray(), createTrayWindow() (+23 more)

### Community 29 - "types.ts"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.14
Nodes (10): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+2 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.26
Nodes (12): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+4 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.25
Nodes (8): AGE_COEFFS, COMMERCIAL_ENGINES, EngineGroup, fmt(), MOTO_ENGINES, PASSENGER_ENGINES, RecyclingCalc(), VehicleCategory

### Community 33 - "App.tsx"
Cohesion: 0.31
Nodes (8): applyBankDirectory(), BankDirectoryRow, fromRow(), loadBankDirectory(), directory, rates, BankDirectoryEntry, BankExchangeRate

### Community 34 - "Topbar.tsx"
Cohesion: 0.14
Nodes (17): delay(), scan(), animationDelay(), BixWidget(), clampPanelOffset(), isWithinQuietHours(), jokeDelay(), loadBixSettings() (+9 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.24
Nodes (13): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchRateOnDate(), fetchRates(), fetchText(), FLAGS (+5 more)

### Community 36 - "supabase.ts"
Cohesion: 0.17
Nodes (11): AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass() (+3 more)

### Community 37 - "Settings.tsx"
Cohesion: 0.24
Nodes (13): BIX_ECONOMY_QUEUE_KEY, BixEconomyOperation, BixEconomyOperationType, BixEconomyResult, BixEconomyRpc, BixEconomyState, enqueueBixEconomyOperation(), loadBixEconomyQueue() (+5 more)

### Community 38 - "InnCheckTool.tsx"
Cohesion: 0.18
Nodes (13): fetchTrader(), TraderInfo, checkRunningBrowsers(), cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents() (+5 more)

### Community 39 - "taxSeeder.ts"
Cohesion: 0.29
Nodes (9): describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), EventActivity, EventActivityType (+1 more)

### Community 40 - "workbenchCatalog.ts"
Cohesion: 0.27
Nodes (9): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchProposal, WorkbenchSector (+1 more)

### Community 41 - "InpsCalc.tsx"
Cohesion: 0.25
Nodes (8): fmt(), InpsCalc(), fmt(), SalaryCalc(), calcPayroll(), DEFAULT_RATES, PayrollRates, PayrollResult

### Community 42 - "todayISO"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.25
Nodes (13): checkReminders(), getNotified(), markNotified(), dueEvent, ReminderWindow, requestNotificationPermission(), startReminderLoop(), stopReminderLoop() (+5 more)

### Community 44 - "BxEvent"
Cohesion: 0.29
Nodes (9): CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES, fmt() (+1 more)

### Community 45 - "MoneyInput.tsx"
Cohesion: 0.17
Nodes (13): ACCENT, CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row() (+5 more)

### Community 46 - "newsFeed.ts"
Cohesion: 0.24
Nodes (9): buildTaskNotification(), BxNotification, ROW, formatDueDate(), GlobalNotificationRow, NotificationSource, NotificationTarget, TaskNotificationRow (+1 more)

### Community 47 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 48 - "onecCache.ts"
Cohesion: 0.44
Nodes (8): cleanCache(), copyFolderRecursive(), dirSize(), getCacheRoots(), getV8iPath(), parseV8i(), scanCache(), CacheEntry

### Community 49 - "pcClean.ts"
Cohesion: 0.50
Nodes (4): parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile()

### Community 50 - "FocusView.tsx"
Cohesion: 0.25
Nodes (7): calculateRegimeComparison(), fmt(), parseMln(), RegimeCompareCalc(), RegimeInputs, RegimeOutcome, TaxRegime

### Community 51 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 52 - "uiScale.ts"
Cohesion: 0.20
Nodes (11): DividendCalc(), fmt(), TREATIES, TREATY_LABELS, format(), MoneyInput(), Props, fmt() (+3 more)

### Community 53 - "InnCheck.tsx"
Cohesion: 0.22
Nodes (8): DocumentViewModeSwitch(), DocumentViewModeSwitchProps, useDocumentViewMode(), BxUserDocument, useDocuments(), CATEGORIES, CATEGORY_ICON, Documents()

### Community 54 - "onecProcess.ts"
Cohesion: 0.47
Nodes (4): createCanonicalEvent(), loadNotes(), Note, QuickNotes()

### Community 55 - "uiScale.ts"
Cohesion: 0.24
Nodes (13): createSiteWindow(), openSiteSession(), partitionFor(), resetSiteSession(), secureWebPreferences(), siteWindows, BusyAction, PRESETS (+5 more)

### Community 56 - "PdfConvert.tsx"
Cohesion: 0.48
Nodes (5): escapeDocumentHtml(), groupPdfTextItems(), HTML_ENTITIES, PdfConvert(), PdfTextItem

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 58 - "EimzoDiag.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 61 - "uzHolidays.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 65 - "servicesRepo.ts"
Cohesion: 0.26
Nodes (12): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+4 more)

### Community 66 - "OcrTool.tsx"
Cohesion: 0.50
Nodes (4): escapeHtml(), HTML_ENTITIES, LANGUAGES, OcrTool()

### Community 67 - "useBoards.ts"
Cohesion: 0.26
Nodes (12): BoardModal(), DOT, Props, baseBoardDefs(), BOARD_ICONS, col(), COLUMN_COLORS, defaultColumns() (+4 more)

### Community 68 - "Icon.tsx"
Cohesion: 0.15
Nodes (6): Cmd, COMMANDS, DocumentWorkspace, STEPS, IconName, PATHS

### Community 69 - "DateCalc.tsx"
Cohesion: 0.21
Nodes (18): registerIpcHandlers(), cleanup(), parseCertInfo(), pickFileToSign(), pickSigFile(), signFile(), SignResult, VerifyResult (+10 more)

### Community 70 - "taxCalendar.ts"
Cohesion: 0.24
Nodes (10): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), TaxDeadline, taxDeadlines (+2 more)

### Community 71 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 72 - "taxSeeder.ts"
Cohesion: 0.30
Nodes (10): addDaysISO(), buildTaxDeadlineEvents(), buildTaxDeadlineRuleOptions(), CompanyRegime, CompanyTaxProfile, datesForDeadline(), seedTaxDeadlines(), syncTaxDeadlines() (+2 more)

### Community 73 - "DailyTasksModal.tsx"
Cohesion: 0.14
Nodes (21): AllTasksView(), fmtDue(), Item, Props, TYPE_BADGE, CalCard, PRI_COLOR, Props (+13 more)

### Community 74 - "tasksRepo.ts"
Cohesion: 0.27
Nodes (7): Props, statusMeta, TaskPanel(), TaskRow, tasksRepo, TaskPriority, TaskStatus

### Community 75 - "QuickNotes.tsx"
Cohesion: 0.17
Nodes (20): EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS (+12 more)

### Community 76 - "Sidebar.tsx"
Cohesion: 0.17
Nodes (11): CompanySwitcher(), PRO_PERKS, useCompany(), usePlan(), Ai(), ChatItem, MessageItem, QUICK_QUESTIONS (+3 more)

### Community 77 - "TxModal.tsx"
Cohesion: 0.24
Nodes (6): DigestView(), dueChip(), EcpKey, fmtSum(), UnifiedDigestItem, UnpaidTx

### Community 78 - "SystemTaskBoard.tsx"
Cohesion: 0.13
Nodes (20): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup (+12 more)

### Community 79 - "NetworkChecker.tsx"
Cohesion: 0.27
Nodes (7): DEFAULT_SITES, loadSites(), msColor(), NetworkChecker(), PingTarget, saveSites(), TestResult

### Community 80 - "useToast"
Cohesion: 0.33
Nodes (6): CommandPalette(), CompanyProvider(), useToast(), c(), ActiveXConfigurator(), DomainItem

## Knowledge Gaps
- **361 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+356 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `todayISO()` connect `SystemTaskBoard.tsx` to `Calc.tsx`, `CompanyContext.tsx`, `useToast`, `Templates.tsx`, `ipc.ts`, `Translator.tsx`, `localDb.ts`, `Currency.tsx`, `Finance.tsx`, `ListView.tsx`, `CalendarView.tsx`, `types.ts`, `horoscope.ts`, `Topbar.tsx`, `Planner.tsx`, `EimzoDiag.tsx`, `taxSeeder.ts`, `DailyTasksModal.tsx`, `QuickNotes.tsx`, `TxModal.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `supabase` connect `ListView.tsx` to `Settings.tsx`, `Calc.tsx`, `useToast`, `Library.tsx`, `ipc.ts`, `referenceRepo.ts`, `Translator.tsx`, `TrayView.tsx`, `Finance.tsx`, `TaxCalculator.tsx`, `errorReporter.ts`, `Counterparties.tsx`, `Topbar.tsx`, `types.ts`, `App.tsx`, `taxSeeder.ts`, `Planner.tsx`, `newsFeed.ts`, `InnCheck.tsx`, `servicesRepo.ts`, `useBoards.ts`, `taxSeeder.ts`, `tasksRepo.ts`, `QuickNotes.tsx`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `Settings.tsx`, `useToast`, `Library.tsx`, `Templates.tsx`, `ipc.ts`, `referenceRepo.ts`, `Planner.tsx`, `Sidebar.tsx`, `MoneyInput.tsx`, `widgetsApi.ts`, `NetworkChecker.tsx`, `ListView.tsx`, `numToWords.ts`, `TaxCalculator.tsx`, `errorReporter.ts`, `onecProcess.ts`, `ReferenceView.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _361 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07982583454281568 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Should `useToast` be split into smaller, more focused modules?**
  _Cohesion score 0.062206572769953054 - nodes in this community are weakly interconnected._