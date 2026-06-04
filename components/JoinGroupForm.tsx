'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function JoinGroupForm() {
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const code = (e.currentTarget.elements.namedItem('code') as HTMLInputElement).value.trim().toUpperCase()
    if (code) router.push(`/groups/${code}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1">
        <Label htmlFor="join-code" className="sr-only">Group code</Label>
        <Input
          id="join-code"
          name="code"
          placeholder="Enter 6-letter code"
          maxLength={6}
          className="bg-zinc-900 border-zinc-700 uppercase tracking-widest font-mono"
        />
      </div>
      <Button type="submit" variant="outline">Join group</Button>
    </form>
  )
}
