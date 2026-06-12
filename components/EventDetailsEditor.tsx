'use client'

import { useRef, useState, useTransition } from 'react'
import { updateEvent } from '@/app/actions/events'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FESTIVAL_FONTS, getFontStyle } from '@/lib/festival-font'
import { cn } from '@/lib/utils'
import { Event } from '@/lib/types'

type Link = { label: string; url: string }

type GeoResult = {
  id: number
  name: string
  country: string
  admin1?: string
  timezone: string
}

const TIMEZONES = [
  'UTC',
  'Europe/London', 'Europe/Lisbon',
  'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna', 'Europe/Zurich',
  'Europe/Stockholm', 'Europe/Oslo', 'Europe/Copenhagen',
  'Europe/Helsinki', 'Europe/Warsaw', 'Europe/Prague', 'Europe/Budapest',
  'Europe/Bucharest', 'Europe/Sofia', 'Europe/Athens', 'Europe/Istanbul', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Mexico_City',
  'America/Sao_Paulo', 'America/Buenos_Aires', 'America/Bogota',
  'America/Lima', 'America/Santiago', 'America/Caracas',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Hong_Kong',
  'Asia/Singapore', 'Asia/Bangkok', 'Asia/Kolkata', 'Asia/Dubai',
  'Asia/Riyadh', 'Asia/Jerusalem', 'Asia/Jakarta',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
  'Pacific/Auckland', 'Pacific/Honolulu',
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
]

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
  const [name, setName] = useState(event.name)
  const [font, setFont] = useState<string>(event.font ?? 'default')
  const [imageUrl, setImageUrl] = useState(event.image_url ?? '')
  const [imageDarkUrl, setImageDarkUrl] = useState(event.image_url_dark ?? '')
  const [description, setDescription] = useState(event.description ?? '')
  const [links, setLinks] = useState<Link[]>(event.links ?? [])

  const [locationText, setLocationText] = useState(event.location ?? '')
  const [suggestions, setSuggestions] = useState<GeoResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [timezone, setTimezone] = useState(event.timezone ?? 'UTC')
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [saved, setSaved] = useState(false)
  const [saving, startSave] = useTransition()

  function addLink() { setLinks((p) => [...p, { label: '', url: '' }]); setSaved(false) }
  function removeLink(i: number) { setLinks((p) => p.filter((_, idx) => idx !== i)); setSaved(false) }
  function updateLink(i: number, field: 'label' | 'url', value: string) {
    setLinks((p) => p.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
    setSaved(false)
  }

  function handleLocationChange(val: string) {
    setLocationText(val)
    setSaved(false)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return }

    searchTimeoutRef.current = setTimeout(async () => {
      setGeoLoading(true)
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val.split(',')[0].trim())}&count=5&language=en&format=json`,
        )
        const data = await res.json()
        const results: GeoResult[] = data.results ?? []
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setGeoLoading(false)
      }
    }, 350)
  }

  function selectSuggestion(result: GeoResult) {
    const parts = [result.name, result.admin1, result.country].filter(Boolean)
    setLocationText(parts.join(', '))
    setTimezone(result.timezone)
    setSuggestions([])
    setShowSuggestions(false)
    setSaved(false)
  }

  function handleSave() {
    setSaved(false)
    startSave(async () => {
      await updateEvent(event.id, {
        name: name.trim() || event.name,
        font: font === 'default' ? null : font,
        image_url: imageUrl || null,
        image_url_dark: imageDarkUrl || null,
        description: description.trim() || null,
        links: links.filter((l) => l.url.trim()),
        location: locationText.trim() || event.location,
        timezone,
      })
      setSaved(true)
    })
  }

  const previewName = name.trim() || event.name
  const timezoneOptions = TIMEZONES.includes(timezone) ? TIMEZONES : [timezone, ...TIMEZONES]

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      <h2 className="text-base font-semibold text-foreground">Festival details</h2>

      {/* Festival name */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Festival name</Label>
        <Input
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false) }}
          placeholder="Festival name"
          className="text-sm"
        />
      </div>

      {/* Location */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Location</Label>
        <div className="relative">
          <Input
            value={locationText}
            onChange={(e) => handleLocationChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search for a city or venue…"
            className="text-sm"
          />
          {geoLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              Searching…
            </span>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
              {suggestions.map((s) => {
                const parts = [s.name, s.admin1, s.country].filter(Boolean)
                return (
                  <button
                    key={s.id}
                    type="button"
                    className="flex flex-col w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                    onMouseDown={() => selectSuggestion(s)}
                  >
                    <span className="text-sm font-medium">{parts.join(', ')}</span>
                    <span className="text-xs text-muted-foreground">{s.timezone}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Timezone */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Timezone</Label>
        <select
          value={timezone}
          onChange={(e) => { setTimezone(e.target.value); setSaved(false) }}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {timezoneOptions.map((tz) => (
            <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground/60">
          Auto-detected when you pick a location.
        </p>
      </div>

      {/* Display font */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Display font</Label>
        <div className="grid grid-cols-2 gap-2">
          {FESTIVAL_FONTS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => { setFont(f.key); setSaved(false) }}
              className={cn(
                'px-3 py-2.5 rounded-xl border-2 text-left transition-colors',
                font === f.key
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30',
              )}
            >
              <div className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                {f.label}
              </div>
              <div
                className="text-base font-bold truncate leading-tight"
                style={getFontStyle(f.key)}
              >
                {previewName}
              </div>
            </button>
          ))}
        </div>
      </div>

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
