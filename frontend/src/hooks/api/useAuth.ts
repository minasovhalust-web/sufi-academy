import { useMutation, useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { User, LoginDto, RegisterDto, ApiResponse } from '@/types'
import { toast } from 'sonner'

// Re-exported for convenience — the register page uses this to redirect to verify-email.
export type RegisterResponse = { message: string }

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await authApi.me()
      return response.data as ApiResponse<User>
    },
    enabled: !!useAuthStore((state) => state.isAuthenticated),
  })
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: async (dto: LoginDto) => {
      const response = await authApi.login(dto)
      return response.data
    },
    onSuccess: (data: any) => {
      const user = data?.data?.user
      const accessToken = data?.data?.accessToken
      const refreshToken = data?.data?.refreshToken
      if (user && accessToken) {
        setAuth(user, { accessToken, refreshToken })
        toast.success('Добро пожаловать!')
        window.location.href = '/dashboard'
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка входа'
      toast.error(message)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (dto: RegisterDto) => {
      const response = await authApi.register(dto)
      // Backend now returns { message } — no tokens on register
      return response.data as { message: string }
    },
    onSuccess: () => {
      // Redirect is handled by the per-call onSuccess in the register page.
      // Show a toast so the user knows to check their email.
      toast.success('Код подтверждения отправлен на ваш email')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка регистрации'
      toast.error(message)
    },
  })
}

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth)

  return useMutation({
    mutationFn: async () => {},
    onSettled: () => {
      clearAuth()
      toast.success('Вы вышли из системы')
      window.location.href = '/'
    },
  })
}
