# Graph Report - src  (2026-07-17)

## Corpus Check
- 250 files · ~323,646 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1387 nodes · 3305 edges · 71 communities (68 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e78dc36`
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
- useCompany
- Topbar.tsx
- Icon.tsx
- supabase.ts
- Settings.tsx
- Tools.tsx
- taxSeeder.ts
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
- CurrencyHistory.tsx
- useNotifications.ts
- WidgetBoundary
- onecProcess.ts
- uiScale.ts
- PdfConvert.tsx
- Transliterate.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- currency.ts
- weather.ts
- vite-env.d.ts
- PLAN_LIMITS
- pcClean.ts
- OcrTool.tsx
- newsFeed.ts
- DateCalc.tsx
- BoardKanban.tsx
- Icon.tsx

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 49 edges
2. `useCompany()` - 33 edges
3. `supabase` - 32 edges
4. `BxEvent` - 32 edges
5. `useToast()` - 31 edges
6. `usePlan()` - 29 edges
7. `registerIpcHandlers()` - 28 edges
8. `Templates()` - 17 edges
9. `Translator()` - 17 edges
10. `EventStatus` - 16 edges

## Surprising Connections (you probably didn't know these)
- `CurrencyExportRow` --references--> `CurrencyRate`  [EXTRACTED]
  src/renderer/pages/Currency.tsx → shared/types.ts
- `Currency()` --calls--> `todayISO()`  [EXTRACTED]
  src/renderer/pages/Currency.tsx → renderer/lib/dates.ts
- `BxBridge` --references--> `UpdateSnapshot`  [EXTRACTED]
  renderer/lib/onecApi.ts → main/services/updatePolicy.ts
- `BxBridge` --references--> `SiteResetMode`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts
- `BxBridge` --references--> `SiteSessionResult`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts

## Import Cycles
- None detected.

## Communities (71 total, 3 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.14
Nodes (17): ACCENT, CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row() (+9 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.10
Nodes (25): CompanyWizardInitial, Props, WEEKDAYS, Props, statusMeta, TaskPanel(), CompanyCtx, Ctx (+17 more)

### Community 3 - "useToast"
Cohesion: 0.07
Nodes (37): CompanyProvider(), check(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, useToast() (+29 more)

### Community 4 - "Library.tsx"
Cohesion: 0.09
Nodes (41): Cmd, CommandPalette(), COMMANDS, KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle (+33 more)

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
Cohesion: 0.16
Nodes (22): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, BxTheme (+14 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.09
Nodes (35): indicators, paymentCodes, taxes, dutyItems, penaltyItems, regions, statItems, travelNorms (+27 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.19
Nodes (14): COMPANY_ROLE_LABELS, CompanyRole, supabase, Props, describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity (+6 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.09
Nodes (27): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps, useDocumentViewMode(), TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps (+19 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.19
Nodes (12): PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS, collectEventPages() (+4 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 14 - "widgetsApi.ts"
Cohesion: 0.09
Nodes (20): TraderInfo, api, BxApi, BxBridge, Condition, fetchRatesDirect(), FLAGS, mapRate() (+12 more)

### Community 15 - "localDb.ts"
Cohesion: 0.14
Nodes (17): CompareFieldRowProps, ConflictModal(), ConflictModalProps, db, ExchangeRate, SyncConflict, getConflicts(), resolveConflict() (+9 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.14
Nodes (21): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, CurrencyExportRow (+13 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.17
Nodes (18): parseBankStatement(), ParsedTransaction, BxTransaction, exportTransactionsToExcel(), filterPayments(), paymentDayDiff(), paymentSummary(), paymentTiming() (+10 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.16
Nodes (22): Props, CalCard, PRI_COLOR, Props, TYPE_ICON, Props, Props, fmtDate() (+14 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.17
Nodes (16): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+8 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.23
Nodes (12): fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), BankCheck(), CheckResult (+4 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.07
Nodes (39): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, root, rootElement (+31 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.13
Nodes (23): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+15 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.21
Nodes (11): App(), Topbar(), search(), applyTheme(), BX_THEMES, currentTheme(), nextTheme(), normalizeTheme() (+3 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.10
Nodes (21): CompanySwitcher(), OnboardingWizard(), Step, STEPS, PRO_PERKS, useCompany(), Ctx, DEFAULT_PLAN_LIMITS (+13 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.20
Nodes (11): Button(), Props, styles, Variant, Props, formatBytes(), onecApi, CacheCleaner() (+3 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (9): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+1 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.17
Nodes (11): AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass() (+3 more)

### Community 28 - "main.ts"
Cohesion: 0.16
Nodes (21): broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), createTray(), createTrayWindow(), downloadAsset(), gotLock, loadTrayState() (+13 more)

### Community 29 - "types.ts"
Cohesion: 0.19
Nodes (16): CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, subscribePlannerReload(), cacheKey(), DatedCard (+8 more)

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
Cohesion: 0.18
Nodes (17): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+9 more)

### Community 34 - "Topbar.tsx"
Cohesion: 0.22
Nodes (14): BxCounterparty, useCounterparties(), baseTx, COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS (+6 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.29
Nodes (11): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchText(), FLAGS, numeric(), parseAloqabankRates() (+3 more)

### Community 36 - "supabase.ts"
Cohesion: 0.26
Nodes (12): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+4 more)

### Community 37 - "Settings.tsx"
Cohesion: 0.26
Nodes (12): BoardModal(), DOT, Props, baseBoardDefs(), BOARD_ICONS, col(), COLUMN_COLORS, defaultColumns() (+4 more)

### Community 39 - "taxSeeder.ts"
Cohesion: 0.24
Nodes (13): CompanyProfileWizard(), defaultRuleIds(), initialProfile(), addDaysISO(), buildTaxDeadlineEvents(), buildTaxDeadlineRuleOptions(), CompanyRegime, CompanyTaxProfile (+5 more)

### Community 40 - "workbenchCatalog.ts"
Cohesion: 0.20
Nodes (13): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchKind, WorkbenchProposal (+5 more)

### Community 41 - "InpsCalc.tsx"
Cohesion: 0.25
Nodes (8): fmt(), InpsCalc(), fmt(), SalaryCalc(), calcPayroll(), DEFAULT_RATES, PayrollRates, PayrollResult

### Community 42 - "todayISO"
Cohesion: 0.15
Nodes (20): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE (+12 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.31
Nodes (11): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+3 more)

### Community 44 - "BxEvent"
Cohesion: 0.18
Nodes (14): FALLBACK_VALUES, useEconomicIndicators(), Calc(), fmt(), NdflCalc(), CalcPrefill, peekCalcPrefill(), takeCalcPrefill() (+6 more)

### Community 45 - "MoneyInput.tsx"
Cohesion: 0.24
Nodes (9): DividendCalc(), fmt(), TREATIES, TREATY_LABELS, format(), MoneyInput(), Props, fmt() (+1 more)

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
Cohesion: 0.11
Nodes (25): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), TaxDeadline, taxDeadlines (+17 more)

### Community 51 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 52 - "useNotifications.ts"
Cohesion: 0.24
Nodes (9): buildTaskNotification(), BxNotification, ROW, formatDueDate(), GlobalNotificationRow, NotificationSource, NotificationTarget, TaskNotificationRow (+1 more)

### Community 53 - "WidgetBoundary"
Cohesion: 0.19
Nodes (11): uid(), BUILT_IN_CHECKLIST_TEMPLATES, CardModal(), fmtDateTime(), LABEL_PALETTE, PRIORITY_OPTS, emitPlannerReload(), ChecklistItem (+3 more)

### Community 54 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

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
Cohesion: 0.14
Nodes (26): registerIpcHandlers(), fetchRateOnDate(), fetchRates(), parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile(), cleanup() (+18 more)

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "currency.ts"
Cohesion: 0.30
Nodes (13): detectAndRegisterConflict(), addToSyncQueue(), getSyncQueue(), isTransientError(), pushItem(), PushResult, removeFromSyncQueue(), saveSyncQueue() (+5 more)

### Community 61 - "weather.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 65 - "pcClean.ts"
Cohesion: 0.21
Nodes (9): EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props, COLUMNS, groupEventsByStatus(), PRIORITY_BORDER (+1 more)

### Community 66 - "OcrTool.tsx"
Cohesion: 0.50
Nodes (4): escapeHtml(), HTML_ENTITIES, LANGUAGES, OcrTool()

### Community 67 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 69 - "DateCalc.tsx"
Cohesion: 0.30
Nodes (10): isWorkday(), EventModal(), addCalendarDays(), addWorkdays(), DateCalc(), diffDays(), diffWorkdays(), fmt() (+2 more)

### Community 70 - "BoardKanban.tsx"
Cohesion: 0.19
Nodes (12): Props, AddCardPayload, BoardKanban(), COLOR_MAP, fmtDate(), isOverdue(), PRIORITY_BAR, Props (+4 more)

### Community 71 - "Icon.tsx"
Cohesion: 0.20
Nodes (4): DocumentWorkspace, STEPS, IconName, PATHS

## Knowledge Gaps
- **309 isolated node(s):** `rates`, `EXTRA_CURRENCIES`, `ALL_CODES`, `ForeignCode`, `ChangelogEntry` (+304 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `widgetsApi.ts` to `CompanyContext.tsx`, `useToast`, `Library.tsx`, `ipc.ts`, `referenceRepo.ts`, `Translator.tsx`, `useEvents.ts`, `TrayView.tsx`, `localDb.ts`, `Finance.tsx`, `numToWords.ts`, `errorReporter.ts`, `Topbar.tsx`, `types.ts`, `syncQueue.ts`, `useCompany`, `supabase.ts`, `Settings.tsx`, `taxSeeder.ts`, `Planner.tsx`, `useNotifications.ts`, `WidgetBoundary`, `currency.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `todayISO` to `EcpManager.tsx`, `pcClean.ts`, `CompanyContext.tsx`, `DateCalc.tsx`, `BoardKanban.tsx`, `Templates.tsx`, `taxSeeder.ts`, `ipc.ts`, `Planner.tsx`, `BxEvent`, `TrayView.tsx`, `useEvents.ts`, `localDb.ts`, `Currency.tsx`, `Finance.tsx`, `DigestView.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `Calc.tsx`, `CompanyContext.tsx`, `Topbar.tsx`, `Library.tsx`, `Templates.tsx`, `ipc.ts`, `Planner.tsx`, `BxEvent`, `Translator.tsx`, `Finance.tsx`, `numToWords.ts`, `WidgetBoundary`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `rates`, `EXTRA_CURRENCIES`, `ALL_CODES` to the rest of the system?**
  _309 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09915966386554621 - nodes in this community are weakly interconnected._