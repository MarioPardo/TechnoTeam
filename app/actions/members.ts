'use server'

import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { headers } from 'next/headers'
import { Resend } from 'resend'
import { supabaseServer } from '@/lib/supabase-server'
import { Member } from '@/lib/types'
import { isMemberColor, pickMemberColor } from '@/lib/member-colors'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

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
  password?: string,
  email?: string,
): Promise<SignInResult> {
  const trimmedName = name.trim()
  const trimmedEmail = email?.trim() || null

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
    if (trimmedEmail) {
      await supabaseServer.from('members').update({ email: trimmedEmail } as any).eq('id', (existing as any).id)
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
      ...(trimmedEmail ? { email: trimmedEmail } : {}),
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
  email?: string,
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
    .update({
      password_hash: newHash,
      ...(email !== undefined ? { email: email.trim() || null } : {}),
    } as any)
    .eq('id', memberId)

  if (error) {
    console.error('[updateMemberPassword] failed to update password', { memberId, error })
    throw new Error(error.message)
  }
  return { ok: true }
}

// email is kept out of the shared Member type / MEMBER_COLS (like
// password_hash) so it never rides along on the broadly-shared member
// object — callers must fetch it explicitly with the owning session token.
export async function getMemberEmail(memberId: string, sessionToken: string): Promise<string | null> {
  const { data: member, error } = await supabaseServer
    .from('members')
    .select('id, session_token, email')
    .eq('id', memberId)
    .single()

  if (error || !member) {
    console.error('[getMemberEmail] member not found', { memberId, error })
    throw new Error('Member not found')
  }
  if ((member as any).session_token !== sessionToken) {
    console.error('[getMemberEmail] session token mismatch', { memberId })
    throw new Error('Unauthorized')
  }
  return (member as any).email ?? null
}

// Always resolves the same way whether or not a matching member/email was
// found, so this can't be used to enumerate crew members or their emails.
export async function requestPasswordReset(groupId: string, name: string): Promise<{ ok: true }> {
  const trimmedName = name.trim()

  const { data: member } = await supabaseServer
    .from('members')
    .select('id, name, email, password_hash')
    .eq('group_id', groupId)
    .ilike('name', trimmedName)
    .maybeSingle()

  const email = (member as any)?.email as string | null | undefined
  const passwordHash = (member as any)?.password_hash as string | null | undefined

  if (member && email && passwordHash) {
    await sendPasswordResetEmail((member as any).id, (member as any).name, email)
  }

  return { ok: true }
}

async function sendPasswordResetEmail(memberId: string, name: string, email: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.error('[requestPasswordReset] RESEND_API_KEY not set, cannot send reset email')
    return
  }

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()

  const { error } = await supabaseServer
    .from('members')
    .update({ reset_token_hash: tokenHash, reset_token_expires_at: expiresAt } as any)
    .eq('id', memberId)

  if (error) {
    console.error('[requestPasswordReset] failed to store reset token', { memberId, error })
    return
  }

  const host = (await headers()).get('host')
  const protocol = host?.startsWith('localhost') ? 'http' : 'https'
  const resetUrl = `${protocol}://${host}/reset-password?token=${rawToken}`

  const resend = new Resend(resendKey)
  const { error: sendError } = await resend.emails.send({
    from: 'TechnoTeam <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your TechnoTeam password',
    html: `
      <p>Hi ${name},</p>
      <p>Someone (hopefully you) requested a password reset for your crew account.</p>
      <p><a href="${resetUrl}">Click here to set a new password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  })

  if (sendError) {
    console.error('[requestPasswordReset] failed to send email', { memberId, sendError })
  }
}

export type ResetPasswordResult =
  | { ok: true; groupCode: string }
  | { ok: false; reason: 'invalid-or-expired' | 'password-required' }

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<ResetPasswordResult> {
  if (!newPassword) return { ok: false, reason: 'password-required' }

  const tokenHash = createHash('sha256').update(token).digest('hex')

  const { data: member } = await supabaseServer
    .from('members')
    .select('id, reset_token_expires_at, groups(code)')
    .eq('reset_token_hash', tokenHash)
    .maybeSingle()

  const expiresAt = (member as any)?.reset_token_expires_at as string | null
  if (!member || !expiresAt || new Date(expiresAt) < new Date()) {
    return { ok: false, reason: 'invalid-or-expired' }
  }

  const { error } = await supabaseServer
    .from('members')
    .update({
      password_hash: hashPassword(newPassword),
      reset_token_hash: null,
      reset_token_expires_at: null,
      session_token: uuidv4(),
    } as any)
    .eq('id', (member as any).id)

  if (error) {
    console.error('[resetPasswordWithToken] failed to reset password', { error })
    throw new Error(error.message)
  }

  return { ok: true, groupCode: (member as any).groups.code }
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
