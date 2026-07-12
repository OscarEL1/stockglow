import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import type { QueryClient } from '@tanstack/react-query'

const MAX_RETRIES = 5
const RETRY_DELAY_MS = 3000

export function useStockWebSocket(
  tenantId: string | null,
  queryClient: QueryClient
) {
  const { getToken } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!tenantId) return

    let cancelled = false
    let retries = 0
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      ;(async () => {
        if (cancelled) return

        try {
          const token = await getToken()
          if (!token || cancelled) return

          const wsBase = (import.meta.env.VITE_API_URL as string)
            .replace('https://', 'wss://')
            .replace('http://', 'ws://')
          const url = new URL(`${wsBase}/api/v1/ws/${tenantId}`)
          url.searchParams.set('token', token)
          const ws = new WebSocket(url.toString())
          wsRef.current = ws

          ws.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data) as {
                event: string
                data: unknown
              }
              if (msg.event === 'stock:update') {
                queryClient.invalidateQueries({ queryKey: ['variants'] })
                queryClient.invalidateQueries({ queryKey: ['alerts'] })
                queryClient.invalidateQueries({
                  queryKey: ['dashboard-summary'],
                })
              }
            } catch {
              // ignore malformed messages
            }
          }

          ws.onclose = () => {
            if (cancelled) return
            if (retries < MAX_RETRIES) {
              retries += 1
              retryTimer = setTimeout(connect, RETRY_DELAY_MS)
            }
          }

          ws.onerror = () => {
            ws.close()
          }
        } catch {
          if (!cancelled && retries < MAX_RETRIES) {
            retries += 1
            retryTimer = setTimeout(connect, RETRY_DELAY_MS)
          }
        }
      })()
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [tenantId, queryClient, getToken])
}
