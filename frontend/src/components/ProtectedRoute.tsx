'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'TEACHER' | 'ADMIN'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
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
  }, [isAuthenticated, user?.role, requiredRole, router])

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole === 'ADMIN' && user?.role !== 'ADMIN') {
    return null
  }

  if (requiredRole === 'TEACHER' && user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
    return null
  }

  return <>{children}</>
}
