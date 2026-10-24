import { useAsync } from './useAsync'
import { messagesApi } from '../api/messages'

export function useConversations() {
  return useAsync(() => messagesApi.getConversations(), [])
}

export function useMessages(conversationId) {
  return useAsync(() => messagesApi.getMessages(conversationId), [conversationId])
}
