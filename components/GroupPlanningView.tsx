'use client'

import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'
import { joinGroup } from '@/app/actions/members'
import { togglePlan } from '@/app/actions/plans'
import { Member, Plan, Performance, Stage, Group } from '@/lib/types'
import { LineupGrid } from './LineupGrid'
import { GroupSidebar } from './GroupSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type StageWithPerfs = Stage & { performances: Performance[] }
type PlanWithMember = Plan & { members: Member }
type GroupWithEvent = Group & { members: Member[]; events: { id: string; name: string } }

interface GroupPlanningViewProps {
  group: GroupWithEvent
  stages: StageWithPerfs[]
  initialPlans: PlanWithMember[]
}

const SESSION_KEY = 'festival-session-token'

export function GroupPlanningView({ group, stages, initialPlans }: GroupPlanningViewProps) {
  const [members, setMembers] = useState<Member[]>(group.members)
  const [plans, setPlans] = useState<PlanWithMember[]>(initialPlans)
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinName, setJoinName] = useState('')

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY)
    if (!token) return
    const found = group.members.find((m) => m.session_token === token)
    if (found) setCurrentMember(found)
  }, [group.members])

  // Real-time subscription on plans
  useEffect(() => {
    const channel = supabase
      .channel(`group-plans-${group.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'plans' },
        async (payload) => {
          const newPlan = payload.new as Plan
          // Fetch the member info for the new plan
          const { data: member } = await supabase
            .from('members')
            .select('*')
            .eq('id', newPlan.member_id)
            .single()
          if (member) {
            setPlans((prev) => {
              if (prev.some((p) => p.id === newPlan.id)) return prev
              return [...prev, { ...newPlan, members: member }]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'plans' },
        (payload) => {
          const deleted = payload.old as { id: string }
          setPlans((prev) => prev.filter((p) => p.id !== deleted.id))
        }
      )
      .subscribe()

    // Real-time subscription on members (for new joiners)
    const memberChannel = supabase
      .channel(`group-members-${group.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'members' },
        (payload) => {
          const newMember = payload.new as Member
          if (newMember.group_id === group.id) {
            setMembers((prev) => {
              if (prev.some((m) => m.id === newMember.id)) return prev
              return [...prev, newMember]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(memberChannel)
    }
  }, [group.id])

  const handleJoin = async () => {
    if (!joinName.trim()) return
    setJoining(true)
    const token = uuidv4()
    try {
      const member = await joinGroup(group.id, joinName.trim(), token)
      localStorage.setItem(SESSION_KEY, token)
      setCurrentMember(member)
    } catch (err) {
      console.error(err)
    } finally {
      setJoining(false)
    }
  }

  const handleToggle = useCallback(async (performanceId: string) => {
    if (!currentMember) return

    // Optimistic update
    const existing = plans.find(
      (p) => p.member_id === currentMember.id && p.performance_id === performanceId
    )
    if (existing) {
      setPlans((prev) => prev.filter((p) => p.id !== existing.id))
    } else {
      const optimistic: PlanWithMember = {
        id: `optimistic-${performanceId}`,
        member_id: currentMember.id,
        performance_id: performanceId,
        created_at: new Date().toISOString(),
        members: currentMember,
      }
      setPlans((prev) => [...prev, optimistic])
    }

    try {
      await togglePlan(currentMember.id, performanceId)
    } catch {
      // Revert on failure — real-time will correct state
    }
  }, [currentMember, plans])

  // Join screen
  if (!currentMember) {
    return (
      <div className="max-w-sm mx-auto px-6 py-24">
        <h1 className="text-2xl font-bold tracking-tight mb-1">{group.name}</h1>
        <p className="text-zinc-400 text-sm mb-8">{group.events.name} · Code: <span className="font-mono text-violet-400">{group.code}</span></p>

        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="join-name">Your name</Label>
            <Input
              id="join-name"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="What do your crew call you?"
              className="mt-1.5 bg-zinc-900 border-zinc-700"
              autoFocus
            />
          </div>
          <Button onClick={handleJoin} disabled={joining || !joinName.trim()}>
            {joining ? 'Joining…' : 'Join group'}
          </Button>
        </div>

        {members.length > 0 && (
          <div className="mt-8">
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Already here</p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <span key={m.id} className="text-sm text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-full">{m.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r border-zinc-800 p-4 overflow-y-auto">
        <GroupSidebar
          groupName={group.name}
          groupCode={group.code}
          members={members}
          currentMemberId={currentMember.id}
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="sticky top-0 bg-zinc-950 z-20 pb-3 mb-1">
          <h2 className="text-lg font-semibold text-zinc-100">{group.events.name}</h2>
        </div>
        <LineupGrid
          stages={stages}
          plans={plans}
          currentMemberId={currentMember.id}
          onToggle={handleToggle}
        />
      </div>
    </div>
  )
}
