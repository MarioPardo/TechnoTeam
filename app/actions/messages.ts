'use server'

import { supabaseServer } from '@/lib/supabase-server'
import { Message } from '@/lib/types'

export async function sendMessage(groupId: string, memberId: string, content: string, sessionToken: string): Promise<Message> {
  const { data: member } = await supabaseServer
    .from('members')
    .select('id, session_token')
    .eq('id', memberId)
    .single()

  if (!member || (member as any).session_token !== sessionToken) throw new Error('Unauthorized')

  const { data, error } = await supabaseServer
    .from('messages')
    .insert({ group_id: groupId, member_id: memberId, content } as any)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Message
}

export async function getMessages(groupId: string): Promise<(Message & { members: { id: string; name: string } })[]> {
  const { data, error } = await supabaseServer
    .from('messages')
    .select('*, members(id, name)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return []
  return (data ?? []) as any
}
