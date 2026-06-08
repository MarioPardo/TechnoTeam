export const MEMBER_COLOR_PALETTE = [
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#f97316', // orange
  '#f43f5e', // rose
  '#14b8a6', // teal
] as const

export function isMemberColor(value: string): boolean {
  return (MEMBER_COLOR_PALETTE as readonly string[]).includes(value)
}

/**
 * Picks a random color for a member, preferring one that isn't already used by
 * another member whose name starts with the same letter — since avatars show
 * just that initial, same-letter members sharing a color are easy to mix up.
 * Falls back to the full palette once every option is taken.
 */
export function pickMemberColor(name: string, existingMembers: { name: string; color: string | null }[]): string {
  const firstLetter = name.trim().charAt(0).toLowerCase()
  const takenBySameLetter = new Set(
    existingMembers
      .filter((m) => m.color && m.name.trim().charAt(0).toLowerCase() === firstLetter)
      .map((m) => m.color as string)
  )

  const available = MEMBER_COLOR_PALETTE.filter((c) => !takenBySameLetter.has(c))
  const pool = available.length > 0 ? available : MEMBER_COLOR_PALETTE
  return pool[Math.floor(Math.random() * pool.length)]
}
