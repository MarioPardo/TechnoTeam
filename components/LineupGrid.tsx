'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Performance, Stage, Member, Plan } from '@/lib/types'
import { PerformanceCard } from './PerformanceCard'

type StageWithPerfs = Stage & { performances: Performance[] }

interface LineupGridProps {
  stages: StageWithPerfs[]
  plans: (Plan & { members: Member })[]
  currentMemberId: string
  timezone: string
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

export function LineupGrid({ stages, plans, currentMemberId, timezone, onToggle }: LineupGridProps) {
  const allPerfs = stages.flatMap((s) => s.performances)

  const days = useMemo(() => {
    const dayMap = new Map<string, string>()
    for (const perf of allPerfs) {
      const key = toDateKey(perf.start_time, timezone)
      if (!dayMap.has(key)) {
        dayMap.set(
          key,
          new Date(perf.start_time).toLocaleDateString('en-GB', { timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long' }),
        )
      }
    }
    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, label]) => ({ key, label }))
  }, [allPerfs, timezone])

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

  const filteredStages = useMemo(
    () =>
      orderedStages.map((stage) => ({
        ...stage,
        performances: stage.performances.filter(
          (perf) => toDateKey(perf.start_time, timezone) === activeDay,
        ),
      })),
    [orderedStages, activeDay, timezone],
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
      {/* Day tabs */}
      {days.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
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
      )}

      {dayPerfs.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          No sets scheduled for {days.find((d) => d.key === activeDay)?.label ?? 'this day'}.
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Stage name headers */}
          <div className="flex min-w-full sticky top-0 z-20 bg-background border-b border-border">
            <div className="w-28 shrink-0" />
            {orderedStages.map((stage) => (
              <div
                key={stage.id}
                draggable
                onDragStart={() => setDraggedId(stage.id)}
                onDragOver={(e) => handleColumnDragOver(e, stage.id)}
                onDrop={() => handleColumnDrop(stage.id)}
                onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
                className={`flex-1 min-w-[180px] px-3 py-2.5 text-sm font-semibold text-foreground border-l border-border flex items-center justify-center gap-1.5 cursor-grab select-none transition-opacity ${
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
                <span className="truncate">{stage.name}</span>
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
                      className="absolute left-1 right-1 z-20"
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
    </div>
  )
}
