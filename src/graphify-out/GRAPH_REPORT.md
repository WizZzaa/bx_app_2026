# Graph Report - /private/tmp/bx-graph-src-23118-release  (2026-07-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1521 nodes · 3644 edges · 84 communities (81 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `91e68369`
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
- useCompany
- CurrencyHistory.tsx
- uzHolidays.ts
- useNotifications.ts
- EventActivityTimeline.tsx
- bankDirectory.ts
- RegimeCompareCalc.tsx
- plan.tsx
- DigestView.tsx
- onecCache.ts
- taxCalendar.ts
- FocusView.tsx
- pcClean.ts
- TxModal.tsx
- onecProcess.ts
- ImportModal.tsx
- uiScale.ts
- PdfConvert.tsx
- Transliterate.tsx
- DailyTasksModal.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- weather.ts
- OcrTool.tsx
- vite-env.d.ts
- PLAN_LIMITS

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 52 edges
2. `useCompany()` - 37 edges
3. `supabase` - 36 edges
4. `useToast()` - 33 edges
5. `BxEvent` - 33 edges
6. `usePlan()` - 31 edges
7. `registerIpcHandlers()` - 28 edges
8. `BixWidget()` - 23 edges
9. `EventStatus` - 18 edges
10. `Templates()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `CommandPalette()` --indirect_call--> `c()`  [INFERRED]
  ../../../Users/chernikov/repo/busines_bx/app/src/renderer/components/CommandPalette.tsx → ../../../Users/chernikov/repo/busines_bx/app/src/renderer/pages/planner/BoardKanban.tsx
- `useDocumentViewMode()` --indirect_call--> `loadDocumentWorkspaceMode()`  [INFERRED]
  ../../../Users/chernikov/repo/busines_bx/app/src/renderer/components/documents/DocumentViewModeSwitch.tsx → ../../../Users/chernikov/repo/busines_bx/app/src/renderer/lib/workspaceModes.ts
- `CompanySwitcher()` --indirect_call--> `c()`  [INFERRED]
  ../../../Users/chernikov/repo/busines_bx/app/src/renderer/components/layout/CompanySwitcher.tsx → ../../../Users/chernikov/repo/busines_bx/app/src/renderer/pages/planner/BoardKanban.tsx
- `BixWidget()` --indirect_call--> `todayISO()`  [INFERRED]
  ../../../Users/chernikov/repo/busines_bx/app/src/renderer/pages/BixWidget.tsx → ../../../Users/chernikov/repo/busines_bx/app/src/renderer/lib/dates.ts
- `CurrencyConverter()` --calls--> `todayISO()`  [EXTRACTED]
  ../../../Users/chernikov/repo/busines_bx/app/src/renderer/pages/tools/CurrencyConverter.tsx → ../../../Users/chernikov/repo/busines_bx/app/src/renderer/lib/dates.ts

## Import Cycles
- None detected.

## Communities (84 total, 3 thin omitted)

### Community 0 - "Library.tsx"
Cohesion: 0.06
Nodes (55): PRO_PERKS, buildContentAuditInventory(), ContentAuditItem, ContentAuditStatus, ContentAuditSummary, ContentKind, isOfficialSourceUrl(), knowledgeItems() (+47 more)

### Community 1 - "useBoards.ts"
Cohesion: 0.05
Nodes (51): Cmd, CommandPalette(), COMMANDS, CompanyProvider(), uid(), AGE_COEFFS, COMMERCIAL_ENGINES, EngineGroup (+43 more)

### Community 2 - "pin.ts"
Cohesion: 0.07
Nodes (40): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, isBixWidget, root (+32 more)

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
Cohesion: 0.14
Nodes (24): indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode, ReferenceSection (+16 more)

### Community 8 - "Dashboard.tsx"
Cohesion: 0.11
Nodes (19): Props, State, WidgetBoundary, defaultRuntimeWidgetPolicy(), defaults, isRuntimeWidgetAllowed(), loadRuntimeWidgetPolicy(), normalizePolicy() (+11 more)

### Community 9 - "ipc.ts"
Cohesion: 0.15
Nodes (23): registerIpcHandlers(), fetchRateOnDate(), fetchRates(), pickPfxFile(), cleanup(), parseCertInfo(), pickFileToSign(), pickSigFile() (+15 more)

### Community 10 - "Tools.tsx"
Cohesion: 0.11
Nodes (22): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+14 more)

### Community 11 - "types.ts"
Cohesion: 0.16
Nodes (18): UpdateSnapshot, Button(), Props, styles, Variant, Props, BxBridge, formatBytes() (+10 more)

### Community 12 - "Currency.tsx"
Cohesion: 0.14
Nodes (20): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo() (+12 more)

### Community 13 - "CompanyTeamPanel.tsx"
Cohesion: 0.17
Nodes (18): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+10 more)

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
Nodes (19): parseSettingsBackup(), SettingsBackupPayload, SettingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, BxTheme (+11 more)

### Community 18 - "useToast"
Cohesion: 0.13
Nodes (17): check(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, useToast(), CheckResult (+9 more)

### Community 19 - "CalendarPage.tsx"
Cohesion: 0.17
Nodes (18): SpecialDay, CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, emitPlannerReload(), subscribePlannerReload() (+10 more)

### Community 20 - "Support.tsx"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 21 - "Finance.tsx"
Cohesion: 0.23
Nodes (14): BxTransaction, exportTransactionsToExcel(), baseTx, filterPayments(), paymentDayDiff(), paymentSummary(), paymentTiming(), PaymentView (+6 more)

### Community 22 - "useEvents.ts"
Cohesion: 0.19
Nodes (17): EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS (+9 more)

### Community 23 - "App.tsx"
Cohesion: 0.21
Nodes (11): App(), Topbar(), search(), applyTheme(), BX_THEMES, currentTheme(), nextTheme(), normalizeTheme() (+3 more)

### Community 24 - "types.ts"
Cohesion: 0.14
Nodes (15): Props, statusMeta, TaskRow, tasksRepo, CalendarEvent, CompanyLanguage, CompanyNotificationChannel, CompanyProfileDetails (+7 more)

### Community 25 - "Services.tsx"
Cohesion: 0.21
Nodes (16): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+8 more)

### Community 26 - "numToWords.ts"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 27 - "Calc.tsx"
Cohesion: 0.15
Nodes (15): ACCENT, CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row() (+7 more)

### Community 28 - "usePlan"
Cohesion: 0.15
Nodes (13): AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass() (+5 more)

### Community 29 - "preload.ts"
Cohesion: 0.16
Nodes (13): parseCertificateText(), ParsedEcpInfo, parsePfx(), TraderInfo, BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed() (+5 more)

### Community 30 - "CompanyContext.tsx"
Cohesion: 0.22
Nodes (15): CompanyProfileWizard(), CompanyWizardInitial, EMPTY_DETAILS, formCalendarHint(), formLabel(), initialProfile(), LEGAL_FORMS, obligationTraits() (+7 more)

### Community 31 - "Documents.tsx"
Cohesion: 0.20
Nodes (14): useDocumentViewMode(), ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar() (+6 more)

### Community 32 - "NewsDetail.tsx"
Cohesion: 0.22
Nodes (11): getNewsItem(), LEGISLATION_NEWS, NewsItem, News(), NEWS_SOURCES, openLink(), buildAiPrompt(), buildTaskNote() (+3 more)

### Community 33 - "ListView.tsx"
Cohesion: 0.16
Nodes (16): AllTasksView(), fmtDue(), Item, Props, TYPE_BADGE, Props, fmtDate(), ListView() (+8 more)

### Community 34 - "BxEvent"
Cohesion: 0.19
Nodes (14): Props, Props, EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props, COLUMNS (+6 more)

### Community 35 - "siteSession.ts"
Cohesion: 0.24
Nodes (13): createSiteWindow(), openSiteSession(), partitionFor(), resetSiteSession(), secureWebPreferences(), siteWindows, BusyAction, PRESETS (+5 more)

### Community 36 - "localDb.ts"
Cohesion: 0.21
Nodes (11): CompareFieldRowProps, ConflictModal(), ConflictModalProps, BxCounterparty, db, ExchangeRate, SyncConflict, getConflicts() (+3 more)

### Community 37 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.17
Nodes (8): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps, TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, loadDocumentWorkspaceMode(), loadTranslatorWorkspaceMode()

### Community 38 - "CalendarView.tsx"
Cohesion: 0.17
Nodes (15): CalBoard, CalendarView(), formatCalendarDate(), formatFullDate(), formatShortDate(), formatWeekday(), mondayOf(), MONTHS (+7 more)

### Community 39 - "taxSeeder.ts"
Cohesion: 0.21
Nodes (15): CompanyLegalForm, ObligationRuleDecision, addDaysISO(), buildTaxDeadlineEvents(), buildTaxDeadlineRuleOptions(), CompanyObligationTraits, CompanyRegime, CompanyTaxProfile (+7 more)

### Community 40 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 41 - "ReferenceView.tsx"
Cohesion: 0.20
Nodes (11): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, RefTabId, tabs (+3 more)

### Community 42 - "validation.ts"
Cohesion: 0.23
Nodes (12): fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), BankCheck(), CheckResult (+4 more)

### Community 43 - "MoneyInput.tsx"
Cohesion: 0.19
Nodes (12): useEconomicIndicators(), DividendCalc(), fmt(), TREATIES, TREATY_LABELS, format(), MoneyInput(), Props (+4 more)

### Community 44 - "SmartCalendar.tsx"
Cohesion: 0.24
Nodes (11): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), getSpecialDay(), isNonWorkingSpecialDay() (+3 more)

### Community 45 - "syncQueue.ts"
Cohesion: 0.30
Nodes (13): detectAndRegisterConflict(), addToSyncQueue(), getSyncQueue(), isTransientError(), pushItem(), PushResult, removeFromSyncQueue(), saveSyncQueue() (+5 more)

### Community 46 - "Counterparties.tsx"
Cohesion: 0.24
Nodes (12): useCounterparties(), COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS, loadCompanyDetails(), saveCompanyDetails() (+4 more)

### Community 47 - "workbenchCatalog.ts"
Cohesion: 0.23
Nodes (10): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchProposal, WorkbenchSector (+2 more)

### Community 48 - "EcpManager.tsx"
Cohesion: 0.22
Nodes (12): EcpKeyRecord, getSafe(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager(), EMPTY_FORM (+4 more)

### Community 49 - "Planner.tsx"
Cohesion: 0.27
Nodes (11): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+3 more)

### Community 50 - "InpsCalc.tsx"
Cohesion: 0.25
Nodes (8): fmt(), InpsCalc(), fmt(), SalaryCalc(), calcPayroll(), DEFAULT_RATES, PayrollRates, PayrollResult

### Community 51 - "SickLeaveCalc.tsx"
Cohesion: 0.26
Nodes (10): Calc(), CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES (+2 more)

### Community 52 - "currency.ts"
Cohesion: 0.29
Nodes (11): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchText(), FLAGS, numeric(), parseAloqabankRates() (+3 more)

### Community 53 - "supabase.ts"
Cohesion: 0.27
Nodes (9): activityLabel(), CompanyProfileActivityPanel(), dateTime(), LEGAL_FORM_LABELS, buildCompanyInsert(), companiesRepo, supabase, CompanyProfileActivity (+1 more)

### Community 54 - "todayISO"
Cohesion: 0.35
Nodes (10): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), fmtNum(), periodLabel(), RegimeId, REGIMES (+2 more)

### Community 55 - "DateCalc.tsx"
Cohesion: 0.27
Nodes (11): holidayName(), isWorkday(), UZ_HOLIDAYS, addCalendarDays(), addWorkdays(), DateCalc(), diffDays(), diffWorkdays() (+3 more)

### Community 56 - "Icon.tsx"
Cohesion: 0.18
Nodes (5): DocumentWorkspace, STEPS, TranslatorTutorial(), IconName, PATHS

### Community 57 - "useCompany"
Cohesion: 0.26
Nodes (8): TaskPanel(), CompanySwitcher(), canShowReminder(), getOnboardingSurface(), OnboardingProfile, OnboardingState, OnboardingWizard(), useCompany()

### Community 58 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 59 - "uzHolidays.ts"
Cohesion: 0.21
Nodes (10): DayType, getMonthNorms(), MONTH_NORMS_2026, MonthNorms, SPECIAL_DAYS_2026, _specialDayMap, specialDaysForMonth(), UZ_HOLIDAYS_2026 (+2 more)

### Community 60 - "useNotifications.ts"
Cohesion: 0.24
Nodes (9): buildTaskNotification(), BxNotification, ROW, formatDueDate(), GlobalNotificationRow, NotificationSource, NotificationTarget, TaskNotificationRow (+1 more)

### Community 61 - "EventActivityTimeline.tsx"
Cohesion: 0.29
Nodes (9): describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), EventActivity, EventActivityType (+1 more)

### Community 62 - "bankDirectory.ts"
Cohesion: 0.25
Nodes (9): applyBankDirectory(), BankDirectoryRow, DEFAULT_BANK_DIRECTORY, fromRow(), loadBankDirectory(), directory, rates, BankDirectoryEntry (+1 more)

### Community 63 - "RegimeCompareCalc.tsx"
Cohesion: 0.25
Nodes (7): calculateRegimeComparison(), fmt(), parseMln(), RegimeCompareCalc(), RegimeInputs, RegimeOutcome, TaxRegime

### Community 64 - "plan.tsx"
Cohesion: 0.27
Nodes (9): Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan, PlanCtx, PlanLimits, PlanProvider() (+1 more)

### Community 65 - "DigestView.tsx"
Cohesion: 0.24
Nodes (6): DigestView(), dueChip(), EcpKey, fmtSum(), UnifiedDigestItem, UnpaidTx

### Community 66 - "onecCache.ts"
Cohesion: 0.44
Nodes (8): cleanCache(), copyFolderRecursive(), dirSize(), getCacheRoots(), getV8iPath(), parseV8i(), scanCache(), CacheEntry

### Community 67 - "taxCalendar.ts"
Cohesion: 0.36
Nodes (7): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), TaxDeadline

### Community 68 - "FocusView.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 69 - "pcClean.ts"
Cohesion: 0.39
Nodes (7): cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents(), scanPcTemp(), TempDirInfo

### Community 70 - "TxModal.tsx"
Cohesion: 0.32
Nodes (7): useExchangeRates(), EXPENSE_CATS, INCOME_CATS, Props, today, TxModal(), NewTransaction

### Community 71 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 72 - "ImportModal.tsx"
Cohesion: 0.43
Nodes (5): parseBankStatement(), ParsedTransaction, fmt(), ImportModal(), ImportModalProps

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

### Community 78 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 79 - "weather.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 80 - "OcrTool.tsx"
Cohesion: 0.50
Nodes (4): escapeHtml(), HTML_ENTITIES, LANGUAGES, OcrTool()

## Knowledge Gaps
- **359 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+354 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `supabase.ts` to `Library.tsx`, `useBoards.ts`, `pin.ts`, `BixWidget.tsx`, `referenceRepo.ts`, `Dashboard.tsx`, `CompanyTeamPanel.tsx`, `Translator.tsx`, `TrayView.tsx`, `Settings.tsx`, `CalendarPage.tsx`, `Support.tsx`, `useEvents.ts`, `types.ts`, `Services.tsx`, `CompanyContext.tsx`, `Documents.tsx`, `NewsDetail.tsx`, `localDb.ts`, `taxSeeder.ts`, `syncQueue.ts`, `Planner.tsx`, `useCompany`, `useNotifications.ts`, `EventActivityTimeline.tsx`, `bankDirectory.ts`, `plan.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `todayISO` to `useBoards.ts`, `BixWidget.tsx`, `Templates.tsx`, `referenceRepo.ts`, `Dashboard.tsx`, `types.ts`, `Currency.tsx`, `TrayView.tsx`, `Settings.tsx`, `Finance.tsx`, `useEvents.ts`, `CompanyContext.tsx`, `ListView.tsx`, `BxEvent`, `localDb.ts`, `taxSeeder.ts`, `MoneyInput.tsx`, `EcpManager.tsx`, `Planner.tsx`, `DateCalc.tsx`, `DigestView.tsx`, `FocusView.tsx`, `TxModal.tsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `Library.tsx`, `useBoards.ts`, `Templates.tsx`, `CompanyTeamPanel.tsx`, `Counterparties.tsx`, `Translator.tsx`, `Planner.tsx`, `Settings.tsx`, `SickLeaveCalc.tsx`, `Support.tsx`, `supabase.ts`, `Finance.tsx`, `Calc.tsx`, `CompanyContext.tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _359 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.060362173038229376 - nodes in this community are weakly interconnected._
- **Should `useBoards.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051715309779825906 - nodes in this community are weakly interconnected._
- **Should `pin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06868686868686869 - nodes in this community are weakly interconnected._