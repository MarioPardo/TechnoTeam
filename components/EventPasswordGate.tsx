'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { unlockEvent } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  eventId: string
  eventName: string
}

export function EventPasswordGate({ eventId, eventName }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    if (!password) return
    setError(null)
    startTransition(async () => {
      const result = await unlockEvent(eventId, password)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-24">
      <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
        <h1 className="text-xl font-bold tracking-tight mb-1">{eventName}</h1>
        <p className="text-sm text-muted-foreground mb-6">This event is password protected. Enter the password to continue.</p>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="event-password">Password</Label>
            <Input
              id="event-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Event password"
              className="mt-1.5"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSubmit} disabled={isPending || !password}>
            {isPending ? 'Checking…' : 'Unlock'}
          </Button>
        </div>
      </div>
    </div>
  )
}
