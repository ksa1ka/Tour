import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useAuth } from '@/context/AuthContext'
import { getSocket } from '@/services/socket'

/**
 * Поддерживает актуальными данные аккаунта при пересчёте fantasy на сервере:
 * баланс FP в магазине и блок fantasy на профиле — без перезагрузки страницы.
 * Сервер дублирует `fantasy:updated` в персональную комнату `user:{id}`.
 */
export function useAccountFantasyQuerySync() {
  const { accessToken, user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!accessToken || !user?.id) return

    const socket = getSocket(accessToken)
    if (!socket) return

    const onFantasyUpdated = () => {
      void queryClient.invalidateQueries({ queryKey: ['fantasy-shop', 'me'] })
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    }

    if (!socket.connected) {
      socket.connect()
    }

    socket.on('fantasy:updated', onFantasyUpdated)

    return () => {
      socket.off('fantasy:updated', onFantasyUpdated)
    }
  }, [accessToken, user?.id, queryClient])
}
