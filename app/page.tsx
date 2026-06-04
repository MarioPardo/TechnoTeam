import Link from 'next/link'
import { getEvents } from './actions/events'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Event } from '@/lib/types'
import { cn } from '@/lib/utils'

function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  if (start === end) return fmt(s)
  return `${fmt(s)} – ${fmt(e)}`
}

export default async function HomePage() {
  let events: Event[] = []
  try {
    events = await getEvents()
  } catch {
    // Supabase not configured yet
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-zinc-400 mt-1">Pick a festival and plan with your crew.</p>
        </div>
        <Link href="/events/new" className={buttonVariants()}>
          + New event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="border border-dashed border-zinc-700 rounded-xl p-12 text-center">
          <p className="text-zinc-400 mb-4">No events yet.</p>
          <Link href="/events/new" className={buttonVariants({ variant: 'outline' })}>
            Create the first event
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className="block group">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-zinc-50 group-hover:text-white">{event.name}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 bg-zinc-800 text-zinc-300">
                      {event.location}
                    </Badge>
                  </div>
                  <CardDescription className="text-zinc-500">
                    {formatDateRange(event.date_start, event.date_end)}
                  </CardDescription>
                </CardHeader>
                {event.description && (
                  <CardContent>
                    <p className="text-sm text-zinc-400 line-clamp-2">{event.description}</p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
