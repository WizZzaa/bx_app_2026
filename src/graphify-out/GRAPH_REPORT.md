# Graph Report - src  (2026-07-17)

## Corpus Check
- 252 files · ~324,675 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1401 nodes · 3340 edges · 71 communities (68 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d6556313`
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
- uiScale.ts

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
- `Settings()` --calls--> `isPinEnabled()`  [EXTRACTED]
  src/renderer/pages/Settings.tsx → renderer/lib/auth/pin.ts
- `Settings()` --calls--> `useCompany()`  [EXTRACTED]
  src/renderer/pages/Settings.tsx → renderer/lib/CompanyContext.tsx
- `Settings()` --calls--> `todayISO()`  [EXTRACTED]
  src/renderer/pages/Settings.tsx → renderer/lib/dates.ts
- `Settings()` --calls--> `loadEcpKeys()`  [EXTRACTED]
  src/renderer/pages/Settings.tsx → renderer/lib/ecpStorage.ts
- `Settings()` --calls--> `usePlan()`  [EXTRACTED]
  src/renderer/pages/Settings.tsx → renderer/lib/plan.tsx

## Import Cycles
- None detected.

## Communities (71 total, 3 thin omitted)

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
Cohesion: 0.08
Nodes (44): PRO_PERKS, KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext() (+36 more)

### Community 5 - "App.tsx"
Cohesion: 0.15
Nodes (14): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+6 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.12
Nodes (28): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META, getFieldGroup() (+20 more)

### Community 8 - "ipc.ts"
Cohesion: 0.17
Nodes (18): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, BxTheme (+10 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.11
Nodes (30): Topbar(), indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode (+22 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.29
Nodes (9): describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), EventActivity, EventActivityType (+1 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.11
Nodes (23): TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName() (+15 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.20
Nodes (11): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, RefTabId, tabs (+3 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 14 - "widgetsApi.ts"
Cohesion: 0.11
Nodes (11): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyExportRow (+3 more)

### Community 15 - "localDb.ts"
Cohesion: 0.22
Nodes (16): PinScreen(), Props, AttemptsData, getAttemptsData(), getAttemptsLeft(), isLocked(), LockStatus, pureDjb2() (+8 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.14
Nodes (20): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo() (+12 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.19
Nodes (16): CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, subscribePlannerReload(), cacheKey(), DatedCard (+8 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.13
Nodes (22): Item, Props, TYPE_BADGE, CalCard, PRI_COLOR, Props, TYPE_ICON, Props (+14 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.07
Nodes (39): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, CompanyProvider(), canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS (+31 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.23
Nodes (12): fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), BankCheck(), CheckResult (+4 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.13
Nodes (13): ErrorBoundary, Props, State, root, rootElement, detectPlatform(), installGlobalErrorReporting(), reportError() (+5 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.13
Nodes (22): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+14 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.16
Nodes (11): App(), Cmd, CommandPalette(), COMMANDS, applyTheme(), BX_THEMES, currentTheme(), nextTheme() (+3 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.15
Nodes (16): CompanySwitcher(), OnboardingWizard(), Step, STEPS, useCompany(), Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits() (+8 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.14
Nodes (18): api, BxApi, Button(), Props, styles, Variant, Props, BxBridge (+10 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.26
Nodes (12): BoardModal(), DOT, Props, baseBoardDefs(), BOARD_ICONS, col(), COLUMN_COLORS, defaultColumns() (+4 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.17
Nodes (11): AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass() (+3 more)

### Community 28 - "main.ts"
Cohesion: 0.15
Nodes (24): appAsset(), broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), createTray(), createTrayWindow(), createWindow(), downloadAsset() (+16 more)

### Community 29 - "types.ts"
Cohesion: 0.27
Nodes (8): applyBankDirectory(), BankDirectoryRow, DEFAULT_BANK_DIRECTORY, fromRow(), loadBankDirectory(), directory, rates, BankDirectoryEntry

### Community 30 - "horoscope.ts"
Cohesion: 0.06
Nodes (35): Props, State, WidgetBoundary, HoroscopeWidget(), EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge (+27 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.22
Nodes (11): getNewsItem(), LEGISLATION_NEWS, NewsItem, News(), NEWS_SOURCES, openLink(), buildAiPrompt(), buildTaskNote() (+3 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.28
Nodes (10): AuthGate(), clearPin(), hasPin(), isPinEnabled(), setPinEnabled(), AuthState, useAuth(), getIdleTimeout() (+2 more)

### Community 33 - "useCompany"
Cohesion: 0.20
Nodes (14): useDocumentViewMode(), ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar() (+6 more)

### Community 34 - "Topbar.tsx"
Cohesion: 0.35
Nodes (9): isWorkday(), addCalendarDays(), addWorkdays(), DateCalc(), diffDays(), diffWorkdays(), fmt(), fmtLong() (+1 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.24
Nodes (13): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchRateOnDate(), fetchRates(), fetchText(), FLAGS (+5 more)

### Community 36 - "supabase.ts"
Cohesion: 0.21
Nodes (16): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+8 more)

### Community 37 - "Settings.tsx"
Cohesion: 0.22
Nodes (12): Props, buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), Props, STATUS_LABELS (+4 more)

### Community 39 - "taxSeeder.ts"
Cohesion: 0.20
Nodes (10): EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS (+2 more)

### Community 40 - "workbenchCatalog.ts"
Cohesion: 0.12
Nodes (22): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchKind, WorkbenchProposal (+14 more)

### Community 41 - "InpsCalc.tsx"
Cohesion: 0.25
Nodes (8): fmt(), InpsCalc(), fmt(), SalaryCalc(), calcPayroll(), DEFAULT_RATES, PayrollRates, PayrollResult

### Community 42 - "todayISO"
Cohesion: 0.36
Nodes (5): uid(), emitPlannerReload(), loadNotes(), Note, QuickNotes()

### Community 43 - "Planner.tsx"
Cohesion: 0.21
Nodes (14): supabase, checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner() (+6 more)

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
Cohesion: 0.33
Nodes (8): checkRunningBrowsers(), cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp(), TempDirInfo

### Community 50 - "FocusView.tsx"
Cohesion: 0.15
Nodes (17): SpecialDay, UZ_PRODUCTION_CALENDAR_2026_SOURCES, CalBoard, CalendarView(), formatCalendarDate(), formatFullDate(), formatShortDate(), formatWeekday() (+9 more)

### Community 51 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 52 - "useNotifications.ts"
Cohesion: 0.24
Nodes (9): buildTaskNotification(), BxNotification, ROW, formatDueDate(), GlobalNotificationRow, NotificationSource, NotificationTarget, TaskNotificationRow (+1 more)

### Community 53 - "WidgetBoundary"
Cohesion: 0.13
Nodes (18): Props, AddCardPayload, BoardKanban(), COLOR_MAP, fmtDate(), isOverdue(), PRIORITY_BAR, Props (+10 more)

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
Cohesion: 0.33
Nodes (10): registerIpcHandlers(), backupDatabase(), pickBackupDir(), pickDatabaseFile(), timestamp(), BackupScheduleConfig, getConfigPath(), initBackupScheduler() (+2 more)

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "currency.ts"
Cohesion: 0.05
Nodes (63): CompareFieldRowProps, ConflictModal(), ConflictModalProps, parseBankStatement(), ParsedTransaction, BusinessBxDatabase, BxCounterparty, BxTransaction (+55 more)

### Community 61 - "weather.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 65 - "pcClean.ts"
Cohesion: 0.18
Nodes (15): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), EVENT_TYPE_LABELS, formatPlannerDate() (+7 more)

### Community 66 - "OcrTool.tsx"
Cohesion: 0.50
Nodes (4): escapeHtml(), HTML_ENTITIES, LANGUAGES, OcrTool()

### Community 67 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 68 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.12
Nodes (7): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps, DocumentWorkspace, STEPS, IconName, PATHS

### Community 69 - "DateCalc.tsx"
Cohesion: 0.16
Nodes (15): parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile(), cleanup(), parseCertInfo(), pickFileToSign(), pickSigFile() (+7 more)

### Community 70 - "uiScale.ts"
Cohesion: 0.71
Nodes (5): applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, normalizeFontScale(), saveFontScale()

## Knowledge Gaps
- **313 isolated node(s):** `gotLock`, `TrayState`, `Props`, `NotifyDays`, `IdleLock` (+308 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `todayISO()` connect `pcClean.ts` to `CompanyContext.tsx`, `Topbar.tsx`, `Settings.tsx`, `Templates.tsx`, `taxSeeder.ts`, `referenceRepo.ts`, `ipc.ts`, `Planner.tsx`, `TrayView.tsx`, `DigestView.tsx`, `Currency.tsx`, `ListView.tsx`, `WidgetBoundary`, `CacheCleaner.tsx`, `currency.ts`, `horoscope.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `supabase` connect `Planner.tsx` to `CompanyContext.tsx`, `useToast`, `Library.tsx`, `ipc.ts`, `referenceRepo.ts`, `widgetsApi.ts`, `Translator.tsx`, `TrayView.tsx`, `Finance.tsx`, `numToWords.ts`, `errorReporter.ts`, `Topbar.tsx`, `Dashboard.tsx`, `types.ts`, `syncQueue.ts`, `EcpManager.tsx`, `useCompany`, `supabase.ts`, `todayISO`, `useNotifications.ts`, `WidgetBoundary`, `currency.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `useToast()` connect `numToWords.ts` to `CompanyContext.tsx`, `useToast`, `Library.tsx`, `App.tsx`, `Templates.tsx`, `ipc.ts`, `todayISO`, `Planner.tsx`, `BxEvent`, `Translator.tsx`, `currency.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `Props` to the rest of the system?**
  _313 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05487269534679543 - nodes in this community are weakly interconnected._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07864488808227466 - nodes in this community are weakly interconnected._