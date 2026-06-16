'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Performance, Stage, Member, Plan } from '@/lib/types'
import { SunDay } from '@/lib/sun-times'
import { PerformanceCard } from './PerformanceCard'
import { ScheduleExportDialog } from './ScheduleExportDialog'
import { ExportEntry } from '@/lib/schedule-export'
import { Button } from '@/components/ui/button'
import { ImageDownIcon, ArrowUp, ArrowDown } from 'lucide-react'

type StageWithPerfs = Stage & { performances: Performance[] }

interface LineupGridProps {
  stages: StageWithPerfs[]
  plans: (Plan & { members: Member })[]
  currentMemberId: string
  memberName?: string
  logoUrl?: string | null
  timezone: string
  sunTimes?: SunDay[]
  guestMode?: boolean
  dayLabels?: Record<string, string>
  onToggle: (performanceId: string) => void
}

const PX_PER_MIN = 2

function toMinutes(iso: string): number {
  return new Date(iso).getTime() / 60000
}

function toDateKey(iso: string, tz: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz })
}

type TimeMarker = { label: string; offset: number; isHour: boolean }

function buildTimeMarkers(minSlot: number, maxSlot: number, tz: string): TimeMarker[] {
  const markers: TimeMarker[] = []
  for (let t = minSlot; t <= maxSlot; t += 30) {
    const label = new Date(t * 60000).toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' })
    markers.push({
      label,
      offset: (t - minSlot) * PX_PER_MIN,
      isHour: label.endsWith(':00'),
    })
  }
  return markers
}

export function LineupGrid({ stages, plans, currentMemberId, memberName, logoUrl, timezone, sunTimes, guestMode = false, dayLabels = {}, onToggle }: LineupGridProps) {
  const allPerfs = stages.flatMap((s) => s.performances)

  const tzAbbr = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value ?? timezone
  }, [timezone])

  const days = useMemo(() => {
    const keyToDisplay = new Map<string, { label: string; shortLabel: string }>()
    for (const perf of allPerfs) {
      const key = toDateKey(perf.start_time, timezone)
      if (!keyToDisplay.has(key)) {
        const date = new Date(perf.start_time)
        const custom = dayLabels[key]
        keyToDisplay.set(key, {
          label: custom ?? date.toLocaleDateString('en-GB', { timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long' }),
          shortLabel: custom ?? date.toLocaleDateString('en-GB', { timeZone: timezone, day: 'numeric', month: 'long' }),
        })
      }
    }
    // Merge date keys that share the same label (e.g. midnight-crossing nights with a custom day name)
    const labelGroups = new Map<string, { dateKeys: string[]; shortLabel: string }>()
    for (const [key, { label, shortLabel }] of keyToDisplay) {
      if (!labelGroups.has(label)) labelGroups.set(label, { dateKeys: [], shortLabel })
      labelGroups.get(label)!.dateKeys.push(key)
    }
    return Array.from(labelGroups.entries())
      .map(([label, { dateKeys, shortLabel }]) => ({
        key: dateKeys.sort()[0],
        dateKeys: dateKeys.sort(),
        label,
        shortLabel,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [allPerfs, timezone, dayLabels])

  const [viewMode, setViewMode] = useState<'group' | 'mine'>('group')
  const [exportOpen, setExportOpen] = useState(false)

  const [selectedDay, setSelectedDay] = useState<string>('')
  const activeDay = days.find((d) => d.key === selectedDay)?.key ?? days[0]?.key ?? ''

  const [stageOrder, setStageOrder] = useState<string[]>(() => stages.map((s) => s.id))
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  useEffect(() => {
    setStageOrder((prev) => {
      const ids = stages.map((s) => s.id)
      const kept = prev.filter((id) => ids.includes(id))
      const added = ids.filter((id) => !prev.includes(id))
      return [...kept, ...added]
    })
  }, [stages])

  const orderedStages = useMemo(
    () => stageOrder.map((id) => stages.find((s) => s.id === id)).filter(Boolean) as StageWithPerfs[],
    [stageOrder, stages],
  )

  function handleColumnDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (id !== draggedId) setDragOverId(id)
  }

  function handleColumnDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }
    setStageOrder((prev) => {
      const next = [...prev]
      const from = next.indexOf(draggedId)
      const to = next.indexOf(targetId)
      next.splice(from, 1)
      next.splice(to, 0, draggedId)
      return next
    })
    setDraggedId(null)
    setDragOverId(null)
  }

  const filteredStages = useMemo(() => {
    const activeDayEntry = days.find((d) => d.key === activeDay)
    const activeDateKeys = new Set(activeDayEntry?.dateKeys ?? [activeDay])
    return orderedStages
      .map((stage) => ({
        ...stage,
        performances: stage.performances.filter((perf) => {
          if (!activeDateKeys.has(toDateKey(perf.start_time, timezone))) return false
          if (viewMode === 'mine') {
            return plans.some((p) => p.performance_id === perf.id && p.member_id === currentMemberId)
          }
          return true
        }),
      }))
      .filter((stage) => stage.performances.length > 0)
  }, [orderedStages, days, activeDay, timezone, viewMode, plans, currentMemberId])

  const exportEntries = useMemo<ExportEntry[]>(
    () =>
      filteredStages.flatMap((stage) =>
        stage.performances.map((perf) => ({
          performance: perf,
          stageName: stage.name,
          stageColor: stage.color,
        })),
      ),
    [filteredStages],
  )

  const { minTime, totalHeight, timeMarkers } = useMemo(() => {
    const dayPerfs = filteredStages.flatMap((s) => s.performances)
    if (dayPerfs.length === 0) return { minTime: 0, totalHeight: 0, timeMarkers: [] }

    const min = Math.min(...dayPerfs.map((p) => toMinutes(p.start_time)))
    const max = Math.max(...dayPerfs.map((p) => toMinutes(p.end_time)))
    const minSlot = Math.floor(min / 30) * 30
    const maxSlot = Math.ceil(max / 30) * 30

    return {
      minTime: minSlot,
      totalHeight: (maxSlot - minSlot) * PX_PER_MIN,
      timeMarkers: buildTimeMarkers(minSlot, maxSlot, timezone),
    }
  }, [filteredStages, timezone])

  const sunMarkers = useMemo(() => {
    if (!sunTimes || minTime === 0) return []
    const dayTimes = sunTimes.find((d) => d.dateKey === activeDay)
    if (!dayTimes) return []
    const markers: { type: 'sunrise' | 'sunset'; offset: number }[] = []
    const riseOffset = (dayTimes.sunriseMinutes - minTime) * PX_PER_MIN
    if (riseOffset >= 0 && riseOffset <= totalHeight) {
      markers.push({ type: 'sunrise', offset: riseOffset })
    }
    const setOffset = (dayTimes.sunsetMinutes - minTime) * PX_PER_MIN
    if (setOffset >= 0 && setOffset <= totalHeight) {
      markers.push({ type: 'sunset', offset: setOffset })
    }
    return markers
  }, [sunTimes, activeDay, minTime, totalHeight])

  if (allPerfs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20">
        No lineup added yet. Ask the organiser to add stages and sets.
      </div>
    )
  }

  const dayPerfs = filteredStages.flatMap((s) => s.performances)

  return (
    <div>
      {/* View mode tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('group')}
          className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
            viewMode === 'group'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          {guestMode ? 'All View' : 'Group View'}
        </button>
        <button
          onClick={() => setViewMode('mine')}
          className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
            viewMode === 'mine'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          My Schedule
        </button>
      </div>

      {/* Day tabs */}
      {days.length > 0 && (
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <div className="flex gap-2 flex-wrap">
            {days.map((day) => (
              <button
                key={day.key}
                onClick={() => setSelectedDay(day.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                  activeDay === day.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          {viewMode === 'mine' && dayPerfs.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setExportOpen(true)}>
              <ImageDownIcon className="size-3.5" />
              Export as picture
            </Button>
          )}
        </div>
      )}

      {dayPerfs.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          {viewMode === 'mine'
            ? "You haven't selected any sets for this day yet. Switch to Group View and tap a set to add it."
            : `No sets scheduled for ${days.find((d) => d.key === activeDay)?.label ?? 'this day'}.`}
        </div>
      ) : (
        <div>
          {/* Stage name headers */}
          <div className="flex min-w-full sticky top-0 z-20 bg-background border-b border-border">
            <div className="w-28 shrink-0 flex items-end justify-center pb-2">
              <span className="text-[10px] text-muted-foreground/60 font-medium">{tzAbbr}</span>
            </div>
            {orderedStages.map((stage) => (
              <div
                key={stage.id}
                draggable
                onDragStart={() => setDraggedId(stage.id)}
                onDragOver={(e) => handleColumnDragOver(e, stage.id)}
                onDrop={() => handleColumnDrop(stage.id)}
                onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
                className={`flex-1 min-w-[180px] px-3 py-2.5 text-xl font-semibold text-foreground border-l border-border flex items-center justify-center gap-1.5 cursor-grab select-none transition-opacity ${
                  draggedId === stage.id ? 'opacity-40' : dragOverId === stage.id ? 'bg-muted/60' : ''
                }`}
                style={stage.color ? { borderBottom: `3px solid ${stage.color}` } : {}}
              >
                {stage.color && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                )}
                <span className="text-center">{stage.name}</span>
              </div>
            ))}
          </div>

          {/* Timeline body */}
          <div className="flex min-w-full pt-4">
            {/* Time ruler */}
            <div className="w-28 shrink-0 relative" style={{ height: totalHeight }}>
              {timeMarkers.map((m) => (
                <div
                  key={m.offset}
                  className={`absolute right-3 leading-none -translate-y-1/2 ${
                    m.isHour ? 'text-xs text-muted-foreground' : 'text-[10px] text-muted-foreground/50'
                  }`}
                  style={{ top: m.offset }}
                >
                  {m.label}
                </div>
              ))}
              {sunMarkers.map((m) => (
                <div
                  key={m.type}
                  className="absolute left-1.5 right-0 flex items-center gap-1 -translate-y-1/2"
                  style={{ top: m.offset }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/${m.type}_icon.png`} alt={m.type} className="w-8 h-8 shrink-0" />
                  {m.type === 'sunrise'
                    ? <ArrowUp className="w-3 h-3 shrink-0" style={{ color: 'rgb(252,198,89)' }} />
                    : <ArrowDown className="w-3 h-3 shrink-0" style={{ color: 'rgb(252,198,89)' }} />
                  }
                  <div className="flex-1 h-0 ml-1" style={{ borderTop: '2px dashed rgba(252,198,89,0.8)' }} />
                </div>
              ))}
            </div>

            {/* Stage columns */}
            {filteredStages.map((stage) => (
              <div
                key={stage.id}
                className="relative flex-1 min-w-[180px] border-l border-border"
                style={{ height: totalHeight }}
              >
                {timeMarkers.map((m) => (
                  <div
                    key={m.offset}
                    className={`absolute left-0 right-0 border-t ${
                      m.isHour ? 'border-border/60' : 'border-border/30'
                    }`}
                    style={{ top: m.offset }}
                  />
                ))}
                {stage.performances.map((perf) => {
                  const top = (toMinutes(perf.start_time) - minTime) * PX_PER_MIN
                  const height =
                    (toMinutes(perf.end_time) - toMinutes(perf.start_time)) * PX_PER_MIN
                  const perfPlans = plans.filter((p) => p.performance_id === perf.id)
                  const isMine = perfPlans.some((p) => p.member_id === currentMemberId)

                  return (
                    <div
                      key={perf.id}
                      className="absolute left-1 right-1"
                      style={{ top, height }}
                    >
                      <PerformanceCard
                        performance={perf}
                        plans={perfPlans}
                        isMine={isMine}
                        stageColor={stage.color}
                        timezone={timezone}
                        onToggle={() => onToggle(perf.id)}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <ScheduleExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        memberName={guestMode ? undefined : memberName}
        logoUrl={logoUrl}
        dayKey={activeDay}
        dayLabel={days.find((d) => d.key === activeDay)?.label ?? ''}
        dayShortLabel={days.find((d) => d.key === activeDay)?.shortLabel ?? ''}
        entries={exportEntries}
        timezone={timezone}
      />
    </div>
  )
}
