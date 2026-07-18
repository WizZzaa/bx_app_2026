# Graph Report - src  (2026-07-18)

## Corpus Check
- 264 files · ~5,440,577 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1510 nodes · 3618 edges · 78 communities (73 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `417ed457`
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
- useBoards.ts
- Icon.tsx
- supabase.ts
- Settings.tsx
- InnCheckTool.tsx
- CalendarPage.tsx
- workbenchCatalog.ts
- InpsCalc.tsx
- uzHolidays.ts
- bankDirectory.ts
- BxEvent
- uiScale.ts
- CommandPalette.tsx
- useToast
- useCards.ts
- NetworkChecker.tsx
- FocusView.tsx
- CurrencyHistory.tsx
- uiScale.ts
- onecCache.ts
- onecProcess.ts
- uiScale.ts
- PdfConvert.tsx
- Transliterate.tsx
- newsFeed.ts
- PcCleaner.tsx
- logger.ts
- PdfConvert.tsx
- vite-env.d.ts
- PLAN_LIMITS
- ecpParser.ts
- OcrTool.tsx
- TranslatorTutorial.tsx
- DocumentViewModeSwitch.tsx
- DateCalc.tsx
- weather.ts
- WeatherWidget.tsx
- useWorkbenchFavorites.ts
- DailyTasksModal.tsx
- QuickNotes.tsx
- Icon.tsx
- plan.tsx
- RecyclingCalc.tsx

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 52 edges
2. `useCompany()` - 37 edges
3. `supabase` - 36 edges
4. `useToast()` - 33 edges
5. `BxEvent` - 33 edges
6. `usePlan()` - 31 edges
7. `registerIpcHandlers()` - 28 edges
8. `BixWidget()` - 21 edges
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

## Communities (78 total, 5 thin omitted)

### Community 0 - "Settings.tsx"
Cohesion: 0.18
Nodes (15): CompanyRoleGuide(), ROLE_TONES, INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE, CompanyMemberStatus (+7 more)

### Community 1 - "Calc.tsx"
Cohesion: 0.07
Nodes (51): CompareFieldRowProps, ConflictModal(), ConflictModalProps, parseBankStatement(), ParsedTransaction, BxCounterparty, BxTransaction, db (+43 more)

### Community 2 - "CompanyContext.tsx"
Cohesion: 0.06
Nodes (60): activityLabel(), CompanyProfileActivityPanel(), dateTime(), LEGAL_FORM_LABELS, CompanyProfileWizard(), CompanyWizardInitial, EMPTY_DETAILS, formCalendarHint() (+52 more)

### Community 3 - "useToast"
Cohesion: 0.22
Nodes (14): toastError, SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate(), SUPPORT_CATEGORIES (+6 more)

### Community 4 - "Library.tsx"
Cohesion: 0.07
Nodes (49): buildContentAuditInventory(), ContentAuditItem, ContentAuditStatus, ContentAuditSummary, ContentKind, isOfficialSourceUrl(), knowledgeItems(), obligationItems() (+41 more)

### Community 5 - "App.tsx"
Cohesion: 0.12
Nodes (18): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+10 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "Templates.tsx"
Cohesion: 0.11
Nodes (29): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META (+21 more)

### Community 8 - "ipc.ts"
Cohesion: 0.16
Nodes (19): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, BxTheme (+11 more)

### Community 9 - "referenceRepo.ts"
Cohesion: 0.08
Nodes (38): getNewsItem(), LEGISLATION_NEWS, NewsItem, indicators, paymentCodes, taxes, DataMeta, Indicator (+30 more)

### Community 10 - "widgetsApi.ts"
Cohesion: 0.13
Nodes (22): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+14 more)

### Community 11 - "Translator.tsx"
Cohesion: 0.07
Nodes (37): delay(), scan(), ACTIONS, animationDelay(), AnimationSpeed, BIX_JOKES, BIX_PHRASES, BixActivity (+29 more)

### Community 12 - "useEvents.ts"
Cohesion: 0.18
Nodes (12): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, ReferenceView(), RefTabId (+4 more)

### Community 13 - "TrayView.tsx"
Cohesion: 0.21
Nodes (10): Cmd, CommandPalette(), COMMANDS, AddCardPayload, BoardKanban(), c(), COLOR_MAP, fmtDate() (+2 more)

### Community 14 - "widgetsApi.ts"
Cohesion: 0.14
Nodes (9): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, WMO, CurrencyExportRow, BankExchangeRate (+1 more)

### Community 15 - "localDb.ts"
Cohesion: 0.14
Nodes (10): ErrorBoundary, Props, State, detectPlatform(), installGlobalErrorReporting(), reportError(), seen, isDev (+2 more)

### Community 16 - "Currency.tsx"
Cohesion: 0.14
Nodes (20): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo() (+12 more)

### Community 17 - "Finance.tsx"
Cohesion: 0.19
Nodes (12): Props, Props, BUILT_IN_CHECKLIST_TEMPLATES, CardModal(), fmtDateTime(), LABEL_PALETTE, PRIORITY_OPTS, Props (+4 more)

### Community 18 - "ListView.tsx"
Cohesion: 0.19
Nodes (12): App(), Topbar(), search(), applyTheme(), BX_THEMES, currentTheme(), nextTheme(), normalizeTheme() (+4 more)

### Community 19 - "numToWords.ts"
Cohesion: 0.15
Nodes (15): ACCENT, CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row() (+7 more)

### Community 20 - "TaxCalculator.tsx"
Cohesion: 0.29
Nodes (10): checkReminders(), getNotified(), markNotified(), requestNotificationPermission(), startReminderLoop(), stopReminderLoop(), Planner(), TYPE_FILTERS (+2 more)

### Community 21 - "errorReporter.ts"
Cohesion: 0.25
Nodes (11): COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS, loadCompanyDetails(), saveCompanyDetails(), Counterparties() (+3 more)

### Community 22 - "CalendarView.tsx"
Cohesion: 0.10
Nodes (26): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), TaxDeadline, taxDeadlines (+18 more)

### Community 23 - "Counterparties.tsx"
Cohesion: 0.21
Nodes (9): EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props, COLUMNS, groupEventsByStatus(), PRIORITY_BORDER (+1 more)

### Community 24 - "Topbar.tsx"
Cohesion: 0.24
Nodes (14): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE (+6 more)

### Community 25 - "CacheCleaner.tsx"
Cohesion: 0.20
Nodes (11): Button(), Props, styles, Variant, Props, formatBytes(), onecApi, CacheCleaner() (+3 more)

### Community 26 - "Dashboard.tsx"
Cohesion: 0.12
Nodes (12): DocumentViewModeSwitch(), DocumentViewModeSwitchProps, useDocumentViewMode(), DocumentWorkspace, STEPS, IconName, PATHS, BxUserDocument (+4 more)

### Community 27 - "ReferenceView.tsx"
Cohesion: 0.24
Nodes (13): UpdateSnapshot, api, BxApi, BxBridge, IPC, SiteResetMode, SiteSessionResult, BackupResult (+5 more)

### Community 28 - "main.ts"
Cohesion: 0.14
Nodes (30): appAsset(), broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), constrainTrayPosition(), constrainTrayWindowToDisplay(), createTray(), createTrayWindow() (+22 more)

### Community 29 - "types.ts"
Cohesion: 0.15
Nodes (20): NotificationsWidget(), styleByLevel, loadEcpKeys(), buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice (+12 more)

### Community 30 - "horoscope.ts"
Cohesion: 0.11
Nodes (19): Props, State, WidgetBoundary, defaultRuntimeWidgetPolicy(), defaults, isRuntimeWidgetAllowed(), loadRuntimeWidgetPolicy(), normalizePolicy() (+11 more)

### Community 31 - "syncQueue.ts"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 32 - "EcpManager.tsx"
Cohesion: 0.15
Nodes (12): CompanyTeamPanel(), CompanySwitcher(), PRO_PERKS, useCompany(), usePlan(), Ai(), ChatItem, MessageItem (+4 more)

### Community 33 - "App.tsx"
Cohesion: 0.14
Nodes (26): AuthGate(), PinScreen(), Props, AttemptsData, clearPin(), getAttemptsData(), getAttemptsLeft(), hasPin() (+18 more)

### Community 34 - "useBoards.ts"
Cohesion: 0.23
Nodes (13): uid(), BoardModal(), DOT, Props, baseBoardDefs(), BOARD_ICONS, col(), COLUMN_COLORS (+5 more)

### Community 35 - "Icon.tsx"
Cohesion: 0.24
Nodes (13): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchRateOnDate(), fetchRates(), fetchText(), FLAGS (+5 more)

### Community 36 - "supabase.ts"
Cohesion: 0.29
Nodes (11): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+3 more)

### Community 37 - "Settings.tsx"
Cohesion: 0.19
Nodes (17): buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName(), modeName(), normalizeArchiveFileName(), translatedFileName(), TRANSLATION_LANGUAGES (+9 more)

### Community 38 - "InnCheckTool.tsx"
Cohesion: 0.25
Nodes (6): DocumentViewMode, TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, loadDocumentWorkspaceMode(), loadTranslatorWorkspaceMode()

### Community 39 - "CalendarPage.tsx"
Cohesion: 0.22
Nodes (12): EcpKeyRecord, getSafe(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager(), EMPTY_FORM (+4 more)

### Community 40 - "workbenchCatalog.ts"
Cohesion: 0.23
Nodes (10): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchProposal, WorkbenchSector (+2 more)

### Community 41 - "InpsCalc.tsx"
Cohesion: 0.25
Nodes (8): fmt(), InpsCalc(), fmt(), SalaryCalc(), calcPayroll(), DEFAULT_RATES, PayrollRates, PayrollResult

### Community 42 - "uzHolidays.ts"
Cohesion: 0.24
Nodes (9): DividendCalc(), fmt(), TREATIES, TREATY_LABELS, format(), MoneyInput(), Props, fmt() (+1 more)

### Community 43 - "bankDirectory.ts"
Cohesion: 0.27
Nodes (8): applyBankDirectory(), BankDirectoryRow, DEFAULT_BANK_DIRECTORY, fromRow(), loadBankDirectory(), directory, rates, BankDirectoryEntry

### Community 44 - "BxEvent"
Cohesion: 0.26
Nodes (10): Calc(), CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES (+2 more)

### Community 45 - "uiScale.ts"
Cohesion: 0.17
Nodes (11): AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass() (+3 more)

### Community 46 - "CommandPalette.tsx"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 47 - "useToast"
Cohesion: 0.30
Nodes (10): isWorkday(), EventModal(), addCalendarDays(), addWorkdays(), DateCalc(), diffDays(), diffWorkdays(), fmt() (+2 more)

### Community 48 - "useCards.ts"
Cohesion: 0.20
Nodes (15): CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, cacheKey(), DatedCard, fetchBoardColumns() (+7 more)

### Community 49 - "NetworkChecker.tsx"
Cohesion: 0.33
Nodes (9): isBixWidget, root, rootElement, ToastProvider(), applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, normalizeFontScale() (+1 more)

### Community 50 - "FocusView.tsx"
Cohesion: 0.25
Nodes (7): calculateRegimeComparison(), fmt(), parseMln(), RegimeCompareCalc(), RegimeInputs, RegimeOutcome, TaxRegime

### Community 51 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 52 - "uiScale.ts"
Cohesion: 0.13
Nodes (22): COMPANY_ROLE_LABELS, CompanyRole, describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel() (+14 more)

### Community 53 - "onecCache.ts"
Cohesion: 0.44
Nodes (8): cleanCache(), copyFolderRecursive(), dirSize(), getCacheRoots(), getV8iPath(), parseV8i(), scanCache(), CacheEntry

### Community 54 - "onecProcess.ts"
Cohesion: 0.27
Nodes (8): buildTaskNotification(), ROW, formatDueDate(), GlobalNotificationRow, NotificationSource, NotificationTarget, TaskNotificationRow, BASE_ROW

### Community 55 - "uiScale.ts"
Cohesion: 0.25
Nodes (11): createSiteWindow(), openSiteSession(), partitionFor(), resetSiteSession(), secureWebPreferences(), siteWindows, BusyAction, PRESETS (+3 more)

### Community 57 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 58 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 59 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 60 - "logger.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 61 - "PdfConvert.tsx"
Cohesion: 0.48
Nodes (5): escapeDocumentHtml(), groupPdfTextItems(), HTML_ENTITIES, PdfConvert(), PdfTextItem

### Community 65 - "ecpParser.ts"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 66 - "OcrTool.tsx"
Cohesion: 0.50
Nodes (4): escapeHtml(), HTML_ENTITIES, LANGUAGES, OcrTool()

### Community 68 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.06
Nodes (36): CompanyProvider(), check(), fetch(), STYLE, Toast, ToastApi, ToastCtx, ToastKind (+28 more)

### Community 69 - "DateCalc.tsx"
Cohesion: 0.11
Nodes (32): registerIpcHandlers(), parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile(), cleanup(), parseCertInfo(), pickFileToSign() (+24 more)

### Community 70 - "weather.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 72 - "useWorkbenchFavorites.ts"
Cohesion: 0.70
Nodes (4): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites()

### Community 73 - "DailyTasksModal.tsx"
Cohesion: 0.11
Nodes (23): Props, CalCard, PRI_COLOR, Props, TYPE_ICON, DigestView(), dueChip(), EcpKey (+15 more)

### Community 75 - "QuickNotes.tsx"
Cohesion: 0.31
Nodes (12): CanonicalEventInput, createCanonicalEvent(), UnifiedRow, emitPlannerReload(), subscribePlannerReload(), collectEventPages(), EventKind, EventPriority (+4 more)

### Community 76 - "Icon.tsx"
Cohesion: 0.26
Nodes (12): ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+4 more)

### Community 77 - "plan.tsx"
Cohesion: 0.27
Nodes (9): Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan, PlanCtx, PlanLimits, PlanProvider() (+1 more)

### Community 80 - "RecyclingCalc.tsx"
Cohesion: 0.25
Nodes (8): AGE_COEFFS, COMMERCIAL_ENGINES, EngineGroup, fmt(), MOTO_ENGINES, PASSENGER_ENGINES, RecyclingCalc(), VehicleCategory

## Knowledge Gaps
- **351 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+346 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `todayISO()` connect `Topbar.tsx` to `Calc.tsx`, `CompanyContext.tsx`, `ecpParser.ts`, `Templates.tsx`, `CalendarPage.tsx`, `referenceRepo.ts`, `DailyTasksModal.tsx`, `Translator.tsx`, `ipc.ts`, `TrayView.tsx`, `useToast`, `Currency.tsx`, `TaxCalculator.tsx`, `uiScale.ts`, `Counterparties.tsx`, `CacheCleaner.tsx`, `types.ts`, `horoscope.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `supabase` connect `CompanyContext.tsx` to `Settings.tsx`, `Calc.tsx`, `useToast`, `Library.tsx`, `ipc.ts`, `referenceRepo.ts`, `Translator.tsx`, `localDb.ts`, `Finance.tsx`, `TaxCalculator.tsx`, `Dashboard.tsx`, `types.ts`, `horoscope.ts`, `App.tsx`, `useBoards.ts`, `supabase.ts`, `Settings.tsx`, `bankDirectory.ts`, `useCards.ts`, `uiScale.ts`, `onecProcess.ts`, `QuickNotes.tsx`, `plan.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `useToast()` connect `DocumentViewModeSwitch.tsx` to `Settings.tsx`, `EcpManager.tsx`, `CompanyContext.tsx`, `Calc.tsx`, `Library.tsx`, `useToast`, `Settings.tsx`, `Templates.tsx`, `ipc.ts`, `BxEvent`, `numToWords.ts`, `TaxCalculator.tsx`, `errorReporter.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _351 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Calc.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06649616368286446 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.056049213943950786 - nodes in this community are weakly interconnected._
- **Should `Library.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06892655367231638 - nodes in this community are weakly interconnected._