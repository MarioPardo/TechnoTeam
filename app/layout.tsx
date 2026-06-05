import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ThemeToggle } from '@/components/ThemeToggle'
import './globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TechnoTeam',
  description: 'Plan your festival crew schedule together',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakartaSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme'),p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&p))document.documentElement.classList.add('dark')})()`,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground flex flex-col">
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <span className="font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              TechnoTeam
            </span>
          </a>
          <ThemeToggle />
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
