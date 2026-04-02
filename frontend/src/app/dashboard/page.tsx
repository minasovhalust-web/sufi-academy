'use client'

import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { parseISO, isToday, isTomorrow, format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  CalendarDays, Clock, Bell, BookOpen, ChevronRight, BellOff, CalendarX,
  Camera, Loader2, CheckCircle2, AlertCircle, Save, User as UserIcon, Settings,
} from 'lucide-react'
import Link from 'next/link'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useMyEnrollments } from '@/hooks/api/useCourses'
import { useNotifications } from '@/hooks/api/useNotifications'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnrollmentCard } from '@/components/dashboard/EnrollmentCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { scheduleApi, progressApi, usersApi } from '@/lib/api'
import { COUNTRIES } from '@/lib/countries'
import type { ScheduledLesson, LessonProgressData, User } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatLessonDate(isoString: string): string {
  const date = parseISO(isoString)
  const time = format(date, 'HH:mm')
  if (isToday(date)) return `Сегодня в ${time}`
  if (isTomorrow(date)) return `Завтра в ${time}`
  return `${format(date, 'd MMMM', { locale: ru })} в ${time}`
}

// ── Avatar upload widget ────────────────────────────────────────────────────

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

function AvatarUpload() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  const initials = getInitials(user?.firstName ?? '', user?.lastName ?? '')
  const avatarSrc = preview ?? user?.avatarUrl ?? null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setStatus('uploading')
    setErrorMsg('')
    try {
      const res = await usersApi.uploadAvatar(file)
      const updated: User = res.data?.data ?? res.data
      setUser(updated)
      setPreview(null)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Не удалось загрузить фото'
      setErrorMsg(msg)
      setStatus('error')
      setPreview(null)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
      <div className="relative shrink-0">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center ring-2 ring-white shadow-md">
          {avatarSrc ? (
            <img src={avatarSrc} alt={user?.firstName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-indigo-600 select-none">{initials}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={status === 'uploading'}
          className="absolute -bottom-1 -right-1 bg-white border border-gray-200 shadow-sm rounded-full p-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Изменить фото"
        >
          {status === 'uploading' ? (
            <Loader2 className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5 text-gray-500" />
          )}
        </button>
      </div>
      <div className="flex flex-col items-center sm:items-start gap-3 text-center sm:text-left">
        <div>
          <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={status === 'uploading'}
          onClick={() => fileRef.current?.click()}
          className="gap-2"
        >
          {status === 'uploading' ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Загрузка…</>
          ) : (
            <><Camera className="h-4 w-4" />Изменить фото</>
          )}
        </Button>
        <p className="text-xs text-gray-400">JPG, PNG или GIF · до 5 МБ</p>
        {status === 'success' && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />Фото обновлено
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="h-3.5 w-3.5" />{errorMsg}
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

// ── Country select widget ──────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function CountrySelect() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [selected, setSelected] = useState<string>(user?.country ?? '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isDirty = selected !== (user?.country ?? '')

  async function handleSave() {
    if (!user) return
    setSaveStatus('saving')
    setErrorMsg('')
    try {
      const res = await usersApi.updateMe(user.id, { country: selected || null })
      const updated: User = res.data?.data ?? res.data
      setUser(updated)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Не удалось сохранить'
      setErrorMsg(msg)
      setSaveStatus('error')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="country">Страна</Label>
          <Select
            value={selected}
            onValueChange={(v) => { setSelected(v); setSaveStatus('idle') }}
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Выберите страну…" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleSave}
          disabled={!isDirty || saveStatus === 'saving'}
          size="sm"
          className="gap-2 shrink-0"
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Сохранить
        </Button>
      </div>
      {saveStatus === 'saved' && (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />Страна сохранена
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle className="h-3.5 w-3.5" />{errorMsg}
        </div>
      )}
    </div>
  )
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
          <div className="flex-shrink-0 bg-indigo-50 rounded-lg p-2.5">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
          </div>
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
          <div className={[
            'flex-shrink-0 rounded-lg p-2.5',
            notification.isRead ? 'bg-gray-50' : 'bg-indigo-50',
          ].join(' ')}>
            <Bell className={[
              'h-5 w-5',
              notification.isRead ? 'text-gray-400' : 'text-indigo-600',
            ].join(' ')} />
          </div>
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

// ── Profile Settings Tab Content ──────────────────────────────────────────

function ProfileSettings() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="max-w-2xl space-y-6">
      {/* Фото профиля */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Фото профиля</CardTitle>
          <CardDescription>
            Загрузите фото, которое будет видно другим пользователям
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload />
        </CardContent>
      </Card>

      {/* Личная информация */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Личная информация</CardTitle>
          <CardDescription>
            Управляйте своей учётной записью и персональной информацией
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Имя</Label>
              <Input id="firstName" value={user?.firstName || ''} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input id="lastName" value={user?.lastName || ''} disabled className="bg-gray-50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email || ''} disabled className="bg-gray-50" />
          </div>
          {user?.bio && (
            <div className="space-y-2">
              <Label htmlFor="bio">О себе</Label>
              <Input id="bio" value={user.bio} disabled className="bg-gray-50" />
            </div>
          )}
          <p className="text-xs text-gray-400 pt-2">
            Для изменения имени или email свяжитесь с администратором
          </p>
        </CardContent>
      </Card>

      {/* Страна */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Местоположение</CardTitle>
          <CardDescription>
            Укажите вашу страну — она будет видна преподавателям и администраторам
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CountrySelect />
        </CardContent>
      </Card>

      {/* Аккаунт */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Информация аккаунта</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Роль</Label>
            <Input
              id="role"
              value={
                user?.role === 'STUDENT' ? 'Студент'
                  : user?.role === 'TEACHER' ? 'Учитель'
                  : 'Администратор'
              }
              disabled
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Input id="status" value={user?.isActive ? 'Активен' : 'Неактивен'} disabled className="bg-gray-50" />
          </div>
        </CardContent>
      </Card>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Добро пожаловать, {user?.firstName}!
            </h1>
            <p className="text-gray-500 text-sm">
              Здесь вы можете отслеживать прогресс обучения и управлять профилем
            </p>
          </div>

          {/* Tabs: Обучение / Профиль */}
          <Tabs defaultValue="learning" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="learning" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Обучение
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <Settings className="h-4 w-4" />
                Настройки профиля
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Обучение ── */}
            <TabsContent value="learning">
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

              {/* Мои курсы */}
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

              {/* Предстоящие занятия */}
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <CalendarDays className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Предстоящие занятия</h2>
                </div>
                <UpcomingLessons />
              </section>

              {/* Уведомления */}
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Bell className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Уведомления</h2>
                </div>
                <NotificationsSection />
              </section>
            </TabsContent>

            {/* ── Tab: Профиль ── */}
            <TabsContent value="profile">
              <ProfileSettings />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </ProtectedRoute>
  )
}
