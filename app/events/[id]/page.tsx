import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEvent } from '@/app/actions/events'
import { getStagesWithPerformances } from '@/app/actions/stages'
import { buttonVariants } from '@/components/ui/button'
import { CreateGroupForm } from '@/components/CreateGroupForm'
import { JoinGroupForm } from '@/components/JoinGroupForm'
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

  const hasLineup = stages.some((s: any) => s.performances?.length > 0)

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-2">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← All events
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
          <p className="text-zinc-400 mt-1">{event.location}</p>
        </div>
        <Link href={`/events/${id}/manage`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Edit lineup
        </Link>
      </div>

      {!hasLineup && (
        <div className="border border-dashed border-zinc-700 rounded-xl p-8 text-center mb-8">
          <p className="text-zinc-400 mb-3">No lineup added yet.</p>
          <Link href={`/events/${id}/manage`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Add stages &amp; lineup
          </Link>
        </div>
      )}

      <div className="grid gap-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">Create a group</h2>
          <CreateGroupForm eventId={id} />
        </section>

        <div className="border-t border-zinc-800" />

        <section>
          <h2 className="text-lg font-semibold mb-4">Join an existing group</h2>
          <JoinGroupForm />
        </section>
      </div>
    </div>
  )
}
