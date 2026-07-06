import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, dialog, shell, net } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import started from 'electron-squirrel-startup'
import { registerIpcHandlers } from './main/ipc'
import { initBackupScheduler } from './main/services/onecBackupScheduler'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

// ── Автообновление: собственный загрузчик (работает без подписи) ─────────────
// Нативный autoUpdater (Squirrel.Mac) требует подпись Apple Developer ID и на
// неподписанной сборке даже не начинает скачивание. Поэтому качаем сами:
// проверяем последний релиз на GitHub, скачиваем ассет под платформу в фоне,
// показываем «готово», а по кнопке открываем файл для установки.
let updateStatus: 'idle' | 'checking' | 'downloading' | 'ready' | 'error' = 'idle'
let updateError = ''
let downloadedPath: string | null = null

const GH_REPO = 'WizZzaa/bx_app_2026'

const broadcastUpdateStatus = () => {
  BrowserWindow.getAllWindows().forEach(win => {
    try {
      win.webContents.send('app:update-status', { status: updateStatus, error: updateError, version: app.getVersion() })
    } catch { /* window might be destroyed */ }
  })
}

// Сравнение версий «a новее b» (semver x.y.z)
const isNewerVersion = (a: string, b: string): boolean => {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0)
  const pb = b.split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true
    if ((pa[i] || 0) < (pb[i] || 0)) return false
  }
  return false
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

const checkForUpdatesAndDownload = async () => {
  if (!app.isPackaged) return
  if (updateStatus === 'checking' || updateStatus === 'downloading') return
  try {
    updateStatus = 'checking'; broadcastUpdateStatus()
    const res = await net.fetch(`https://api.github.com/repos/${GH_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'BX-Updater' },
    })
    const data = await res.json() as { tag_name?: string; assets?: Array<{ name: string; browser_download_url: string }> }
    const latest = String(data.tag_name || '').replace(/^v/, '')
    if (!latest || !isNewerVersion(latest, app.getVersion())) {
      updateStatus = 'idle'; broadcastUpdateStatus(); return
    }
    const asset = pickAsset(data.assets || [])
    if (!asset) { updateStatus = 'idle'; broadcastUpdateStatus(); return }
    updateStatus = 'downloading'; broadcastUpdateStatus()
    downloadedPath = await downloadAsset(asset.browser_download_url, asset.name)
    updateStatus = 'ready'; broadcastUpdateStatus()
  } catch (e) {
    updateStatus = 'error'
    updateError = (e as Error)?.message || 'Ошибка обновления'
    broadcastUpdateStatus()
    setTimeout(() => { updateStatus = 'idle'; updateError = ''; broadcastUpdateStatus() }, 8000)
  }
}

const setupAutoUpdater = () => {
  if (!app.isPackaged) return
  // Проверяем и качаем при запуске и далее раз в час
  setTimeout(() => { checkForUpdatesAndDownload() }, 5000)
  setInterval(() => { checkForUpdatesAndDownload() }, 60 * 60 * 1000)
}

// IPC: статус / ручная проверка+загрузка / открытие скачанного апдейта
ipcMain.handle('app:check-for-updates', async () => {
  await checkForUpdatesAndDownload()
  return { status: updateStatus, error: updateError, version: app.getVersion() }
})

ipcMain.handle('app:get-update-status', () => {
  return { status: updateStatus, error: updateError, version: app.getVersion() }
})

ipcMain.handle('app:install-update', async () => {
  if (updateStatus === 'ready' && downloadedPath) {
    // Открываем скачанный архив (macOS распакует .app, Windows — установщик/архив)
    // и подсвечиваем файл в проводнике, затем выходим для замены приложения.
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

const createTrayWindow = () => {
  trayWindow = new BrowserWindow({
    width: 360,
    height: 480,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    trayWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/tray`)
  } else {
    trayWindow.loadURL(
      `file://${path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)}#/tray`
    )
  }

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

  const trayBounds = tray.getBounds()
  const windowBounds = trayWindow.getBounds()

  let x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
  let y = Math.round(trayBounds.y - windowBounds.height)

  if (process.platform === 'darwin') {
    x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
    y = Math.round(trayBounds.y + trayBounds.height)
  }

  trayWindow.setPosition(x, y, false)
  trayWindow.show()
  trayWindow.focus()
}

const createTray = () => {
  const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAANElEQVR42mNk+M9QDwOsoRiEUcoGBgYGBhphwAAMmAY0YBoEID4aICyMhogQhhmkPADt/gP9Nn6GZAAAAABJRU5ErkJggg==')
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
        ;(app as any).isQuitting = true
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
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
