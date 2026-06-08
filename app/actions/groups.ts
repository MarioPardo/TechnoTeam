'use server'

import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateGroupCode } from '@/lib/generate-code'
import { Group, Member } from '@/lib/types'

export async function createGroup(eventId: string, formData: FormData) {
  const name = formData.get('name') as string

  let code: string = generateGroupCode()
  let attempts = 0

  while (attempts < 10) {
    const { data } = await supabase.from('groups').select('id').eq('code', code).maybeSingle()
    if (!data) break
    code = generateGroupCode()
    attempts++
  }

  const { error } = await supabase.from('groups').insert({ event_id: eventId, name, code } as any)
  if (error) throw new Error(error.message)

  redirect(`/groups/${code}`)
}

const MEMBER_COLS = 'id, group_id, name, session_token, color, created_at'

export async function getGroupByCode(code: string): Promise<(Group & { members: Member[] }) | null> {
  const { data, error } = await supabase
    .from('groups')
    .select(`*, members(${MEMBER_COLS})`)
    .eq('code', code)
    .single()

  if (error) return null
  return data as Group & { members: Member[] }
}

export async function getGroupWithEvent(code: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`*, members(${MEMBER_COLS}), events(*)`)
    .eq('code', code)
    .single()

  if (error) return null
  return data as any
}

export async function getGroupsByCodes(codes: string[]) {
  if (codes.length === 0) return []
  const { data } = await supabase
    .from('groups')
    .select(`id, name, code, event_id, events(*)`)
    .in('code', codes)
  return (data ?? []) as any[]
}
