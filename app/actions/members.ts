'use server'

import { supabase } from '@/lib/supabase'
import { Member } from '@/lib/types'

export async function joinGroup(groupId: string, name: string, sessionToken: string): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .insert({ group_id: groupId, name, session_token: sessionToken } as any)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Member
}

export async function getMemberByToken(sessionToken: string): Promise<Member | null> {
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('session_token', sessionToken)
    .maybeSingle()

  return data as Member | null
}
