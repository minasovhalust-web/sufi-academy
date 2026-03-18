'use client'

import { useState } from 'react'
import { useCourses } from '@/hooks/api/useCourses'
import { useAdminDashboard } from '@/hooks/api/useAdmin'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { CourseCard } from '@/components/courses/CourseCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  TEACHER_NAME,
  TEACHER_BIO,
  TEACHER_PHOTOS,
  TEACHER_SPECIALIZATION,
} from '@/config/teacher'


export default function HomePage() {
  const [photoIndex, setPhotoIndex] = useState(0)
  const prevPhoto = () => setPhotoIndex((i) => (i - 1 + TEACHER_PHOTOS.length) % TEACHER_PHOTOS.length)
  const nextPhoto = () => setPhotoIndex((i) => (i + 1) % TEACHER_PHOTOS.length)
  const { data: coursesData, isLoading: coursesLoading } = useCourses({ status: 'PUBLISHED', limit: 6 })
  const isAdmin = useAuthStore((state) => state.isAdmin())
  // Only fetch admin dashboard when the current user is actually an admin.
  // Calling it unconditionally would trigger a 401/403 for every guest visitor.
  const { data: statsData } = useAdminDashboard()

  const courses = coursesData || []
  const stats = statsData?.data

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-[var(--color-background-secondary)] to-[var(--color-primary)]/5 py-20 md:py-32">
        <div className="container-base">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Откройте мир суфийской философии
              </h1>
              <p className="text-lg text-[var(--color-text-secondary)]">
                Глубокие знания, духовный рост и мудрость веков в современном формате
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link href="/courses">Начать обучение</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#about">Узнать больше</Link>
                </Button>
              </div>
            </div>

            {/* Logo */}
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="Логотип Академии Суфийской Философии"
                className="w-64 h-64 rounded-full object-cover bg-transparent drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section — admin only */}
      {isAdmin && stats && (
        <section className="py-16 bg-white border-b border-[var(--color-border)]">
          <div className="container-base">
            <h2 className="text-3xl font-bold mb-12">Статистика</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Всего пользователей
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
                    Записей на курсы
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Активных сессий
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.activeLiveSessions}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* About Teacher Section */}
      <section id="about" className="py-20 bg-[var(--color-background-secondary)]">
        <div className="container-base">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Photo slider */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-[500px] h-[600px]">
                <img
                  key={photoIndex}
                  src={TEACHER_PHOTOS[photoIndex]}
                  alt={`${TEACHER_NAME} — фото ${photoIndex + 1}`}
                  className="w-[500px] h-[600px] rounded-2xl object-cover object-top shadow-xl"
                />
                {/* Prev button */}
                {TEACHER_PHOTOS.length > 1 && (
                  <button
                    onClick={prevPhoto}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100"
                    aria-label="Предыдущее фото"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                )}
                {/* Next button */}
                {TEACHER_PHOTOS.length > 1 && (
                  <button
                    onClick={nextPhoto}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100"
                    aria-label="Следующее фото"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                )}
              </div>

              {/* Dots */}
              {TEACHER_PHOTOS.length > 1 && (
                <div className="flex gap-2">
                  {TEACHER_PHOTOS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === photoIndex ? 'bg-[var(--color-primary)]' : 'bg-gray-300'
                      }`}
                      aria-label={`Фото ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
                  Об учителе
                </p>
                <h2 className="text-3xl md:text-4xl font-bold">{TEACHER_NAME}</h2>
                <p className="mt-2 text-[var(--color-text-secondary)] font-medium">
                  {TEACHER_SPECIALIZATION}
                </p>
              </div>

              <div className="space-y-3">
                {TEACHER_BIO.trim().split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-[var(--color-text-secondary)] leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              <Button asChild>
                <Link href="/courses">Записаться на курс</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container-base">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Популярные курсы</h2>
              <p className="text-[var(--color-text-secondary)]">Начните свой путь духовного развития</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/courses">Смотреть все курсы</Link>
            </Button>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-6" />
                  <Skeleton className="h-4" />
                  <Skeleton className="h-10" />
                </div>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--color-text-secondary)]">Курсы пока не опубликованы</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]">
        <div className="container-base text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Готовы начать свой путь?
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">
            Присоединитесь к нашей академии и откройте для себя глубины суфийской философии
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/register">Зарегистрироваться сейчас</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
