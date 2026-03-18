import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi, adminEnrollmentsApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { User, Course, DashboardStats, ApiResponse, PaginatedResponse, Enrollment } from '@/types'
import { toast } from 'sonner'

export function useAdminDashboard() {
  const isAdmin = useAuthStore((state) => state.isAdmin())
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const response = await adminApi.getDashboard()
      return response.data as ApiResponse<DashboardStats>
    },
    // Only fetch when the user is an admin — avoids 401/403 for guests
    enabled: isAdmin,
  })
}

export function useAdminUsers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const response = await adminApi.getUsers(params)
      return response.data as ApiResponse<PaginatedResponse<User>>
    },
  })
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: async () => {
      const response = await adminApi.getUserById(id)
      return response.data as ApiResponse<User>
    },
    enabled: !!id,
  })
}

export function useAdminCourses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'courses', params],
    queryFn: async () => {
      const response = await adminApi.getCourses(params)
      return response.data as ApiResponse<PaginatedResponse<Course>>
    },
  })
}

export function useUpdateUserRole() {
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await adminApi.updateUserRole(userId, role)
      return response.data as ApiResponse<User>
    },
    onSuccess: () => {
      toast.success('Роль пользователя успешно изменена')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка при изменении роли'
      toast.error(message)
    },
  })
}

export function useUpdateUserStatus() {
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await adminApi.updateUserStatus(userId, isActive)
      return response.data as ApiResponse<User>
    },
    onSuccess: (data) => {
      const status = data.data?.isActive ? 'активирован' : 'деактивирован'
      toast.success(`Пользователь ${status}`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка при изменении статуса'
      toast.error(message)
    },
  })
}

export function useAdminUpdateCourseStatus() {
  return useMutation({
    mutationFn: async ({ courseId, status }: { courseId: string; status: string }) => {
      const response = await adminApi.updateCourseStatus(courseId, status)
      return response.data as ApiResponse<Course>
    },
    onSuccess: () => {
      toast.success('Статус курса успешно изменен')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка при изменении статуса'
      toast.error(message)
    },
  })
}

export function useAdminDeleteCourse() {
  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await adminApi.deleteCourse(courseId)
      return response.data
    },
    onSuccess: () => {
      toast.success('Курс успешно удален')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка при удалении курса'
      toast.error(message)
    },
  })
}

// ── Enrollment management ────────────────────────────────────────────────────

export function useAdminEnrollments(params?: Record<string, unknown>) {
  const isAdmin = useAuthStore((state) => state.isAdmin())
  return useQuery({
    queryKey: ['admin', 'enrollments', params],
    queryFn: async () => {
      const response = await adminEnrollmentsApi.getAll(params)
      return response.data as ApiResponse<PaginatedResponse<Enrollment>>
    },
    enabled: isAdmin,
  })
}

export function useApproveEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await adminEnrollmentsApi.approve(enrollmentId)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enrollments'] })
      toast.success('Заявка одобрена — студент получил доступ к курсу')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при одобрении заявки')
    },
  })
}

export function useRejectEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await adminEnrollmentsApi.reject(enrollmentId)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enrollments'] })
      toast.success('Заявка отклонена')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при отклонении заявки')
    },
  })
}
