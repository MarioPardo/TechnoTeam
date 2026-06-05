import { isManageUnlocked } from '@/app/actions/auth'
import { ManagePasswordGate } from '@/components/ManagePasswordGate'
import { NewEventForm } from '@/components/NewEventForm'
import Link from 'next/link'

export default async function NewEventPage() {
  const unlocked = await isManageUnlocked()
  if (!unlocked) return <ManagePasswordGate />

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
          ← Back to events
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-4">Create event</h1>
        <p className="text-muted-foreground mt-1.5">Set up a new festival for your crew to plan around.</p>
      </div>
      <NewEventForm />
    </div>
  )
}
