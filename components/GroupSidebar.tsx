'use client'

import { useState } from 'react'
import { Link2Icon, CheckIcon, Settings2Icon } from 'lucide-react'
import { Member } from '@/lib/types'
import { MEMBER_COLOR_PALETTE } from '@/lib/member-colors'
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
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { updateMemberPassword, updateMemberColor, getMemberEmail } from '@/app/actions/members'

interface GroupSidebarProps {
  groupName: string
  groupCode: string
  members: Member[]
  currentMember: Member
  onSignOut: () => void
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

function LeaveCrewDialog({ onLeave }: { onLeave: () => void }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button className="mt-2 w-full text-xs font-semibold text-destructive border border-destructive/40 rounded-lg py-1.5 hover:bg-destructive/10 transition-colors" />
        }
      >
        Leave crew
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave crew?</DialogTitle>
          <DialogDescription>
            This removes you from the crew entirely — your name and all of your saved sets will be
            deleted. You can rejoin later, but you&apos;ll start fresh.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose render={<Button variant="destructive" onClick={onLeave} />}>
            Leave crew
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ColorPicker({ member }: { member: Member }) {
  const [color, setColor] = useState(member.color)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handlePick(next: string) {
    if (next === color || saving) return
    const previous = color
    setColor(next)
    setSaving(next)
    setError(null)
    try {
      await updateMemberColor(member.id, member.session_token, next)
    } catch (err) {
      console.error('[GroupSidebar] failed to update color', err)
      setColor(previous)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      <Label>Your color</Label>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {MEMBER_COLOR_PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => handlePick(swatch)}
            aria-label={`Use color ${swatch}`}
            disabled={saving !== null}
            style={{ backgroundColor: swatch }}
            className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 disabled:pointer-events-none ${
              color === swatch ? 'ring-2 ring-offset-2 ring-offset-popover ring-foreground' : ''
            }`}
          >
            {color === swatch && <CheckIcon className="size-3.5 text-white" />}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  )
}

function UserSettingsDialog({ member }: { member: Member }) {
  const [open, setOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (v) {
      getMemberEmail(member.id, member.session_token)
        .then((stored) => setEmail(stored ?? ''))
        .catch((err) => console.error('[GroupSidebar] failed to load email', err))
    } else {
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
      const result = await updateMemberPassword(member.id, member.session_token, currentPw, newPw, email)
      if (!result.ok) {
        setError(result.reason === 'current-required' ? 'Current password is required' : 'Current password is incorrect')
        return
      }
      setSuccess(true)
      setCurrentPw('')
      setNewPw('')
    } catch (err) {
      console.error('[GroupSidebar] failed to update password', err)
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
          <DialogTitle>User settings</DialogTitle>
          <DialogDescription>
            Update <span className="font-medium text-foreground">{member.name}</span>&apos;s color and password.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-1">
          <ColorPicker member={member} />

          <div className="flex flex-col gap-3 pt-3 border-t border-border">
            <Label htmlFor="current-pw">Current password</Label>
            <Input
              id="current-pw"
              type="password"
              placeholder="Leave blank if you haven't set one"
              value={currentPw}
              onChange={(e) => { setCurrentPw(e.target.value); setError(null) }}
              className="-mt-1.5"
            />
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              placeholder="Leave blank to remove password"
              value={newPw}
              onChange={(e) => { setNewPw(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="-mt-1.5"
            />
            <Label htmlFor="recovery-email">Email</Label>
            <Input
              id="recovery-email"
              type="email"
              placeholder="Leave blank to remove"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="-mt-1.5"
            />
            <p className="text-xs text-muted-foreground/70 -mt-2">
              Only used to recover your password — never for spam or marketing. Not required, but
              without it a forgotten password can&apos;t be recovered. If that&apos;s a hassle, skip the
              password too and just trust your crewmates.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">Password updated!</p>}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function GroupSidebar({ groupName, groupCode, members, currentMember, onSignOut, onLeave }: GroupSidebarProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Group</div>
        <div className="font-semibold text-foreground truncate">{groupName}</div>
        <InviteDialog groupCode={groupCode} />
        <button
          onClick={onSignOut}
          className="mt-2 w-full text-xs font-semibold text-foreground/80 border border-border rounded-lg py-1.5 hover:bg-muted transition-colors"
        >
          Sign out
        </button>
        <LeaveCrewDialog onLeave={onLeave} />
      </div>

      <div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Crew</div>
        <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-2.5">
              <span
                style={{ backgroundColor: member.color }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              >
                {member.name[0].toUpperCase()}
              </span>
              <span className="text-sm text-foreground/80 truncate flex-1 min-w-0">
                {member.name}
                {member.id === currentMember.id && (
                  <span className="text-muted-foreground/60 ml-1 text-xs">(you)</span>
                )}
              </span>
              {member.id === currentMember.id && (
                <UserSettingsDialog member={currentMember} />
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
