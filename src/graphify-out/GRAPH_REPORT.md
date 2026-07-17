# Graph Report - src  (2026-07-17)

## Corpus Check
- 252 files · ~324,280 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1398 nodes · 3331 edges · 71 communities (67 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3b96bcc0`
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
- DocumentViewModeSwitch.tsx
- DateCalc.tsx
- Icon.tsx

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 49 edges
2. `useCompany()` - 33 edges
3. `supabase` - 33 edges
4. `BxEvent` - 32 edges
5. `useToast()` - 31 edges
6. `usePlan()` - 29 edges
7. `registerIpcHandlers()` - 28 edges
8. `Templates()` - 17 edges
9. `Translator()` - 17 edges
10. `EventStatus` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Currency()` --calls--> `todayISO()`  [EXTRACTED]
  src/renderer/pages/Currency.tsx → renderer/lib/dates.ts
- `WidgetBridge` --references--> `BankExchangeRate`  [EXTRACTED]
  renderer/lib/widgetsApi.ts → src/shared/types.ts
- `BxBridge` --references--> `UpdateSnapshot`  [EXTRACTED]
  renderer/lib/onecApi.ts → main/services/updatePolicy.ts
- `BxBridge` --references--> `SiteResetMode`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts
- `BxBridge` --references--> `SiteSessionResult`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts

## Import Cycles
- None detected.

## Communities (71 total, 4 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.14
Nodes (17): ACCENT, CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row() (+9 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.14
Nodes (18): CompanyWizardInitial, Props, WEEKDAYS, CompanyCtx, Ctx, buildCompanyInsert(), companiesRepo, CalendarEvent (+10 more)

### Community 3 - "useToast"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 4 - "Library.tsx"
Cohesion: 0.08
Nodes (42): KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext(), retrieveArticles() (+34 more)

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
Cohesion: 0.14
Nodes (13): CompanyTeamPanel(), CompanySwitcher(), PRO_PERKS, useCompany(), STYLE, Toast, ToastApi, ToastCtx (+5 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.14
Nodes (24): indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode, ReferenceSection (+16 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.21
Nodes (12): COMPANY_ROLE_LABELS, CompanyRole, supabase, describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member (+4 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.11
Nodes (23): TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName() (+15 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.23
Nodes (9): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, GovTab(), LawTab() (+1 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 14 - "widgetsApi.ts"
Cohesion: 0.10
Nodes (10): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyExportRow (+2 more)

### Community 15 - "localDb.ts"
Cohesion: 0.27
Nodes (7): Props, statusMeta, TaskPanel(), TaskRow, tasksRepo, TaskPriority, TaskStatus

### Community 16 - "Currency.tsx"
Cohesion: 0.14
Nodes (20): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo() (+12 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.16
Nodes (19): parseBankStatement(), ParsedTransaction, BxTransaction, exportTransactionsToExcel(), baseTx, filterPayments(), paymentDayDiff(), paymentSummary() (+11 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.11
Nodes (33): Props, CalCard, Props, PRI_COLOR, Props, TYPE_ICON, Props, PRIORITY_LABELS (+25 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.18
Nodes (15): CompanyRoleGuide(), ROLE_TONES, INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE, CompanyMemberStatus (+7 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.15
Nodes (17): check(), fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), CheckResult (+9 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.05
Nodes (60): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, root, rootElement (+52 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.08
Nodes (41): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+33 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.19
Nodes (12): App(), Topbar(), search(), applyTheme(), BX_THEMES, currentTheme(), nextTheme(), normalizeTheme() (+4 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.18
Nodes (12): OnboardingWizard(), Step, STEPS, Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan (+4 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.17
Nodes (17): Button(), Props, styles, Variant, Props, BxBridge, formatBytes(), onecApi (+9 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.29
Nodes (3): Props, State, WidgetBoundary

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.17
Nodes (11): AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass() (+3 more)

### Community 28 - "main.ts"
Cohesion: 0.16
Nodes (21): broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), createTray(), createTrayWindow(), downloadAsset(), gotLock, loadTrayState() (+13 more)

### Community 29 - "types.ts"
Cohesion: 0.25
Nodes (9): applyBankDirectory(), BankDirectoryRow, DEFAULT_BANK_DIRECTORY, fromRow(), loadBankDirectory(), directory, rates, BankDirectoryEntry (+1 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.10
Nodes (19): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+11 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.22
Nodes (11): getNewsItem(), LEGISLATION_NEWS, NewsItem, News(), NEWS_SOURCES, openLink(), buildAiPrompt(), buildTaskNote() (+3 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 33 - "useCompany"
Cohesion: 0.13
Nodes (24): useDocumentViewMode(), ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar() (+16 more)

### Community 34 - "Topbar.tsx"
Cohesion: 0.14
Nodes (21): BxCounterparty, NewCounterparty, useCounterparties(), COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS (+13 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.24
Nodes (13): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchRateOnDate(), fetchRates(), fetchText(), FLAGS (+5 more)

### Community 36 - "supabase.ts"
Cohesion: 0.26
Nodes (12): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+4 more)

### Community 37 - "Settings.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

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
Cohesion: 0.24
Nodes (14): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE (+6 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.20
Nodes (15): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), subscribePlannerReload() (+7 more)

### Community 44 - "BxEvent"
Cohesion: 0.26
Nodes (10): Calc(), CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES (+2 more)

### Community 45 - "MoneyInput.tsx"
Cohesion: 0.19
Nodes (12): useEconomicIndicators(), DividendCalc(), fmt(), TREATIES, TREATY_LABELS, format(), MoneyInput(), Props (+4 more)

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
Cohesion: 0.18
Nodes (13): fetchTrader(), TraderInfo, checkRunningBrowsers(), cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents() (+5 more)

### Community 50 - "FocusView.tsx"
Cohesion: 0.11
Nodes (24): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), TaxDeadline, taxDeadlines (+16 more)

### Community 51 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 52 - "useNotifications.ts"
Cohesion: 0.27
Nodes (8): buildTaskNotification(), ROW, formatDueDate(), GlobalNotificationRow, NotificationSource, NotificationTarget, TaskNotificationRow, BASE_ROW

### Community 53 - "WidgetBoundary"
Cohesion: 0.05
Nodes (55): Cmd, CommandPalette(), COMMANDS, CompanyProvider(), uid(), Props, AddCardPayload, BoardKanban() (+47 more)

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
Cohesion: 0.21
Nodes (18): registerIpcHandlers(), cleanup(), parseCertInfo(), pickFileToSign(), pickSigFile(), signFile(), SignResult, VerifyResult (+10 more)

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "currency.ts"
Cohesion: 0.15
Nodes (22): CompareFieldRowProps, ConflictModal(), ConflictModalProps, db, ExchangeRate, SyncConflict, detectAndRegisterConflict(), getConflicts() (+14 more)

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

### Community 68 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.33
Nodes (3): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps

### Community 69 - "DateCalc.tsx"
Cohesion: 0.50
Nodes (4): parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile()

## Knowledge Gaps
- **312 isolated node(s):** `rates`, `directory`, `BankDirectoryRow`, `EXTRA_CURRENCIES`, `ALL_CODES` (+307 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `widgetsApi.ts` to `CompanyContext.tsx`, `useToast`, `Library.tsx`, `referenceRepo.ts`, `Translator.tsx`, `TrayView.tsx`, `localDb.ts`, `Finance.tsx`, `numToWords.ts`, `errorReporter.ts`, `Topbar.tsx`, `types.ts`, `syncQueue.ts`, `useCompany`, `supabase.ts`, `taxSeeder.ts`, `Planner.tsx`, `useNotifications.ts`, `WidgetBoundary`, `currency.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `todayISO` to `CompanyContext.tsx`, `Templates.tsx`, `ipc.ts`, `referenceRepo.ts`, `TrayView.tsx`, `Currency.tsx`, `Finance.tsx`, `ListView.tsx`, `errorReporter.ts`, `CalendarView.tsx`, `CacheCleaner.tsx`, `horoscope.ts`, `EcpManager.tsx`, `Topbar.tsx`, `Settings.tsx`, `taxSeeder.ts`, `Planner.tsx`, `MoneyInput.tsx`, `DigestView.tsx`, `WidgetBoundary`, `currency.ts`, `pcClean.ts`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `useToast()` connect `ipc.ts` to `Calc.tsx`, `CompanyContext.tsx`, `Topbar.tsx`, `Library.tsx`, `useToast`, `Templates.tsx`, `Planner.tsx`, `BxEvent`, `Translator.tsx`, `Finance.tsx`, `numToWords.ts`, `TaxCalculator.tsx`, `WidgetBoundary`, `errorReporter.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `rates`, `directory`, `BankDirectoryRow` to the rest of the system?**
  _312 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14492753623188406 - nodes in this community are weakly interconnected._