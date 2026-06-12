'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { Stage, Performance } from '@/lib/types'
import { isManageUnlocked } from '@/app/actions/auth'

export async function createStage(eventId: string, formData: FormData) {
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const color = (formData.get('color') as string) || null

  const { data: existing } = await supabaseServer
    .from('stages')
    .select('order_index')
    .eq('event_id', eventId)
    .order('order_index', { ascending: false })
    .limit(1)

  const rows = (existing ?? []) as { order_index: number }[]
  const order_index = rows.length > 0 ? rows[0].order_index + 1 : 0

  const { error } = await supabaseServer
    .from('stages')
    .insert({ event_id: eventId, name, order_index, color } as any)

  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}/manage`)
}

export async function updateStageColor(stageId: string, eventId: string, color: string) {
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')

  const { error } = await supabaseServer
    .from('stages')
    .update({ color } as any)
    .eq('id', stageId)
  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}/manage`)
}

export async function deleteStage(stageId: string, eventId: string) {
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')

  const { error } = await supabaseServer.from('stages').delete().eq('id', stageId)
  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}/manage`)
}

export async function reorderStages(eventId: string, orderedIds: string[]) {
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')

  await Promise.all(
    orderedIds.map((id, index) =>
      supabaseServer.from('stages').update({ order_index: index } as any).eq('id', id),
    ),
  )
  revalidatePath(`/events/${eventId}/manage`)
}

export async function getStagesWithPerformances(eventId: string): Promise<(Stage & { performances: Performance[] })[]> {
  const { data, error } = await supabaseServer
    .from('stages')
    .select(`*, performances (*)`)
    .eq('event_id', eventId)
    .order('order_index', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as (Stage & { performances: Performance[] })[]
}
