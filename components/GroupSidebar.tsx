'use client'

import { useState } from 'react'
import { Link2Icon, CheckIcon, Settings2Icon } from 'lucide-react'
import { Member } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { updateMemberPassword } from '@/app/actions/members'

const MEMBER_COLORS = [
  'bg-violet-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-teal-500',
]

interface GroupSidebarProps {
  groupName: string
  groupCode: string
  members: Member[]
  currentMember: Member
  onLeave: () => void
}

function InviteDialog({ groupCode }: { groupCode: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="mt-2 w-full gap-1.5 text-xs" />
        }
      >
        <Link2Icon className="size-3.5" />
        Invite to crew
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to crew</DialogTitle>
          <DialogDescription>
            Share this link — anyone who opens it can join your crew.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mt-1">
          <div className="flex-1 min-w-0 rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground truncate select-all">
            {typeof window !== 'undefined' ? window.location.href : ''}
          </div>
          <Button
            variant={copied ? 'default' : 'outline'}
            size="sm"
            onClick={handleCopy}
            className="shrink-0 gap-1.5 transition-all"
          >
            {copied ? (
              <>
                <CheckIcon className="size-3.5" />
                Copied
              </>
            ) : (
              'Copy'
            )}
          </Button>
        </div>

        <div className="mt-1">
          <p className="text-xs text-muted-foreground mb-2">Or share the crew code:</p>
          <div className="rounded-lg border border-border bg-muted px-4 py-3 text-center">
            <span className="font-mono text-2xl font-bold tracking-[0.3em] text-foreground">
              {groupCode}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PasswordDialog({ member }: { member: Member }) {
  const [open, setOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setCurrentPw('')
      setNewPw('')
      setError(null)
      setSuccess(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await updateMemberPassword(member.id, member.session_token, currentPw, newPw)
      setSuccess(true)
      setCurrentPw('')
      setNewPw('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button className="ml-auto p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
        }
      >
        <Settings2Icon className="w-3.5 h-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Password settings</DialogTitle>
          <DialogDescription>
            Add, change, or remove the password for <span className="font-medium text-foreground">{member.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-1">
          <div>
            <Label htmlFor="current-pw">Current password</Label>
            <Input
              id="current-pw"
              type="password"
              placeholder="Leave blank if you haven't set one"
              value={currentPw}
              onChange={(e) => { setCurrentPw(e.target.value); setError(null) }}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              placeholder="Leave blank to remove password"
              value={newPw}
              onChange={(e) => { setNewPw(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="mt-1.5"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">Password updated!</p>}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function GroupSidebar({ groupName, groupCode, members, currentMember, onLeave }: GroupSidebarProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Group</div>
        <div className="font-semibold text-foreground truncate">{groupName}</div>
        <InviteDialog groupCode={groupCode} />
        <button
          onClick={onLeave}
          className="mt-2 w-full text-xs font-semibold text-destructive border border-destructive/40 rounded-lg py-1.5 hover:bg-destructive/10 transition-colors"
        >
          Leave crew
        </button>
      </div>

      <div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Crew</div>
        <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto">
          {members.map((member, i) => (
            <div key={member.id} className="flex items-center gap-2.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${MEMBER_COLORS[i % MEMBER_COLORS.length]}`}>
                {member.name[0].toUpperCase()}
              </span>
              <span className="text-sm text-foreground/80 truncate flex-1 min-w-0">
                {member.name}
                {member.id === currentMember.id && (
                  <span className="text-muted-foreground/60 ml-1 text-xs">(you)</span>
                )}
              </span>
              {member.id === currentMember.id && (
                <PasswordDialog member={currentMember} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <div className="text-xs text-muted-foreground/60 leading-relaxed">
          Click a set to mark you&apos;ll be there. Tap again to remove.
        </div>
      </div>
    </div>
  )
}
