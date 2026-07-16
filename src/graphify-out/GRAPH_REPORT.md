# Graph Report - src  (2026-07-17)

## Corpus Check
- 231 files · ~315,684 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1295 nodes · 3069 edges · 57 communities (52 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad0ec93c`
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
- Documents.tsx
- CalendarPage.tsx
- Currency.tsx
- Finance.tsx
- ListView.tsx
- numToWords.ts
- TaxCalculator.tsx
- Services.tsx
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
- SmartCalendar.tsx
- Icon.tsx
- Tools.tsx
- CurrencyHistory.tsx
- workbenchCatalog.ts
- todayISO
- Planner.tsx
- BxEvent
- EventActivityTimeline.tsx
- DigestView.tsx
- onecCache.ts
- FocusView.tsx
- pcClean.ts
- onecProcess.ts
- Transliterate.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- useWorkbenchFavorites.ts
- PdfCompress.tsx
- vite-env.d.ts
- PLAN_LIMITS
- NotificationsWidget.tsx
- weather.ts

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 48 edges
2. `useCompany()` - 33 edges
3. `supabase` - 32 edges
4. `BxEvent` - 32 edges
5. `useToast()` - 31 edges
6. `usePlan()` - 29 edges
7. `registerIpcHandlers()` - 25 edges
8. `Templates()` - 16 edges
9. `EventStatus` - 16 edges
10. `Translator()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `CurrencyExportRow` --references--> `CurrencyRate`  [EXTRACTED]
  renderer/pages/Currency.tsx → shared/types.ts
- `listProcessesWindows()` --references--> `ONEC_PROCESS_NAMES`  [EXTRACTED]
  main/services/onecProcess.ts → shared/types.ts
- `CommandPalette()` --indirect_call--> `c()`  [INFERRED]
  renderer/components/CommandPalette.tsx → renderer/pages/planner/BoardKanban.tsx
- `LoginScreen()` --references--> `CHANGELOG`  [EXTRACTED]
  renderer/components/auth/LoginScreen.tsx → shared/version.ts
- `TaskPanel()` --calls--> `useCompany()`  [EXTRACTED]
  renderer/components/dashboard/TaskPanel.tsx → renderer/lib/CompanyContext.tsx

## Import Cycles
- None detected.

## Communities (57 total, 5 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.17
Nodes (20): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, applyFontScale() (+12 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.05
Nodes (55): useEconomicIndicators(), ACCENT, Calc(), CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc() (+47 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.08
Nodes (39): CompanyProfileWizard(), CompanyWizardInitial, defaultRuleIds(), initialProfile(), Props, WEEKDAYS, Props, statusMeta (+31 more)

### Community 3 - "useToast"
Cohesion: 0.07
Nodes (37): CompanyProvider(), check(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, useToast() (+29 more)

### Community 4 - "Library.tsx"
Cohesion: 0.07
Nodes (47): Cmd, CommandPalette(), COMMANDS, PRO_PERKS, KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS (+39 more)

### Community 5 - "App.tsx"
Cohesion: 0.16
Nodes (10): App(), LoginScreen(), Props, applyTheme(), BxTheme, currentTheme(), Placeholder(), Props (+2 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.12
Nodes (28): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META, getFieldGroup() (+20 more)

### Community 8 - "ipc.ts"
Cohesion: 0.13
Nodes (28): registerIpcHandlers(), CbuItem, DEFAULT_CODES, fetchRateOnDate(), fetchRates(), FLAGS, parseCertificateText(), parsePfx() (+20 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.09
Nodes (34): getNewsItem(), LEGISLATION_NEWS, NewsItem, indicators, paymentCodes, taxes, DataMeta, Indicator (+26 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.11
Nodes (9): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyRate (+1 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.07
Nodes (38): AboutModal(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass(), Sidebar(), OnboardingWizard() (+30 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.18
Nodes (11): EventModal(), PRIORITY_LABELS, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS, collectEventPages() (+3 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.18
Nodes (12): Notice, ChatMsg, Deadline, DRAG, fmtDay(), NODRAG, noticeStyle, openApp() (+4 more)

### Community 14 - "Documents.tsx"
Cohesion: 0.21
Nodes (13): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+5 more)

### Community 15 - "CalendarPage.tsx"
Cohesion: 0.13
Nodes (13): ErrorBoundary, Props, State, root, rootElement, detectPlatform(), installGlobalErrorReporting(), reportError() (+5 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.16
Nodes (17): ALL_CODES, buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, CurrencyExportRow, daysAgo() (+9 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.06
Nodes (54): parseBankStatement(), ParsedTransaction, BxCounterparty, BxTransaction, ExchangeRate, NewCounterparty, useCounterparties(), exportTransactionsToExcel() (+46 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.15
Nodes (20): Props, CalCard, PRI_COLOR, Props, TYPE_ICON, Props, fmtDate(), ListView() (+12 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.17
Nodes (18): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+10 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 21 - "Services.tsx"
Cohesion: 0.24
Nodes (15): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+7 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.22
Nodes (16): PinScreen(), Props, AttemptsData, getAttemptsData(), getAttemptsLeft(), isLocked(), LockStatus, pureDjb2() (+8 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.35
Nodes (9): AuthGate(), clearPin(), hasPin(), isPinEnabled(), setPinEnabled(), useAuth(), getIdleTimeout(), IdleTimeout (+1 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.08
Nodes (41): CompareFieldRowProps, ConflictModal(), ConflictModalProps, CompanySwitcher(), Topbar(), useCompany(), db, SyncConflict (+33 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.22
Nodes (10): Button(), Props, styles, Variant, Props, formatBytes(), onecApi, CacheCleaner() (+2 more)

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
Cohesion: 0.07
Nodes (44): uid(), Props, AddCardPayload, BoardKanban(), COLOR_MAP, fmtDate(), isOverdue(), PRIORITY_BAR (+36 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 34 - "SmartCalendar.tsx"
Cohesion: 0.05
Nodes (64): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), MONTHS, Props, TaxCalendar() (+56 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.20
Nodes (4): DocumentWorkspace, STEPS, IconName, PATHS

### Community 38 - "Tools.tsx"
Cohesion: 0.18
Nodes (9): ACCENT, FULL_HEIGHT_TOOLS, GROUPS, LANGUAGES, PdfConvert(), PROPOSAL_TOOLS, READY_TOOLS, Tool (+1 more)

### Community 39 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 40 - "workbenchCatalog.ts"
Cohesion: 0.24
Nodes (10): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchKind, WorkbenchProposal (+2 more)

### Community 42 - "todayISO"
Cohesion: 0.35
Nodes (9): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE (+1 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.31
Nodes (11): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+3 more)

### Community 44 - "BxEvent"
Cohesion: 0.18
Nodes (15): Props, Props, Props, EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props (+7 more)

### Community 45 - "EventActivityTimeline.tsx"
Cohesion: 0.29
Nodes (9): describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), EventActivity, EventActivityType (+1 more)

### Community 47 - "DigestView.tsx"
Cohesion: 0.24
Nodes (6): DigestView(), dueChip(), EcpKey, fmtSum(), UnifiedDigestItem, UnpaidTx

### Community 48 - "onecCache.ts"
Cohesion: 0.44
Nodes (8): cleanCache(), copyFolderRecursive(), dirSize(), getCacheRoots(), getV8iPath(), parseV8i(), scanCache(), CacheEntry

### Community 50 - "FocusView.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 51 - "pcClean.ts"
Cohesion: 0.13
Nodes (18): ParsedEcpInfo, TraderInfo, BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss() (+10 more)

### Community 54 - "onecProcess.ts"
Cohesion: 0.29
Nodes (12): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), BxBridge, BackupResult, CacheScanResult (+4 more)

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "useWorkbenchFavorites.ts"
Cohesion: 1.00
Nodes (3): readFavorites(), storageKey(), useWorkbenchFavorites()

### Community 66 - "NotificationsWidget.tsx"
Cohesion: 0.36
Nodes (7): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, NoticeLevel

### Community 70 - "weather.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

## Knowledge Gaps
- **296 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+291 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `CompanyContext.tsx` to `Settings.tsx`, `useToast`, `Library.tsx`, `referenceRepo.ts`, `Translator.tsx`, `Planner.tsx`, `EventActivityTimeline.tsx`, `Documents.tsx`, `CalendarPage.tsx`, `useEvents.ts`, `Finance.tsx`, `TrayView.tsx`, `numToWords.ts`, `Services.tsx`, `Topbar.tsx`, `types.ts`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `todayISO` to `Settings.tsx`, `Calc.tsx`, `CompanyContext.tsx`, `Templates.tsx`, `referenceRepo.ts`, `useEvents.ts`, `TrayView.tsx`, `Currency.tsx`, `Finance.tsx`, `Topbar.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`, `types.ts`, `EcpManager.tsx`, `SmartCalendar.tsx`, `Planner.tsx`, `BxEvent`, `DigestView.tsx`, `FocusView.tsx`, `NotificationsWidget.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `Settings.tsx`, `Calc.tsx`, `CompanyContext.tsx`, `Library.tsx`, `Templates.tsx`, `Planner.tsx`, `Translator.tsx`, `Finance.tsx`, `numToWords.ts`, `types.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _296 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.052982456140350874 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0784313725490196 - nodes in this community are weakly interconnected._
- **Should `useToast` be split into smaller, more focused modules?**
  _Cohesion score 0.07227891156462585 - nodes in this community are weakly interconnected._