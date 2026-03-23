'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth.store'
import { liveApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Radio,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import type { LiveSession } from '@/types'

// ── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  userId: string
  firstName: string
  lastName: string
  role: 'HOST' | 'STUDENT'
  micEnabled: boolean
  handRaised: boolean
}

interface WebRtcSignalPayload {
  type: 'offer' | 'answer' | 'candidate'
  sdp?: string
  candidate?: RTCIceCandidateInit
}

interface IncomingSignal {
  fromUserId: string
  sessionId: string
  signal: WebRtcSignalPayload
}

interface SessionStatePayload {
  session: LiveSession
  participants: Participant[]
  activeCount: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000'

// ── VideoTile ─────────────────────────────────────────────────────────────────

function VideoTile({
  stream,
  name,
  isLocal = false,
  isMuted = false,
  isLarge = false,
  role,
}: {
  stream: MediaStream | null
  name: string
  isLocal?: boolean
  isMuted?: boolean
  isLarge?: boolean
  role?: 'HOST' | 'STUDENT'
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div
      className={`relative bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center ${
        isLarge ? 'w-full h-full' : 'w-full h-full'
      }`}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <VideoOff className="h-8 w-8" />
          <span className="text-xs">Нет видео</span>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="text-white text-xs bg-black/60 px-2 py-0.5 rounded-full">
          {name}
          {isLocal ? ' (Вы)' : ''}
        </span>
        {role === 'HOST' && (
          <Badge className="text-xs h-5 bg-amber-500/80 text-white border-0">Хост</Badge>
        )}
        {isMuted && <MicOff className="h-3 w-3 text-red-400 bg-black/60 rounded-full p-0.5" />}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LiveSessionPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params
  const router = useRouter()
  const { user, accessToken } = useAuthStore()

  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)

  // Session / UI state
  const [session, setSession] = useState<LiveSession | null>(null)
  const [participants, setParticipants] = useState<Record<string, Participant>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStartingLive, setIsStartingLive] = useState(false)

  // Refs — stable across renders, safe to use inside closures
  const socketRef = useRef<Socket | null>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const localStreamRef = useRef<MediaStream | null>(null)
  const iceServersRef = useRef<RTCIceServer[]>([{ urls: 'stun:stun.l.google.com:19302' }])
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const sessionIdRef = useRef(sessionId)
  const userIdRef = useRef(user?.id)

  useEffect(() => { userIdRef.current = user?.id }, [user?.id])

  // ── isHost derived from latest session data ───────────────────────────────
  const isHost = !!(user?.id && session?.hostId && user.id === session.hostId)

  // ── Create a peer connection for a remote user ────────────────────────────
  const createPeer = useCallback(
    (targetUserId: string): RTCPeerConnection => {
      // Close existing if any
      if (peersRef.current[targetUserId]) {
        peersRef.current[targetUserId].close()
      }

      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current })

      // Add local tracks
      const stream = localStreamRef.current
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream))
      }

      // Forward ICE candidates to signaling server
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current?.connected) {
          socketRef.current.emit('webrtc-signal', {
            sessionId: sessionIdRef.current,
            targetUserId,
            signal: { type: 'candidate', candidate: event.candidate.toJSON() },
          })
        }
      }

      // Receive remote tracks and update UI
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (remoteStream) {
          setRemoteStreams((prev) => ({ ...prev, [targetUserId]: remoteStream }))
        }
      }

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          setRemoteStreams((prev) => {
            const next = { ...prev }
            delete next[targetUserId]
            return next
          })
        }
      }

      peersRef.current[targetUserId] = pc
      return pc
    },
    [] // sessionId and localStream accessed via refs
  )

  // ── Main initialization effect ────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) {
      router.push('/auth/login')
      return
    }

    let socket: Socket | null = null
    let aborted = false

    async function initialize() {
      // 1. Fetch ICE servers
      try {
        const res = await liveApi.getIceServers()
        const servers = res.data?.data?.iceServers ?? res.data?.iceServers
        if (Array.isArray(servers) && servers.length > 0) {
          iceServersRef.current = servers
        }
      } catch {
        // Fallback to public STUN — already set as default
      }

      // 2. Acquire local media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (aborted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        localStreamRef.current = stream
        setLocalStream(stream)
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
      } catch (err: unknown) {
        const msg =
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Доступ к камере/микрофону запрещён. Разрешите доступ в настройках браузера.'
            : 'Не удалось получить доступ к камере и микрофону.'
        setError(msg)
        setIsInitializing(false)
        return
      }

      // 3. Connect WebSocket
      socket = io(`${WS_URL}/live`, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
      })
      socketRef.current = socket

      socket.on('connect', () => {
        if (!aborted) {
          setIsConnected(true)
          socket!.emit('join-session', { sessionId })
          setIsInitializing(false)
        }
      })

      socket.on('connect_error', () => {
        if (!aborted) setError('Не удалось подключиться к серверу')
        setIsInitializing(false)
      })

      socket.on('disconnect', () => {
        if (!aborted) setIsConnected(false)
      })

      socket.on('exception', (data: { message: string }) => {
        if (!aborted) setError(data.message)
      })

      // ── Session state on join ───────────────────────────────────────────
      socket.on('session-state', async (state: SessionStatePayload) => {
        if (aborted) return
        setSession(state.session)
        const map: Record<string, Participant> = {}
        for (const p of state.participants) map[p.userId] = p
        setParticipants(map)

        // Create offers for every participant already in the room (except self)
        for (const p of state.participants) {
          if (p.userId === userIdRef.current) continue
          try {
            const pc = createPeer(p.userId)
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            socket!.emit('webrtc-signal', {
              sessionId,
              targetUserId: p.userId,
              signal: { type: 'offer', sdp: offer.sdp },
            })
          } catch (e) {
            console.error('[webrtc] Failed to create offer to', p.userId, e)
          }
        }
      })

      // ── New participant joined ──────────────────────────────────────────
      socket.on('participant-joined', (data: Participant) => {
        if (!aborted) {
          setParticipants((prev) => ({ ...prev, [data.userId]: data }))
          // The new joiner will send us an offer — no action needed here
        }
      })

      // ── Participant left ───────────────────────────────────────────────
      socket.on('participant-left', (data: { userId: string }) => {
        if (aborted) return
        setParticipants((prev) => {
          const next = { ...prev }
          delete next[data.userId]
          return next
        })
        setRemoteStreams((prev) => {
          const next = { ...prev }
          delete next[data.userId]
          return next
        })
        if (peersRef.current[data.userId]) {
          peersRef.current[data.userId].close()
          delete peersRef.current[data.userId]
        }
      })

      // ── WebRTC signaling ──────────────────────────────────────────────
      socket.on('webrtc-signal', async (data: IncomingSignal) => {
        if (aborted) return
        const { fromUserId, signal } = data

        try {
          if (signal.type === 'offer') {
            const pc = createPeer(fromUserId)
            await pc.setRemoteDescription(
              new RTCSessionDescription({ type: 'offer', sdp: signal.sdp! })
            )
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket!.emit('webrtc-signal', {
              sessionId,
              targetUserId: fromUserId,
              signal: { type: 'answer', sdp: answer.sdp },
            })
          } else if (signal.type === 'answer') {
            const pc = peersRef.current[fromUserId]
            if (pc && pc.signalingState !== 'stable') {
              await pc.setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp: signal.sdp! })
              )
            }
          } else if (signal.type === 'candidate' && signal.candidate) {
            const pc = peersRef.current[fromUserId]
            if (pc) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
            }
          }
        } catch (e) {
          console.error('[webrtc] Signal error:', signal.type, e)
        }
      })

      // ── Mic events ────────────────────────────────────────────────────
      socket.on('mic-granted', (data: { userId: string }) => {
        if (!aborted) {
          setParticipants((prev) =>
            prev[data.userId]
              ? { ...prev, [data.userId]: { ...prev[data.userId], micEnabled: true, handRaised: false } }
              : prev
          )
        }
      })

      socket.on('mic-revoked', (data: { userId: string }) => {
        if (!aborted) {
          setParticipants((prev) =>
            prev[data.userId]
              ? { ...prev, [data.userId]: { ...prev[data.userId], micEnabled: false } }
              : prev
          )
        }
      })

      // ── Session ended by host ─────────────────────────────────────────
      socket.on('session-ended', () => {
        if (!aborted) router.push('/dashboard')
      })
    }

    initialize()

    return () => {
      aborted = true
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      Object.values(peersRef.current).forEach((pc) => pc.close())
      peersRef.current = {}
      socket?.emit('leave-session', { sessionId })
      socket?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  // ── Controls ──────────────────────────────────────────────────────────────

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsAudioEnabled(track.enabled)
    }
  }

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsVideoEnabled(track.enabled)
    }
  }

  const handleLeave = () => {
    socketRef.current?.emit('leave-session', { sessionId })
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    Object.values(peersRef.current).forEach((pc) => pc.close())
    socketRef.current?.disconnect()
    router.push('/dashboard')
  }

  const handleEndSession = () => {
    socketRef.current?.emit('end-session', { sessionId })
  }

  const handleStartBroadcast = async () => {
    setIsStartingLive(true)
    try {
      const res = await liveApi.startSession(sessionId)
      const updatedSession = res.data?.data ?? res.data
      setSession(updatedSession)
    } catch (err: unknown) {
      const msg =
        err instanceof Object && 'response' in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message
          : 'Ошибка запуска трансляции'
      setError(msg ?? 'Ошибка запуска трансляции')
    } finally {
      setIsStartingLive(false)
    }
  }

  // ── Derived data for rendering ────────────────────────────────────────────

  const participantList = Object.values(participants)
  const hostParticipant = participantList.find((p) => p.role === 'HOST')
  const studentParticipants = participantList.filter((p) => p.role === 'STUDENT')

  // The "main" video shown large: host stream (or local if you are the host)
  const hostUserId = hostParticipant?.userId
  const hostStream =
    hostUserId === user?.id ? localStream : (hostUserId ? remoteStreams[hostUserId] : null) ?? null

  const hostName = hostParticipant
    ? `${hostParticipant.firstName} ${hostParticipant.lastName}`
    : 'Хост'

  // Small tiles: students + local (if student), or students only (if host)
  const smallTiles: Array<{
    userId: string
    name: string
    stream: MediaStream | null
    micEnabled: boolean
    role: 'HOST' | 'STUDENT'
    isLocal: boolean
  }> = []

  if (isHost) {
    // Host sees student tiles
    for (const p of studentParticipants) {
      smallTiles.push({
        userId: p.userId,
        name: `${p.firstName} ${p.lastName}`,
        stream: remoteStreams[p.userId] ?? null,
        micEnabled: p.micEnabled,
        role: 'STUDENT',
        isLocal: false,
      })
    }
  } else {
    // Student sees self + other students
    if (user) {
      const selfParticipant = participants[user.id]
      smallTiles.push({
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        stream: localStream,
        micEnabled: selfParticipant?.micEnabled ?? isAudioEnabled,
        role: 'STUDENT',
        isLocal: true,
      })
    }
    for (const p of studentParticipants) {
      if (p.userId === user?.id) continue
      smallTiles.push({
        userId: p.userId,
        name: `${p.firstName} ${p.lastName}`,
        stream: remoteStreams[p.userId] ?? null,
        micEnabled: p.micEnabled,
        role: 'STUDENT',
        isLocal: false,
      })
    }
  }

  // ── Render: Loading ───────────────────────────────────────────────────────

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
          <p className="text-gray-300">Подключение к сессии...</p>
        </div>
      </div>
    )
  }

  // ── Render: Error ─────────────────────────────────────────────────────────

  if (error && !isConnected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white max-w-md text-center px-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <h2 className="text-xl font-semibold">Ошибка подключения</h2>
          <p className="text-gray-400">{error}</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline" className="border-gray-600 text-gray-300">
            Вернуться на главную
          </Button>
        </div>
      </div>
    )
  }

  // ── Render: Session ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold truncate max-w-xs">
            {session?.title ?? 'Живой урок'}
          </h1>
          {session?.status === 'LIVE' && (
            <Badge className="bg-red-600 text-white border-0 flex items-center gap-1">
              <Radio className="h-3 w-3" />
              LIVE
            </Badge>
          )}
          {session?.status === 'SCHEDULED' && (
            <Badge variant="outline" className="border-gray-600 text-gray-400">Запланировано</Badge>
          )}
          {session?.status === 'ENDED' && (
            <Badge variant="outline" className="border-gray-600 text-gray-400">Завершено</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Users className="h-4 w-4" />
          <span>{participantList.length}</span>
          {!isConnected && (
            <span className="text-yellow-500 text-xs flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Переподключение...
            </span>
          )}
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && isConnected && (
        <div className="bg-red-900/50 border-b border-red-800 px-4 py-2 flex items-center gap-2 text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Main video area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 min-h-0">

        {/* Host video — large */}
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-gray-900">
          {isHost ? (
            /* Host sees their own stream in the main tile */
            <div className="w-full h-full relative bg-gray-900 rounded-xl overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: isVideoEnabled ? 'block' : 'none' }}
              />
              {!isVideoEnabled && (
                <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-2">
                  <VideoOff className="h-12 w-12" />
                  <span>Камера выключена</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="text-white text-sm bg-black/60 px-2 py-0.5 rounded-full">
                  {user?.firstName} {user?.lastName} (Вы — Хост)
                </span>
                <Badge className="bg-amber-500/80 text-white border-0 text-xs">Хост</Badge>
              </div>
            </div>
          ) : (
            /* Students see the host's video in the main tile */
            <VideoTile
              stream={hostStream}
              name={hostName}
              isLarge
              role="HOST"
              isMuted={!hostParticipant?.micEnabled}
            />
          )}
        </div>

        {/* Small tiles — participants sidebar */}
        {smallTiles.length > 0 && (
          <div className="flex lg:flex-col flex-row gap-2 lg:w-48 w-full lg:h-full overflow-x-auto lg:overflow-y-auto lg:overflow-x-visible">
            {smallTiles.map((tile) => (
              <div
                key={tile.userId}
                className="lg:w-full w-36 lg:h-36 h-24 shrink-0 rounded-lg overflow-hidden"
              >
                <VideoTile
                  stream={tile.stream}
                  name={tile.name}
                  isLocal={tile.isLocal}
                  isMuted={!tile.micEnabled}
                  role={tile.role}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state if no participants besides self */}
        {participantList.length <= 1 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-600">
              <Users className="h-12 w-12 mx-auto mb-2" />
              <p>Ожидание участников...</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Controls bar ────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-3">
        <div className="flex items-center justify-center gap-3 flex-wrap">

          {/* Microphone */}
          <button
            onClick={toggleAudio}
            title={isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            <span className="text-xs">{isAudioEnabled ? 'Микрофон' : 'Откл. mic'}</span>
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            title={isVideoEnabled ? 'Выключить камеру' : 'Включить камеру'}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isVideoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            <span className="text-xs">{isVideoEnabled ? 'Камера' : 'Откл. cam'}</span>
          </button>

          {/* Start broadcast — host only, visible when SCHEDULED */}
          {isHost && session?.status === 'SCHEDULED' && (
            <button
              onClick={handleStartBroadcast}
              disabled={isStartingLive}
              title="Начать трансляцию"
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50"
            >
              {isStartingLive ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Radio className="h-5 w-5" />
              )}
              <span className="text-xs">Начать трансляцию</span>
            </button>
          )}

          {/* End session — host only */}
          {isHost ? (
            <button
              onClick={handleEndSession}
              title="Завершить урок"
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <PhoneOff className="h-5 w-5" />
              <span className="text-xs">Завершить</span>
            </button>
          ) : (
            /* Leave session — students */
            <button
              onClick={handleLeave}
              title="Покинуть урок"
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <PhoneOff className="h-5 w-5" />
              <span className="text-xs">Выйти</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
