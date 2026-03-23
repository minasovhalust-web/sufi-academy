'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAuthStore } from '@/store/auth.store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useConversations } from '@/hooks/api/useDirectMessages'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Search, Plus, X } from 'lucide-react'
import type { Conversation } from '@/types'
import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'

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

// ── New Dialog Modal ──────────────────────────────────────────────────────────

interface UserPickerUser {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string | null
  role: string
}

function NewDialogModal({
  currentUserId,
  onClose,
}: {
  currentUserId: string
  onClose: () => void
}) {
  const router = useRouter()
  const [pickerSearch, setPickerSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [allUsers, setAllUsers] = useState<UserPickerUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Debounce search input by 300 ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(pickerSearch), 300)
    return () => clearTimeout(t)
  }, [pickerSearch])

  // Re-fetch when debounced search term changes
  useEffect(() => {
    setLoadingUsers(true)
    adminApi
      .getUsers({ search: debouncedSearch || undefined, limit: 20 })
      .then((res) => {
        // /admin/users returns { data: [...], total, ... } wrapped by TransformInterceptor
        // → res.data = { success, data: { data: [...], total, ... } }
        // Plain /users returns { users: [...], total } wrapped the same way
        // → res.data = { success, data: { users: [...], total } }
        // Support both shapes:
        const payload = res.data?.data as Record<string, unknown> | undefined
        const users = (
          Array.isArray(payload?.data) ? payload!.data :
          Array.isArray(payload?.users) ? payload!.users :
          []
        ) as UserPickerUser[]
        setAllUsers(users.filter((u) => u.id !== currentUserId))
      })
      .catch(() => setAllUsers([]))
      .finally(() => setLoadingUsers(false))
  }, [currentUserId, debouncedSearch])

  const filteredUsers = allUsers

  const handleSelect = (userId: string) => {
    onClose()
    router.push(`/messages/${userId}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden max-h-[80vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Новый диалог</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Поиск пользователей…"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
            />
          </div>
        </div>

        {/* User list */}
        <div className="overflow-y-auto flex-1">
          {loadingUsers ? (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm">Пользователи не найдены</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelect(u.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left"
              >
                <Avatar name={`${u.firstName} ${u.lastName}`} avatarUrl={u.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuthStore()
  const { data: conversations, isLoading } = useConversations()
  const [search, setSearch] = useState('')
  const [newDialogOpen, setNewDialogOpen] = useState(false)

  const filtered = (conversations ?? []).filter((c) => {
    const name = `${c.user.firstName} ${c.user.lastName}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-8 px-4">

          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold">Сообщения</h1>
            </div>
            <button
              onClick={() => setNewDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
              Новый диалог
            </button>
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
                    <p className="text-xs">Нажмите «Новый диалог», чтобы начать переписку</p>
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

      {/* New Dialog Modal */}
      {newDialogOpen && (
        <NewDialogModal
          currentUserId={user?.id ?? ''}
          onClose={() => setNewDialogOpen(false)}
        />
      )}
    </ProtectedRoute>
  )
}
