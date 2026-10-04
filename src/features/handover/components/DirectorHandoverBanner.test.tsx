import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { DirectorHandover } from "../models/response/handover-response"
import { useAuthStore } from "@/features/auth/store/authStore"

const query = vi.hoisted(() => ({
  current: { data: undefined, isError: false } as {
    data: DirectorHandover | null | undefined
    isError: boolean
  },
}))
const resend = vi.hoisted(() => vi.fn())
const cancel = vi.hoisted(() => vi.fn())
const enabledSeen = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useDirectorHandover", () => ({
  useDirectorHandover: (enabled: boolean) => {
    enabledSeen(enabled)
    return query.current
  },
}))
vi.mock("@/features/users/hooks/useResendCredentials", () => ({
  useResendCredentials: () => ({ mutate: resend, isPending: false }),
}))
vi.mock("../hooks/useCancelHandover", () => ({
  useCancelHandover: () => ({ mutate: cancel, isPending: false }),
}))

import { DirectorHandoverBanner } from "./DirectorHandoverBanner"

const handover = (over: Partial<DirectorHandover> = {}): DirectorHandover => ({
  id: "h-1",
  outgoing: { id: "dir-1", fullName: "Rosa Director", email: "rosa@ue6.bo" },
  incoming: {
    id: "inc-1",
    fullName: "Luis Nuevo",
    email: "luis@ue6.bo",
    mustChangePassword: true,
  },
  incomingCreated: true,
  startedAt: "2026-10-03T10:00:00",
  ...over,
})

const signInAs = (role: string, userId: string) =>
  useAuthStore.setState({ role, userId, accessToken: "t" })

beforeEach(() => {
  vi.clearAllMocks()
  query.current = { data: handover(), isError: false }
  signInAs("DIRECTOR", "dir-1")
})

describe("DirectorHandoverBanner", () => {
  it("avisa quién aún no ingresó", () => {
    render(<DirectorHandoverBanner />)

    expect(
      screen.getByText(
        /Cambio de Director pendiente: Luis Nuevo aún no ingresó/
      )
    ).toBeInTheDocument()
  })

  it("no muestra nada cuando no hay cambio pendiente (204)", () => {
    query.current = { data: null, isError: false }
    const { container } = render(<DirectorHandoverBanner />)

    expect(container).toBeEmptyDOMElement()
  })

  /** Un docente nunca ve ni pide el cambio: ni siquiera se consulta. */
  it("ni consulta ni muestra nada a quien no es Director", () => {
    signInAs("TEACHER", "t-1")
    query.current = { data: undefined, isError: false }
    const { container } = render(<DirectorHandoverBanner />)

    expect(container).toBeEmptyDOMElement()
    expect(enabledSeen).toHaveBeenLastCalledWith(false)
  })

  /** Un error de lectura no tumba la pantalla ni inventa un aviso. */
  it("no rompe ni muestra nada si la consulta falla", () => {
    query.current = { data: undefined, isError: true }
    const { container } = render(<DirectorHandoverBanner />)

    expect(container).toBeEmptyDOMElement()
  })

  it("reenvía las credenciales al reemplazante", async () => {
    render(<DirectorHandoverBanner />)

    await userEvent.click(
      screen.getByRole("button", { name: /reenviar credenciales/i })
    )

    expect(resend).toHaveBeenCalledWith("inc-1")
  })

  it("no deja reenviar cuando el reemplazante ya cambió su contraseña", () => {
    query.current = {
      data: handover({
        incoming: { ...handover().incoming, mustChangePassword: false },
      }),
      isError: false,
    }
    render(<DirectorHandoverBanner />)

    expect(
      screen.getByRole("button", { name: /reenviar credenciales/i })
    ).toBeDisabled()
  })

  it("el Director saliente puede cancelar, pero sólo tras confirmar", async () => {
    render(<DirectorHandoverBanner />)

    await userEvent.click(screen.getByRole("button", { name: /^cancelar/i }))
    expect(cancel).not.toHaveBeenCalled()

    const dialog = await screen.findByRole("alertdialog")
    await userEvent.click(
      within(dialog).getByRole("button", { name: /cancelar el cambio/i })
    )

    await waitFor(() => expect(cancel).toHaveBeenCalled())
  })

  /** La API contesta 403 a cualquier otro Director; el botón ni se ofrece. */
  it("otro Director no ve el botón Cancelar", () => {
    signInAs("DIRECTOR", "otro-dir")
    render(<DirectorHandoverBanner />)

    expect(
      screen.queryByRole("button", { name: /^cancelar/i })
    ).not.toBeInTheDocument()
  })
})
