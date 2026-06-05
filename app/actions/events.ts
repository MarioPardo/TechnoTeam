'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { Event } from '@/lib/types'

export async function createEvent(formData: FormData) {
  const name = formData.get('name') as string
  const date_start = formData.get('date_start') as string
  const date_end = formData.get('date_end') as string
  const location = formData.get('location') as string
  const timezone = (formData.get('timezone') as string) || 'UTC'
  const description = formData.get('description') as string
  const image_url = formData.get('image_url') as string

  const { data, error } = await supabase
    .from('events')
    .insert({ name, date_start, date_end, location, timezone, description: description || null, image_url: image_url || null } as any)
    .select()
    .single()

  if (error) throw new Error(error.message)

  redirect(`/events/${(data as any).id}/manage`)
}

export async function updateEvent(
  id: string,
  data: {
    image_url?: string | null
    image_url_dark?: string | null
    description?: string | null
    links?: Array<{ label: string; url: string }>
  },
) {
  const { error } = await supabase
    .from('events')
    .update(data as any)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/events/${id}`)
  revalidatePath(`/events/${id}/manage`)
}

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date_start', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Event[]
}

export async function getEvent(id: string): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as Event
}
