/** Backend admin base path. Default matches Vite proxy: `/api` → `http://localhost:4400`. */
export const ADMIN_API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? '/api/admin'

export const ACCESS_TOKEN_STORAGE_KEY = 'medcoin_admin_token'

/** Origin for static assets (uploads) — strips `/api/admin` from full API URL. */
export function apiAssetOrigin(): string {
  const base = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  if (base.startsWith('http')) {
    return base.replace(/\/api\/admin\/?$/i, '')
  }
  return ''
}

export function resolveProfilePicUrl(profilePic?: string | null): string | undefined {
  const p = String(profilePic || '').trim()
  if (!p) return undefined
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:')) {
    return p
  }
  const origin = apiAssetOrigin()
  const path = p.startsWith('/') ? p : `/${p}`
  return origin ? `${origin.replace(/\/$/, '')}${path}` : path
}
