'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { FestivalLogo } from '@/components/FestivalLogo'
import { CreateGroupForm } from '@/components/CreateGroupForm'
import { JoinGroupForm } from '@/components/JoinGroupForm'
import { LineupGrid } from '@/components/LineupGrid'
import { cn } from '@/lib/utils'
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const isDragging = useRef(false)

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

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
    <div className="flex h-[calc(100vh-57px)] overflow-hidden relative">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'bg-background border-r border-border flex flex-col overflow-hidden z-40',
          isMobile
            ? cn(
                'fixed top-[57px] left-0 bottom-0 w-72 transition-transform duration-200 shadow-xl',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
              )
            : cn(
                'relative shrink-0 transition-[width] duration-200',
                !sidebarOpen && 'border-r-0',
              ),
        )}
        style={!isMobile ? { width: sidebarOpen ? sidebarWidth : 0 } : undefined}
      >
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 min-h-0 min-w-[240px]">
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

      {/* Drag handle - desktop only */}
      {!isMobile && sidebarOpen && (
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-primary/40 active:bg-primary/60 transition-colors"
          onMouseDown={handleDragStart}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="shrink-0 bg-background px-4 sm:px-6 pt-4 pb-3 border-b border-border flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            aria-label={sidebarOpen && !isMobile ? 'Collapse sidebar' : 'Open sidebar'}
          >
            {sidebarOpen && !isMobile ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5" />
            )}
          </button>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight truncate">{event.name}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{event.location}</p>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-2 sm:px-4 py-4">
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
