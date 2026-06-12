'use server'

import { supabaseServer } from '@/lib/supabase-server'
import { Plan, Member } from '@/lib/types'

export async function togglePlan(memberId: string, performanceId: string, sessionToken: string) {
  const { data: member } = await supabaseServer
    .from('members')
    .select('id, session_token')
    .eq('id', memberId)
    .single()

  if (!member || (member as any).session_token !== sessionToken) throw new Error('Unauthorized')

  const { data: existing } = await supabaseServer
    .from('plans')
    .select('id')
    .eq('member_id', memberId)
    .eq('performance_id', performanceId)
    .maybeSingle()

  if (existing) {
    const row = existing as { id: string }
    const { error } = await supabaseServer.from('plans').delete().eq('id', row.id)
    if (error) throw new Error(error.message)
    return { action: 'removed' as const }
  } else {
    const { error } = await supabaseServer.from('plans').insert({ member_id: memberId, performance_id: performanceId } as any)
    if (error) throw new Error(error.message)
    return { action: 'added' as const }
  }
}

export async function getPlansForGroup(groupId: string): Promise<(Plan & { members: Member })[]> {
  const { data, error } = await supabaseServer
    .from('plans')
    .select('*, members!inner(*, group_id)')
    .eq('members.group_id', groupId)

  if (error) throw new Error(error.message)
  return (data ?? []) as (Plan & { members: Member })[]
}
