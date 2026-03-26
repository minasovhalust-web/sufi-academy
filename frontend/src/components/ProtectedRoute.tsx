'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'TEACHER' | 'ADMIN'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  // Wait for Zustand to rehydrate from localStorage before checking auth state
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (requiredRole === 'ADMIN' && user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    if (requiredRole === 'TEACHER' && user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [mounted, isAuthenticated, user?.role, requiredRole, router])

  // While localStorage is being read, show a neutral loading screen
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (requiredRole === 'ADMIN' && user?.role !== 'ADMIN') return null

  if (requiredRole === 'TEACHER' && user?.role !== 'TEACHER' && user?.role !== 'ADMIN') return null

  return <>{children}</>
}
