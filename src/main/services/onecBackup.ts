import fs from 'node:fs';
import path from 'node:path';
import { dialog } from 'electron';
import type { BackupResult } from '../../shared/types';

/**
 * Backup of a file-based 1С database. A file base is a folder containing
 * `1Cv8.1CD`. We copy that file (and the whole base folder is an option later)
 * to a user-chosen destination with a timestamp suffix, BEFORE risky
 * operations like cache cleaning.
 */

export async function pickDatabaseFile(): Promise<string | null> {
  const res = await dialog.showOpenDialog({
    title: 'Выберите файл базы 1С (1Cv8.1CD)',
    properties: ['openFile'],
    filters: [{ name: 'База 1С', extensions: ['1CD'] }],
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
}

export async function pickBackupDir(): Promise<string | null> {
  const res = await dialog.showOpenDialog({
    title: 'Куда сохранить резервную копию',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

export async function backupDatabase(sourceFile: string, destDir: string): Promise<BackupResult> {
  try {
    if (!fs.existsSync(sourceFile)) {
      return { success: false, error: 'Файл базы не найден' };
    }
    const base = path.basename(sourceFile, path.extname(sourceFile));
    const ext = path.extname(sourceFile);
    const destPath = path.join(destDir, `${base}_${timestamp()}${ext}`);

    await fs.promises.copyFile(sourceFile, destPath);
    const stat = await fs.promises.stat(destPath);
    return { success: true, destPath, sizeBytes: stat.size };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
