import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { BellIcon, CheckCheckIcon, Loader2Icon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { headingOf } from "../utils/heading"
import { targetOf } from "../utils/target"
import type { NotificationItem } from "../types"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAuthStore } from "@/features/auth/store/authStore"

import {
  useDeleteNotification,
  useInbox,
  useMarkAllRead,
  useMarkNotificationRead,
  useUnreadCount,
} from "../hooks/useNotifications"
import { useNotificationStream } from "../hooks/useNotificationStream"

/** As much as fits in a popover before it stops being a peek and becomes the page. */
const LATEST = { offset: 1, limit: 20 }

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
  // The bell is on every page of the app, so this is the one place the stream is held open — one
  // connection per tab. Opening it from each screen that shows a count would spend several of the
  // six connections a browser allows per origin on the same nudge.
  useNotificationStream()
  const { data: unread = 0 } = useUnreadCount()
  const inbox = useInbox(LATEST, open)
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllRead()
  const removeOne = useDeleteNotification()
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.role)
  const isTechnical = useAuthStore((s) => s.isTechnical)

  const items = inbox.data?.content ?? []

  // Opening a notice is reading it: mark it, close the peek, and go to what it is about.
  const openNotice = (n: NotificationItem) => {
    if (!n.read) markRead.mutate(n.id)
    setOpen(false)
    void navigate({ to: targetOf(n, { role, isTechnical }) })
  }

  const seeAll = () => {
    setOpen(false)
    void navigate({ to: "/notifications" })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <BellIcon className="size-5" />
          {unread > 0 ? (
            // En primario y no en `destructive`. Rojo quiere decir que algo salió mal; tener
            // avisos sin leer no es un error, es una novedad. Con el contador en rojo la campana
            // pedía auxilio todo el día y el rojo dejaba de significar algo cuando hacía falta.
            //
            // El `key` es el que hace la animación: al cambiar el número React reemplaza el nodo,
            // y la animación de una sola pasada vuelve a correr. Sin él habría que elegir entre
            // no animar nunca o animar en bucle, y un punto que late sin parar en la esquina de
            // la pantalla es algo que la gente aprende a tapar con el dedo.
            <span
              key={unread}
              className="animate-notify-pop absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
          <span className="sr-only">
            Notificaciones
            {unread > 0 ? `: ${unread} sin leer` : ""}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        // Never taller than the room under the bell: the list below is the part that gives way.
        className="max-h-(--radix-popover-content-available-height) w-80 gap-0 p-0"
      >
        <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
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

        {/* A plain overflow box and not ScrollArea: its viewport is `h-full`, which resolves to
            auto under a max-height, so the list grew past the card instead of scrolling. About
            three notices fit; the rest scroll here while the header and footer stay put. */}
        <div
          data-testid="notification-list"
          className="max-h-80 min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {inbox.isLoading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Cargando…
            </div>
          ) : inbox.isError ? (
            // Not "Sin notificaciones": a fetch that failed must not read as an empty inbox.
            <div className="p-6 text-center text-sm text-muted-foreground">
              No se pudieron cargar las notificaciones.
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
                    // La barra izquierda es el mismo lenguaje que los avisos emergentes: tres
                    // píxeles de color dicen "esto es de este tipo" sin teñir el fondo bajo el
                    // texto. El `bg-brand/5` que había era tan tenue que no se distinguía de una
                    // fila leída, y subirlo habría ensuciado la lectura del mensaje.
                    "relative flex items-start justify-between gap-2 px-3 py-3 text-sm transition-colors hover:bg-muted/50",
                    !n.read &&
                      "bg-primary/[0.04] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary"
                  )}
                >
                  {/* A button, not a clickable row: opening a notice is an action, and someone
                      moving by keyboard has to be able to reach it too. */}
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 cursor-pointer flex-col items-start text-left"
                    onClick={() => openNotice(n)}
                  >
                    {/* What it is about, not who sent it: the system's own notices have no
                        sender, and "Sistema" three times over says nothing. */}
                    <span className="w-full truncate font-medium">
                      {headingOf(n)}
                    </span>
                    {/* A dos líneas. Un aviso largo empujaba los siguientes fuera del popover y
                        la campana dejaba de ser un vistazo para volverse la página entera. */}
                    <span className="mt-0.5 line-clamp-2 text-muted-foreground">
                      {n.message}
                    </span>
                    <span className="mt-1.5 text-[11px] text-muted-foreground/80">
                      {n.senderName ?? "Sistema"} · {formatWhen(n.createdAt)}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {!n.read ? (
                      <span
                        aria-label="Sin leer"
                        className="size-2 rounded-full bg-primary"
                        role="img"
                      />
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-destructive"
                      title="Eliminar"
                      disabled={removeOne.isPending}
                      onClick={() => removeOne.mutate(n.id)}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full text-xs"
            onClick={seeAll}
          >
            Ver todas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
