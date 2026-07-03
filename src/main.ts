import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import started from 'electron-squirrel-startup'
import { registerIpcHandlers } from './main/ipc'
import { initBackupScheduler } from './main/services/onecBackupScheduler'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

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
let tray: Tray | null = null

const createTray = () => {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Показать приложение', 
      click: () => {
        mainWindow?.show()
      } 
    },
    { 
      label: 'Скрыть', 
      click: () => {
        mainWindow?.hide()
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
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
    }
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
  createWindow()
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
