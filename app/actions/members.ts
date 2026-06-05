'use server'

import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'
import { Member } from '@/lib/types'

const MEMBER_COLS = 'id, group_id, name, session_token, created_at'

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(':')
  if (!salt || !hashHex) return false
  const inputHash = scryptSync(password, salt, 64)
  const storedHash = Buffer.from(hashHex, 'hex')
  if (inputHash.length !== storedHash.length) return false
  return timingSafeEqual(inputHash, storedHash)
}

export async function signInOrJoin(
  groupId: string,
  name: string,
  password?: string
): Promise<Member> {
  const trimmedName = name.trim()

  const { data: existing } = await supabase
    .from('members')
    .select(`${MEMBER_COLS}, password_hash`)
    .eq('group_id', groupId)
    .ilike('name', trimmedName)
    .maybeSingle()

  if (existing) {
    const storedHash = (existing as any).password_hash as string | null
    if (storedHash) {
      if (!password) throw new Error('This member has a password — please enter it')
      if (!verifyPassword(password, storedHash)) throw new Error('Wrong password')
    }
    const { password_hash: _ph, ...member } = existing as any
    return member as Member
  }

  const token = uuidv4()
  const passwordHash = password ? hashPassword(password) : null

  const { data, error } = await supabase
    .from('members')
    .insert({
      group_id: groupId,
      name: trimmedName,
      session_token: token,
      ...(passwordHash ? { password_hash: passwordHash } : {}),
    } as any)
    .select(MEMBER_COLS)
    .single()

  if (error) throw new Error(error.message)
  return data as Member
}

export async function getMemberByToken(sessionToken: string): Promise<Member | null> {
  const { data } = await supabase
    .from('members')
    .select(MEMBER_COLS)
    .eq('session_token', sessionToken)
    .maybeSingle()

  return data as Member | null
}

export async function leaveGroup(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', memberId)

  if (error) throw new Error(error.message)
}

export async function updateMemberPassword(
  memberId: string,
  sessionToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { data: member, error: fetchError } = await supabase
    .from('members')
    .select('id, session_token, password_hash')
    .eq('id', memberId)
    .single()

  if (fetchError || !member) throw new Error('Member not found')
  if ((member as any).session_token !== sessionToken) throw new Error('Unauthorized')

  const storedHash = (member as any).password_hash as string | null

  if (storedHash) {
    if (!currentPassword) throw new Error('Current password is required')
    if (!verifyPassword(currentPassword, storedHash)) throw new Error('Current password is incorrect')
  }

  const newHash = newPassword ? hashPassword(newPassword) : null

  const { error } = await supabase
    .from('members')
    .update({ password_hash: newHash } as any)
    .eq('id', memberId)

  if (error) throw new Error(error.message)
}
