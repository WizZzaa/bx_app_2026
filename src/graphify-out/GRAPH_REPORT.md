# Graph Report - src  (2026-07-18)

## Corpus Check
- 258 files · ~3,426,657 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1465 nodes · 3515 edges · 76 communities (72 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cfcb1ff7`
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
- logger.ts
- uzHolidays.ts
- vite-env.d.ts
- PLAN_LIMITS
- DateCalc.tsx
- OcrTool.tsx
- CalendarPage.tsx
- DocumentViewModeSwitch.tsx
- DateCalc.tsx
- DigestView.tsx
- newsFeed.ts
- DocumentViewModeSwitch.tsx
- DailyTasksModal.tsx
- ecpParser.ts
- QuickNotes.tsx

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 51 edges
2. `useCompany()` - 37 edges
3. `supabase` - 35 edges
4. `useToast()` - 33 edges
5. `BxEvent` - 33 edges
6. `usePlan()` - 29 edges
7. `registerIpcHandlers()` - 28 edges
8. `BixWidget()` - 18 edges
9. `EventStatus` - 18 edges
10. `Templates()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `BixWidget()` --indirect_call--> `todayISO()`  [INFERRED]
  src/renderer/pages/BixWidget.tsx → renderer/lib/dates.ts
- `BixWidget()` --indirect_call--> `delay()`  [INFERRED]
  src/renderer/pages/BixWidget.tsx → renderer/lib/onecApi.ts
- `BixWidget()` --indirect_call--> `scan()`  [INFERRED]
  src/renderer/pages/BixWidget.tsx → renderer/lib/onecApi.ts
- `BixWidget()` --calls--> `usePlan()`  [EXTRACTED]
  src/renderer/pages/BixWidget.tsx → renderer/lib/plan.tsx
- `BixWidget()` --calls--> `uid()`  [EXTRACTED]
  src/renderer/pages/BixWidget.tsx → renderer/lib/uid.ts

## Import Cycles
- None detected.

## Communities (76 total, 4 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.17
Nodes (18): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+10 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.06
Nodes (62): CompareFieldRowProps, ConflictModal(), ConflictModalProps, parseBankStatement(), ParsedTransaction, BxCounterparty, BxTransaction, db (+54 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.06
Nodes (55): activityLabel(), CompanyProfileActivityPanel(), dateTime(), LEGAL_FORM_LABELS, CompanyProfileWizard(), CompanyWizardInitial, defaultRuleIds(), EMPTY_DETAILS (+47 more)

### Community 3 - "useToast"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 4 - "Library.tsx"
Cohesion: 0.09
Nodes (42): KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext(), retrieveArticles() (+34 more)

### Community 5 - "App.tsx"
Cohesion: 0.14
Nodes (16): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+8 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.11
Nodes (29): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META (+21 more)

### Community 8 - "ipc.ts"
Cohesion: 0.16
Nodes (19): isPinEnabled(), parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME (+11 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.20
Nodes (14): indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode, ReferenceSection (+6 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.20
Nodes (13): App(), AboutModal(), Props, LoginScreen(), Props, applyTheme(), BX_THEMES, BxTheme (+5 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.05
Nodes (52): TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, delay(), scan(), buildPlainLanguagePrompt(), buildTranslationPrompt() (+44 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.15
Nodes (13): PRO_PERKS, dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, ReferenceView() (+5 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.13
Nodes (13): ErrorBoundary, Props, State, isBixWidget, root, rootElement, detectPlatform(), installGlobalErrorReporting() (+5 more)

### Community 14 - "widgetsApi.ts"
Cohesion: 0.10
Nodes (10): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyExportRow (+2 more)

### Community 15 - "localDb.ts"
Cohesion: 0.22
Nodes (16): PinScreen(), Props, AttemptsData, getAttemptsData(), getAttemptsLeft(), isLocked(), LockStatus, pureDjb2() (+8 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.14
Nodes (20): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo() (+12 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.07
Nodes (44): Cmd, CommandPalette(), COMMANDS, CompanyProvider(), uid(), Props, AddCardPayload, BoardKanban() (+36 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.25
Nodes (9): applyBankDirectory(), BankDirectoryRow, DEFAULT_BANK_DIRECTORY, fromRow(), loadBankDirectory(), directory, rates, BankDirectoryEntry (+1 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.21
Nodes (9): CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row(), fmt() (+1 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.06
Nodes (36): check(), fetch(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, ToastProvider() (+28 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.17
Nodes (15): CalBoard, CalendarView(), formatCalendarDate(), formatFullDate(), formatShortDate(), formatWeekday(), mondayOf(), MONTHS (+7 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.18
Nodes (15): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), EVENT_TYPE_LABELS, formatPlannerDate() (+7 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.13
Nodes (17): CompanySwitcher(), initialCollapsed(), MenuItem, MenuSection, navItemClass(), Sidebar(), useCompany(), Ctx (+9 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.17
Nodes (17): Button(), Props, styles, Variant, Props, BxBridge, formatBytes(), onecApi (+9 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.18
Nodes (15): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), TaxDeadline, taxDeadlines (+7 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.24
Nodes (9): buildTaskNotification(), BxNotification, ROW, formatDueDate(), GlobalNotificationRow, NotificationSource, NotificationTarget, TaskNotificationRow (+1 more)

### Community 28 - "main.ts"
Cohesion: 0.14
Nodes (29): appAsset(), broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), createTray(), createTrayWindow(), createWindow(), dockTrayWindow() (+21 more)

### Community 29 - "types.ts"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.14
Nodes (9): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+1 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.20
Nodes (14): useDocumentViewMode(), ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar() (+6 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.25
Nodes (8): AGE_COEFFS, COMMERCIAL_ENGINES, EngineGroup, fmt(), MOTO_ENGINES, PASSENGER_ENGINES, RecyclingCalc(), VehicleCategory

### Community 34 - "Topbar.tsx"
Cohesion: 0.22
Nodes (11): getNewsItem(), LEGISLATION_NEWS, NewsItem, News(), NEWS_SOURCES, openLink(), buildAiPrompt(), buildTaskNote() (+3 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.24
Nodes (13): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchRateOnDate(), fetchRates(), fetchText(), FLAGS (+5 more)

### Community 36 - "supabase.ts"
Cohesion: 0.23
Nodes (15): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+7 more)

### Community 37 - "Settings.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 38 - "InnCheckTool.tsx"
Cohesion: 0.22
Nodes (14): Topbar(), AccountRow, loadAccounts(), loadIndicators(), loadNsbu(), loadTaxes(), NsbuRow, buildIndex() (+6 more)

### Community 39 - "taxSeeder.ts"
Cohesion: 0.13
Nodes (20): Props, describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), EventModal() (+12 more)

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
Cohesion: 0.17
Nodes (16): useEconomicIndicators(), format(), MoneyInput(), Props, fmt(), NdflCalc(), fmt(), PenaltyCalc() (+8 more)

### Community 45 - "MoneyInput.tsx"
Cohesion: 0.50
Nodes (4): DividendCalc(), fmt(), TREATIES, TREATY_LABELS

### Community 46 - "newsFeed.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 47 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 48 - "onecCache.ts"
Cohesion: 0.44
Nodes (8): cleanCache(), copyFolderRecursive(), dirSize(), getCacheRoots(), getV8iPath(), parseV8i(), scanCache(), CacheEntry

### Community 49 - "pcClean.ts"
Cohesion: 0.18
Nodes (13): fetchTrader(), TraderInfo, checkRunningBrowsers(), cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents() (+5 more)

### Community 50 - "FocusView.tsx"
Cohesion: 0.25
Nodes (7): calculateRegimeComparison(), fmt(), parseMln(), RegimeCompareCalc(), RegimeInputs, RegimeOutcome, TaxRegime

### Community 51 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 52 - "uiScale.ts"
Cohesion: 0.71
Nodes (5): applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, normalizeFontScale(), saveFontScale()

### Community 53 - "InnCheck.tsx"
Cohesion: 0.24
Nodes (11): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), getSpecialDay(), isNonWorkingSpecialDay() (+3 more)

### Community 55 - "uiScale.ts"
Cohesion: 0.24
Nodes (13): createSiteWindow(), openSiteSession(), partitionFor(), resetSiteSession(), secureWebPreferences(), siteWindows, BusyAction, PRESETS (+5 more)

### Community 56 - "PdfConvert.tsx"
Cohesion: 0.13
Nodes (18): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites(), ACCENT, FULL_HEIGHT_TOOLS, GROUPS, base64ToArrayBuffer() (+10 more)

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 58 - "EimzoDiag.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "logger.ts"
Cohesion: 0.30
Nodes (9): AuthGate(), clearPin(), hasPin(), setPinEnabled(), AuthState, useAuth(), getIdleTimeout(), IdleTimeout (+1 more)

### Community 61 - "uzHolidays.ts"
Cohesion: 0.21
Nodes (10): DayType, getMonthNorms(), MONTH_NORMS_2026, MonthNorms, SPECIAL_DAYS_2026, _specialDayMap, specialDaysForMonth(), UZ_HOLIDAYS_2026 (+2 more)

### Community 65 - "DateCalc.tsx"
Cohesion: 0.30
Nodes (10): isWorkday(), UZ_HOLIDAYS, addCalendarDays(), addWorkdays(), DateCalc(), diffDays(), diffWorkdays(), fmt() (+2 more)

### Community 66 - "OcrTool.tsx"
Cohesion: 0.50
Nodes (4): escapeHtml(), HTML_ENTITIES, LANGUAGES, OcrTool()

### Community 67 - "CalendarPage.tsx"
Cohesion: 0.27
Nodes (9): holidayName(), SpecialDay, CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, fetchDatedCards() (+1 more)

### Community 68 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.20
Nodes (4): DocumentWorkspace, STEPS, IconName, PATHS

### Community 69 - "DateCalc.tsx"
Cohesion: 0.21
Nodes (18): registerIpcHandlers(), cleanup(), parseCertInfo(), pickFileToSign(), pickSigFile(), signFile(), SignResult, VerifyResult (+10 more)

### Community 70 - "DigestView.tsx"
Cohesion: 0.24
Nodes (6): DigestView(), dueChip(), EcpKey, fmtSum(), UnifiedDigestItem, UnpaidTx

### Community 71 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 72 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.33
Nodes (3): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps

### Community 73 - "DailyTasksModal.tsx"
Cohesion: 0.15
Nodes (23): Item, Props, TYPE_BADGE, CalCard, PRI_COLOR, Props, TYPE_ICON, Props (+15 more)

### Community 74 - "ecpParser.ts"
Cohesion: 0.50
Nodes (4): parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile()

### Community 75 - "QuickNotes.tsx"
Cohesion: 0.34
Nodes (10): CanonicalEventInput, createCanonicalEvent(), emitPlannerReload(), subscribePlannerReload(), collectEventPages(), EventKind, EventPriority, EventRecurrence (+2 more)

## Knowledge Gaps
- **337 isolated node(s):** `gotLock`, `TrayState`, `api`, `BxApi`, `Panel` (+332 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `CompanyContext.tsx` to `Settings.tsx`, `Calc.tsx`, `useToast`, `Library.tsx`, `ipc.ts`, `referenceRepo.ts`, `Translator.tsx`, `TrayView.tsx`, `Finance.tsx`, `ListView.tsx`, `Topbar.tsx`, `ReferenceView.tsx`, `types.ts`, `syncQueue.ts`, `Topbar.tsx`, `supabase.ts`, `taxSeeder.ts`, `Planner.tsx`, `logger.ts`, `QuickNotes.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `Counterparties.tsx` to `Calc.tsx`, `CompanyContext.tsx`, `Templates.tsx`, `ipc.ts`, `referenceRepo.ts`, `Translator.tsx`, `Currency.tsx`, `Finance.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`, `types.ts`, `horoscope.ts`, `Settings.tsx`, `taxSeeder.ts`, `Planner.tsx`, `BxEvent`, `EimzoDiag.tsx`, `DateCalc.tsx`, `DigestView.tsx`, `DailyTasksModal.tsx`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `useCompany()` connect `Topbar.tsx` to `Settings.tsx`, `Calc.tsx`, `CompanyContext.tsx`, `CalendarPage.tsx`, `useToast`, `InnCheckTool.tsx`, `Templates.tsx`, `ipc.ts`, `Planner.tsx`, `Translator.tsx`, `TaxCalculator.tsx`, `Dashboard.tsx`, `ReferenceView.tsx`, `horoscope.ts`, `syncQueue.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `api` to the rest of the system?**
  _337 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.055077452667814115 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.057902973395931145 - nodes in this community are weakly interconnected._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08853410740203194 - nodes in this community are weakly interconnected._