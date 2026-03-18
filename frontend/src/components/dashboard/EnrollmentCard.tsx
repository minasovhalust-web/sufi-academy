import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getEnrollmentStatusLabel } from '@/lib/utils'
import type { Enrollment } from '@/types'

interface EnrollmentCardProps {
  enrollment: Enrollment
}

export function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{enrollment.course?.title}</CardTitle>
            {enrollment.course?.instructor && (
              <CardDescription>
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
          >
            {getEnrollmentStatusLabel(enrollment.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Прогресс</span>
            <span className="text-sm text-[var(--color-text-secondary)]">{Math.round(enrollment.progress)}%</span>
          </div>
          <Progress value={enrollment.progress} />
        </div>

        <Button asChild className="w-full">
          <Link href={`/learn/${enrollment.courseId}`}>
            {enrollment.progress === 100 ? 'Пересмотреть' : 'Продолжить обучение'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
