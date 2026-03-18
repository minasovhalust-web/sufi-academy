'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useMyCourses, useCreateCourse } from '@/hooks/api/useCourses'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CourseCard } from '@/components/courses/CourseCard'
import Link from 'next/link'

// ── Schema ─────────────────────────────────────────────────────────────────

const courseSchema = z.object({
  title: z.string().min(3, 'Название должно быть не менее 3 символов'),
  description: z.string().optional(),
  slug: z.string().min(3, 'Slug должен быть не менее 3 символов'),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
})

type CourseFormData = z.infer<typeof courseSchema>

// ── Cyrillic transliteration ───────────────────────────────────────────────

const cyrillicMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya',
}

function toSlug(text: string) {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => cyrillicMap[ch] ?? ch)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TeacherPage() {
  const { data: courses = [], isLoading: coursesLoading } = useMyCourses()
  const { mutate: createCourse, isPending: isCreating } = useCreateCourse()
  const [activeTab, setActiveTab] = useState('courses')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: { status: 'DRAFT' },
  })

  const generatedSlug = toSlug(watch('title') || '')

  const onSubmit = (data: CourseFormData) => {
    createCourse(data, {
      onSuccess: () => {
        reset()
        setActiveTab('courses')
      },
    })
  }

  return (
    <ProtectedRoute requiredRole="TEACHER">
      <div className="min-h-screen bg-white">
        <div className="container-base py-12">
          <h1 className="text-4xl font-bold mb-2">Панель преподавателя</h1>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Управляйте своими курсами и содержимым
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="courses">Мои курсы</TabsTrigger>
              <TabsTrigger value="create">Создать курс</TabsTrigger>
            </TabsList>

            {/* ── My Courses ──────────────────────────────────────────── */}
            <TabsContent value="courses" className="space-y-6">
              {coursesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="h-48" />
                    </div>
                  ))}
                </div>
              ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div key={course.id} className="relative">
                      <CourseCard course={course} />
                      {/* Action buttons */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        {/* Открывает страницу управления курсом: модули, уроки, видео */}
                        <Button asChild size="sm" variant="outline" className="bg-white">
                          <Link href={`/teacher/courses/${course.id}`}>
                            Редактировать
                          </Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/courses/${course.id}`}>Просмотр</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <p className="text-[var(--color-text-secondary)] mb-4">
                        Вы ещё не создали ни одного курса
                      </p>
                      <Button onClick={() => setActiveTab('create')}>
                        Создать первый курс
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Create Course ────────────────────────────────────────── */}
            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Создать новый курс</CardTitle>
                  <CardDescription>Заполните информацию о новом курсе</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Название курса</Label>
                      <Input
                        id="title"
                        placeholder="Введите название курса..."
                        disabled={isCreating}
                        {...register('title')}
                      />
                      {errors.title && (
                        <p className="text-xs text-red-600">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug">URL (slug)</Label>
                      <Input
                        id="slug"
                        placeholder="url-slug"
                        disabled={isCreating}
                        value={generatedSlug}
                        {...register('slug')}
                      />
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Автоматически генерируется из названия
                      </p>
                      {errors.slug && (
                        <p className="text-xs text-red-600">{errors.slug.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Описание</Label>
                      <Textarea
                        id="description"
                        placeholder="Опишите содержание и цели курса..."
                        rows={6}
                        disabled={isCreating}
                        {...register('description')}
                      />
                      {errors.description && (
                        <p className="text-xs text-red-600">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Цена</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          placeholder="0"
                          disabled={isCreating}
                          {...register('price')}
                        />
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          0 — бесплатный курс
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Валюта</Label>
                        <Input
                          id="currency"
                          placeholder="RUB"
                          disabled={isCreating}
                          {...register('currency')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Статус</Label>
                      <Select defaultValue="DRAFT" {...register('status')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Черновик</SelectItem>
                          <SelectItem value="PUBLISHED">Опубликовать</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Выберите черновик, если хотите завершить позже
                      </p>
                    </div>

                    <Button type="submit" disabled={isCreating} className="w-full">
                      {isCreating ? 'Создание...' : 'Создать курс'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
