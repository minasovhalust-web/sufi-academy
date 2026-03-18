import { useMutation, useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'
import type { Notification, ApiResponse, PaginatedResponse } from '@/types'
import { toast } from 'sonner'

export function useNotifications(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const response = await notificationsApi.getMy(params)
      return response.data as ApiResponse<PaginatedResponse<Notification>>
    },
    refetchInterval: 30000,
  })
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await notificationsApi.markRead(id)
      return response.data
    },
    onError: (error: any) => {
      console.error('Failed to mark notification as read:', error)
    },
  })
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: async () => {
      const response = await notificationsApi.markAllRead()
      return response.data
    },
    onSuccess: () => {
      toast.success('Все уведомления отмечены как прочитанные')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка при отметке уведомлений'
      toast.error(message)
    },
  })
}
