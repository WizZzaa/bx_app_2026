import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ProcessEntry, KillResult } from '../../shared/types';
import { ONEC_PROCESS_NAMES } from '../../shared/types';

const execFileAsync = promisify(execFile);

/**
 * List running 1С processes. Uses `tasklist` on Windows and `ps` elsewhere
 * (the non-Windows branch is mostly for development on macOS/Linux — it will
 * simply find nothing real, but keeps the UI testable).
 */
export async function listProcesses(): Promise<ProcessEntry[]> {
  if (process.platform === 'win32') {
    return listProcessesWindows();
  }
  return listProcessesUnix();
}

async function listProcessesWindows(): Promise<ProcessEntry[]> {
  // CSV output: "Image Name","PID","Session Name","Session#","Mem Usage"
  const { stdout } = await execFileAsync('tasklist', ['/FO', 'CSV', '/NH']);
  const entries: ProcessEntry[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols = line.split('","').map(c => c.replace(/^"|"$/g, ''));
    if (cols.length < 5) continue;
    const name = cols[0].toLowerCase();
    if (!ONEC_PROCESS_NAMES.includes(name)) continue;
    const pid = parseInt(cols[1], 10);
    // Mem usage like "12,345 K"
    const memKb = parseInt(cols[4].replace(/[^\d]/g, ''), 10) || 0;
    entries.push({ pid, name: cols[0], memoryBytes: memKb * 1024 });
  }
  return entries;
}

async function listProcessesUnix(): Promise<ProcessEntry[]> {
  try {
    const { stdout } = await execFileAsync('ps', ['-axo', 'pid,rss,comm']);
    const entries: ProcessEntry[] = [];
    for (const line of stdout.split('\n').slice(1)) {
      const m = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/);
      if (!m) continue;
      const comm = m[3].toLowerCase();
      // On dev machines there are no 1cv8 processes; match loosely for testing.
      if (!comm.includes('1cv8')) continue;
      entries.push({ pid: parseInt(m[1], 10), name: m[3], memoryBytes: parseInt(m[2], 10) * 1024 });
    }
    return entries;
  } catch {
    return [];
  }
}

export async function killProcesses(pids: number[]): Promise<KillResult> {
  const killed: number[] = [];
  const failed: { pid: number; error: string }[] = [];

  for (const pid of pids) {
    try {
      if (process.platform === 'win32') {
        await execFileAsync('taskkill', ['/PID', String(pid), '/F']);
      } else {
        process.kill(pid, 'SIGKILL');
      }
      killed.push(pid);
    } catch (e) {
      failed.push({ pid, error: (e as Error).message });
    }
  }

  return { killed, failed };
}
