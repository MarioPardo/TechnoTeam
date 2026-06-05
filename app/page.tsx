import Link from 'next/link'
import { getEvents } from './actions/events'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FestivalLogo } from '@/components/FestivalLogo'
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
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your events</h1>
          <p className="text-muted-foreground mt-1.5">Pick a festival and plan with your crew.</p>
        </div>
        <Link href="/events/new" className={buttonVariants({ size: 'sm' })}>
          + New event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
          </div>
          <p className="text-muted-foreground mb-5 font-medium">No events yet.</p>
          <Link href="/events/new" className={buttonVariants()}>
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className="block group">
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
    </div>
  )
}
