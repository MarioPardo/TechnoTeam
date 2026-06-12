export type SunDay = {
  dateKey: string
  sunriseMinutes: number
  sunsetMinutes: number
}

export async function fetchSunTimes(
  location: string,
  dateStart: string,
  dateEnd: string,
  timezone: string,
): Promise<SunDay[]> {
  try {
    const searchName = location.split(',')[0].trim()
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=en&format=json`,
      { cache: 'force-cache' },
    )
    const geoData = await geoRes.json()
    if (!geoData.results?.length) return []

    const { latitude, longitude, timezone: geoTimezone } = geoData.results[0]
    const start = dateStart.slice(0, 10)
    const end = dateEnd.slice(0, 10)

    // timezone=UTC → ISO strings in the response are unambiguously UTC
    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset&timezone=UTC&start_date=${start}&end_date=${end}`,
      { cache: 'force-cache' },
    )
    const forecast = await forecastRes.json()

    const days: SunDay[] = []
    const sunrises: string[] = forecast.daily?.sunrise ?? []
    const sunsets: string[] = forecast.daily?.sunset ?? []

    console.log('[sun-times] location:', location, '→', latitude, longitude)
    console.log('[sun-times] geo API timezone:', geoTimezone)
    console.log('[sun-times] event timezone:', timezone)
    console.log('[sun-times] raw API sunrise strings:', sunrises)
    console.log('[sun-times] raw API sunset strings:', sunsets)

    for (let i = 0; i < sunrises.length; i++) {
      if (!sunrises[i] || !sunsets[i]) continue

      const sunriseMs = new Date(sunrises[i] + ':00Z').getTime()
      const sunsetMs = new Date(sunsets[i] + ':00Z').getTime()

      // Match against activeDay which uses the event's local timezone
      const dateKey = new Date(sunriseMs).toLocaleDateString('en-CA', { timeZone: timezone })

      console.log(
        `[sun-times] day ${i}: raw="${sunrises[i]}" → UTC ${new Date(sunriseMs).toISOString()} → local(${timezone}) ${new Date(sunriseMs).toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })} | dateKey=${dateKey}`,
      )

      days.push({
        dateKey,
        sunriseMinutes: sunriseMs / 60000,
        sunsetMinutes: sunsetMs / 60000,
      })
    }

    return days
  } catch {
    return []
  }
}
