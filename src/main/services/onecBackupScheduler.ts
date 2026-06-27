import fs from 'node:fs'
import path from 'node:path'
import { app, Notification } from 'electron'
import { backupDatabase } from './onecBackup'

export interface BackupScheduleConfig {
  enabled: boolean
  sourceFile: string
  destDir: string
  intervalHours: number
  lastBackupTime?: string
}

const CONFIG_FILE = 'backup-schedule.json'

function getConfigPath(): string {
  // Получаем путь к папке userData приложения
  return path.join(app.getPath('userData'), CONFIG_FILE)
}

export async function readBackupConfig(): Promise<BackupScheduleConfig> {
  const p = getConfigPath()
  try {
    if (!fs.existsSync(p)) {
      return { enabled: false, sourceFile: '', destDir: '', intervalHours: 24 }
    }
    const raw = await fs.promises.readFile(p, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { enabled: false, sourceFile: '', destDir: '', intervalHours: 24 }
  }
}

export async function writeBackupConfig(config: BackupScheduleConfig): Promise<void> {
  const p = getConfigPath()
  await fs.promises.writeFile(p, JSON.stringify(config, null, 2), 'utf8')
}

// Запуск фоновой проверки бэкапа
export function initBackupScheduler() {
  // Проверяем каждые 10 минут
  const CHECK_INTERVAL_MS = 10 * 60 * 1000 
  
  setInterval(async () => {
    try {
      const config = await readBackupConfig()
      if (!config.enabled || !config.sourceFile || !config.destDir) return

      const now = new Date()
      let shouldBackup = false

      if (!config.lastBackupTime) {
        shouldBackup = true
      } else {
        const last = new Date(config.lastBackupTime)
        const diffMs = now.getTime() - last.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)
        if (diffHours >= config.intervalHours) {
          shouldBackup = true
        }
      }

      if (shouldBackup) {
        console.log(`[BackupScheduler] Запуск фонового бэкапа: ${config.sourceFile} -> ${config.destDir}`)
        const result = await backupDatabase(config.sourceFile, config.destDir)
        
        if (result.success) {
          config.lastBackupTime = now.toISOString()
          await writeBackupConfig(config)

          new Notification({
            title: 'Автоматический бэкап 1С',
            body: 'Резервная копия базы успешно создана в фоне.'
          }).show()
        } else {
          new Notification({
            title: 'Ошибка бэкапа 1С',
            body: `Не удалось создать резервную копию: ${result.error}`
          }).show()
        }
      }
    } catch (err) {
      console.error('[BackupScheduler] Ошибка планировщика бэкапа:', err)
    }
  }, CHECK_INTERVAL_MS)
}
