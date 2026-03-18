'use client'

import { useCourse, useEnroll, useMyEnrollments, useCourseModules } from '@/hooks/api/useCourses'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth.store'
import { getInitials, getCourseStatusLabel } from '@/lib/utils'
import { ChevronDown, Lock, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { data: course, isLoading: courseLoading } = useCourse(params.id)
  const { data: enrollmentsData } = useMyEnrollments(isAuthenticated ? {} : undefined)
  const { data: modules = [] } = useCourseModules(params.id)
  const { mutate: enroll, isPending: enrollPending } = useEnroll()
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  // Local flag: shows "Заявка отправлена" instantly before invalidated query refetches
  const [justEnrolled, setJustEnrolled] = useState(false)

  const enrollments = enrollmentsData || []
  const myEnrollment = enrollments.find((e) => e.courseId === params.id)
  const hasAccess = myEnrollment?.status === 'ACTIVE' || myEnrollment?.status === 'COMPLETED'
  const isPending = justEnrolled || myEnrollment?.status === 'PENDING'
  const isCancelled = myEnrollment?.status === 'CANCELLED'

  const toggleModule = (moduleId: string) => {
    const next = new Set(expandedModules)
    if (next.has(moduleId)) next.delete(moduleId)
    else next.add(moduleId)
    setExpandedModules(next)
  }

  const handleEnroll = () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    enroll(params.id, {
      onSuccess: () => setJustEnrolled(true),
    })
  }

  if (courseLoading) {
    return (
      <div className="container-base py-12">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-8" />
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container-base py-12 text-center">
        <p className="text-lg text-[var(--color-text-secondary)]">Курс не найден</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-base py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main Content ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
                  <p className="text-[var(--color-text-secondary)] text-lg">{course.description}</p>
                </div>
                <Badge>{getCourseStatusLabel(course.status)}</Badge>
              </div>
            </div>

            {/* Instructor */}
            {course.instructor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Преподаватель</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      {course.instructor.avatarUrl && (
                        <AvatarImage
                          src={course.instructor.avatarUrl}
                          alt={course.instructor.firstName}
                        />
                      )}
                      <AvatarFallback>
                        {getInitials(course.instructor.firstName, course.instructor.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {course.instructor.firstName} {course.instructor.lastName}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {course.instructor.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Curriculum ─────────────────────────────────────────────── */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Учебная программа</h2>

              {modules.length === 0 ? (
                <p className="text-[var(--color-text-secondary)]">Программа не опубликована</p>
              ) : hasAccess ? (
                // Enrolled users: full expandable curriculum
                <div className="space-y-2">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className="border border-[var(--color-border)] rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-background-secondary)] transition-colors"
                      >
                        <h3 className="font-semibold text-left">{module.title}</h3>
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            expandedModules.has(module.id) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expandedModules.has(module.id) && (
                        <div className="border-t border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
                          <div className="space-y-2">
                            {module.lessons && module.lessons.length > 0 ? (
                              module.lessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-start gap-3 p-2 hover:bg-white rounded transition-colors"
                                >
                                  <span className="text-[var(--color-text-secondary)]">•</span>
                                  <div className="flex-1">
                                    <p className="font-medium">{lesson.title}</p>
                                    {lesson.duration && (
                                      <p className="text-xs text-[var(--color-text-secondary)]">
                                        Длительность: {lesson.duration} мин
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                Уроки отсутствуют
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Non-enrolled: module names only + locked content notice
                <div className="space-y-2">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className="border border-[var(--color-border)] rounded-lg p-4 flex items-center justify-between"
                    >
                      <h3 className="font-semibold">{module.title}</h3>
                      <Lock className="h-4 w-4 text-[var(--color-text-secondary)] flex-shrink-0" />
                    </div>
                  ))}

                  <div className="mt-4 p-6 bg-[var(--color-background-secondary)] rounded-lg border border-[var(--color-border)] text-center">
                    <Lock className="h-8 w-8 mx-auto mb-3 text-[var(--color-text-secondary)]" />
                    <p className="font-semibold mb-1">Запишитесь на курс</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      чтобы получить доступ к видео, материалам и содержимому уроков
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Записаться на курс</CardTitle>
                {/* Price */}
                <div className="pt-1">
                  {course.price != null && course.price > 0 ? (
                    <p className="text-3xl font-bold">
                      {course.price.toLocaleString('ru-RU')}{' '}
                      <span className="text-base font-normal text-[var(--color-text-secondary)]">
                        {course.currency ?? 'RUB'}
                      </span>
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-green-600">Бесплатно</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">Студентов</span>
                    <span className="font-semibold">{course._count?.enrollments || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">Модулей</span>
                    <span className="font-semibold">{course._count?.modules || 0}</span>
                  </div>
                </div>

                {isPending ? (
                  <>
                    <Button disabled className="w-full" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Заявка отправлена
                    </Button>
                    <p className="text-xs text-amber-600 text-center">
                      Ожидайте одобрения администратора
                    </p>
                  </>
                ) : isCancelled ? (
                  <Button disabled className="w-full" variant="outline">
                    ✕ Заявка отклонена
                  </Button>
                ) : hasAccess ? (
                  <Button asChild className="w-full">
                    <Link href={`/learn/${params.id}`}>Перейти к обучению</Link>
                  </Button>
                ) : (
                  <Button
                    onClick={handleEnroll}
                    disabled={enrollPending}
                    className="w-full"
                  >
                    {enrollPending ? 'Отправка заявки...' : 'Подать заявку на курс'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
