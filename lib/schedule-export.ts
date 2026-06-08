import { Performance } from '@/lib/types'

export type ExportEntry = {
  performance: Performance
  stageName: string
  stageColor: string | null
}

export type ScheduleRow = ExportEntry[]

function toMinutes(iso: string): number {
  return new Date(iso).getTime() / 60000
}

export function formatTimeRange(start: string, end: string, timezone: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })
  return `${fmt(start)}–${fmt(end)}`
}

const MAX_PER_ROW = 2

/**
 * Groups entries into chronological rows (ordered by start time), placing
 * picks that overlap in time side by side — mirroring LineupGrid's
 * "concurrent picks together" arrangement — but capped at two per row so
 * bubbles stay readable; a third overlapping pick simply starts the next row.
 * Unlike the live timeline, rows are packed back to back rather than spaced
 * by elapsed time: each bubble carries its own time range, so the exported
 * image stays short even when someone's day has long gaps between sets.
 */
export function buildScheduleRows(entries: ExportEntry[]): ScheduleRow[] {
  const sorted = [...entries].sort(
    (a, b) => toMinutes(a.performance.start_time) - toMinutes(b.performance.start_time),
  )

  const rows: ScheduleRow[] = []
  let current: ExportEntry[] = []
  let currentEnd = -Infinity
  for (const entry of sorted) {
    const start = toMinutes(entry.performance.start_time)
    const end = toMinutes(entry.performance.end_time)
    if (current.length > 0 && (current.length >= MAX_PER_ROW || start >= currentEnd)) {
      rows.push(current)
      current = []
      currentEnd = -Infinity
    }
    current.push(entry)
    currentEnd = Math.max(currentEnd, end)
  }
  if (current.length > 0) rows.push(current)

  return rows
}
