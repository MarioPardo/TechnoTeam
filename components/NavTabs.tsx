'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'Your Events', href: '/your-events' },
  { label: 'Crew Search', href: '/crew-search' },
  { label: 'Your Crews', href: '/your-crews' },
  { label: 'Feedback', href: '/feedback' },
]

export function NavTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 w-max">
      {tabs.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
