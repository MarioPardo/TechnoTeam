// Converts "YYYY-MM-DDTHH:MM" (naive local time in `tz`) to a UTC ISO string.
// Works by treating the local time as UTC to get an approximate epoch, then
// computing the actual UTC offset via Intl and correcting.
export function localInputToUTC(datetimeLocal: string, tz: string): string {
  const [datePart, timePart] = datetimeLocal.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [h, m] = timePart.split(':').map(Number)

  const approx = Date.UTC(year, month - 1, day, h, m, 0)

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
