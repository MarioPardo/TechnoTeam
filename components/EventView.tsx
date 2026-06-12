'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { FestivalLogo } from '@/components/FestivalLogo'
import { CreateGroupForm } from '@/components/CreateGroupForm'
import { JoinGroupForm } from '@/components/JoinGroupForm'
import { LineupGrid } from '@/components/LineupGrid'
import { cn } from '@/lib/utils'
import { getGuestId, getGuestPicks, toggleGuestPick } from '@/lib/guest-picks'
import { getFontStyle, formatEventDates } from '@/lib/festival-font'
import { Event, Stage, Performance, Member, Plan } from '@/lib/types'
import { MEMBER_COLOR_PALETTE } from '@/lib/member-colors'
import { SunDay } from '@/lib/sun-times'

type StageWithPerfs = Stage & { performances: Performance[] }

interface EventViewProps {
  event: Event
  stages: StageWithPerfs[]
  sunTimes?: SunDay[]
}

const MIN_SIDEBAR_WIDTH = 180
const MAX_SIDEBAR_WIDTH = 400
const DEFAULT_SIDEBAR_WIDTH = 260

const GUEST_MEMBER: Member = {
  id: '',
  group_id: '',
  name: 'You',
  session_token: '',
  color: MEMBER_COLOR_PALETTE[0],
  created_at: '',
}

function buildGuestPlans(guestId: string, picks: string[]): (Plan & { members: Member })[] {
  if (!guestId) return []
  const member = { ...GUEST_MEMBER, id: guestId }
  return picks.map((perfId) => ({
    id: `guest-${perfId}`,
    member_id: guestId,
    performance_id: perfId,
    created_at: '',
    members: member,
  }))
}

export function EventView({ event, stages, sunTimes }: EventViewProps) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [guestId, setGuestId] = useState<string>('')
  const [guestPicks, setGuestPicks] = useState<string[]>([])
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

  useEffect(() => {
    setGuestId(getGuestId())
    setGuestPicks(getGuestPicks(event.id))
  }, [event.id])

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

  const sidebarContent = (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 min-h-0 min-w-[220px]">
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
        <div className="font-bold text-lg leading-tight text-foreground" style={getFontStyle(event.font)}>
          {event.name}
        </div>
        <div className="text-xs text-muted-foreground/70 mt-0.5">
          {formatEventDates(event.date_start, event.date_end)}
        </div>
        <Link
          href={`/events/${event.id}/manage`}
          className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' mt-3 text-xs'}
        >
          Edit festival
        </Link>
      </div>

      <div className="border-t border-border" />

      <div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Create a group
        </div>
        <p className="text-xs text-muted-foreground mb-3">Start a new planning group for your crew.</p>
        <CreateGroupForm eventId={event.id} />
      </div>

      <div className="border-t border-border" />

      <div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Join a group
        </div>
        <p className="text-xs text-muted-foreground mb-3">Got a 6-letter code? Jump right in.</p>
        <JoinGroupForm />
      </div>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden relative">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile: persistent open-tab when sidebar is closed */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-10 w-5 bg-background border border-l-0 border-border rounded-r-lg shadow-sm hover:bg-accent transition-colors"
          aria-label="Open sidebar"
        >
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'z-40 bg-background border-r border-border',
          isMobile
            ? cn(
                'fixed top-[57px] left-0 bottom-0 w-72 flex flex-col shadow-xl transition-transform duration-200',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
              )
            : cn(
                'relative shrink-0 transition-[width] duration-200',
                !sidebarOpen && 'border-r-0',
              ),
        )}
        style={!isMobile ? { width: sidebarOpen ? sidebarWidth : 0 } : undefined}
      >
        {/* Inner scroll container - desktop needs overflow-hidden for width animation */}
        <div className={isMobile ? 'flex flex-col flex-1 overflow-hidden' : 'absolute inset-0 flex flex-col overflow-hidden'}>
          {sidebarContent}
        </div>

        {/* Edge toggle tab */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="absolute right-0 top-6 translate-x-full z-20 flex items-center justify-center h-8 w-5 bg-background border border-l-0 border-border rounded-r-lg shadow-sm hover:bg-accent transition-colors"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Drag handle - desktop only, only when open */}
      {!isMobile && sidebarOpen && (
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-primary/40 active:bg-primary/60 transition-colors"
          onMouseDown={handleDragStart}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="shrink-0 bg-background px-4 sm:px-6 pt-3 pb-3 border-b border-border flex items-center justify-center gap-3">
          {event.image_url && (
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image_url}
                alt={event.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain bg-muted dark:hidden"
              />
            </div>
          )}
          {event.image_url_dark && (
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image_url_dark}
                alt={event.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain bg-muted hidden dark:block"
              />
            </div>
          )}
          <div className="min-w-0 text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate leading-tight" style={getFontStyle(event.font)}>
              {event.name}
            </h2>
            <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
              {event.location} · {formatEventDates(event.date_start, event.date_end)}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-2 sm:px-4 py-4">
          {hasLineup ? (
            <LineupGrid
              stages={stages}
              plans={buildGuestPlans(guestId, guestPicks)}
              currentMemberId={guestId}
              logoUrl={event.image_url_dark ?? event.image_url}
              timezone={event.timezone}
              sunTimes={sunTimes}
              guestMode
              onToggle={(perfId) => setGuestPicks(toggleGuestPick(event.id, perfId))}
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
