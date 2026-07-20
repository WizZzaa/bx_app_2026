import { supabase } from '../db/supabase'

const INSTALLATION_KEY = 'bx_installation_token_v1'

export type DeviceRegistrationStatus = 'trusted' | 'revoked' | 'limit_exceeded' | 'ephemeral_denied' | 'error'
export interface RegisteredDevice { id: string; label: string; platform: string; trustedAt: string; lastSeenAt: string; revokedAt: string | null; current: boolean }

export function getInstallationToken(): { token: string; ephemeral: boolean } {
  try {
    let token = localStorage.getItem(INSTALLATION_KEY)
    if (!token) {
      token = `${crypto.randomUUID()}-${crypto.randomUUID()}`
      localStorage.setItem(INSTALLATION_KEY, token)
    }
    return { token, ephemeral: localStorage.getItem(INSTALLATION_KEY) !== token }
  } catch {
    return { token: `${crypto.randomUUID()}-${crypto.randomUUID()}`, ephemeral: true }
  }
}

function platform(): 'windows' | 'macos' | 'linux' | 'web' | 'unknown' {
  const value = navigator.userAgent.toLowerCase()
  if (value.includes('windows')) return 'windows'
  if (value.includes('mac os')) return 'macos'
  if (value.includes('linux')) return 'linux'
  return window.bx ? 'unknown' : 'web'
}

export async function registerCurrentDevice() {
  const installation = getInstallationToken()
  const detected = platform()
  const label = `${window.bx ? 'BX Desktop' : 'BX Web'} · ${detected === 'macos' ? 'macOS' : detected === 'windows' ? 'Windows' : detected}`
  const { data, error } = await supabase.rpc('bx_register_device', {
    p_installation_token: installation.token,
    p_label: label,
    p_platform: detected,
    p_ephemeral: installation.ephemeral,
  })
  if (error) return { status: 'error' as const, message: error.message }
  return data as { status: DeviceRegistrationStatus; deviceId?: string; limit?: number; active?: number }
}

export async function listMyDevices(): Promise<RegisteredDevice[]> {
  const { token } = getInstallationToken()
  const { data, error } = await supabase.rpc('bx_list_my_devices', { p_installation_token: token })
  if (error) throw error
  if (!Array.isArray(data)) throw new Error('INVALID_DEVICE_LIST')
  return data as RegisteredDevice[]
}

export async function revokeDevice(id: string): Promise<void> {
  const { error } = await supabase.rpc('bx_revoke_device', { p_device_id: id })
  if (error) throw error
}
