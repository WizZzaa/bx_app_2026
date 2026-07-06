import { app, BrowserWindow, Tray, Menu, nativeImage, autoUpdater, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import started from 'electron-squirrel-startup'
import { registerIpcHandlers } from './main/ipc'
import { initBackupScheduler } from './main/services/onecBackupScheduler'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

// ── Автообновление через autoUpdater + Squirrel ──────────────────────────────
// update.electronjs.org предоставляет совместимый сервер обновлений для публичных GitHub-репо.
// autoUpdater скачивает обновление в фоне и предлагает перезапуск.
let updateStatus: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error' = 'idle'
let updateError = ''

const setupAutoUpdater = () => {
  if (!app.isPackaged) return

  const server = 'https://update.electronjs.org'
  const repo = 'WizZzaa/bx_app_2026'
  const platform = `${process.platform}-${process.arch}`
  const version = app.getVersion()
  const feedURL = `${server}/${repo}/${platform}/${version}`

  try {
    autoUpdater.setFeedURL({ url: feedURL })
  } catch (e) {
    console.warn('Автообновление: не удалось настроить feed URL:', e)
    return
  }

  autoUpdater.on('checking-for-update', () => {
    updateStatus = 'checking'
    broadcastUpdateStatus()
  })

  autoUpdater.on('update-available', () => {
    updateStatus = 'downloading'
    broadcastUpdateStatus()
  })

  autoUpdater.on('update-not-available', () => {
    updateStatus = 'idle'
    broadcastUpdateStatus()
  })

  autoUpdater.on('update-downloaded', () => {
    updateStatus = 'ready'
    broadcastUpdateStatus()
  })

  autoUpdater.on('error', (err) => {
    updateStatus = 'error'
    updateError = err?.message || 'Неизвестная ошибка'
    broadcastUpdateStatus()
    // Сбрасываем ошибку через 10 секунд
    setTimeout(() => {
      updateStatus = 'idle'
      updateError = ''
    }, 10000)
  })

  // Проверяем обновления при запуске и потом каждый час
  setTimeout(() => {
    try { autoUpdater.checkForUpdates() } catch { /* ignore */ }
  }, 5000)

  setInterval(() => {
    try { autoUpdater.checkForUpdates() } catch { /* ignore */ }
  }, 60 * 60 * 1000)
}

const broadcastUpdateStatus = () => {
  BrowserWindow.getAllWindows().forEach(win => {
    try {
      win.webContents.send('app:update-status', { status: updateStatus, error: updateError, version: app.getVersion() })
    } catch { /* window might be destroyed */ }
  })
}

// IPC: рендерер запрашивает текущий статус или проверку
ipcMain.handle('app:check-for-updates', () => {
  if (app.isPackaged) {
    try { autoUpdater.checkForUpdates() } catch { /* ignore */ }
  }
  return { status: updateStatus, error: updateError, version: app.getVersion() }
})

ipcMain.handle('app:get-update-status', () => {
  return { status: updateStatus, error: updateError, version: app.getVersion() }
})

ipcMain.handle('app:install-update', () => {
  if (updateStatus === 'ready') {
    autoUpdater.quitAndInstall()
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
