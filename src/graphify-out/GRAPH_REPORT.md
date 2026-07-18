# Graph Report - src  (2026-07-18)

## Corpus Check
- 258 files · ~5,061,463 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1487 nodes · 3554 edges · 77 communities (74 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d37927b0`
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
8. `BixWidget()` - 23 edges
9. `EventStatus` - 18 edges
10. `Templates()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `CommandPalette()` --indirect_call--> `c()`  [INFERRED]
  renderer/components/CommandPalette.tsx → renderer/pages/planner/BoardKanban.tsx
- `BxBridge` --references--> `SiteResetMode`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts
- `BxBridge` --references--> `SiteSessionResult`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts
- `CurrencyExportRow` --references--> `CurrencyRate`  [EXTRACTED]
  renderer/pages/Currency.tsx → shared/types.ts
- `SiteSessionReset()` --calls--> `normalizeSiteUrl()`  [EXTRACTED]
  renderer/pages/tools/SiteSessionReset.tsx → shared/siteSession.ts

## Import Cycles
- None detected.

## Communities (77 total, 3 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.17
Nodes (17): CompanyRoleGuide(), ROLE_TONES, INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE, COMPANY_ROLE_LABELS (+9 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.08
Nodes (38): getNewsItem(), LEGISLATION_NEWS, NewsItem, indicators, paymentCodes, taxes, DataMeta, Indicator (+30 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.06
Nodes (55): activityLabel(), CompanyProfileActivityPanel(), dateTime(), LEGAL_FORM_LABELS, CompanyProfileWizard(), CompanyWizardInitial, defaultRuleIds(), EMPTY_DETAILS (+47 more)

### Community 3 - "useToast"
Cohesion: 0.17
Nodes (18): parseBankStatement(), ParsedTransaction, BxTransaction, exportTransactionsToExcel(), baseTx, filterPayments(), paymentDayDiff(), paymentSummary() (+10 more)

### Community 4 - "Library.tsx"
Cohesion: 0.08
Nodes (42): KB_ARTICLES, KB_CATEGORIES, KB_CATEGORY_META, KB_POPULAR_IDS, KbArticle, KbCategoryMeta, buildLocalDataContext(), retrieveArticles() (+34 more)

### Community 5 - "App.tsx"
Cohesion: 0.09
Nodes (19): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+11 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.09
Nodes (32): DocumentViewModeSwitch(), DocumentViewModeSwitchProps, useDocumentViewMode(), DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase (+24 more)

### Community 8 - "ipc.ts"
Cohesion: 0.16
Nodes (19): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, BxTheme (+11 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.13
Nodes (10): TranslatorTutorial(), TranslationLanguage, TranslationMode, BxUserDocument, useDocuments(), DOCUMENT_CATEGORIES, extractFileText(), getErrorMessage() (+2 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.29
Nodes (12): App(), LoginScreen(), Props, Topbar(), search(), applyTheme(), BX_THEMES, currentTheme() (+4 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.06
Nodes (33): AccuracyKind, ACTIONS, AnimationSpeed, BIX_JOKES, BIX_PHRASES, BixActivity, BixAnimationCycle, BixAnimationState (+25 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.18
Nodes (12): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, ReferenceView(), RefTabId (+4 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.06
Nodes (45): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, isBixWidget, root (+37 more)

### Community 14 - "widgetsApi.ts"
Cohesion: 0.21
Nodes (14): BxCounterparty, NewCounterparty, useCounterparties(), COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS (+6 more)

### Community 15 - "localDb.ts"
Cohesion: 0.15
Nodes (16): delay(), scan(), animationDelay(), BixWidget(), clampPanelOffset(), isWithinQuietHours(), jokeDelay(), loadBixSettings() (+8 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.06
Nodes (39): applyBankDirectory(), BankDirectoryRow, DEFAULT_BANK_DIRECTORY, fromRow(), loadBankDirectory(), directory, rates, Condition (+31 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.05
Nodes (57): CompanyProvider(), daysFromNowISO(), useToast(), uid(), AllTasksView(), fmtDue(), Props, AddCardPayload (+49 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.30
Nodes (13): detectAndRegisterConflict(), addToSyncQueue(), getSyncQueue(), isTransientError(), pushItem(), PushResult, removeFromSyncQueue(), saveSyncQueue() (+5 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.15
Nodes (15): ACCENT, CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row() (+7 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.14
Nodes (18): TaxDeadline, CalBoard, CalendarView(), formatCalendarDate(), formatFullDate(), formatShortDate(), formatWeekday(), mondayOf() (+10 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.40
Nodes (5): EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props

### Community 24 - "Topbar.tsx"
Cohesion: 0.14
Nodes (11): Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan, PlanCtx, PlanLimits, PlanProvider() (+3 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.16
Nodes (18): UpdateSnapshot, Button(), Props, styles, Variant, Props, BxBridge, formatBytes() (+10 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.20
Nodes (13): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), taxDeadlines, fmtNum() (+5 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.15
Nodes (17): check(), fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), CheckResult (+9 more)

### Community 28 - "main.ts"
Cohesion: 0.14
Nodes (30): appAsset(), broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), constrainTrayPosition(), constrainTrayWindowToDisplay(), createTray(), createTrayWindow() (+22 more)

### Community 29 - "types.ts"
Cohesion: 0.15
Nodes (20): NotificationsWidget(), styleByLevel, loadEcpKeys(), buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice (+12 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.14
Nodes (9): Props, State, WidgetBoundary, Dashboard(), DEFAULT_WIDGETS, getExpiringEcpCount(), greeting(), ServiceVisibility (+1 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.24
Nodes (14): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+6 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.25
Nodes (8): AGE_COEFFS, COMMERCIAL_ENGINES, EngineGroup, fmt(), MOTO_ENGINES, PASSENGER_ENGINES, RecyclingCalc(), VehicleCategory

### Community 33 - "App.tsx"
Cohesion: 0.29
Nodes (7): CompanyTeamPanel(), CompanySwitcher(), PRO_PERKS, useCompany(), usePlan(), Documents(), Finance()

### Community 34 - "Topbar.tsx"
Cohesion: 0.29
Nodes (8): CompareFieldRowProps, ConflictModal(), ConflictModalProps, db, ExchangeRate, SyncConflict, getConflicts(), resolveConflict()

### Community 35 - "Icon.tsx"
Cohesion: 0.29
Nodes (11): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchText(), FLAGS, numeric(), parseAloqabankRates() (+3 more)

### Community 36 - "supabase.ts"
Cohesion: 0.26
Nodes (12): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+4 more)

### Community 37 - "Settings.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 38 - "InnCheckTool.tsx"
Cohesion: 0.39
Nodes (10): buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName(), modeName(), normalizeArchiveFileName(), translatedFileName(), TRANSLATION_LANGUAGES (+2 more)

### Community 39 - "taxSeeder.ts"
Cohesion: 0.29
Nodes (9): describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), EventActivity, EventActivityType (+1 more)

### Community 40 - "workbenchCatalog.ts"
Cohesion: 0.20
Nodes (13): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchKind, WorkbenchProposal (+5 more)

### Community 41 - "InpsCalc.tsx"
Cohesion: 0.17
Nodes (13): fmt(), InpsCalc(), format(), MoneyInput(), Props, fmt(), PenaltyCalc(), fmt() (+5 more)

### Community 42 - "todayISO"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 43 - "Planner.tsx"
Cohesion: 0.33
Nodes (10): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+2 more)

### Community 44 - "BxEvent"
Cohesion: 0.26
Nodes (10): Calc(), CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES (+2 more)

### Community 45 - "MoneyInput.tsx"
Cohesion: 0.50
Nodes (4): DividendCalc(), fmt(), TREATIES, TREATY_LABELS

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
Nodes (12): ParsedEcpInfo, TraderInfo, cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp() (+4 more)

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
Cohesion: 0.48
Nodes (5): escapeDocumentHtml(), groupPdfTextItems(), HTML_ENTITIES, PdfConvert(), PdfTextItem

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 58 - "EimzoDiag.tsx"
Cohesion: 0.22
Nodes (12): EcpKeyRecord, getSafe(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager(), EMPTY_FORM (+4 more)

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 61 - "uzHolidays.ts"
Cohesion: 0.15
Nodes (12): DayType, holidayName(), MONTH_NORMS_2026, MonthNorms, SPECIAL_DAYS_2026, SpecialDay, _specialDayMap, specialDaysForMonth() (+4 more)

### Community 65 - "DateCalc.tsx"
Cohesion: 0.35
Nodes (9): isWorkday(), addCalendarDays(), addWorkdays(), DateCalc(), diffDays(), diffWorkdays(), fmt(), fmtLong() (+1 more)

### Community 66 - "OcrTool.tsx"
Cohesion: 0.50
Nodes (4): escapeHtml(), HTML_ENTITIES, LANGUAGES, OcrTool()

### Community 67 - "CalendarPage.tsx"
Cohesion: 0.33
Nodes (8): getMonthNorms(), CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, fetchDatedCards(), toggleCardDone()

### Community 68 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.25
Nodes (5): Cmd, CommandPalette(), COMMANDS, IconName, PATHS

### Community 69 - "DateCalc.tsx"
Cohesion: 0.12
Nodes (29): registerIpcHandlers(), fetchRateOnDate(), fetchRates(), parseCertificateText(), parsePfx(), pickPfxFile(), cleanup(), parseCertInfo() (+21 more)

### Community 70 - "DigestView.tsx"
Cohesion: 0.24
Nodes (6): DigestView(), dueChip(), EcpKey, fmtSum(), UnifiedDigestItem, UnpaidTx

### Community 71 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 72 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.25
Nodes (6): DocumentViewMode, TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, loadDocumentWorkspaceMode(), loadTranslatorWorkspaceMode()

### Community 73 - "DailyTasksModal.tsx"
Cohesion: 0.15
Nodes (20): Item, Props, TYPE_BADGE, CalCard, PRI_COLOR, Props, TYPE_ICON, Props (+12 more)

### Community 75 - "QuickNotes.tsx"
Cohesion: 0.17
Nodes (19): EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS (+11 more)

### Community 76 - "Sidebar.tsx"
Cohesion: 0.21
Nodes (8): AboutModal(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass(), Sidebar(), ChangelogEntry

### Community 77 - "TxModal.tsx"
Cohesion: 0.25
Nodes (11): nextRecurrenceISO(), todayISO(), toLocalISO(), DEFAULT_RATES, useExchangeRates(), EXPENSE_CATS, INCOME_CATS, Props (+3 more)

### Community 78 - "SystemTaskBoard.tsx"
Cohesion: 0.27
Nodes (8): Props, COLUMNS, groupEventsByStatus(), PRIORITY_BORDER, Props, SystemTaskBoard(), CompanyMember, EventStatus

## Knowledge Gaps
- **350 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+345 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `todayISO()` connect `TxModal.tsx` to `Calc.tsx`, `CompanyContext.tsx`, `useToast`, `Templates.tsx`, `ipc.ts`, `Translator.tsx`, `localDb.ts`, `Currency.tsx`, `Finance.tsx`, `Counterparties.tsx`, `CacheCleaner.tsx`, `Dashboard.tsx`, `types.ts`, `horoscope.ts`, `App.tsx`, `Settings.tsx`, `Planner.tsx`, `EimzoDiag.tsx`, `DateCalc.tsx`, `DigestView.tsx`, `DailyTasksModal.tsx`, `QuickNotes.tsx`, `SystemTaskBoard.tsx`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `supabase` connect `CompanyContext.tsx` to `Settings.tsx`, `Calc.tsx`, `Library.tsx`, `ipc.ts`, `referenceRepo.ts`, `Translator.tsx`, `TrayView.tsx`, `Currency.tsx`, `Finance.tsx`, `ListView.tsx`, `TaxCalculator.tsx`, `Topbar.tsx`, `types.ts`, `Topbar.tsx`, `supabase.ts`, `taxSeeder.ts`, `Planner.tsx`, `newsFeed.ts`, `QuickNotes.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Finance.tsx` to `Settings.tsx`, `App.tsx`, `CompanyContext.tsx`, `useToast`, `Library.tsx`, `InnCheckTool.tsx`, `Templates.tsx`, `ipc.ts`, `referenceRepo.ts`, `Planner.tsx`, `BxEvent`, `TrayView.tsx`, `widgetsApi.ts`, `numToWords.ts`, `TaxCalculator.tsx`, `ReferenceView.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _350 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07982583454281568 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.057902973395931145 - nodes in this community are weakly interconnected._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07910014513788098 - nodes in this community are weakly interconnected._