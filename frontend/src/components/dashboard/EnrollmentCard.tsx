import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getEnrollmentStatusLabel } from '@/lib/utils'
import type { Enrollment } from '@/types'

interface EnrollmentCardProps {
  enrollment: Enrollment
  lessonProgress?: { completedCount: number; totalCount: number }
}

export function EnrollmentCard({ enrollment, lessonProgress }: EnrollmentCardProps) {
  const haslp = lessonProgress && lessonProgress.totalCount > 0
  const lpPct = haslp ? Math.round((lessonProgress.completedCount / lessonProgress.totalCount) * 100) : null

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-2 text-base sm:text-lg leading-snug">
              {enrollment.course?.title}
            </CardTitle>
            {enrollment.course?.instructor && (
              <CardDescription className="mt-1">
                {enrollment.course.instructor.firstName} {enrollment.course.instructor.lastName}
              </CardDescription>
            )}
          </div>
          <Badge
            variant={
              enrollment.status === 'ACTIVE'
                ? 'default'
                : enrollment.status === 'COMPLETED'
                  ? 'default'
                  : 'destructive'
            }
            className="shrink-0 text-xs"
          >
            {getEnrollmentStatusLabel(enrollment.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Прогресс</span>
            {haslp ? (
              <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                {lessonProgress.completedCount} из {lessonProgress.totalCount} уроков
              </span>
            ) : (
              <span className="text-sm text-[var(--color-text-secondary)]">{Math.round(enrollment.progress)}%</span>
            )}
          </div>
          <Progress value={haslp ? lpPct! : enrollment.progress} />
        </div>

        <Button asChild className="w-full min-h-[44px]">
          <Link href={`/learn/${enrollment.courseId}`}>
            {(haslp ? lpPct === 100 : enrollment.progress === 100) ? 'Пересмотреть' : 'Продолжить обучение'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
