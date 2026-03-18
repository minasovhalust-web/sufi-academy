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
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <img src="/logo.png" alt="Логотип" className="w-8 h-8 rounded-full object-cover" />
            Академия Суфийской Философии
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium hover:text-gray-600 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm font-medium">{user?.firstName}</span>
                <button onClick={handleLogout} className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50">
                  Войти
                </Link>
                <Link href="/auth/register" className="text-sm px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">
                  Регистрация
                </Link>
              </>
            )}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="px-4 py-2 text-sm hover:bg-gray-50 rounded"
                  onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
