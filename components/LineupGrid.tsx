'use client'

import { useMemo } from 'react'
import { Performance, Stage, Member, Plan } from '@/lib/types'
import { PerformanceCard } from './PerformanceCard'

type StageWithPerfs = Stage & { performances: Performance[] }

interface LineupGridProps {
  stages: StageWithPerfs[]
  plans: (Plan & { members: Member })[]
  currentMemberId: string
  onToggle: (performanceId: string) => void
}

const SLOT_HEIGHT_PX = 4  // px per minute
const HOUR_PX = SLOT_HEIGHT_PX * 60

function toMinutes(iso: string): number {
  return new Date(iso).getTime() / 60000
}

export function LineupGrid({ stages, plans, currentMemberId, onToggle }: LineupGridProps) {
  const { minTime, maxTime, timeMarkers } = useMemo(() => {
    const allPerfs = stages.flatMap((s) => s.performances)
    if (allPerfs.length === 0) return { minTime: 0, maxTime: 0, timeMarkers: [] }

    const min = Math.min(...allPerfs.map((p) => toMinutes(p.start_time)))
    const max = Math.max(...allPerfs.map((p) => toMinutes(p.end_time)))

    // round down to the hour
    const minHour = Math.floor(min / 60) * 60
    const maxHour = Math.ceil(max / 60) * 60

    const markers: { label: string; offset: number }[] = []
    for (let t = minHour; t <= maxHour; t += 60) {
      const date = new Date(t * 60000)
      markers.push({
        label: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        offset: (t - minHour) * SLOT_HEIGHT_PX,
      })
    }

    return { minTime: minHour, maxTime: maxHour, timeMarkers: markers }
  }, [stages])

  const totalHeight = (maxTime - minTime) * SLOT_HEIGHT_PX

  if (stages.flatMap((s) => s.performances).length === 0) {
    return (
      <div className="text-center text-zinc-500 py-20">
        No lineup added yet. Ask the organiser to add stages and sets.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max">
        {/* Time ruler */}
        <div className="w-14 shrink-0 relative" style={{ height: totalHeight }}>
          {timeMarkers.map((m) => (
            <div
              key={m.label}
              className="absolute right-2 text-xs text-zinc-500 leading-none -translate-y-1/2"
              style={{ top: m.offset }}
            >
              {m.label}
            </div>
          ))}
        </div>

        {/* Stage columns */}
        {stages.map((stage) => (
          <div key={stage.id} className="flex flex-col min-w-[220px] w-[220px]">
            {/* Stage header */}
            <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-300 text-center truncate">
              {stage.name}
            </div>

            {/* Performance slots */}
            <div className="relative flex-1 border-l border-zinc-800" style={{ height: totalHeight }}>
              {/* Hour grid lines */}
              {timeMarkers.map((m) => (
                <div
                  key={m.label}
                  className="absolute left-0 right-0 border-t border-zinc-800/50"
                  style={{ top: m.offset }}
                />
              ))}

              {stage.performances.map((perf) => {
                const top = (toMinutes(perf.start_time) - minTime) * SLOT_HEIGHT_PX
                const height = (toMinutes(perf.end_time) - toMinutes(perf.start_time)) * SLOT_HEIGHT_PX
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
                      onToggle={() => onToggle(perf.id)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
