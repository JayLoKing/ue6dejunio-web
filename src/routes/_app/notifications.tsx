import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { CheckCheckIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { useUsers } from "@/features/users/hooks/useUsers"
import { ComposeNotification } from "@/features/notifications/components/ComposeNotification"
import { recipientsFrom } from "@/features/notifications/utils/recipients"
import {
  useDeleteNotification,
  useInbox,
  useMarkAllRead,
  useMarkNotificationRead,
  useSendNotification,
  useUnreadCount,
} from "@/features/notifications/hooks/useNotifications"
import { headingOf } from "@/features/notifications/utils/heading"
import type { NotificationItem } from "@/features/notifications/types"

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
})

function NotificationsPage() {
  const role = useAuthStore((s) => s.role)
  const isDirector = isRole(role, "DIRECTOR")

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const inbox = useInbox({ offset: page, limit })
  const { data: unread = 0 } = useUnreadCount()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllRead()
  const removeOne = useDeleteNotification()

  const items = inbox.data?.content ?? []

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            {isDirector
              ? "Lo que recibes, y los avisos que envías a docentes y secretaría."
              : "Los avisos que recibes de dirección y del sistema."}
          </p>
        </div>
        <Button
          variant="outline"
          disabled={unread === 0 || markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          <CheckCheckIcon className="size-4" />
          Marcar todas como leídas
        </Button>
      </div>

      {isDirector ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Enviar un aviso</h2>
          <DirectorCompose />
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Bandeja</h2>
        {inbox.isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
            No tienes notificaciones.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((n) => (
              <InboxRow
                key={n.id}
                notification={n}
                busy={markRead.isPending || removeOne.isPending}
                onOpen={() => {
                  if (!n.read) markRead.mutate(n.id)
                }}
                onRemove={() => removeOne.mutate(n.id)}
              />
            ))}
          </ul>
        )}
        <DataTablePagination
          page={inbox.data?.page != null ? inbox.data.page + 1 : page}
          pageSize={limit}
          total={inbox.data?.total ?? 0}
          totalPages={inbox.data?.totalPages ?? 1}
          isFetching={inbox.isFetching}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setLimit(size)
            setPage(1)
          }}
        />
      </section>
    </div>
  )
}

/** One page holds the staff of a school several times over. */
const WHOLE_STAFF = { offset: 1, limit: 200 }

/**
 * The form the Director writes from, together with the roster it needs to fill it.
 *
 * <p>A component of its own, and not a branch inside the page, because `useUsers` has no way
 * to be told to stay quiet: called from the page it would ask for the whole staff on behalf of
 * every teacher and the secretary too, and take a 403 from a Director-only endpoint for it. A hook
 * that is never mounted is a request that is never sent.
 */
function DirectorCompose() {
  const staff = useUsers(WHOLE_STAFF)
  const send = useSendNotification()

  const recipients = useMemo(
    () => recipientsFrom(staff.data?.content ?? []),
    [staff.data]
  )

  return (
    <ComposeNotification
      recipients={recipients}
      sending={send.isPending}
      onSend={(payload) => send.mutate(payload)}
    />
  )
}

interface InboxRowProps {
  notification: NotificationItem
  busy: boolean
  onOpen: () => void
  onRemove: () => void
}

function InboxRow({ notification, busy, onOpen, onRemove }: InboxRowProps) {
  return (
    <li
      className={cn(
        "flex items-start justify-between gap-3 rounded-md border p-3 text-sm",
        // Unread is the only state worth marking: everything else is history.
        !notification.read && "border-univalle/40 bg-univalle/5"
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
        onClick={onOpen}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{headingOf(notification)}</span>
          {!notification.read ? (
            <Badge className="bg-univalle text-univalle-foreground">
              Nueva
            </Badge>
          ) : null}
        </div>
        {/* Spans, not paragraphs: a button may only hold phrasing content, and a <p> inside one
            is the kind of markup a browser silently rearranges under you. */}
        <span className="block whitespace-pre-wrap text-muted-foreground">
          {notification.message}
        </span>
        <span className="block text-xs text-muted-foreground">
          {/* Who wrote it, or nobody: the system's own notices carry no sender. */}
          {notification.senderName ?? "Sistema"}
        </span>
      </button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={onRemove}
      >
        <Trash2Icon className="size-4" />
        Quitar
      </Button>
    </li>
  )
}
