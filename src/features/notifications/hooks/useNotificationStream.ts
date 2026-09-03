import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/features/auth/store/authStore"

import {
  NotificationService,
  StreamRefusedError,
} from "../services/notificationService"
import { notificationKeys } from "./useNotifications"
import { useNotificationStreamStore } from "../store/streamStore"
import { readSseFrames } from "../utils/sseFrames"

/**
 * How long the stream may say nothing before it is treated as dead.
 *
 * <p>The server beats every 20s, so this is two missed beats plus room for a slow one. It exists
 * because a connection can stop delivering without closing: a proxy that buffers, a phone that
 * changed cell. The socket stays open, `readyState` stays fine, and nothing ever arrives again.
 */
const SILENCE_LIMIT_MS = 45_000

/** How often the watchdog looks at the clock. Short enough that the gap above is roughly honest. */
const WATCHDOG_TICK_MS = 5_000

/** Long enough not to hammer a server that is restarting, short enough to feel immediate. */
const RECONNECT_DELAY_MS = 3_000

/** Where the backoff stops. Past this the badge is on its 30-second poll and nobody is waiting. */
const MAX_RECONNECT_DELAY_MS = 60_000

/**
 * Holds the reader's notification stream open, and says whether it is actually working.
 *
 * <p>`fetch` rather than `EventSource`, for one reason that decides it: `EventSource` cannot send
 * an `Authorization` header, and the alternative is putting the token in the query string, where
 * it lands in access logs, browser history and any `Referer` the page leaks. The one thing
 * `EventSource` gives back — automatic reconnection — is reconnection this hook has to do by hand
 * anyway, because the failure it guards against is a stream that never closes.
 *
 * <p>What comes back is a nudge, never a message: the events carry ids, and the inbox query is
 * what actually fetches what the reader is entitled to read.
 *
 * <p>Mount it once per tab. Whether the stream is up goes into the store, which is where
 * `useUnreadCount` reads it from to decide whether it still has to poll.
 */
export function useNotificationStream(): void {
  const token = useAuthStore((s) => s.accessToken)
  const logout = useAuthStore((s) => s.logout)
  const queryClient = useQueryClient()
  const setConnected = useNotificationStreamStore((s) => s.setConnected)
  // A ref, not state: the watchdog reads it on a timer, and re-rendering on every heartbeat would
  // repaint the whole tree twenty times a minute to record that nothing happened.
  const lastEventAt = useRef(0)

  useEffect(() => {
    if (!token) {
      setConnected(false)
      return
    }

    // Everything below has to be undone on unmount, and the reconnect loop outlives any single
    // connection — so cancellation is shared rather than per-attempt.
    let stopped = false
    let controller: AbortController | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let failuresInARow = 0

    // `stopped` is what every exit sets, and the guard here is what makes it stick: the `finally`
    // below runs even after a `return` in the catch, so giving up has to be checked, not assumed.
    const scheduleReconnect = () => {
      if (stopped || reconnectTimer) return
      // Backs off while the server is unreachable. A fixed delay is a request every three seconds
      // from every open tab for as long as an outage lasts, which is the worst moment for it.
      const delay = Math.min(
        RECONNECT_DELAY_MS * 2 ** Math.min(failuresInARow, 5),
        MAX_RECONNECT_DELAY_MS
      )
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        void connect()
      }, delay)
    }

    const connect = async () => {
      if (stopped) return
      controller = new AbortController()
      lastEventAt.current = Date.now()

      try {
        const reader = await NotificationService.stream(
          token,
          controller.signal
        )

        failuresInARow = 0
        setConnected(true)
        const decoder = new TextDecoder()
        let buffer = ""

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          // `stream: true` so a multi-byte character split across two chunks is not mangled.
          buffer += decoder.decode(value, { stream: true })
          const { events, rest } = readSseFrames(buffer)
          buffer = rest

          for (const event of events) {
            // Any event at all is proof of life, heartbeat or not.
            lastEventAt.current = Date.now()
            if (event.event === "notification") {
              void queryClient.invalidateQueries({
                queryKey: notificationKeys.all,
              })
            }
          }
        }
      } catch (error) {
        // One failure is not like the others: a session that is over. Retrying it reopens the
        // same dead token every three seconds for as long as the tab stays open, and the axios
        // side of the app would have logged out on the first one.
        if (error instanceof StreamRefusedError && error.status === 401) {
          setConnected(false)
          stopped = true
          logout()
          window.location.href = "/auth/login"
          return
        }
        // A refusal the caller cannot fix by asking again — a role that may not reach the route,
        // a path that is gone — is not worth a request every three seconds either.
        if (
          error instanceof StreamRefusedError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          setConnected(false)
          stopped = true
          return
        }
        // Everything else is the same failure: there is no stream right now. Whether the server
        // is down, the network dropped it or the watchdog aborted it, the answer is to try again.
        failuresInARow += 1
      } finally {
        setConnected(false)
        scheduleReconnect()
      }
    }

    // The watchdog is what makes the silent failure recoverable: it aborts the fetch, which ends
    // the read loop above, which schedules the reconnect.
    const watchdog = setInterval(() => {
      if (Date.now() - lastEventAt.current > SILENCE_LIMIT_MS) {
        controller?.abort()
      }
    }, WATCHDOG_TICK_MS)

    void connect()

    return () => {
      stopped = true
      clearInterval(watchdog)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      controller?.abort()
      setConnected(false)
    }
  }, [token, queryClient, setConnected, logout])
}
