'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAuthStore } from '@/store/auth.store'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  useDirectMessages,
  useSendDirectMessage,
} from '@/hooks/api/useDirectMessages'
import { storageApi } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Send,
  Loader2,
  Paperclip,
  Mic,
  MicOff,
  FileIcon,
  Download,
  X,
} from 'lucide-react'
import type { DirectMessage } from '@/types'

// ── Attachment helpers (same format as learn-page chat) ───────────────────────

interface AttachmentPayload {
  __a: 1
  kind: 'image' | 'video' | 'audio' | 'file'
  url: string
  name: string
  mimeType: string
}

function mimeToKind(mimeType: string): AttachmentPayload['kind'] {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'file'
}

function parseAttachment(content: string): AttachmentPayload | null {
  if (!content.startsWith('{')) return null
  try {
    const parsed = JSON.parse(content)
    if (parsed.__a === 1) return parsed as AttachmentPayload
  } catch {
    // plain text
  }
  return null
}

function formatRecordTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass =
    size === 'sm'
      ? 'h-7 w-7 text-[10px]'
      : size === 'lg'
      ? 'h-11 w-11 text-base'
      : 'h-9 w-9 text-sm'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {initials}
    </div>
  )
}

// ── Attachment renderer ───────────────────────────────────────────────────────

function AttachmentContent({
  attach,
  isFromMe,
}: {
  attach: AttachmentPayload
  isFromMe: boolean
}) {
  if (attach.kind === 'image') {
    return (
      <a href={attach.url} target="_blank" rel="noopener noreferrer">
        <img
          src={attach.url}
          alt={attach.name}
          className="max-w-[260px] max-h-[200px] rounded-xl object-cover hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </a>
    )
  }

  if (attach.kind === 'audio') {
    return (
      <div className="flex flex-col gap-1">
        <audio src={attach.url} controls className="max-w-[240px] h-9" />
        <span className="text-[11px] text-gray-500">
          🎙 Голосовое сообщение
        </span>
      </div>
    )
  }

  if (attach.kind === 'video') {
    return (
      <video
        src={attach.url}
        controls
        className="max-w-[280px] rounded-xl"
      />
    )
  }

  // Generic file
  return (
    <a
      href={attach.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium max-w-[240px] transition-colors ${
        isFromMe
          ? 'border-indigo-200 bg-indigo-50 text-gray-900 hover:bg-indigo-100'
          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
      }`}
    >
      <FileIcon className="h-4 w-4 shrink-0 opacity-70" />
      <span className="truncate">{attach.name}</span>
      <Download className="h-3.5 w-3.5 shrink-0 opacity-60" />
    </a>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isFromMe,
  showAvatar,
}: {
  message: DirectMessage
  isFromMe: boolean
  showAvatar: boolean
}) {
  const time = format(new Date(message.createdAt), 'HH:mm', { locale: ru })
  const attach = parseAttachment(message.content)
  const isMedia = attach?.kind === 'image' || attach?.kind === 'video'

  if (isFromMe) {
    return (
      <div className="flex justify-end items-end gap-1.5">
        <span className="text-[10px] text-gray-400 mb-0.5 shrink-0">{time}</span>
        <div
          className={`max-w-[72%] ${
            isMedia ? '' : 'bg-indigo-100 text-gray-900 shadow-sm'
          } rounded-2xl rounded-br-sm ${isMedia ? '' : 'px-4 py-2.5'}`}
        >
          {attach ? (
            <AttachmentContent attach={attach} isFromMe />
          ) : (
            <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          )}
        </div>
      </div>
    )
  }

  const senderName = `${message.sender.firstName} ${message.sender.lastName}`

  return (
    <div className="flex items-end gap-2">
      {showAvatar ? (
        <Avatar name={senderName} avatarUrl={message.sender.avatarUrl} size="sm" />
      ) : (
        <div className="w-7 shrink-0" />
      )}
      <div className="max-w-[72%]">
        <div
          className={`${
            isMedia ? '' : 'bg-white border border-gray-200 shadow-sm text-gray-900'
          } rounded-2xl rounded-bl-sm ${isMedia ? '' : 'px-4 py-2.5'}`}
        >
          {attach ? (
            <AttachmentContent attach={attach} isFromMe={false} />
          ) : (
            <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          )}
        </div>
        <span className="text-[10px] text-gray-400 mt-0.5 ml-1">{time}</span>
      </div>
    </div>
  )
}

// ── Date separator ────────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-0.5 rounded-full shrink-0">
        {format(new Date(date), 'd MMMM yyyy', { locale: ru })}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChatPage({ params }: { params: { userId: string } }) {
  const partnerId = params.userId
  const { user } = useAuthStore()

  const { data: messages, isLoading } = useDirectMessages(partnerId)
  const { mutate: sendMessage, isPending: isSending } = useSendDirectMessage(partnerId)

  // ── Text input state
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── File / voice upload state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // ── Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Derive partner info from first message
  const partner = messages?.[0]
    ? messages[0].senderId === user?.id
      ? messages[0].receiver
      : messages[0].sender
    : null

  const partnerName = partner
    ? `${partner.firstName} ${partner.lastName}`
    : 'Пользователь'

  // ── Send text ─────────────────────────────────────────────────────────────

  const handleSend = () => {
    const content = text.trim()
    if (!content || isSending) return
    sendMessage(content, {
      onSuccess: () => {
        setText('')
        textareaRef.current?.focus()
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Upload helper (shared for files and voice) ────────────────────────────

  const uploadAndSend = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const res = await storageApi.upload(file)
      const { url, name, mimeType } = res.data.data as {
        url: string
        name: string
        mimeType: string
      }
      const payload: AttachmentPayload = {
        __a: 1,
        kind: mimeToKind(mimeType),
        url,
        name,
        mimeType,
      }
      sendMessage(JSON.stringify(payload))
    } catch {
      setUploadError('Не удалось загрузить файл')
      setTimeout(() => setUploadError(null), 4000)
    } finally {
      setUploading(false)
    }
  }

  // ── File picker ───────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAndSend(file)
    e.target.value = ''
  }

  // ── Voice recording ───────────────────────────────────────────────────────

  const startRecording = async () => {
    if (isRecording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
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
      setUploadError('Нет доступа к микрофону. Разрешите его в настройках браузера.')
      setTimeout(() => setUploadError(null), 4000)
    }
  }

  const stopRecording = (cancel = false) => {
    if (!isRecording) return
    cancelledRef.current = cancel
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setIsRecording(false)
    setRecordingSeconds(0)
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  // ── Group messages by date ────────────────────────────────────────────────

  const grouped: Array<{ date: string; messages: DirectMessage[] }> = []
  for (const msg of messages ?? []) {
    const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd')
    const last = grouped[grouped.length - 1]
    if (!last || last.date !== dateKey) {
      grouped.push({ date: dateKey, messages: [msg] })
    } else {
      last.messages.push(msg)
    }
  }

  const isBusy = uploading || isSending

  return (
    <ProtectedRoute>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
        onChange={handleFileChange}
      />

      <div className="bg-[#f0f2f5] flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <Link
            href="/messages"
            className="p-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {isLoading ? (
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          ) : partner ? (
            <Avatar name={partnerName} avatarUrl={partner.avatarUrl} size="lg" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <p className="font-semibold text-gray-900 truncate">{partnerName}</p>
            )}
          </div>
        </div>

        {/* ── Messages area ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          {isLoading ? (
            <div className="space-y-4 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex gap-2 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                  {i % 2 !== 0 && <Skeleton className="h-7 w-7 rounded-full shrink-0" />}
                  <Skeleton className={`h-12 rounded-2xl ${i % 2 !== 0 ? 'w-48' : 'w-40'}`} />
                </div>
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-8">
              <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                {partner && (
                  <Avatar name={partnerName} avatarUrl={partner.avatarUrl} />
                )}
              </div>
              <p className="font-medium text-gray-700">{partnerName}</p>
              <p className="text-sm text-gray-400 mt-1">Напишите первое сообщение</p>
            </div>
          ) : (
            grouped.map(({ date, messages: dayMsgs }) => (
              <div key={date}>
                <DateSeparator date={date} />
                <div className="space-y-1">
                  {dayMsgs.map((msg, idx) => {
                    const isFromMe = msg.senderId === user?.id
                    // Show avatar only on the last consecutive message from the same sender
                    const nextMsg = dayMsgs[idx + 1]
                    const showAvatar = !isFromMe && (
                      !nextMsg || nextMsg.senderId !== msg.senderId
                    )
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isFromMe={isFromMe}
                        showAvatar={showAvatar}
                      />
                    )
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Recording overlay ────────────────────────────────────────────── */}
        {isRecording && (
          <div className="shrink-0 bg-red-50 border-t border-red-100 px-4 py-3 flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-700 flex-1">
              Запись… {formatRecordTime(recordingSeconds)}
            </span>
            <button
              onClick={() => stopRecording(true)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Отмена
            </button>
            <button
              onClick={() => stopRecording(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
            >
              <MicOff className="h-3.5 w-3.5" />
              Отправить
            </button>
          </div>
        )}

        {/* ── Upload error ─────────────────────────────────────────────────── */}
        {uploadError && (
          <div className="shrink-0 bg-red-50 border-t border-red-100 px-4 py-2 text-xs text-red-600 text-center">
            {uploadError}
          </div>
        )}

        {/* ── Input bar ────────────────────────────────────────────────────── */}
        {!isRecording && (
          <div className="shrink-0 bg-white border-t border-gray-200 px-3 py-3">
            <div className="flex items-end gap-2 max-w-3xl mx-auto">

              {/* Paperclip */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="h-10 w-10 flex items-center justify-center rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0 disabled:opacity-40"
                title="Прикрепить файл"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Paperclip className="h-5 w-5" />
                )}
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  // Auto-grow
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
                }}
                onKeyDown={handleKeyDown}
                placeholder="Сообщение…"
                rows={1}
                disabled={isBusy}
                className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition overflow-y-auto disabled:opacity-60"
                style={{ lineHeight: '1.5', minHeight: '40px', maxHeight: '128px' }}
              />

              {/* Mic button (show when no text) */}
              {!text.trim() && (
                <button
                  onClick={startRecording}
                  disabled={isBusy}
                  className="h-10 w-10 flex items-center justify-center rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0 disabled:opacity-40"
                  title="Голосовое сообщение"
                >
                  <Mic className="h-5 w-5" />
                </button>
              )}

              {/* Send button (show when there is text) */}
              {text.trim() && (
                <button
                  onClick={handleSend}
                  disabled={isBusy}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm hover:bg-indigo-600 transition-colors shrink-0 disabled:opacity-50"
                  title="Отправить"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
