# Graph Report - src  (2026-07-18)

## Corpus Check
- 271 files · ~5,051,128 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1559 nodes · 3707 edges · 82 communities (78 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `daff1c7b`
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
- useCompany
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
- weather.ts
- DividendCalc.tsx
- OcrTool.tsx
- CommandPalette.tsx
- PdfCompress.tsx
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
- `CommandPalette()` --indirect_call--> `c()`  [INFERRED]
  renderer/components/CommandPalette.tsx → renderer/pages/planner/BoardKanban.tsx
- `BxBridge` --references--> `SiteResetMode`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts
- `BxBridge` --references--> `SiteSessionResult`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/siteSession.ts
- `BxBridge` --references--> `KillResult`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/types.ts
- `BxBridge` --references--> `ProcessEntry`  [EXTRACTED]
  renderer/lib/onecApi.ts → shared/types.ts

## Import Cycles
- None detected.

## Communities (82 total, 4 thin omitted)

### Community 0 - "CalendarPage.tsx"
Cohesion: 0.05
Nodes (63): CalendarEntry, CalendarMarks, isoDate(), Props, SmartCalendar(), MONTHS, Props, TaxCalendar() (+55 more)

### Community 1 - "CompanyContext.tsx"
Cohesion: 0.05
Nodes (60): activityLabel(), CompanyProfileActivityPanel(), dateTime(), LEGAL_FORM_LABELS, CompanyProfileWizard(), CompanyWizardInitial, EMPTY_DETAILS, formCalendarHint() (+52 more)

### Community 2 - "Finance.tsx"
Cohesion: 0.07
Nodes (50): CompareFieldRowProps, ConflictModal(), ConflictModalProps, parseBankStatement(), ParsedTransaction, BxCounterparty, BxTransaction, db (+42 more)

### Community 3 - "pin.ts"
Cohesion: 0.07
Nodes (40): AuthGate(), PinScreen(), Props, ErrorBoundary, Props, State, isBixWidget, root (+32 more)

### Community 4 - "supabase.ts"
Cohesion: 0.09
Nodes (41): buildContentAuditInventory(), ContentAuditItem, ContentAuditStatus, ContentAuditSummary, ContentKind, isOfficialSourceUrl(), knowledgeItems(), obligationItems() (+33 more)

### Community 5 - "useToast"
Cohesion: 0.06
Nodes (37): CompanyProvider(), check(), fetch(), STYLE, Toast, ToastApi, ToastCtx, ToastKind (+29 more)

### Community 6 - "onecApi.ts"
Cohesion: 0.04
Nodes (3): mockCache, mockProcs, Window

### Community 7 - "main.ts"
Cohesion: 0.11
Nodes (33): appAsset(), broadcastUpdateStatus(), checkForUpdates(), checkManualUpdate(), constrainTrayWindowToDisplay(), createTray(), createTrayWindow(), createWindow() (+25 more)

### Community 8 - "Translator.tsx"
Cohesion: 0.11
Nodes (23): TranslatorTutorial(), TranslatorWorkspaceMode, TranslatorWorkspaceSwitch(), TranslatorWorkspaceSwitchProps, buildPlainLanguagePrompt(), buildTranslationPrompt(), countWords(), languageName() (+15 more)

### Community 9 - "CompanyTeamPanel.tsx"
Cohesion: 0.11
Nodes (27): CompanyRoleGuide(), ROLE_TONES, CompanyTeamPanel(), INVITABLE_ROLES, Props, canManageCompanyTeam(), COMPANY_ROLE_DESCRIPTIONS, COMPANY_ROLE_GUIDE (+19 more)

### Community 10 - "Templates.tsx"
Cohesion: 0.11
Nodes (29): DocTemplate, TEMPLATE_CATEGORIES, TEMPLATES, TemplateVar, BusinessBxDatabase, CP_PREFIXES, DOCUMENT_KEYS, FIELD_GROUP_META (+21 more)

### Community 11 - "BixWidget.tsx"
Cohesion: 0.06
Nodes (32): AccuracyKind, ACTIONS, AnimationSpeed, BIX_JOKES, BIX_PHRASES, BixAchievement, BixAchievementProgress, BixActivity (+24 more)

### Community 12 - "referenceRepo.ts"
Cohesion: 0.15
Nodes (22): indicators, paymentCodes, taxes, DataMeta, Indicator, IndicatorValue, PaymentCode, ReferenceSection (+14 more)

### Community 13 - "todayISO"
Cohesion: 0.15
Nodes (22): daysFromNowISO(), nextRecurrenceISO(), todayISO(), toLocalISO(), AllTasksView(), fmtDue(), Item, TYPE_BADGE (+14 more)

### Community 14 - "Currency.tsx"
Cohesion: 0.14
Nodes (20): ALL_CODES, BankValue(), buildCurrencyCsv(), convertCurrency(), CORE_CODES, Currency(), CurrencyCode, daysAgo() (+12 more)

### Community 15 - "BxEvent"
Cohesion: 0.15
Nodes (23): Props, CalCard, Props, PRI_COLOR, Props, TYPE_ICON, Props, Props (+15 more)

### Community 16 - "widgetsApi.ts"
Cohesion: 0.10
Nodes (10): Condition, fetchRatesDirect(), FLAGS, mapRate(), WidgetBridge, widgetsApi, WMO, CurrencyExportRow (+2 more)

### Community 17 - "useCards.ts"
Cohesion: 0.13
Nodes (20): Props, Props, BUILT_IN_CHECKLIST_TEMPLATES, CardModal(), fmtDateTime(), LABEL_PALETTE, PRIORITY_OPTS, Props (+12 more)

### Community 18 - "useEvents.ts"
Cohesion: 0.17
Nodes (19): EventModal(), PRIORITY_LABELS, Props, RECURRENCE_LABELS, STATUS_LABELS, TAX_TAGS, today, TYPE_LABELS (+11 more)

### Community 19 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (17): defaultRuntimeWidgetPolicy(), defaults, isRuntimeWidgetAllowed(), loadRuntimeWidgetPolicy(), normalizePolicy(), RuntimeWidgetAudience, RuntimeWidgetConfig, RuntimeWidgetPolicy (+9 more)

### Community 20 - "ipc.ts"
Cohesion: 0.21
Nodes (18): registerIpcHandlers(), cleanup(), parseCertInfo(), pickFileToSign(), pickSigFile(), signFile(), SignResult, VerifyResult (+10 more)

### Community 21 - "TrayView.tsx"
Cohesion: 0.14
Nodes (19): NotificationsWidget(), styleByLevel, buildNotices(), CachedEvent, daysTo(), EcpKeyLite, Notice, NoticeLevel (+11 more)

### Community 22 - "Support.tsx"
Cohesion: 0.20
Nodes (16): toastError, Support(), SupportRequiredField, Props, SupportTicketNavItem(), TICKET, buildSupportMessage(), formatTicketDate() (+8 more)

### Community 23 - "App.tsx"
Cohesion: 0.19
Nodes (12): App(), Topbar(), search(), applyTheme(), BX_THEMES, currentTheme(), nextTheme(), normalizeTheme() (+4 more)

### Community 24 - "Settings.tsx"
Cohesion: 0.16
Nodes (18): parseSettingsBackup(), SettingsBackupPayload, settingsBackupSummary, VALID_IDLE, VALID_NOTIFY, VALID_SCALE, VALID_THEME, BxTheme (+10 more)

### Community 25 - "numToWords.ts"
Cohesion: 0.15
Nodes (17): capitalize(), RU_HUND, RU_ONES_F, RU_ONES_M, RU_TEENS, RU_TENS, ruHundreds(), ruPlural() (+9 more)

### Community 26 - "Calc.tsx"
Cohesion: 0.15
Nodes (14): WorkbenchActions(), WorkbenchActionsProps, WorkbenchCanvas(), WorkbenchCanvasProps, WorkbenchGuide(), WorkbenchModeSwitch(), WorkbenchModeSwitchProps, WorkbenchView (+6 more)

### Community 27 - "Services.tsx"
Cohesion: 0.23
Nodes (15): BUNDLED_SECTION_IDS, SECTIONS, ServiceItem, ServiceSection, CloudService, getSectionsSync(), mergeSections(), normUrl() (+7 more)

### Community 28 - "Ai.tsx"
Cohesion: 0.16
Nodes (14): buildLocalDataContext(), retrieveArticles(), RetrievedArticle, stem(), STOP, tokenize(), AiChat, AiMessage (+6 more)

### Community 29 - "Sidebar.tsx"
Cohesion: 0.16
Nodes (12): UpdateStatus, AboutModal(), Props, LoginScreen(), Props, initialCollapsed(), MenuItem, MenuSection (+4 more)

### Community 30 - "CacheCleaner.tsx"
Cohesion: 0.19
Nodes (12): Button(), Props, styles, Variant, Props, formatBytes(), onecApi, CacheCleaner() (+4 more)

### Community 31 - "Tools.tsx"
Cohesion: 0.16
Nodes (15): ProposalWorkbench(), ProposalWorkbenchProps, WorkbenchKind, WorkbenchProposal, readFavorites(), storageKey(), useWorkbenchFavorites(), ACCENT (+7 more)

### Community 32 - "NewsDetail.tsx"
Cohesion: 0.22
Nodes (11): getNewsItem(), LEGISLATION_NEWS, NewsItem, News(), NEWS_SOURCES, openLink(), buildAiPrompt(), buildTaskNote() (+3 more)

### Community 33 - "BixWidget"
Cohesion: 0.14
Nodes (17): delay(), scan(), animationDelay(), BixWidget(), clampPanelOffset(), isWithinQuietHours(), jokeDelay(), loadBixSettings() (+9 more)

### Community 34 - "preload.ts"
Cohesion: 0.18
Nodes (13): fetchTrader(), TraderInfo, checkRunningBrowsers(), cleanPcTemp(), getCandidateDirs(), getDirSizeSync(), PcCleanResult, rmDirContents() (+5 more)

### Community 35 - "siteSession.ts"
Cohesion: 0.24
Nodes (13): createSiteWindow(), openSiteSession(), partitionFor(), resetSiteSession(), secureWebPreferences(), siteWindows, BusyAction, PRESETS (+5 more)

### Community 36 - "Documents.tsx"
Cohesion: 0.21
Nodes (13): useDocumentViewMode(), ResourceEmpty(), ResourceHero(), ResourceHeroProps, ResourceLayout(), ResourceSectionTitle(), ResourceSidebar(), ResourceSidebarProps (+5 more)

### Community 37 - "ReferenceView.tsx"
Cohesion: 0.18
Nodes (12): ResourceNavItem(), dutyItems, penaltyItems, regions, statItems, travelNorms, vedItems, RefTabId (+4 more)

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
Cohesion: 0.24
Nodes (12): useCounterparties(), COMPANY_REQUIRED, companyDetailsCompletion(), CompanyDetailsSnapshot, counterpartyHealth(), EMPTY_COMPANY_DETAILS, loadCompanyDetails(), saveCompanyDetails() (+4 more)

### Community 43 - "EcpManager.tsx"
Cohesion: 0.23
Nodes (13): EcpKeyRecord, getSafe(), loadEcpKeys(), SafeBridge, saveEcpKeys(), daysUntil(), EcpKey, EcpManager() (+5 more)

### Community 44 - "MoneyInput.tsx"
Cohesion: 0.23
Nodes (10): useEconomicIndicators(), format(), MoneyInput(), Props, fmt(), NdflCalc(), fmt(), PenaltyCalc() (+2 more)

### Community 45 - "SickLeaveCalc.tsx"
Cohesion: 0.26
Nodes (10): Calc(), CalcPrefill, peekCalcPrefill(), takeCalcPrefill(), toMoneyString(), fmt(), SickLeaveCalc(), STAZH_RULES (+2 more)

### Community 46 - "InpsCalc.tsx"
Cohesion: 0.25
Nodes (8): fmt(), InpsCalc(), fmt(), SalaryCalc(), calcPayroll(), DEFAULT_RATES, PayrollRates, PayrollResult

### Community 47 - "useBoards.ts"
Cohesion: 0.26
Nodes (12): BoardModal(), DOT, Props, baseBoardDefs(), BOARD_ICONS, col(), COLUMN_COLORS, defaultColumns() (+4 more)

### Community 48 - "searchIndex.ts"
Cohesion: 0.27
Nodes (9): CALCULATOR_PROPOSALS, getWorkbenchProposal(), UTILITY_PROPOSALS, WORKBENCH_PROPOSALS, WorkbenchSector, WorkbenchStatus, SearchItem, staticItems (+1 more)

### Community 49 - "SystemTaskBoard.tsx"
Cohesion: 0.21
Nodes (9): EVENT_TYPE_LABELS, formatPlannerDate(), PlannerEventSummary(), PRIORITY_META, Props, COLUMNS, groupEventsByStatus(), PRIORITY_BORDER (+1 more)

### Community 50 - "WidgetBoundary.tsx"
Cohesion: 0.23
Nodes (5): Props, State, trackWidgetEventMock, WidgetBoundary, trackWidgetEvent()

### Community 51 - "CurrencyHistory.tsx"
Cohesion: 0.23
Nodes (10): addDays(), CODES, CurrencyHistory(), dateStr(), FLAGS, fmt(), fmtVal(), PERIODS (+2 more)

### Community 52 - "types.ts"
Cohesion: 0.27
Nodes (9): applyBankDirectory(), BankDirectoryRow, DEFAULT_BANK_DIRECTORY, fromRow(), loadBankDirectory(), directory, rates, BankDirectoryEntry (+1 more)

### Community 53 - "useNotifications.ts"
Cohesion: 0.27
Nodes (8): buildTaskNotification(), ROW, formatDueDate(), GlobalNotificationRow, NotificationSource, NotificationTarget, TaskNotificationRow, BASE_ROW

### Community 54 - "RegimeCompareCalc.tsx"
Cohesion: 0.25
Nodes (7): calculateRegimeComparison(), fmt(), parseMln(), RegimeCompareCalc(), RegimeInputs, RegimeOutcome, TaxRegime

### Community 55 - "Icon.tsx"
Cohesion: 0.20
Nodes (4): DocumentWorkspace, STEPS, IconName, PATHS

### Community 56 - "plan.tsx"
Cohesion: 0.27
Nodes (9): Ctx, DEFAULT_PLAN_LIMITS, normalizeLimits(), NUMERIC_KEYS, Plan, PlanCtx, PlanLimits, PlanProvider() (+1 more)

### Community 57 - "CalcResult.tsx"
Cohesion: 0.27
Nodes (7): CalcHistoryPanel(), CalcHistoryEntry, CalcRowData, clearCalcHistory(), logCalc(), readCalcHistory(), Row()

### Community 58 - "DigestView.tsx"
Cohesion: 0.24
Nodes (6): DigestView(), dueChip(), EcpKey, fmtSum(), UnifiedDigestItem, UnpaidTx

### Community 59 - "onecCache.ts"
Cohesion: 0.44
Nodes (8): cleanCache(), copyFolderRecursive(), dirSize(), getCacheRoots(), getV8iPath(), parseV8i(), scanCache(), CacheEntry

### Community 60 - "useCompany"
Cohesion: 0.31
Nodes (6): CompanySwitcher(), PRO_PERKS, useCompany(), usePlan(), ReferenceView(), Settings()

### Community 61 - "RecyclingCalc.tsx"
Cohesion: 0.25
Nodes (8): AGE_COEFFS, COMMERCIAL_ENGINES, EngineGroup, fmt(), MOTO_ENGINES, PASSENGER_ENGINES, RecyclingCalc(), VehicleCategory

### Community 62 - "FocusView.tsx"
Cohesion: 0.31
Nodes (6): buildFocusGroups(), CompanyGroup, dateLabel(), FocusDateGroup, FocusView(), STATUS_LABELS

### Community 63 - "OnboardingWizard.tsx"
Cohesion: 0.39
Nodes (5): canShowReminder(), getOnboardingSurface(), OnboardingProfile, OnboardingState, OnboardingWizard()

### Community 64 - "newsFeed.ts"
Cohesion: 0.43
Nodes (6): BUSINESS_RE, decodeEntities(), FEEDS, fetchNewsFeed(), NewsFeedItem, parseRss()

### Community 65 - "onecProcess.ts"
Cohesion: 0.57
Nodes (6): execFileAsync, killProcesses(), listProcesses(), listProcessesUnix(), listProcessesWindows(), ONEC_PROCESS_NAMES

### Community 66 - "DocumentViewModeSwitch.tsx"
Cohesion: 0.33
Nodes (3): DocumentViewMode, DocumentViewModeSwitch(), DocumentViewModeSwitchProps

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
Cohesion: 0.50
Nodes (4): parseCertificateText(), ParsedEcpInfo, parsePfx(), pickPfxFile()

### Community 73 - "BxBridge"
Cohesion: 0.40
Nodes (5): UpdateSnapshot, BxBridge, BackupResult, CacheScanResult, CleanResult

### Community 74 - "weather.ts"
Cohesion: 0.50
Nodes (4): Condition, describe(), fetchWeather(), WMO

### Community 75 - "DividendCalc.tsx"
Cohesion: 0.50
Nodes (4): DividendCalc(), fmt(), TREATIES, TREATY_LABELS

### Community 76 - "OcrTool.tsx"
Cohesion: 0.50
Nodes (4): escapeHtml(), HTML_ENTITIES, LANGUAGES, OcrTool()

### Community 77 - "CommandPalette.tsx"
Cohesion: 0.50
Nodes (3): Cmd, CommandPalette(), COMMANDS

## Knowledge Gaps
- **375 isolated node(s):** `gotLock`, `TrayState`, `FLAGS`, `DEFAULT_CODES`, `CbuItem` (+370 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `todayISO()` connect `todayISO` to `CalendarPage.tsx`, `CompanyContext.tsx`, `Finance.tsx`, `Templates.tsx`, `BixWidget.tsx`, `referenceRepo.ts`, `Currency.tsx`, `useEvents.ts`, `Dashboard.tsx`, `TrayView.tsx`, `Settings.tsx`, `BixWidget`, `Planner.tsx`, `EcpManager.tsx`, `MoneyInput.tsx`, `SystemTaskBoard.tsx`, `DigestView.tsx`, `useCompany`, `FocusView.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `supabase` connect `supabase.ts` to `CompanyContext.tsx`, `Finance.tsx`, `pin.ts`, `Translator.tsx`, `CompanyTeamPanel.tsx`, `BixWidget.tsx`, `referenceRepo.ts`, `useCards.ts`, `useEvents.ts`, `Dashboard.tsx`, `TrayView.tsx`, `Support.tsx`, `Settings.tsx`, `Services.tsx`, `Ai.tsx`, `NewsDetail.tsx`, `Documents.tsx`, `Planner.tsx`, `useBoards.ts`, `types.ts`, `useNotifications.ts`, `plan.tsx`, `OnboardingWizard.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `CompanyContext.tsx`, `Finance.tsx`, `supabase.ts`, `Planner.tsx`, `Translator.tsx`, `CompanyTeamPanel.tsx`, `Counterparties.tsx`, `Templates.tsx`, `SickLeaveCalc.tsx`, `Support.tsx`, `Settings.tsx`, `Calc.tsx`, `useCompany`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `gotLock`, `TrayState`, `FLAGS` to the rest of the system?**
  _375 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CalendarPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05403508771929825 - nodes in this community are weakly interconnected._
- **Should `CompanyContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._
- **Should `Finance.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06716417910447761 - nodes in this community are weakly interconnected._