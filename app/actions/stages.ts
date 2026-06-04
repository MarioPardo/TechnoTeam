'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { Stage, Performance } from '@/lib/types'

export async function createStage(eventId: string, formData: FormData) {
  const name = formData.get('name') as string

  const { data: existing } = await supabase
    .from('stages')
    .select('order_index')
    .eq('event_id', eventId)
    .order('order_index', { ascending: false })
    .limit(1)

  const rows = (existing ?? []) as { order_index: number }[]
  const order_index = rows.length > 0 ? rows[0].order_index + 1 : 0

  const { error } = await supabase
    .from('stages')
    .insert({ event_id: eventId, name, order_index } as any)

  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}/manage`)
}

export async function deleteStage(stageId: string, eventId: string) {
  const { error } = await supabase.from('stages').delete().eq('id', stageId)
  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}/manage`)
}

export async function getStagesWithPerformances(eventId: string): Promise<(Stage & { performances: Performance[] })[]> {
  const { data, error } = await supabase
    .from('stages')
    .select(`*, performances (*)`)
    .eq('event_id', eventId)
    .order('order_index', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as (Stage & { performances: Performance[] })[]
}
