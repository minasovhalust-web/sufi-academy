'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { isAuthenticated, user, clearAuth, isTeacher, isAdmin } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    router.push('/')
    setMobileMenuOpen(false)
  }

  const navLinks = [
    { label: 'Главная', href: '/' },
    { label: 'Курсы', href: '/courses' },
  ]

  if (isAuthenticated) navLinks.push({ label: 'Личный кабинет', href: '/dashboard' })
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
                <span className="text-sm font-medium text-gray-700">{user?.firstName}</span>
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
                <div className="px-3 py-2 text-sm text-gray-500">
                  Вы вошли как <span className="font-semibold text-gray-800">{user?.firstName} {user?.lastName}</span>
                </div>
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
