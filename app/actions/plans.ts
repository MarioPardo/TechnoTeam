'use server'

import { supabase } from '@/lib/supabase'
import { Plan, Member } from '@/lib/types'

export async function togglePlan(memberId: string, performanceId: string) {
  const { data: existing } = await supabase
    .from('plans')
    .select('id')
    .eq('member_id', memberId)
    .eq('performance_id', performanceId)
    .maybeSingle()

  if (existing) {
    const row = existing as { id: string }
    const { error } = await supabase.from('plans').delete().eq('id', row.id)
    if (error) throw new Error(error.message)
    return { action: 'removed' as const }
  } else {
    const { error } = await supabase.from('plans').insert({ member_id: memberId, performance_id: performanceId } as any)
    if (error) throw new Error(error.message)
    return { action: 'added' as const }
  }
}

export async function getPlansForGroup(groupId: string): Promise<(Plan & { members: Member })[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*, members!inner(*, group_id)')
    .eq('members.group_id', groupId)

  if (error) throw new Error(error.message)
  return (data ?? []) as (Plan & { members: Member })[]
}
