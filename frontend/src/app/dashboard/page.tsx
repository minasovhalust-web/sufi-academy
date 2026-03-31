'use client'

import { useQuery } from '@tanstack/react-query'
import { parseISO, isToday, isTomorrow, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  CalendarDays, Clock, Bell, BookOpen, ChevronRight, BellOff, CalendarX,
} from 'lucide-react'
import Link from 'next/link'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useMyEnrollments } from '@/hooks/api/useCourses'
import { useNotifications } from '@/hooks/api/useNotifications'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EnrollmentCard } from '@/components/dashboard/EnrollmentCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { scheduleApi, progressApi } from '@/lib/api'
import type { ScheduledLesson, LessonProgressData } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatLessonDate(isoString: string): string {
  const date = parseISO(isoString)
  const time = format(date, 'HH:mm')
  if (isToday(date)) return `Сегодня в ${time}`
  if (isTomorrow(date)) return `Завтра в ${time}`
  return `${format(date, 'd MMMM', { locale: ru })} в ${time}`
}

// ── Section: Upcoming Lessons ──────────────────────────────────────────────

function UpcomingLessons() {
  const { data: raw, isLoading } = useQuery({
    queryKey: ['schedule', 'my'],
    queryFn: async () => {
      const res = await scheduleApi.getMy()
      return (res.data?.data ?? []) as ScheduledLesson[]
    },
  })

  const now = new Date()
  const upcoming = (raw ?? [])
    .filter((l) => parseISO(l.scheduledAt) >= now)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
        <CalendarX className="h-10 w-10 text-gray-200 mb-3" />
        <p className="text-sm text-gray-400 font-medium">Нет предстоящих занятий</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {upcoming.map((lesson) => (
        <div
          key={lesson.id}
          className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          {/* Calendar icon badge */}
          <div className="flex-shrink-0 bg-indigo-50 rounded-lg p-2.5">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{lesson.title}</p>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-indigo-600">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatLessonDate(lesson.scheduledAt)}</span>
            </div>
            {lesson.courseTitle && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{lesson.courseTitle}</p>
            )}
          </div>

          {/* Action */}
          <Button asChild size="sm" variant="outline" className="flex-shrink-0 self-center gap-1">
            <Link href={`/learn/${lesson.courseId}`}>
              Перейти
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  )
}

// ── Section: Notifications ─────────────────────────────────────────────────

function NotificationsSection() {
  const { data: notificationsData, isLoading } = useNotifications({ limit: 10 })
  const notifications = notificationsData?.data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
        <BellOff className="h-10 w-10 text-gray-200 mb-3" />
        <p className="text-sm text-gray-400 font-medium">Нет новых уведомлений</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={[
            'flex items-start gap-4 bg-white rounded-xl border shadow-sm p-4 transition-shadow hover:shadow-md',
            notification.isRead ? 'border-gray-100' : 'border-indigo-100',
          ].join(' ')}
        >
          {/* Bell icon */}
          <div className={[
            'flex-shrink-0 rounded-lg p-2.5',
            notification.isRead ? 'bg-gray-50' : 'bg-indigo-50',
          ].join(' ')}>
            <Bell className={[
              'h-5 w-5',
              notification.isRead ? 'text-gray-400' : 'text-indigo-600',
            ].join(' ')} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={['font-semibold truncate', notification.isRead ? 'text-gray-700' : 'text-gray-900'].join(' ')}>
                {notification.title}
              </p>
              {!notification.isRead && (
                <span className="flex-shrink-0 h-2 w-2 rounded-full bg-indigo-500 mt-1.5" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
            <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useMyEnrollments({ limit: 100 })

  const enrollments = enrollmentsData ?? []
  const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE')
  const completedEnrollments = enrollments.filter((e) => e.status === 'COMPLETED')

  // Fetch lesson progress for all active/completed enrollments
  const courseIds = enrollments.map((e) => e.courseId)
  const { data: progressMap } = useQuery<Record<string, { completedCount: number; totalCount: number }>>({
    queryKey: ['progress-bulk', courseIds.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        courseIds.map((id) =>
          progressApi.getCourseProgress(id).then((r) => ({
            courseId: id,
            data: r.data.data as LessonProgressData,
          })).catch(() => ({ courseId: id, data: null }))
        )
      )
      return Object.fromEntries(
        results.filter((r) => r.data).map((r) => [
          r.courseId,
          { completedCount: r.data!.completedCount, totalCount: r.data!.totalCount },
        ])
      )
    },
    enabled: courseIds.length > 0,
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="container-base py-10">

          {/* Greeting */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Добро пожаловать, {user?.firstName}!
            </h1>
            <p className="text-gray-500 text-sm">
              Здесь вы можете отслеживать прогресс обучения и управлять своими курсами
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Всего записей
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{enrollments.length}</p>
                <p className="text-xs text-gray-400 mt-1">{activeEnrollments.length} активных</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  В процессе
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{activeEnrollments.length}</p>
                <p className="text-xs text-gray-400 mt-1">курсов в обучении</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Завершено
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{completedEnrollments.length}</p>
                <p className="text-xs text-gray-400 mt-1">успешно пройдено</p>
              </CardContent>
            </Card>
          </div>

          {/* ── 1. Мои курсы ── */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Мои курсы</h2>
            </div>

            {enrollmentsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-52 rounded-xl" />
                ))}
              </div>
            ) : enrollments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {enrollments.map((enrollment) => (
                  <EnrollmentCard
                    key={enrollment.id}
                    enrollment={enrollment}
                    lessonProgress={progressMap?.[enrollment.courseId]}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                <BookOpen className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 font-medium mb-3">
                  Вы ещё не записались ни на один курс
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/courses">Посмотреть курсы</Link>
                </Button>
              </div>
            )}
          </section>

          {/* ── 2. Предстоящие занятия ── */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Предстоящие занятия</h2>
            </div>
            <UpcomingLessons />
          </section>

          {/* ── 3. Уведомления ── */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Bell className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Уведомления</h2>
            </div>
            <NotificationsSection />
          </section>

        </div>
      </div>
    </ProtectedRoute>
  )
}
