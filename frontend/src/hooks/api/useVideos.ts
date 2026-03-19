import { useQuery, useQueryClient } from '@tanstack/react-query'
import { videosApi } from '@/lib/api'
import type { Video } from '@/types'

/** List all videos attached to a lesson. */
export function useVideosByLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lessons', lessonId, 'videos'],
    queryFn: async () => {
      const response = await videosApi.getByLesson(lessonId)
      return response.data.data as Video[]  // backend wraps in { success, data, timestamp }
    },
    enabled: !!lessonId,
  })
}

/** Returns a helper to manually invalidate the videos list for a lesson. */
export function useInvalidateVideos(lessonId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['lessons', lessonId, 'videos'] })
}

// ── Upload helpers (plain async functions, not React Query) ─────────────────

/**
 * Reads video/audio duration from a local File using a hidden media element.
 * Returns duration in seconds, or undefined if it can't be determined.
 */
export function readMediaDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const isVideo = file.type.startsWith('video/')
    const isAudio = file.type.startsWith('audio/')
    if (!isVideo && !isAudio) return resolve(undefined)

    const el = document.createElement(isVideo ? 'video' : 'audio')
    el.preload = 'metadata'

    el.onloadedmetadata = () => {
      URL.revokeObjectURL(el.src)
      const secs = Math.round(el.duration)
      resolve(isFinite(secs) && secs > 0 ? secs : undefined)
    }
    el.onerror = () => {
      URL.revokeObjectURL(el.src)
      resolve(undefined)
    }

    el.src = URL.createObjectURL(file)
  })
}
