'use client'

import { useState } from 'react'
import { Link2Icon, CheckIcon } from 'lucide-react'
import { Member } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'

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
  currentMemberId: string
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

export function GroupSidebar({ groupName, groupCode, members, currentMemberId, onLeave }: GroupSidebarProps) {
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
        <div className="flex flex-col gap-2.5">
          {members.map((member, i) => (
            <div key={member.id} className="flex items-center gap-2.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${MEMBER_COLORS[i % MEMBER_COLORS.length]}`}>
                {member.name[0].toUpperCase()}
              </span>
              <span className="text-sm text-foreground/80 truncate">
                {member.name}
                {member.id === currentMemberId && (
                  <span className="text-muted-foreground/60 ml-1 text-xs">(you)</span>
                )}
              </span>
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
