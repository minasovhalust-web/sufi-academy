'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  useAdminDashboard,
  useAdminUsers,
  useAdminCourses,
  useAdminEnrollments,
  useUpdateUserRole,
  useUpdateUserStatus,
  useAdminUpdateCourseStatus,
  useAdminDeleteCourse,
  useApproveEnrollment,
  useRejectEnrollment,
} from '@/hooks/api/useAdmin'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getRoleLabel, getCourseStatusLabel, getInitials } from '@/lib/utils'
import { Trash2, Check, X, Clock } from 'lucide-react'

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'На рассмотрении',
  ACTIVE: 'Активна',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отклонена',
}

export default function AdminPage() {
  const { data: statsData, isLoading: statsLoading } = useAdminDashboard()
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({ page: 1, limit: 20 })
  const { data: coursesData, isLoading: coursesLoading } = useAdminCourses({ page: 1, limit: 20 })
  const { data: pendingData, isLoading: pendingLoading } = useAdminEnrollments({ status: 'PENDING' })
  const { mutate: updateUserRole } = useUpdateUserRole()
  const { mutate: updateUserStatus } = useUpdateUserStatus()
  const { mutate: updateCourseStatus } = useAdminUpdateCourseStatus()
  const { mutate: deleteCourse } = useAdminDeleteCourse()
  const { mutate: approve, isPending: approving } = useApproveEnrollment()
  const { mutate: reject, isPending: rejecting } = useRejectEnrollment()

  const [userSearch, setUserSearch] = useState('')
  const [courseSearch, setCourseSearch] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)

  const stats = statsData?.data
  const users = usersData?.data?.data || []
  const courses = coursesData?.data?.data || []
  const pendingEnrollments = pendingData?.data?.data || []
  const pendingCount = pendingData?.data?.total ?? 0

  const handleDeleteCourse = (courseId: string) => {
    setDeletingCourseId(courseId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (deletingCourseId) {
      deleteCourse(deletingCourseId, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setDeletingCourseId(null)
        },
      })
    }
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-white">
        <div className="container-base py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8">Администрация</h1>

          <Tabs defaultValue="overview" className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className="w-max min-w-full md:w-auto">
                <TabsTrigger value="overview">Обзор</TabsTrigger>
                <TabsTrigger value="enrollments" className="relative">
                  Заявки
                  {pendingCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="users">Пользователи</TabsTrigger>
                <TabsTrigger value="courses">Курсы</TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {statsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Пользователей
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Курсов
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.totalCourses}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Записей
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Live сессии
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.activeLiveSessions}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Новых (7дн)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.newUsersLast7Days}</p>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {/* Pending enrollments alert on overview */}
              {pendingCount > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-6 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">{pendingCount} заявок</span> ожидают одобрения.{' '}
                      <button
                        onClick={() => {
                          const tab = document.querySelector('[data-value="enrollments"]') as HTMLElement
                          tab?.click()
                        }}
                        className="underline hover:no-underline"
                      >
                        Перейти к заявкам
                      </button>
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Enrollments Tab */}
            <TabsContent value="enrollments" className="space-y-6">
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Заявки на обучение</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Одобрите или отклоните заявки студентов
                  </p>
                </div>
                {pendingCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 shrink-0">
                    {pendingCount} ожидает
                  </Badge>
                )}
              </div>

              <Card>
                <CardContent className="pt-6">
                  {pendingLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
                    </div>
                  ) : pendingEnrollments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--color-border)]">
                            <th className="text-left p-3 font-semibold">Студент</th>
                            <th className="text-left p-3 font-semibold">Курс</th>
                            <th className="text-left p-3 font-semibold">Дата заявки</th>
                            <th className="text-left p-3 font-semibold">Статус</th>
                            <th className="text-left p-3 font-semibold">Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingEnrollments.map((enrollment) => (
                            <tr
                              key={enrollment.id}
                              className="border-b border-[var(--color-border)] hover:bg-[var(--color-background-secondary)]"
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {getInitials(
                                        enrollment.user?.firstName ?? '',
                                        enrollment.user?.lastName ?? '',
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {enrollment.user?.firstName} {enrollment.user?.lastName}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-secondary)]">
                                      {enrollment.user?.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <p className="font-medium">{enrollment.course?.title}</p>
                              </td>
                              <td className="p-3 text-[var(--color-text-secondary)]">
                                {new Date(enrollment.enrolledAt).toLocaleDateString('ru-RU')}
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant="outline"
                                  className={
                                    enrollment.status === 'PENDING'
                                      ? 'border-amber-300 text-amber-700 bg-amber-50'
                                      : enrollment.status === 'ACTIVE'
                                      ? 'border-green-300 text-green-700 bg-green-50'
                                      : 'border-red-300 text-red-700 bg-red-50'
                                  }
                                >
                                  {ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {enrollment.status === 'PENDING' && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-700 border-green-300 hover:bg-green-50"
                                      disabled={approving}
                                      onClick={() => approve(enrollment.id)}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Одобрить
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-700 border-red-300 hover:bg-red-50"
                                      disabled={rejecting}
                                      onClick={() => reject(enrollment.id)}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Отклонить
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="text-[var(--color-text-secondary)]">Нет заявок на рассмотрении</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Поиск пользователей..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="flex-1"
                />
              </div>

              <Card>
                <CardContent className="pt-6">
                  {usersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : users.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--color-border)]">
                            <th className="text-left p-2 font-semibold">Пользователь</th>
                            <th className="text-left p-2 font-semibold">Email</th>
                            <th className="text-left p-2 font-semibold">Роль</th>
                            <th className="text-left p-2 font-semibold">Статус</th>
                            <th className="text-left p-2 font-semibold">Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users
                            .filter((u) =>
                              `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase())
                            )
                            .map((user) => (
                              <tr
                                key={user.id}
                                className="border-b border-[var(--color-border)] hover:bg-[var(--color-background-secondary)]"
                              >
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                                      <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">
                                      {user.firstName} {user.lastName}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2 text-[var(--color-text-secondary)]">{user.email}</td>
                                <td className="p-2">
                                  <Select
                                    value={user.role}
                                    onValueChange={(value) =>
                                      updateUserRole({ userId: user.id, role: value })
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="STUDENT">Студент</SelectItem>
                                      <SelectItem value="TEACHER">Учитель</SelectItem>
                                      <SelectItem value="ADMIN">Администратор</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={user.isActive}
                                      onCheckedChange={(checked) =>
                                        updateUserStatus({ userId: user.id, isActive: checked })
                                      }
                                    />
                                    <span className="text-xs">
                                      {user.isActive ? 'Активен' : 'Неактивен'}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2">
                                  <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-[var(--color-text-secondary)]">Пользователи не найдены</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Поиск курсов..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="flex-1"
                />
              </div>

              <Card>
                <CardContent className="pt-6">
                  {coursesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : courses.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--color-border)]">
                            <th className="text-left p-2 font-semibold">Название</th>
                            <th className="text-left p-2 font-semibold">Инструктор</th>
                            <th className="text-left p-2 font-semibold">Статус</th>
                            <th className="text-left p-2 font-semibold">Студентов</th>
                            <th className="text-left p-2 font-semibold">Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courses
                            .filter((c) => c.title.toLowerCase().includes(courseSearch.toLowerCase()))
                            .map((course) => (
                              <tr
                                key={course.id}
                                className="border-b border-[var(--color-border)] hover:bg-[var(--color-background-secondary)]"
                              >
                                <td className="p-2 font-medium">{course.title}</td>
                                <td className="p-2 text-[var(--color-text-secondary)]">
                                  {course.instructor?.firstName} {course.instructor?.lastName}
                                </td>
                                <td className="p-2">
                                  <Select
                                    value={course.status}
                                    onValueChange={(value) =>
                                      updateCourseStatus({ courseId: course.id, status: value })
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="DRAFT">Черновик</SelectItem>
                                      <SelectItem value="PUBLISHED">Опубликован</SelectItem>
                                      <SelectItem value="ARCHIVED">Архив</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-2">{course._count?.enrollments || 0}</td>
                                <td className="p-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteCourse(course.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-[var(--color-text-secondary)]">Курсы не найдены</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Delete Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Удалить курс?</DialogTitle>
                <DialogDescription>
                  Это действие нельзя отменить. Все связанные данные будут удалены.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Отмена
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Удалить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
}
