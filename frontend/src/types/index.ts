export interface User {
  id: string
  sub?: string
  email: string
  firstName: string
  lastName: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  isActive: boolean
  bio?: string
  avatarUrl?: string
  specialization?: string
  country?: string | null
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  title: string
  description?: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  price?: number
  currency?: string
  imageUrl?: string | null
  instructorId: string
  instructor?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatarUrl'>
  _count?: { enrollments: number; modules: number }
  createdAt: string
  updatedAt: string
}

export interface CourseModule {
  id: string
  title: string
  order: number
  courseId: string
  lessons?: Lesson[]
  createdAt: string
}

export interface Lesson {
  id: string
  title: string
  content?: string
  order: number
  duration?: number
  moduleId: string
  materials?: Material[]
  createdAt: string
}

export interface Material {
  id: string
  title: string
  type: 'VIDEO' | 'AUDIO' | 'PDF' | 'TEXT' | 'LINK'
  url: string
  lessonId: string
}

export interface Video {
  id: string
  lessonId: string
  title: string
  description?: string
  storageKey: string
  mimeType: string
  duration?: number
  status: 'PROCESSING' | 'READY' | 'FAILED'
  createdAt: string
  updatedAt: string
}

export interface Enrollment {
  id: string
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatarUrl' | 'country'>
  progress: number
  userId: string
  courseId: string
  course?: Course
  enrolledAt: string
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  readAt?: string
  metadata?: Record<string, unknown>
  userId: string
  createdAt: string
}

export interface DirectMessageUser {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
}

export interface DirectMessage {
  id: string
  content: string
  senderId: string
  receiverId: string
  createdAt: string
  sender: DirectMessageUser
  receiver: DirectMessageUser
}

export interface Conversation {
  user: DirectMessageUser
  lastMessage: DirectMessage
}

export interface ScheduledLesson {
  id: string
  title: string
  description?: string | null
  scheduledAt: string
  courseId: string
  lessonId?: string | null
  courseTitle?: string
  createdAt: string
}

export interface LiveSession {
  id: string
  title: string
  status: 'SCHEDULED' | 'LIVE' | 'ENDED'
  startedAt?: string
  endedAt?: string
  hostId: string
  courseId: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  content: string
  roomId: string
  senderId: string
  sender?: Pick<User, 'id' | 'firstName' | 'lastName'>
  deletedAt?: string
  createdAt: string
}

export interface LessonProgressData {
  completedLessonIds: string[]
  completedCount: number
  totalCount: number
}

export interface StudentProgressItem {
  userId: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  completedCount: number
  totalCount: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  activeLiveSessions: number
  newUsersLast7Days: number
  usersByRole: Record<string, number>
  coursesByStatus: Record<string, number>
}
