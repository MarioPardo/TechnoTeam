'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { FestivalLogo } from '@/components/FestivalLogo'
import { CreateGroupForm } from '@/components/CreateGroupForm'
import { JoinGroupForm } from '@/components/JoinGroupForm'
import { LineupGrid } from '@/components/LineupGrid'
import { Event, Stage, Performance } from '@/lib/types'

type StageWithPerfs = Stage & { performances: Performance[] }

interface EventViewProps {
  event: Event
  stages: StageWithPerfs[]
}

const MIN_SIDEBAR_WIDTH = 180
const MAX_SIDEBAR_WIDTH = 400
const DEFAULT_SIDEBAR_WIDTH = 260

export function EventView({ event, stages }: EventViewProps) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const isDragging = useRef(false)

  const hasLineup = stages.some((s) => s.performances.length > 0)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, e.clientX)))
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Sidebar */}
      <div
        style={{ width: sidebarWidth }}
        className="shrink-0 border-r border-border bg-background flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 min-h-0">
          {/* Event header */}
          <div>
            <FestivalLogo
              lightUrl={event.image_url}
              darkUrl={event.image_url_dark}
              alt={event.name}
              className="w-14 h-14 rounded-xl object-contain bg-muted mb-3"
            />
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
              {event.location}
            </div>
            <div className="font-bold text-lg leading-tight text-foreground">{event.name}</div>
            <Link
              href={`/events/${event.id}/manage`}
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' mt-3 text-xs'}
            >
              Edit festival
            </Link>
          </div>

          <div className="border-t border-border" />

          {/* Create group */}
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Create a group
            </div>
            <p className="text-xs text-muted-foreground mb-3">Start a new planning group for your crew.</p>
            <CreateGroupForm eventId={event.id} />
          </div>

          <div className="border-t border-border" />

          {/* Join group */}
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Join a group
            </div>
            <p className="text-xs text-muted-foreground mb-3">Got a 6-letter code? Jump right in.</p>
            <JoinGroupForm />
          </div>
        </div>
      </div>

      {/* Drag handle */}
      <div
        className="w-1 shrink-0 cursor-col-resize hover:bg-primary/40 active:bg-primary/60 transition-colors"
        onMouseDown={handleDragStart}
      />

      {/* Lineup */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 bg-background px-6 pt-5 pb-4 border-b border-border">
          <h2 className="text-2xl font-bold tracking-tight">{event.name}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{event.location}</p>
        </div>
        <div className="flex-1 overflow-auto px-4 py-4">
          {hasLineup ? (
            <LineupGrid
              stages={stages}
              plans={[]}
              currentMemberId=""
              timezone={event.timezone}
              onToggle={() => {}}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <p className="text-muted-foreground">No lineup added yet.</p>
              <Link href={`/events/${event.id}/manage`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Add stages &amp; lineup
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
