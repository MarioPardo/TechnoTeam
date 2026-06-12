'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { signInOrJoin, leaveGroup } from '@/app/actions/members'
import { togglePlan } from '@/app/actions/plans'
import { addCrewCode } from '@/lib/crew-cookies'
import { cn } from '@/lib/utils'
import { getFontStyle, formatEventDates } from '@/lib/festival-font'
import { Member, Plan, Performance, Stage, Group } from '@/lib/types'
import { SunDay } from '@/lib/sun-times'
import { LineupGrid } from './LineupGrid'
import { GroupSidebar } from './GroupSidebar'
import { GroupChat } from './GroupChat'
import { FestivalLogo } from './FestivalLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type StageWithPerfs = Stage & { performances: Performance[] }
type PlanWithMember = Plan & { members: Member }
type GroupWithEvent = Group & { members: Member[]; events: { id: string; name: string; image_url: string | null; image_url_dark: string | null; timezone: string; date_start: string; date_end: string; font: string | null } }

interface GroupPlanningViewProps {
  group: GroupWithEvent
  stages: StageWithPerfs[]
  initialPlans: PlanWithMember[]
  sunTimes?: SunDay[]
}

const SESSION_KEY = 'festival-session-token'
const MIN_SIDEBAR_WIDTH = 160
const MAX_SIDEBAR_WIDTH = 420
const DEFAULT_SIDEBAR_WIDTH = 208

export function GroupPlanningView({ group, stages, initialPlans, sunTimes }: GroupPlanningViewProps) {
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const isDragging = useRef(false)

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY)
    if (!token) return
    const found = group.members.find((m) => m.session_token === token)
    if (found) {
      setCurrentMember(found)
      addCrewCode(group.code)
    }
  }, [group.members, group.code])

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
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'members' },
        (payload) => {
          const updated = payload.new as Member
          if (updated.group_id !== group.id) return
          setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
          setCurrentMember((prev) => (prev?.id === updated.id ? updated : prev))
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
      addCrewCode(group.code)
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
      addCrewCode(group.code)
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
      addCrewCode(group.code)
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
    <div className="flex h-[calc(100vh-57px)] overflow-hidden relative">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile: persistent open-tab when sidebar is closed */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-10 w-5 bg-background border border-l-0 border-border rounded-r-lg shadow-sm hover:bg-accent transition-colors"
          aria-label="Open crew sidebar"
        >
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'z-40 bg-background border-r border-border',
          isMobile
            ? cn(
                'fixed top-[57px] left-0 bottom-0 w-72 flex flex-col shadow-xl transition-transform duration-200',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
              )
            : cn(
                'relative shrink-0 transition-[width] duration-200',
                !sidebarOpen && 'border-r-0',
              ),
        )}
        style={!isMobile ? { width: sidebarOpen ? sidebarWidth : 0 } : undefined}
      >
        {/* Inner scroll container */}
        <div className={isMobile ? 'flex flex-col flex-1 overflow-hidden' : 'absolute inset-0 flex flex-col overflow-hidden'}>
          <div className="flex-1 overflow-y-auto p-4 min-h-0 min-w-[180px]">
            <GroupSidebar
              groupName={group.name}
              groupCode={group.code}
              members={members}
              currentMember={currentMember}
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

        {/* Edge toggle tab */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="absolute right-0 top-6 translate-x-full z-20 flex items-center justify-center h-8 w-5 bg-background border border-l-0 border-border rounded-r-lg shadow-sm hover:bg-accent transition-colors"
          aria-label={sidebarOpen ? 'Collapse crew sidebar' : 'Expand crew sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Drag handle - desktop only, only when open */}
      {!isMobile && sidebarOpen && (
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-primary/40 active:bg-primary/60 transition-colors"
          onMouseDown={handleDragStart}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="shrink-0 bg-background px-4 pt-3 pb-3 border-b border-border flex items-center justify-center gap-3">
          <FestivalLogo
            lightUrl={group.events.image_url}
            darkUrl={group.events.image_url_dark}
            alt={group.events.name}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain bg-muted shrink-0"
          />
          <div className="min-w-0 text-left">
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate leading-tight"
              style={getFontStyle(group.events.font)}
            >
              {group.events.name}
            </h2>
            <p className="text-xs text-muted-foreground/70">
              {formatEventDates(group.events.date_start, group.events.date_end)}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-2 py-4">
          <LineupGrid
            stages={stages}
            plans={plans}
            currentMemberId={currentMember.id}
            memberName={currentMember.name}
            logoUrl={group.events.image_url_dark ?? group.events.image_url}
            timezone={(group as any).events?.timezone ?? 'UTC'}
            sunTimes={sunTimes}
            onToggle={handleToggle}
          />
        </div>
      </div>
    </div>
  )
}
