'use client'

import { Member } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

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
}

export function GroupSidebar({ groupName, groupCode, members, currentMemberId }: GroupSidebarProps) {
  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className="w-48 shrink-0 flex flex-col gap-4">
      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Group</div>
        <div className="font-semibold text-zinc-100 truncate">{groupName}</div>
        <button
          onClick={copyLink}
          className="mt-1 font-mono text-sm text-violet-400 hover:text-violet-300 transition-colors tracking-widest"
          title="Copy invite link"
        >
          {groupCode}
        </button>
      </div>

      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Crew</div>
        <div className="flex flex-col gap-2">
          {members.map((member, i) => (
            <div key={member.id} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${MEMBER_COLORS[i % MEMBER_COLORS.length]}`}>
                {member.name[0].toUpperCase()}
              </span>
              <span className="text-sm text-zinc-300 truncate">
                {member.name}
                {member.id === currentMemberId && (
                  <span className="text-zinc-600 ml-1">(you)</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <div className="text-xs text-zinc-600">Click a set to mark you&apos;ll be there. Tap again to remove.</div>
      </div>
    </div>
  )
}
