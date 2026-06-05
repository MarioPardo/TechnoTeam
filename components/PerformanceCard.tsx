'use client'

import { useEffect, useState } from 'react'
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

function toVisibleLightColor(hex: string): string {
  const c = hex.replace('#', '')
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.85 ? '#888888' : hex
}

export function PerformanceCard({ performance, plans, isMine, stageColor, timezone, onToggle }: PerformanceCardProps) {
  const [hovered, setHovered] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const el = document.documentElement
    setIsDark(el.classList.contains('dark'))
    const observer = new MutationObserver(() => setIsDark(el.classList.contains('dark')))
    observer.observe(el, { attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const durationMin = Math.round(
    (new Date(performance.end_time).getTime() - new Date(performance.start_time).getTime()) / 60000
  )
  const compact = durationMin < 35

  const effectiveColor = stageColor ? (!isDark ? toVisibleLightColor(stageColor) : stageColor) : null

  const colorStyle = effectiveColor
    ? {
        backgroundColor: isMine
          ? `${effectiveColor}${isDark ? '55' : 'bb'}`
          : `${effectiveColor}${isDark ? '28' : '66'}`,
        borderColor: isMine ? effectiveColor : `${effectiveColor}${isDark ? '66' : 'bb'}`,
        boxShadow: isMine ? `0 0 0 2px ${effectiveColor}60` : undefined,
      }
    : undefined

  const fallbackClass = isMine
    ? 'bg-primary/20 border-primary hover:bg-primary/30'
    : 'bg-muted/60 border-border hover:bg-muted hover:border-border/80'

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && plans.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[200] pointer-events-none">
          <div className="bg-popover border border-border rounded-xl shadow-lg px-3 py-2.5 min-w-[120px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Interested
            </p>
            <div className="flex flex-col gap-1.5">
              {plans.map((plan, i) => (
                <div key={plan.id} className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    className={`w-4 h-4 rounded-full text-[8px] font-bold text-white inline-flex items-center justify-center shrink-0 ${MEMBER_COLORS[i % MEMBER_COLORS.length]}`}
                  >
                    {plan.members.name[0].toUpperCase()}
                  </span>
                  <span className="text-xs text-foreground">{plan.members.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onToggle}
        className={`w-full h-full rounded-xl border text-left px-2 py-1.5 overflow-hidden transition-all hover:brightness-105 ${
          stageColor ? '' : fallbackClass
        }`}
        style={colorStyle}
      >
        <div className={`font-semibold text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
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
    </div>
  )
}
