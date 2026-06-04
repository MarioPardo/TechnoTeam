'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

export async function createPerformance(stageId: string, eventId: string, formData: FormData) {
  const artist = formData.get('artist') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string
  const description = formData.get('description') as string

  const { error } = await supabase.from('performances').insert({
    stage_id: stageId,
    artist,
    start_time,
    end_time,
    description: description || null,
  } as any)

  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}/manage`)
}

export async function deletePerformance(performanceId: string, eventId: string) {
  const { error } = await supabase.from('performances').delete().eq('id', performanceId)
  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}/manage`)
}
