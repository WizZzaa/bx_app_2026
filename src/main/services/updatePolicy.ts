export const UPDATE_REPOSITORY = 'WizZzaa/bx_app_2026'
export const UPDATE_HOST = 'https://update.electronjs.org'

export type UpdateStatus = 'idle' | 'checking' | 'latest' | 'downloading' | 'ready' | 'error'
export type UpdateMode = 'automatic' | 'manual' | 'unsupported'

export interface UpdateSnapshot {
  status: UpdateStatus
  error: string
  version: string
  availableVersion: string
  mode: UpdateMode
}

export const buildUpdateFeedUrl = (
  version: string,
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch,
): string => `${UPDATE_HOST}/${UPDATE_REPOSITORY}/${platform}-${arch}/${version}`

/** SemVer comparison for the public GitHub fallback used by unsigned macOS builds. */
export const isNewerVersion = (candidate: string, current: string): boolean => {
  const parse = (value: string) => value.replace(/^v/, '').split('.').map(part => Number.parseInt(part, 10) || 0)
  const left = parse(candidate)
  const right = parse(current)
  const length = Math.max(left.length, right.length, 3)

  for (let index = 0; index < length; index += 1) {
    if ((left[index] || 0) > (right[index] || 0)) return true
    if ((left[index] || 0) < (right[index] || 0)) return false
  }
  return false
}
