# Graph Report - src  (2026-07-18)

## Corpus Check
- 264 files · ~5,066,056 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1573 nodes · 3726 edges · 76 communities (72 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `34246598`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Library.tsx
- useBoards.ts
- pin.ts
- BixWidget.tsx
- onecApi.ts
- Templates.tsx
- main.ts
- referenceRepo.ts
- Dashboard.tsx
- ipc.ts
- Tools.tsx
- types.ts
- Currency.tsx
- CompanyTeamPanel.tsx
- widgetsApi.ts
- Translator.tsx
- TrayView.tsx
- Settings.tsx
- useToast
- CalendarPage.tsx
- Support.tsx
- Finance.tsx
- useEvents.ts
- App.tsx
- types.ts
- Services.tsx
- numToWords.ts
- Calc.tsx
- usePlan
- preload.ts
- CompanyContext.tsx
- Documents.tsx
- NewsDetail.tsx
- ListView.tsx
- BxEvent
- siteSession.ts
- localDb.ts
- DocumentViewModeSwitch.tsx
- CalendarView.tsx
- taxSeeder.ts
- horoscope.ts
- ReferenceView.tsx
- validation.ts
- MoneyInput.tsx
- SmartCalendar.tsx
- syncQueue.ts
- Counterparties.tsx
- workbenchCatalog.ts
- EcpManager.tsx
- Planner.tsx
- InpsCalc.tsx
- SickLeaveCalc.tsx
- currency.ts
- supabase.ts
- todayISO
- DateCalc.tsx
- Icon.tsx
- CurrencyHistory.tsx
- useNotifications.ts
- bankDirectory.ts
- RegimeCompareCalc.tsx
- plan.tsx
- DigestView.tsx
- onecCache.ts
- pcClean.ts
- onecProcess.ts
- uiScale.ts
- PdfConvert.tsx
- Transliterate.tsx
- DailyTasksModal.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- weather.ts
- vite-env.d.ts
- PLAN_LIMITS

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 53 edges
2. `useCompany()` - 37 edges
3. `supabase` - 37 edges
4. `useToast()` - 33 edges
5. `BxEvent` - 33 edges
6. `usePlan()` - 32 edges
7. `registerIpcHandlers()` - 28 edges
8. `BixWidget()` - 23 edges
9. `EventStatus` - 18 edges
10. `Templates()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `CommandPalette()` --indirect_call--> `c()`  [INFERRED]
  ../../../Users/chernikov/repo/busines_bx/app/src/renderer/components/CommandPalette.tsx → ../../../Users/chernikov/repo/busines_bx/app/src/renderer/pages/planner/BoardKanban.tsx
- `TaskPanel()` --calls--> `useCompany()`  [EXTRACTED]
  ../../../Users/chernikov/repo/busines_bx/app/src/renderer/components/dashboard/TaskPanel.tsx → ../../../Users/chernikov/repo/busines_bx/app/src/renderer/lib/CompanyContext.tsx
- `useDocumentViewMode()` --indirect_call--> `loadDocumentWorkspaceMode()`  [INFERRED]
  ../../../Users/chernikov/repo/busines_bx/app/src/renderer/components/documents/DocumentViewModeSwitch.tsx → ../../../Users/chernikov/repo/busines_bx/app/src/renderer/lib/workspaceModes.ts
- `CompanySwitcher()` --indirect_call--> `c()`  [INFERRED]
  ../../../Users/chernikov/repo/busines_bx/app/src/renderer/components/layout/CompanySwitcher.tsx → ../../../Users/chernikov/repo/busines_bx/app/src/renderer/pages/planner/BoardKanban.tsx
- `CompanyProvider()` --indirect_call--> `c()`  [INFERRED]
  ../../../Users/chernikov/repo/busines_bx/app/src/renderer/lib/CompanyContext.tsx → ../../../Users/chernikov/repo/busines_bx/app/src/renderer/pages/planner/BoardKanban.tsx

## Import Cycles
- None detected.

## Communities (76 total, 4 thin omitted)

### Community 0 - "Library.tsx"
Cohesion: 0.07
Nodes (49): buildContentAuditInventory(), ContentAuditItem, ContentAuditStatus, ContentAuditSummary, ContentKind, isOfficialSourceUrl(), knowledgeItems(), obligationItems() (+41 more)

### Community 1 - "useBoards.ts"
Cohesion: 0.26
Nodes (12): BoardModal(), DOT, Props, baseBoardDefs(), BOARD_ICONS, col(), COLUMN_COLORS, defaultColumns() (+4 more)

### Community 2 - "pin.ts"
Cohesion: 0.06
Nodes (47): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, isBixWidget, root (+39 more)

### Community 3 - "BixWidget.tsx"
Cohesion: 0.05
Nodes (49): delay(), scan(), AccuracyKind, ACTIONS, animationDelay(), AnimationSpeed, BIX_JOKES, BIX_PHRASES (+41 more)

### Community 4 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 5 - "Templates.tsx"
Cohesion: 0.11
Nodes (29): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META (+21 more)

### Community 6 - "main.ts"
Cohesion: 0.14
Nodes (30): appAsset(), broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), constrainTrayPosition(), constrainTrayWindowToDisplay(), createTray(), createTrayWindow() (+22 more)

### Community 7 - "referenceRepo.ts"
Cohesion: 0.08
Nodes (37): getNewsItem(), LEGISLATION_NEWS, NewsItem, indicators, paymentCodes, taxes, DataMeta, Indicator (+29 more)

### Community 8 - "Dashboard.tsx"
Cohesion: 0.11
Nodes (19): Props, State, WidgetBoundary, defaultRuntimeWidgetPolicy(), defaults, isRuntimeWidgetAllowed(), loadRuntimeWidgetPolicy(), normalizePolicy() (+11 more)

### Community 9 - "ipc.ts"
Cohesion: 0.36
Nodes (9): backupDatabase(), pickBackupDir(), pickDatabaseFile(), timestamp(), BackupScheduleConfig, getConfigPath(), initBackupScheduler(), readBackupConfig() (+1 more)

### Community 10 - "Tools.tsx"
Cohesion: 0.12
Nodes (18): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+10 more)

### Community 11 - "types.ts"
Cohesion: 0.14
Nodes (17): UpdateSnapshot, Button(), Props, styles, Variant, Props, BxBridge, formatBytes() (+9 more)

### Community 12 - "Currency.tsx"
Cohesion: 0.14
Nodes (20): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo() (+12 more)

### Community 13 - "CompanyTeamPanel.tsx"
Cohesion: 0.09
Nodes (32): CompanyRoleGuide(), ROLE_TONES, INVITABLE_ROLES, Props, canShowReminder(), getOnboardingSurface(), OnboardingProfile, OnboardingState (+24 more)

### Community 14 - "widgetsApi.ts"
Cohesion: 0.10
Nodes (10): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyExportRow (+2 more)

### Community 15 - "Translator.tsx"
Cohesion: 0.19
Nodes (17): buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName(), modeName(), normalizeArchiveFileName(), translatedFileName(), TRANSLATION_LANGUAGES (+9 more)

### Community 16 - "TrayView.tsx"
Cohesion: 0.15
Nodes (20): NotificationsWidget(), styleByLevel, loadEcpKeys(), buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice (+12 more)

### Community 17 - "Settings.tsx"
Cohesion: 0.16
Nodes (18): parseSettingsBackup(), SettingsBackupPayload, SettingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, FontScale (+10 more)

### Community 18 - "useToast"
Cohesion: 0.17
Nodes (11): uid(), DEFAULT_SITES, loadSites(), msColor(), NetworkChecker(), PingTarget, saveSites(), TestResult (+3 more)

### Community 19 - "CalendarPage.tsx"
Cohesion: 0.11
Nodes (27): CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, Props, Props, BUILT_IN_CHECKLIST_TEMPLATES (+19 more)

### Community 20 - "Support.tsx"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 21 - "Finance.tsx"
Cohesion: 0.16
Nodes (19): parseBankStatement(), ParsedTransaction, BxTransaction, exportTransactionsToExcel(), baseTx, filterPayments(), paymentDayDiff(), paymentSummary() (+11 more)

### Community 22 - "useEvents.ts"
Cohesion: 0.17
Nodes (21): EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS (+13 more)

### Community 23 - "App.tsx"
Cohesion: 0.32
Nodes (11): App(), Topbar(), search(), SearchItem, applyTheme(), BX_THEMES, BxTheme, currentTheme() (+3 more)

### Community 24 - "types.ts"
Cohesion: 0.06
Nodes (53): activityLabel(), CompanyProfileActivityPanel(), dateTime(), LEGAL_FORM_LABELS, CompanyProfileWizard(), CompanyWizardInitial, EMPTY_DETAILS, formCalendarHint() (+45 more)

### Community 25 - "Services.tsx"
Cohesion: 0.29
Nodes (11): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+3 more)

### Community 26 - "numToWords.ts"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 27 - "Calc.tsx"
Cohesion: 0.18
Nodes (14): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites(), ACCENT, Calc(), GROUPS, peekCalcPrefill() (+6 more)

### Community 28 - "usePlan"
Cohesion: 0.17
Nodes (11): AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass() (+3 more)

### Community 29 - "preload.ts"
Cohesion: 0.17
Nodes (12): fetchTrader(), TraderInfo, BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss() (+4 more)

### Community 30 - "CompanyContext.tsx"
Cohesion: 0.19
Nodes (5): CompanyCtx, CompanyProvider(), useToast(), Placeholder(), Props

### Community 31 - "Documents.tsx"
Cohesion: 0.15
Nodes (21): useDocumentViewMode(), ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar() (+13 more)

### Community 32 - "NewsDetail.tsx"
Cohesion: 0.06
Nodes (47): AccuracyKind, ACTIONS, animationDelay(), AnimationSpeed, BIX_JOKES, BIX_PHRASES, BixActivity, BixAnimationCycle (+39 more)

### Community 33 - "ListView.tsx"
Cohesion: 0.18
Nodes (14): Item, Props, TYPE_BADGE, Props, fmtDate(), ListView(), PRI_COLOR, Props (+6 more)

### Community 34 - "BxEvent"
Cohesion: 0.14
Nodes (19): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), Props, STATUS_LABELS, EVENT_TYPE_LABELS (+11 more)

### Community 35 - "siteSession.ts"
Cohesion: 0.24
Nodes (13): createSiteWindow(), openSiteSession(), partitionFor(), resetSiteSession(), secureWebPreferences(), siteWindows, BusyAction, PRESETS (+5 more)

### Community 36 - "localDb.ts"
Cohesion: 0.36
Nodes (6): CompareFieldRowProps, ConflictModal(), ConflictModalProps, SyncConflict, getConflicts(), resolveConflict()

### Community 37 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.17
Nodes (8): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps, TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, loadDocumentWorkspaceMode(), loadTranslatorWorkspaceMode()

### Community 38 - "CalendarView.tsx"
Cohesion: 0.05
Nodes (63): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), MONTHS, Props, TaxCalendar() (+55 more)

### Community 39 - "taxSeeder.ts"
Cohesion: 0.24
Nodes (9): registerIpcHandlers(), cleanup(), parseCertInfo(), pickFileToSign(), pickSigFile(), signFile(), SignResult, VerifyResult (+1 more)

### Community 40 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 41 - "ReferenceView.tsx"
Cohesion: 0.23
Nodes (9): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, GovTab(), LawTab() (+1 more)

### Community 42 - "validation.ts"
Cohesion: 0.15
Nodes (17): check(), fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), CheckResult (+9 more)

### Community 43 - "MoneyInput.tsx"
Cohesion: 0.17
Nodes (11): CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row(), DividendCalc() (+3 more)

### Community 44 - "SmartCalendar.tsx"
Cohesion: 0.25
Nodes (8): AGE_COEFFS, COMMERCIAL_ENGINES, EngineGroup, fmt(), MOTO_ENGINES, PASSENGER_ENGINES, RecyclingCalc(), VehicleCategory

### Community 45 - "syncQueue.ts"
Cohesion: 0.28
Nodes (14): db, detectAndRegisterConflict(), addToSyncQueue(), getSyncQueue(), isTransientError(), pushItem(), PushResult, removeFromSyncQueue() (+6 more)

### Community 46 - "Counterparties.tsx"
Cohesion: 0.12
Nodes (23): BxCounterparty, ExchangeRate, NewCounterparty, useCounterparties(), COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth() (+15 more)

### Community 47 - "workbenchCatalog.ts"
Cohesion: 0.23
Nodes (10): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchProposal, WorkbenchSector (+2 more)

### Community 48 - "EcpManager.tsx"
Cohesion: 0.22
Nodes (12): EcpKeyRecord, getSafe(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager(), EMPTY_FORM (+4 more)

### Community 49 - "Planner.tsx"
Cohesion: 0.29
Nodes (10): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+2 more)

### Community 50 - "InpsCalc.tsx"
Cohesion: 0.25
Nodes (8): fmt(), InpsCalc(), fmt(), SalaryCalc(), calcPayroll(), DEFAULT_RATES, PayrollRates, PayrollResult

### Community 51 - "SickLeaveCalc.tsx"
Cohesion: 0.20
Nodes (13): format(), MoneyInput(), Props, fmt(), PenaltyCalc(), CalcPrefill, takeCalcPrefill(), toMoneyString() (+5 more)

### Community 52 - "currency.ts"
Cohesion: 0.24
Nodes (13): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchRateOnDate(), fetchRates(), fetchText(), FLAGS (+5 more)

### Community 53 - "supabase.ts"
Cohesion: 0.50
Nodes (4): parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile()

### Community 56 - "Icon.tsx"
Cohesion: 0.17
Nodes (7): Cmd, CommandPalette(), COMMANDS, DocumentWorkspace, STEPS, IconName, PATHS

### Community 58 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 60 - "useNotifications.ts"
Cohesion: 0.24
Nodes (9): buildTaskNotification(), BxNotification, ROW, formatDueDate(), GlobalNotificationRow, NotificationSource, NotificationTarget, TaskNotificationRow (+1 more)

### Community 62 - "bankDirectory.ts"
Cohesion: 0.27
Nodes (9): applyBankDirectory(), BankDirectoryRow, DEFAULT_BANK_DIRECTORY, fromRow(), loadBankDirectory(), directory, rates, BankDirectoryEntry (+1 more)

### Community 63 - "RegimeCompareCalc.tsx"
Cohesion: 0.25
Nodes (7): calculateRegimeComparison(), fmt(), parseMln(), RegimeCompareCalc(), RegimeInputs, RegimeOutcome, TaxRegime

### Community 64 - "plan.tsx"
Cohesion: 0.11
Nodes (19): CompanyTeamPanel(), CompanySwitcher(), PRO_PERKS, useCompany(), Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS (+11 more)

### Community 65 - "DigestView.tsx"
Cohesion: 0.14
Nodes (19): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), AddCardPayload, BoardKanban() (+11 more)

### Community 66 - "onecCache.ts"
Cohesion: 0.44
Nodes (8): cleanCache(), copyFolderRecursive(), dirSize(), getCacheRoots(), getV8iPath(), parseV8i(), scanCache(), CacheEntry

### Community 69 - "pcClean.ts"
Cohesion: 0.33
Nodes (8): checkRunningBrowsers(), cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp(), TempDirInfo

### Community 71 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 73 - "uiScale.ts"
Cohesion: 0.71
Nodes (5): applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, normalizeFontScale(), saveFontScale()

### Community 74 - "PdfConvert.tsx"
Cohesion: 0.48
Nodes (5): escapeDocumentHtml(), groupPdfTextItems(), HTML_ENTITIES, PdfConvert(), PdfTextItem

### Community 75 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 76 - "DailyTasksModal.tsx"
Cohesion: 0.40
Nodes (4): CalCard, PRI_COLOR, Props, TYPE_ICON

### Community 77 - "EimzoDiag.tsx"
Cohesion: 0.18
Nodes (6): CheckItem, INITIAL, escapeHtml(), HTML_ENTITIES, LANGUAGES, OcrTool()

### Community 78 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 79 - "weather.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

## Knowledge Gaps
- **393 isolated node(s):** `quietSettings`, `Panel`, `BxWidgetWindow`, `BixState`, `BixReminder` (+388 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `todayISO()` connect `DigestView.tsx` to `BixWidget.tsx`, `Templates.tsx`, `referenceRepo.ts`, `Dashboard.tsx`, `types.ts`, `Currency.tsx`, `TrayView.tsx`, `Settings.tsx`, `Finance.tsx`, `useEvents.ts`, `types.ts`, `CompanyContext.tsx`, `NewsDetail.tsx`, `ListView.tsx`, `BxEvent`, `CalendarView.tsx`, `Counterparties.tsx`, `EcpManager.tsx`, `Planner.tsx`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `supabase` connect `CompanyTeamPanel.tsx` to `Library.tsx`, `useBoards.ts`, `pin.ts`, `BixWidget.tsx`, `referenceRepo.ts`, `Dashboard.tsx`, `Translator.tsx`, `TrayView.tsx`, `Settings.tsx`, `CalendarPage.tsx`, `Support.tsx`, `useEvents.ts`, `types.ts`, `Services.tsx`, `CompanyContext.tsx`, `Documents.tsx`, `NewsDetail.tsx`, `localDb.ts`, `syncQueue.ts`, `Planner.tsx`, `useNotifications.ts`, `bankDirectory.ts`, `plan.tsx`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `useToast()` connect `CompanyContext.tsx` to `Library.tsx`, `plan.tsx`, `pin.ts`, `Templates.tsx`, `validation.ts`, `CompanyTeamPanel.tsx`, `Counterparties.tsx`, `Translator.tsx`, `Planner.tsx`, `Settings.tsx`, `useToast`, `Support.tsx`, `Finance.tsx`, `types.ts`, `Calc.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `quietSettings`, `Panel`, `BxWidgetWindow` to the rest of the system?**
  _393 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._
- **Should `pin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `BixWidget.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05411764705882353 - nodes in this community are weakly interconnected._