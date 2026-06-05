import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEvent } from '@/app/actions/events'
import { getStagesWithPerformances } from '@/app/actions/stages'
import { isManageUnlocked, isEventUnlocked } from '@/app/actions/auth'
import { buttonVariants } from '@/components/ui/button'
import { CreateGroupForm } from '@/components/CreateGroupForm'
import { JoinGroupForm } from '@/components/JoinGroupForm'
import { FestivalLogo } from '@/components/FestivalLogo'
import { EventPasswordGate } from '@/components/EventPasswordGate'
import { Event } from '@/lib/types'

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let event: Event | null = null
  let stages: any[] = []

  try {
    event = await getEvent(id)
    stages = await getStagesWithPerformances(id)
  } catch {
    // handled below
  }

  if (!event) notFound()

  if (event.password_hash) {
    const [manageUnlocked, eventUnlocked] = await Promise.all([
      isManageUnlocked(),
      isEventUnlocked(id, event.password_hash),
    ])
    if (!manageUnlocked && !eventUnlocked) {
      return <EventPasswordGate eventId={id} eventName={event.name} passwordHash={event.password_hash} />
    }
  }

  const hasLineup = stages.some((s: any) => s.performances?.length > 0)

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-2">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← All events
        </Link>
      </div>

      <div className="mb-10">
        <FestivalLogo
          lightUrl={event.image_url}
          darkUrl={event.image_url_dark}
          alt={event.name}
          className="w-24 h-24 mx-auto mb-4 rounded-2xl object-contain bg-muted"
        />
        <h1 className="text-4xl font-bold tracking-tight text-center">{event.name}</h1>
        <p className="text-muted-foreground mt-1.5 text-center">{event.location}</p>
        <div className="flex justify-center mt-4">
          <Link href={`/events/${id}/manage`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Edit festival
          </Link>
        </div>
      </div>

      {!hasLineup && (
        <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center mb-10">
          <p className="text-muted-foreground mb-4">No lineup added yet.</p>
          <Link href={`/events/${id}/manage`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Add stages &amp; lineup
          </Link>
        </div>
      )}

      <div className="grid gap-8">
        <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">Create a group</h2>
          <p className="text-sm text-muted-foreground mb-5">Start a new planning group for your crew.</p>
          <CreateGroupForm eventId={id} />
        </section>

        <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">Join an existing group</h2>
          <p className="text-sm text-muted-foreground mb-5">Got a 6-letter code? Jump right in.</p>
          <JoinGroupForm />
        </section>
      </div>
    </div>
  )
}
