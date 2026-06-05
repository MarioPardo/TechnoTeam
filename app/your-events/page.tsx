'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getGroupsByCodes } from '@/app/actions/groups'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FestivalLogo } from '@/components/FestivalLogo'
import { getCrewCodes } from '@/lib/crew-cookies'
import { cn } from '@/lib/utils'

function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  if (start === end) return fmt(s)
  return `${fmt(s)} – ${fmt(e)}`
}

type GroupWithEvent = {
  id: string
  name: string
  code: string
  event_id: string
  events: {
    id: string
    name: string
    date_start: string
    date_end: string
    location: string
    description: string | null
    image_url: string | null
    image_url_dark: string | null
  }
}

export default function YourEventsPage() {
  const [groups, setGroups] = useState<GroupWithEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const codes = getCrewCodes()
    if (codes.length === 0) {
      setLoading(false)
      return
    }
    getGroupsByCodes(codes).then((data) => {
      setGroups(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Events</h1>
          <p className="text-muted-foreground mt-1.5">Festivals where you have a crew.</p>
        </div>
        <Link href="/join" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Join crew with code
        </Link>
      </div>

      {loading ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-14 text-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p className="text-muted-foreground mb-5 font-medium">You haven't joined any crews yet.</p>
          <Link href="/join" className={buttonVariants()}>
            Join a crew with a code
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.code}`} className="block group">
              <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/30 group-hover:-translate-y-0.5">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-4">
                    {(group.events.image_url || group.events.image_url_dark) && (
                      <FestivalLogo
                        lightUrl={group.events.image_url}
                        darkUrl={group.events.image_url_dark}
                        alt={group.events.name}
                        className="w-12 h-12 rounded-xl object-contain shrink-0 bg-muted"
                      />
                    )}
                    <div className="flex-1 min-w-0 flex flex-col gap-3">
                      {/* Festival info at top */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                            {group.events.name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {formatDateRange(group.events.date_start, group.events.date_end)}
                            {' · '}
                            {group.events.location}
                          </p>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground/60 shrink-0 mt-1">{group.code}</span>
                      </div>

                      {/* Crew name at bottom */}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {group.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
