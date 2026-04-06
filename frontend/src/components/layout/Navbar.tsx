'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, MessageSquare, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { getInitials } from '@/lib/utils'
import { directMessagesApi } from '@/lib/api'
import type { Conversation } from '@/types'

// localStorage key used to track when the user last opened the messages page
const DM_LAST_VIEWED_KEY = 'dm_last_viewed'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dmUnreadCount, setDmUnreadCount] = useState(0)
  const router = useRouter()
  const { isAuthenticated, user, clearAuth, isTeacher, isAdmin } = useAuthStore()

  // Prevent hydration mismatch caused by Zustand reading localStorage only on client.
  useEffect(() => { setMounted(true) }, [])

  // ── DM unread count: poll every 30 s ──────────────────────────────────────
  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['dm', 'conversations', 'navbar'],
    queryFn: async () => {
      const res = await directMessagesApi.getConversations()
      return (res.data?.data ?? res.data ?? []) as Conversation[]
    },
    refetchInterval: 30_000,
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (!conversations || !user?.id) return
    const lastViewed =
      typeof window !== 'undefined'
        ? (localStorage.getItem(DM_LAST_VIEWED_KEY) ?? '')
        : ''
    const count = conversations.filter(
      (c) =>
        c.lastMessage.senderId !== user.id &&
        (!lastViewed || c.lastMessage.createdAt > lastViewed),
    ).length
    setDmUnreadCount(count)
  }, [conversations, user?.id])

  /** Call on every click of the Messages link to reset the badge */
  const handleMessagesClick = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DM_LAST_VIEWED_KEY, new Date().toISOString())
    }
    setDmUnreadCount(0)
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/')
    setMobileMenuOpen(false)
  }

  // All hooks above. Auth-dependent rendering is safe only after mount.
  if (!mounted) return null

  const navLinks = [
    { label: 'Главная', href: '/' },
    { label: 'Курсы', href: '/courses' },
  ]

  
  if (isTeacher && isTeacher()) navLinks.push({ label: 'Преподаватель', href: '/teacher' })
  if (isAdmin && isAdmin()) navLinks.push({ label: 'Администрация', href: '/admin' })

  return (
    <nav className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-2">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-base shrink-0">
            <img src="/logo.png" alt="Логотип" className="w-8 h-8 rounded-full object-cover shrink-0" />
            <span className="hidden sm:inline truncate">Академия Суфийской Философии</span>
            <span className="sm:hidden">АСФ</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-gray-600 transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  href="/messages"
                  onClick={handleMessagesClick}
                  className="relative p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Сообщения"
                >
                  <MessageSquare className="h-5 w-5" />
                  {dmUnreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-semibold text-white leading-none">
                      {dmUnreadCount > 9 ? '9+' : dmUnreadCount}
                    </span>
                  )}
                </Link>
                {/* Avatar + name → dashboard */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0 ring-1 ring-gray-200">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-indigo-600 leading-none select-none">
                        {getInitials(user?.firstName ?? '', user?.lastName ?? '')}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.firstName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm px-3 py-1.5 border rounded-md hover:bg-gray-50"
                >
                  Войти
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* Mobile burger button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-3 space-y-1">
            {/* Nav links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Divider */}
            <div className="border-t my-2" />

            {/* Auth actions */}
            {isAuthenticated ? (
              <div className="space-y-1">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center shrink-0 ring-1 ring-gray-200">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-indigo-600 select-none">
                        {getInitials(user?.firstName ?? '', user?.lastName ?? '')}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Личный кабинет
                </Link>
                <Link
                  href="/messages"
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={handleMessagesClick}
                >
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  Сообщения
                  {dmUnreadCount > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white leading-none">
                      {dmUnreadCount > 9 ? '9+' : dmUnreadCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors text-red-600"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1 pb-1 px-1">
                <Link
                  href="/auth/login"
                  className="flex justify-center px-3 py-2.5 text-sm font-medium border rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Войти
                </Link>
                <Link
                  href="/auth/register"
                  className="flex justify-center px-3 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
