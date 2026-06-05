'use client'

import { useState, useTransition } from 'react'
import { sendFeedback } from '@/app/actions/feedback'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function FeedbackPage() {
  const [anonymous, setAnonymous] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('anonymous', anonymous ? 'true' : 'false')
    startTransition(async () => {
      const result = await sendFeedback(formData)
      if ('error' in result) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Thanks for the feedback!</h1>
        <p className="text-muted-foreground">We'll read every message and use it to improve TechnoTeam.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Feedback</h1>
        <p className="text-muted-foreground text-lg">
          Please let us know anything we should fix, or any new features you'd like to see!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            name="subject"
            placeholder="e.g. Bug report, Feature request…"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <textarea
            id="message"
            name="message"
            placeholder="Tell us what's on your mind…"
            required
            disabled={isPending}
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
        </div>

        <div className="rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={anonymous}
              onClick={() => setAnonymous((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${anonymous ? 'bg-primary' : 'bg-input'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${anonymous ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className="text-sm font-medium">Send anonymously</span>
          </div>

          {!anonymous && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Name (optional)</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email (optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  disabled={isPending}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Sending…' : 'Send Feedback'}
        </Button>
      </form>
    </div>
  )
}
