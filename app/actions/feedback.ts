'use server'

import { Resend } from 'resend'

export type FeedbackResult = { success: true } | { error: string }

export async function sendFeedback(formData: FormData): Promise<FeedbackResult> {
  const subject = (formData.get('subject') as string | null)?.trim()
  const message = (formData.get('message') as string | null)?.trim()
  const anonymous = formData.get('anonymous') === 'true'
  const name = (formData.get('name') as string | null)?.trim()
  const email = (formData.get('email') as string | null)?.trim()

  if (!subject) return { error: 'Subject is required.' }
  if (!message) return { error: 'Message is required.' }

  const recipientEmail = process.env.FEEDBACK_RECIPIENT_EMAIL
  const resendKey = process.env.RESEND_API_KEY
  if (!recipientEmail || !resendKey) return { error: 'Email not configured.' }

  const from = anonymous ? 'Anonymous' : [name, email].filter(Boolean).join(' — ') || 'Anonymous'
  const bodyHtml = `
    <p><strong>From:</strong> ${anonymous ? 'Anonymous' : [name, email].filter(Boolean).join(' / ') || 'Anonymous'}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <hr />
    <p style="white-space:pre-wrap">${message}</p>
  `

  const resend = new Resend(resendKey)
  const { error } = await resend.emails.send({
    from: 'TechnoTeam Feedback <onboarding@resend.dev>',
    to: recipientEmail,
    subject: `[TechnoTeam Feedback] ${subject}`,
    html: bodyHtml,
    replyTo: !anonymous && email ? email : undefined,
  })

  if (error) return { error: error.message }
  return { success: true }
}
