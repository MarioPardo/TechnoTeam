'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { localInputToUTC } from '@/lib/tz'

async function getEventTimezone(eventId: string): Promise<string> {
  const { data } = await supabase.from('events').select('timezone').eq('id', eventId).single()
  return (data as { timezone: string } | null)?.timezone ?? 'UTC'
}

export async function createPerformance(stageId: string, eventId: string, formData: FormData) {
  const artist = formData.get('artist') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string
  const description = formData.get('description') as string

  const tz = await getEventTimezone(eventId)

  const { error } = await supabase.from('performances').insert({
    stage_id: stageId,
    artist,
    start_time: localInputToUTC(start_time, tz),
    end_time: localInputToUTC(end_time, tz),
    description: description || null,
  } as any)

  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}/manage`)
}

export async function updatePerformance(
  perfId: string,
  eventId: string,
  data: { artist: string; start_time: string; end_time: string; description: string | null },
) {
  const tz = await getEventTimezone(eventId)

  const { error } = await supabase
    .from('performances')
    .update({
      artist: data.artist,
      start_time: localInputToUTC(data.start_time, tz),
      end_time: localInputToUTC(data.end_time, tz),
      description: data.description || null,
    } as any)
    .eq('id', perfId)

  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}/manage`)
}

export async function deletePerformance(performanceId: string, eventId: string) {
  const { error } = await supabase.from('performances').delete().eq('id', performanceId)
  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}/manage`)
}
