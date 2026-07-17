import { app, autoUpdater, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, net, Notification } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import started from 'electron-squirrel-startup'
import { registerIpcHandlers } from './main/ipc'
import { initBackupScheduler } from './main/services/onecBackupScheduler'
import {
  buildUpdateFeedUrl,
  isNewerVersion,
  UPDATE_REPOSITORY,
  type UpdateMode,
  type UpdateSnapshot,
  type UpdateStatus,
} from './main/services/updatePolicy'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

// ── Обновления приложения ────────────────────────────────────────────────────
// Windows использует нативный Squirrel autoUpdater: пакет скачивается в фоне и
// применяется после подтверждённого перезапуска. Неподписанная macOS-сборка пока
// сохраняет безопасный ручной fallback через GitHub Release.
let updateStatus: UpdateStatus = 'idle'
let updateError = ''
let downloadedPath: string | null = null
let availableVersion = ''
const updateMode: UpdateMode = process.platform === 'win32'
  ? 'automatic'
  : process.platform === 'darwin'
    ? 'manual'
    : 'unsupported'

const updateSnapshot = (): UpdateSnapshot => ({
  status: updateStatus,
  error: updateError,
  version: app.getVersion(),
  availableVersion,
  mode: updateMode,
})

const broadcastUpdateStatus = () => {
  BrowserWindow.getAllWindows().forEach(win => {
    try {
      win.webContents.send('app:update-status', updateSnapshot())
    } catch { /* window might be destroyed */ }
  })
}

const setUpdateStatus = (status: UpdateStatus, error = '') => {
  updateStatus = status
  updateError = error
  broadcastUpdateStatus()
}

// Ассет релиза под текущую платформу+архитектуру (имя вида *-darwin-arm64-*.zip)
const pickAsset = (assets: Array<{ name: string; browser_download_url: string }>) => {
  const plat = process.platform === 'darwin' ? 'darwin' : 'win32'
  const arch = process.arch
  return assets.find(a => a.name.includes(`-${plat}-${arch}-`))
    || assets.find(a => a.name.includes(`-${plat}-`))
    || null
}

// Скачивание ассета в «Загрузки» (net сам следует редиректам GitHub→CDN)
const downloadAsset = (url: string, name: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const dest = path.join(app.getPath('downloads'), name)
    const file = fs.createWriteStream(dest)
    const request = net.request(url)
    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        file.close(); fs.rm(dest, () => { /* ignore */ })
        reject(new Error(`HTTP ${response.statusCode}`)); return
      }
      response.on('data', (chunk: Buffer) => { file.write(chunk) })
      response.on('end', () => { file.end(() => resolve(dest)) })
      response.on('error', (e) => { file.close(); reject(e) })
    })
    request.on('error', reject)
    request.end()
  })

const checkManualUpdate = async () => {
  if (!app.isPackaged) return
  if (updateStatus === 'checking' || updateStatus === 'downloading') return
  try {
    setUpdateStatus('checking')
    const res = await net.fetch(`https://api.github.com/repos/${UPDATE_REPOSITORY}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'BX-Updater' },
    })
    const data = await res.json() as { tag_name?: string; assets?: Array<{ name: string; browser_download_url: string }> }
    const latest = String(data.tag_name || '').replace(/^v/, '')
    if (!latest || !isNewerVersion(latest, app.getVersion())) {
      setUpdateStatus('latest')
      setTimeout(() => setUpdateStatus('idle'), 4000)
      return
    }
    availableVersion = latest
    const asset = pickAsset(data.assets || [])
    if (!asset) { setUpdateStatus('latest'); return }
    setUpdateStatus('downloading')
    downloadedPath = await downloadAsset(asset.browser_download_url, asset.name)
    setUpdateStatus('ready')
  } catch (e) {
    setUpdateStatus('error', (e as Error)?.message || 'Ошибка обновления')
    setTimeout(() => setUpdateStatus('idle'), 8000)
  }
}

const checkForUpdates = async () => {
  if (!app.isPackaged || updateMode === 'unsupported') return updateSnapshot()
  if (updateStatus === 'checking' || updateStatus === 'downloading') return updateSnapshot()

  if (updateMode === 'automatic') {
    setUpdateStatus('checking')
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      setUpdateStatus('error', (error as Error)?.message || 'Не удалось проверить обновления')
    }
    return updateSnapshot()
  }

  await checkManualUpdate()
  return updateSnapshot()
}

const setupAutoUpdater = () => {
  if (!app.isPackaged || updateMode === 'unsupported') return

  if (updateMode === 'automatic') {
    autoUpdater.setFeedURL({
      url: buildUpdateFeedUrl(app.getVersion()),
      headers: { 'User-Agent': `BX/${app.getVersion()}` },
    })
    autoUpdater.on('checking-for-update', () => setUpdateStatus('checking'))
    autoUpdater.on('update-available', () => setUpdateStatus('downloading'))
    autoUpdater.on('update-not-available', () => {
      setUpdateStatus('latest')
      setTimeout(() => setUpdateStatus('idle'), 4000)
    })
    autoUpdater.on('update-downloaded', (_event, _notes, releaseName) => {
      availableVersion = String(releaseName || '').replace(/^v/, '')
      setUpdateStatus('ready')
      try {
        const notice = new Notification({
          title: 'Обновление BX готово',
          body: `Версия ${availableVersion || 'новая'} загружена. Нажмите, чтобы перезапустить BX и установить её.`,
        })
        notice.on('click', () => {
          (app as any).isQuitting = true
          autoUpdater.quitAndInstall()
        })
        notice.show()
      } catch { /* notification is optional */ }
    })
    autoUpdater.on('before-quit-for-update', () => { (app as any).isQuitting = true })
    autoUpdater.on('error', error => {
      setUpdateStatus('error', error.message || 'Ошибка автоматического обновления')
      setTimeout(() => setUpdateStatus('idle'), 8000)
    })
  }

  // Squirrel удерживает файлы в первые секунды первого запуска, поэтому не
  // проверяем обновление мгновенно. Далее проверяем один раз в час.
  setTimeout(() => { void checkForUpdates() }, 15_000)
  setInterval(() => { void checkForUpdates() }, 60 * 60 * 1000)
}

// IPC: статус / ручная проверка / установка уже загруженного обновления.
ipcMain.handle('app:check-for-updates', async () => {
  return checkForUpdates()
})

ipcMain.handle('app:get-update-status', () => {
  return updateSnapshot()
})

ipcMain.handle('app:install-update', async () => {
  if (updateStatus !== 'ready') return
  if (updateMode === 'automatic') {
    (app as any).isQuitting = true
    autoUpdater.quitAndInstall()
    return
  }
  if (downloadedPath) {
    try { await shell.openPath(downloadedPath) } catch { /* ignore */ }
    try { shell.showItemInFolder(downloadedPath) } catch { /* ignore */ }
    setTimeout(() => app.quit(), 1500)
  }
})

// Закрепление трей-окна: рендерер трея переключает «пин».
// Закреплённое окно не прячется по blur и остаётся поверх окон.
ipcMain.handle('tray:set-pinned', (_e, pinned: boolean) => {
  trayPinned = !!pinned
  trayWindow?.setAlwaysOnTop(true)
  return trayPinned
})

// Открыть главное окно приложения (опц. на конкретном разделе) из трей-виджета.
ipcMain.handle('tray:open-app', (_e, route?: string) => {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
  if (route) mainWindow.webContents.send('tray:navigate', route)
  if (!trayPinned) trayWindow?.hide()
})

// ── Миграция userData после переименования приложения ──────────────────────
// productName был «app» — данные жили в …/Application Support/app.
// Переносим папку под новое имя ДО requestSingleInstanceLock (он создаёт
// Singleton-файлы в userData). Если перенос невозможен — работаем по старому пути.
{
  const oldDir = path.join(app.getPath('appData'), 'app')
  const newDir = path.join(app.getPath('appData'), app.getName())
  if (oldDir !== newDir && fs.existsSync(oldDir)) {
    // папка нового имени со «скелетом» (Singleton*/.DS_Store) считается пустой
    let newBlocks = false
    if (fs.existsSync(newDir)) {
      try {
        const entries = fs.readdirSync(newDir)
        newBlocks = !entries.every(e => e.startsWith('Singleton') || e === '.DS_Store')
        if (!newBlocks) fs.rmSync(newDir, { recursive: true, force: true })
      } catch { newBlocks = true }
    }
    if (newBlocks) {
      app.setPath('userData', oldDir)
    } else {
      try { fs.renameSync(oldDir, newDir) }
      catch { app.setPath('userData', oldDir) }
    }
  }
}

// ── Один экземпляр ──────────────────────────────────────────────────────────
// Два одновременных запуска дерутся за IndexedDB (ошибки Dexie/quota) и
// инвалидируют Supabase-сессию друг друга. Второй экземпляр лишь показывает окно первого.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

let mainWindow: BrowserWindow | null = null
let trayWindow: BrowserWindow | null = null
let tray: Tray | null = null
// Закрепление трей-окна: когда true — окно не прячется при потере фокуса.
let trayPinned = false

const appAsset = (name: string) => path.join(app.getAppPath(), 'resources', name)
const loadAppIcon = () => nativeImage.createFromPath(appAsset('icon.png'))

// Запоминаем размер И позицию трей-окна между запусками.
// custom=true — пользователь сам перетащил окно, тогда не «прыгаем» к трею.
interface TrayState { width: number; height: number; x?: number; y?: number; custom?: boolean }
const trayStateFile = () => path.join(app.getPath('userData'), 'tray-window.json')
let trayState: TrayState = { width: 380, height: 560 }
const loadTrayState = () => {
  try {
    const s = JSON.parse(fs.readFileSync(trayStateFile(), 'utf-8'))
    if (typeof s?.width === 'number' && typeof s?.height === 'number') trayState = s
  } catch { /* default */ }
}
const saveTrayState = () => {
  try { fs.writeFileSync(trayStateFile(), JSON.stringify(trayState)) } catch { /* ignore */ }
}
// Флаг: подавляем сохранение позиции при программном перемещении (к трею)
let suppressTrayMove = false

const createTrayWindow = () => {
  loadTrayState()
  trayWindow = new BrowserWindow({
    width: trayState.width,
    height: trayState.height,
    minWidth: 320,
    minHeight: 400,
    maxWidth: 680,
    maxHeight: 960,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    icon: loadAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    trayWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/tray`)
  } else {
    trayWindow.loadURL(
      `file://${path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)}#/tray`
    )
  }

  // Сохраняем размер при изменении (с debounce)
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  trayWindow.on('resize', () => {
    if (!trayWindow) return
    const [w, h] = trayWindow.getSize()
    trayState.width = w; trayState.height = h
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveTrayState, 400)
  })

  // Пользователь перетащил окно за ручку → запоминаем позицию как «свою»
  let moveTimer: ReturnType<typeof setTimeout> | null = null
  trayWindow.on('move', () => {
    if (!trayWindow || suppressTrayMove) return
    const [x, y] = trayWindow.getPosition()
    trayState.x = x; trayState.y = y; trayState.custom = true
    if (moveTimer) clearTimeout(moveTimer)
    moveTimer = setTimeout(saveTrayState, 400)
  })

  trayWindow.on('blur', () => {
    if (!trayPinned) trayWindow?.hide()
  })
}

const toggleTrayWindow = () => {
  if (!tray || !trayWindow) return

  if (trayWindow.isVisible()) {
    trayWindow.hide()
    return
  }

  // Если пользователь сам перетащил окно — показываем на его позиции,
  // не «прыгаем» к иконке трея.
  if (trayState.custom && typeof trayState.x === 'number' && typeof trayState.y === 'number') {
    suppressTrayMove = true
    trayWindow.setPosition(trayState.x, trayState.y, false)
    setTimeout(() => { suppressTrayMove = false }, 150)
    trayWindow.show()
    trayWindow.focus()
    return
  }

  const trayBounds = tray.getBounds()
  const windowBounds = trayWindow.getBounds()

  let x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
  let y = Math.round(trayBounds.y - windowBounds.height)

  if (process.platform === 'darwin') {
    x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
    y = Math.round(trayBounds.y + trayBounds.height)
  }

  suppressTrayMove = true
  trayWindow.setPosition(x, y, false)
  setTimeout(() => { suppressTrayMove = false }, 150)
  trayWindow.show()
  trayWindow.focus()
}

const createTray = () => {
  const icon = nativeImage.createFromPath(appAsset(process.platform === 'darwin' ? 'tray-64.png' : 'tray-32.png'))
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Показать панель виджетов', 
      click: () => {
        toggleTrayWindow()
      } 
    },
    { 
      label: 'Открыть главное окно', 
      click: () => {
        mainWindow?.show()
      } 
    },
    { type: 'separator' },
    { 
      label: 'Выйти', 
      click: () => {
        (app as any).isQuitting = true
        app.quit()
      } 
    }
  ])
  
  tray.setToolTip('Business BX')
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    toggleTrayWindow()
  })
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    backgroundColor: '#0f1117',
    icon: loadAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    )
  }

  // DevTools — только в dev-режиме
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('close', (e) => {
    if (!(app as any).isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
      // Однократно за запуск подсказываем, что приложение свёрнуто в трей
      if (!(app as any).trayNoticeShown) {
        (app as any).trayNoticeShown = true
        try {
          new Notification({
            title: 'BX работает в фоне',
            body: 'Приложение свёрнуто в трей, а не закрыто. Значок — рядом с часами. Для полного выхода: правый клик по значку → «Выйти».',
          }).show()
        } catch { /* ignore */ }
      }
    }
  })
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
})

app.on('ready', () => {
  registerIpcHandlers()
  initBackupScheduler()
  setupAutoUpdater()
  if (process.platform === 'darwin') app.dock?.setIcon(loadAppIcon())
  createWindow()
  createTrayWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // Клик по иконке в доке: показать скрытое окно (свёрнуто в трей) или создать
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  } else if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
