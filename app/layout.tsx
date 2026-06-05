import type { Metadata } from 'next'
import {
  Plus_Jakarta_Sans,
  Space_Grotesk,
  Bebas_Neue,
  Raleway,
  Oswald,
  Unbounded,
  Righteous,
} from 'next/font/google'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NavTabs } from '@/components/NavTabs'
import './globals.css'

const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans',       display: 'swap' })
const spaceGrotesk = Space_Grotesk(  { subsets: ['latin'], variable: '--font-grotesk',    display: 'swap' })
const bebasNeue    = Bebas_Neue(     { subsets: ['latin'], variable: '--font-bebas',      display: 'swap', weight: '400' })
const raleway      = Raleway(        { subsets: ['latin'], variable: '--font-raleway',    display: 'swap' })
const oswald       = Oswald(         { subsets: ['latin'], variable: '--font-oswald',     display: 'swap' })
const unbounded    = Unbounded(      { subsets: ['latin'], variable: '--font-unbounded',  display: 'swap' })
const righteous    = Righteous(      { subsets: ['latin'], variable: '--font-righteous',  display: 'swap', weight: '400' })

export const metadata: Metadata = {
  title: 'TechnoTeam',
  description: 'Plan your festival crew schedule together',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={[jakartaSans.variable, spaceGrotesk.variable, bebasNeue.variable, raleway.variable, oswald.variable, unbounded.variable, righteous.variable, 'h-full antialiased'].join(' ')} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark')})()`,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground flex flex-col">
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors hidden xs:block sm:block">
              TechnoTeam
            </span>
          </Link>
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            <NavTabs />
          </div>
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
