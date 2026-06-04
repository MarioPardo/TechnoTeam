'use client'

import { Performance, Plan, Member } from '@/lib/types'

interface PerformanceCardProps {
  performance: Performance
  plans: (Plan & { members: Member })[]
  isMine: boolean
  onToggle: () => void
}

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

function MemberDot({ name, colorClass }: { name: string; colorClass: string }) {
  return (
    <span
      title={name}
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold text-white ${colorClass} ring-1 ring-zinc-900`}
    >
      {name[0].toUpperCase()}
    </span>
  )
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function PerformanceCard({ performance, plans, isMine, onToggle }: PerformanceCardProps) {
  const durationMin = (new Date(performance.end_time).getTime() - new Date(performance.start_time).getTime()) / 60000
  const compact = durationMin < 45

  return (
    <button
      onClick={onToggle}
      className={`
        w-full h-full rounded-lg border text-left px-2 py-1.5 overflow-hidden transition-all
        ${isMine
          ? 'bg-violet-600/30 border-violet-500 hover:bg-violet-600/40'
          : 'bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700/80 hover:border-zinc-600'
        }
      `}
    >
      <div className={`font-semibold text-zinc-100 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
        {performance.artist}
      </div>
      {!compact && (
        <div className="text-[11px] text-zinc-400 mt-0.5">
          {formatTime(performance.start_time)} – {formatTime(performance.end_time)}
        </div>
      )}
      {plans.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-1">
          {plans.slice(0, 6).map((plan, i) => (
            <MemberDot
              key={plan.id}
              name={plan.members.name}
              colorClass={MEMBER_COLORS[i % MEMBER_COLORS.length]}
            />
          ))}
          {plans.length > 6 && (
            <span className="text-[9px] text-zinc-500 ml-0.5 self-center">+{plans.length - 6}</span>
          )}
        </div>
      )}
    </button>
  )
}
