# Graph Report - src  (2026-07-18)

## Corpus Check
- 258 files · ~5,062,301 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1490 nodes · 3559 edges · 73 communities (69 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `17e3ccab`
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
- OcrTool.tsx
- DateCalc.tsx
- newsFeed.ts
- DailyTasksModal.tsx
- QuickNotes.tsx
- Sidebar.tsx
- TxModal.tsx
- SystemTaskBoard.tsx

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 51 edges
2. `useCompany()` - 37 edges
3. `supabase` - 35 edges
4. `useToast()` - 33 edges
5. `BxEvent` - 33 edges
6. `usePlan()` - 29 edges
7. `registerIpcHandlers()` - 28 edges
8. `BixWidget()` - 24 edges
9. `EventStatus` - 18 edges
10. `Templates()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `WidgetBridge` --references--> `WeatherData`  [EXTRACTED]
  renderer/lib/widgetsApi.ts → shared/types.ts
- `CurrencyExportRow` --references--> `CurrencyRate`  [EXTRACTED]
  renderer/pages/Currency.tsx → shared/types.ts
- `SiteSessionReset()` --calls--> `normalizeSiteUrl()`  [EXTRACTED]
  renderer/pages/tools/SiteSessionReset.tsx → shared/siteSession.ts
- `setDownloadProgress()` --calls--> `calculateDownloadPercent()`  [EXTRACTED]
  main.ts → main/services/updatePolicy.ts
- `checkManualUpdate()` --calls--> `isNewerVersion()`  [EXTRACTED]
  main.ts → main/services/updatePolicy.ts

## Import Cycles
- None detected.

## Communities (73 total, 4 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.17
Nodes (18): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+10 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.08
Nodes (38): getNewsItem(), LEGISLATION_NEWS, NewsItem, indicators, paymentCodes, taxes, DataMeta, Indicator (+30 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.06
Nodes (57): activityLabel(), CompanyProfileActivityPanel(), dateTime(), LEGAL_FORM_LABELS, CompanyProfileWizard(), CompanyWizardInitial, defaultRuleIds(), EMPTY_DETAILS (+49 more)

### Community 3 - "useToast"
Cohesion: 0.17
Nodes (18): parseBankStatement(), ParsedTransaction, exportTransactionsToExcel(), baseTx, filterPayments(), paymentDayDiff(), paymentSummary(), paymentTiming() (+10 more)

### Community 4 - "Library.tsx"
Cohesion: 0.08
Nodes (43): PRO_PERKS, KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext() (+35 more)

### Community 5 - "App.tsx"
Cohesion: 0.09
Nodes (21): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+13 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.06
Nodes (48): DocumentWorkspace, STEPS, DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, capitalize() (+40 more)

### Community 8 - "ipc.ts"
Cohesion: 0.16
Nodes (19): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, BxTheme (+11 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.08
Nodes (32): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps, useDocumentViewMode(), TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps (+24 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.21
Nodes (11): App(), Topbar(), search(), applyTheme(), BX_THEMES, currentTheme(), nextTheme(), normalizeTheme() (+3 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.05
Nodes (52): delay(), scan(), AccuracyKind, ACTIONS, animationDelay(), AnimationSpeed, BIX_JOKES, BIX_PHRASES (+44 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.20
Nodes (11): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, RefTabId, tabs (+3 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.08
Nodes (36): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, AttemptsData, clearPin() (+28 more)

### Community 14 - "widgetsApi.ts"
Cohesion: 0.21
Nodes (14): BxCounterparty, NewCounterparty, useCounterparties(), COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS (+6 more)

### Community 15 - "localDb.ts"
Cohesion: 0.14
Nodes (9): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, WMO, CurrencyExportRow, BankExchangeRate (+1 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.14
Nodes (20): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo() (+12 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.06
Nodes (51): Cmd, CommandPalette(), COMMANDS, uid(), Props, AddCardPayload, BoardKanban(), c() (+43 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.30
Nodes (13): detectAndRegisterConflict(), addToSyncQueue(), getSyncQueue(), isTransientError(), pushItem(), PushResult, removeFromSyncQueue(), saveSyncQueue() (+5 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.18
Nodes (14): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites(), ACCENT, Calc(), GROUPS, peekCalcPrefill() (+6 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.20
Nodes (10): CompanyProvider(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, ToastProvider(), useToast() (+2 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.05
Nodes (65): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), MONTHS, Props, TaxCalendar() (+57 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.31
Nodes (8): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel

### Community 24 - "Topbar.tsx"
Cohesion: 0.27
Nodes (9): Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan, PlanCtx, PlanLimits, PlanProvider() (+1 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.20
Nodes (11): Button(), Props, styles, Variant, Props, formatBytes(), onecApi, CacheCleaner() (+3 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.24
Nodes (14): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE (+6 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.15
Nodes (17): check(), fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), CheckResult (+9 more)

### Community 28 - "main.ts"
Cohesion: 0.14
Nodes (30): appAsset(), broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), constrainTrayPosition(), constrainTrayWindowToDisplay(), createTray(), createTrayWindow() (+22 more)

### Community 29 - "types.ts"
Cohesion: 0.20
Nodes (11): ChatMsg, Deadline, DRAG, fmtDay(), NODRAG, noticeStyle, openApp(), QUICK (+3 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.14
Nodes (10): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+2 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.14
Nodes (24): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+16 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.25
Nodes (8): AGE_COEFFS, COMMERCIAL_ENGINES, EngineGroup, fmt(), MOTO_ENGINES, PASSENGER_ENGINES, RecyclingCalc(), VehicleCategory

### Community 33 - "App.tsx"
Cohesion: 0.27
Nodes (8): applyBankDirectory(), BankDirectoryRow, DEFAULT_BANK_DIRECTORY, fromRow(), loadBankDirectory(), directory, rates, BankDirectoryEntry

### Community 34 - "Topbar.tsx"
Cohesion: 0.25
Nodes (9): CompareFieldRowProps, ConflictModal(), ConflictModalProps, db, ExchangeRate, SyncConflict, getConflicts(), resolveConflict() (+1 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.29
Nodes (11): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchText(), FLAGS, numeric(), parseAloqabankRates() (+3 more)

### Community 36 - "supabase.ts"
Cohesion: 0.31
Nodes (6): AboutModal(), Props, LoginScreen(), Props, CHANGELOG, ChangelogEntry

### Community 37 - "Settings.tsx"
Cohesion: 0.23
Nodes (9): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), Props, STATUS_LABELS, Props (+1 more)

### Community 38 - "InnCheckTool.tsx"
Cohesion: 0.39
Nodes (7): cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp(), TempDirInfo

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
Cohesion: 0.33
Nodes (10): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+2 more)

### Community 44 - "BxEvent"
Cohesion: 0.20
Nodes (13): format(), MoneyInput(), Props, fmt(), PenaltyCalc(), CalcPrefill, takeCalcPrefill(), toMoneyString() (+5 more)

### Community 45 - "MoneyInput.tsx"
Cohesion: 0.17
Nodes (11): CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row(), DividendCalc() (+3 more)

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
Cohesion: 0.19
Nodes (15): ParsedEcpInfo, TraderInfo, UpdateSnapshot, api, BxApi, BxBridge, IPC, SiteResetMode (+7 more)

### Community 50 - "FocusView.tsx"
Cohesion: 0.25
Nodes (7): calculateRegimeComparison(), fmt(), parseMln(), RegimeCompareCalc(), RegimeInputs, RegimeOutcome, TaxRegime

### Community 51 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 52 - "uiScale.ts"
Cohesion: 0.38
Nodes (8): isBixWidget, root, rootElement, applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, normalizeFontScale(), saveFontScale()

### Community 54 - "onecProcess.ts"
Cohesion: 0.47
Nodes (4): createCanonicalEvent(), loadNotes(), Note, QuickNotes()

### Community 55 - "uiScale.ts"
Cohesion: 0.32
Nodes (9): createSiteWindow(), openSiteSession(), partitionFor(), resetSiteSession(), secureWebPreferences(), siteWindows, SiteSessionReset(), NormalizedSiteUrl (+1 more)

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

### Community 66 - "OcrTool.tsx"
Cohesion: 0.50
Nodes (4): escapeHtml(), HTML_ENTITIES, LANGUAGES, OcrTool()

### Community 69 - "DateCalc.tsx"
Cohesion: 0.15
Nodes (25): registerIpcHandlers(), fetchRateOnDate(), fetchRates(), parseCertificateText(), parsePfx(), pickPfxFile(), cleanup(), parseCertInfo() (+17 more)

### Community 71 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 73 - "DailyTasksModal.tsx"
Cohesion: 0.11
Nodes (23): Props, CalCard, PRI_COLOR, Props, TYPE_ICON, DigestView(), dueChip(), EcpKey (+15 more)

### Community 75 - "QuickNotes.tsx"
Cohesion: 0.19
Nodes (17): EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS (+9 more)

### Community 76 - "Sidebar.tsx"
Cohesion: 0.23
Nodes (8): CompanySwitcher(), initialCollapsed(), MenuItem, MenuSection, navItemClass(), Sidebar(), usePlan(), ReferenceView()

### Community 77 - "TxModal.tsx"
Cohesion: 0.31
Nodes (8): BxTransaction, useExchangeRates(), EXPENSE_CATS, INCOME_CATS, Props, today, TxModal(), NewTransaction

### Community 78 - "SystemTaskBoard.tsx"
Cohesion: 0.21
Nodes (9): EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props, COLUMNS, groupEventsByStatus(), PRIORITY_BORDER (+1 more)

## Knowledge Gaps
- **352 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+347 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `CompanyContext.tsx` to `Settings.tsx`, `Calc.tsx`, `Library.tsx`, `ipc.ts`, `referenceRepo.ts`, `Translator.tsx`, `TrayView.tsx`, `Finance.tsx`, `ListView.tsx`, `TaxCalculator.tsx`, `Topbar.tsx`, `types.ts`, `syncQueue.ts`, `App.tsx`, `Topbar.tsx`, `taxSeeder.ts`, `Planner.tsx`, `newsFeed.ts`, `QuickNotes.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `Dashboard.tsx` to `Calc.tsx`, `CompanyContext.tsx`, `useToast`, `Templates.tsx`, `ipc.ts`, `Translator.tsx`, `Currency.tsx`, `Finance.tsx`, `CalendarView.tsx`, `Counterparties.tsx`, `CacheCleaner.tsx`, `types.ts`, `horoscope.ts`, `Topbar.tsx`, `Settings.tsx`, `Planner.tsx`, `EimzoDiag.tsx`, `DailyTasksModal.tsx`, `QuickNotes.tsx`, `TxModal.tsx`, `SystemTaskBoard.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `useToast()` connect `errorReporter.ts` to `Settings.tsx`, `CompanyContext.tsx`, `useToast`, `Library.tsx`, `Templates.tsx`, `ipc.ts`, `referenceRepo.ts`, `Planner.tsx`, `widgetsApi.ts`, `Finance.tsx`, `numToWords.ts`, `TaxCalculator.tsx`, `onecProcess.ts`, `ReferenceView.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _352 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07982583454281568 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05765765765765766 - nodes in this community are weakly interconnected._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08020050125313283 - nodes in this community are weakly interconnected._