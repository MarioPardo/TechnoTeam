'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { isManageUnlocked } from '@/app/actions/auth'
import { Performance } from '@/lib/types'

export type DuplicateGroup = {
  stageId: string
  stageName: string
  artist: string
  start_time: string
  end_time: string
  keeper: { id: string; planCount: number }
  duplicates: { id: string; planCount: number }[]
}

export type MergeResult = {
  groupsMerged: number
  performancesRemoved: number
  plansMoved: number
}

function dupKey(stageId: string, artist: string, start: string, end: string) {
  return `${stageId}::${artist.trim().toLowerCase()}::${start}::${end}`
}

async function computeDuplicateGroups(eventId: string): Promise<DuplicateGroup[]> {
  const { data: stages, error: stagesErr } = await supabaseServer
    .from('stages')
    .select('id, name')
    .eq('event_id', eventId)
  if (stagesErr) throw new Error(stagesErr.message)

  const stageRows = (stages ?? []) as { id: string; name: string }[]
  const stageIds = stageRows.map((s) => s.id)
  if (stageIds.length === 0) return []
  const stageName = new Map(stageRows.map((s) => [s.id, s.name]))

  const { data: perfs, error: perfErr } = await supabaseServer
    .from('performances')
    .select('id, stage_id, artist, start_time, end_time, created_at')
    .in('stage_id', stageIds)
  if (perfErr) throw new Error(perfErr.message)

  const perfRows = (perfs ?? []) as Performance[]
  if (perfRows.length === 0) return []

  const { data: plans, error: plansErr } = await supabaseServer
    .from('plans')
    .select('performance_id')
    .in('performance_id', perfRows.map((p) => p.id))
  if (plansErr) throw new Error(plansErr.message)

  const planCount = new Map<string, number>()
  for (const row of (plans ?? []) as { performance_id: string }[]) {
    planCount.set(row.performance_id, (planCount.get(row.performance_id) ?? 0) + 1)
  }

  const groups = new Map<string, Performance[]>()
  for (const p of perfRows) {
    const key = dupKey(p.stage_id, p.artist, p.start_time, p.end_time)
    const list = groups.get(key) ?? []
    list.push(p)
    groups.set(key, list)
  }

  const result: DuplicateGroup[] = []
  for (const list of groups.values()) {
    if (list.length < 2) continue
    // Oldest row is the keeper, so whichever set people already started
    // selecting first stays put — later duplicates merge into it.
    const sorted = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const [keeperRow, ...dupRows] = sorted
    result.push({
      stageId: keeperRow.stage_id,
      stageName: stageName.get(keeperRow.stage_id) ?? 'Unknown stage',
      artist: keeperRow.artist,
      start_time: keeperRow.start_time,
      end_time: keeperRow.end_time,
      keeper: { id: keeperRow.id, planCount: planCount.get(keeperRow.id) ?? 0 },
      duplicates: dupRows.map((d) => ({ id: d.id, planCount: planCount.get(d.id) ?? 0 })),
    })
  }
  return result
}

export async function findDuplicatePerformances(eventId: string): Promise<DuplicateGroup[]> {
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')
  return computeDuplicateGroups(eventId)
}

export async function mergeDuplicatePerformances(eventId: string): Promise<MergeResult> {
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')

  const groups = await computeDuplicateGroups(eventId)
  let plansMoved = 0
  let performancesRemoved = 0

  for (const group of groups) {
    const dupIds = group.duplicates.map((d) => d.id)
    if (dupIds.length === 0) continue

    const { data: keeperPlans, error: kErr } = await supabaseServer
      .from('plans')
      .select('member_id')
      .eq('performance_id', group.keeper.id)
    if (kErr) throw new Error(kErr.message)

    const { data: dupPlans, error: dErr } = await supabaseServer
      .from('plans')
      .select('id, member_id')
      .in('performance_id', dupIds)
    if (dErr) throw new Error(dErr.message)

    // A member keeps at most one selection on the merged set: skip moving a
    // duplicate's plan if they already picked the keeper (or another
    // duplicate in this same group) — the unique(member_id, performance_id)
    // constraint would otherwise reject the move.
    const claimedMembers = new Set(((keeperPlans ?? []) as { member_id: string }[]).map((p) => p.member_id))
    const movableIds: string[] = []
    for (const plan of (dupPlans ?? []) as { id: string; member_id: string }[]) {
      if (claimedMembers.has(plan.member_id)) continue
      claimedMembers.add(plan.member_id)
      movableIds.push(plan.id)
    }

    if (movableIds.length > 0) {
      const { error: moveErr } = await supabaseServer
        .from('plans')
        .update({ performance_id: group.keeper.id } as any)
        .in('id', movableIds)
      if (moveErr) throw new Error(moveErr.message)
      plansMoved += movableIds.length
    }

    // Cascades and removes any plans rows left on the duplicates — those are
    // exactly the ones whose member already has the selection on the keeper.
    const { error: delErr } = await supabaseServer.from('performances').delete().in('id', dupIds)
    if (delErr) throw new Error(delErr.message)
    performancesRemoved += dupIds.length
  }

  revalidatePath(`/events/${eventId}/manage`)
  return { groupsMerged: groups.length, performancesRemoved, plansMoved }
}
