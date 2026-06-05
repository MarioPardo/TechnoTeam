'use server'

import { cookies } from 'next/headers'
import { createHash } from 'crypto'

const COOKIE_NAME = 'manage_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function hashPassword(pw: string) {
  return createHash('sha256').update(pw).digest('hex')
}

export async function unlockManage(password: string): Promise<{ error?: string }> {
  const expected = process.env.MANAGE_PASSWORD
  if (!expected) return { error: 'MANAGE_PASSWORD env variable is not set.' }
  if (password !== expected) return { error: 'Incorrect password.' }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, hashPassword(password), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
  return {}
}

export async function isManageUnlocked(): Promise<boolean> {
  const expected = process.env.MANAGE_PASSWORD
  if (!expected) return false
  const cookieStore = await cookies()
  const stored = cookieStore.get(COOKIE_NAME)?.value
  return stored === hashPassword(expected)
}
