import { createEvent } from '@/app/actions/events'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function NewEventPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Back to events
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-4">Create event</h1>
      </div>

      <form action={createEvent} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Event name</Label>
          <Input id="name" name="name" placeholder="Glastonbury 2025" required className="bg-zinc-900 border-zinc-700" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date_start">Start date</Label>
            <Input id="date_start" name="date_start" type="date" required className="bg-zinc-900 border-zinc-700" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date_end">End date</Label>
            <Input id="date_end" name="date_end" type="date" required className="bg-zinc-900 border-zinc-700" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="Pilton, Somerset" required className="bg-zinc-900 border-zinc-700" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description <span className="text-zinc-500">(optional)</span></Label>
          <Input id="description" name="description" placeholder="A few words about the event" className="bg-zinc-900 border-zinc-700" />
        </div>

        <Button type="submit" className="mt-2">Create event</Button>
      </form>
    </div>
  )
}
