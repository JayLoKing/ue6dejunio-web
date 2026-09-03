import { create } from "zustand"

export interface NotificationStreamState {
  /** Whether the live stream is currently delivering. False while it reconnects, and on logout. */
  connected: boolean
  setConnected: (connected: boolean) => void
}

/**
 * Whether the notification stream is up, shared across the app.
 *
 * <p>A store rather than a prop because the two places that care are not related in the tree: the
 * bell in the layout holds the connection, and the notifications page reads the same unread count
 * from its own screen. They share one react-query key, and react-query polls a key if *any*
 * observer asks it to — so a page that did not know about the stream would keep the 30-second poll
 * alive for the bell too, and the stream would save nothing.
 *
 * <p>Not persisted, deliberately: a connection cannot survive a reload, and reading "connected"
 * out of localStorage on boot would leave the badge trusting a stream that does not exist yet.
 */
export const useNotificationStreamStore = create<NotificationStreamState>()(
  (set) => ({
    connected: false,
    setConnected: (connected: boolean) => set({ connected }),
  })
)
