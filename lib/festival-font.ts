import type { CSSProperties } from 'react'

export const FESTIVAL_FONTS = [
  { key: 'default',    label: 'Jakarta Sans', cssVar: '--font-sans' },
  { key: 'grotesk',   label: 'Space Grotesk', cssVar: '--font-grotesk' },
  { key: 'bebas',     label: 'Bebas Neue',    cssVar: '--font-bebas' },
  { key: 'raleway',   label: 'Raleway',       cssVar: '--font-raleway' },
  { key: 'oswald',    label: 'Oswald',        cssVar: '--font-oswald' },
  { key: 'unbounded', label: 'Unbounded',     cssVar: '--font-unbounded' },
  { key: 'righteous', label: 'Righteous',     cssVar: '--font-righteous' },
] as const

export type FestivalFontKey = typeof FESTIVAL_FONTS[number]['key']

export function getFontStyle(fontKey: string | null | undefined): CSSProperties {
  const font = FESTIVAL_FONTS.find((f) => f.key === fontKey) ?? FESTIVAL_FONTS[0]
  return { fontFamily: `var(${font.cssVar})` }
}

export function formatEventDates(dateStart: string, dateEnd: string): string {
  const s = new Date(dateStart + 'T00:00:00Z')
  const e = new Date(dateEnd + 'T00:00:00Z')
  const sDay = s.getUTCDate()
  const eDay = e.getUTCDate()
  const sMonth = s.toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'short' })
  const eMonth = e.toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'short' })
  const year = e.getUTCFullYear()

  if (dateStart === dateEnd) return `${sDay} ${sMonth} ${year}`
  if (sMonth === eMonth) return `${sDay}–${eDay} ${sMonth} ${year}`
  return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${year}`
}
