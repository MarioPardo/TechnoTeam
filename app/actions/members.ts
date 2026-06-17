'use server'

import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { supabaseServer } from '@/lib/supabase-server'
import { Member } from '@/lib/types'
import { isMemberColor, pickMemberColor } from '@/lib/member-colors'

const MEMBER_COLS = 'id, group_id, name, session_token, color, created_at'

async function getGroupMemberColors(groupId: string): Promise<{ name: string; color: string | null }[]> {
  const { data } = await supabaseServer.from('members').select('name, color').eq('group_id', groupId)
  return (data as { name: string; color: string | null }[] | null) ?? []
}

async function ensureMemberColor(member: Member): Promise<Member> {
  if (member.color) return member
  const groupMembers = await getGroupMemberColors(member.group_id)
  const color = pickMemberColor(member.name, groupMembers)
  await supabaseServer.from('members').update({ color } as any).eq('id', member.id)
  return { ...member, color }
}

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

export type SignInResult =
  | { ok: true; member: Member }
  | { ok: false; reason: 'needs-password' | 'wrong-password' }

// Next.js redacts thrown Error messages from Server Actions in production, so
// expected/recoverable outcomes (missing or wrong password) are modeled as
// return values instead of throws — throwing is reserved for real bugs/failures.
export async function signInOrJoin(
  groupId: string,
  name: string,
  password?: string
): Promise<SignInResult> {
  const trimmedName = name.trim()

  const { data: existing } = await supabaseServer
    .from('members')
    .select(`${MEMBER_COLS}, password_hash`)
    .eq('group_id', groupId)
    .ilike('name', trimmedName)
    .maybeSingle()

  if (existing) {
    const storedHash = (existing as any).password_hash as string | null
    if (storedHash) {
      if (!password) return { ok: false, reason: 'needs-password' }
      if (!verifyPassword(password, storedHash)) return { ok: false, reason: 'wrong-password' }
    }
    const { password_hash: _ph, ...member } = existing as any
    return { ok: true, member: await ensureMemberColor(member as Member) }
  }

  const token = uuidv4()
  const passwordHash = password ? hashPassword(password) : null
  const groupMembers = await getGroupMemberColors(groupId)

  const { data, error } = await supabaseServer
    .from('members')
    .insert({
      group_id: groupId,
      name: trimmedName,
      session_token: token,
      color: pickMemberColor(trimmedName, groupMembers),
      ...(passwordHash ? { password_hash: passwordHash } : {}),
    } as any)
    .select(MEMBER_COLS)
    .single()

  if (error) {
    console.error('[signInOrJoin] failed to create member', { groupId, name: trimmedName, error })
    throw new Error(error.message)
  }
  return { ok: true, member: data as Member }
}

export async function getMemberByToken(sessionToken: string): Promise<Member | null> {
  const { data } = await supabaseServer
    .from('members')
    .select(MEMBER_COLS)
    .eq('session_token', sessionToken)
    .maybeSingle()

  if (!data) return null
  return ensureMemberColor(data as Member)
}

export async function leaveGroup(memberId: string, sessionToken: string): Promise<void> {
  const { data: member } = await supabaseServer
    .from('members')
    .select('id, session_token')
    .eq('id', memberId)
    .single()

  if (!member || (member as any).session_token !== sessionToken) {
    console.error('[leaveGroup] unauthorized', { memberId })
    throw new Error('Unauthorized')
  }

  const { error } = await supabaseServer.from('members').delete().eq('id', memberId)
  if (error) {
    console.error('[leaveGroup] failed to delete member', { memberId, error })
    throw new Error(error.message)
  }
}

export type UpdatePasswordResult =
  | { ok: true }
  | { ok: false; reason: 'current-required' | 'current-incorrect' }

export async function updateMemberPassword(
  memberId: string,
  sessionToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<UpdatePasswordResult> {
  const { data: member, error: fetchError } = await supabaseServer
    .from('members')
    .select('id, session_token, password_hash')
    .eq('id', memberId)
    .single()

  if (fetchError || !member) {
    console.error('[updateMemberPassword] member not found', { memberId, fetchError })
    throw new Error('Member not found')
  }
  if ((member as any).session_token !== sessionToken) {
    console.error('[updateMemberPassword] session token mismatch', { memberId })
    throw new Error('Unauthorized')
  }

  const storedHash = (member as any).password_hash as string | null

  if (storedHash) {
    if (!currentPassword) return { ok: false, reason: 'current-required' }
    if (!verifyPassword(currentPassword, storedHash)) return { ok: false, reason: 'current-incorrect' }
  }

  const newHash = newPassword ? hashPassword(newPassword) : null

  const { error } = await supabaseServer
    .from('members')
    .update({ password_hash: newHash } as any)
    .eq('id', memberId)

  if (error) {
    console.error('[updateMemberPassword] failed to update password', { memberId, error })
    throw new Error(error.message)
  }
  return { ok: true }
}

export async function updateMemberColor(memberId: string, sessionToken: string, color: string): Promise<void> {
  if (!isMemberColor(color)) throw new Error('Invalid color')

  const { data: member, error: fetchError } = await supabaseServer
    .from('members')
    .select('id, session_token')
    .eq('id', memberId)
    .single()

  if (fetchError || !member) {
    console.error('[updateMemberColor] member not found', { memberId, fetchError })
    throw new Error('Member not found')
  }
  if ((member as any).session_token !== sessionToken) {
    console.error('[updateMemberColor] session token mismatch', { memberId })
    throw new Error('Unauthorized')
  }

  const { error } = await supabaseServer
    .from('members')
    .update({ color } as any)
    .eq('id', memberId)

  if (error) {
    console.error('[updateMemberColor] failed to update color', { memberId, error })
    throw new Error(error.message)
  }
}
