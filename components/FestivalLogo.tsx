interface FestivalLogoProps {
  lightUrl: string | null | undefined
  darkUrl: string | null | undefined
  alt: string
  className?: string
}

export function FestivalLogo({ lightUrl, darkUrl, alt, className }: FestivalLogoProps) {
  if (!lightUrl && !darkUrl) return null

  const light = lightUrl || darkUrl!
  const dark = darkUrl || lightUrl!
  const cls = className ?? ''

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={light} alt={alt} className={`dark:hidden ${cls}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dark} alt={alt} aria-hidden className={`hidden dark:block ${cls}`} />
    </>
  )
}
