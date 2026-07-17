import { createHash } from 'node:crypto'
import { BrowserWindow, session } from 'electron'
import { normalizeSiteUrl, type SiteResetMode, type SiteSessionResult } from '../../shared/siteSession'

const siteWindows = new Map<string, BrowserWindow>()

function partitionFor(origin: string) {
  const id = createHash('sha256').update(origin).digest('hex').slice(0, 20)
  return `persist:bx-web-service-${id}`
}

function secureWebPreferences(partition: string) {
  return {
    partition,
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
  }
}

function createSiteWindow(origin: string, hostname: string, parent?: BrowserWindow | null) {
  const partition = partitionFor(origin)
  const win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 820,
    minHeight: 600,
    show: false,
    title: `BX — ${hostname}`,
    parent: parent && !parent.isDestroyed() ? parent : undefined,
    webPreferences: secureWebPreferences(partition),
  })

  win.webContents.on('will-navigate', (event, targetUrl) => {
    try {
      normalizeSiteUrl(targetUrl)
    } catch {
      event.preventDefault()
    }
  })
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      normalizeSiteUrl(url)
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: win,
          webPreferences: secureWebPreferences(partition),
        },
      }
    } catch {
      return { action: 'deny' }
    }
  })
  win.once('ready-to-show', () => win.show())
  win.on('closed', () => siteWindows.delete(origin))
  siteWindows.set(origin, win)
  return win
}

export async function openSiteSession(rawUrl: string, parent?: BrowserWindow | null): Promise<SiteSessionResult> {
  let win: BrowserWindow | undefined
  try {
    const normalized = normalizeSiteUrl(rawUrl)
    win = siteWindows.get(normalized.origin)
    if (!win || win.isDestroyed()) {
      win = createSiteWindow(normalized.origin, normalized.hostname, parent)
    }
    if (win.webContents.getURL() !== normalized.url) await win.loadURL(normalized.url)
    if (!win.isVisible()) win.show()
    win.focus()
    return {
      success: true,
      origin: normalized.origin,
      reopened: true,
      message: `Сайт ${normalized.hostname} открыт в отдельном окне BX`,
    }
  } catch (error) {
    if (win && !win.isDestroyed() && !win.isVisible()) win.destroy()
    return { success: false, error: error instanceof Error ? error.message : 'Не удалось открыть сайт' }
  }
}

export async function resetSiteSession(rawUrl: string, mode: SiteResetMode, parent?: BrowserWindow | null): Promise<SiteSessionResult> {
  try {
    if (mode !== 'cache' && mode !== 'full') throw new Error('Неизвестный режим очистки')
    const normalized = normalizeSiteUrl(rawUrl)
    const partition = partitionFor(normalized.origin)
    const siteSession = session.fromPartition(partition)
    const existingWindow = siteWindows.get(normalized.origin)
    if (existingWindow && !existingWindow.isDestroyed()) {
      siteWindows.delete(normalized.origin)
      existingWindow.destroy()
    }

    if (mode === 'full') {
      // This partition belongs only to the selected origin, so a full clear cannot touch other sites.
      await siteSession.clearData({
        dataTypes: ['cache', 'cookies', 'fileSystems', 'indexedDB', 'localStorage', 'serviceWorkers', 'webSQL'],
      })
      await siteSession.clearAuthCache()
    } else {
      await siteSession.clearData({
        dataTypes: ['cache', 'serviceWorkers'],
        origins: [normalized.origin],
        originMatchingMode: 'origin-in-all-contexts',
      })
    }

    await Promise.allSettled([
      siteSession.clearCache(),
      siteSession.clearCodeCaches({ urls: [normalized.url] }),
      siteSession.clearHostResolverCache(),
      siteSession.closeAllConnections(),
    ])

    const reopened = await openSiteSession(normalized.url, parent)
    return {
      success: reopened.success,
      origin: normalized.origin,
      reopened: reopened.success,
      signedOut: mode === 'full',
      message: mode === 'full'
        ? `Данные ${normalized.hostname} полностью сброшены. Потребуется войти заново.`
        : `Кэш ${normalized.hostname} очищен. Авторизация сохранена.`,
      error: reopened.error,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Не удалось очистить данные сайта' }
  }
}
