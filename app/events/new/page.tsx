import { createEvent } from '@/app/actions/events'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

const TIMEZONES = [
  'UTC',
  'Europe/London', 'Europe/Lisbon',
  'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna', 'Europe/Zurich',
  'Europe/Stockholm', 'Europe/Oslo', 'Europe/Copenhagen',
  'Europe/Helsinki', 'Europe/Warsaw', 'Europe/Prague', 'Europe/Budapest',
  'Europe/Bucharest', 'Europe/Athens', 'Europe/Istanbul', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Mexico_City',
  'America/Sao_Paulo', 'America/Buenos_Aires', 'America/Bogota',
  'America/Lima', 'America/Santiago', 'America/Caracas',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Hong_Kong',
  'Asia/Singapore', 'Asia/Bangkok', 'Asia/Kolkata', 'Asia/Dubai',
  'Asia/Riyadh', 'Asia/Jerusalem', 'Asia/Jakarta',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
  'Pacific/Auckland', 'Pacific/Honolulu',
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
]

export default function NewEventPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
          ← Back to events
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-4">Create event</h1>
        <p className="text-muted-foreground mt-1.5">Set up a new festival for your crew to plan around.</p>
      </div>

      <form action={createEvent} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Event name</Label>
          <Input id="name" name="name" placeholder="Glastonbury 2025" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date_start">Start date</Label>
            <Input id="date_start" name="date_start" type="date" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date_end">End date</Label>
            <Input id="date_end" name="date_end" type="date" required />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="Pilton, Somerset" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            name="timezone"
            defaultValue="UTC"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">
            Description{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input id="description" name="description" placeholder="A few words about the event" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="image_url">
            Logo URL{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input id="image_url" name="image_url" type="url" placeholder="https://example.com/logo.png" />
        </div>

        <Button type="submit" className="mt-2">Create event</Button>
      </form>
    </div>
  )
}
