'use client'

import { Member } from '@/lib/types'

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

export function GroupSidebar({ groupName, groupCode, members, currentMemberId, onLeave }: GroupSidebarProps) {
  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Group</div>
        <div className="font-semibold text-foreground truncate">{groupName}</div>
        <button
          onClick={copyLink}
          className="mt-1 font-mono text-sm text-primary hover:text-primary/80 transition-colors tracking-widest"
          title="Copy invite link"
        >
          {groupCode}
        </button>
        <button
          onClick={onLeave}
          className="mt-3 w-full text-xs font-semibold text-destructive border border-destructive/40 rounded-lg py-1.5 hover:bg-destructive/10 transition-colors"
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
