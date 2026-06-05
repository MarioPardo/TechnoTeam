'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { signInOrJoin, leaveGroup } from '@/app/actions/members'
import { togglePlan } from '@/app/actions/plans'
import { Member, Plan, Performance, Stage, Group } from '@/lib/types'
import { LineupGrid } from './LineupGrid'
import { GroupSidebar } from './GroupSidebar'
import { GroupChat } from './GroupChat'
import { FestivalLogo } from './FestivalLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type StageWithPerfs = Stage & { performances: Performance[] }
type PlanWithMember = Plan & { members: Member }
type GroupWithEvent = Group & { members: Member[]; events: { id: string; name: string; image_url: string | null; image_url_dark: string | null; timezone: string } }

interface GroupPlanningViewProps {
  group: GroupWithEvent
  stages: StageWithPerfs[]
  initialPlans: PlanWithMember[]
}

const SESSION_KEY = 'festival-session-token'
const MIN_SIDEBAR_WIDTH = 160
const MAX_SIDEBAR_WIDTH = 420
const DEFAULT_SIDEBAR_WIDTH = 208

export function GroupPlanningView({ group, stages, initialPlans }: GroupPlanningViewProps) {
  const [members, setMembers] = useState<Member[]>(group.members)
  const [plans, setPlans] = useState<PlanWithMember[]>(initialPlans)
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinName, setJoinName] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [quickSignIn, setQuickSignIn] = useState<{
    name: string
    loading: boolean
    needsPassword: boolean
    password: string
    error: string | null
  } | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const isDragging = useRef(false)

  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY)
    if (!token) return
    const found = group.members.find((m) => m.session_token === token)
    if (found) setCurrentMember(found)
  }, [group.members])

  useEffect(() => {
    const channel = supabase
      .channel(`group-plans-${group.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'plans' },
        async (payload) => {
          const newPlan = payload.new as Plan
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

  const isReturning = members.some(
    (m) => m.name.toLowerCase() === joinName.trim().toLowerCase()
  )

  const handleJoin = async () => {
    if (!joinName.trim()) return
    setJoining(true)
    setJoinError(null)
    try {
      const member = await signInOrJoin(group.id, joinName.trim(), joinPassword || undefined)
      localStorage.setItem(SESSION_KEY, member.session_token)
      setCurrentMember(member)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setJoining(false)
    }
  }

  const handleQuickSignIn = async (name: string) => {
    setQuickSignIn({ name, loading: true, needsPassword: false, password: '', error: null })
    try {
      const member = await signInOrJoin(group.id, name)
      localStorage.setItem(SESSION_KEY, member.session_token)
      setCurrentMember(member)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      if (msg.toLowerCase().includes('password')) {
        setQuickSignIn({ name, loading: false, needsPassword: true, password: '', error: null })
      } else {
        setQuickSignIn({ name, loading: false, needsPassword: false, password: '', error: msg })
      }
    }
  }

  const handleQuickSignInWithPassword = async () => {
    if (!quickSignIn) return
    setQuickSignIn((prev) => prev ? { ...prev, loading: true, error: null } : null)
    try {
      const member = await signInOrJoin(group.id, quickSignIn.name, quickSignIn.password)
      localStorage.setItem(SESSION_KEY, member.session_token)
      setCurrentMember(member)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setQuickSignIn((prev) => prev ? { ...prev, loading: false, error: msg } : null)
    }
  }

  const handleLeave = useCallback(async () => {
    if (!currentMember) return
    try {
      await leaveGroup(currentMember.id)
    } catch (err) {
      console.error(err)
    }
    localStorage.removeItem(SESSION_KEY)
    setCurrentMember(null)
    setMembers((prev) => prev.filter((m) => m.id !== currentMember.id))
    setPlans((prev) => prev.filter((p) => p.member_id !== currentMember.id))
  }, [currentMember])

  const handleToggle = useCallback(async (performanceId: string) => {
    if (!currentMember) return

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

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, e.clientX)))
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  // Join screen
  if (!currentMember) {
    return (
      <div className="max-w-sm mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">{group.name}</h1>
          <p className="text-muted-foreground text-sm mb-8">
            {group.events.name} · Code:{' '}
            <span className="font-mono text-primary font-semibold">{group.code}</span>
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="join-name">Your name</Label>
              <Input
                id="join-name"
                value={joinName}
                onChange={(e) => { setJoinName(e.target.value); setJoinError(null) }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="What do your crew call you?"
                className="mt-1.5"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="join-password">
                {isReturning ? 'Password (if you set one)' : 'Password'}
              </Label>
              <Input
                id="join-password"
                type="password"
                value={joinPassword}
                onChange={(e) => { setJoinPassword(e.target.value); setJoinError(null) }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder={isReturning ? 'Leave blank if none set' : 'Optional — lets you sign in from other devices'}
                className="mt-1.5"
              />
            </div>
            {joinError && (
              <p className="text-sm text-destructive">{joinError}</p>
            )}
            <Button onClick={handleJoin} disabled={joining || !joinName.trim()}>
              {joining ? (isReturning ? 'Signing in…' : 'Joining…') : (isReturning ? 'Sign in' : 'Join group')}
            </Button>
          </div>

          {members.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground font-semibold mb-3 uppercase tracking-wider">
                Already here{' '}
                <span className="normal-case font-normal text-muted-foreground/70">— sign in as?</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleQuickSignIn(m.name)}
                    disabled={quickSignIn?.loading}
                    className="text-sm text-foreground/80 bg-muted hover:bg-accent hover:text-accent-foreground px-3 py-1 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {quickSignIn?.name === m.name && quickSignIn.loading ? 'Signing in…' : m.name}
                  </button>
                ))}
              </div>

              {quickSignIn?.needsPassword && (
                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{quickSignIn.name}</span> has a password
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={quickSignIn.password}
                      onChange={(e) => setQuickSignIn((prev) => prev ? { ...prev, password: e.target.value, error: null } : null)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickSignInWithPassword()}
                      placeholder="Enter password"
                      autoFocus
                      className="flex-1"
                    />
                    <Button onClick={handleQuickSignInWithPassword} disabled={quickSignIn.loading} size="sm">
                      Go
                    </Button>
                  </div>
                  {quickSignIn.error && (
                    <p className="text-sm text-destructive">{quickSignIn.error}</p>
                  )}
                </div>
              )}

              {quickSignIn && !quickSignIn.needsPassword && quickSignIn.error && (
                <p className="text-sm text-destructive mt-2">{quickSignIn.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Resizable sidebar */}
      <div
        style={{ width: sidebarWidth }}
        className="shrink-0 border-r border-border bg-background flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <GroupSidebar
            groupName={group.name}
            groupCode={group.code}
            members={members}
            currentMemberId={currentMember.id}
            onLeave={handleLeave}
          />
        </div>

        <GroupChat
          groupId={group.id}
          currentMember={currentMember}
          members={members}
          collapsed={chatCollapsed}
          onToggleCollapse={() => setChatCollapsed((c) => !c)}
        />
      </div>

      {/* Drag handle */}
      <div
        className="w-1 shrink-0 cursor-col-resize hover:bg-primary/40 active:bg-primary/60 transition-colors"
        onMouseDown={handleDragStart}
      />

      {/* Grid */}
      <div className="flex-1 overflow-auto py-4 px-2">
        <div className="sticky top-0 bg-background z-20 pb-3 mb-1 text-center">
          <FestivalLogo
            lightUrl={group.events.image_url}
            darkUrl={group.events.image_url_dark}
            alt={group.events.name}
            className="w-14 h-14 mx-auto mb-2 rounded-xl object-contain bg-muted"
          />
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{group.events.name}</h2>
        </div>
        <LineupGrid
          stages={stages}
          plans={plans}
          currentMemberId={currentMember.id}
          timezone={(group as any).events?.timezone ?? 'UTC'}
          onToggle={handleToggle}
        />
      </div>
    </div>
  )
}
