'use client'

import { useState, useTransition } from 'react'
import { createStage, deleteStage } from '@/app/actions/stages'
import { createPerformance, deletePerformance } from '@/app/actions/performances'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Stage, Performance } from '@/lib/types'

type StageWithPerfs = Stage & { performances: Performance[] }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function AddPerformanceForm({ stageId, eventId, onDone }: { stageId: string; eventId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createPerformance(stageId, eventId, formData)
      onDone()
    })
  }

  return (
    <form action={handleSubmit} className="grid grid-cols-2 gap-2 mt-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
      <div className="col-span-2">
        <Label htmlFor={`artist-${stageId}`} className="text-xs text-zinc-400">Artist</Label>
        <Input id={`artist-${stageId}`} name="artist" placeholder="Artist name" required className="bg-zinc-900 border-zinc-700 h-8 text-sm" />
      </div>
      <div>
        <Label className="text-xs text-zinc-400">Start time</Label>
        <Input name="start_time" type="datetime-local" required className="bg-zinc-900 border-zinc-700 h-8 text-sm" />
      </div>
      <div>
        <Label className="text-xs text-zinc-400">End time</Label>
        <Input name="end_time" type="datetime-local" required className="bg-zinc-900 border-zinc-700 h-8 text-sm" />
      </div>
      <div className="col-span-2">
        <Label className="text-xs text-zinc-400">Note <span className="text-zinc-600">(optional)</span></Label>
        <Input name="description" placeholder="e.g. Closing set" className="bg-zinc-900 border-zinc-700 h-8 text-sm" />
      </div>
      <div className="col-span-2 flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
        <Button type="submit" size="sm" disabled={pending}>{pending ? 'Adding…' : 'Add set'}</Button>
      </div>
    </form>
  )
}

function StageCard({ stage, eventId }: { stage: StageWithPerfs; eventId: string }) {
  const [showAdd, setShowAdd] = useState(false)
  const [deletingPerf, startDeletePerf] = useTransition()
  const [deletingStage, startDeleteStage] = useTransition()

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-zinc-100">{stage.name}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-600 hover:text-red-400 text-xs"
          disabled={deletingStage}
          onClick={() => startDeleteStage(async () => { await deleteStage(stage.id, eventId) })}
        >
          Delete stage
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {stage.performances
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
          .map((perf) => (
            <div key={perf.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-zinc-100">{perf.artist}</span>
                <span className="text-zinc-500 ml-2">{formatTime(perf.start_time)} – {formatTime(perf.end_time)}</span>
                {perf.description && <Badge variant="secondary" className="ml-2 text-xs bg-zinc-700 text-zinc-300">{perf.description}</Badge>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-600 hover:text-red-400 h-6 w-6 p-0 ml-2"
                disabled={deletingPerf}
                onClick={() => startDeletePerf(async () => { await deletePerformance(perf.id, eventId) })}
              >
                ×
              </Button>
            </div>
          ))}
      </div>

      {showAdd ? (
        <AddPerformanceForm stageId={stage.id} eventId={eventId} onDone={() => setShowAdd(false)} />
      ) : (
        <Button variant="ghost" size="sm" className="mt-3 text-zinc-500 hover:text-zinc-200 w-full" onClick={() => setShowAdd(true)}>
          + Add set
        </Button>
      )}
    </div>
  )
}

export function StageEditor({ eventId, initialStages }: { eventId: string; initialStages: StageWithPerfs[] }) {
  const [showAddStage, setShowAddStage] = useState(false)
  const [pending, startTransition] = useTransition()

  async function handleAddStage(formData: FormData) {
    startTransition(async () => {
      await createStage(eventId, formData)
      setShowAddStage(false)
    })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 items-start">
        {initialStages.map((stage) => (
          <div key={stage.id} className="w-72">
            <StageCard stage={stage} eventId={eventId} />
          </div>
        ))}

        <div className="w-72">
          {showAddStage ? (
            <form action={handleAddStage} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
              <Label htmlFor="stage-name" className="text-sm font-medium">Stage name</Label>
              <Input id="stage-name" name="name" placeholder="e.g. Main Stage" required autoFocus className="bg-zinc-950 border-zinc-700" />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddStage(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={pending}>{pending ? 'Adding…' : 'Add stage'}</Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddStage(true)}
              className="w-full h-24 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors text-sm"
            >
              + Add stage
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
