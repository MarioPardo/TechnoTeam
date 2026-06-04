const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateGroupCode(): string {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}
