import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCourseStatusLabel, colorVariantFromId } from '@/lib/utils'
import type { Course } from '@/types'

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  const variant = colorVariantFromId(course.id)
  const gradients: Record<string, string> = {
    primary: 'from-[var(--color-primary)]/20 to-[var(--color-accent)]/20',
    accent: 'from-[var(--color-accent)]/20 to-[var(--color-primary)]/20',
    slate: 'from-slate-200 to-slate-100',
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Decorative header */}
      <div className={`bg-gradient-to-br ${gradients[variant]} h-32 relative overflow-hidden`}>
        <svg className="absolute opacity-10 w-full h-full" viewBox="0 0 200 200">
          <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20,0 L40,20 L20,40 L0,20 Z" fill="currentColor" />
          </pattern>
          <rect width="200" height="200" fill="url(#pattern)" />
        </svg>
      </div>

      <CardHeader className="flex-1">
        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
        {course.instructor && (
          <CardDescription>
            {course.instructor.firstName} {course.instructor.lastName}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        {course.description && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{course.description}</p>
        )}
      </CardContent>

      <div className="px-6 pb-6 flex flex-col gap-3">
        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="font-bold text-lg">
            {course.price != null && course.price > 0 ? (
              <span>
                {course.price.toLocaleString('ru-RU')}{' '}
                <span className="text-sm font-normal text-[var(--color-text-secondary)]">
                  {course.currency ?? 'RUB'}
                </span>
              </span>
            ) : (
              <span className="text-green-600">Бесплатно</span>
            )}
          </div>
          {course.status === 'PUBLISHED' && (
            <Badge variant="default" className="text-xs">Опубликован</Badge>
          )}
          {course.status === 'DRAFT' && (
            <Badge variant="outline" className="text-xs">Черновик</Badge>
          )}
          {course.status === 'ARCHIVED' && (
            <Badge variant="destructive" className="text-xs">Архив</Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
          <span>{course._count?.enrollments || 0} студентов</span>
          {course._count?.modules != null && (
            <span>{course._count.modules} модулей</span>
          )}
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={`/courses/${course.id}`}>Подробнее</Link>
        </Button>
      </div>
    </Card>
  )
}
