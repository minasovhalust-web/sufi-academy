import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { directMessagesApi } from '@/lib/api'
import type { Conversation, DirectMessage } from '@/types'
import { toast } from 'sonner'

// Backend wraps every response as { success, data, timestamp }
// Actual payload lives at response.data.data

export function useConversations() {
  return useQuery({
    queryKey: ['dm', 'conversations'],
    queryFn: async () => {
      const res = await directMessagesApi.getConversations()
      return res.data.data as Conversation[]
    },
    refetchInterval: 10_000, // poll every 10 s for new conversations
  })
}

export function useDirectMessages(userId: string) {
  return useQuery({
    queryKey: ['dm', 'messages', userId],
    queryFn: async () => {
      const res = await directMessagesApi.getMessages(userId, { limit: 100 })
      return res.data.data as DirectMessage[]
    },
    enabled: !!userId,
    refetchInterval: 4_000, // poll every 4 s for new messages
  })
}

export function useSendDirectMessage(partnerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await directMessagesApi.sendMessage(partnerId, content)
      return res.data.data as DirectMessage
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm', 'messages', partnerId] })
      queryClient.invalidateQueries({ queryKey: ['dm', 'conversations'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Не удалось отправить сообщение')
    },
  })
}
