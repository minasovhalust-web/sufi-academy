'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { io, Socket } from 'socket.io-client'
import {
  useCourse,
  useMyEnrollments,
  useCourseModules,
  useCourseMaterials,
} from '@/hooks/api/useCourses'
import { useVideosByLesson } from '@/hooks/api/useVideos'
import { chatApi, storageApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { Video, Material, Lesson } from '@/types'
import {
  ChevronDown,
  Clock,
  ArrowLeft,
  BookOpen,
  Play,
  Menu,
  FileText,
  File as FileIconLucide,
  Link as LinkIcon,
  Music,
  Video as VideoIcon,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageCircle,
  Send,
  Paperclip,
  Mic,
  X,
  FileIcon,
  CornerUpLeft,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface ChatMessageSender {
  id: string
  firstName: string
  lastName: string
}

interface ReplyToMessage {
  id: string
  content: string
  sender: ChatMessageSender
}

interface ChatMessage {
  id: string
  content: string
  roomId: string
  senderId: string
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  sender: ChatMessageSender
  replyTo?: ReplyToMessage | null
}

// ── VideoPlayer ─────────────────────────────────────────────────────────────

function VideoPlayer({ video }: { video: Video }) {
  const formatDuration = (secs?: number) => {
    if (!secs) return ''
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (video.status === 'FAILED') {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Не удалось загрузить видео
      </div>
    )
  }

  // storageKey already contains the full URL to the file — use it directly
  // as the video src without an extra round-trip to /stream-url.
  return (
    <div className="space-y-1.5">
      <video
        controls
        src={video.storageKey}
        className="w-full rounded-lg bg-black aspect-video"
        preload="metadata"
      />
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span className="font-medium text-gray-600">{video.title}</span>
        {video.duration && <span>{formatDuration(video.duration)}</span>}
      </div>
    </div>
  )
}

// ── Material icons ──────────────────────────────────────────────────────────

const MATERIAL_ICONS: Record<Material['type'], React.ReactNode> = {
  VIDEO: <VideoIcon className="h-4 w-4 text-purple-500" />,
  AUDIO: <Music className="h-4 w-4 text-blue-500" />,
  PDF: <FileIconLucide className="h-4 w-4 text-red-500" />,
  TEXT: <FileText className="h-4 w-4 text-gray-500" />,
  LINK: <LinkIcon className="h-4 w-4 text-green-500" />,
}

// ── LessonPanel ─────────────────────────────────────────────────────────────

function LessonPanel({ lesson }: { lesson: Lesson }) {
  const { data: videos = [], isLoading: videosLoading } = useVideosByLesson(lesson.id)
  const { data: materials = [], isLoading: materialsLoading } = useCourseMaterials(lesson.id)

  const readyVideos = videos.filter((v) => v.status !== 'FAILED')
  const hasContent = readyVideos.length > 0 || !!lesson.content || materials.length > 0

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold">{lesson.title}</h2>
        {lesson.duration && (
          <p className="flex items-center gap-1.5 text-sm text-gray-400 mt-1.5">
            <Clock className="h-3.5 w-3.5" />
            {lesson.duration} мин
          </p>
        )}
      </div>

      {/* Videos */}
      {videosLoading ? (
        <Skeleton className="w-full aspect-video rounded-lg" />
      ) : readyVideos.length > 0 ? (
        <div className="space-y-4">
          {readyVideos.map((video) => (
            <VideoPlayer key={video.id} video={video} />
          ))}
        </div>
      ) : null}

      {/* Description */}
      {lesson.content && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            Описание
          </h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{lesson.content}</p>
        </div>
      )}

      {/* Materials */}
      {!materialsLoading && materials.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Download className="h-4 w-4 text-gray-400" />
            Материалы
          </h3>
          <ul className="space-y-2">
            {materials.map((m) => (
              <li key={m.id}>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
                >
                  <span className="shrink-0">{MATERIAL_ICONS[m.type]}</span>
                  <span className="flex-1 font-medium text-sm text-gray-700 group-hover:text-gray-900 truncate">
                    {m.title}
                  </span>
                  <Download className="h-3.5 w-3.5 text-gray-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {!videosLoading && !materialsLoading && !hasContent && (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Преподаватель ещё не добавил содержимое урока</p>
        </div>
      )}
    </div>
  )
}

// ── ChatPanel ────────────────────────────────────────────────────────────────

// Attachment message format stored in content field.
// Plain text messages have no __a field; attachment messages are JSON strings.
interface AttachmentPayload {
  __a: 1
  kind: 'image' | 'video' | 'audio' | 'file'
  url: string
  name: string
  mimeType: string
}

function parseAttachment(content: string): AttachmentPayload | null {
  if (!content.startsWith('{')) return null
  try {
    const parsed = JSON.parse(content)
    if (parsed.__a === 1) return parsed as AttachmentPayload
  } catch {
    // not JSON — regular text
  }
  return null
}

function mimeToKind(mime: string): AttachmentPayload['kind'] {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'file'
}

// ── QuoteBlock ────────────────────────────────────────────────────────────────

function QuoteBlock({ replyTo }: { replyTo: ReplyToMessage }) {
  const senderName = `${replyTo.sender.firstName} ${replyTo.sender.lastName}`
  // Show plain text preview; strip JSON attachment markers for readability
  const preview = replyTo.content.startsWith('{')
    ? '📎 Вложение'
    : replyTo.content.slice(0, 120) + (replyTo.content.length > 120 ? '…' : '')

  return (
    <div className="flex gap-2 mb-1.5">
      <div className="w-0.5 rounded-full bg-gray-300 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 truncate">{senderName}</p>
        <p className="text-xs text-gray-400 truncate leading-relaxed">{preview}</p>
      </div>
    </div>
  )
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({
  content,
  deletedAt,
  replyTo,
}: {
  content: string
  deletedAt: string | null
  replyTo?: ReplyToMessage | null
}) {
  if (deletedAt) {
    return <p className="text-sm text-gray-400 italic">[сообщение удалено]</p>
  }

  const attach = parseAttachment(content)
  if (!attach) {
    return (
      <div>
        {replyTo && <QuoteBlock replyTo={replyTo} />}
        <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{content}</p>
      </div>
    )
  }

  if (attach.kind === 'image') {
    return (
      <div>
        {replyTo && <QuoteBlock replyTo={replyTo} />}
        <a href={attach.url} target="_blank" rel="noopener noreferrer">
          <img
            src={attach.url}
            alt={attach.name}
            className="max-w-[280px] max-h-[200px] rounded-xl object-cover border border-gray-100 hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        </a>
      </div>
    )
  }

  if (attach.kind === 'video') {
    return (
      <div>
        {replyTo && <QuoteBlock replyTo={replyTo} />}
        <video
          src={attach.url}
          controls
          className="max-w-[320px] rounded-xl border border-gray-100"
        />
      </div>
    )
  }

  if (attach.kind === 'audio') {
    return (
      <div className="flex flex-col gap-1">
        {replyTo && <QuoteBlock replyTo={replyTo} />}
        <audio src={attach.url} controls className="max-w-[280px] h-10" />
        <span className="text-xs text-gray-400">🎙 Голосовое сообщение</span>
      </div>
    )
  }

  // Generic file
  return (
    <div>
      {replyTo && <QuoteBlock replyTo={replyTo} />}
      <a
        href={attach.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 max-w-[280px]"
      >
        <FileIcon className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="truncate">{attach.name}</span>
        <Download className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      </a>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMessageTime(isoString: string): string {
  const d = new Date(isoString)
  const today = new Date()
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()

  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  return `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} ${time}`
}

// ── ChatPanel ─────────────────────────────────────────────────────────────────

function ChatPanel({ courseId }: { courseId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [connected, setConnected] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  const accessToken = useAuthStore((state) => state.accessToken)

  // ── Load initial REST history ────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return
    setHistoryLoading(true)
    setError(null)
    chatApi
      .getMessages(courseId, { limit: 50 })
      .then((res) => {
        const payload = res.data?.data as { messages: ChatMessage[] } | undefined
        setMessages(payload?.messages ?? [])
      })
      .catch(() => setError('Не удалось загрузить историю сообщений'))
      .finally(() => setHistoryLoading(false))
  }, [courseId, accessToken])

  // ── WebSocket connection ─────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://95.179.187.108:4000/api/v1'
    const socketBase = apiBase.replace(/\/api\/v1\/?$/, '')

    const sock = io(`${socketBase}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    sock.on('connect', () => {
      setConnected(true)
      setError(null)
      sock.emit('join-room', { courseId })
    })

    sock.on('disconnect', () => setConnected(false))
    sock.on('connect_error', () => {
      setConnected(false)
      setError('Не удалось подключиться к чату')
    })

    sock.on(
      'room-history',
      ({ messages: hist }: { messages: ChatMessage[]; hasMore: boolean }) => {
        setMessages(hist)
        setHistoryLoading(false)
      },
    )

    sock.on('new-message', (msg: ChatMessage) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    })

    sock.on(
      'message-deleted',
      ({ messageId, deletedAt }: { messageId: string; deletedAt: string }) => {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deletedAt } : m)))
      },
    )

    sock.on('exception', ({ message: msg }: { message: string }) => setError(msg))

    socketRef.current = sock
    return () => {
      sock.emit('leave-room', { courseId })
      sock.disconnect()
      socketRef.current = null
    }
  }, [courseId, accessToken])

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Cleanup recording timer on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }
  }, [])

  // ── Send text via WebSocket ───────────────────────────────────────────────
  const sendTextMessage = (content: string) => {
    if (!content.trim() || !socketRef.current?.connected) return
    const payload: Record<string, unknown> = { courseId, content: content.trim() }
    if (replyingTo) payload.replyToId = replyingTo.id
    socketRef.current.emit('send-message', payload)
    setReplyingTo(null)
  }

  const handleSendText = () => {
    sendTextMessage(inputValue)
    setInputValue('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  // ── Upload helper — uploads file, returns attachment JSON string ──────────
  const uploadAndSend = async (file: File) => {
    if (!socketRef.current?.connected) return
    setUploading(true)
    const pendingReply = replyingTo
    setReplyingTo(null)
    try {
      const res = await storageApi.upload(file)
      const { url, name, mimeType } = res.data.data as {
        url: string; name: string; mimeType: string
      }
      const attachPayload: AttachmentPayload = {
        __a: 1,
        kind: mimeToKind(mimeType),
        url,
        name,
        mimeType,
      }
      const wsPayload: Record<string, unknown> = {
        courseId,
        content: JSON.stringify(attachPayload),
      }
      if (pendingReply) wsPayload.replyToId = pendingReply.id
      socketRef.current.emit('send-message', wsPayload)
    } catch {
      setError('Не удалось загрузить файл')
    } finally {
      setUploading(false)
    }
  }

  // ── File picker ───────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAndSend(file)
    // reset so the same file can be re-selected
    e.target.value = ''
  }

  // ── Voice recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    if (isRecording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Pick a supported MIME type (Safari needs audio/mp4, others prefer webm)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []
      cancelledRef.current = false

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        if (cancelledRef.current || audioChunksRef.current.length === 0) return
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType })
        uploadAndSend(file)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingSeconds(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1)
      }, 1000)
    } catch {
      setError('Нет доступа к микрофону. Разрешите его в настройках браузера.')
    }
  }

  const stopRecording = () => {
    if (!isRecording) return
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setIsRecording(false)
    setRecordingSeconds(0)
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  const cancelRecording = () => {
    // Set cancelled flag BEFORE stopping — onstop fires after stop(),
    // and ondataavailable may still push chunks in between.
    cancelledRef.current = true
    audioChunksRef.current = []
    stopRecording()
  }

  const formatRecordTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white">

      {/* Connection indicator */}
      <div
        className={`px-4 py-1.5 text-xs font-medium flex items-center gap-2 shrink-0 ${
          connected
            ? 'bg-green-50 text-green-700 border-b border-green-100'
            : 'bg-gray-50 text-gray-500 border-b border-gray-100'
        }`}
      >
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
        {connected ? 'Подключено' : 'Подключение…'}
        {uploading && (
          <span className="ml-auto flex items-center gap-1 text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            Загрузка файла…
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {historyLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-10 w-3/4 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : error && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-12">
            <AlertCircle className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-12">
            <MessageCircle className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm font-medium text-gray-500">Сообщений пока нет</p>
            <p className="text-xs mt-1">Напишите первым!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="flex flex-col gap-0.5 group relative"
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-gray-900">
                  {msg.sender.firstName} {msg.sender.lastName}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatMessageTime(msg.createdAt)}
                </span>
                {/* Reply button — visible on hover */}
                {!msg.deletedAt && hoveredMessageId === msg.id && (
                  <button
                    onClick={() => {
                      setReplyingTo(msg)
                      inputRef.current?.focus()
                    }}
                    title="Ответить"
                    className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <CornerUpLeft className="h-3.5 w-3.5" />
                    Ответить
                  </button>
                )}
              </div>
              <MessageBubble
                content={msg.content}
                deletedAt={msg.deletedAt}
                replyTo={msg.replyTo}
              />
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recording overlay */}
      {isRecording && (
        <div className="border-t bg-red-50 px-4 py-3 flex items-center gap-3 shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-700 flex-1">
            Запись… {formatRecordTime(recordingSeconds)}
          </span>
          <button
            onClick={cancelRecording}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-3.5 w-3.5" /> Отмена
          </button>
          <button
            onClick={stopRecording}
            className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg flex items-center gap-1"
          >
            <Send className="h-3.5 w-3.5" /> Отправить
          </button>
        </div>
      )}

      {/* Reply preview bar */}
      {replyingTo && !isRecording && (
        <div className="border-t bg-gray-50 px-4 py-2 flex items-start gap-2 shrink-0">
          <div className="flex gap-2 flex-1 min-w-0">
            <div className="w-0.5 rounded-full bg-blue-400 shrink-0 self-stretch" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-600 truncate">
                {replyingTo.sender.firstName} {replyingTo.sender.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {replyingTo.content.startsWith('{') ? '📎 Вложение' : replyingTo.content.slice(0, 100)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-gray-400 hover:text-gray-600 shrink-0 p-0.5 rounded"
            title="Отмена"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Input bar */}
      {!isRecording && (
        <div className="border-t bg-white p-3 flex gap-2 items-end shrink-0">

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
          />

          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!connected || uploading}
            title="Прикрепить файл (фото, видео, PDF, Word)"
            className="h-10 w-10 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Text area */}
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение… (Enter — отправить, Shift+Enter — перенос)"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] placeholder:text-gray-400"
            disabled={!connected || uploading}
          />

          {/* Mic button — click to start / click again to stop */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!connected || uploading}
            title={isRecording ? 'Остановить запись' : 'Записать голосовое сообщение'}
            className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Mic className="h-4 w-4" />
          </button>

          {/* Send button */}
          <Button
            onClick={handleSendText}
            disabled={!inputValue.trim() || !connected || uploading}
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

type ActiveTab = 'lesson' | 'chat'

export default function LearnPage({ params }: { params: { courseId: string } }) {
  // Prevent hydration mismatch: Zustand reads localStorage only on the client,
  // so auth state differs between server render and first client render.
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const { data: course, isLoading: courseLoading } = useCourse(params.courseId)
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useMyEnrollments(
    isAuthenticated ? {} : undefined,
  )
  const { data: modules = [], isLoading: modulesLoading } = useCourseModules(
    params.courseId,
    { enabled: isAuthenticated },
  )

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('lesson')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Derive the active Lesson object from already-loaded modules data.
  // This avoids a separate fetch to /lessons/:id (which is a nested-only route).
  const activeLesson = activeLessonId
    ? modules.flatMap((m) => m.lessons ?? []).find((l) => l.id === activeLessonId) ?? null
    : null

  const enrollments = enrollmentsData || []
  const myEnrollment = enrollments.find((e) => e.courseId === params.courseId)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/auth/login?redirect=/learn/${params.courseId}`)
    }
  }, [isAuthenticated, params.courseId, router])

  useEffect(() => {
    if (!enrollmentsLoading && enrollmentsData !== undefined) {
      if (!myEnrollment || myEnrollment.status === 'CANCELLED') {
        router.replace(`/courses/${params.courseId}`)
      }
    }
  }, [enrollmentsLoading, enrollmentsData, myEnrollment, params.courseId, router])

  // Auto-expand first module when modules first load.
  // Uses the functional updater so `expandedModules` is not needed in deps.
  useEffect(() => {
    if (modules.length > 0) {
      setExpandedModules((prev) => (prev.size === 0 ? new Set([modules[0].id]) : prev))
    }
  }, [modules])

  // All hooks above this line. Early returns below are safe.
  if (!mounted) return null

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const handleSelectLesson = (lessonId: string, moduleId: string) => {
    setActiveLessonId(lessonId)
    setExpandedModules((prev) => new Set(Array.from(prev).concat(moduleId)))
    setActiveTab('lesson')
    setSidebarOpen(false) // auto-close on mobile after selecting a lesson
  }

  // Loading skeleton
  if (!isAuthenticated || courseLoading || enrollmentsLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container-base py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-12 w-2/3 mb-4" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container-base py-12 text-center">
        <p className="text-lg text-gray-500">Курс не найден</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/courses">К каталогу</Link>
        </Button>
      </div>
    )
  }

  // ── PENDING ────────────────────────────────────────────────────────────
  if (myEnrollment?.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-white">
        <div className="container-base py-12">
          <Button asChild variant="ghost" className="mb-8 -ml-2">
            <Link href={`/courses/${params.courseId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к курсу
            </Link>
          </Button>
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Заявка на рассмотрении</h1>
            <p className="text-gray-500 mb-2">
              Ваша заявка на курс{' '}
              <span className="font-semibold text-foreground">«{course.title}»</span> принята.
            </p>
            <p className="text-gray-500">
              Ожидайте подтверждения администратора. После одобрения вы получите полный доступ к
              материалам курса.
            </p>
            <Button asChild className="mt-8" variant="outline">
              <Link href="/courses">Посмотреть другие курсы</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── ACTIVE / COMPLETED ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b px-3 md:px-6 py-3 flex items-center gap-2 md:gap-4 shrink-0">
        {/* Sidebar toggle — mobile only */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden shrink-0 px-2"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Содержание курса"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button asChild variant="ghost" size="sm" className="-ml-1 shrink-0">
          <Link href={`/courses/${params.courseId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Назад</span>
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate text-sm md:text-base">{course.title}</h1>
        </div>
        {myEnrollment && (
          <Badge variant="outline" className="shrink-0 text-xs hidden sm:flex">
            {myEnrollment.status === 'COMPLETED' ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                Завершён
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1 text-blue-500" />
                Активен
              </>
            )}
          </Badge>
        )}
      </header>

      {/* Split layout */}
      <div className="relative flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

        {/* Mobile backdrop — tap outside to close */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left sidebar — course outline */}
        <aside className={`
          absolute md:relative inset-y-0 left-0 z-20
          w-72 md:w-80 shrink-0 bg-white border-r overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}>
          <div className="p-4 border-b">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Содержание курса
            </p>
          </div>

          {modulesLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : modules.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Модули ещё не добавлены</div>
          ) : (
            <div className="py-2">
              {modules.map((module, moduleIndex) => (
                <div key={module.id}>
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
                      {moduleIndex + 1}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-gray-800 leading-tight">
                      {module.title}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${
                        expandedModules.has(module.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedModules.has(module.id) && module.lessons && (
                    <div className="pb-2">
                      {module.lessons.length === 0 ? (
                        <p className="text-xs text-gray-400 px-7 py-2">Уроков нет</p>
                      ) : (
                        module.lessons.map((lesson, lessonIndex) => {
                          const isActive =
                            activeLessonId === lesson.id && activeTab === 'lesson'
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson.id, module.id)}
                              className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                                isActive
                                  ? 'bg-blue-50 border-r-2 border-blue-500'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs text-gray-400 shrink-0 mt-0.5">
                                {lessonIndex + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm leading-tight ${
                                    isActive
                                      ? 'font-semibold text-blue-700'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {lesson.title}
                                </p>
                                {lesson.duration && (
                                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {lesson.duration} мин
                                  </p>
                                )}
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Right panel — tabbed */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="bg-white border-b flex items-center px-2 shrink-0">
            <button
              onClick={() => setActiveTab('lesson')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'lesson'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Урок
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              Чат
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'lesson' ? (
              <div className="h-full overflow-y-auto">
                {activeLesson ? (
                  <LessonPanel lesson={activeLesson} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-24 text-center text-gray-400">
                    <BookOpen className="h-12 w-12 mb-4 opacity-30" />
                    <p className="text-lg font-medium text-gray-500">Выберите урок</p>
                    <p className="text-sm mt-1">
                      Нажмите на урок в списке слева чтобы начать
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <ChatPanel courseId={params.courseId} />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
