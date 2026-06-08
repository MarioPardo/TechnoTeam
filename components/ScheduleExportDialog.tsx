'use client'

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScheduleExportView, ExportOrientation } from './ScheduleExportView'
import { ExportEntry } from '@/lib/schedule-export'
import { DownloadIcon, Loader2Icon } from 'lucide-react'

interface ScheduleExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberName?: string
  dayKey: string
  dayLabel: string
  dayShortLabel: string
  logoUrl?: string | null
  entries: ExportEntry[]
  timezone: string
  orientation?: ExportOrientation
}

export function ScheduleExportDialog({ open, onOpenChange, memberName, dayKey, dayLabel, dayShortLabel, logoUrl, entries, timezone, orientation }: ScheduleExportDialogProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!previewRef.current || saving) return
    setSaving(true)
    try {
      const dataUrl = await toPng(previewRef.current, { pixelRatio: 3 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `my-schedule-${dayKey || 'export'}.png`
      link.click()
    } catch (err) {
      console.error('Failed to export schedule image', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export as picture</DialogTitle>
          <DialogDescription>
            Preview of your schedule for {dayLabel}, sized to share or save on your phone.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-auto">
          <div className="flex justify-center py-2">
            <ScheduleExportView
              ref={previewRef}
              memberName={memberName}
              dayLabel={dayShortLabel}
              logoUrl={logoUrl}
              entries={entries}
              timezone={timezone}
              orientation={orientation}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2Icon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
            {saving ? 'Saving…' : 'Save image'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
