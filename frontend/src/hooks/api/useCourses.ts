import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { coursesApi, enrollmentsApi, materialsApi, lessonsApi } from '@/lib/api'
import type { Course, CourseModule, Lesson, Material, Enrollment, PaginatedResponse } from '@/types'
import { toast } from 'sonner'

// No response interceptor unwraps data in api.ts.
// Backend wraps every response as: { success: true, data: <payload>, timestamp }
// So the actual payload lives at response.data.data (axios response → backend wrapper → payload).

export function useCourses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: async () => {
      const response = await coursesApi.getAll(params)
      return response.data.data as Course[]
    },
  })
}

export function useMyCourses() {
  return useQuery({
    queryKey: ['courses', 'my'],
    queryFn: async () => {
      const response = await coursesApi.getMy()
      return response.data.data as Course[]
    },
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: async () => {
      const response = await coursesApi.getById(id)
      return response.data.data as Course
    },
    enabled: !!id,
  })
}

export function useEnroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await enrollmentsApi.enroll(courseId)
      return response.data.data as Enrollment
    },
    onSuccess: () => {
      // Refresh enrollment list so UI reflects new PENDING status immediately
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'my'] })
      toast.success('Заявка отправлена, ожидайте подтверждения администратора')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка при записи на курс'
      toast.error(message)
    },
  })
}

export function useMyEnrollments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['enrollments', 'my', params],
    queryFn: async () => {
      // GET /enrollments/my returns a plain Enrollment[] (no pagination wrapper)
      const response = await enrollmentsApi.myEnrollments(params)
      return response.data.data as Enrollment[]
    },
    enabled: params !== undefined,
  })
}

export function useCreateCourse() {
  return useMutation({
    mutationFn: async (dto: any) => {
      const response = await coursesApi.create(dto)
      return response.data.data as Course
    },
    onSuccess: () => {
      toast.success('Курс успешно создан!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка при создании курса'
      toast.error(message)
    },
  })
}

export function useUpdateCourse(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: any) => {
      const response = await coursesApi.update(id, dto)
      return response.data.data as Course
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', id] })
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] })
      toast.success('Курс успешно обновлен!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка при обновлении курса'
      toast.error(message)
    },
  })
}

export function useDeleteCourse() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await coursesApi.delete(id)
      return response.data.data
    },
    onSuccess: () => {
      toast.success('Курс успешно удален!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка при удалении курса'
      toast.error(message)
    },
  })
}

export function useCourseModules(courseId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['courses', courseId, 'modules'],
    queryFn: async () => {
      const response = await coursesApi.getModules(courseId)
      return response.data.data as CourseModule[]
    },
    // Allow callers to gate the query on authentication so the request is not
    // sent before the Zustand auth store has hydrated (which would result in a
    // missing Authorization header and a 401 from the backend).
    enabled: !!courseId && (options?.enabled !== false),
  })
}

export function useCreateModule(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: { title: string; order?: number }) => {
      const response = await coursesApi.createModule(courseId, dto)
      return response.data.data as CourseModule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] })
      toast.success('Модуль добавлен')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании модуля')
    },
  })
}

export function useCourseLessons(courseId: string, moduleId: string) {
  return useQuery({
    queryKey: ['courses', courseId, 'modules', moduleId, 'lessons'],
    queryFn: async () => {
      const response = await coursesApi.getLessons(courseId, moduleId)
      return response.data.data as Lesson[]
    },
    enabled: !!courseId && !!moduleId,
  })
}

export function useCreateLesson(courseId: string, moduleId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: { title: string; content?: string; order?: number; duration?: number }) => {
      const response = await coursesApi.createLesson(courseId, moduleId, dto)
      return response.data.data as Lesson
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules', moduleId, 'lessons'] })
      toast.success('Урок добавлен')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании урока')
    },
  })
}

export function useCourseMaterials(lessonId: string) {
  return useQuery({
    queryKey: ['lessons', lessonId, 'materials'],
    queryFn: async () => {
      const response = await materialsApi.getByLesson(lessonId)
      return response.data.data as Material[]
    },
    enabled: !!lessonId,
  })
}

export function useCreateMaterial(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: { title: string; type: string; url: string }) => {
      const response = await materialsApi.create(lessonId, dto)
      return response.data.data as Material
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', lessonId, 'materials'] })
      toast.success('Материал добавлен')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при добавлении материала')
    },
  })
}

export function useLesson(id: string | null) {
  return useQuery({
    queryKey: ['lessons', id],
    queryFn: async () => {
      const response = await lessonsApi.getById(id!)
      return response.data.data as Lesson
    },
    enabled: !!id,
  })
}

export function useDeleteMaterial(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (materialId: string) => {
      const response = await materialsApi.delete(lessonId, materialId)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', lessonId, 'materials'] })
      toast.success('Материал удалён')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при удалении материала')
    },
  })
}
