import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEvent } from '@/app/actions/events'
import { getStagesWithPerformances } from '@/app/actions/stages'
import { StageEditor } from '@/components/StageEditor'
import { Event } from '@/lib/types'

export default async function ManagePage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <div className="mb-2">
        <Link href={`/events/${id}`} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Back to event
        </Link>
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Manage stages &amp; lineup</p>
        </div>
      </div>

      <StageEditor eventId={id} initialStages={stages} />
    </div>
  )
}
