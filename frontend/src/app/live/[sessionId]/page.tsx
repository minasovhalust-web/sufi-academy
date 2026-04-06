'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { liveApi, storageApi, apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mic, MicOff, Video as VideoIcon, VideoOff,
  PhoneOff, Radio, Users, Loader2, AlertCircle,
  MessageCircle, Send, CheckCircle2, X,
  UserCheck, Square, Circle,
} from 'lucide-react'
import type { LiveSession } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface LiveChatMessage {
  id: string
  userId: string
  name: string
  content: string
  timestamp: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WS_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace('/api/v1', '')

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

// ── VideoTile — host with camera ──────────────────────────────────────────────

function VideoTile({
  stream,
  name,
  isLocal = false,
  isMuted = false,
}: {
  stream: MediaStream | null
  name: string
  isLocal?: boolean
  isMuted?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center w-full h-full">
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
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="text-white text-xs bg-black/60 px-2 py-0.5 rounded-full">
          {name}
          {isLocal ? ' (Вы)' : ''}
        </span>
        <Badge className="text-xs h-5 bg-amber-500/80 text-white border-0">Хост</Badge>
        {isMuted && <MicOff className="h-3.5 w-3.5 text-red-400" />}
      </div>
    </div>
  )
}

// ── AudioOnlyTile — student without camera ────────────────────────────────────

function AudioOnlyTile({
  name,
  isMuted = true,
  isLocal = false,
}: {
  name: string
  isMuted?: boolean
  isLocal?: boolean
}) {
  return (
    <div className="relative bg-gray-800 rounded-xl overflow-hidden flex flex-col items-center justify-center w-full h-full gap-3 py-4">
      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-xl select-none">{getInitials(name)}</span>
      </div>
      <span className="text-gray-200 text-sm font-medium">
        {name}
        {isLocal ? ' (Вы)' : ''}
      </span>
      <div className="flex items-center gap-1.5">
        {isMuted ? (
          <MicOff className="h-4 w-4 text-red-400" />
        ) : (
          <Mic className="h-4 w-4 text-green-400 animate-pulse" />
        )}
        <span className="text-xs text-gray-400">{isMuted ? 'Откл.' : 'Говорит'}</span>
      </div>
    </div>
  )
}

// ── LiveChatPanel ─────────────────────────────────────────────────────────────

function LiveChatPanel({
  messages,
  chatInput,
  onInputChange,
  onSend,
  currentUserId,
}: {
  messages: LiveChatMessage[]
  chatInput: string
  onInputChange: (v: string) => void
  onSend: () => void
  currentUserId: string
}) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
            <MessageCircle className="h-8 w-8 opacity-40" />
            <p className="text-xs">Чат пуст</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === currentUserId
            return (
              <div key={msg.id} className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && (
                  <span className="text-[10px] text-gray-400 px-1">{msg.name}</span>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    isOwn
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-gray-700 text-gray-100 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-500 px-1">{formatTime(msg.timestamp)}</span>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-2 flex gap-2">
        <input
          value={chatInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder="Написать..."
          className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 min-w-0"
        />
        <button
          onClick={onSend}
          disabled={!chatInput.trim()}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── ParticipantsPanel — host management view ──────────────────────────────────

function ParticipantsPanel({
  participants,
  currentUserId,
  onAllowSpeak,
  onRevokeSpeak,
}: {
  participants: Record<string, Participant>
  currentUserId: string
  onAllowSpeak: (userId: string) => void
  onRevokeSpeak: (userId: string) => void
}) {
  const list = Object.values(participants).filter((p) => p.userId !== currentUserId)

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-2">
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
          <Users className="h-8 w-8 opacity-40" />
          <p className="text-xs">Нет участников</p>
        </div>
      ) : (
        list.map((p) => (
          <div
            key={p.userId}
            className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2"
          >
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-xs select-none">
                {getInitials(`${p.firstName} ${p.lastName}`)}
              </span>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {p.firstName} {p.lastName}
              </p>
              <p className="text-gray-400 text-[10px]">
                {p.role === 'HOST' ? 'Хост' : 'Студент'}
              </p>
            </div>

            {/* Mic status + control button (students only) */}
            {p.role === 'STUDENT' && (
              <div className="flex items-center gap-1 shrink-0">
                {p.micEnabled ? (
                  <Mic className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <MicOff className="h-3.5 w-3.5 text-gray-500" />
                )}
                <button
                  onClick={() =>
                    p.micEnabled ? onRevokeSpeak(p.userId) : onAllowSpeak(p.userId)
                  }
                  title={p.micEnabled ? 'Отключить микрофон' : 'Разрешить говорить'}
                  className={`p-1 rounded-md text-xs transition-colors ${
                    p.micEnabled
                      ? 'bg-red-600/30 hover:bg-red-600/50 text-red-300'
                      : 'bg-green-600/30 hover:bg-green-600/50 text-green-300'
                  }`}
                >
                  {p.micEnabled ? (
                    <MicOff className="h-3.5 w-3.5" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type SidebarTab = 'chat' | 'participants'

export default function LiveSessionPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params
  const router = useRouter()
  const { user, accessToken } = useAuthStore()

  // ── Media state ────────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [isAudioEnabled, setIsAudioEnabled] = useState(false) // students start muted
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  // Whether the host has granted mic permission to this student
  const [micAllowedByHost, setMicAllowedByHost] = useState(false)

  // ── Session / UI state ─────────────────────────────────────────────────────
  const [session, setSession] = useState<LiveSession | null>(null)
  const [participants, setParticipants] = useState<Record<string, Participant>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStartingLive, setIsStartingLive] = useState(false)

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chat')

  // ── Live chat ──────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')

  // ── Recording ──────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false)
  const [isUploadingRecording, setIsUploadingRecording] = useState(false)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const localStreamRef = useRef<MediaStream | null>(null)
  const iceServersRef = useRef<RTCIceServer[]>([{ urls: 'stun:stun.l.google.com:19302' }])
  const sessionIdRef = useRef(sessionId)
  const userIdRef = useRef(user?.id)
  const isHostRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  useEffect(() => { userIdRef.current = user?.id }, [user?.id])

  // ── isHost — update ref whenever it changes ────────────────────────────────
  const isHost = !!(user?.id && session?.hostId && user.id === session.hostId)
  useEffect(() => { isHostRef.current = isHost }, [isHost])

  // ── Create peer connection for a remote user ───────────────────────────────
  const createPeer = useCallback((targetUserId: string): RTCPeerConnection => {
    if (peersRef.current[targetUserId]) {
      peersRef.current[targetUserId].close()
    }

    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current })

    // Add local tracks (audio only for students, video+audio for host)
    const stream = localStreamRef.current
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.connected) {
        socketRef.current.emit('webrtc-signal', {
          sessionId: sessionIdRef.current,
          targetUserId,
          signal: { type: 'candidate', candidate: event.candidate.toJSON() },
        })
      }
    }

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (remoteStream) {
        setRemoteStreams((prev) => ({ ...prev, [targetUserId]: remoteStream }))
      }
    }

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setRemoteStreams((prev) => {
          const next = { ...prev }
          delete next[targetUserId]
          return next
        })
      }
    }

    peersRef.current[targetUserId] = pc
    return pc
  }, [])

  // ── Main initialization effect ─────────────────────────────────────────────
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
        // Fallback to public STUN
      }

      // 2. Acquire local media
      // We don't know isHost yet (session data hasn't loaded), so we initially
      // try to get full media and then re-evaluate. But since getUserMedia is
      // called before the WS connects, we grab audio-only for now and upgrade
      // the host track after session-state arrives.
      // Simpler approach: always request audio; host requests video in addition.
      // We do this by attempting video+audio; if denied/unavailable use audio only.
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch {
        // Fall back to audio-only (e.g. no camera, or student device)
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        } catch (err: unknown) {
          const msg =
            err instanceof Error && err.name === 'NotAllowedError'
              ? 'Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.'
              : 'Не удалось получить доступ к микрофону.'
          setError(msg)
          setIsInitializing(false)
          return
        }
      }

      if (aborted) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      localStreamRef.current = stream
      setLocalStream(stream)

      // Mute audio track by default — host will grant permission
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) audioTrack.enabled = false
      setIsAudioEnabled(false)

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

      // ── Session state ────────────────────────────────────────────────────
      socket.on('session-state', async (state: SessionStatePayload) => {
        if (aborted) return
        setSession(state.session)

        const map: Record<string, Participant> = {}
        for (const p of state.participants) map[p.userId] = p
        setParticipants(map)

        // Host: keep audio enabled by default
        const currentlyHost =
          !!userIdRef.current &&
          !!state.session.hostId &&
          userIdRef.current === state.session.hostId
        if (currentlyHost) {
          const aTrack = localStreamRef.current?.getAudioTracks()[0]
          if (aTrack) aTrack.enabled = true
          setIsAudioEnabled(true)
          isHostRef.current = true
        }

        // Create WebRTC offers for all existing participants
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

      // ── Participant joined ───────────────────────────────────────────────
      socket.on('participant-joined', (data: Participant) => {
        if (!aborted) {
          setParticipants((prev) => ({ ...prev, [data.userId]: data }))
        }
      })

      // ── Participant left ─────────────────────────────────────────────────
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

      // ── WebRTC signaling ─────────────────────────────────────────────────
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

      // ── Mic events ───────────────────────────────────────────────────────
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

      // ── allow-speak: host grants mic to a student ───────────────────────
      socket.on('allow-speak', (data: { userId: string }) => {
        if (aborted) return
        // If this message is for the current user — enable their mic
        if (data.userId === userIdRef.current) {
          const track = localStreamRef.current?.getAudioTracks()[0]
          if (track) track.enabled = true
          setIsAudioEnabled(true)
          setMicAllowedByHost(true)
        }
        // Update participant list mic state
        setParticipants((prev) =>
          prev[data.userId]
            ? { ...prev, [data.userId]: { ...prev[data.userId], micEnabled: true } }
            : prev
        )
      })

      // ── revoke-speak: host revokes mic ──────────────────────────────────
      socket.on('revoke-speak', (data: { userId: string }) => {
        if (aborted) return
        if (data.userId === userIdRef.current) {
          const track = localStreamRef.current?.getAudioTracks()[0]
          if (track) track.enabled = false
          setIsAudioEnabled(false)
          setMicAllowedByHost(false)
        }
        setParticipants((prev) =>
          prev[data.userId]
            ? { ...prev, [data.userId]: { ...prev[data.userId], micEnabled: false } }
            : prev
        )
      })

      // ── Live chat ────────────────────────────────────────────────────────
      socket.on('live-message', (msg: LiveChatMessage) => {
        if (!aborted) {
          setChatMessages((prev) => [...prev, msg])
        }
      })

      // ── Session ended ────────────────────────────────────────────────────
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

  // ── Controls ───────────────────────────────────────────────────────────────

  const toggleAudio = () => {
    // Students can only toggle if host has allowed them
    if (!isHost && !micAllowedByHost) return
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsAudioEnabled(track.enabled)
    }
  }

  const toggleVideo = () => {
    if (!isHost) return // only host has camera
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

  // ── Host: allow / revoke student mic ──────────────────────────────────────

  const handleAllowSpeak = (userId: string) => {
    socketRef.current?.emit('allow-speak', { sessionId, userId })
    // Optimistic update
    setParticipants((prev) =>
      prev[userId] ? { ...prev, [userId]: { ...prev[userId], micEnabled: true } } : prev
    )
  }

  const handleRevokeSpeak = (userId: string) => {
    socketRef.current?.emit('revoke-speak', { sessionId, userId })
    // Optimistic update
    setParticipants((prev) =>
      prev[userId] ? { ...prev, [userId]: { ...prev[userId], micEnabled: false } } : prev
    )
  }

  // ── Live chat send ────────────────────────────────────────────────────────

  const handleSendChat = () => {
    if (!chatInput.trim() || !socketRef.current?.connected) return
    socketRef.current.emit('live-message', { sessionId, content: chatInput.trim() })
    setChatInput('')
  }

  // ── Recording (host only) ──────────────────────────────────────────────────

  const handleStartRecording = () => {
    if (!localStreamRef.current) return
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4'

    try {
      const recorder = new MediaRecorder(localStreamRef.current, { mimeType })
      recordedChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        setIsUploadingRecording(true)
        try {
          const blob = new Blob(recordedChunksRef.current, { type: mimeType })
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
          const file = new File([blob], `live-recording-${sessionId}.${ext}`, { type: mimeType })

          // Upload to storage
          const uploadRes = await storageApi.upload(file)
          const { url } = uploadRes.data?.data as { url: string }

          // Create video entry in the course
          const title = `Запись эфира: ${session?.title ?? sessionId}`
          await apiClient.post('/videos', {
            title,
            storageKey: url,
            mimeType,
            courseId: session?.courseId,
            description: `Запись прямого эфира от ${new Date().toLocaleDateString('ru-RU')}`,
          })

          toast.success('Запись сохранена в курс', {
            description: title,
            duration: 5000,
          })
        } catch (err) {
          console.error('[recording] Upload failed:', err)
          toast.error('Не удалось сохранить запись')
        } finally {
          setIsUploadingRecording(false)
          recordedChunksRef.current = []
        }
      }

      recorder.start(1000) // collect data every second
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('[recording] Start failed:', err)
      setError('Не удалось начать запись')
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    setIsRecording(false)
  }

  // ── Derived rendering data ─────────────────────────────────────────────────

  const participantList = Object.values(participants)

  // Host tile always first, then students
  type TileData = {
    userId: string
    name: string
    stream: MediaStream | null
    micEnabled: boolean
    role: 'HOST' | 'STUDENT'
    isLocal: boolean
    hasVideo: boolean
  }

  const allTiles: TileData[] = []

  if (user) {
    const selfRole = (participants[user.id]?.role ?? (isHost ? 'HOST' : 'STUDENT')) as 'HOST' | 'STUDENT'
    const hasVideo = isHost && (localStream?.getVideoTracks().length ?? 0) > 0
    allTiles.push({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      stream: localStream,
      micEnabled: isAudioEnabled,
      role: selfRole,
      isLocal: true,
      hasVideo,
    })
  }

  for (const p of participantList) {
    if (p.userId === user?.id) continue
    const remoteStream = remoteStreams[p.userId] ?? null
    const hasVideo = p.role === 'HOST' && (remoteStream?.getVideoTracks().length ?? 0) > 0
    allTiles.push({
      userId: p.userId,
      name: `${p.firstName} ${p.lastName}`,
      stream: remoteStream,
      micEnabled: p.micEnabled,
      role: p.role,
      isLocal: false,
      hasVideo,
    })
  }

  // Host tile first
  allTiles.sort((a, b) => {
    if (a.role === 'HOST') return -1
    if (b.role === 'HOST') return 1
    return 0
  })

  // Grid class based on student count (host is always prominent)
  function getGridClass(count: number): string {
    if (count <= 1) return 'grid-cols-1'
    if (count <= 2) return 'grid-cols-1 sm:grid-cols-2'
    if (count <= 4) return 'grid-cols-2'
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3'
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
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
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            Вернуться на главную
          </Button>
        </div>
      </div>
    )
  }

  // ── Render: Session ───────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-white font-semibold text-sm truncate max-w-[200px] sm:max-w-xs">
            {session?.title ?? 'Живой урок'}
          </h1>
          {session?.status === 'LIVE' && (
            <Badge className="bg-red-600 text-white border-0 flex items-center gap-1 shrink-0">
              <Radio className="h-3 w-3" />
              LIVE
            </Badge>
          )}
          {session?.status === 'SCHEDULED' && (
            <Badge variant="outline" className="border-gray-600 text-gray-400 shrink-0">
              Запланировано
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Users className="h-4 w-4" />
            <span>{allTiles.length}</span>
          </div>
          {!isConnected && (
            <span className="text-yellow-500 text-xs flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Переподключение...
            </span>
          )}
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            title={sidebarOpen ? 'Скрыть панель' : 'Показать панель'}
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && isConnected && (
        <div className="bg-red-900/50 border-b border-red-800 px-4 py-2 flex items-center gap-2 text-red-300 text-sm shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Main area: video grid + sidebar ─────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Video / audio grid ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-2">
          {allTiles.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-600">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Ожидание участников...</p>
              </div>
            </div>
          ) : (
            <div className={`grid gap-2 h-full auto-rows-fr ${getGridClass(allTiles.length)}`}>
              {allTiles.map((tile) => (
                <div
                  key={tile.userId}
                  className={`relative bg-gray-900 rounded-xl overflow-hidden ${
                    tile.role === 'HOST' && allTiles.length > 1
                      ? 'row-span-2 sm:row-span-1'
                      : ''
                  }`}
                >
                  {tile.hasVideo ? (
                    <VideoTile
                      stream={tile.stream}
                      name={tile.name}
                      isLocal={tile.isLocal}
                      isMuted={!tile.micEnabled}
                    />
                  ) : (
                    <AudioOnlyTile
                      name={tile.name}
                      isMuted={!tile.micEnabled}
                      isLocal={tile.isLocal}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        {sidebarOpen && (
          <div className="w-72 lg:w-80 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
            {/* Sidebar tabs */}
            <div className="flex border-b border-gray-800 shrink-0">
              <button
                onClick={() => setSidebarTab('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                  sidebarTab === 'chat'
                    ? 'text-white border-b-2 border-indigo-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Чат
              </button>
              {isHost && (
                <button
                  onClick={() => setSidebarTab('participants')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                    sidebarTab === 'participants'
                      ? 'text-white border-b-2 border-indigo-500'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Участники
                </button>
              )}
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-hidden">
              {sidebarTab === 'chat' ? (
                <LiveChatPanel
                  messages={chatMessages}
                  chatInput={chatInput}
                  onInputChange={setChatInput}
                  onSend={handleSendChat}
                  currentUserId={user?.id ?? ''}
                />
              ) : (
                <ParticipantsPanel
                  participants={participants}
                  currentUserId={user?.id ?? ''}
                  onAllowSpeak={handleAllowSpeak}
                  onRevokeSpeak={handleRevokeSpeak}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Controls bar ───────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2.5 shrink-0">
        <div className="flex items-center justify-center gap-2 flex-wrap">

          {/* Microphone */}
          <button
            onClick={toggleAudio}
            disabled={!isHost && !micAllowedByHost}
            title={
              !isHost && !micAllowedByHost
                ? 'Микрофон заблокирован хостом'
                : isAudioEnabled
                ? 'Выключить микрофон'
                : 'Включить микрофон'
            }
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors min-w-[56px] ${
              !isHost && !micAllowedByHost
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            <span className="text-[10px] leading-none">Микрофон</span>
          </button>

          {/* Camera — host only */}
          {isHost && (
            <button
              onClick={toggleVideo}
              title={isVideoEnabled ? 'Выключить камеру' : 'Включить камеру'}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors min-w-[56px] ${
                isVideoEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isVideoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              <span className="text-[10px] leading-none">Камера</span>
            </button>
          )}

          {/* Start broadcast — host only, when SCHEDULED */}
          {isHost && session?.status === 'SCHEDULED' && (
            <button
              onClick={handleStartBroadcast}
              disabled={isStartingLive}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 min-w-[56px]"
            >
              {isStartingLive ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Radio className="h-5 w-5" />
              )}
              <span className="text-[10px] leading-none">Начать эфир</span>
            </button>
          )}

          {/* Recording — host only */}
          {isHost && (
            isRecording ? (
              <button
                onClick={handleStopRecording}
                disabled={isUploadingRecording}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-700 hover:bg-red-800 text-white transition-colors min-w-[56px] relative"
                title="Остановить запись"
              >
                {isUploadingRecording ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Square className="h-5 w-5 fill-current" />
                )}
                <span className="text-[10px] leading-none">
                  {isUploadingRecording ? 'Сохранение...' : 'Стоп запись'}
                </span>
                {/* Recording indicator dot */}
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              </button>
            ) : (
              <button
                onClick={handleStartRecording}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-colors min-w-[56px]"
                title="Начать запись"
              >
                <Circle className="h-5 w-5 text-red-400" />
                <span className="text-[10px] leading-none">Запись</span>
              </button>
            )
          )}

          {/* Separator */}
          <div className="w-px h-10 bg-gray-700 mx-1" />

          {/* End / Leave */}
          {isHost ? (
            <button
              onClick={handleEndSession}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors min-w-[56px]"
              title="Завершить трансляцию"
            >
              <PhoneOff className="h-5 w-5" />
              <span className="text-[10px] leading-none">Завершить</span>
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors min-w-[56px]"
              title="Покинуть"
            >
              <PhoneOff className="h-5 w-5" />
              <span className="text-[10px] leading-none">Покинуть</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
