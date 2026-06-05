'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function JoinPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed) router.push(`/groups/${trimmed}`)
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-24">
      <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Join a crew</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Enter the 6-letter code your crew shared with you.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="join-code">Crew code</Label>
            <Input
              id="join-code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ABCDEF"
              maxLength={6}
              className="mt-1.5 uppercase tracking-widest font-mono text-center text-lg"
              autoFocus
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={code.trim().length === 0}>
            Go to crew
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinPageInner />
    </Suspense>
  )
}
