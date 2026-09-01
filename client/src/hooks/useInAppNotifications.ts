import { useCallback, useEffect, useRef, useState } from 'react'
import {
  notificationApi,
  resolveNotificationStreamUrl,
} from '@/api/notifications'
import { useAuthStore } from '@/stores/authStore'
import type {
  InAppNotificationDto,
  NotificationKind,
} from '@/types/dto/notifications.dto'

type NotificationState = {
  items: InAppNotificationDto[]
  unreadCount: number
  loading: boolean
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
      const [summary, items] = await Promise.all([
        notificationApi.summary(),
        notificationApi.list(limit),
      ])
      if (requestId.current === currentRequest) {
        setState({ items, unreadCount: summary.unreadCount, loading: false })
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

  const markRead = useCallback(async (pengajuanEvaluasiId: string, jenis: NotificationKind) => {
    const summary = await notificationApi.markRead(pengajuanEvaluasiId, jenis)
    const readAt = new Date().toISOString()
    setState((current) => ({
      ...current,
      unreadCount: summary.unreadCount,
      items: current.items.map((item) =>
        item.pengajuanEvaluasiId === pengajuanEvaluasiId && item.jenis === jenis
          ? { ...item, readAt: item.readAt ?? readAt }
          : item,
      ),
    }))
  }, [])

  const markAllRead = useCallback(async () => {
    const summary = await notificationApi.markAllRead()
    const readAt = new Date().toISOString()
    setState((current) => ({
      ...current,
      unreadCount: summary.unreadCount,
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
