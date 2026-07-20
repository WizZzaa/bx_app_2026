import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { dialog } from 'electron';
import type { BackupResult, RestorePreflightCheck, RestoreResult } from '../../shared/types';
import { listProcesses } from './onecProcess';

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

export function validateBackupSelection(sourceFile: string, destDir: string): string | null {
  if (path.extname(sourceFile).toLowerCase() !== '.1cd') return 'Выберите файл базы 1С с расширением .1CD';
  if (path.resolve(path.dirname(sourceFile)) === path.resolve(destDir)) return 'Папка копии должна отличаться от папки рабочей базы';
  return null;
}

export async function verifyCopiedFile(sourceFile: string, copiedFile: string): Promise<number> {
  const [sourceStat, copiedStat] = await Promise.all([fs.promises.stat(sourceFile), fs.promises.stat(copiedFile)]);
  if (!sourceStat.isFile() || sourceStat.size <= 0) throw new Error('Исходная база пуста или не является файлом');
  if (!copiedStat.isFile() || copiedStat.size !== sourceStat.size) throw new Error('Размер созданной копии не совпадает с исходной базой');
  const handle = await fs.promises.open(copiedFile, 'r');
  try {
    const probe = Buffer.alloc(Math.min(4096, copiedStat.size));
    const first = await handle.read(probe, 0, probe.length, 0);
    if (first.bytesRead !== probe.length) throw new Error('Созданная копия не читается полностью');
    if (copiedStat.size > probe.length) {
      const last = await handle.read(probe, 0, probe.length, copiedStat.size - probe.length);
      if (last.bytesRead !== probe.length) throw new Error('Конец созданной копии не читается');
    }
    await handle.sync();
  } finally {
    await handle.close();
  }
  return copiedStat.size;
}

export async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const input = fs.createReadStream(filePath);
    input.on('error', reject);
    input.on('data', chunk => hash.update(chunk));
    input.on('end', () => resolve(hash.digest('hex')));
  });
}

export async function verifyExactCopy(sourceFile: string, copiedFile: string): Promise<number> {
  const size = await verifyCopiedFile(sourceFile, copiedFile);
  const [sourceHash, copiedHash] = await Promise.all([hashFile(sourceFile), hashFile(copiedFile)]);
  if (sourceHash !== copiedHash) throw new Error('Контрольная сумма копии не совпадает с исходным файлом');
  return size;
}

export function validateRestoreSelection(sourceBackup: string, targetDatabase: string): string | null {
  const source = path.resolve(sourceBackup);
  const target = path.resolve(targetDatabase);
  if (path.extname(source).toLowerCase() !== '.1cd' || path.extname(target).toLowerCase() !== '.1cd') {
    return 'Источник и рабочая база должны быть файлами .1CD';
  }
  const sourceKey = process.platform === 'win32' ? source.toLowerCase() : source;
  const targetKey = process.platform === 'win32' ? target.toLowerCase() : target;
  if (sourceKey === targetKey) return 'Нельзя восстановить файл сам в себя';
  return null;
}

export async function restoreDatabase(sourceBackup: string, targetDatabase: string): Promise<RestoreResult> {
  const checks: RestorePreflightCheck[] = [];
  const source = path.resolve(sourceBackup);
  const target = path.resolve(targetDatabase);
  const targetDir = path.dirname(target);
  const add = (id: string, label: string, ok: boolean, message: string) => checks.push({ id, label, ok, message });
  const selectionError = validateRestoreSelection(source, target);
  const sourceStat = await fs.promises.stat(source).catch(() => null);
  const targetStat = await fs.promises.stat(target).catch(() => null);
  const [realSource, realTarget] = await Promise.all([
    fs.promises.realpath(source).catch(() => source),
    fs.promises.realpath(target).catch(() => target),
  ]);
  const realSourceKey = process.platform === 'win32' ? realSource.toLowerCase() : realSource;
  const realTargetKey = process.platform === 'win32' ? realTarget.toLowerCase() : realTarget;
  const pathsOk = !selectionError && realSourceKey !== realTargetKey;
  add('paths', 'Исходник и рабочая база', pathsOk, selectionError ?? (realSourceKey === realTargetKey ? 'Файлы указывают на одну и ту же базу' : 'Файлы различаются и имеют формат .1CD'));
  add('source', 'Источник восстановления', Boolean(sourceStat?.isFile() && sourceStat.size > 0), sourceStat?.isFile() ? `${sourceStat.size} байт, доступен для чтения` : 'Источник не найден');
  add('target', 'Текущая рабочая база', Boolean(targetStat?.isFile() && targetStat.size > 0), targetStat?.isFile() ? `${targetStat.size} байт, доступна` : 'Рабочая база не найдена');
  const processes = await listProcesses().catch(() => null);
  add('processes', 'Процессы 1С закрыты', processes?.length === 0, processes === null ? 'Не удалось проверить процессы 1С' : processes.length ? `Закройте: ${processes.map(item => item.name).join(', ')}` : 'Активные процессы 1С не найдены');
  const space = await fs.promises.statfs(targetDir).catch(() => null);
  const required = (sourceStat?.size ?? 0) + (targetStat?.size ?? 0) * 2;
  const available = space ? space.bavail * space.bsize : 0;
  add('space', 'Свободное место', available >= required, `Нужно ${required} байт, доступно ${available} байт`);
  if (checks.some(check => !check.ok)) return { success: false, checks, error: 'Preflight не пройден. Файлы не изменены.' };

  const stamp = timestamp();
  const safetyCopyPath = path.join(targetDir, `${path.basename(target, path.extname(target))}_before_restore_${stamp}-${randomUUID().slice(0, 8)}.1CD`);
  const candidate = path.join(targetDir, `.bx-restore-candidate-${randomUUID()}.1CD`);
  let safetyVerified = false;
  try {
    await fs.promises.copyFile(target, safetyCopyPath, fs.constants.COPYFILE_EXCL);
    await verifyExactCopy(target, safetyCopyPath);
    safetyVerified = true;
    add('safety', 'Страховочная копия', true, `SHA-256 подтверждён · ${safetyCopyPath}`);
    await fs.promises.copyFile(source, candidate, fs.constants.COPYFILE_EXCL);
    await verifyExactCopy(source, candidate);
    add('candidate', 'Восстанавливаемая копия', true, 'Временный файл и SHA-256 проверены');
    const finalProcesses = await listProcesses().catch(() => null);
    if (finalProcesses === null || finalProcesses.length > 0) {
      add('processes-final', 'Повторная проверка процессов', false, finalProcesses === null ? 'Не удалось повторно проверить процессы 1С' : `После начала проверки запущена 1С: ${finalProcesses.map(item => item.name).join(', ')}`);
      throw new Error('Перед заменой рабочей базы процессы 1С должны быть закрыты');
    }
    add('processes-final', 'Повторная проверка процессов', true, 'Перед заменой активные процессы 1С не найдены');
    let switched = false;
    try {
      // Candidate and target are in one directory, so rename is the atomic switch:
      // a power loss leaves either the old target or the already verified candidate.
      await fs.promises.rename(candidate, target);
      switched = true;
      await verifyExactCopy(source, target);
      add('final', 'Финальная проверка', true, 'Рабочий файл и SHA-256 соответствуют выбранной копии');
      return { success: true, checks, safetyCopyPath };
    } catch (finalError) {
      if (!switched) throw finalError;
      const recovery = path.join(targetDir, `.bx-restore-recovery-${randomUUID()}.1CD`);
      try {
        await fs.promises.copyFile(safetyCopyPath, recovery, fs.constants.COPYFILE_EXCL);
        await verifyExactCopy(safetyCopyPath, recovery);
        await fs.promises.rename(recovery, target);
        await verifyExactCopy(safetyCopyPath, target);
        add('final', 'Финальная проверка', false, 'Проверка не пройдена; исходная база атомарно возвращена');
        return { success: false, checks, safetyCopyPath, rolledBack: true, error: (finalError as Error).message };
      } catch (recoveryError) {
        await fs.promises.unlink(recovery).catch(() => undefined);
        add('final', 'Финальная проверка', false, 'Автоматический откат не завершён; подтверждённая страховочная копия сохранена');
        return { success: false, checks, safetyCopyPath, rolledBack: false, error: `${(finalError as Error).message}. Откат: ${(recoveryError as Error).message}` };
      }
    }
  } catch (error) {
    await fs.promises.unlink(candidate).catch(() => undefined);
    if (!safetyVerified) await fs.promises.unlink(safetyCopyPath).catch(() => undefined);
    return { success: false, checks, safetyCopyPath: safetyVerified ? safetyCopyPath : undefined, error: (error as Error).message };
  }
}

export async function backupDatabase(sourceFile: string, destDir: string): Promise<BackupResult> {
  let tempPath = '';
  try {
    if (!fs.existsSync(sourceFile)) {
      return { success: false, error: 'Файл базы не найден' };
    }
    const selectionError = validateBackupSelection(sourceFile, destDir);
    if (selectionError) return { success: false, error: selectionError };
    const destStat = await fs.promises.stat(destDir).catch(() => null);
    if (!destStat?.isDirectory()) return { success: false, error: 'Папка для копии недоступна' };
    const base = path.basename(sourceFile, path.extname(sourceFile));
    const ext = path.extname(sourceFile);
    const destPath = path.join(destDir, `${base}_${timestamp()}${ext}`);
    tempPath = `${destPath}.partial-${crypto.randomUUID()}`;
    const processesBeforeCopy = await listProcesses().catch(() => null);
    if (processesBeforeCopy === null) {
      return { success: false, error: 'Не удалось проверить процессы 1С. Копирование не начато' };
    }
    if (processesBeforeCopy.length > 0) {
      return { success: false, error: `Перед резервным копированием закройте 1С: ${processesBeforeCopy.map(item => item.name).join(', ')}` };
    }
    const sourceStat = await fs.promises.stat(sourceFile);
    if (!sourceStat.isFile() || sourceStat.size <= 0) return { success: false, error: 'Исходная база пуста или не является файлом' };
    const space = await fs.promises.statfs(destDir);
    if (space.bavail * space.bsize < sourceStat.size * 1.1) return { success: false, error: 'Недостаточно места для проверяемой копии' };
    await fs.promises.copyFile(sourceFile, tempPath, fs.constants.COPYFILE_EXCL);
    const processesAfterCopy = await listProcesses().catch(() => null);
    if (processesAfterCopy === null) throw new Error('Не удалось повторно проверить процессы 1С. Непроверенная копия удалена');
    if (processesAfterCopy.length > 0) {
      throw new Error(`Во время копирования была запущена 1С: ${processesAfterCopy.map(item => item.name).join(', ')}`);
    }
    const sizeBytes = await verifyExactCopy(sourceFile, tempPath);
    const sourceStatAfterCopy = await fs.promises.stat(sourceFile);
    if (
      sourceStatAfterCopy.size !== sourceStat.size
      || sourceStatAfterCopy.mtimeMs !== sourceStat.mtimeMs
      || sourceStatAfterCopy.ctimeMs !== sourceStat.ctimeMs
    ) {
      throw new Error('Рабочая база изменилась во время копирования. Непроверенная копия удалена');
    }
    await fs.promises.rename(tempPath, destPath);
    tempPath = '';
    return { success: true, destPath, sizeBytes };
  } catch (e) {
    if (tempPath) await fs.promises.unlink(tempPath).catch(() => undefined);
    return { success: false, error: (e as Error).message };
  }
}

export type AutomaticBackupSlot = 'daily' | 'weekly' | 'monthly';
type RotationManifest = { sourceFile: string; slots: Partial<Record<AutomaticBackupSlot, string>> };

function rotationManifestPath(sourceFile: string, destDir: string): string {
  const id = createHash('sha256').update(path.resolve(sourceFile)).digest('hex').slice(0, 12);
  return path.join(destDir, `.bx-onec-rotation-${id}.json`);
}

export async function backupDatabaseRotated(
  sourceFile: string,
  destDir: string,
  slots: AutomaticBackupSlot[],
): Promise<BackupResult> {
  const result = await backupDatabase(sourceFile, destDir);
  if (!result.success || !result.destPath) return result;
  const manifestPath = rotationManifestPath(sourceFile, destDir);
  let manifest: RotationManifest = { sourceFile: path.resolve(sourceFile), slots: {} };
  try {
    manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8')) as RotationManifest;
  } catch { /* first automatic copy */ }
  const oldPaths = new Set(Object.values(manifest.slots).filter((value): value is string => Boolean(value)));
  for (const slot of slots) manifest.slots[slot] = result.destPath;
  const referenced = new Set(Object.values(manifest.slots).filter((value): value is string => Boolean(value)));
  const tempManifest = `${manifestPath}.partial-${crypto.randomUUID()}`;
  await fs.promises.writeFile(tempManifest, JSON.stringify(manifest, null, 2), { encoding: 'utf8', flag: 'wx' });
  await fs.promises.rename(tempManifest, manifestPath);
  for (const oldPath of oldPaths) {
    if (!referenced.has(oldPath) && path.dirname(oldPath) === path.resolve(destDir)) {
      await fs.promises.unlink(oldPath).catch(() => undefined);
    }
  }
  return result;
}
