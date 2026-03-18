'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send } from 'lucide-react'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { chatApi } from '@/lib/api'
import type { ChatMessage } from '@/types'
import { toast } from 'sonner'

interface ChatBoxProps {
  courseId: string
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000'

export function ChatBox({ courseId }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)

  // ── Load history ───────────────────────────────────────────
  useEffect(() => {
    chatApi.getMessages(courseId, { limit: 50 })
      .then((res) => setMessages(res.data.data?.messages ?? []))
      .catch(() => { /* room may not exist yet */ })
  }, [courseId])

  // ── Socket.io connection ───────────────────────────────────
  useEffect(() => {
    if (!accessToken) return

    const socket = io(WS_URL + '/chat', {
      auth: { token: accessToken },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join-room', { courseId })
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    // New message from server
    socket.on('new-message', (msg: ChatMessage) => {
      setMessages((prev) => {
        // Deduplicate by id
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })

    // Typing indicator
    socket.on('user-typing', ({ userId, firstName }: { userId: string; firstName: string }) => {
      if (userId === user?.id) return
      setTypingUsers((prev) => (prev.includes(firstName) ? prev : [...prev, firstName]))
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== firstName))
      }, 3000)
    })

    // Message deleted (soft delete)
    socket.on('message-deleted', ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m))
      )
    })

    socket.on('connect_error', () => {
      setConnected(false)
    })

    return () => {
      socket.emit('leave-room', { courseId })
      socket.disconnect()
      socketRef.current = null
    }
  }, [accessToken, courseId, user?.id])

  // ── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Typing indicator ───────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (socketRef.current && user) {
      socketRef.current.emit('typing', { courseId, firstName: user.firstName })
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }

  // ── Send message ───────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')

    if (socketRef.current && connected) {
      // Optimistic: emit via WebSocket (server broadcasts back as 'new-message')
      socketRef.current.emit('send-message', { courseId, content })
      setSending(false)
    } else {
      // Fallback: REST
      try {
        const res = await chatApi.sendMessage(courseId, content)
        const msg = res.data.data
        if (msg) setMessages((prev) => [...prev, msg])
      } catch {
        toast.error('Не удалось отправить сообщение')
        setInput(content)
      } finally {
        setSending(false)
      }
    }
  }, [input, sending, courseId, connected])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-[var(--color-border)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2">
        <p className="text-sm font-semibold">Чат курса</p>
        <span
          className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`}
          title={connected ? 'Подключено' : 'Отключено'}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-[var(--color-text-secondary)] text-sm py-8">
            Начните разговор!
          </div>
        ) : (
          messages.map((message) => {
            if (message.deletedAt) {
              return (
                <div key={message.id} className="flex gap-3 opacity-40 italic text-xs text-[var(--color-text-secondary)]">
                  Сообщение удалено
                </div>
              )
            }
            const isOwn = message.senderId === user?.id
            return (
              <div key={message.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(message.sender?.firstName || 'U', message.sender?.lastName || 'S')}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                      {message.sender?.firstName}
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-[var(--color-primary)] text-white rounded-tr-sm'
                        : 'bg-[var(--color-background-secondary)] text-[var(--color-text)] rounded-tl-sm'
                    }`}
                  >
                    {message.content}
                  </div>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">
                    {formatRelativeTime(message.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-[var(--color-text-secondary)] rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
            <span>{typingUsers.join(', ')} печатает...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border)] p-3 flex gap-2">
        <Input
          placeholder="Напишите сообщение..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={sending}
          className="flex-1 text-sm"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
