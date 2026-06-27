import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import started from 'electron-squirrel-startup'
import { registerIpcHandlers } from './main/ipc'
import { initBackupScheduler } from './main/services/onecBackupScheduler'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
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

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  mainWindow.on('close', (e) => {
    if (!(app as any).isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })
}

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
