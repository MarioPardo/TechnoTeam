'use client'

import { useState } from 'react'
import { createGroup } from '@/app/actions/groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateGroupForm({ eventId }: { eventId: string }) {
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    await createGroup(eventId, formData)
  }

  return (
    <form action={handleSubmit} className="flex gap-3">
      <div className="flex-1">
        <Label htmlFor="group-name" className="sr-only">Group name</Label>
        <Input
          id="group-name"
          name="name"
          placeholder="e.g. Tent Squad"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create group'}
      </Button>
    </form>
  )
}
