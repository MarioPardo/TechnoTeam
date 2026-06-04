'use server'

import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Event } from '@/lib/types'

export async function createEvent(formData: FormData) {
  const name = formData.get('name') as string
  const date_start = formData.get('date_start') as string
  const date_end = formData.get('date_end') as string
  const location = formData.get('location') as string
  const description = formData.get('description') as string

  const { data, error } = await supabase
    .from('events')
    .insert({ name, date_start, date_end, location, description: description || null } as any)
    .select()
    .single()

  if (error) throw new Error(error.message)

  redirect(`/events/${(data as any).id}/manage`)
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
