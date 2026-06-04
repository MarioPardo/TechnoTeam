import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'TechnoTeam',
  description: 'Plan your festival crew schedule together',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-950 text-zinc-50 flex flex-col">
        <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3">
          <a href="/" className="font-semibold tracking-tight text-lg hover:text-zinc-300 transition-colors">
            TechnoTeam
          </a>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
