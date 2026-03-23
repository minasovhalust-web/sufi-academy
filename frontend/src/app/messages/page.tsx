'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAuthStore } from '@/store/auth.store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useConversations } from '@/hooks/api/useDirectMessages'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Search } from 'lucide-react'
import type { Conversation } from '@/types'
import { useState } from 'react'

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'
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

// ── Conversation Item ─────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  currentUserId,
}: {
  conv: Conversation
  currentUserId: string
}) {
  const { user, lastMessage } = conv
  const isFromMe = lastMessage.senderId === currentUserId
  const preview = isFromMe ? `Вы: ${lastMessage.content}` : lastMessage.content
  const truncated = preview.length > 60 ? preview.slice(0, 57) + '…' : preview

  const timeAgo = formatDistanceToNow(new Date(lastMessage.createdAt), {
    addSuffix: true,
    locale: ru,
  })

  return (
    <Link
      href={`/messages/${user.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      <Avatar name={`${user.firstName} ${user.lastName}`} avatarUrl={user.avatarUrl} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-sm text-gray-900 truncate">
            {user.firstName} {user.lastName}
          </span>
          <span className="text-xs text-gray-400 shrink-0">{timeAgo}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{truncated}</p>
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuthStore()
  const { data: conversations, isLoading } = useConversations()
  const [search, setSearch] = useState('')

  const filtered = (conversations ?? []).filter((c) => {
    const name = `${c.user.firstName} ${c.user.lastName}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-8 px-4">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold">Сообщения</h1>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по диалогам…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
            />
          </div>

          {/* Conversations card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-gray-100">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-52" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                {search ? (
                  <p className="text-sm">Диалогов не найдено</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-500 mb-1">Нет диалогов</p>
                    <p className="text-xs">Напишите другому пользователю, чтобы начать переписку</p>
                  </>
                )}
              </div>
            ) : (
              <div>
                {filtered.map((conv) => (
                  <ConversationItem
                    key={conv.user.id}
                    conv={conv}
                    currentUserId={user?.id ?? ''}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </ProtectedRoute>
  )
}
