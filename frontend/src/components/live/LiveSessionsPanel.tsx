'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { liveApi } from '@/lib/api'
import { Radio, Calendar } from 'lucide-react'
import type { LiveSession } from '@/types'

export function LiveSessionsPanel({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    liveApi.getSessionsByCourse(courseId)
      .then(res => setSessions(res.data?.data ?? res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
      Загрузка...
    </div>
  )

  if (sessions.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
      <Radio className="h-8 w-8 opacity-40" />
      <p className="text-sm">Нет прямых эфиров</p>
    </div>
  )

  return (
    <div className="p-4 space-y-3">
      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Прямые эфиры</h3>
      {sessions.map(session => (
        <div
          key={session.id}
          onClick={() => session.status === 'LIVE' && router.push(`/live/${session.id}`)}
          className={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${
            session.status === 'LIVE'
              ? 'border-red-200 bg-red-50 cursor-pointer hover:bg-red-100'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
            session.status === 'LIVE' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            <Radio className={`h-4 w-4 ${session.status === 'LIVE' ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm truncate">{session.title}</p>
              {session.status === 'LIVE' && (
                <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">LIVE</span>
              )}
              {session.status === 'ENDED' && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Завершён</span>
              )}
              {session.status === 'SCHEDULED' && (
                <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Запланирован</span>
              )}
            </div>
            {session.scheduledAt && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                <Calendar className="h-3 w-3" />
                {new Date(session.scheduledAt).toLocaleString('ru-RU')}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
