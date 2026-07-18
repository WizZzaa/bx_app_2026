import { app, autoUpdater, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, net, Notification, screen } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import started from 'electron-squirrel-startup'
import { registerIpcHandlers } from './main/ipc'
import { initBackupScheduler } from './main/services/onecBackupScheduler'
import {
  buildUpdateFeedUrl,
  calculateDownloadPercent,
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
let updateProgressPercent: number | null = null
let updateDownloadedBytes = 0
let updateTotalBytes = 0
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
  progressPercent: updateProgressPercent,
  downloadedBytes: updateDownloadedBytes,
  totalBytes: updateTotalBytes,
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

const resetUpdateProgress = () => {
  updateProgressPercent = null
  updateDownloadedBytes = 0
  updateTotalBytes = 0
}

const setDownloadProgress = (downloadedBytes: number, totalBytes: number) => {
  const nextPercent = calculateDownloadPercent(downloadedBytes, totalBytes)
  const changed = nextPercent !== updateProgressPercent
    || downloadedBytes - updateDownloadedBytes >= 512 * 1024
    || totalBytes !== updateTotalBytes
  updateProgressPercent = nextPercent
  updateDownloadedBytes = downloadedBytes
  updateTotalBytes = totalBytes
  if (changed) broadcastUpdateStatus()
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
const downloadAsset = (
  url: string,
  name: string,
  onProgress: (downloadedBytes: number, totalBytes: number) => void,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const dest = path.join(app.getPath('downloads'), name)
    const file = fs.createWriteStream(dest)
    const request = net.request(url)
    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        file.close(); fs.rm(dest, () => { /* ignore */ })
        reject(new Error(`HTTP ${response.statusCode}`)); return
      }
      const totalBytes = Number(response.headers['content-length']?.[0] || 0)
      let downloadedBytes = 0
      response.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length
        file.write(chunk)
        onProgress(downloadedBytes, totalBytes)
      })
      response.on('end', () => { file.end(() => resolve(dest)) })
      response.on('error', (e) => { file.close(); reject(e) })
    })
    request.on('error', reject)
    request.end()
  })

const checkManualUpdate = async () => {
  if (!app.isPackaged) return
  if (updateStatus === 'checking' || updateStatus === 'downloading' || updateStatus === 'installing') return
  try {
    resetUpdateProgress()
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
    downloadedPath = await downloadAsset(asset.browser_download_url, asset.name, setDownloadProgress)
    updateProgressPercent = 100
    setUpdateStatus('ready')
  } catch (e) {
    setUpdateStatus('error', (e as Error)?.message || 'Ошибка обновления')
    setTimeout(() => setUpdateStatus('idle'), 8000)
  }
}

const checkForUpdates = async () => {
  if (!app.isPackaged || updateMode === 'unsupported') return updateSnapshot()
  if (updateStatus === 'checking' || updateStatus === 'downloading' || updateStatus === 'installing') return updateSnapshot()

  if (updateMode === 'automatic') {
    resetUpdateProgress()
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
    autoUpdater.on('update-available', () => {
      resetUpdateProgress()
      setUpdateStatus('downloading')
    })
    autoUpdater.on('update-not-available', () => {
      setUpdateStatus('latest')
      setTimeout(() => setUpdateStatus('idle'), 4000)
    })
    autoUpdater.on('update-downloaded', (_event, _notes, releaseName) => {
      availableVersion = String(releaseName || '').replace(/^v/, '')
      updateProgressPercent = 100
      setUpdateStatus('ready')
      try {
        const notice = new Notification({
          title: 'Обновление BX готово',
          body: `Версия ${availableVersion || 'новая'} загружена. Нажмите, чтобы перезапустить BX и установить её.`,
        })
        notice.on('click', () => {
          updateStatus = 'installing'
          updateError = ''
          broadcastUpdateStatus()
          ;(app as any).isQuitting = true
          setTimeout(() => autoUpdater.quitAndInstall(), 350)
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
  setUpdateStatus('installing')
  if (updateMode === 'automatic') {
    (app as any).isQuitting = true
    setTimeout(() => autoUpdater.quitAndInstall(), 350)
    return
  }
  if (downloadedPath) {
    try {
      const openError = await shell.openPath(downloadedPath)
      if (openError) throw new Error(openError)
      try { shell.showItemInFolder(downloadedPath) } catch { /* ignore */ }
      setTimeout(() => app.quit(), 1500)
    } catch (error) {
      setUpdateStatus('error', (error as Error)?.message || 'Не удалось открыть установщик')
    }
  }
})

// Закрепление трей-окна: рендерер трея переключает «пин».
// Закреплённое окно не прячется по blur и остаётся поверх окон.
ipcMain.handle('tray:set-pinned', (_e, pinned: boolean) => {
  trayPinned = !!pinned
  trayState.pinned = trayPinned
  saveTrayState()
  trayWindow?.setAlwaysOnTop(true)
  return trayPinned
})

ipcMain.handle('tray:get-pinned', () => trayPinned)

ipcMain.handle('tray:dock-to-taskbar', () => {
  dockTrayWindow()
})

// Большие встроенные панели (переводчик, утилиты и т. п.) сами запрашивают
// больше места. Это не меняет «свою» позицию пользователя, а при докинге
// растит окно вверх — Бикс остаётся у панели задач.
ipcMain.handle('tray:resize-widget', (_e, requestedWidth: number, requestedHeight: number) => {
  resizeTrayWindow(requestedWidth, requestedHeight)
})

// Прозрачная часть крупного окна виджета не должна блокировать рабочий стол.
// Рендерер переключает это только при входе курсора в реальный элемент Бикса.
ipcMain.handle('tray:set-click-through', (_e, enabled: boolean) => {
  trayWindow?.setIgnoreMouseEvents(!!enabled, { forward: true })
})

// Нативные Windows-уведомления для напоминаний Бикса. Рендерер не получает
// прямой доступ к Electron Notification, поэтому отправляет только текст.
ipcMain.handle('tray:show-notification', (_e, title: string, body: string, route = '/planner') => {
  // Когда Бикс виден, он сам является каналом напоминания. Второй toast Windows
  // в этот момент только дублирует сообщение и отвлекает пользователя.
  if (trayWindow?.isVisible()) return false
  if (!Notification.isSupported()) return false
  try {
    const notice = new Notification({
      title: String(title || 'BX').slice(0, 120),
      body: String(body || '').slice(0, 500),
    })
    notice.on('click', () => {
      if (!mainWindow) return
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
      navigateMainWindow(route)
    })
    notice.show()
    return true
  } catch {
    return false
  }
})

// Открыть главное окно приложения (опц. на конкретном разделе) из трей-виджета.
ipcMain.handle('tray:open-app', (_e, route?: string) => {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
  if (route) navigateMainWindow(route)
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

const appAsset = (name: string) => {
  const bundled = path.join(process.resourcesPath, 'resources', name)
  const source = path.join(app.getAppPath(), 'resources', name)
  return fs.existsSync(bundled) ? bundled : source
}
const loadAppIcon = () => nativeImage.createFromPath(appAsset('icon.png'))

// Запоминаем размер И позицию трей-окна между запусками.
// custom=true — пользователь сам перетащил окно, тогда не «прыгаем» к трею.
interface TrayState { width: number; height: number; x?: number; y?: number; custom?: boolean; pinned?: boolean }
const trayStateFile = () => path.join(app.getPath('userData'), 'tray-window.json')
let trayState: TrayState = { width: 430, height: 560, pinned: true }
const loadTrayState = () => {
  try {
    const s = JSON.parse(fs.readFileSync(trayStateFile(), 'utf-8'))
    // До 2.30.4 окно было ниже и сохраняло координаты для высоты 420px.
    // Их нельзя переносить на новую высоту: кот окажется вне панели задач.
    if (typeof s?.width === 'number' && typeof s?.height === 'number' && s.width >= 430 && s.height >= 560) trayState = { ...trayState, ...s }
  } catch { /* default */ }
  trayPinned = trayState.pinned !== false
}
const saveTrayState = () => {
  try { fs.writeFileSync(trayStateFile(), JSON.stringify(trayState)) } catch { /* ignore */ }
}
// Флаг: подавляем сохранение позиции при программном перемещении (к трею)
let suppressTrayMove = false
// BrowserWindow при setBounds генерирует resize/move. В этот момент нельзя
// повторно докать окно: иначе Windows пересчитает y от workArea и Бикс
// окажется под панелью задач после открытия встроенной панели.
let suppressTrayResize = false

// Electron не ограничивает frameless-окно рабочей областью Windows сам.
// Поэтому при расширении панели или ручном перетаскивании правый край мог
// оказаться за экраном вместе с Биксом. Оставляем всё окно внутри workArea.
const constrainTrayPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
  workArea: { x: number; y: number; width: number; height: number },
) => ({
  x: Math.min(workArea.x + Math.max(0, workArea.width - width), Math.max(workArea.x, Math.round(x))),
  y: Math.min(workArea.y + Math.max(0, workArea.height - height), Math.max(workArea.y, Math.round(y))),
})

const constrainTrayWindowToDisplay = () => {
  if (!trayWindow) return null
  const bounds = trayWindow.getBounds()
  const display = screen.getDisplayNearestPoint({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })
  const width = Math.min(bounds.width, display.workArea.width)
  const height = Math.min(bounds.height, display.workArea.height)
  return {
    ...constrainTrayPosition(bounds.x, bounds.y, width, height, display.workArea),
    width,
    height,
  }
}

const navigateMainWindow = (route: string) => {
  if (!mainWindow) return
  const hash = route.startsWith('/') ? route : `/${route}`
  const applyRoute = () => {
    // IPC-сообщение могло прийти до React listener. Изменение hash работает
    // и при холодном старте, и в уже открытом окне.
    void mainWindow?.webContents.executeJavaScript(`window.location.hash = ${JSON.stringify(hash)}`).catch(() => undefined)
  }
  if (mainWindow.webContents.isLoadingMainFrame()) mainWindow.webContents.once('did-finish-load', applyRoute)
  else applyRoute()
}

const dockTrayWindow = () => {
  if (!trayWindow) return
  const bounds = trayWindow.getBounds()
  const display = screen.getDisplayNearestPoint({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 })
  const { workArea } = display
  const { x, y } = constrainTrayPosition(
    workArea.x + workArea.width - bounds.width - 18,
    workArea.y + workArea.height - bounds.height,
    bounds.width,
    bounds.height,
    workArea,
  )
  trayState = { ...trayState, x, y, custom: false, pinned: true }
  trayPinned = true
  suppressTrayMove = true
  trayWindow.setPosition(x, y, false)
  setTimeout(() => { suppressTrayMove = false }, 150)
  saveTrayState()
}

const resizeTrayWindow = (requestedWidth: number, requestedHeight: number) => {
  if (!trayWindow) return

  const current = trayWindow.getBounds()
  const display = screen.getDisplayNearestPoint({ x: current.x + current.width / 2, y: current.y + current.height / 2 })
  const { workArea } = display
  const width = Math.min(760, Math.max(430, Math.round(requestedWidth)))
  // Не уходим за рабочую область на небольших экранах (например, 1366×768).
  // У высоких мониторов не искусственно обрезаем переводчик, сундук или
  // гардероб: пределом остаётся рабочая область Windows, а не старые 860 px.
  const height = Math.max(560, Math.min(1200, workArea.height, Math.round(requestedHeight)))
  if (width === current.width && height === current.height) return

  // Нижний край — единственный надёжный якорь питомца: пользователь может
  // вручную посадить лапки на taskbar (включая небольшое перекрытие). При
  // раскрытии любой панели растим окно только вверх, никогда не пересчитывая
  // его нижнюю координату от workArea Windows.
  const bottom = current.y + current.height
  const requestedX = trayState.custom ? current.x : workArea.x + workArea.width - width - 18
  // На очень маленьком экране или при ручном расположении виджета сверху не
  // выпускаем верхнюю часть панели за границу видимой рабочей области.
  const { x, y } = constrainTrayPosition(requestedX, bottom - height, width, height, workArea)
  suppressTrayMove = true
  suppressTrayResize = true
  trayWindow.setBounds({ x, y, width, height }, false)
  trayState = { ...trayState, width, height, x, y }
  setTimeout(() => {
    suppressTrayMove = false
    suppressTrayResize = false
  }, 250)
  saveTrayState()
}

const createTrayWindow = () => {
  loadTrayState()
  trayWindow = new BrowserWindow({
    width: trayState.width,
    height: trayState.height,
    minWidth: 430,
    minHeight: 560,
    maxWidth: 760,
    maxHeight: 1200,
    show: true,
    frame: false,
    fullscreenable: false,
    resizable: true,
    thickFrame: process.platform === 'win32',
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
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

  // По умолчанию окно пропускает клики по прозрачной области на рабочий стол.
  // Интерактивные части (Бикс, облачко и панели) сами временно выключают этот режим.
  trayWindow.setIgnoreMouseEvents(true, { forward: true })

  // Пользователь перетащил Бикса → запоминаем позицию как «свою».
  let moveTimer: ReturnType<typeof setTimeout> | null = null
  trayWindow.on('move', () => {
    if (!trayWindow || suppressTrayMove) return
    const constrained = constrainTrayWindowToDisplay()
    if (!constrained) return
    const current = trayWindow.getBounds()
    const { x, y, width, height } = constrained
    if (x !== current.x || y !== current.y || width !== current.width || height !== current.height) {
      suppressTrayMove = true
      suppressTrayResize = true
      trayWindow.setBounds(constrained, false)
      setTimeout(() => { suppressTrayMove = false }, 150)
      setTimeout(() => { suppressTrayResize = false }, 150)
    }
    trayState = { ...trayState, x, y, width, height, custom: true }
    if (moveTimer) clearTimeout(moveTimer)
    moveTimer = setTimeout(saveTrayState, 400)
  })

  trayWindow.on('resize', () => {
    if (!trayWindow || suppressTrayResize) return
    const bounds = trayWindow.getBounds()
    const constrained = constrainTrayWindowToDisplay()
    if (!constrained) return
    if (bounds.x !== constrained.x || bounds.y !== constrained.y || bounds.width !== constrained.width || bounds.height !== constrained.height) {
      suppressTrayMove = true
      suppressTrayResize = true
      trayWindow.setBounds(constrained, false)
      setTimeout(() => {
        suppressTrayMove = false
        suppressTrayResize = false
      }, 150)
    }
    trayState = { ...trayState, ...constrained }
    if (!trayState.custom) dockTrayWindow()
    else saveTrayState()
  })

  // Питомец всегда остаётся на рабочем столе; меню внутри него закрывается
  // на стороне renderer, поэтому окно не скрываем по blur.

  // Для первого запуска сажаем Бикса над нижней панелью задач. workArea
  // оканчивается ровно перед taskbar на Windows, поэтому позиция корректна
  // при разных масштабах и на нескольких мониторах.
  if (!trayState.custom) {
    dockTrayWindow()
  } else {
    // Координаты могли сохраниться с другого монитора или до раскрытия панели.
    const constrained = constrainTrayWindowToDisplay()
    if (constrained) {
      trayState = { ...trayState, ...constrained }
      suppressTrayMove = true
      suppressTrayResize = true
      trayWindow.setBounds(constrained, false)
      setTimeout(() => {
        suppressTrayMove = false
        suppressTrayResize = false
      }, 150)
      saveTrayState()
    }
  }
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
    const bounds = trayWindow.getBounds()
    const display = screen.getDisplayNearestPoint({ x: trayState.x + bounds.width / 2, y: trayState.y + bounds.height / 2 })
    const position = constrainTrayPosition(trayState.x, trayState.y, bounds.width, bounds.height, display.workArea)
    suppressTrayMove = true
    trayWindow.setPosition(position.x, position.y, false)
    trayState = { ...trayState, ...position }
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
