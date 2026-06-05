'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { unlockManage } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ManagePasswordGate() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    if (!password) return
    setError(null)
    startTransition(async () => {
      const result = await unlockManage(password)
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
        <h1 className="text-xl font-bold tracking-tight mb-1">Edit festival</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter the admin password to continue.</p>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="manage-password">Password</Label>
            <Input
              id="manage-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Admin password"
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
