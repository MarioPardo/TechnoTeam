import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEvent } from '@/app/actions/events'
import { getStagesWithPerformances } from '@/app/actions/stages'
import { StageEditor } from '@/components/StageEditor'
import { EventDetailsEditor } from '@/components/EventDetailsEditor'
import { FestivalLogo } from '@/components/FestivalLogo'
import { ManagePasswordGate } from '@/components/ManagePasswordGate'
import { isManageUnlocked } from '@/app/actions/auth'
import { getFontStyle, formatEventDates } from '@/lib/festival-font'
import { Event } from '@/lib/types'

export default async function ManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const unlocked = await isManageUnlocked()
  if (!unlocked) return <ManagePasswordGate />

  let event: Event | null = null
  let stages: any[] = []

  try {
    event = await getEvent(id)
    stages = await getStagesWithPerformances(id)
  } catch {
    // handled below
  }

  if (!event) notFound()

  return (
    <div className="py-10">
      {/* Header — constrained width */}
      <div className="max-w-2xl mx-auto px-6 mb-10">
        <div className="mb-6">
          <Link href={`/events/${id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to event
          </Link>
        </div>

        <FestivalLogo
          lightUrl={event.image_url}
          darkUrl={event.image_url_dark}
          alt={event.name}
          className="w-20 h-20 mx-auto mb-4 rounded-2xl object-contain bg-muted"
        />
        <h1 className="text-4xl font-bold tracking-tight text-center" style={getFontStyle(event.font)}>
          {event.name}
        </h1>
        <p className="text-muted-foreground text-center mt-1.5">{event.location}</p>
        <p className="text-sm text-muted-foreground/60 text-center mt-0.5">
          {formatEventDates(event.date_start, event.date_end)}
        </p>

        <div className="mt-8">
          <EventDetailsEditor event={event} />
        </div>
      </div>

      {/* Lineup — full width */}
      <div className="border-t border-border pt-8 px-4">
        <div className="max-w-2xl mx-auto px-2 mb-6">
          <h2 className="text-xl font-semibold tracking-tight">Lineup</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage stages and sets.</p>
        </div>
        <StageEditor eventId={id} initialStages={stages} timezone={event.timezone} />
      </div>
    </div>
  )
}
