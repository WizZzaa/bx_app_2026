# Graph Report - src  (2026-07-18)

## Corpus Check
- 271 files · ~5,051,280 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1561 nodes · 3720 edges · 78 communities (75 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9a60f2be`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CalendarPage.tsx
- CompanyContext.tsx
- Finance.tsx
- pin.ts
- supabase.ts
- useToast
- onecApi.ts
- main.ts
- Translator.tsx
- CompanyTeamPanel.tsx
- Templates.tsx
- BixWidget.tsx
- referenceRepo.ts
- todayISO
- Currency.tsx
- BxEvent
- widgetsApi.ts
- useCards.ts
- useEvents.ts
- Dashboard.tsx
- ipc.ts
- TrayView.tsx
- Support.tsx
- App.tsx
- Settings.tsx
- numToWords.ts
- Calc.tsx
- Services.tsx
- Ai.tsx
- Sidebar.tsx
- CacheCleaner.tsx
- Tools.tsx
- NewsDetail.tsx
- BixWidget
- preload.ts
- siteSession.ts
- Documents.tsx
- ReferenceView.tsx
- Planner.tsx
- horoscope.ts
- currency.ts
- bixEconomy.ts
- Counterparties.tsx
- EcpManager.tsx
- MoneyInput.tsx
- SickLeaveCalc.tsx
- InpsCalc.tsx
- useBoards.ts
- searchIndex.ts
- SystemTaskBoard.tsx
- WidgetBoundary.tsx
- CurrencyHistory.tsx
- types.ts
- useNotifications.ts
- RegimeCompareCalc.tsx
- Icon.tsx
- plan.tsx
- CalcResult.tsx
- DigestView.tsx
- onecCache.ts
- DateCalc.tsx
- RecyclingCalc.tsx
- FocusView.tsx
- OnboardingWizard.tsx
- newsFeed.ts
- onecProcess.ts
- DocumentViewModeSwitch.tsx
- uiScale.ts
- PdfConvert.tsx
- Transliterate.tsx
- EimzoDiag.tsx
- PcCleaner.tsx
- ecpParser.ts
- BxBridge
- OcrTool.tsx
- vite-env.d.ts
- PLAN_LIMITS

## God Nodes (most connected - your core abstractions)
1. `todayISO()` - 52 edges
2. `useCompany()` - 37 edges
3. `supabase` - 36 edges
4. `BxEvent` - 34 edges
5. `useToast()` - 33 edges
6. `usePlan()` - 31 edges
7. `registerIpcHandlers()` - 28 edges
8. `BixWidget()` - 25 edges
9. `EventStatus` - 18 edges
10. `Templates()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `BxBridge` --references--> `UpdateSnapshot`  [EXTRACTED]
  renderer/lib/onecApi.ts → main/services/updatePolicy.ts
- `LoginScreen()` --references--> `CHANGELOG`  [EXTRACTED]
  renderer/components/auth/LoginScreen.tsx → shared/version.ts
- `BxBridge` --references--> `SiteResetMode`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts
- `BxBridge` --references--> `SiteSessionResult`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts
- `WidgetBridge` --references--> `BankExchangeRate`  [EXTRACTED]
  renderer/lib/widgetsApi.ts → shared/types.ts

## Import Cycles
- None detected.

## Communities (78 total, 3 thin omitted)

### Community 0 - "CalendarPage.tsx"
Cohesion: 0.11
Nodes (25): MONTHS, Props, TaxCalendar(), WEEKDAYS, deadlineDaysInMonth(), deadlinesForMonth(), TaxDeadline, SpecialDay (+17 more)

### Community 1 - "CompanyContext.tsx"
Cohesion: 0.14
Nodes (24): CompanyProfileWizard(), EMPTY_DETAILS, formCalendarHint(), formLabel(), initialProfile(), LEGAL_FORMS, obligationTraits(), WEEKDAYS (+16 more)

### Community 2 - "Finance.tsx"
Cohesion: 0.16
Nodes (19): parseBankStatement(), ParsedTransaction, BxTransaction, exportTransactionsToExcel(), baseTx, filterPayments(), paymentDayDiff(), paymentSummary() (+11 more)

### Community 3 - "pin.ts"
Cohesion: 0.07
Nodes (40): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, isBixWidget, root (+32 more)

### Community 4 - "supabase.ts"
Cohesion: 0.06
Nodes (57): Cmd, CommandPalette(), COMMANDS, buildContentAuditInventory(), ContentAuditItem, ContentAuditStatus, ContentAuditSummary, ContentKind (+49 more)

### Community 5 - "useToast"
Cohesion: 0.13
Nodes (17): CompanyProvider(), check(), STYLE, Toast, ToastApi, ToastCtx, ToastKind, useToast() (+9 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "main.ts"
Cohesion: 0.11
Nodes (35): appAsset(), broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), constrainTrayWindowToDisplay(), createTray(), createTrayWindow(), createWindow() (+27 more)

### Community 8 - "Translator.tsx"
Cohesion: 0.11
Nodes (24): DocumentViewMode, TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords() (+16 more)

### Community 9 - "CompanyTeamPanel.tsx"
Cohesion: 0.17
Nodes (18): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+10 more)

### Community 10 - "Templates.tsx"
Cohesion: 0.11
Nodes (30): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, db, CP_PREFIXES, DOCUMENT_KEYS (+22 more)

### Community 11 - "BixWidget.tsx"
Cohesion: 0.06
Nodes (32): AccuracyKind, ACTIONS, AnimationSpeed, BIX_JOKES, BIX_PHRASES, BixAchievement, BixAchievementProgress, BixActivity (+24 more)

### Community 12 - "referenceRepo.ts"
Cohesion: 0.15
Nodes (23): indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode, ReferenceSection (+15 more)

### Community 13 - "todayISO"
Cohesion: 0.24
Nodes (14): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE (+6 more)

### Community 14 - "Currency.tsx"
Cohesion: 0.14
Nodes (20): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo() (+12 more)

### Community 15 - "BxEvent"
Cohesion: 0.11
Nodes (24): Props, CalCard, PRI_COLOR, Props, TYPE_ICON, DigestView(), dueChip(), EcpKey (+16 more)

### Community 16 - "widgetsApi.ts"
Cohesion: 0.10
Nodes (10): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyExportRow (+2 more)

### Community 17 - "useCards.ts"
Cohesion: 0.17
Nodes (15): Props, Props, BUILT_IN_CHECKLIST_TEMPLATES, LABEL_PALETTE, PRIORITY_OPTS, Props, BoardColumn, BxCard (+7 more)

### Community 18 - "useEvents.ts"
Cohesion: 0.18
Nodes (18): PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS, CanonicalEventInput (+10 more)

### Community 19 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (17): defaultRuntimeWidgetPolicy(), defaults, isRuntimeWidgetAllowed(), loadRuntimeWidgetPolicy(), normalizePolicy(), RuntimeWidgetAudience, RuntimeWidgetConfig, RuntimeWidgetPolicy (+9 more)

### Community 20 - "ipc.ts"
Cohesion: 0.12
Nodes (28): registerIpcHandlers(), parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile(), cleanup(), parseCertInfo(), pickFileToSign() (+20 more)

### Community 21 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 22 - "Support.tsx"
Cohesion: 0.05
Nodes (48): CompanySwitcher(), PRO_PERKS, buildLocalDataContext(), AiChat, AiMessage, useAi(), useCompany(), Ctx (+40 more)

### Community 23 - "App.tsx"
Cohesion: 0.31
Nodes (13): LoginScreen(), Props, Topbar(), search(), SearchItem, applyTheme(), BX_THEMES, currentTheme() (+5 more)

### Community 24 - "Settings.tsx"
Cohesion: 0.16
Nodes (19): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, BxTheme (+11 more)

### Community 25 - "numToWords.ts"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 26 - "Calc.tsx"
Cohesion: 0.12
Nodes (18): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+10 more)

### Community 27 - "Services.tsx"
Cohesion: 0.08
Nodes (38): CompareFieldRowProps, ConflictModal(), ConflictModalProps, canShowReminder(), getOnboardingSurface(), OnboardingProfile, OnboardingState, OnboardingWizard() (+30 more)

### Community 28 - "Ai.tsx"
Cohesion: 0.13
Nodes (22): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), dayTooltip(), DayType, getMonthNorms() (+14 more)

### Community 29 - "Sidebar.tsx"
Cohesion: 0.20
Nodes (9): AboutModal(), Props, initialCollapsed(), MenuItem, MenuSection, navItemClass(), Sidebar(), CHANGELOG (+1 more)

### Community 30 - "CacheCleaner.tsx"
Cohesion: 0.17
Nodes (17): Button(), Props, styles, Variant, Props, BxBridge, formatBytes(), onecApi (+9 more)

### Community 31 - "Tools.tsx"
Cohesion: 0.53
Nodes (5): WorkbenchKind, readFavorites(), storageKey(), useWorkbenchFavorites(), Calc()

### Community 32 - "NewsDetail.tsx"
Cohesion: 0.22
Nodes (11): getNewsItem(), LEGISLATION_NEWS, NewsItem, News(), NEWS_SOURCES, openLink(), buildAiPrompt(), buildTaskNote() (+3 more)

### Community 33 - "BixWidget"
Cohesion: 0.14
Nodes (17): delay(), scan(), animationDelay(), BixWidget(), clampPanelOffset(), isWithinQuietHours(), jokeDelay(), loadBixSettings() (+9 more)

### Community 34 - "preload.ts"
Cohesion: 0.15
Nodes (17): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss(), checkRunningBrowsers(), cleanPcTemp() (+9 more)

### Community 35 - "siteSession.ts"
Cohesion: 0.24
Nodes (13): createSiteWindow(), openSiteSession(), partitionFor(), resetSiteSession(), secureWebPreferences(), siteWindows, BusyAction, PRESETS (+5 more)

### Community 36 - "Documents.tsx"
Cohesion: 0.19
Nodes (17): useDocumentViewMode(), ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceNavItem(), ResourceSectionTitle(), ResourceSidebar() (+9 more)

### Community 37 - "ReferenceView.tsx"
Cohesion: 0.20
Nodes (11): dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, RefTabId, tabs (+3 more)

### Community 38 - "Planner.tsx"
Cohesion: 0.23
Nodes (13): checkReminders(), getNotified(), markNotified(), dueEvent, ReminderWindow, requestNotificationPermission(), startReminderLoop(), stopReminderLoop() (+5 more)

### Community 39 - "horoscope.ts"
Cohesion: 0.17
Nodes (13): HoroscopeWidget(), ACCOUNT_NAMES, advices, colors, DailyHoroscope, getHoroscope(), hashStr(), HoroscopeVariant (+5 more)

### Community 40 - "currency.ts"
Cohesion: 0.24
Nodes (13): BANK_SOURCES, CbuItem, DEFAULT_CODES, fetchBankExchangeRates(), fetchRateOnDate(), fetchRates(), fetchText(), FLAGS (+5 more)

### Community 41 - "bixEconomy.ts"
Cohesion: 0.24
Nodes (13): BIX_ECONOMY_QUEUE_KEY, BixEconomyOperation, BixEconomyOperationType, BixEconomyResult, BixEconomyRpc, BixEconomyState, enqueueBixEconomyOperation(), loadBixEconomyQueue() (+5 more)

### Community 42 - "Counterparties.tsx"
Cohesion: 0.21
Nodes (14): BxCounterparty, NewCounterparty, useCounterparties(), COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS (+6 more)

### Community 43 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 44 - "MoneyInput.tsx"
Cohesion: 0.19
Nodes (15): activityLabel(), CompanyProfileActivityPanel(), dateTime(), LEGAL_FORM_LABELS, CompanyWizardInitial, Props, CompanyCtx, Ctx (+7 more)

### Community 45 - "SickLeaveCalc.tsx"
Cohesion: 0.22
Nodes (12): useEconomicIndicators(), fmt(), NdflCalc(), CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt() (+4 more)

### Community 46 - "InpsCalc.tsx"
Cohesion: 0.13
Nodes (17): DividendCalc(), fmt(), TREATIES, TREATY_LABELS, fmt(), InpsCalc(), format(), MoneyInput() (+9 more)

### Community 47 - "useBoards.ts"
Cohesion: 0.26
Nodes (12): BoardModal(), DOT, Props, baseBoardDefs(), BOARD_ICONS, col(), COLUMN_COLORS, defaultColumns() (+4 more)

### Community 48 - "searchIndex.ts"
Cohesion: 0.23
Nodes (10): ProposalWorkbench(), ProposalWorkbenchProps, CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchProposal, WorkbenchSector (+2 more)

### Community 49 - "SystemTaskBoard.tsx"
Cohesion: 0.40
Nodes (5): EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props

### Community 50 - "WidgetBoundary.tsx"
Cohesion: 0.23
Nodes (5): Props, State, trackWidgetEventMock, WidgetBoundary, trackWidgetEvent()

### Community 51 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 52 - "types.ts"
Cohesion: 0.25
Nodes (9): applyBankDirectory(), BankDirectoryRow, DEFAULT_BANK_DIRECTORY, fromRow(), loadBankDirectory(), directory, rates, BankDirectoryEntry (+1 more)

### Community 53 - "useNotifications.ts"
Cohesion: 0.14
Nodes (15): Props, statusMeta, TaskPanel(), TaskRow, tasksRepo, CalendarEvent, CompanyLanguage, CompanyNotificationChannel (+7 more)

### Community 54 - "RegimeCompareCalc.tsx"
Cohesion: 0.25
Nodes (7): calculateRegimeComparison(), fmt(), parseMln(), RegimeCompareCalc(), RegimeInputs, RegimeOutcome, TaxRegime

### Community 55 - "Icon.tsx"
Cohesion: 0.13
Nodes (6): DocumentViewModeSwitch(), DocumentViewModeSwitchProps, DocumentWorkspace, STEPS, IconName, PATHS

### Community 56 - "plan.tsx"
Cohesion: 0.23
Nodes (12): fetch(), BANKS_MFO, getBankNameByMfo(), validateBankAccount(), validateInn(), validatePinfl(), BankCheck(), CheckResult (+4 more)

### Community 57 - "CalcResult.tsx"
Cohesion: 0.15
Nodes (15): ACCENT, CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row() (+7 more)

### Community 58 - "DigestView.tsx"
Cohesion: 0.20
Nodes (10): uid(), CardModal(), fmtDateTime(), DEFAULT_SITES, loadSites(), msColor(), NetworkChecker(), PingTarget (+2 more)

### Community 59 - "onecCache.ts"
Cohesion: 0.44
Nodes (8): cleanCache(), copyFolderRecursive(), dirSize(), getCacheRoots(), getV8iPath(), parseV8i(), scanCache(), CacheEntry

### Community 60 - "DateCalc.tsx"
Cohesion: 0.30
Nodes (10): isWorkday(), EventModal(), addCalendarDays(), addWorkdays(), DateCalc(), diffDays(), diffWorkdays(), fmt() (+2 more)

### Community 61 - "RecyclingCalc.tsx"
Cohesion: 0.29
Nodes (9): describeEventActivity(), EventActivityTimeline(), STATUS_LABELS, activity, member, valueLabel(), EventActivity, EventActivityType (+1 more)

### Community 62 - "FocusView.tsx"
Cohesion: 0.15
Nodes (14): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), Props, STATUS_LABELS, COLUMNS (+6 more)

### Community 63 - "OnboardingWizard.tsx"
Cohesion: 0.24
Nodes (9): ExchangeRate, DEFAULT_RATES, useExchangeRates(), EXPENSE_CATS, INCOME_CATS, Props, today, TxModal() (+1 more)

### Community 64 - "newsFeed.ts"
Cohesion: 0.24
Nodes (10): CalendarPage(), mondayOf(), MONTHS, TYPE_COLOR, WEEKDAYS, DatedCard, fetchBoardColumns(), fetchCardById() (+2 more)

### Community 65 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 66 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.25
Nodes (3): App(), Placeholder(), Props

### Community 67 - "uiScale.ts"
Cohesion: 0.71
Nodes (5): applyFontScale(), currentFontScale(), FONT_SCALE_OPTIONS, normalizeFontScale(), saveFontScale()

### Community 68 - "PdfConvert.tsx"
Cohesion: 0.48
Nodes (5): escapeDocumentHtml(), groupPdfTextItems(), HTML_ENTITIES, PdfConvert(), PdfTextItem

### Community 69 - "Transliterate.tsx"
Cohesion: 0.43
Nodes (6): CYR_TO_LAT, cyrToLat(), detectScript(), LAT_TO_CYR, latToCyr(), Transliterate()

### Community 71 - "PcCleaner.tsx"
Cohesion: 0.40
Nodes (5): DEMO_DIRS, fmtSize(), PcCleaner(), State, TempDirInfo

### Community 72 - "ecpParser.ts"
Cohesion: 0.36
Nodes (6): BASE_INITIAL, chooseDecision(), decisionGroup(), expectDecision(), initialProfile(), setup()

### Community 73 - "BxBridge"
Cohesion: 0.38
Nodes (6): AddCardPayload, BoardKanban(), COLOR_MAP, fmtDate(), isOverdue(), PRIORITY_BAR

### Community 76 - "OcrTool.tsx"
Cohesion: 0.50
Nodes (4): escapeHtml(), HTML_ENTITIES, LANGUAGES, OcrTool()

## Knowledge Gaps
- **375 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+370 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `Services.tsx` to `CompanyContext.tsx`, `pin.ts`, `supabase.ts`, `Translator.tsx`, `CompanyTeamPanel.tsx`, `BixWidget.tsx`, `referenceRepo.ts`, `useCards.ts`, `useEvents.ts`, `Dashboard.tsx`, `TrayView.tsx`, `Support.tsx`, `Settings.tsx`, `NewsDetail.tsx`, `Planner.tsx`, `MoneyInput.tsx`, `useBoards.ts`, `types.ts`, `useNotifications.ts`, `RecyclingCalc.tsx`, `FocusView.tsx`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `todayISO()` connect `todayISO` to `CompanyContext.tsx`, `Finance.tsx`, `Templates.tsx`, `BixWidget.tsx`, `referenceRepo.ts`, `Currency.tsx`, `BxEvent`, `useEvents.ts`, `Dashboard.tsx`, `TrayView.tsx`, `Settings.tsx`, `CacheCleaner.tsx`, `BixWidget`, `Planner.tsx`, `EcpManager.tsx`, `MoneyInput.tsx`, `SickLeaveCalc.tsx`, `SystemTaskBoard.tsx`, `DateCalc.tsx`, `FocusView.tsx`, `OnboardingWizard.tsx`, `BxBridge`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `Finance.tsx`, `supabase.ts`, `Planner.tsx`, `Translator.tsx`, `CompanyTeamPanel.tsx`, `Counterparties.tsx`, `Templates.tsx`, `MoneyInput.tsx`, `Support.tsx`, `Settings.tsx`, `CalcResult.tsx`, `DigestView.tsx`, `Tools.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _375 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CalendarPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10837438423645321 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1396011396011396 - nodes in this community are weakly interconnected._
- **Should `pin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06868686868686869 - nodes in this community are weakly interconnected._