'use server'

import { supabase } from '@/lib/supabase'
import { Message } from '@/lib/types'

export async function sendMessage(groupId: string, memberId: string, content: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ group_id: groupId, member_id: memberId, content } as any)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Message
}

export async function getMessages(groupId: string): Promise<(Message & { members: { id: string; name: string } })[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, members(id, name)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return []
  return (data ?? []) as any
}
