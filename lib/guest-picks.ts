const MAX_AGE = 365 * 24 * 60 * 60 // 1 year

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)};max-age=${MAX_AGE};path=/;SameSite=Lax`
}

export function getGuestId(): string {
  const existing = getCookie('guest-id')
  if (existing) return existing
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
  setCookie('guest-id', id)
  return id
}

export function getGuestPicks(eventId: string): string[] {
  const val = getCookie(`event-picks-${eventId}`)
  if (!val) return []
  return val.split(',').filter(Boolean)
}

export function toggleGuestPick(eventId: string, performanceId: string): string[] {
  const picks = getGuestPicks(eventId)
  const next = picks.includes(performanceId)
    ? picks.filter((id) => id !== performanceId)
    : [...picks, performanceId]
  setCookie(`event-picks-${eventId}`, next.join(','))
  return next
}
