'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  useCourse,
  useCourseModules,
  useCreateModule,
  useCourseLessons,
  useCreateLesson,
  useCourseMaterials,
  useCreateMaterial,
  useDeleteMaterial,
  useUpdateCourse,
} from '@/hooks/api/useCourses'
import {
  useVideosByLesson,
  useInvalidateVideos,
  readMediaDuration,
} from '@/hooks/api/useVideos'
import { videosApi, apiClient } from '@/lib/api'
import type { CourseModule, Lesson, Material, Video } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  BookOpen,
  Video as VideoIcon,
  FileText,
  Link as LinkIcon,
  Music,
  File,
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
} from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────

const MATERIAL_TYPE_ICONS: Record<string, React.ReactNode> = {
  VIDEO: <VideoIcon className="h-4 w-4" />,
  AUDIO: <Music className="h-4 w-4" />,
  PDF: <File className="h-4 w-4" />,
  TEXT: <FileText className="h-4 w-4" />,
  LINK: <LinkIcon className="h-4 w-4" />,
}

const MATERIAL_TYPE_LABELS: Record<string, string> = {
  VIDEO: 'Видео',
  AUDIO: 'Аудио',
  PDF: 'PDF',
  TEXT: 'Текст',
  LINK: 'Ссылка',
}

const ACCEPTED_VIDEO_TYPES = 'video/mp4,video/webm,video/ogg,video/quicktime'

const VIDEO_STATUS_CONFIG: Record<
  Video['status'],
  { label: string; icon: React.ReactNode; color: string }
> = {
  PROCESSING: {
    label: 'Обработка',
    icon: <Clock className="h-3.5 w-3.5" />,
    color: 'text-amber-600',
  },
  READY: {
    label: 'Готово',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: 'text-green-600',
  },
  FAILED: {
    label: 'Ошибка',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: 'text-red-600',
  },
}

// ── VideoSection ───────────────────────────────────────────────────────────

type UploadState = 'idle' | 'uploading' | 'saving' | 'error'

function VideoSection({ lessonId }: { lessonId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const invalidateVideos = useInvalidateVideos(lessonId)

  const { data: videosData, isLoading: videosLoading } = useVideosByLesson(lessonId)
  const videos: Video[] = videosData ?? []

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [videoTitle, setVideoTitle] = useState('')

  // Upload state machine
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const isUploading = uploadState === 'uploading' || uploadState === 'saving'

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await videosApi.delete(videoId)
      invalidateVideos()
      toast.success('Видео удалено')
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Ошибка удаления видео')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    if (!picked) return
    setFile(picked)
    // Pre-fill title from filename (strip extension)
    if (!videoTitle) {
      setVideoTitle(picked.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleUpload = async () => {
    if (!file || !videoTitle.trim()) return

    setUploadState('uploading')
    setUploadProgress(0)
    setUploadError(null)

    try {
      // Step 1: upload file to local storage via the generic upload endpoint.
      // apiClient already carries the JWT token (via the request interceptor)
      // and automatically removes Content-Type so the browser sets the correct
      // multipart/form-data boundary.
      const form = new FormData()
      form.append('file', file)
      const uploadRes = await apiClient.post('/storage/upload', form, {
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      const { url } = uploadRes.data.data as { url: string }

      setUploadProgress(100)

      // Read duration from the local file before saving the record
      const duration = await readMediaDuration(file)

      // Step 2: save the video record in the backend.
      // storageKey is the URL returned by the upload endpoint — the backend
      // uses it as the stable reference to the file.
      setUploadState('saving')
      const createRes = await videosApi.create({
        lessonId,
        title: videoTitle.trim(),
        storageKey: url,
        mimeType: file.type,
        duration,
      })

      // Step 3: mark the video as READY immediately — we have no async
      // processing pipeline, so the video is playable right after upload.
      const videoId = (createRes.data.data as { id: string }).id
      await videosApi.update(videoId, { status: 'READY' })

      invalidateVideos()
      toast.success('Видео успешно загружено')

      // Reset form
      setFile(null)
      setVideoTitle('')
      setUploadProgress(0)
      setUploadState('idle')
      setShowForm(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      setUploadState('error')
      const msg = err.response?.data?.message ?? err.message ?? 'Ошибка загрузки'
      setUploadError(msg)
      toast.error(msg)
    }
  }

  const handleCancel = () => {
    setFile(null)
    setVideoTitle('')
    setUploadProgress(0)
    setUploadState('idle')
    setUploadError(null)
    setShowForm(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatDuration = (secs?: number) => {
    if (!secs) return ''
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <VideoIcon className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium text-gray-700">Видео</span>
      </div>

      {/* Existing videos */}
      {videosLoading ? (
        <Skeleton className="h-10" />
      ) : videos.length > 0 ? (
        <ul className="space-y-2">
          {videos.map((v) => {
            const cfg = VIDEO_STATUS_CONFIG[v.status]
            return (
              <li
                key={v.id}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-purple-50 border border-purple-100 text-sm group"
              >
                <Play className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="flex-1 font-medium truncate">{v.title}</span>
                {v.duration && (
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDuration(v.duration)}
                  </span>
                )}
                <span className={`flex items-center gap-1 text-xs shrink-0 ${cfg.color}`}>
                  {cfg.icon}
                  {cfg.label}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteVideo(v.id)}
                  disabled={isUploading}
                  title="Удалить видео"
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-gray-400">Видео ещё не загружено</p>
      )}

      {/* Upload form */}
      {showForm ? (
        <div className="space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES}
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          {/* File picker area */}
          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-purple-200 rounded-lg text-sm text-gray-500 hover:border-purple-400 hover:text-gray-700 transition-colors cursor-pointer bg-white"
            >
              <Upload className="h-6 w-6 text-purple-400" />
              <span>Нажмите чтобы выбрать видеофайл</span>
              <span className="text-xs text-gray-400">MP4, WebM, MOV</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-white rounded border text-sm">
              <VideoIcon className="h-4 w-4 text-purple-500 shrink-0" />
              <span className="flex-1 truncate text-gray-700">{file.name}</span>
              <span className="text-xs text-gray-400 shrink-0">
                {(file.size / 1024 / 1024).toFixed(1)} МБ
              </span>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Title input */}
          <Input
            placeholder="Название видео"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            disabled={isUploading}
            className="text-sm"
          />

          {/* Progress bar — shown during upload/saving */}
          {(uploadState === 'uploading' || uploadState === 'saving') && (
            <div className="space-y-1.5">
              <Progress value={uploadState === 'saving' ? 100 : uploadProgress} />
              <p className="text-xs text-gray-500 text-center">
                {uploadState === 'saving'
                  ? 'Сохранение записи...'
                  : `Загрузка: ${uploadProgress}%`}
              </p>
            </div>
          )}

          {/* Error message */}
          {uploadState === 'error' && uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 p-2 bg-red-50 rounded">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {uploadError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={isUploading || !file || !videoTitle.trim()}
              className="gap-1.5"
            >
              {uploadState === 'uploading' ? (
                <>Загрузка {uploadProgress}%</>
              ) : uploadState === 'saving' ? (
                <>Сохранение...</>
              ) : (
                <><Upload className="h-3.5 w-3.5" />Загрузить</>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(true)}
          className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          <Upload className="h-3.5 w-3.5" />
          Загрузить видео
        </Button>
      )}
    </div>
  )
}

// ── LessonItem ──────────────────────────────────────────────────────────────

function LessonItem({ lesson }: { lesson: Lesson }) {
  const [expanded, setExpanded] = useState(false)
  const [addingMaterial, setAddingMaterial] = useState(false)
  const [matTitle, setMatTitle] = useState('')
  const [matType, setMatType] = useState<'VIDEO' | 'AUDIO' | 'PDF' | 'TEXT' | 'LINK'>('VIDEO')
  const [matUrl, setMatUrl] = useState('')

  const { data: materialsData, isLoading: matLoading } = useCourseMaterials(lesson.id)
  const { mutate: createMaterial, isPending: matPending } = useCreateMaterial(lesson.id)
  const { mutate: deleteMaterial, isPending: matDeleting } = useDeleteMaterial(lesson.id)

  const materials: Material[] = materialsData ?? []

  const handleAddMaterial = () => {
    if (!matTitle.trim() || !matUrl.trim()) return
    createMaterial(
      { title: matTitle.trim(), type: matType, url: matUrl.trim() },
      {
        onSuccess: () => {
          setMatTitle('')
          setMatUrl('')
          setMatType('VIDEO')
          setAddingMaterial(false)
        },
      },
    )
  }

  return (
    <div className="border border-gray-100 rounded-lg bg-white">
      {/* Lesson header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        )}
        <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
        <span className="font-medium text-sm flex-1">{lesson.title}</span>
        {lesson.duration && (
          <span className="text-xs text-gray-400">{lesson.duration} мин</span>
        )}
      </button>

      {/* Lesson body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-5 border-t border-gray-50 pt-4">

          {/* ── Materials section ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Материалы</span>
            </div>

            {matLoading ? (
              <Skeleton className="h-8" />
            ) : materials.length > 0 ? (
              <ul className="space-y-2">
                {materials.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 text-sm p-2 rounded bg-gray-50 group"
                  >
                    <span className="text-gray-500">{MATERIAL_TYPE_ICONS[m.type]}</span>
                    <span className="flex-1 font-medium">{m.title}</span>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-xs truncate max-w-[160px]"
                    >
                      {m.url}
                    </a>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {MATERIAL_TYPE_LABELS[m.type]}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => deleteMaterial(m.id)}
                      disabled={matDeleting}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                      title="Удалить материал"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">Материалов пока нет</p>
            )}

            {addingMaterial ? (
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Input
                  placeholder="Название материала"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  disabled={matPending}
                  className="text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Select
                    value={matType}
                    onValueChange={(v) => setMatType(v as typeof matType)}
                    disabled={matPending}
                  >
                    <SelectTrigger className="w-36 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MATERIAL_TYPE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="URL"
                    value={matUrl}
                    onChange={(e) => setMatUrl(e.target.value)}
                    disabled={matPending}
                    className="flex-1 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddMaterial}
                    disabled={matPending || !matTitle.trim() || !matUrl.trim()}
                  >
                    {matPending ? 'Добавление...' : 'Добавить'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddingMaterial(false)}
                    disabled={matPending}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddingMaterial(true)}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Добавить материал
              </Button>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-gray-100" />

          {/* ── Video upload section ── */}
          <VideoSection lessonId={lesson.id} />
        </div>
      )}
    </div>
  )
}

// ── ModuleItem ──────────────────────────────────────────────────────────────

function ModuleItem({ module, courseId }: { module: CourseModule; courseId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [addingLesson, setAddingLesson] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDuration, setLessonDuration] = useState('')

  const { data: lessonsData, isLoading: lessonsLoading } = useCourseLessons(courseId, module.id)
  const { mutate: createLesson, isPending: lessonPending } = useCreateLesson(courseId, module.id)

  const lessons: Lesson[] = lessonsData ?? []

  const handleAddLesson = () => {
    if (!lessonTitle.trim()) return
    createLesson(
      {
        title: lessonTitle.trim(),
        order: lessons.length + 1,
        duration: lessonDuration ? parseInt(lessonDuration, 10) : undefined,
      },
      {
        onSuccess: () => {
          setLessonTitle('')
          setLessonDuration('')
          setAddingLesson(false)
        },
      },
    )
  }

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-semibold">{module.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Модуль {module.order} · {lessons.length} уроков
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">{lessons.length}</Badge>
      </button>

      {expanded && (
        <CardContent className="border-t pt-4 space-y-3">
          {lessonsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : lessons.length > 0 ? (
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <LessonItem key={lesson.id} lesson={lesson} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-2">Уроков пока нет</p>
          )}

          {addingLesson ? (
            <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-100 mt-2">
              <Input
                placeholder="Название урока"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                disabled={lessonPending}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddLesson()}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Длительность (мин)"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  disabled={lessonPending}
                  className="w-44"
                />
                <span className="text-xs text-gray-400">необязательно</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddLesson}
                  disabled={lessonPending || !lessonTitle.trim()}
                >
                  {lessonPending ? 'Сохранение...' : 'Сохранить урок'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddingLesson(false)}
                  disabled={lessonPending}
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddingLesson(true)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить урок
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function TeacherCourseManagePage({
  params,
}: {
  params: { id: string }
}) {
  const courseId = params.id

  const { data: courseData, isLoading: courseLoading } = useCourse(courseId)
  const { data: modulesData, isLoading: modulesLoading } = useCourseModules(courseId)
  const { mutate: createModule, isPending: modulePending } = useCreateModule(courseId)
  const { mutate: updateCourse, isPending: updatePending } = useUpdateCourse(courseId)

  const [addingModule, setAddingModule] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceValue, setPriceValue] = useState('')
  const [currencyValue, setCurrencyValue] = useState('RUB')

  const course = courseData
  const modules: CourseModule[] = modulesData ?? []

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Черновик',
    PUBLISHED: 'Опубликован',
    ARCHIVED: 'Архив',
  }

  const handleAddModule = () => {
    if (!moduleTitle.trim()) return
    createModule(
      { title: moduleTitle.trim(), order: modules.length + 1 },
      {
        onSuccess: () => {
          setModuleTitle('')
          setAddingModule(false)
        },
      },
    )
  }

  return (
    <ProtectedRoute requiredRole="TEACHER">
      <div className="min-h-screen bg-gray-50">
        <div className="container-base py-8">

          {/* Back link */}
          <Link
            href="/teacher"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к курсам
          </Link>

          {/* Course header */}
          {courseLoading ? (
            <div className="space-y-3 mb-8">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ) : course ? (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{course.title}</h1>
                <Badge>{STATUS_LABELS[course.status] ?? course.status}</Badge>
              </div>
              {course.description && (
                <p className="text-gray-500 max-w-2xl">{course.description}</p>
              )}
              <div className="flex gap-4 mt-3 text-sm text-gray-400">
                <span>
                  Slug: <code className="bg-gray-100 px-1 rounded">{course.slug}</code>
                </span>
                {course._count && (
                  <span>
                    {course._count.enrollments} записей · {course._count.modules} модулей
                  </span>
                )}
              </div>

              {/* Price editor */}
              <div className="mt-4 flex items-center gap-3">
                {!editingPrice ? (
                  <>
                    <span className="text-lg font-semibold">
                      {course.price != null && course.price > 0
                        ? `${course.price.toLocaleString('ru-RU')} ${course.currency ?? 'RUB'}`
                        : 'Бесплатно'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPriceValue(course.price != null ? String(course.price) : '')
                        setCurrencyValue(course.currency ?? 'RUB')
                        setEditingPrice(true)
                      }}
                    >
                      Изменить цену
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={priceValue}
                      onChange={(e) => setPriceValue(e.target.value)}
                      className="w-32 h-9 text-sm"
                      autoFocus
                    />
                    <Input
                      placeholder="RUB"
                      value={currencyValue}
                      onChange={(e) => setCurrencyValue(e.target.value)}
                      className="w-20 h-9 text-sm"
                    />
                    <Button
                      size="sm"
                      disabled={updatePending}
                      onClick={() => {
                        updateCourse(
                          {
                            price: priceValue ? parseFloat(priceValue) : 0,
                            currency: currencyValue || 'RUB',
                          },
                          { onSuccess: () => setEditingPrice(false) }
                        )
                      }}
                    >
                      {updatePending ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPrice(false)}
                      disabled={updatePending}
                    >
                      Отмена
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-red-500 mb-8">Курс не найден</p>
          )}

          {/* Modules section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Модули курса</h2>
              {!addingModule && (
                <Button onClick={() => setAddingModule(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Добавить модуль
                </Button>
              )}
            </div>

            {/* Add module form */}
            {addingModule && (
              <Card className="border-dashed border-2 border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Новый модуль</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Название модуля"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    disabled={modulePending}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddModule}
                      disabled={modulePending || !moduleTitle.trim()}
                    >
                      {modulePending ? 'Сохранение...' : 'Создать модуль'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setAddingModule(false); setModuleTitle('') }}
                      disabled={modulePending}
                    >
                      Отмена
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Modules list */}
            {modulesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : modules.length > 0 ? (
              <div className="space-y-3">
                {modules.map((mod) => (
                  <ModuleItem key={mod.id} module={mod} courseId={courseId} />
                ))}
              </div>
            ) : !addingModule ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">Модулей пока нет</p>
                  <Button onClick={() => setAddingModule(true)} variant="outline">
                    Создать первый модуль
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>

        </div>
      </div>
    </ProtectedRoute>
  )
}
