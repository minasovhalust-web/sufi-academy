'use client'

import { useState } from 'react'
import { useCourses } from '@/hooks/api/useCourses'
import { CourseCard } from '@/components/courses/CourseCard'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth.store'

export default function CoursesPage() {
  const isAdmin = useAuthStore((state) => state.isAdmin())
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')

  const params: Record<string, unknown> = {
    ...(search ? { search } : {}),
    ...(isAdmin && status !== 'all' ? { status } : {}),
  }

  // useCourses returns Course[] directly (response.data.data from backend wrapper)
  const { data: courses = [], isLoading } = useCourses(params)

  return (
    <div className="min-h-screen bg-white">
      <div className="container-base py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Каталог курсов</h1>
          <p className="text-[var(--color-text-secondary)]">
            Выберите курс и начните свой путь духовного развития
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Input
            placeholder="Поиск курсов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {isAdmin && (
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="PUBLISHED">Опубликованы</SelectItem>
                <SelectItem value="DRAFT">Черновики</SelectItem>
                <SelectItem value="ARCHIVED">Архив</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-6" />
                <Skeleton className="h-4 w-2/3" />
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
            <p className="text-lg text-[var(--color-text-secondary)]">Курсы не найдены</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Попробуйте изменить параметры поиска
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
