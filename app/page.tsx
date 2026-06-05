import Link from 'next/link'
import { getEvents } from './actions/events'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { FestivalLogo } from '@/components/FestivalLogo'
import { Event } from '@/lib/types'
import { slugify } from '@/lib/utils'

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
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-14">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Coordinate with your crew.
        </h1>
        <p className="text-muted-foreground text-lg">
          Plan your festival schedule together, in real time.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Available Events</h2>
          <Link href="/events/new" className={buttonVariants({ size: 'sm' })}>
            Add New Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl p-14 text-center">
            <p className="text-muted-foreground">No events available yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${slugify(event.name)}`} className="block group">
                <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/30 group-hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-4">
                      {(event.image_url || event.image_url_dark) && (
                        <FestivalLogo
                          lightUrl={event.image_url}
                          darkUrl={event.image_url_dark}
                          alt={event.name}
                          className="w-12 h-12 rounded-xl object-contain shrink-0 bg-muted"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="group-hover:text-primary transition-colors">{event.name}</CardTitle>
                          <Badge variant="secondary" className="shrink-0">
                            {event.location}
                          </Badge>
                        </div>
                        <CardDescription>
                          {formatDateRange(event.date_start, event.date_end)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {event.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
