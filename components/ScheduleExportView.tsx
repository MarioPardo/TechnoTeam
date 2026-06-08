import { useMemo } from 'react'
import { ExportEntry, buildScheduleRows, formatTimeRange } from '@/lib/schedule-export'

export type ExportOrientation = 'portrait' | 'landscape'

interface ScheduleExportViewProps {
  ref?: React.Ref<HTMLDivElement>
  memberName?: string
  dayLabel: string
  logoUrl?: string | null
  entries: ExportEntry[]
  timezone: string
  orientation?: ExportOrientation
}

export const EXPORT_WIDTH = 340

// width / height — keeps the export shaped like a phone screen so it slots
// naturally into stories/wallpapers; landscape just flips the ratio and can
// gain its own width once there's a layout that suits a wider canvas.
const ORIENTATION_RATIOS: Record<ExportOrientation, number> = {
  portrait: 9 / 19.5,
  landscape: 19.5 / 9,
}

const COLORS = {
  card: '#16161a',
  text: '#f5f5f7',
  subtext: '#c2c2c8',
  faint: '#9a9aa3',
  entryBg: '#202024',
  accentFallback: '#8b8b93',
}

function EntryBubble({ entry, timezone }: { entry: ExportEntry; timezone: string }) {
  const accent = entry.stageColor ?? COLORS.accentFallback

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        minWidth: 0,
        padding: '8px 10px',
        borderRadius: 10,
        backgroundColor: COLORS.entryBg,
      }}
    >
      <span style={{ width: 9, height: 9, marginTop: 4, borderRadius: 999, backgroundColor: accent, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.3,
            color: COLORS.text,
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {entry.performance.artist}
        </div>
        <div style={{ fontSize: 10, lineHeight: 1.3, color: COLORS.faint, marginTop: 2, whiteSpace: 'nowrap' }}>
          {formatTimeRange(entry.performance.start_time, entry.performance.end_time, timezone)}
        </div>
      </div>
    </div>
  )
}

/**
 * Fixed-width, theme-independent layout used both as the live preview and as
 * the node captured into the exported PNG — explicit colors keep the two in
 * sync and avoid relying on the app's OKLCH design tokens (which some image
 * capture libraries can't parse).
 *
 * Mirrors LineupGrid's "concurrent picks side by side" arrangement, but packs
 * rows back to back (rather than spacing them by elapsed time) and prints
 * each pick's own time range on its bubble — keeping the image short and
 * phone-shaped regardless of how spread out someone's day is.
 */
export function ScheduleExportView({ ref, memberName, dayLabel, logoUrl, entries, timezone, orientation = 'portrait' }: ScheduleExportViewProps) {
  const rows = useMemo(() => buildScheduleRows(entries), [entries])
  const minHeight = EXPORT_WIDTH / ORIENTATION_RATIOS[orientation]

  return (
    <div
      ref={ref}
      style={{
        width: EXPORT_WIDTH,
        minHeight,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.card,
        color: COLORS.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faint, whiteSpace: 'nowrap' }}>
            {memberName ? `${memberName}'s Schedule` : 'My Schedule'}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, whiteSpace: 'nowrap' }}>
            {dayLabel}
          </span>
        </div>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.06)', flexShrink: 0 }}
          />
        )}
      </div>

      {rows.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 18px 28px', textAlign: 'center', fontSize: 13, color: COLORS.faint }}>
          No sets planned for this day yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 14px 22px' }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              {row.map((entry) => (
                <div key={entry.performance.id} style={{ flex: '1 1 0%', minWidth: 0 }}>
                  <EntryBubble entry={entry} timezone={timezone} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
