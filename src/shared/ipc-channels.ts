// IPC channel names shared between main and preload/renderer.

export const IPC = {
  // 1C cache
  CACHE_SCAN: 'onec:cache:scan',
  CACHE_CLEAN: 'onec:cache:clean',
  // 1C processes
  PROC_LIST: 'onec:proc:list',
  PROC_KILL: 'onec:proc:kill',
  // 1C backup
  BACKUP_PICK_DB: 'onec:backup:pickDb',
  BACKUP_PICK_DIR: 'onec:backup:pickDir',
  BACKUP_RUN: 'onec:backup:run',
  BACKUP_GET_CONFIG: 'onec:backup:getConfig',
  BACKUP_SAVE_CONFIG: 'onec:backup:saveConfig',
  // Dashboard widgets
  WEATHER_GET: 'widget:weather:get',
  CURRENCY_GET: 'widget:currency:get',
  CURRENCY_ON_DATE: 'widget:currency:onDate',
  CURRENCY_BANKS_GET: 'widget:currency:banks:get',
  // PC Cleaner
  PC_SCAN: 'pc:scan',
  PC_CLEAN: 'pc:clean',
  PC_CHECK_BROWSERS: 'pc:checkBrowsers',
  // Isolated web-service window
  SITE_SESSION_OPEN: 'site-session:open',
  SITE_SESSION_RESET: 'site-session:reset',
  // ECP / E-Imzo
  ECP_PICK_PFX: 'ecp:pickPfx',
  ECP_PARSE_PFX: 'ecp:parsePfx',
  ECP_SIGN_FILE: 'ecp:signFile',
  ECP_VERIFY_SIG: 'ecp:verifySig',
  ECP_PICK_FILE_TO_SIGN: 'ecp:pickFileToSign',
  ECP_PICK_SIG_FILE: 'ecp:pickSigFile',
  // safeStorage
  SAFE_ENCRYPT: 'safe:encrypt',
  SAFE_DECRYPT: 'safe:decrypt',
  SAFE_AVAILABLE: 'safe:available',
  // INN / counterparty check
  INN_CHECK: 'inn:check',
  // News feed (RSS)
  NEWS_FEED: 'news:feed',
  // PDF generator
  PDF_GENERATE: 'pdf:generate',
  // Notifications
  NOTIFY_SHOW: 'notify:show',
  // Autostart settings
  AUTOSTART_GET: 'settings:autostart:get',
  AUTOSTART_SET: 'settings:autostart:set',
  // Window controls
  WIN_MINIMIZE: 'win:minimize',
  WIN_MAXIMIZE: 'win:maximize',
  WIN_CLOSE: 'win:close',
  WIN_IS_MAXIMIZED: 'win:isMaximized'
} as const
