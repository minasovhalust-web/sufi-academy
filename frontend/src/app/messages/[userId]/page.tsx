'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAuthStore } from '@/store/auth.store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  useDirectMessages,
  useSendDirectMessage,
} from '@/hooks/api/useDirectMessages'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import type { DirectMessage } from '@/types'

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md'
}) {
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {initials}
    </div>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isFromMe,
}: {
  message: DirectMessage
  isFromMe: boolean
}) {
  const time = format(new Date(message.createdAt), 'HH:mm', { locale: ru })

  if (isFromMe) {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[70%]">
          <div className="bg-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm break-words">
            {message.content}
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{time}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-end">
      <Avatar
        name={`${message.sender.firstName} ${message.sender.lastName}`}
        avatarUrl={message.sender.avatarUrl}
        size="sm"
      />
      <div className="max-w-[70%]">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm break-words text-gray-900">
          {message.content}
        </div>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  )
}

// ── Date separator ────────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 shrink-0">
        {format(new Date(date), 'd MMMM yyyy', { locale: ru })}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChatPage({ params }: { params: { userId: string } }) {
  const partnerId = params.userId
  const { user } = useAuthStore()

  const { data: messages, isLoading } = useDirectMessages(partnerId)
  const { mutate: sendMessage, isPending: isSending } = useSendDirectMessage(partnerId)

  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const partner = messages?.[0]
    ? messages[0].senderId === user?.id
      ? messages[0].receiver
      : messages[0].sender
    : null

  const partnerName = partner
    ? `${partner.firstName} ${partner.lastName}`
    : 'Пользователь'

  const handleSend = () => {
    const content = text.trim()
    if (!content || isSending) return
    sendMessage(content, {
      onSuccess: () => {
        setText('')
        textareaRef.current?.focus()
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by date for separators
  const grouped: Array<{ date: string; messages: DirectMessage[] }> = []
  for (const msg of messages ?? []) {
    const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd')
    const last = grouped[grouped.length - 1]
    if (!last || last.date !== dateKey) {
      grouped.push({ date: dateKey, messages: [msg] })
    } else {
      last.messages.push(msg)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <Link
            href="/messages"
            className="text-gray-500 hover:text-gray-800 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {isLoading ? (
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          ) : partner ? (
            <Avatar name={partnerName} avatarUrl={partner.avatarUrl} />
          ) : (
            <div className="h-9 w-9 rounded-full bg-gray-200 shrink-0" />
          )}

          <div>
            {isLoading ? (
              <Skeleton className="h-4 w-28" />
            ) : (
              <p className="font-semibold text-sm text-gray-900">{partnerName}</p>
            )}
          </div>
        </div>

        {/* ── Messages area ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${i % 2 === 0 ? 'justify-end' : ''}`}
                >
                  {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                  <Skeleton className="h-12 w-48 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-400">
              <p className="text-sm">Напишите первое сообщение</p>
            </div>
          ) : (
            grouped.map(({ date, messages: dayMessages }) => (
              <div key={date}>
                <DateSeparator date={date} />
                <div className="space-y-2">
                  {dayMessages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isFromMe={msg.senderId === user?.id}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ─────────────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-end gap-2 max-w-2xl mx-auto">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Написать сообщение… (Enter — отправить, Shift+Enter — новая строка)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition max-h-32 overflow-y-auto"
              style={{ lineHeight: '1.5' }}
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !text.trim()}
              size="sm"
              className="h-10 w-10 p-0 rounded-xl bg-purple-600 hover:bg-purple-700 shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-1.5">
            Enter — отправить · Shift+Enter — новая строка
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}
