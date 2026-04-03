'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.post('/auth/verify-email', { email, code })
      // Backend returns { user, accessToken, refreshToken } on success
      const data = response.data?.data ?? response.data
      if (data?.user && data?.accessToken) {
        setAuth(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken })
        setSuccess('Email подтверждён! Входим в аккаунт...')
        setTimeout(() => router.push('/dashboard'), 1500)
      } else {
        setSuccess('Email подтверждён! Перенаправляем...')
        setTimeout(() => router.push('/auth/login'), 1500)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await apiClient.post('/auth/resend-verification', { email })
      setResendTimer(60)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка отправки')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">Подтверждение email</h1>
        <p className="text-gray-500 text-center mb-6">Введите код отправленный на {email}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Введите 6-значный код"
            maxLength={6}
            className="w-full border rounded-lg px-4 py-3 text-center text-2xl tracking-widest mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-3">{success}</p>}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Проверяем...' : 'Подтвердить'}
          </button>
        </form>
        <div className="mt-4 text-center">
          {resendTimer > 0 ? (
            <p className="text-gray-400 text-sm">Отправить повторно через {resendTimer}с</p>
          ) : (
            <button onClick={handleResend} className="text-indigo-600 text-sm hover:underline">
              Отправить код повторно
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка...</div>}>
      <VerifyEmailForm />
    </Suspense>
  )
}
