# Graph Report - src  (2026-07-17)

## Corpus Check
- 244 files · ~320,769 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1355 nodes · 3215 edges · 69 communities (64 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e79d9e59`
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

## Communities (69 total, 5 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.15
Nodes (15): ACCENT, CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row() (+7 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.06
Nodes (47): CompanyProfileWizard(), CompanyWizardInitial, defaultRuleIds(), initialProfile(), Props, WEEKDAYS, Props, statusMeta (+39 more)

### Community 3 - "useToast"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 4 - "Library.tsx"
Cohesion: 0.10
Nodes (37): KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext(), retrieveArticles() (+29 more)

### Community 5 - "App.tsx"
Cohesion: 0.18
Nodes (5): Cmd, CommandPalette(), COMMANDS, Placeholder(), Props

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.11
Nodes (31): useDocumentViewMode(), TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META, getFieldGroup() (+23 more)

### Community 8 - "ipc.ts"
Cohesion: 0.20
Nodes (15): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, FontScale (+7 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.09
Nodes (34): getNewsItem(), LEGISLATION_NEWS, NewsItem, indicators, paymentCodes, taxes, DataMeta, Indicator (+26 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.14
Nodes (10): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, WMO, CurrencyExportRow, BankExchangeRate (+2 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.09
Nodes (26): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps, TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt() (+18 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.19
Nodes (12): PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS, collectEventPages() (+4 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 14 - "CalendarPage.tsx"
Cohesion: 0.27
Nodes (8): App(), LoginScreen(), Props, applyTheme(), BxTheme, currentTheme(), CHANGELOG, ChangelogEntry

### Community 15 - "CalendarPage.tsx"
Cohesion: 0.14
Nodes (26): AuthGate(), PinScreen(), Props, AttemptsData, clearPin(), getAttemptsData(), getAttemptsLeft(), hasPin() (+18 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.15
Nodes (19): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo() (+11 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.16
Nodes (19): parseBankStatement(), ParsedTransaction, BxTransaction, exportTransactionsToExcel(), baseTx, filterPayments(), paymentDayDiff(), paymentSummary() (+11 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.15
Nodes (19): Props, CalCard, PRI_COLOR, Props, TYPE_ICON, Props, fmtDate(), ListView() (+11 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.17
Nodes (18): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+10 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.47
Nodes (6): BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), BankCheck()

### Community 21 - "errorReporter.ts"
Cohesion: 0.13
Nodes (13): ErrorBoundary, Props, State, root, rootElement, detectPlatform(), installGlobalErrorReporting(), reportError() (+5 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.07
Nodes (49): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+41 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.24
Nodes (7): AboutModal(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass(), Sidebar()

### Community 24 - "Topbar.tsx"
Cohesion: 0.10
Nodes (21): CompanySwitcher(), OnboardingWizard(), Step, STEPS, PRO_PERKS, useCompany(), Ctx, DEFAULT_PLAN_LIMITS (+13 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.17
Nodes (17): Button(), Props, styles, Variant, Props, BxBridge, formatBytes(), onecApi (+9 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (10): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+2 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.18
Nodes (12): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, ReferenceView(), RefTabId (+4 more)

### Community 28 - "main.ts"
Cohesion: 0.16
Nodes (21): broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), createTray(), createTrayWindow(), downloadAsset(), gotLock, loadTrayState() (+13 more)

### Community 29 - "types.ts"
Cohesion: 0.05
Nodes (59): uid(), CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, Props, AddCardPayload (+51 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.21
Nodes (8): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView

### Community 32 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 33 - "useCompany"
Cohesion: 0.12
Nodes (27): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+19 more)

### Community 34 - "Topbar.tsx"
Cohesion: 0.33
Nodes (6): fetch(), CheckResult, DEMO_RESULTS, InnCheckTool(), State, statusLabel()

### Community 35 - "Icon.tsx"
Cohesion: 0.24
Nodes (13): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchRateOnDate(), fetchRates(), fetchText(), FLAGS (+5 more)

### Community 36 - "supabase.ts"
Cohesion: 0.07
Nodes (44): CompareFieldRowProps, ConflictModal(), ConflictModalProps, Topbar(), BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection (+36 more)

### Community 37 - "Settings.tsx"
Cohesion: 0.18
Nodes (3): ExchangeRate, DEFAULT_RATES, widgetsApi

### Community 38 - "Tools.tsx"
Cohesion: 0.18
Nodes (9): ACCENT, FULL_HEIGHT_TOOLS, GROUPS, LANGUAGES, PdfConvert(), PROPOSAL_TOOLS, READY_TOOLS, Tool (+1 more)

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
Cohesion: 0.21
Nodes (15): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), FALLBACK_VALUES, AllTasksView(), fmtDue(), Item (+7 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.31
Nodes (10): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+2 more)

### Community 44 - "BxEvent"
Cohesion: 0.26
Nodes (10): Calc(), CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES (+2 more)

### Community 45 - "MoneyInput.tsx"
Cohesion: 0.20
Nodes (11): DividendCalc(), fmt(), TREATIES, TREATY_LABELS, format(), MoneyInput(), Props, fmt() (+3 more)

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
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 51 - "pcClean.ts"
Cohesion: 0.17
Nodes (13): DocTemplate, BusinessBxDatabase, BxCounterparty, db, NewCounterparty, useCounterparties(), useExchangeRates(), EXPENSE_CATS (+5 more)

### Community 52 - "knowledgeRepo.ts"
Cohesion: 0.71
Nodes (5): applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, normalizeFontScale(), saveFontScale()

### Community 53 - "WidgetBoundary"
Cohesion: 0.19
Nodes (14): Props, Props, EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props, COLUMNS (+6 more)

### Community 54 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 55 - "uiScale.ts"
Cohesion: 0.29
Nodes (9): describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), EventActivity, EventActivityType (+1 more)

### Community 56 - "Sidebar.tsx"
Cohesion: 0.70
Nodes (4): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites()

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 58 - "EimzoDiag.tsx"
Cohesion: 0.14
Nodes (28): registerIpcHandlers(), parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile(), cleanup(), parseCertInfo(), pickFileToSign() (+20 more)

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "currency.ts"
Cohesion: 0.83
Nodes (3): useEconomicIndicators(), fmt(), NdflCalc()

### Community 65 - "pcClean.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 68 - "ToastContext.tsx"
Cohesion: 0.15
Nodes (14): CompanyProvider(), check(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, useToast() (+6 more)

## Knowledge Gaps
- **302 isolated node(s):** `gotLock`, `TrayState`, `api`, `BxApi`, `Props` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `todayISO()` connect `todayISO` to `CompanyContext.tsx`, `Templates.tsx`, `ipc.ts`, `useEvents.ts`, `TrayView.tsx`, `Currency.tsx`, `Finance.tsx`, `CalendarView.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`, `types.ts`, `EcpManager.tsx`, `Settings.tsx`, `Planner.tsx`, `DigestView.tsx`, `FocusView.tsx`, `pcClean.ts`, `WidgetBoundary`, `currency.ts`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `supabase` connect `supabase.ts` to `CompanyContext.tsx`, `useToast`, `Library.tsx`, `Templates.tsx`, `ipc.ts`, `referenceRepo.ts`, `Planner.tsx`, `useEvents.ts`, `Translator.tsx`, `TrayView.tsx`, `CalendarPage.tsx`, `Finance.tsx`, `numToWords.ts`, `errorReporter.ts`, `uiScale.ts`, `Topbar.tsx`, `types.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `useToast()` connect `ToastContext.tsx` to `Calc.tsx`, `CompanyContext.tsx`, `useCompany`, `Library.tsx`, `useToast`, `Templates.tsx`, `ipc.ts`, `Planner.tsx`, `BxEvent`, `Translator.tsx`, `Finance.tsx`, `numToWords.ts`, `types.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `api` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.060655737704918035 - nodes in this community are weakly interconnected._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0966183574879227 - nodes in this community are weakly interconnected._