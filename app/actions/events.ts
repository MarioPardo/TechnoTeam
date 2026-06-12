'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createHash } from 'crypto'
import { supabaseServer } from '@/lib/supabase-server'
import { Event } from '@/lib/types'
import { slugify } from '@/lib/utils'
import { isManageUnlocked } from '@/app/actions/auth'

export async function createEvent(formData: FormData) {
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const date_start = formData.get('date_start') as string
  const date_end = formData.get('date_end') as string
  const location = formData.get('location') as string
  const timezone = (formData.get('timezone') as string) || 'UTC'
  const description = formData.get('description') as string
  const password = (formData.get('password') as string)?.trim()

  const password_hash = password
    ? createHash('sha256').update(password).digest('hex')
    : null

  let image_url: string | null = null
  const imageFile = formData.get('image_file') as File | null
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'png'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const bytes = new Uint8Array(await imageFile.arrayBuffer())
    const { error: uploadError } = await supabaseServer.storage
      .from('event-images')
      .upload(filename, bytes, { contentType: imageFile.type })
    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`)
    image_url = supabaseServer.storage.from('event-images').getPublicUrl(filename).data.publicUrl
  }

  const { data, error } = await supabaseServer
    .from('events')
    .insert({ name, date_start, date_end, location, timezone, description: description || null, image_url, password_hash } as any)
    .select()
    .single()

  if (error) throw new Error(error.message)

  redirect(`/events/${(data as any).id}/manage`)
}

export async function updateEvent(
  id: string,
  data: {
    name?: string
    image_url?: string | null
    image_url_dark?: string | null
    description?: string | null
    links?: Array<{ label: string; url: string }>
    font?: string | null
    location?: string
    timezone?: string
  },
) {
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')

  const { error } = await supabaseServer
    .from('events')
    .update(data as any)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/events/${id}`)
  revalidatePath(`/events/${id}/manage`)
}

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabaseServer
    .from('events')
    .select('*')
    .order('date_start', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Event[]
}

export async function getEvent(id: string): Promise<Event> {
  const { data, error } = await supabaseServer
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as Event
}

export async function getEventBySlugOrId(slugOrId: string): Promise<Event | null> {
  const { data: byId } = await supabaseServer
    .from('events')
    .select('*')
    .eq('id', slugOrId)
    .maybeSingle()

  if (byId) return byId as Event

  const { data: all } = await supabaseServer.from('events').select('*')
  if (!all) return null

  return (all as Event[]).find((e) => slugify(e.name) === slugOrId) ?? null
}
