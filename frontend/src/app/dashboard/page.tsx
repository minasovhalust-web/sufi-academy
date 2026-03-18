'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useMyEnrollments } from '@/hooks/api/useCourses'
import { useNotifications } from '@/hooks/api/useNotifications'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnrollmentCard } from '@/components/dashboard/EnrollmentCard'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

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
