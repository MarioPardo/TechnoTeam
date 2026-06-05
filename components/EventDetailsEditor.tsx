'use client'

import { useRef, useState, useTransition } from 'react'
import { updateEvent } from '@/app/actions/events'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Event } from '@/lib/types'

type Link = { label: string; url: string }

const MAX_SIZE_MB = 5

function LogoUploadBox({
  label,
  hint,
  eventId,
  pathPrefix,
  currentUrl,
  dark,
  onChange,
}: {
  label: string
  hint: string
  eventId: string
  pathPrefix: string
  currentUrl: string
  dark?: boolean
  onChange: (url: string) => void
}) {
  const [url, setUrl] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Select an image file.'); return }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`Max ${MAX_SIZE_MB} MB.`); return }

    setUploading(true)
    setError(null)

    const localPreview = URL.createObjectURL(file)
    setUrl(localPreview)

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `events/${eventId}/${pathPrefix}-${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      setError(uploadErr.message)
      setUrl(currentUrl)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
    setUrl(publicUrl)
    onChange(publicUrl)
    setUploading(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  function remove() {
    setUrl('')
    onChange('')
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative w-24 h-24 rounded-2xl border-2 overflow-hidden transition-colors select-none ${
          dragOver
            ? 'border-primary cursor-copy'
            : uploading
            ? 'border-border cursor-wait'
            : 'border-dashed border-border hover:border-primary/50 cursor-pointer'
        } ${dark ? 'bg-zinc-900' : 'bg-muted/40'}`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="w-full h-full object-contain p-1.5" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </div>
        )}

        <div className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
          {uploading ? (
            <svg className="animate-spin text-white" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <span className="text-white text-xs font-medium">{url ? 'Change' : 'Upload'}</span>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="text-center">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">{hint}</p>
        {url && !uploading && (
          <button type="button" onClick={remove} className="text-[11px] text-muted-foreground/40 hover:text-destructive transition-colors mt-1">
            Remove
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  )
}

export function EventDetailsEditor({ event }: { event: Event }) {
  const [imageUrl, setImageUrl] = useState(event.image_url ?? '')
  const [imageDarkUrl, setImageDarkUrl] = useState(event.image_url_dark ?? '')
  const [description, setDescription] = useState(event.description ?? '')
  const [links, setLinks] = useState<Link[]>(event.links ?? [])
  const [saved, setSaved] = useState(false)
  const [saving, startSave] = useTransition()

  function addLink() { setLinks((p) => [...p, { label: '', url: '' }]); setSaved(false) }
  function removeLink(i: number) { setLinks((p) => p.filter((_, idx) => idx !== i)); setSaved(false) }
  function updateLink(i: number, field: 'label' | 'url', value: string) {
    setLinks((p) => p.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
    setSaved(false)
  }

  function handleSave() {
    setSaved(false)
    startSave(async () => {
      await updateEvent(event.id, {
        image_url: imageUrl || null,
        image_url_dark: imageDarkUrl || null,
        description: description.trim() || null,
        links: links.filter((l) => l.url.trim()),
      })
      setSaved(true)
    })
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      <h2 className="text-base font-semibold text-foreground">Festival details</h2>

      {/* Logos */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Logo</Label>
        <div className="flex gap-6 items-start">
          <LogoUploadBox
            label="Light mode"
            hint="Shown on light backgrounds"
            eventId={event.id}
            pathPrefix="logo-light"
            currentUrl={imageUrl}
            onChange={(u) => { setImageUrl(u); setSaved(false) }}
          />
          <LogoUploadBox
            label="Dark mode"
            hint="Shown on dark backgrounds"
            eventId={event.id}
            pathPrefix="logo-dark"
            currentUrl={imageDarkUrl}
            dark
            onChange={(u) => { setImageDarkUrl(u); setSaved(false) }}
          />
        </div>
        <p className="text-xs text-muted-foreground/60">
          Upload a separate logo optimised for dark backgrounds. If omitted, the light logo is used for both.
        </p>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Description</Label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); setSaved(false) }}
          placeholder="A few words about the festival…"
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Links */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Links</Label>
        {links.length > 0 && (
          <div className="flex flex-col gap-2">
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={link.label}
                  onChange={(e) => updateLink(i, 'label', e.target.value)}
                  placeholder="Label"
                  className="w-32 shrink-0 text-sm"
                />
                <Input
                  value={link.url}
                  onChange={(e) => updateLink(i, 'url', e.target.value)}
                  placeholder="https://…"
                  type="url"
                  className="flex-1 text-sm"
                />
                <button
                  onClick={() => removeLink(i)}
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-muted transition-colors shrink-0 text-lg leading-none"
                  title="Remove"
                >×</button>
              </div>
            ))}
          </div>
        )}
        <button onClick={addLink} type="button" className="self-start text-sm text-muted-foreground hover:text-foreground transition-colors">
          + Add link
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved!</span>}
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
