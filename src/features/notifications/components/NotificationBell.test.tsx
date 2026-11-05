import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { NotificationItem } from "../types"

const navigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

const markRead = vi.fn()
const remove = vi.fn()
let inboxItems: NotificationItem[] = []
let inboxError = false
vi.mock("../hooks/useNotifications", () => ({
  useUnreadCount: () => ({ data: inboxItems.filter((n) => !n.read).length }),
  useInbox: () => ({
    data: { content: inboxItems },
    isLoading: false,
    isError: inboxError,
  }),
  useMarkNotificationRead: () => ({ mutate: markRead, isPending: false }),
  useMarkAllRead: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteNotification: () => ({ mutate: remove, isPending: false }),
}))
vi.mock("../hooks/useNotificationStream", () => ({
  useNotificationStream: () => undefined,
}))

import { useAuthStore } from "@/features/auth/store/authStore"
import { NotificationBell } from "./NotificationBell"

const notice = (over: Partial<NotificationItem>): NotificationItem => ({
  id: "n-1",
  senderId: null,
  senderName: null,
  receiverId: "u-1",
  receiverName: "Ana Pérez",
  type: "SUMMONS",
  subject: null,
  message: "Mensaje",
  resourceType: null,
  resourceId: null,
  deliveredAt: null,
  readAt: null,
  read: false,
  createdAt: "2026-11-05T10:00:00Z",
  ...over,
})

async function openBell() {
  render(<NotificationBell />)
  await userEvent.click(screen.getByRole("button", { name: /notificaciones/i }))
  return screen.getByTestId("notification-list")
}

describe("NotificationBell", () => {
  beforeEach(() => {
    navigate.mockReset()
    markRead.mockReset()
    remove.mockReset()
    inboxError = false
    useAuthStore.setState({ role: "TEACHER", isTechnical: false })
    inboxItems = [
      notice({
        id: "pdc",
        type: "PDC_APPROVED",
        message: "Tu PDC fue aprobado.",
      }),
      notice({
        id: "baja",
        type: "STUDENT_WITHDRAWN",
        message: "Luis fue dado de baja.",
      }),
      notice({
        id: "riesgo",
        type: "CUSTOM",
        subject: "Riesgo académico en Matemática",
        message: "Luis en riesgo.",
        resourceType: "class_group",
        resourceId: "cg-1",
      }),
      notice({ id: "cita", type: "SUMMONS", message: "Pase por dirección." }),
    ]
  })

  // Ten notices spilled below the card: the list has to hold its own height and scroll inside.
  it("bounds the list and scrolls inside it", async () => {
    const list = await openBell()
    expect(list).toHaveClass("max-h-80", "overflow-y-auto", "min-h-0")
  })

  it.each([
    ["Tu PDC fue aprobado.", "pdc", "/pdc"],
    ["Luis fue dado de baja.", "baja", "/students"],
    ["Luis en riesgo.", "riesgo", "/riesgo"],
    ["Pase por dirección.", "cita", "/notifications"],
  ])(
    "opening %s marks it read and goes to its screen",
    async (message, id, to) => {
      await openBell()
      await userEvent.click(screen.getByText(message))
      expect(markRead).toHaveBeenCalledWith(id)
      expect(navigate).toHaveBeenCalledWith({ to })
    }
  )

  it("does not mark an already read notice again", async () => {
    inboxItems = [notice({ id: "pdc", type: "PDC_APPROVED", read: true })]
    await openBell()
    await userEvent.click(screen.getByText("Mensaje"))
    expect(markRead).not.toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith({ to: "/pdc" })
  })

  it("dismisses without navigating", async () => {
    const list = await openBell()
    const row = within(list).getByText("Tu PDC fue aprobado.").closest("li")!
    await userEvent.click(
      within(row).getByRole("button", { name: /eliminar/i })
    )
    expect(remove).toHaveBeenCalledWith("pdc")
    expect(navigate).not.toHaveBeenCalled()
    expect(markRead).not.toHaveBeenCalled()
  })

  it("says the inbox failed rather than that it is empty", async () => {
    inboxItems = []
    inboxError = true
    await openBell()
    expect(screen.getByText(/no se pudieron cargar/i)).toBeInTheDocument()
    expect(screen.queryByText(/sin notificaciones/i)).not.toBeInTheDocument()
  })

  it("offers the whole inbox from the footer", async () => {
    await openBell()
    await userEvent.click(screen.getByRole("button", { name: /ver todas/i }))
    expect(navigate).toHaveBeenCalledWith({ to: "/notifications" })
  })
})
