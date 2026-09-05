import { useCallback, useEffect, useRef, useState } from 'react'
import {
  notificationApi,
  resolveNotificationStreamUrl,
} from '@/api/notifications'
import { useAuthStore } from '@/stores/authStore'
import type { NotificationItem } from '@/types/dto/notifications.dto'

type NotificationState = {
  items: NotificationItem[]
  unreadCount: number
  loading: boolean
}

function sortNotifications(items: NotificationItem[], limit: number): NotificationItem[] {
  return items
    .sort((a, b) => {
      if (a.readAt === null && b.readAt !== null) return -1
      if (a.readAt !== null && b.readAt === null) return 1
      return Date.parse(b.createdAt) - Date.parse(a.createdAt)
    })
    .slice(0, limit)
}

export function useInAppNotifications(limit = 10) {
  const userId = useAuthStore((state) => state.user?.id)
  const [state, setState] = useState<NotificationState>({
    items: [],
    unreadCount: 0,
    loading: false,
  })
  const requestId = useRef(0)

  const reload = useCallback(async () => {
    if (!userId) {
      setState({ items: [], unreadCount: 0, loading: false })
      return
    }
    const currentRequest = requestId.current + 1
    requestId.current = currentRequest
    setState((current) => ({ ...current, loading: true }))
    try {
      const [processSummary, processItems] = await Promise.all([
        notificationApi.processSummary(),
        notificationApi.processList(limit),
      ])
      if (requestId.current === currentRequest) {
        const items = sortNotifications(
          processItems.map((item) => ({ ...item, source: 'PROCESS' as const })),
          limit,
        )
        setState({
          items,
          unreadCount: processSummary.unreadCount,
          loading: false,
        })
      }
    } catch {
      if (requestId.current === currentRequest) {
        setState((current) => ({ ...current, loading: false }))
      }
    }
  }, [limit, userId])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!userId || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return
    }
    const events = new EventSource(resolveNotificationStreamUrl(), { withCredentials: true })
    const handleChanged = () => void reload()
    events.addEventListener('notifications.changed', handleChanged)
    return () => {
      events.removeEventListener('notifications.changed', handleChanged)
      events.close()
    }
  }, [reload, userId])

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return
    const handleFocus = () => void reload()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [reload, userId])

  const markRead = useCallback(async (item: NotificationItem) => {
    if (item.readAt) return
    await notificationApi.markProcessRead(item.processNotificationId)
    const readAt = new Date().toISOString()
    setState((current) => ({
      ...current,
      unreadCount: Math.max(0, current.unreadCount - 1),
      items: current.items.map((candidate) => {
        const matches = candidate.processNotificationId === item.processNotificationId
        return matches ? { ...candidate, readAt } : candidate
      }),
    }))
  }, [])

  const markAllRead = useCallback(async () => {
    await notificationApi.markAllProcessRead()
    const readAt = new Date().toISOString()
    setState((current) => ({
      ...current,
      unreadCount: 0,
      items: current.items.map((item) => ({ ...item, readAt: item.readAt ?? readAt })),
    }))
  }, [])

  return {
    ...state,
    reload,
    markRead,
    markAllRead,
  }
}
