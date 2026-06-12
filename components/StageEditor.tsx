'use client'

import React, { useMemo, useState, useTransition } from 'react'
import { createStage, deleteStage, updateStageColor, reorderStages } from '@/app/actions/stages'
import { createPerformance, updatePerformance, deletePerformance } from '@/app/actions/performances'
import { importLineupJSON, type ImportResult } from '@/app/actions/importLineup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Stage, Performance } from '@/lib/types'

type StageWithPerfs = Stage & { performances: Performance[] }

const PX_PER_MIN = 2

function toMinutes(iso: string) {
  return new Date(iso).getTime() / 60000
}

function toDateKey(iso: string, tz: string) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz })
}

function fmtTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' })
}

// Converts a UTC ISO string to "YYYY-MM-DDTHH:MM" in the given timezone for datetime-local inputs
function toLocalInput(iso: string, tz: string): string {
  return new Date(iso).toLocaleString('sv-SE', { timeZone: tz }).replace(' ', 'T').slice(0, 16)
}

function EditorPerfCard({
  perf,
  eventId,
  stageColor,
  timezone,
  onEdit,
}: {
  perf: Performance
  eventId: string
  stageColor: string | null
  timezone: string
  onEdit: (perf: Performance) => void
}) {
  const [, startDelete] = useTransition()
  const durationMin = Math.round(
    (new Date(perf.end_time).getTime() - new Date(perf.start_time).getTime()) / 60000,
  )
  const compact = durationMin < 35

  const cardStyle = stageColor
    ? { backgroundColor: `${stageColor}1a`, borderColor: `${stageColor}60` }
    : undefined

  return (
    <div
      className={`relative w-full h-full rounded-xl border px-2 py-1.5 overflow-hidden ${
        stageColor ? '' : 'bg-muted/60 border-border'
      }`}
      style={cardStyle}
    >
      <div className={`font-semibold text-foreground truncate pr-10 ${compact ? 'text-xs' : 'text-sm'}`}>
        {perf.artist}
      </div>
      {!compact && (
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {fmtTime(perf.start_time, timezone)} – {fmtTime(perf.end_time, timezone)}
        </div>
      )}
      <button
        onClick={() => onEdit(perf)}
        className="absolute top-0.5 right-6 w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-muted transition-colors"
        title="Edit"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        </svg>
      </button>
      <button
        onClick={() => startDelete(async () => { await deletePerformance(perf.id, eventId) })}
        className="absolute top-0.5 right-0.5 w-5 h-5 rounded flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:bg-muted text-sm leading-none transition-colors"
        title="Delete"
      >
        ×
      </button>
    </div>
  )
}

function AddPerformanceForm({
  stageId,
  stageName,
  eventId,
  onDone,
}: {
  stageId: string
  stageName: string
  eventId: string
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createPerformance(stageId, eventId, formData)
      onDone()
    })
  }

  return (
    <div className="mt-4 bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-foreground">Add set — {stageName}</span>
        <button onClick={onDone} className="text-muted-foreground hover:text-foreground text-xs transition-colors">Cancel</button>
      </div>
      <form action={handleSubmit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">Artist</Label>
          <Input name="artist" placeholder="Artist name" required autoFocus className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Start time</Label>
          <Input name="start_time" type="datetime-local" required className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">End time</Label>
          <Input name="end_time" type="datetime-local" required className="mt-1 h-9 text-sm" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">Note <span className="text-muted-foreground/50">(optional)</span></Label>
          <Input name="description" placeholder="e.g. Closing set" className="mt-1 h-9 text-sm" />
        </div>
        <div className="col-span-2 flex justify-end gap-2 mt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
          <Button type="submit" size="sm" disabled={pending}>{pending ? 'Adding…' : 'Add set'}</Button>
        </div>
      </form>
    </div>
  )
}

function EditPerformanceForm({
  perf,
  eventId,
  timezone,
  onDone,
}: {
  perf: Performance
  eventId: string
  timezone: string
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updatePerformance(perf.id, eventId, {
        artist: formData.get('artist') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        description: (formData.get('description') as string) || null,
      })
      onDone()
    })
  }

  return (
    <div className="mt-4 bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-foreground">Edit set</span>
        <button onClick={onDone} className="text-muted-foreground hover:text-foreground text-xs transition-colors">Cancel</button>
      </div>
      <form action={handleSubmit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">Artist</Label>
          <Input name="artist" defaultValue={perf.artist} required autoFocus className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Start time</Label>
          <Input name="start_time" type="datetime-local" defaultValue={toLocalInput(perf.start_time, timezone)} required className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">End time</Label>
          <Input name="end_time" type="datetime-local" defaultValue={toLocalInput(perf.end_time, timezone)} required className="mt-1 h-9 text-sm" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">Note <span className="text-muted-foreground/50">(optional)</span></Label>
          <Input name="description" defaultValue={perf.description ?? ''} placeholder="e.g. Closing set" className="mt-1 h-9 text-sm" />
        </div>
        <div className="col-span-2 flex justify-end gap-2 mt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
          <Button type="submit" size="sm" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>
    </div>
  )
}

type DragHandlers = {
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
  isDragging: boolean
  isDragOver: boolean
}

function StageHeaderCell({
  stage,
  eventId,
  dragHandlers,
}: {
  stage: StageWithPerfs
  eventId: string
  dragHandlers: DragHandlers
}) {
  const [, startDelete] = useTransition()
  const [, startColorUpdate] = useTransition()
  const [color, setColor] = useState(stage.color ?? '#6366f1')

  return (
    <div
      draggable
      onDragStart={dragHandlers.onDragStart}
      onDragOver={dragHandlers.onDragOver}
      onDrop={dragHandlers.onDrop}
      onDragEnd={dragHandlers.onDragEnd}
      className={`flex-1 min-w-[180px] border-l border-border px-2 py-2 flex items-center gap-1.5 cursor-grab select-none transition-opacity ${
        dragHandlers.isDragging ? 'opacity-40' : dragHandlers.isDragOver ? 'bg-muted/60' : ''
      }`}
      style={stage.color ? { borderBottom: `3px solid ${stage.color}` } : {}}
    >
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        onBlur={(e) => {
          const val = e.target.value
          startColorUpdate(async () => { await updateStageColor(stage.id, eventId, val) })
        }}
        className="w-5 h-5 rounded cursor-pointer p-0 border-0 bg-transparent shrink-0"
        title="Stage color"
      />
      <span className="flex-1 text-sm font-semibold text-foreground truncate">{stage.name}</span>
      <button
        onClick={() => startDelete(async () => { await deleteStage(stage.id, eventId) })}
        className="text-muted-foreground/50 hover:text-destructive text-xs shrink-0 ml-1 transition-colors"
        title="Delete stage"
      >
        Delete
      </button>
    </div>
  )
}

const LLM_PROMPT = `Given a festival lineup image, output a JSON array — one object per set:

[
  {
    "stage": "Stage name",
    "artist": "Artist name",
    "date": "YYYY-MM-DD",
    "start": "HH:MM",
    "end": "HH:MM",
    "note": "optional extra info"
  }
]

Rules:
- Use 24-hour time for start/end (e.g. "23:30", "01:00").
- Times are local festival time — use exactly what is printed on the lineup.
- If a set ends after midnight, keep the original date for both start and end — the end time will auto-wrap to the next day.
- Omit "note" if there is nothing extra to say.
- Output only the raw JSON array, no explanation.`

export function StageEditor({
  eventId,
  initialStages,
  timezone,
}: {
  eventId: string
  initialStages: StageWithPerfs[]
  timezone: string
}) {
  const [selectedDay, setSelectedDay] = useState('')
  const [addingToStage, setAddingToStage] = useState<{ id: string; name: string } | null>(null)
  const [editingPerf, setEditingPerf] = useState<Performance | null>(null)
  const [showAddStage, setShowAddStage] = useState(false)
  const [pending, startTransition] = useTransition()
  const [, startReorder] = useTransition()

  const [stageOrder, setStageOrder] = useState<string[]>(() => initialStages.map((s) => s.id))
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const orderedInitialStages = useMemo(
    () => stageOrder.map((id) => initialStages.find((s) => s.id === id)).filter(Boolean) as StageWithPerfs[],
    [stageOrder, initialStages],
  )

  function handleColumnDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }
    const next = [...stageOrder]
    const from = next.indexOf(draggedId)
    const to = next.indexOf(targetId)
    next.splice(from, 1)
    next.splice(to, 0, draggedId)
    setStageOrder(next)
    setDraggedId(null)
    setDragOverId(null)
    startReorder(async () => { await reorderStages(eventId, next) })
  }

  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, startImport] = useTransition()

  function handleImport() {
    startImport(async () => {
      const result = await importLineupJSON(eventId, importJson)
      setImportResult(result)
      if (result.added > 0 && result.errors.length === 0) {
        setImportJson('')
      }
    })
  }

  function closeImport() {
    setShowImport(false)
    setImportResult(null)
    setImportJson('')
  }

  const allPerfs = initialStages.flatMap((s) => s.performances)

  const days = useMemo(() => {
    const dayMap = new Map<string, string>()
    for (const perf of allPerfs) {
      const key = toDateKey(perf.start_time, timezone)
      if (!dayMap.has(key)) {
        dayMap.set(key, new Date(perf.start_time).toLocaleDateString('en-GB', { timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long' }))
      }
    }
    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, label]) => ({ key, label }))
  }, [allPerfs, timezone])

  const activeDay = days.find((d) => d.key === selectedDay)?.key ?? days[0]?.key ?? ''

  const filteredStages = useMemo(
    () =>
      orderedInitialStages.map((s) => ({
        ...s,
        performances: s.performances.filter((p) => toDateKey(p.start_time, timezone) === activeDay),
      })),
    [orderedInitialStages, activeDay, timezone],
  )

  const { minTime, totalHeight, timeMarkers } = useMemo(() => {
    const dayPerfs = filteredStages.flatMap((s) => s.performances)
    if (dayPerfs.length === 0) return { minTime: 0, totalHeight: 0, timeMarkers: [] as { label: string; offset: number; isHour: boolean }[] }

    const min = Math.min(...dayPerfs.map((p) => toMinutes(p.start_time)))
    const max = Math.max(...dayPerfs.map((p) => toMinutes(p.end_time)))
    const minSlot = Math.floor(min / 30) * 30
    const maxSlot = Math.ceil(max / 30) * 30

    const markers = []
    for (let t = minSlot; t <= maxSlot; t += 30) {
      const label = new Date(t * 60000).toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })
      markers.push({
        label,
        offset: (t - minSlot) * PX_PER_MIN,
        isHour: label.endsWith(':00'),
      })
    }

    return { minTime: minSlot, totalHeight: (maxSlot - minSlot) * PX_PER_MIN, timeMarkers: markers }
  }, [filteredStages, timezone])

  const dayPerfs = filteredStages.flatMap((s) => s.performances)

  async function handleAddStage(formData: FormData) {
    startTransition(async () => {
      await createStage(eventId, formData)
      setShowAddStage(false)
    })
  }

  return (
    <div>
      {/* Day tabs + import button */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {days.map((day) => (
            <button
              key={day.key}
              onClick={() => setSelectedDay(day.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                activeDay === day.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowImport((v) => !v)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors shrink-0 ${
            showImport
              ? 'bg-muted border-border text-foreground'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
          }`}
        >
          Import JSON
        </button>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="mt-4 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Import lineup from JSON</h3>
            <button onClick={closeImport} className="text-muted-foreground hover:text-foreground text-lg leading-none transition-colors">×</button>
          </div>

          <details className="mb-4 group">
            <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground list-none flex items-center gap-1 transition-colors">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              LLM prompt &amp; format reference
            </summary>
            <div className="mt-2 bg-muted border border-border rounded-xl p-3 text-xs text-muted-foreground font-mono whitespace-pre">
              {LLM_PROMPT}
            </div>
          </details>

          <textarea
            value={importJson}
            onChange={(e) => { setImportJson(e.target.value); setImportResult(null) }}
            placeholder={'[{"stage":"Main Stage","artist":"Artist Name","date":"2024-07-05","start":"22:00","end":"00:30"}]\n\nTimes are local festival time — use exactly what is printed on the lineup.'}
            spellCheck={false}
            className="w-full h-52 bg-background border border-border rounded-xl p-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary placeholder:text-muted-foreground/50"
          />

          {importResult && (
            <div className="mt-3 space-y-1">
              {importResult.added > 0 && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {importResult.added} performance{importResult.added !== 1 ? 's' : ''} added successfully.
                </p>
              )}
              {importResult.errors.map((err, i) => (
                <p key={i} className="text-sm text-destructive">{err}</p>
              ))}
              {importResult.added === 0 && importResult.errors.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing to import.</p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" size="sm" onClick={closeImport}>Cancel</Button>
            <Button size="sm" disabled={importing || !importJson.trim()} onClick={handleImport}>
              {importing ? 'Importing…' : 'Import'}
            </Button>
          </div>
        </div>
      )}

      {/* Grid */}
      {initialStages.length > 0 && (
        <div className="overflow-x-auto">
          {/* Sticky header row */}
          <div className="flex min-w-full sticky top-0 z-20 bg-background border-b border-border">
            <div className="w-28 shrink-0" />
            {orderedInitialStages.map((stage) => (
              <StageHeaderCell
                key={stage.id}
                stage={stage}
                eventId={eventId}
                dragHandlers={{
                  onDragStart: () => setDraggedId(stage.id),
                  onDragOver: (e) => { e.preventDefault(); if (stage.id !== draggedId) setDragOverId(stage.id) },
                  onDrop: () => handleColumnDrop(stage.id),
                  onDragEnd: () => { setDraggedId(null); setDragOverId(null) },
                  isDragging: draggedId === stage.id,
                  isDragOver: dragOverId === stage.id,
                }}
              />
            ))}
          </div>

          {/* Timeline body */}
          {dayPerfs.length === 0 ? (
            <div className="flex min-w-full">
              <div className="w-28 shrink-0" />
              {orderedInitialStages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex-1 min-w-[180px] border-l border-border flex items-center justify-center py-16 text-muted-foreground/50 text-sm"
                >
                  No sets
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-w-full pt-4">
              {/* Time ruler */}
              <div className="w-28 shrink-0 relative" style={{ height: totalHeight }}>
                {timeMarkers.map((m) => (
                  <div
                    key={m.offset}
                    className={`absolute right-3 leading-none -translate-y-1/2 ${
                      m.isHour ? 'text-xs text-muted-foreground' : 'text-[10px] text-muted-foreground/50'
                    }`}
                    style={{ top: m.offset }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Stage columns */}
              {filteredStages.map((stage) => (
                <div
                  key={stage.id}
                  className="relative flex-1 min-w-[180px] border-l border-border"
                  style={{ height: totalHeight }}
                >
                  {timeMarkers.map((m) => (
                    <div
                      key={m.offset}
                      className={`absolute left-0 right-0 border-t ${
                        m.isHour ? 'border-border/60' : 'border-border/30'
                      }`}
                      style={{ top: m.offset }}
                    />
                  ))}

                  {stage.performances.map((perf) => {
                    const top = (toMinutes(perf.start_time) - minTime) * PX_PER_MIN
                    const height =
                      (toMinutes(perf.end_time) - toMinutes(perf.start_time)) * PX_PER_MIN
                    return (
                      <div
                        key={perf.id}
                        className="absolute left-1 right-1 z-20"
                        style={{ top, height }}
                      >
                        <EditorPerfCard perf={perf} eventId={eventId} stageColor={stage.color} timezone={timezone} onEdit={setEditingPerf} />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Per-stage "+ Add set" footer row */}
          <div className="flex min-w-full border-t border-border">
            <div className="w-28 shrink-0" />
            {orderedInitialStages.map((stage) => (
              <div key={stage.id} className="flex-1 min-w-[180px] border-l border-border p-1.5">
                <button
                  onClick={() =>
                    setAddingToStage(
                      addingToStage?.id === stage.id ? null : { id: stage.id, name: stage.name },
                    )
                  }
                  className="w-full py-1.5 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors"
                >
                  + Add set
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add-set form panel */}
      {addingToStage && (
        <AddPerformanceForm
          stageId={addingToStage.id}
          stageName={addingToStage.name}
          eventId={eventId}
          onDone={() => setAddingToStage(null)}
        />
      )}

      {/* Edit-set form panel */}
      {editingPerf && (
        <EditPerformanceForm
          perf={editingPerf}
          eventId={eventId}
          timezone={timezone}
          onDone={() => setEditingPerf(null)}
        />
      )}

      {/* Add stage */}
      <div className="mt-6">
        {showAddStage ? (
          <form
            action={handleAddStage}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-4 max-w-xs"
          >
            <Label htmlFor="stage-name" className="text-sm font-medium">Stage name</Label>
            <Input
              id="stage-name"
              name="name"
              placeholder="e.g. Main Stage"
              required
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Label htmlFor="stage-color" className="text-xs text-muted-foreground shrink-0">Color</Label>
              <input
                id="stage-color"
                name="color"
                type="color"
                defaultValue="#6366f1"
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddStage(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? 'Adding…' : 'Add stage'}
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddStage(true)}
            className="h-16 px-6 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-sm"
          >
            + Add stage
          </button>
        )}
      </div>
    </div>
  )
}
