'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { isManageUnlocked } from '@/app/actions/auth'

type LineupEntry = {
  stage: string
  artist: string
  date: string       // YYYY-MM-DD
  start: string      // HH:MM  24h
  end: string        // HH:MM  24h — if end < start, wraps to next day
  note?: string
  day_label?: string // optional custom label for the day tab (e.g. "Pre Party")
}

const AUTO_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#f97316', '#8b5cf6', '#14b8a6',
]

function toUTCISO(date: string, time: string, nextDay: boolean, tz: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const [h, m] = time.split(':').map(Number)
  const actualDay = nextDay ? day + 1 : day

  const approx = Date.UTC(year, month - 1, actualDay, h, m, 0)

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(approx))

  const get = (type: string) => parseInt(parts.find(p => p.type === type)!.value)
  const tzHour = get('hour') % 24
  const tzWall = Date.UTC(get('year'), get('month') - 1, get('day'), tzHour, get('minute'))

  return new Date(approx - (tzWall - approx)).toISOString()
}

export type ImportResult = { added: number; skipped: string[]; errors: string[] }

export async function importLineupJSON(eventId: string, json: string): Promise<ImportResult> {
  if (!(await isManageUnlocked())) throw new Error('Unauthorized')

  const { data: eventData } = await supabaseServer
    .from('events')
    .select('timezone')
    .eq('id', eventId)
    .single()
  const timezone = (eventData as { timezone: string } | null)?.timezone ?? 'UTC'

  const { data: labelsData } = await supabaseServer
    .from('events')
    .select('day_labels')
    .eq('id', eventId)
    .single()
  const existingDayLabels: Record<string, string> = (labelsData as { day_labels: Record<string, string> } | null)?.day_labels ?? {}

  let entries: LineupEntry[]
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) throw new Error('Expected a JSON array at the top level')
    entries = parsed
  } catch (e) {
    throw new Error(`Invalid JSON — ${(e as Error).message}`)
  }

  const { data: existingStages } = await supabaseServer
    .from('stages')
    .select('id, name, order_index, color')
    .eq('event_id', eventId)
    .order('order_index', { ascending: false })

  const rows = (existingStages ?? []) as { id: string; name: string; order_index: number }[]
  const stageByName = new Map<string, string>()
  let nextOrder = rows.length > 0 ? rows[0].order_index + 1 : 0
  for (const s of rows) stageByName.set(s.name.toLowerCase(), s.id)

  const stageIds = rows.map((s) => s.id)
  const { data: existingPerfs } = stageIds.length > 0
    ? await supabaseServer.from('performances').select('stage_id, artist, start_time, end_time').in('stage_id', stageIds)
    : { data: [] as { stage_id: string; artist: string; start_time: string; end_time: string }[] }
  const seen = new Set<string>(
    ((existingPerfs ?? []) as { stage_id: string; artist: string; start_time: string; end_time: string }[]).map(
      (p) => `${p.stage_id}::${p.artist.trim().toLowerCase()}::${p.start_time}::${p.end_time}`,
    ),
  )

  let colorCursor = rows.length % AUTO_COLORS.length
  const errors: string[] = []
  const skipped: string[] = []
  let added = 0
  const collectedDayLabels: Record<string, string> = {}

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    const label = `Entry ${i + 1}${e.artist ? ` (${e.artist})` : ''}`

    if (!e.stage || !e.artist || !e.date || !e.start || !e.end) {
      errors.push(`${label}: missing field — need stage, artist, date, start, end`)
      continue
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
      errors.push(`${label}: date must be YYYY-MM-DD, got "${e.date}"`)
      continue
    }
    if (!/^\d{2}:\d{2}$/.test(e.start) || !/^\d{2}:\d{2}$/.test(e.end)) {
      errors.push(`${label}: start/end must be HH:MM, got "${e.start}" / "${e.end}"`)
      continue
    }

    if (e.day_label?.trim()) {
      collectedDayLabels[e.date] = e.day_label.trim()
    }

    const key = e.stage.trim().toLowerCase()
    let stageId = stageByName.get(key)
    if (!stageId) {
      const color = AUTO_COLORS[colorCursor % AUTO_COLORS.length]
      colorCursor++
      const { data, error } = await supabaseServer
        .from('stages')
        .insert({ event_id: eventId, name: e.stage.trim(), order_index: nextOrder++, color } as any)
        .select('id')
        .single()
      if (error || !data) { errors.push(`${label}: could not create stage "${e.stage}"`); continue }
      stageId = (data as { id: string }).id
      stageByName.set(key, stageId)
    }

    const [sh, sm] = e.start.split(':').map(Number)
    const [eh, em] = e.end.split(':').map(Number)
    const wrapDay = eh * 60 + em < sh * 60 + sm

    const startISO = toUTCISO(e.date, e.start, false, timezone)
    const endISO = toUTCISO(e.date, e.end, wrapDay, timezone)
    const dedupeKey = `${stageId}::${e.artist.trim().toLowerCase()}::${startISO}::${endISO}`

    if (seen.has(dedupeKey)) {
      skipped.push(`${label}: already on "${e.stage.trim()}" at this exact time — skipped`)
      continue
    }

    const { error: pErr } = await supabaseServer.from('performances').insert({
      stage_id: stageId,
      artist: e.artist.trim(),
      start_time: startISO,
      end_time: endISO,
      description: e.note?.trim() || null,
    } as any)

    if (pErr) errors.push(`${label}: ${pErr.message}`)
    else { added++; seen.add(dedupeKey) }
  }

  if (Object.keys(collectedDayLabels).length > 0) {
    const merged = { ...existingDayLabels, ...collectedDayLabels }
    await supabaseServer.from('events').update({ day_labels: merged } as any).eq('id', eventId)
  }

  revalidatePath(`/events/${eventId}/manage`)
  return { added, skipped, errors }
}
