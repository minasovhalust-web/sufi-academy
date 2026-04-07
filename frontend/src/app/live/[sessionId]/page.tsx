'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { liveApi, storageApi, coursesApi, videosApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mic, MicOff, Video as VideoIcon, VideoOff,
  PhoneOff, Radio, Users, Loader2, AlertCircle,
  MessageCircle, X, ChevronDown,
  Square, Circle,
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

/** Raw participant from session-state (DB shape — names nested inside `user`). */
interface RawParticipant {
  userId: string
  role: string
  micEnabled: boolean
  handRaised: boolean
  user?: { id: string; firstName: string; lastName: string }
  firstName?: string
  lastName?: string
}

/** Normalize a raw participant (from session-state or participant-joined) into flat shape. */
function normalizeParticipant(raw: RawParticipant): Participant {
  return {
    userId: raw.userId ?? raw.user?.id ?? '',
    firstName: raw.firstName ?? raw.user?.firstName ?? '',
    lastName: raw.lastName ?? raw.user?.lastName ?? '',
    role: (raw.role ?? 'STUDENT') as 'HOST' | 'STUDENT',
    micEnabled: raw.micEnabled ?? false,
    handRaised: raw.handRaised ?? false,
  }
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

interface ChatMessage {
  userId: string
  userName: string
  message: string
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
    <div className="relative bg-gray-800 rounded-xl overflow-hidden flex flex-col items-center justify-center w-full h-full gap-2 py-3 min-h-[80px]">
      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
        <span className="text-white font-bold text-base sm:text-xl select-none">{getInitials(name)}</span>
      </div>
      <span className="text-gray-200 text-xs sm:text-sm font-medium truncate max-w-[90%] text-center leading-tight px-1">
        {name}
        {isLocal ? ' (Вы)' : ''}
      </span>
      <div className="flex items-center gap-1">
        {isMuted ? (
          <MicOff className="h-3.5 w-3.5 text-red-400 shrink-0" />
        ) : (
          <Mic className="h-3.5 w-3.5 text-green-400 animate-pulse shrink-0" />
        )}
        <span className="text-[10px] text-gray-400">{isMuted ? 'Откл.' : 'Говорит'}</span>
      </div>
    </div>
  )
}

// ── LiveChatPanel ─────────────────────────────────────────────────────────────

function LiveChatPanel({
  socket,
  sessionId,
  currentUserId,
  currentUserName,
  messages,
}: {
  socket: Socket | null
  sessionId: string
  currentUserId: string
  currentUserName: string
  messages: ChatMessage[]
}) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = draft.trim()
    if (!text || !socket?.connected) return
    socket.emit('live-chat-message', {
      sessionId,
      message: text,
      userName: currentUserName,
    })
    setDraft('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
            <MessageCircle className="h-8 w-8 opacity-40" />
            <p className="text-xs">Напишите первое сообщение</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isOwn = m.userId === currentUserId
            return (
              <div key={i} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-500 mb-0.5">{m.userName}</span>
                <div
                  className={`px-3 py-1.5 rounded-xl text-sm max-w-[85%] break-words ${
                    isOwn
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {m.message}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-2 flex gap-2 shrink-0">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Сообщение..."
          className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500"
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          Отправить
        </button>
      </div>
    </div>
  )
}

// ── ParticipantsPanel — host management view ──────────────────────────────────

function ParticipantsPanel({
  participants,
  currentUserId,
  isHost: isCurrentUserHost,
  onMuteUser,
  onMuteAll,
}: {
  participants: Record<string, Participant>
  currentUserId: string
  isHost: boolean
  onMuteUser: (userId: string) => void
  onMuteAll: () => void
}) {
  const list = Object.values(participants).filter((p) => p.userId !== currentUserId)
  const students = list.filter((p) => p.role === 'STUDENT')

  return (
    <div className="flex flex-col h-full">
      {/* Mute-all button for host */}
      {isCurrentUserHost && students.length > 0 && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <button
            onClick={onMuteAll}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 text-xs font-medium transition-colors"
          >
            <MicOff className="h-3.5 w-3.5" />
            Заглушить всех студентов
          </button>
        </div>
      )}

      {/* Participants list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
            <Users className="h-8 w-8 opacity-40" />
            <p className="text-xs">Нет участников</p>
          </div>
        ) : (
          list.map((p) => (
            <div
              key={p.userId}
              className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-3"
            >
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm select-none">
                  {getInitials(`${p.firstName} ${p.lastName}`)}
                </span>
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-base font-semibold truncate leading-tight">
                  {p.firstName} {p.lastName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-gray-400 text-xs">
                    {p.role === 'HOST' ? 'Хост' : 'Студент'}
                  </span>
                  {p.handRaised && (
                    <span className="text-yellow-400 text-xs font-medium animate-pulse">
                      &#9995; Рука поднята
                    </span>
                  )}
                </div>
              </div>

              {/* Mic status + mute button */}
              <div className="flex items-center gap-1.5 shrink-0">
                {p.micEnabled ? (
                  <Mic className="h-4 w-4 text-green-400" />
                ) : (
                  <MicOff className="h-4 w-4 text-gray-500" />
                )}
                {/* Host can mute any student */}
                {isCurrentUserHost && p.role === 'STUDENT' && p.micEnabled && (
                  <button
                    onClick={() => onMuteUser(p.userId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors bg-red-600/30 hover:bg-red-600/50 text-red-300"
                  >
                    <MicOff className="h-3.5 w-3.5" />
                    <span>Заглушить</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
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
  const [isAudioEnabled, setIsAudioEnabled] = useState(true) // everyone starts with mic on
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)

  // ── Session / UI state ─────────────────────────────────────────────────────
  const [session, setSession] = useState<LiveSession | null>(null)
  const [participants, setParticipants] = useState<Record<string, Participant>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStartingLive, setIsStartingLive] = useState(false)

  // ── Sidebar (desktop) ───────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chat')

  // ── Mobile drawer ─────────────────────────────────────────────────────────
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileDrawerTab, setMobileDrawerTab] = useState<SidebarTab>('chat')

  // ── Chat (state lives here so messages survive sidebar open/close) ────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

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
  const sessionRef = useRef<LiveSession | null>(null)

  useEffect(() => { userIdRef.current = user?.id }, [user?.id])
  useEffect(() => { sessionRef.current = session }, [session])

  // ── isHost — update ref whenever it changes ────────────────────────────────
  const isHost = !!(user?.id && session?.hostId && user.id === session.hostId)
  useEffect(() => { isHostRef.current = isHost }, [isHost])

  // ── Create peer connection for a remote user ───────────────────────────────
  const createPeer = useCallback((targetUserId: string): RTCPeerConnection => {
    if (peersRef.current[targetUserId]) {
      peersRef.current[targetUserId].close()
    }

    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current })

    // Add ALL tracks (video + audio) for both host and student.
    // Student's audio track is disabled but present — this ensures it's in the
    // SDP from the start. On mic-granted we just flip track.enabled = true,
    // no renegotiation needed.
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

    // Auto-renegotiate when tracks change (e.g. mic grant/revoke toggling enabled)
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socketRef.current?.emit('webrtc-signal', {
          sessionId: sessionIdRef.current,
          targetUserId,
          signal: { type: 'offer', sdp: offer.sdp },
        })
      } catch (e) {
        console.error('[webrtc] onnegotiationneeded failed for', targetUserId, e)
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

  // ── Stable ref for router (avoids stale closures) ──────────────────────────
  const routerRef = useRef(router)
  useEffect(() => { routerRef.current = router }, [router])

  // ── Main initialization effect ─────────────────────────────────────────────
  // Runs ONCE on mount (empty deps). All mutable values accessed via refs to
  // avoid stale closures and prevent listener duplication on re-renders.
  // accessToken is read from a ref so the effect doesn't re-run on token refresh.
  const accessTokenRef = useRef(accessToken)
  useEffect(() => { accessTokenRef.current = accessToken }, [accessToken])

  useEffect(() => {
    const token = accessTokenRef.current
    if (!token) {
      routerRef.current.push('/auth/login')
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
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        } catch {
          stream = new MediaStream()
        }
      }

      if (aborted) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      localStreamRef.current = stream
      setLocalStream(stream)

      // Audio enabled by default for everyone — anyone can speak
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) audioTrack.enabled = true
      setIsAudioEnabled(true)

      // 3. Connect WebSocket — single connection for entire session lifetime
      socket = io(`${WS_URL}/live`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
      })
      socketRef.current = socket

      // ── Register ALL event handlers once on this socket instance ────────
      // Using named functions so each .on() is unique and .off() is precise.

      function onConnect() {
        if (aborted) return
        setIsConnected(true)
        socket!.emit('join-session', { sessionId: sessionIdRef.current })
        setIsInitializing(false)
      }

      function onConnectError() {
        if (!aborted) setError('Не удалось подключиться к серверу')
        setIsInitializing(false)
      }

      function onDisconnect() {
        if (!aborted) setIsConnected(false)
      }

      function onException(data: { message: string }) {
        if (!aborted) setError(data.message)
      }

      async function onSessionState(state: SessionStatePayload) {
        if (aborted) return
        setSession(state.session)

        const map: Record<string, Participant> = {}
        for (const raw of state.participants as unknown as RawParticipant[]) {
          const p = normalizeParticipant(raw)
          map[p.userId] = p
        }
        setParticipants(map)

        const currentlyHost =
          !!userIdRef.current &&
          !!state.session.hostId &&
          userIdRef.current === state.session.hostId
        if (currentlyHost) {
          isHostRef.current = true
        }

        for (const p of state.participants) {
          if (p.userId === userIdRef.current) continue
          try {
            const pc = createPeer(p.userId)
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            socket!.emit('webrtc-signal', {
              sessionId: sessionIdRef.current,
              targetUserId: p.userId,
              signal: { type: 'offer', sdp: offer.sdp },
            })
          } catch (e) {
            console.error('[webrtc] Failed to create offer to', p.userId, e)
          }
        }
      }

      function onParticipantJoined(data: RawParticipant) {
        if (aborted) return
        const p = normalizeParticipant(data)
        setParticipants((prev) => ({ ...prev, [p.userId]: p }))
      }

      function onParticipantLeft(data: { userId: string }) {
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
      }

      async function onWebRtcSignal(data: IncomingSignal) {
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
              sessionId: sessionIdRef.current,
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
      }

      function onMicGranted(data: { userId: string }) {
        if (aborted) return
        if (data.userId !== userIdRef.current) return

        toast.success('Микрофон включён преподавателем', { duration: 4000 })

        const audioTrack = localStreamRef.current?.getAudioTracks()[0]
        if (audioTrack) audioTrack.enabled = true
        setIsAudioEnabled(true)
      }

      function onMicRevoked(data: { userId: string }) {
        if (aborted) return
        if (data.userId !== userIdRef.current) return

        toast.info('Преподаватель отключил ваш микрофон', { duration: 4000 })

        const audioTrack = localStreamRef.current?.getAudioTracks()[0]
        if (audioTrack) audioTrack.enabled = false
        setIsAudioEnabled(false)
      }

      function onMicStateChanged(data: { userId: string; micEnabled?: boolean }) {
        if (aborted) return
        setParticipants((prev) => {
          if (!prev[data.userId]) return prev
          const micEnabled = data.micEnabled ?? !prev[data.userId].micEnabled
          return { ...prev, [data.userId]: { ...prev[data.userId], micEnabled, handRaised: false } }
        })
      }

      function onChatMessage(msg: ChatMessage) {
        if (!aborted) setChatMessages((prev) => [...prev, msg])
      }

      function onSessionEnded() {
        if (aborted) return
        localStreamRef.current?.getTracks().forEach((t) => t.stop())
        Object.values(peersRef.current).forEach((pc) => pc.close())
        peersRef.current = {}
        socket?.disconnect()
        const courseId = sessionRef.current?.courseId
        routerRef.current.push(courseId ? `/learn/${courseId}` : '/dashboard')
      }

      // Bind all listeners
      socket.on('connect', onConnect)
      socket.on('connect_error', onConnectError)
      socket.on('disconnect', onDisconnect)
      socket.on('exception', onException)
      socket.on('session-state', onSessionState)
      socket.on('participant-joined', onParticipantJoined)
      socket.on('participant-left', onParticipantLeft)
      socket.on('webrtc-signal', onWebRtcSignal)
      socket.on('mic-granted', onMicGranted)
      socket.on('mic-revoked', onMicRevoked)
      socket.on('mic-state-changed', onMicStateChanged)
      socket.on('live-chat-message', onChatMessage)
      socket.on('session-ended', onSessionEnded)
    }

    initialize()

    return () => {
      aborted = true
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      Object.values(peersRef.current).forEach((pc) => pc.close())
      peersRef.current = {}
      if (socket) {
        socket.emit('leave-session', { sessionId: sessionIdRef.current })
        // Remove all listeners before disconnect to prevent ghost handlers
        socket.removeAllListeners()
        socket.disconnect()
      }
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Controls ───────────────────────────────────────────────────────────────

  const toggleAudio = () => {
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

  // ── Host: mute student mic ─────────────────────────────────────────────────

  const handleMuteUser = (userId: string) => {
    socketRef.current?.emit('revoke-mic', { sessionId, targetUserId: userId })
    setParticipants((prev) =>
      prev[userId] ? { ...prev, [userId]: { ...prev[userId], micEnabled: false } } : prev
    )
  }

  const handleMuteAll = () => {
    const students = Object.values(participants).filter(
      (p) => p.role === 'STUDENT' && p.userId !== user?.id
    )
    for (const s of students) {
      socketRef.current?.emit('revoke-mic', { sessionId, targetUserId: s.userId })
    }
    setParticipants((prev) => {
      const next = { ...prev }
      for (const s of students) {
        if (next[s.userId]) {
          next[s.userId] = { ...next[s.userId], micEnabled: false }
        }
      }
      return next
    })
  }

  // ── Recording (host only) ──────────────────────────────────────────────────

  const handleStartRecording = () => {
    if (!localStreamRef.current) return
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4'

    try {
      // Build a combined stream: local video + local audio (force-enabled for recording).
      // This ensures the recording always captures audio even if the track was toggled off in UI.
      const recordingStream = new MediaStream()

      // Add all video tracks from local stream
      for (const vt of localStreamRef.current.getVideoTracks()) {
        recordingStream.addTrack(vt)
      }

      // Add local audio — temporarily enable so MediaRecorder captures it
      for (const at of localStreamRef.current.getAudioTracks()) {
        at.enabled = true
        recordingStream.addTrack(at)
      }
      setIsAudioEnabled(true)

      const recorder = new MediaRecorder(recordingStream, { mimeType })
      recordedChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        setIsUploadingRecording(true)
        const chunks = [...recordedChunksRef.current]
        recordedChunksRef.current = []
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const dateStr = new Date().toLocaleDateString('ru-RU')
        const filename = `live-recording-${sessionId}.${ext}`
        const title = `Запись эфира ${dateStr}`
        const courseId = session?.courseId

        try {
          const blob = new Blob(chunks, { type: mimeType })
          const file = new File([blob], filename, { type: mimeType })

          // 1. Upload to storage
          const uploadRes = await storageApi.upload(file)
          const uploadData = uploadRes.data?.data ?? uploadRes.data
          const storageKey: string =
            (uploadData as { url?: string })?.url ??
            (uploadData as { key?: string })?.key ??
            ''

          // 2. Create module + lesson + video if courseId is available
          if (courseId && storageKey) {
            try {
              // Create a new module for the recording
              const modRes = await coursesApi.createModule(courseId, {
                title: `Запись эфира ${dateStr}`,
              })
              const mod = modRes.data?.data ?? modRes.data
              const moduleId: string = (mod as { id: string }).id

              // Create a lesson inside the module
              const lessonRes = await coursesApi.createLesson(courseId, moduleId, {
                title,
              })
              const lesson = lessonRes.data?.data ?? lessonRes.data
              const lessonId: string = (lesson as { id: string }).id

              // Attach the video to the lesson
              await videosApi.create({
                title,
                lessonId,
                storageKey,
                mimeType,
                duration: 0,
              })

              toast.success('Запись сохранена как новый урок', {
                description: `${title} — добавлен в курс`,
                duration: 10000,
              })
            } catch (lessonErr) {
              console.error('[recording] Failed to create lesson:', lessonErr)
              // Upload succeeded but lesson creation failed — still inform user
              toast.success('Запись загружена', {
                description: 'Не удалось автоматически создать урок. Файл сохранён в хранилище.',
                duration: 10000,
              })
            }
          } else {
            toast.success('Запись загружена', {
              description: title,
              duration: 10000,
            })
          }
        } catch (uploadErr) {
          console.error('[recording] Upload failed, falling back to local download:', uploadErr)
          // Fallback: trigger browser download directly from memory
          try {
            const blob = new Blob(chunks, { type: mimeType })
            const objectUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = objectUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000)
            toast.success('Запись скачивается...', { description: title })
          } catch {
            toast.error('Не удалось сохранить запись')
          }
        } finally {
          setIsUploadingRecording(false)
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
      name: p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : (p.role === 'HOST' ? 'Преподаватель' : 'Студент'),
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
      <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center">
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
      <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center">
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
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-hidden">

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
          {/* Sidebar toggle — desktop only */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden sm:flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
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
      <div className="relative flex flex-1 overflow-hidden">

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

        {/* ── Desktop sidebar (hidden on mobile) ─────────────────────────── */}
        {sidebarOpen && (
          <div className="hidden sm:flex relative w-72 lg:w-80 bg-gray-900 border-l border-gray-800 flex-col shrink-0">
            {/* Sidebar tabs */}
            <div className="flex border-b border-gray-800 shrink-0">
              <button
                onClick={() => setSidebarTab('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                  sidebarTab === 'chat'
                    ? 'text-white border-b-2 border-indigo-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Чат
              </button>
              <button
                onClick={() => setSidebarTab('participants')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                  sidebarTab === 'participants'
                    ? 'text-white border-b-2 border-indigo-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Участники ({Object.keys(participants).length})
              </button>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-hidden">
              {sidebarTab === 'chat' ? (
                <LiveChatPanel
                  socket={socketRef.current}
                  sessionId={sessionId}
                  currentUserId={user?.id ?? ''}
                  currentUserName={user ? `${user.firstName} ${user.lastName}` : ''}
                  messages={chatMessages}
                />
              ) : (
                <ParticipantsPanel
                  participants={participants}
                  currentUserId={user?.id ?? ''}
                  isHost={isHost}
                  onMuteUser={handleMuteUser}
                  onMuteAll={handleMuteAll}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Controls bar ───────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border-t border-gray-800 px-3 py-2 sm:px-4 sm:py-2.5 shrink-0 safe-area-bottom">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">

          {/* Microphone — available for everyone */}
          <button
            onClick={toggleAudio}
            title={isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
            className={`flex flex-col items-center gap-1 rounded-xl transition-colors min-w-[52px] min-h-[52px] sm:min-w-[56px] sm:min-h-[56px] justify-center px-2 ${
              isAudioEnabled
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
              className={`flex flex-col items-center gap-1 rounded-xl transition-colors min-w-[52px] min-h-[52px] sm:min-w-[56px] sm:min-h-[56px] justify-center px-2 ${
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
              className="flex flex-col items-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 min-w-[52px] min-h-[52px] sm:min-w-[56px] sm:min-h-[56px] justify-center px-2"
            >
              {isStartingLive ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Radio className="h-5 w-5" />
              )}
              <span className="text-[10px] leading-none">Эфир</span>
            </button>
          )}

          {/* Recording — host only */}
          {isHost && (
            isRecording ? (
              <button
                onClick={handleStopRecording}
                disabled={isUploadingRecording}
                className="relative flex flex-col items-center gap-1 rounded-xl bg-red-700 hover:bg-red-800 text-white transition-colors min-w-[52px] min-h-[52px] sm:min-w-[56px] sm:min-h-[56px] justify-center px-2"
                title="Остановить запись"
              >
                {isUploadingRecording ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Square className="h-5 w-5 fill-current" />
                )}
                <span className="text-[10px] leading-none">
                  {isUploadingRecording ? 'Сохр...' : 'Стоп'}
                </span>
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              </button>
            ) : (
              <button
                onClick={handleStartRecording}
                className="flex flex-col items-center gap-1 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-colors min-w-[52px] min-h-[52px] sm:min-w-[56px] sm:min-h-[56px] justify-center px-2"
                title="Начать запись"
              >
                <Circle className="h-5 w-5 text-red-400" />
                <span className="text-[10px] leading-none">Запись</span>
              </button>
            )
          )}

          {/* Separator */}
          <div className="w-px h-8 bg-gray-700 mx-0.5 sm:mx-1" />

          {/* Mobile: Chat button */}
          <button
            onClick={() => { setMobileDrawerTab('chat'); setMobileDrawerOpen(true) }}
            className="sm:hidden flex flex-col items-center gap-1 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-colors min-w-[52px] min-h-[52px] justify-center px-2"
            title="Чат"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-[10px] leading-none">Чат</span>
          </button>

          {/* Mobile: Participants button */}
          <button
            onClick={() => { setMobileDrawerTab('participants'); setMobileDrawerOpen(true) }}
            className="sm:hidden flex flex-col items-center gap-1 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-colors min-w-[52px] min-h-[52px] justify-center px-2"
            title="Участники"
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] leading-none">
              {Object.keys(participants).length}
            </span>
          </button>

          {/* Separator (mobile) */}
          <div className="sm:hidden w-px h-8 bg-gray-700 mx-0.5" />

          {/* End / Leave */}
          {isHost ? (
            <button
              onClick={handleEndSession}
              className="flex flex-col items-center gap-1 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors min-w-[52px] min-h-[52px] sm:min-w-[56px] sm:min-h-[56px] justify-center px-2"
              title="Завершить трансляцию"
            >
              <PhoneOff className="h-5 w-5" />
              <span className="text-[10px] leading-none">Завершить</span>
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="flex flex-col items-center gap-1 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors min-w-[52px] min-h-[52px] sm:min-w-[56px] sm:min-h-[56px] justify-center px-2"
              title="Покинуть"
            >
              <PhoneOff className="h-5 w-5" />
              <span className="text-[10px] leading-none">Покинуть</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile bottom drawer ─────────────────────────────────────────── */}
      {mobileDrawerOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer panel — 70% height */}
          <div className="relative bg-gray-900 rounded-t-2xl flex flex-col" style={{ height: '70vh' }}>
            {/* Handle + header */}
            <div className="flex flex-col items-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-600 mb-2" />
              <div className="flex w-full border-b border-gray-800">
                <button
                  onClick={() => setMobileDrawerTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                    mobileDrawerTab === 'chat'
                      ? 'text-white border-b-2 border-indigo-500'
                      : 'text-gray-400'
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Чат
                </button>
                <button
                  onClick={() => setMobileDrawerTab('participants')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                    mobileDrawerTab === 'participants'
                      ? 'text-white border-b-2 border-indigo-500'
                      : 'text-gray-400'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Участники ({Object.keys(participants).length})
                </button>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-center px-4 text-gray-400 hover:text-white"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer content */}
            <div className="flex-1 overflow-hidden">
              {mobileDrawerTab === 'chat' ? (
                <LiveChatPanel
                  socket={socketRef.current}
                  sessionId={sessionId}
                  currentUserId={user?.id ?? ''}
                  currentUserName={user ? `${user.firstName} ${user.lastName}` : ''}
                  messages={chatMessages}
                />
              ) : (
                <ParticipantsPanel
                  participants={participants}
                  currentUserId={user?.id ?? ''}
                  isHost={isHost}
                  onMuteUser={handleMuteUser}
                  onMuteAll={handleMuteAll}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
