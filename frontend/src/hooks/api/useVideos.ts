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
 * PUT a file directly to an S3 pre-signed URL.
 * Returns a Promise that resolves when the upload is complete.
 * Calls onProgress(0–100) as bytes are transferred.
 */
export function uploadFileToS3(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      // S3 returns 200 for PUT; some configs return 204
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100)
        resolve()
      } else {
        reject(new Error(`S3 upload failed with HTTP ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

    xhr.open('PUT', uploadUrl)
    // Content-Type must match the mimeType used to generate the pre-signed URL
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

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
