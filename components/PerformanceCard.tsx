'use client'

import { Performance, Plan, Member } from '@/lib/types'

interface PerformanceCardProps {
  performance: Performance
  plans: (Plan & { members: Member })[]
  isMine: boolean
  stageColor?: string | null
  timezone: string
  onToggle: () => void
}

const MEMBER_COLORS = [
  'bg-violet-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-teal-500',
]

function MemberDot({ name, colorClass }: { name: string; colorClass: string }) {
  return (
    <span
      title={name}
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold text-white ${colorClass} ring-1 ring-background`}
    >
      {name[0].toUpperCase()}
    </span>
  )
}

function formatStartLabel(iso: string, tz: string) {
  const d = new Date(iso)
  const weekday = d.toLocaleDateString('en-GB', { timeZone: tz, weekday: 'short' })
  const time = d.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' })
  return `${weekday} · ${time}`
}

function formatDuration(start: string, end: string) {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

export function PerformanceCard({ performance, plans, isMine, stageColor, timezone, onToggle }: PerformanceCardProps) {
  const durationMin = Math.round(
    (new Date(performance.end_time).getTime() - new Date(performance.start_time).getTime()) / 60000
  )
  const compact = durationMin < 35

  const colorStyle = stageColor
    ? {
        backgroundColor: isMine ? `${stageColor}40` : `${stageColor}1a`,
        borderColor: isMine ? stageColor : `${stageColor}60`,
        boxShadow: isMine ? `0 0 0 2px ${stageColor}50` : undefined,
      }
    : undefined

  const fallbackClass = isMine
    ? 'bg-primary/20 border-primary hover:bg-primary/30'
    : 'bg-muted/60 border-border hover:bg-muted hover:border-border/80'

  return (
    <button
      onClick={onToggle}
      className={`w-full h-full rounded-xl border text-left px-2 py-1.5 overflow-hidden transition-all hover:brightness-105 ${
        stageColor ? '' : fallbackClass
      }`}
      style={colorStyle}
    >
      <div className={`font-semibold text-foreground truncate ${compact ? 'text-xs' : 'text-sm'}`}>
        {performance.artist}
      </div>
      {!compact && (
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {formatStartLabel(performance.start_time, timezone)} · {formatDuration(performance.start_time, performance.end_time)}
        </div>
      )}
      {plans.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-1">
          {plans.slice(0, 6).map((plan, i) => (
            <MemberDot
              key={plan.id}
              name={plan.members.name}
              colorClass={MEMBER_COLORS[i % MEMBER_COLORS.length]}
            />
          ))}
          {plans.length > 6 && (
            <span className="text-[9px] text-muted-foreground ml-0.5 self-center">+{plans.length - 6}</span>
          )}
        </div>
      )}
    </button>
  )
}
