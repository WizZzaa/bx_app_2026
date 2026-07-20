// Единое хранилище безопасных метаданных сертификатов ЭЦП.
// Файлы ключей и пароли сюда никогда не попадают. В Electron метаданные
// шифруются через safeStorage ОС (мост window.bx.safe);
// в веб-версии, где моста нет, остаётся открытый localStorage-фолбэк.
// При первом чтении в Electron открытые записи мигрируются в зашифрованные.

import { logger } from './logger';

const STORAGE_KEY = 'bx_ecp_keys';
const ENC_STORAGE_KEY = 'bx_ecp_keys_enc';

export interface EcpKeyRecord {
  id: string;
  name: string;
  owner: string;
  inn: string;
  expiresAt: string;
  addedAt: string;
  org?: string;
  serial?: string;
  fingerprint?: string;
  validFrom?: string;
}

type SafeBridge = {
  isAvailable(): Promise<boolean>;
  encrypt(plainText: string): Promise<string>;
  decrypt(encryptedHex: string): Promise<string>;
};

function getSafe(): SafeBridge | null {
  const bx = (window as unknown as { bx?: { safe?: SafeBridge } }).bx;
  return bx?.safe ?? null;
}

export async function loadEcpKeys(): Promise<EcpKeyRecord[]> {
  const safe = getSafe();
  try {
    if (safe && await safe.isAvailable()) {
      const enc = localStorage.getItem(ENC_STORAGE_KEY);
      if (enc) return JSON.parse(await safe.decrypt(enc));
      // Миграция: перенести записи из открытого хранилища в зашифрованное
      const plain = localStorage.getItem(STORAGE_KEY);
      if (plain) {
        const keys = JSON.parse(plain);
        localStorage.setItem(ENC_STORAGE_KEY, await safe.encrypt(plain));
        localStorage.removeItem(STORAGE_KEY);
        return keys;
      }
      return [];
    }
  } catch (err) {
    logger.warn('ecpStorage', 'Не удалось расшифровать метаданные сертификатов ЭЦП, читаю открытое хранилище', err);
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (err) {
    logger.warn('ecpStorage', 'Повреждено хранилище метаданных сертификатов ЭЦП, возвращаю пустой список', err);
    return [];
  }
}

export async function saveEcpKeys(keys: EcpKeyRecord[]): Promise<void> {
  const json = JSON.stringify(keys);
  const safe = getSafe();
  try {
    if (safe && await safe.isAvailable()) {
      localStorage.setItem(ENC_STORAGE_KEY, await safe.encrypt(json));
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
  } catch (err) {
    logger.warn('ecpStorage', 'Шифрование недоступно, метаданные сертификатов ЭЦП сохраняются локально в открытом виде', err);
  }
  localStorage.setItem(STORAGE_KEY, json);
}
