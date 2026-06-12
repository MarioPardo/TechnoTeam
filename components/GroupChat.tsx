'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { sendMessage, getMessages } from '@/app/actions/messages'
import { Message, Member } from '@/lib/types'
import { ChevronDown, ChevronUp, Send } from 'lucide-react'
import { MEMBER_COLOR_PALETTE } from '@/lib/member-colors'

type MessageWithMember = Message & { members: { id: string; name: string } }

interface GroupChatProps {
  groupId: string
  currentMember: Member
  members: Member[]
  collapsed: boolean
  onToggleCollapse: () => void
}

export function GroupChat({ groupId, currentMember, members, collapsed, onToggleCollapse }: GroupChatProps) {
  const [messages, setMessages] = useState<MessageWithMember[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getMessages(groupId).then(setMessages)
  }, [groupId])

  useEffect(() => {
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
        async (payload) => {
          const msg = payload.new as Message
          const member = members.find((m) => m.id === msg.member_id)
          const memberInfo = member
            ? { id: member.id, name: member.name }
            : (await supabase.from('members').select('id, name').eq('id', msg.member_id).single()).data ?? { id: msg.member_id, name: '?' }
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, { ...msg, members: memberInfo }]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, members])

  useEffect(() => {
    if (!collapsed) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, collapsed])

  const getMemberColor = (memberId: string) => {
    return members.find((m) => m.id === memberId)?.color ?? MEMBER_COLOR_PALETTE[0]
  }

  const handleSend = async () => {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')
    try {
      await sendMessage(groupId, currentMember.id, content, currentMember.session_token)
    } catch {
      setInput(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="border-t border-border flex flex-col shrink-0">
      <button
        onClick={onToggleCollapse}
        className="flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 transition-colors w-full"
      >
        Crew Chat
        {collapsed
          ? <ChevronUp className="w-3.5 h-3.5 shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
      </button>

      {!collapsed && (
        <>
          <div className="overflow-y-auto px-3 py-2 flex flex-col gap-2.5 max-h-56 min-h-[80px]">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground/50 text-center mt-4">No messages yet. Say hi!</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: getMemberColor(msg.member_id) }}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                  >
                    {msg.members.name[0].toUpperCase()}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {msg.member_id === currentMember.id ? 'You' : msg.members.name}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 pl-5 leading-relaxed break-words">{msg.content}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 pb-3 pt-1 flex gap-1.5">
            <input
              ref={inputRef}
              className="flex-1 min-w-0 text-xs bg-muted rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
              placeholder="Say something…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
