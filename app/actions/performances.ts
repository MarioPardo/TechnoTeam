'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { localInputToUTC } from '@/lib/tz'
import { isManageUnlocked } from '@/app/actions/auth'

async function getEventTimezone(eventId: string): Promise<string> {
  const { data } = await supabaseServer.from('events').select('timezone').eq('id', eventId).single()
  return (data as { timezone: string } | null)?.timezone ?? 'UTC'
}

export async function createPerformance(stageId: string, eventId: string, formData: FormData) {
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')

  const artist = formData.get('artist') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string
  const description = formData.get('description') as string

  const tz = await getEventTimezone(eventId)
  const start = localInputToUTC(start_time, tz)
  const end = localInputToUTC(end_time, tz)

  const { data: sameSlot, error: dupErr } = await supabaseServer
    .from('performances')
    .select('artist')
    .eq('stage_id', stageId)
    .eq('start_time', start)
    .eq('end_time', end)
  if (dupErr) throw new Error(dupErr.message)
  const isDuplicate = ((sameSlot ?? []) as { artist: string }[]).some(
    (p) => p.artist.trim().toLowerCase() === artist.trim().toLowerCase(),
  )
  if (isDuplicate) throw new Error(`"${artist.trim()}" is already on this stage at this exact time.`)

  const { error } = await supabaseServer.from('performances').insert({
    stage_id: stageId,
    artist,
    start_time: start,
    end_time: end,
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
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')

  const tz = await getEventTimezone(eventId)

  const { error } = await supabaseServer
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
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')

  const { error } = await supabaseServer.from('performances').delete().eq('id', performanceId)
  if (error) throw new Error(error.message)
  revalidatePath(`/events/${eventId}/manage`)
}
