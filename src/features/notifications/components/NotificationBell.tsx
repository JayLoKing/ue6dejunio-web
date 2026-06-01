import { useState } from "react"
import { BellIcon, CheckCheckIcon, Loader2Icon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  useDeleteNotification,
  useInbox,
  useMarkAllRead,
  useMarkNotificationRead,
  useUnreadCount,
} from "../hooks/useNotifications"

const formatWhen = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleString("es-BO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: unread = 0 } = useUnreadCount()
  const inbox = useInbox({ offset: 1, limit: 20 }, open)
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllRead()
  const removeOne = useDeleteNotification()

  const items = inbox.data?.content ?? []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <BellIcon className="size-5" />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notificaciones</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            disabled={unread === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheckIcon className="size-3.5" />
            Marcar todas
          </Button>
        </div>

        <ScrollArea className="max-h-96">
          {inbox.isLoading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Cargando…
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Sin notificaciones.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "cursor-pointer px-3 py-2.5 text-sm transition-colors hover:bg-muted/50",
                    !n.read && "bg-univalle/5",
                  )}
                  onClick={() => {
                    if (!n.read) markRead.mutate(n.id)
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{n.senderName}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {!n.read ? (
                        <span className="size-2 rounded-full bg-univalle" />
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        title="Eliminar"
                        disabled={removeOne.isPending}
                        onClick={(e) => {
                          e.stopPropagation()
                          removeOne.mutate(n.id)
                        }}
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{n.message}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {formatWhen(n.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
