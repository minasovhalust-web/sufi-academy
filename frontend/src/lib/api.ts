import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { LoginDto, RegisterDto } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// Token helpers — read/write through the Zustand auth store so tokens always
// live in one place (auth-storage) regardless of what calls them.
// We use require() here to avoid circular-dependency issues at module init time.
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require('@/store/auth.store')
  return useAuthStore.getState().accessToken
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require('@/store/auth.store')
  return useAuthStore.getState().refreshToken
}

function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require('@/store/auth.store')
  const state = useAuthStore.getState()
  if (state.user) {
    state.setAuth(state.user, { accessToken, refreshToken })
  }
}

function clearAuth() {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require('@/store/auth.store')
  useAuthStore.getState().clearAuth()
  window.location.href = '/auth/login'
}

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // When the request body is FormData the browser must set Content-Type itself
    // (it includes the multipart boundary: "multipart/form-data; boundary=...").
    // The axios instance default "application/json" Content-Type must be removed,
    // otherwise multer receives the wrong content-type and cannot parse the file
    // → 400 "No file received".
    // Using AxiosHeaders.delete() is the reliable way in axios 1.x.
    if (config.data instanceof FormData) {
      config.headers.delete('Content-Type')
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
let isRefreshing = false
let failedQueue: Array<(token: string) => void> = []

const processQueue = (token: string) => {
  failedQueue.forEach((prom) => prom(token))
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          failedQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          clearAuth()
          return Promise.reject(error)
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = response.data.data

        setTokens(accessToken, newRefreshToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        processQueue(accessToken)
        isRefreshing = false

        return apiClient(originalRequest)
      } catch (refreshError) {
        clearAuth()
        isRefreshing = false
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (dto: LoginDto) => apiClient.post('/auth/login', dto),
  register: (dto: RegisterDto) => apiClient.post('/auth/register', dto),
  refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => apiClient.post('/auth/logout', { refreshToken }),
  me: () => apiClient.get('/users/me'),
}

// Courses API
export const coursesApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get('/courses', { params }),
  getMy: () => apiClient.get('/courses/my'),
  getById: (id: string) => apiClient.get(`/courses/${id}`),
  create: (dto: unknown) => apiClient.post('/courses', dto),
  update: (id: string, dto: unknown) => apiClient.patch(`/courses/${id}`, dto),
  delete: (id: string) => apiClient.delete(`/courses/${id}`),
  getModules: (courseId: string) => apiClient.get(`/courses/${courseId}/modules`),
  createModule: (courseId: string, dto: unknown) => apiClient.post(`/courses/${courseId}/modules`, dto),
  getLessons: (courseId: string, moduleId: string) => apiClient.get(`/courses/${courseId}/modules/${moduleId}/lessons`),
  createLesson: (courseId: string, moduleId: string, dto: unknown) => apiClient.post(`/courses/${courseId}/modules/${moduleId}/lessons`, dto),
}

// Lessons API
export const lessonsApi = {
  getById: (id: string) => apiClient.get(`/lessons/${id}`),
}

// Materials API
export const materialsApi = {
  getByLesson: (lessonId: string) => apiClient.get(`/lessons/${lessonId}/materials`),
  create: (lessonId: string, dto: unknown) => apiClient.post(`/lessons/${lessonId}/materials`, dto),
  delete: (lessonId: string, materialId: string) => apiClient.delete(`/lessons/${lessonId}/materials/${materialId}`),
}

// Enrollments API
export const enrollmentsApi = {
  enroll: (courseId: string) => apiClient.post('/enrollments', { courseId }),
  myEnrollments: (params?: Record<string, unknown>) => apiClient.get('/enrollments/my', { params }),
  getById: (id: string) => apiClient.get(`/enrollments/${id}`),
  updateProgress: (id: string, progress: number) => apiClient.patch(`/enrollments/${id}`, { progress }),
}

// Notifications API
export const notificationsApi = {
  getMy: (params?: Record<string, unknown>) => apiClient.get('/notifications/my', { params }),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
}

// Chat API
export const chatApi = {
  getMessages: (courseId: string, params?: Record<string, unknown>) =>
    apiClient.get(`/chat/rooms/${courseId}/messages`, { params }),
  sendMessage: (courseId: string, content: string) =>
    apiClient.post(`/chat/rooms/${courseId}/messages`, { content }),
}

// Storage API — file uploads for chat attachments
export const storageApi = {
  /**
   * Upload any file (image, video, audio, pdf, doc) as a chat attachment.
   * Returns { key, url, name, mimeType, size }.
   * url is a 30-day signed S3 URL suitable for embedding in chat messages.
   */
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    // No Content-Type override — the request interceptor above detects FormData
    // and removes the 'application/json' default, letting the browser set
    // 'multipart/form-data; boundary=...' automatically.
    return apiClient.post('/storage/upload', form)
  },
}

// Admin API
export const adminApi = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getUsers: (params?: Record<string, unknown>) => apiClient.get('/admin/users', { params }),
  getUserById: (id: string) => apiClient.get(`/admin/users/${id}`),
  updateUserRole: (id: string, role: string) => apiClient.patch(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id: string, isActive: boolean) => apiClient.patch(`/admin/users/${id}/status`, { isActive }),
  getCourses: (params?: Record<string, unknown>) => apiClient.get('/admin/courses', { params }),
  updateCourseStatus: (id: string, status: string) => apiClient.patch(`/admin/courses/${id}/status`, { status }),
  deleteCourse: (id: string) => apiClient.delete(`/admin/courses/${id}`),
}

// Teacher API
export const teacherApi = {
  myCourses: (params?: Record<string, unknown>) => apiClient.get('/courses', { params: { ...params, instructorId: 'me' } }),
  createCourse: (dto: unknown) => apiClient.post('/courses', dto),
  updateCourse: (id: string, dto: unknown) => apiClient.patch(`/courses/${id}`, dto),
  getLiveSessions: (courseId?: string) => apiClient.get('/live/sessions', { params: { courseId } }),
  createLiveSession: (dto: unknown) => apiClient.post('/live/sessions', dto),
}

// Videos API
export const videosApi = {
  // Step 1 of upload: get pre-signed S3 PUT URL
  requestUploadUrl: (dto: { lessonId: string; title: string; mimeType: string; description?: string }) =>
    apiClient.post('/videos/upload-url', dto),
  // Step 3 of upload: persist video record after S3 upload completes
  create: (dto: { lessonId: string; title: string; storageKey: string; mimeType: string; duration?: number; description?: string }) =>
    apiClient.post('/videos', dto),
  getByLesson: (lessonId: string) => apiClient.get(`/videos/lesson/${lessonId}`),
  getStreamUrl: (videoId: string) => apiClient.get(`/videos/${videoId}/stream-url`),
  update: (videoId: string, dto: { title?: string; description?: string; duration?: number; status?: string }) =>
    apiClient.patch(`/videos/${videoId}`, dto),
  delete: (videoId: string) => apiClient.delete(`/videos/${videoId}`),
}

// Enrollment management (admin)
export const adminEnrollmentsApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get('/admin/enrollments', { params }),
  approve: (id: string) => apiClient.patch(`/admin/enrollments/${id}/approve`),
  reject: (id: string) => apiClient.patch(`/admin/enrollments/${id}/reject`),
}
