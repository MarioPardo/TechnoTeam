import { notFound } from 'next/navigation'
import { getEventBySlugOrId } from '@/app/actions/events'
import { getStagesWithPerformances } from '@/app/actions/stages'
import { isManageUnlocked, isEventUnlocked } from '@/app/actions/auth'
import { EventPasswordGate } from '@/components/EventPasswordGate'
import { EventView } from '@/components/EventView'
import { fetchSunTimes } from '@/lib/sun-times'

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let event = null
  let stages: any[] = []

  try {
    event = await getEventBySlugOrId(id)
    if (event) stages = await getStagesWithPerformances(event.id)
  } catch {
    // handled below
  }

  if (!event) notFound()

  if (event.password_hash) {
    const [manageUnlocked, eventUnlocked] = await Promise.all([
      isManageUnlocked(),
      isEventUnlocked(event.id, event.password_hash),
    ])
    if (!manageUnlocked && !eventUnlocked) {
      return <EventPasswordGate eventId={event.id} eventName={event.name} />
    }
  }

  const sunTimes = await fetchSunTimes(event.location, event.date_start, event.date_end, event.timezone)

  return <EventView event={event} stages={stages} sunTimes={sunTimes} />
}
