'use client'

import { useRef, useState } from 'react'
import { createEvent } from '@/app/actions/events'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const TIMEZONES = [
  'UTC',
  'Europe/London', 'Europe/Lisbon',
  'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna', 'Europe/Zurich',
  'Europe/Stockholm', 'Europe/Oslo', 'Europe/Copenhagen',
  'Europe/Helsinki', 'Europe/Warsaw', 'Europe/Prague', 'Europe/Budapest',
  'Europe/Bucharest', 'Europe/Athens', 'Europe/Istanbul', 'Europe/Moscow',
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

function guessTimezone(countryCode: string, state?: string): string | null {
  const cc = countryCode.toLowerCase()
  const s = (state || '').toLowerCase()

  if (cc === 'us') {
    if (/new york|new jersey|pennsylvania|ohio|michigan|indiana|kentucky|tennessee|connecticut|rhode island|massachusetts|vermont|new hampshire|maine|maryland|delaware|west virginia|virginia|north carolina|south carolina|georgia|florida/.test(s)) return 'America/New_York'
    if (/illinois|texas|oklahoma|arkansas|louisiana|minnesota|iowa|missouri|wisconsin|kansas|nebraska|mississippi|alabama/.test(s)) return 'America/Chicago'
    if (/colorado|utah|wyoming|montana|new mexico|idaho|north dakota|south dakota/.test(s)) return 'America/Denver'
    if (/california|washington|oregon|nevada/.test(s)) return 'America/Los_Angeles'
    if (/hawaii/.test(s)) return 'Pacific/Honolulu'
    return 'America/New_York'
  }
  if (cc === 'ca') {
    if (/british columbia/.test(s)) return 'America/Vancouver'
    if (/alberta/.test(s)) return 'America/Denver'
    return 'America/Toronto'
  }
  if (cc === 'au') {
    if (/western australia/.test(s)) return 'Australia/Perth'
    if (/victoria|tasmania|queensland|new south wales|australian capital/.test(s)) return 'Australia/Sydney'
    return 'Australia/Melbourne'
  }

  const map: Record<string, string> = {
    gb: 'Europe/London', ie: 'Europe/London',
    pt: 'Europe/Lisbon',
    fr: 'Europe/Paris',
    de: 'Europe/Berlin', lu: 'Europe/Berlin',
    es: 'Europe/Madrid',
    it: 'Europe/Rome', sm: 'Europe/Rome', va: 'Europe/Rome',
    nl: 'Europe/Amsterdam',
    be: 'Europe/Brussels',
    at: 'Europe/Vienna', sk: 'Europe/Vienna',
    ch: 'Europe/Zurich', li: 'Europe/Zurich',
    se: 'Europe/Stockholm',
    no: 'Europe/Oslo',
    dk: 'Europe/Copenhagen',
    fi: 'Europe/Helsinki', ee: 'Europe/Helsinki', lv: 'Europe/Helsinki', lt: 'Europe/Helsinki',
    pl: 'Europe/Warsaw',
    cz: 'Europe/Prague',
    hu: 'Europe/Budapest',
    ro: 'Europe/Bucharest', md: 'Europe/Bucharest',
    gr: 'Europe/Athens', cy: 'Europe/Athens', bg: 'Europe/Athens',
    tr: 'Europe/Istanbul',
    ru: 'Europe/Moscow', by: 'Europe/Moscow',
    mx: 'America/Mexico_City',
    br: 'America/Sao_Paulo',
    ar: 'America/Buenos_Aires', uy: 'America/Buenos_Aires',
    co: 'America/Bogota',
    pe: 'America/Lima', ec: 'America/Lima',
    cl: 'America/Santiago',
    ve: 'America/Caracas',
    jp: 'Asia/Tokyo',
    kr: 'Asia/Seoul',
    cn: 'Asia/Shanghai', tw: 'Asia/Shanghai',
    hk: 'Asia/Hong_Kong',
    sg: 'Asia/Singapore', my: 'Asia/Singapore', ph: 'Asia/Singapore',
    th: 'Asia/Bangkok', vn: 'Asia/Bangkok', kh: 'Asia/Bangkok', la: 'Asia/Bangkok', mm: 'Asia/Bangkok',
    in: 'Asia/Kolkata', np: 'Asia/Kolkata', bd: 'Asia/Kolkata', lk: 'Asia/Kolkata',
    ae: 'Asia/Dubai', om: 'Asia/Dubai', qa: 'Asia/Dubai', bh: 'Asia/Dubai', kw: 'Asia/Dubai',
    sa: 'Asia/Riyadh', iq: 'Asia/Riyadh', ye: 'Asia/Riyadh',
    il: 'Asia/Jerusalem', ps: 'Asia/Jerusalem', jo: 'Asia/Jerusalem', lb: 'Asia/Jerusalem',
    id: 'Asia/Jakarta',
    nz: 'Pacific/Auckland',
    eg: 'Africa/Cairo', sd: 'Africa/Cairo',
    za: 'Africa/Johannesburg', zw: 'Africa/Johannesburg', bw: 'Africa/Johannesburg', mz: 'Africa/Johannesburg',
    ng: 'Africa/Lagos', gh: 'Africa/Lagos', ci: 'Africa/Lagos', cm: 'Africa/Lagos',
    ke: 'Africa/Nairobi', tz: 'Africa/Nairobi', ug: 'Africa/Nairobi', et: 'Africa/Nairobi',
  }

  return map[cc] ?? null
}

export function NewEventForm() {
  const [timezone, setTimezone] = useState('UTC')
  const [tzDetected, setTzDetected] = useState(false)
  const [tzLoading, setTzLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageName, setImageName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleLocationBlur(e: React.FocusEvent<HTMLInputElement>) {
    const location = e.target.value.trim()
    if (!location) return
    setTzLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } },
      )
      const data = await res.json()
      if (data[0]?.address) {
        const tz = guessTimezone(data[0].address.country_code, data[0].address.state)
        if (tz) { setTimezone(tz); setTzDetected(true) }
      }
    } catch {
      // silently ignore — user can pick manually
    } finally {
      setTzLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { clearImage(); return }
    setImageName(file.name)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  function clearImage() {
    setImagePreview(null)
    setImageName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form action={createEvent} encType="multipart/form-data" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Event name</Label>
        <Input id="name" name="name" placeholder="Glastonbury 2025" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date_start">Start date</Label>
          <Input id="date_start" name="date_start" type="date" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date_end">End date</Label>
          <Input id="date_end" name="date_end" type="date" required />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          placeholder="Pilton, Somerset"
          required
          onBlur={handleLocationBlur}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="timezone">Timezone</Label>
          {tzLoading && <span className="text-xs text-muted-foreground">Detecting…</span>}
          {!tzLoading && tzDetected && <span className="text-xs text-muted-foreground">Detected from location</span>}
        </div>
        <select
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={(e) => { setTimezone(e.target.value); setTzDetected(false) }}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input id="description" name="description" placeholder="A few words about the event" />
      </div>

      {/* Logo upload */}
      <div className="flex flex-col gap-1.5">
        <Label>
          Logo <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <input
          ref={fileInputRef}
          id="image_file"
          name="image_file"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
        {imagePreview ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <img src={imagePreview} alt="Logo preview" className="w-12 h-12 rounded-lg object-contain bg-background" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{imageName}</p>
              <p className="text-xs text-muted-foreground">Logo ready to upload</p>
            </div>
            <button
              type="button"
              onClick={clearImage}
              className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none px-1"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ) : (
          <label
            htmlFor="image_file"
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-8 cursor-pointer hover:bg-muted/40 hover:border-primary/40 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mb-1">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
            <span className="text-sm font-medium">Click to upload logo</span>
            <span className="text-xs font-semibold text-primary">PNG Recommended</span>
            <span className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP</span>
          </label>
        )}
      </div>

      {/* Edit password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">
          Edit password <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Leave blank for no restriction"
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">
          Required to edit or manage this event. Does not affect attendee access.
        </p>
      </div>

      <Button type="submit" className="mt-2">Create event</Button>
    </form>
  )
}
