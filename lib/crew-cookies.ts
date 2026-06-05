const COOKIE_KEY = 'festival-crews'
const MAX_AGE = 365 * 24 * 60 * 60 // 1 year

export function getCrewCodes(): string[] {
  if (typeof document === 'undefined') return []
  const match = document.cookie.match(/(?:^|; )festival-crews=([^;]*)/)
  if (!match || !match[1]) return []
  return decodeURIComponent(match[1]).split(',').filter(Boolean)
}

export function addCrewCode(code: string): void {
  migrateFromLocalStorage()
  const codes = getCrewCodes()
  if (codes.includes(code)) return
  codes.push(code)
  writeCookie(codes)
}

export function removeCrewCode(code: string): void {
  const codes = getCrewCodes().filter((c) => c !== code)
  writeCookie(codes)
}

function writeCookie(codes: string[]): void {
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(codes.join(','))};max-age=${MAX_AGE};path=/;SameSite=Lax`
}

// One-time migration from the old localStorage key
function migrateFromLocalStorage(): void {
  const OLD_KEY = 'festival-my-groups'
  try {
    const raw = localStorage.getItem(OLD_KEY)
    if (!raw) return
    const old: string[] = JSON.parse(raw)
    const existing = getCrewCodes()
    const merged = Array.from(new Set([...existing, ...old]))
    writeCookie(merged)
    localStorage.removeItem(OLD_KEY)
  } catch {
    // ignore
  }
}
