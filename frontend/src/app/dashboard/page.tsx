'use client'

import { useState, useEffect } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, addMonths, subMonths,
  isToday, parseISO, startOfWeek, endOfWeek,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useMyEnrollments } from '@/hooks/api/useCourses'
import { useNotifications } from '@/hooks/api/useNotifications'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnrollmentCard } from '@/components/dashboard/EnrollmentCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import { scheduleApi } from '@/lib/api'
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react'
import type { ScheduledLesson } from '@/types'
import Link from 'next/link'

// ── Mini Calendar ──────────────────────────────────────────────────────────

function ScheduleCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

  const { data: raw, isLoading } = useQuery({
    queryKey: ['schedule', 'my'],
    queryFn: async () => {
      const res = await scheduleApi.getMy()
      return (res.data?.data ?? []) as ScheduledLesson[]
    },
  })
  const lessons = raw ?? []

  // Build a set of "YYYY-MM-DD" strings that have lessons
  const busyDays = new Set(lessons.map((l) => l.scheduledAt.slice(0, 10)))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  // Full weeks grid (Mon–Sun)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const selectedLessons = selectedDay
    ? lessons.filter((l) => isSameDay(parseISO(l.scheduledAt), selectedDay))
    : []

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar grid */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>
          <h3 className="font-semibold text-gray-800 capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const hasBusy = busyDays.has(key)
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
              const inMonth = isSameMonth(day, currentMonth)
              const todayClass = isToday(day)

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(day)}
                  className={[
                    'relative h-9 w-full rounded-lg text-sm font-medium transition-all',
                    !inMonth ? 'text-gray-300' : 'text-gray-700',
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md'
                      : todayClass
                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300'
                      : 'hover:bg-gray-50',
                  ].join(' ')}
                >
                  {format(day, 'd')}
                  {hasBusy && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-violet-500" />
                  )}
                  {hasBusy && isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Day details panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col">
        <h3 className="font-semibold text-gray-800 mb-1">
          {selectedDay
            ? format(selectedDay, 'd MMMM yyyy', { locale: ru })
            : 'Выберите день'}
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          {selectedLessons.length > 0
            ? `${selectedLessons.length} занятий`
            : 'Занятий нет'}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : selectedLessons.length > 0 ? (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {selectedLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-3 rounded-lg bg-indigo-50 border border-indigo-100"
              >
                <p className="font-medium text-sm text-gray-800">{lesson.title}</p>
                {lesson.courseTitle && (
                  <p className="text-xs text-indigo-600 mt-0.5">{lesson.courseTitle}</p>
                )}
                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {format(parseISO(lesson.scheduledAt), 'HH:mm')}
                </div>
                {lesson.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{lesson.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <CalendarDays className="h-8 w-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">Нет занятий</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useMyEnrollments({ limit: 100 })
  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications({ limit: 10 })

  const enrollments = enrollmentsData || []          // useMyEnrollments returns Enrollment[] directly
  const notifications = notificationsData?.data?.data || []  // useNotifications returns ApiResponse<PaginatedResponse>
  const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE')
  const completedEnrollments = enrollments.filter((e) => e.status === 'COMPLETED')

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <div className="container-base py-12">
          {/* Greeting */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Добро пожаловать, {user?.firstName}!</h1>
            <p className="text-[var(--color-text-secondary)]">
              Здесь вы можете отслеживать прогресс обучения и управлять своими курсами
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Всего записей
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{enrollments.length}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                  {activeEnrollments.length} активных
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                  В процессе
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{activeEnrollments.length}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                  курсов в обучении
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Завершено
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{completedEnrollments.length}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                  успешно пройдено
                </p>
              </CardContent>
            </Card>
          </div>

          {/* My Courses */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Мои курсы</h2>
            {enrollmentsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48" />
                  </div>
                ))}
              </div>
            ) : enrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => (
                  <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-[var(--color-text-secondary)] mb-4">
                      Вы еще не записались ни на один курс
                    </p>
                    <Link href="/courses" className="text-[var(--color-primary)] hover:underline font-medium">
                      Посмотреть доступные курсы
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Schedule / Calendar */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-2">Расписание</h2>
            <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
              Предстоящие занятия по вашим курсам
            </p>
            <ScheduleCalendar />
          </div>

          {/* Notifications */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Недавние уведомления</h2>
            {notificationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start gap-4 p-4 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-background-secondary)] transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                            {notification.body}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="h-2 w-2 bg-[var(--color-primary)] rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-[var(--color-text-secondary)]">
                      Нет новых уведомлений
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
