'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resetPasswordWithToken } from '@/app/actions/members'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetPasswordInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groupCode, setGroupCode] = useState<string | null>(null)

  async function handleSubmit() {
    if (!newPassword) { setError('Enter a new password.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords don’t match.'); return }
    setSaving(true)
    setError(null)
    try {
      const result = await resetPasswordWithToken(token, newPassword)
      if (!result.ok) {
        setError('This reset link is invalid or has expired. Request a new one from your crew’s join page.')
        return
      }
      setGroupCode(result.groupCode)
    } catch (err) {
      console.error('[ResetPasswordPage] failed to reset password', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (!token) {
    return (
      <div className="max-w-sm mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Invalid link</h1>
          <p className="text-muted-foreground text-sm">This password reset link is missing its token.</p>
        </div>
      </div>
    )
  }

  if (groupCode) {
    return (
      <div className="max-w-sm mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Password reset</h1>
          <p className="text-muted-foreground text-sm mb-6">
            You can now sign in with your new password.
          </p>
          <Link href={`/groups/${groupCode}`}>
            <Button className="w-full">Back to your crew</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-24">
      <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Set a new password</h1>
        <p className="text-muted-foreground text-sm mb-8">Choose a new password for your crew account.</p>

        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(null) }}
              className="mt-1.5"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="mt-1.5"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Reset password'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  )
}
