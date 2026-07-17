# Graph Report - src  (2026-07-17)

## Corpus Check
- 250 files · ~323,307 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1379 nodes · 3284 edges · 74 communities (71 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3e3c90f7`
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
- CardModal.tsx
- ToastContext.tsx
- DateCalc.tsx
- BoardKanban.tsx
- Icon.tsx
- TxModal.tsx
- EimzoDiag.tsx

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
- `CommandPalette()` --indirect_call--> `c()`  [INFERRED]
  src/renderer/components/CommandPalette.tsx → src/renderer/pages/planner/BoardKanban.tsx
- `OnboardingWizard()` --calls--> `usePlan()`  [EXTRACTED]
  src/renderer/components/OnboardingWizard.tsx → src/renderer/lib/plan.tsx
- `TaskPanel()` --calls--> `useCompany()`  [EXTRACTED]
  src/renderer/components/dashboard/TaskPanel.tsx → src/renderer/lib/CompanyContext.tsx
- `useDocumentViewMode()` --indirect_call--> `loadDocumentWorkspaceMode()`  [INFERRED]
  src/renderer/components/documents/DocumentViewModeSwitch.tsx → src/renderer/lib/workspaceModes.ts
- `CompanySwitcher()` --indirect_call--> `c()`  [INFERRED]
  src/renderer/components/layout/CompanySwitcher.tsx → src/renderer/pages/planner/BoardKanban.tsx

## Import Cycles
- None detected.

## Communities (74 total, 3 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.14
Nodes (17): ACCENT, CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row() (+9 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.05
Nodes (53): CompanyProfileWizard(), CompanyWizardInitial, defaultRuleIds(), initialProfile(), Props, WEEKDAYS, Props, statusMeta (+45 more)

### Community 3 - "useToast"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 4 - "Library.tsx"
Cohesion: 0.08
Nodes (43): PRO_PERKS, KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext() (+35 more)

### Community 5 - "App.tsx"
Cohesion: 0.18
Nodes (5): Cmd, CommandPalette(), COMMANDS, Placeholder(), Props

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.11
Nodes (29): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META (+21 more)

### Community 8 - "ipc.ts"
Cohesion: 0.18
Nodes (16): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, BxTheme (+8 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.12
Nodes (27): indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode, ReferenceSection (+19 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.18
Nodes (14): CompanyRole, supabase, BxUserDocument, Props, describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity (+6 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.11
Nodes (23): TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName() (+15 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.17
Nodes (13): EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS (+5 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 14 - "CalendarPage.tsx"
Cohesion: 0.39
Nodes (9): App(), Topbar(), search(), applyTheme(), BX_THEMES, currentTheme(), nextTheme(), normalizeTheme() (+1 more)

### Community 15 - "CalendarPage.tsx"
Cohesion: 0.22
Nodes (16): PinScreen(), Props, AttemptsData, getAttemptsData(), getAttemptsLeft(), isLocked(), LockStatus, pureDjb2() (+8 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.05
Nodes (40): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+32 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.18
Nodes (17): parseBankStatement(), ParsedTransaction, exportTransactionsToExcel(), filterPayments(), paymentDayDiff(), paymentSummary(), paymentTiming(), PaymentView (+9 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.15
Nodes (23): Item, Props, TYPE_BADGE, CalCard, PRI_COLOR, Props, TYPE_ICON, Props (+15 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.18
Nodes (16): CompanyRoleGuide(), ROLE_TONES, INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE, COMPANY_ROLE_LABELS (+8 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.15
Nodes (17): check(), fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), CheckResult (+9 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.13
Nodes (12): ErrorBoundary, Props, State, root, rootElement, detectPlatform(), installGlobalErrorReporting(), reportError() (+4 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.13
Nodes (22): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+14 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.17
Nodes (11): AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass() (+3 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.21
Nodes (12): CompanyTeamPanel(), useDocumentViewMode(), CompanySwitcher(), useCompany(), usePlan(), useToast(), useDocuments(), Documents() (+4 more)

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
Cohesion: 0.16
Nodes (21): broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), createTray(), createTrayWindow(), downloadAsset(), gotLock, loadTrayState() (+13 more)

### Community 29 - "types.ts"
Cohesion: 0.17
Nodes (18): holidayName(), CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, emitPlannerReload(), subscribePlannerReload() (+10 more)

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
Cohesion: 0.22
Nodes (14): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+6 more)

### Community 34 - "Topbar.tsx"
Cohesion: 0.20
Nodes (15): BxCounterparty, NewCounterparty, useCounterparties(), baseTx, COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth() (+7 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.24
Nodes (13): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchRateOnDate(), fetchRates(), fetchText(), FLAGS (+5 more)

### Community 36 - "supabase.ts"
Cohesion: 0.26
Nodes (12): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+4 more)

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
Cohesion: 0.20
Nodes (13): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), buildFocusGroups(), CompanyGroup (+5 more)

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
Cohesion: 0.16
Nodes (13): fetchTrader(), TraderInfo, BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss() (+5 more)

### Community 50 - "FocusView.tsx"
Cohesion: 0.16
Nodes (16): specialDaysForMonth(), CalBoard, CalendarView(), formatCalendarDate(), formatFullDate(), formatShortDate(), formatWeekday(), mondayOf() (+8 more)

### Community 51 - "pcClean.ts"
Cohesion: 0.18
Nodes (12): OnboardingWizard(), Step, STEPS, Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan (+4 more)

### Community 52 - "knowledgeRepo.ts"
Cohesion: 0.71
Nodes (5): applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, normalizeFontScale(), saveFontScale()

### Community 53 - "WidgetBoundary"
Cohesion: 0.15
Nodes (13): uid(), CardModal(), fmtDateTime(), DEFAULT_SITES, loadSites(), msColor(), NetworkChecker(), PingTarget (+5 more)

### Community 54 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 55 - "uiScale.ts"
Cohesion: 0.24
Nodes (13): createSiteWindow(), openSiteSession(), partitionFor(), resetSiteSession(), secureWebPreferences(), siteWindows, BusyAction, PRESETS (+5 more)

### Community 56 - "Sidebar.tsx"
Cohesion: 0.70
Nodes (4): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites()

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 58 - "EimzoDiag.tsx"
Cohesion: 0.11
Nodes (32): registerIpcHandlers(), parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile(), cleanup(), parseCertInfo(), pickFileToSign() (+24 more)

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "currency.ts"
Cohesion: 0.30
Nodes (13): detectAndRegisterConflict(), addToSyncQueue(), getSyncQueue(), isTransientError(), pushItem(), PushResult, removeFromSyncQueue(), saveSyncQueue() (+5 more)

### Community 61 - "useCompany"
Cohesion: 0.25
Nodes (9): CompareFieldRowProps, ConflictModal(), ConflictModalProps, db, ExchangeRate, SyncConflict, getConflicts(), resolveConflict() (+1 more)

### Community 65 - "pcClean.ts"
Cohesion: 0.19
Nodes (10): EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props, COLUMNS, groupEventsByStatus(), PRIORITY_BORDER (+2 more)

### Community 66 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.28
Nodes (10): AuthGate(), clearPin(), hasPin(), isPinEnabled(), setPinEnabled(), AuthState, useAuth(), getIdleTimeout() (+2 more)

### Community 67 - "CardModal.tsx"
Cohesion: 0.22
Nodes (10): Props, Props, BUILT_IN_CHECKLIST_TEMPLATES, LABEL_PALETTE, PRIORITY_OPTS, Props, BoardColumn, BxCard (+2 more)

### Community 68 - "ToastContext.tsx"
Cohesion: 0.29
Nodes (6): STYLE, Toast, ToastApi, ToastCtx, ToastKind, ToastProvider()

### Community 69 - "DateCalc.tsx"
Cohesion: 0.35
Nodes (9): isWorkday(), addCalendarDays(), addWorkdays(), DateCalc(), diffDays(), diffWorkdays(), fmt(), fmtLong() (+1 more)

### Community 70 - "BoardKanban.tsx"
Cohesion: 0.31
Nodes (8): CompanyProvider(), AddCardPayload, BoardKanban(), c(), COLOR_MAP, fmtDate(), isOverdue(), PRIORITY_BAR

### Community 71 - "Icon.tsx"
Cohesion: 0.12
Nodes (7): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps, DocumentWorkspace, STEPS, IconName, PATHS

### Community 72 - "TxModal.tsx"
Cohesion: 0.31
Nodes (8): BxTransaction, useExchangeRates(), EXPENSE_CATS, INCOME_CATS, Props, today, TxModal(), NewTransaction

## Knowledge Gaps
- **306 isolated node(s):** `siteWindows`, `api`, `BxApi`, `Window`, `mockCache` (+301 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `todayISO()` connect `todayISO` to `CompanyContext.tsx`, `Templates.tsx`, `ipc.ts`, `referenceRepo.ts`, `useEvents.ts`, `TrayView.tsx`, `Currency.tsx`, `Finance.tsx`, `ListView.tsx`, `Topbar.tsx`, `Dashboard.tsx`, `EcpManager.tsx`, `Planner.tsx`, `DigestView.tsx`, `useCompany`, `pcClean.ts`, `DateCalc.tsx`, `BoardKanban.tsx`, `TxModal.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `supabase` connect `widgetsApi.ts` to `CompanyContext.tsx`, `useToast`, `Library.tsx`, `ipc.ts`, `referenceRepo.ts`, `Translator.tsx`, `useEvents.ts`, `TrayView.tsx`, `Finance.tsx`, `numToWords.ts`, `errorReporter.ts`, `types.ts`, `syncQueue.ts`, `supabase.ts`, `Settings.tsx`, `CurrencyHistory.tsx`, `Planner.tsx`, `pcClean.ts`, `WidgetBoundary`, `currency.ts`, `useCompany`, `DocumentViewModeSwitch.tsx`, `CardModal.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `useCompany()` connect `Topbar.tsx` to `useCompany`, `CompanyContext.tsx`, `Topbar.tsx`, `useToast`, `CurrencyHistory.tsx`, `ipc.ts`, `Templates.tsx`, `Planner.tsx`, `Translator.tsx`, `CalendarPage.tsx`, `Finance.tsx`, `numToWords.ts`, `TaxCalculator.tsx`, `Dashboard.tsx`, `types.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `siteWindows`, `api`, `BxApi` to the rest of the system?**
  _306 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05487269534679543 - nodes in this community are weakly interconnected._